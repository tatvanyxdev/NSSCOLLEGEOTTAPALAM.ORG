import { supabase } from '../lib/supabase';
import {
  Circular,
  StudentLeaveRequest,
  StudentCertificateRequest,
  AcademicCalendarEvent,
  AcademicResource,
  EmergencyAlert,
  TimetableChangeAlert
} from '../types';

export const personalizedModulesService = {
  // ==========================================
  // CIRCULARS
  // ==========================================
  async getCirculars(): Promise<{ data: Circular[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('circulars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return { data: null, error: null };

      const mapped: Circular[] = data.map((item: any) => ({
        id: item.id,
        referenceNumber: item.reference_number || item.referenceNumber || 'NSS/CIR/2026/001',
        title: item.title,
        description: item.description,
        issuingAuthority: item.issuing_authority || item.issuingAuthority || 'Office of Principal',
        scope: item.scope || 'COLLEGE',
        targetDepartmentId: item.target_department_id || item.targetDepartmentId,
        targetProgrammeId: item.target_programme_id || item.targetProgrammeId,
        targetBatchId: item.target_batch_id || item.targetBatchId,
        targetSemester: item.target_semester || item.targetSemester,
        targetRoles: item.target_roles || item.targetRoles || ['STUDENT', 'TEACHER', 'HOD'],
        priority: item.priority || 'NORMAL',
        effectiveFrom: item.effective_from || item.effectiveFrom || item.created_at?.split('T')[0],
        effectiveUntil: item.effective_until || item.effectiveUntil,
        attachmentName: item.attachment_name || item.attachmentName,
        attachmentUrl: item.attachment_url || item.attachmentUrl,
        requiresAcknowledgement: !!item.requires_acknowledgement || !!item.requiresAcknowledgement,
        acknowledgedStudentIds: item.acknowledged_student_ids || item.acknowledgedStudentIds || [],
        status: item.status || 'PUBLISHED',
        createdAt: item.created_at || item.createdAt || new Date().toISOString()
      }));

      return { data: mapped, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async acknowledgeCircular(
    circularId: string,
    studentId: string,
    currentAcknowledgedIds: string[]
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const updated = Array.from(new Set([...currentAcknowledgedIds, studentId]));
      const { error } = await supabase
        .from('circulars')
        .update({ acknowledged_student_ids: updated })
        .eq('id', circularId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err };
    }
  },

  // ==========================================
  // LEAVE / OD REQUESTS
  // ==========================================
  async getLeaveRequests(studentId?: string): Promise<{ data: StudentLeaveRequest[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('student_leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data) return { data: null, error: null };

      const mapped: StudentLeaveRequest[] = data.map((item: any) => ({
        id: item.id,
        studentId: item.student_id || item.studentId,
        type: item.type || 'OD',
        fromDate: item.from_date || item.fromDate,
        toDate: item.to_date || item.toDate,
        isFullDay: item.is_full_day !== undefined ? item.is_full_day : true,
        affectedPeriodIds: item.affected_period_ids || item.affectedPeriodIds || [],
        reason: item.reason,
        documentName: item.document_name || item.documentName,
        documentUrl: item.document_url || item.documentUrl,
        status: item.status || 'SUBMITTED',
        reviewedByFacultyId: item.reviewed_by_faculty_id || item.reviewedByFacultyId,
        reviewedByName: item.reviewed_by_name || item.reviewedByName,
        reviewRemarks: item.review_remarks || item.reviewRemarks,
        reviewedAt: item.reviewed_at || item.reviewedAt,
        appliedToAttendance: !!item.applied_to_attendance || !!item.appliedToAttendance,
        createdAt: item.created_at || item.createdAt || new Date().toISOString()
      }));

      return { data: mapped, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async createLeaveRequest(
    request: Omit<StudentLeaveRequest, 'id' | 'createdAt' | 'status'>
  ): Promise<{ data: StudentLeaveRequest | null; error: Error | null }> {
    try {
      const payload = {
        student_id: request.studentId,
        type: request.type,
        from_date: request.fromDate,
        to_date: request.toDate,
        is_full_day: request.isFullDay,
        affected_period_ids: request.affectedPeriodIds || [],
        reason: request.reason,
        document_name: request.documentName || null,
        document_url: request.documentUrl || null,
        status: 'SUBMITTED'
      };

      const { data, error } = await supabase
        .from('student_leave_requests')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return {
        data: {
          id: data.id,
          studentId: data.student_id,
          type: data.type,
          fromDate: data.from_date,
          toDate: data.to_date,
          isFullDay: data.is_full_day,
          affectedPeriodIds: data.affected_period_ids,
          reason: data.reason,
          documentName: data.document_name,
          documentUrl: data.document_url,
          status: data.status,
          createdAt: data.created_at
        },
        error: null
      };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async reviewLeaveRequest(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    facultyId: string,
    facultyName: string,
    remarks?: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('student_leave_requests')
        .update({
          status,
          reviewed_by_faculty_id: facultyId,
          reviewed_by_name: facultyName,
          review_remarks: remarks || '',
          reviewed_at: new Date().toISOString(),
          applied_to_attendance: status === 'APPROVED'
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err };
    }
  },

  // ==========================================
  // CERTIFICATE REQUESTS
  // ==========================================
  async getCertificateRequests(studentId?: string): Promise<{ data: StudentCertificateRequest[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('student_certificate_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data) return { data: null, error: null };

      const mapped: StudentCertificateRequest[] = data.map((item: any) => ({
        id: item.id,
        studentId: item.student_id || item.studentId,
        certificateType: item.certificate_type || item.certificateType || 'BONAFIDE',
        purpose: item.purpose,
        numberOfCopies: item.number_of_copies || item.numberOfCopies || 1,
        status: item.status || 'SUBMITTED',
        processingRemarks: item.processing_remarks || item.processingRemarks,
        readyDate: item.ready_date || item.readyDate,
        collectedDate: item.collected_date || item.collectedDate,
        handledByStaffId: item.handled_by_staff_id || item.handledByStaffId,
        handledByName: item.handled_by_name || item.handledByName,
        createdAt: item.created_at || item.createdAt || new Date().toISOString()
      }));

      return { data: mapped, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async createCertificateRequest(
    request: Omit<StudentCertificateRequest, 'id' | 'createdAt' | 'status'>
  ): Promise<{ data: StudentCertificateRequest | null; error: Error | null }> {
    try {
      const payload = {
        student_id: request.studentId,
        certificate_type: request.certificateType,
        purpose: request.purpose,
        number_of_copies: request.numberOfCopies || 1,
        status: 'SUBMITTED'
      };

      const { data, error } = await supabase
        .from('student_certificate_requests')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return {
        data: {
          id: data.id,
          studentId: data.student_id,
          certificateType: data.certificate_type,
          purpose: data.purpose,
          numberOfCopies: data.number_of_copies,
          status: data.status,
          createdAt: data.created_at
        },
        error: null
      };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  // ==========================================
  // ACADEMIC EVENTS
  // ==========================================
  async getAcademicEvents(): Promise<{ data: AcademicCalendarEvent[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('academic_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      if (!data) return { data: null, error: null };

      const mapped: AcademicCalendarEvent[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        eventType: item.event_type || item.eventType || 'COLLEGE_EVENT',
        startDate: item.start_date || item.startDate,
        endDate: item.end_date || item.endDate,
        startTime: item.start_time || item.startTime,
        endTime: item.end_time || item.endTime,
        venue: item.venue,
        scope: item.scope || 'COLLEGE',
        departmentId: item.department_id || item.departmentId,
        programmeId: item.programme_id || item.programmeId,
        semester: item.semester,
        targetRoles: item.target_roles || item.targetRoles,
        isHoliday: !!item.is_holiday || !!item.isHoliday,
        color: item.color || '#2563eb',
        createdAt: item.created_at || item.createdAt || new Date().toISOString()
      }));

      return { data: mapped, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  // ==========================================
  // ACADEMIC RESOURCES
  // ==========================================
  async getAcademicResources(): Promise<{ data: AcademicResource[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('academic_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return { data: null, error: null };

      const mapped: AcademicResource[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        description: item.description,
        departmentId: item.department_id || item.departmentId,
        programmeId: item.programme_id || item.programmeId,
        semester: item.semester,
        courseId: item.course_id || item.courseId,
        courseCode: item.course_code || item.courseCode,
        fileUrl: item.file_url || item.fileUrl || '#',
        fileName: item.file_name || item.fileName,
        fileSize: item.file_size || item.fileSize || '1.0 MB',
        fileType: item.file_type || item.fileType || 'PDF',
        uploadedBy: item.uploaded_by || item.uploadedBy || 'Administration',
        uploadedByName: item.uploaded_by_name || item.uploadedByName || 'College Office',
        uploadedAt: item.uploaded_at || item.created_at?.split('T')[0] || '2026-06-01',
        downloadCount: item.download_count || item.downloadCount || 0
      }));

      return { data: mapped, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  // ==========================================
  // EMERGENCY ALERTS
  // ==========================================
  async getEmergencyAlerts(): Promise<{ data: EmergencyAlert[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return { data: null, error: null };

      const mapped: EmergencyAlert[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type || 'IMPORTANT_ACADEMIC',
        priority: item.priority || 'HIGH',
        scope: item.scope || 'COLLEGE',
        departmentId: item.department_id || item.departmentId,
        startTime: item.start_time || item.startTime,
        expiryTime: item.expiry_time || item.expiryTime,
        isActive: !!item.is_active,
        createdBy: item.created_by || item.createdBy,
        createdByName: item.created_by_name || item.createdByName || 'Office of Principal',
        createdAt: item.created_at || item.createdAt
      }));

      return { data: mapped, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
};
