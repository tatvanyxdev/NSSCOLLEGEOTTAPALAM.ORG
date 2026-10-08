import { supabase } from '../lib/supabase';
import { AttendanceRecord, ClassSession, AttendanceCorrectionRequest, AttendanceStatus } from '../types';
import {
  mapClassSessionFromDb,
  mapAttendanceRecordFromDb,
  mapCorrectionRequestFromDb
} from '../lib/dataMappers';
import { toValidUuid } from '../lib/uuidMapping';
import { safeOfferingId, safeGroupId, safeFacultyId, safePeriodId, safeStudentId } from '../lib/foreignKeyHelper';
import { resilientInsert, resilientUpdate, resilientUpsert } from '../lib/resilientMutation';
import { securityShieldService } from './securityShieldService';

export const attendanceService = {
  async getSessions(date?: string): Promise<{ data: ClassSession[] | null; error: Error | null }> {
    try {
      let query = supabase.from('class_sessions').select('*');
      if (date) query = query.eq('date', date);
      const { data, error } = await query;
      if (error) throw error;
      return { data: (data || []).map(mapClassSessionFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase attendanceService.getSessions fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async getAttendanceRecords(sessionId?: string): Promise<{ data: AttendanceRecord[] | null; error: Error | null }> {
    try {
      let query = supabase.from('attendance_records').select('*');
      if (sessionId) {
        const validSessionId = toValidUuid(sessionId) || sessionId;
        query = query.eq('class_session_id', validSessionId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { data: (data || []).map(mapAttendanceRecordFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase attendanceService.getAttendanceRecords fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async getRecords(sessionId?: string): Promise<{ data: AttendanceRecord[] | null; error: Error | null }> {
    return this.getAttendanceRecords(sessionId);
  },

  async createRecords(records: Partial<AttendanceRecord>[]): Promise<{ success: boolean; error: Error | null }> {
    try {
      const mappedRecords = [];
      for (const r of records) {
        const verifiedStudentId = await safeStudentId(r.studentId);
        if (verifiedStudentId && r.classSessionId) {
          mappedRecords.push({
            class_session_id: toValidUuid(r.classSessionId) || r.classSessionId,
            student_id: verifiedStudentId,
            status: r.status,
            marked_by_faculty_id: await safeFacultyId(r.markedByFacultyId),
            marked_timestamp: r.markedTimestamp || new Date().toISOString(),
            remarks: r.remarks || null
          });
        }
      }

      if (mappedRecords.length === 0) {
        return { success: true, error: null };
      }

      const { error: recordsError } = await supabase
        .from('attendance_records')
        .upsert(mappedRecords, { onConflict: 'class_session_id,student_id' });

      if (recordsError) throw recordsError;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase attendanceService.createRecords fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async submitSessionAttendance(
    sessionId: string,
    records: { studentId: string; status: AttendanceStatus; remarks?: string }[],
    facultyId: string,
    topicCovered?: string,
    actorName?: string,
    actorRole?: string
  ): Promise<{ success: boolean; error: Error | null; submittedTimestamp?: string }> {
    try {
      // Security Layer: Verify payload and rate limits before touching database
      const securityCheck = await securityShieldService.verifyAttendancePayload(
        sessionId,
        records,
        facultyId,
        topicCovered,
        actorRole
      );

      if (!securityCheck.isValid) {
        return {
          success: false,
          error: new Error(`Anti-Hack Shield Blocked Request: ${securityCheck.reason}`)
        };
      }

      const validSessionId = toValidUuid(sessionId) || sessionId;
      const validFacultyId = await safeFacultyId(facultyId);

      // 1. First attempt atomic PostgreSQL RPC function
      const resolvedRpcRecords = [];
      for (const r of records) {
        const sid = (await safeStudentId(r.studentId)) || toValidUuid(r.studentId) || r.studentId;
        if (sid) {
          resolvedRpcRecords.push({
            student_id: sid,
            status: r.status,
            remarks: r.remarks || null
          });
        }
      }

      const rpcPayload = {
        p_session_id: validSessionId,
        p_topic_covered: topicCovered || '',
        p_records: resolvedRpcRecords,
        p_marked_by_faculty_id: validFacultyId,
        p_actor_name: actorName || 'Faculty',
        p_actor_role: actorRole || 'TEACHER'
      };

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'submit_session_attendance_atomic',
        rpcPayload
      );

      if (!rpcError && rpcData && (rpcData as any).success) {
        return {
          success: true,
          error: null,
          submittedTimestamp: (rpcData as any).submitted_at || new Date().toISOString()
        };
      }

      // Fall back to 2-step write
      const serverTimestamp = new Date().toISOString();
      const mappedRecords = [];
      for (const r of records) {
        const verifiedStuId = await safeStudentId(r.studentId);
        if (verifiedStuId) {
          mappedRecords.push({
            class_session_id: validSessionId,
            student_id: verifiedStuId,
            status: r.status,
            marked_by_faculty_id: validFacultyId,
            marked_timestamp: serverTimestamp,
            remarks: r.remarks || null
          });
        }
      }

      if (mappedRecords.length > 0) {
        const { error: recordsError } = await resilientUpsert(
          'attendance_records',
          mappedRecords,
          { onConflict: 'class_session_id,student_id' }
        );

        if (recordsError) throw recordsError;
      }

      const { error: sessionError } = await resilientUpdate(
        'class_sessions',
        validSessionId,
        {
          attendance_submitted: true,
          submitted_timestamp: serverTimestamp,
          topic_covered: topicCovered || undefined,
          status: 'CONDUCTED'
        }
      );

      if (sessionError) throw sessionError;

      return { success: true, error: null, submittedTimestamp: serverTimestamp };
    } catch (err: any) {
      console.warn('Supabase attendanceService.submitSessionAttendance failed:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async getCorrections(): Promise<{ data: AttendanceCorrectionRequest[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('attendance_correction_requests')
        .select('*')
        .order('requested_date', { ascending: false });
      if (error) throw error;
      return { data: (data || []).map(mapCorrectionRequestFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase attendanceService.getCorrections fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createSession(session: Partial<ClassSession>): Promise<{ data: ClassSession | null; error: Error | null }> {
    try {
      const verifiedOfferingId = await safeOfferingId(session.courseOfferingId);
      const verifiedGroupId = await safeGroupId(session.courseGroupId);
      const verifiedFacultyId = await safeFacultyId(session.facultyId);
      const verifiedPeriodId = await safePeriodId(session.periodId);

      if (!verifiedOfferingId) {
        console.warn('Skipping remote session insert: course offering not in database yet.');
        return { data: null, error: null };
      }

      const payload: any = {
        course_offering_id: verifiedOfferingId,
        course_group_id: verifiedGroupId,
        faculty_id: verifiedFacultyId,
        substitute_faculty_id: await safeFacultyId(session.substituteFacultyId),
        date: session.date || new Date().toISOString().split('T')[0],
        period_id: verifiedPeriodId,
        start_time: session.startTime,
        end_time: session.endTime,
        topic_covered: session.topicCovered || null,
        session_type: session.sessionType || 'REGULAR',
        status: session.status || 'SCHEDULED',
        attendance_submitted: !!session.attendanceSubmitted
      };
      const { data, error } = await resilientInsert('class_sessions', payload, true);
      if (error) throw error;
      return { data: data ? mapClassSessionFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase attendanceService.createSession fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async submitCorrection(correction: Partial<AttendanceCorrectionRequest>): Promise<{ data: AttendanceCorrectionRequest | null; error: Error | null }> {
    try {
      const verifiedStudentId = await safeStudentId(correction.studentId);
      const verifiedFacultyId = await safeFacultyId(correction.requestedByFacultyId);

      const payload = {
        class_session_id: toValidUuid(correction.classSessionId) || correction.classSessionId,
        student_id: verifiedStudentId,
        requested_by_faculty_id: verifiedFacultyId,
        old_status: correction.oldStatus,
        requested_status: correction.requestedStatus,
        reason: correction.reason,
        status: 'PENDING'
      };
      const { data, error } = await resilientInsert('attendance_correction_requests', payload, true);
      if (error) throw error;
      return { data: data ? mapCorrectionRequestFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase attendanceService.submitCorrection fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async reviewCorrection(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewedByFacultyId: string,
    reviewRemarks?: string,
    actorName?: string,
    actorRole?: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const validReviewerId = await safeFacultyId(reviewedByFacultyId);

      // 1. First attempt atomic RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('review_attendance_correction_atomic', {
        p_request_id: validId,
        p_status: status,
        p_reviewed_by_faculty_id: validReviewerId,
        p_remarks: reviewRemarks || null,
        p_actor_name: actorName || 'Reviewer',
        p_actor_role: actorRole || 'HOD'
      });

      if (!rpcError && rpcData && (rpcData as any).success) {
        return { success: true, error: null };
      }

      // 2. Fallback update
      const payload = {
        status,
        reviewed_by_faculty_id: validReviewerId,
        review_date: new Date().toISOString(),
        review_remarks: reviewRemarks || null
      };
      const { error } = await resilientUpdate('attendance_correction_requests', validId, payload);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase attendanceService.reviewCorrection fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async getSubstitutes(): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from('substitute_assignments').select('*');
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.warn('Supabase attendanceService.getSubstitutes fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async assignSubstitute(sub: {
    classSessionId?: string;
    timetableEntryId?: string;
    date?: string;
    originalFacultyId: string;
    substituteFacultyId: string;
    assignedByFacultyId: string;
    reason?: string;
  }): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validSessionId = sub.classSessionId ? (toValidUuid(sub.classSessionId) || sub.classSessionId) : null;
      const validEntryId = sub.timetableEntryId ? (toValidUuid(sub.timetableEntryId) || sub.timetableEntryId) : null;
      const validOrigId = await safeFacultyId(sub.originalFacultyId);
      const validSubId = await safeFacultyId(sub.substituteFacultyId);
      const validAssignerId = await safeFacultyId(sub.assignedByFacultyId);

      const payload: Record<string, any> = {
        class_session_id: validSessionId,
        timetable_entry_id: validEntryId,
        date: sub.date || null,
        original_faculty_id: validOrigId,
        substitute_faculty_id: validSubId,
        assigned_by_faculty_id: validAssignerId,
        reason: sub.reason || null
      };
      const { error } = await resilientInsert('substitute_assignments', payload, false);
      if (error) throw error;

      // If class session exists, update class_sessions.substitute_faculty_id
      if (validSessionId) {
        await resilientUpdate('class_sessions', validSessionId, { substitute_faculty_id: validSubId });
      } else if (validEntryId && sub.date) {
        // Update any existing session for this timetable entry and date
        await supabase
          .from('class_sessions')
          .update({ substitute_faculty_id: validSubId })
          .match({ timetable_entry_id: validEntryId, date: sub.date });
      }
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase attendanceService.assignSubstitute fallback:', err?.message || err);
      return { success: false, error: err };
    }
  }
};
