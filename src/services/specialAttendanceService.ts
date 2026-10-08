import { supabase } from '../lib/supabase';
import { SpecialAttendanceEvent, SpecialAttendanceRecord, SpecialAttendanceStatus } from '../types';
import {
  mapSpecialAttendanceEventFromDb,
  mapSpecialAttendanceRecordFromDb
} from '../lib/dataMappers';
import { toValidUuid } from '../lib/uuidMapping';
import { safeDepartmentId, safeProgrammeId, safeFacultyId, safeStudentId, safePeriodId } from '../lib/foreignKeyHelper';
import { resilientInsert, resilientUpdate } from '../lib/resilientMutation';

export const specialAttendanceService = {
  async getEvents(): Promise<{ data: SpecialAttendanceEvent[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('special_attendance_events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      return { data: (data || []).map(mapSpecialAttendanceEventFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase specialAttendanceService.getEvents fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async getRecords(eventId?: string): Promise<{ data: SpecialAttendanceRecord[] | null; error: Error | null }> {
    try {
      let query = supabase.from('special_attendance_records').select('*');
      if (eventId) {
        const validEventId = toValidUuid(eventId) || eventId;
        query = query.eq('event_id', validEventId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { data: (data || []).map(mapSpecialAttendanceRecordFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase specialAttendanceService.getRecords fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createEventWithRecords(
    event: Omit<SpecialAttendanceEvent, 'id' | 'createdAt' | 'updatedAt'>,
    records: Omit<SpecialAttendanceRecord, 'id' | 'createdAt'>[]
  ): Promise<{ data: { event: SpecialAttendanceEvent; records: SpecialAttendanceRecord[] } | null; error: Error | null }> {
    try {
      const serverTimestamp = new Date().toISOString();
      const verifiedDeptId = event.departmentId ? await safeDepartmentId(event.departmentId) : null;
      const verifiedProgId = event.programmeId ? await safeProgrammeId(event.programmeId) : null;
      const verifiedCreatedBy = event.createdBy ? await safeFacultyId(event.createdBy) : null;

      // 1. Insert Event
      const eventPayload = {
        title: event.title,
        description: event.description || '',
        event_type: event.eventType,
        event_date: event.eventDate,
        period_ids: event.periodIds,
        is_full_day: event.isFullDay,
        start_time: event.startTime || null,
        end_time: event.endTime || null,
        scope_type: event.scopeType,
        department_id: verifiedDeptId,
        programme_id: verifiedProgId,
        batch_id: event.batchId ? toValidUuid(event.batchId) || null : null,
        semester_id: event.semesterId ? toValidUuid(event.semesterId) || null : null,
        course_group_id: event.courseGroupId ? toValidUuid(event.courseGroupId) || null : null,
        student_coverage: event.studentCoverage,
        selected_student_ids: event.selectedStudentIds || [],
        reason: event.reason,
        status: event.status || 'APPLIED',
        created_by: verifiedCreatedBy,
        created_by_name: event.createdByName || 'Authorized Officer',
        created_by_role: event.createdByRole || 'HOD',
        approved_by: event.approvedBy ? await safeFacultyId(event.approvedBy) : null,
        approved_by_name: event.approvedByName || null,
        created_at: serverTimestamp,
        updated_at: serverTimestamp
      };

      const { data: eventData, error: eventError } = await resilientInsert(
        'special_attendance_events',
        eventPayload,
        true
      );

      if (eventError) throw eventError;
      const mappedEvent = mapSpecialAttendanceEventFromDb(eventData);

      // 2. Insert Records
      const mappedRecords: SpecialAttendanceRecord[] = [];
      const recordsToInsert = [];

      for (const r of records) {
        const verifiedStudentId = (await safeStudentId(r.studentId)) || toValidUuid(r.studentId) || r.studentId;
        const verifiedPeriodId = (await safePeriodId(r.periodId)) || toValidUuid(r.periodId) || r.periodId;

        if (verifiedStudentId && verifiedPeriodId) {
          recordsToInsert.push({
            event_id: mappedEvent.id,
            student_id: verifiedStudentId,
            date: r.date,
            period_id: verifiedPeriodId,
            attendance_status: r.attendanceStatus || 'SPECIAL',
            attendance_source: 'SPECIAL',
            normal_session_conflict_status: r.normalSessionConflictStatus || 'NO_SESSION',
            remarks: r.remarks || null,
            created_at: serverTimestamp
          });
        }
      }

      if (recordsToInsert.length > 0) {
        const { data: recordsData, error: recordsError } = await resilientInsert(
          'special_attendance_records',
          recordsToInsert[0],
          false
        );

        if (recordsError) {
          console.warn('Failed to insert some special attendance records into Supabase:', recordsError);
        } else {
          for (let i = 1; i < recordsToInsert.length; i++) {
            await resilientInsert('special_attendance_records', recordsToInsert[i], false);
          }
        }
      }

      return {
        data: {
          event: mappedEvent,
          records: mappedRecords.length > 0 ? mappedRecords : records.map((r, idx) => ({
            ...r,
            id: `spec-rec-${mappedEvent.id}-${idx}`,
            eventId: mappedEvent.id,
            createdAt: serverTimestamp
          }))
        },
        error: null
      };
    } catch (err: any) {
      console.warn('Supabase specialAttendanceService.createEventWithRecords fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async updateEventStatus(
    id: string,
    status: SpecialAttendanceStatus,
    approvedBy?: string,
    approvedByName?: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const verifiedApprovedBy = approvedBy ? await safeFacultyId(approvedBy) : null;
      const { error } = await resilientUpdate(
        'special_attendance_events',
        validId,
        {
          status,
          approved_by: verifiedApprovedBy,
          approved_by_name: approvedByName || null,
          updated_at: new Date().toISOString()
        }
      );

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase specialAttendanceService.updateEventStatus fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async deleteEvent(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const { error } = await supabase
        .from('special_attendance_events')
        .delete()
        .eq('id', validId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase specialAttendanceService.deleteEvent fallback:', err?.message || err);
      return { success: false, error: err };
    }
  }
};
