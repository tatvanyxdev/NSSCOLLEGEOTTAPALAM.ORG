import { supabase } from '../lib/supabase';
import {
  FacultySubjectRequest,
  FacultyAssignmentHistory,
  FacultySubjectAudit,
  CourseType,
  SubjectRequestStatus,
  Course,
  CourseOffering,
  CourseGroup,
  FacultyCourseAssignment
} from '../types';
import {
  mapSubjectRequestFromDb,
  mapAssignmentHistoryFromDb,
  mapSubjectAuditFromDb,
  mapCourseFromDb,
  mapCourseOfferingFromDb,
  mapCourseGroupFromDb,
  mapFacultyAssignmentFromDb
} from '../lib/dataMappers';
import { toValidUuid } from '../lib/uuidMapping';
import {
  safeDepartmentId,
  safeFacultyId,
  safeOfferingId,
  safeGroupId,
  safeCourseId
} from '../lib/foreignKeyHelper';
import { resilientInsert, resilientUpdate } from '../lib/resilientMutation';

export const facultySubjectService = {
  /**
   * Fetch all subject requests with optional filtering
   */
  async getSubjectRequests(filter?: {
    requestedBy?: string;
    departmentId?: string;
    status?: SubjectRequestStatus;
  }): Promise<{ data: FacultySubjectRequest[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('faculty_subject_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.requestedBy) {
        query = query.or(`requested_by.eq.${filter.requestedBy},requested_by_faculty_id.eq.${filter.requestedBy}`);
      }
      if (filter?.departmentId) {
        query = query.eq('department_id', filter.departmentId);
      }
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: (data || []).map(mapSubjectRequestFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase facultySubjectService.getSubjectRequests fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  /**
   * Submit a new subject request by a teacher
   */
  async submitSubjectRequest(
    req: Omit<FacultySubjectRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<{ data: FacultySubjectRequest | null; error: Error | null }> {
    try {
      const verifiedDeptId = (await safeDepartmentId(req.departmentId)) || req.departmentId;
      const verifiedFacultyId = (await safeFacultyId(req.requestedByFacultyId || req.requestedBy)) || req.requestedBy;

      const payload: any = {
        requested_by: toValidUuid(req.requestedBy) || toValidUuid(verifiedFacultyId) || req.requestedBy,
        department_id: toValidUuid(verifiedDeptId) || verifiedDeptId,
        course_name: req.courseName.trim(),
        proposed_course_code: req.proposedCourseCode?.trim() || null,
        course_type: req.courseType || 'MAJOR',
        programme_id: req.programmeId ? toValidUuid(req.programmeId) || req.programmeId : null,
        semester_number: req.semesterNumber || 1,
        academic_year: req.academicYear || '2026-27',
        existing_course_id: req.existingCourseId ? toValidUuid(req.existingCourseId) || req.existingCourseId : null,
        existing_course_group_id: req.existingCourseGroupId ? toValidUuid(req.existingCourseGroupId) || req.existingCourseGroupId : null,
        proposed_group_name: req.proposedGroupName?.trim() || null,
        request_notes: req.requestNotes?.trim() || null,
        status: 'PENDING'
      };

      const { data, error } = await resilientInsert('faculty_subject_requests', payload, true);
      if (error) throw error;

      const savedRequest = data ? mapSubjectRequestFromDb(data) : null;

      // Log audit trail
      if (savedRequest) {
        try {
          await this.logAudit({
            requestId: savedRequest.id,
            action: 'REQUEST_SUBMITTED',
            performedBy: verifiedFacultyId,
            details: {
              courseName: req.courseName,
              courseType: req.courseType,
              semesterNumber: req.semesterNumber
            }
          });
        } catch {}
      }

      return { data: savedRequest, error: null };
    } catch (err: any) {
      console.warn('Supabase facultySubjectService.submitSubjectRequest fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  /**
   * HOD / Authorized approver reviews a subject request
   */
  async reviewSubjectRequest(
    requestId: string,
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES' | 'RETURNED',
    reviewNotes: string,
    reviewerId: string,
    approvalOptions?: {
      courseId?: string;
      courseOfferingId?: string;
      courseGroupId?: string;
      targetFacultyId?: string;
      departmentId?: string;
    }
  ): Promise<{ success: boolean; error: Error | null; assignmentId?: string }> {
    try {
      const validReqId = toValidUuid(requestId) || requestId;
      const validReviewerId = (await safeFacultyId(reviewerId)) || reviewerId;
      const now = new Date().toISOString();

      const updatePayload: any = {
        status,
        reviewed_by: toValidUuid(validReviewerId) || validReviewerId,
        reviewed_at: now,
        review_notes: reviewNotes.trim() || null,
        updated_at: now
      };

      const { error: updateError } = await resilientUpdate(
        'faculty_subject_requests',
        validReqId,
        updatePayload
      );
      if (updateError) throw updateError;

      let createdAssignmentId: string | undefined = undefined;

      // If approved, create active faculty_course_assignment and assignment_history
      if (status === 'APPROVED' && approvalOptions) {
        const { courseOfferingId, courseGroupId, targetFacultyId, departmentId } = approvalOptions;

        if (courseGroupId && targetFacultyId) {
          const verifiedFacId = (await safeFacultyId(targetFacultyId)) || targetFacultyId;
          const verifiedOffId = courseOfferingId ? (await safeOfferingId(courseOfferingId)) || courseOfferingId : null;
          const verifiedGrpId = (await safeGroupId(courseGroupId)) || courseGroupId;
          const verifiedDeptId = departmentId ? (await safeDepartmentId(departmentId)) || departmentId : null;

          // 1. Insert into faculty_course_assignments
          const assignPayload: any = {
            faculty_id: toValidUuid(verifiedFacId) || verifiedFacId,
            course_offering_id: verifiedOffId ? toValidUuid(verifiedOffId) || verifiedOffId : null,
            course_group_id: toValidUuid(verifiedGrpId) || verifiedGrpId,
            assignment_role: 'PRIMARY',
            start_date: now.split('T')[0],
            is_active: true
          };

          const { data: assignData } = await resilientInsert('faculty_course_assignments', assignPayload, true);
          if (assignData?.id) createdAssignmentId = assignData.id;

          // 2. Insert into faculty_assignment_history
          const historyPayload: any = {
            course_group_id: toValidUuid(verifiedGrpId) || verifiedGrpId,
            faculty_id: toValidUuid(verifiedFacId) || verifiedFacId,
            faculty_auth_user_id: toValidUuid(verifiedFacId) || null,
            department_id: verifiedDeptId ? toValidUuid(verifiedDeptId) || verifiedDeptId : null,
            assignment_role: 'PRIMARY',
            effective_from: now.split('T')[0],
            source_request_id: toValidUuid(validReqId) || null,
            assigned_by: toValidUuid(validReviewerId) || validReviewerId,
            reason: `Approved Subject Request: ${reviewNotes || 'HOD Approval'}`
          };

          try {
            await resilientInsert('faculty_assignment_history', historyPayload, true);
          } catch {}
        }
      }

      // Log audit
      try {
        await this.logAudit({
          requestId: validReqId,
          action: status === 'APPROVED' ? 'REQUEST_APPROVED' : status === 'REJECTED' ? 'REQUEST_REJECTED' : 'CHANGES_REQUESTED',
          performedBy: validReviewerId,
          details: { status, reviewNotes, approvalOptions }
        });
      } catch {}

      return { success: true, error: null, assignmentId: createdAssignmentId };
    } catch (err: any) {
      console.warn('Supabase facultySubjectService.reviewSubjectRequest fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  /**
   * Reassign a course group to a new teacher starting from an effective date.
   * CRITICAL: Preserves historical assignment and past attendance without retroactively changing past marks.
   */
  async reassignFaculty(params: {
    assignmentId?: string;
    courseGroupId: string;
    courseOfferingId?: string;
    departmentId: string;
    currentFacultyId: string;
    newFacultyId: string;
    effectiveDate: string; // YYYY-MM-DD
    reason: string;
    assignedBy: string;
    updateTimetable?: boolean;
  }): Promise<{ success: boolean; error: Error | null; newAssignmentId?: string }> {
    try {
      const {
        assignmentId,
        courseGroupId,
        courseOfferingId,
        departmentId,
        currentFacultyId,
        newFacultyId,
        effectiveDate,
        reason,
        assignedBy
      } = params;

      const validGroupId = (await safeGroupId(courseGroupId)) || courseGroupId;
      const validOldFacId = (await safeFacultyId(currentFacultyId)) || currentFacultyId;
      const validNewFacId = (await safeFacultyId(newFacultyId)) || newFacultyId;
      const validDeptId = (await safeDepartmentId(departmentId)) || departmentId;
      const validAssignedBy = (await safeFacultyId(assignedBy)) || assignedBy;

      // Calculate previous day for ending old assignment
      const effDateObj = new Date(effectiveDate);
      const prevDateObj = new Date(effDateObj.getTime() - 24 * 60 * 60 * 1000);
      const prevDateStr = prevDateObj.toISOString().split('T')[0];

      // 1. End old assignment in faculty_course_assignments
      if (assignmentId) {
        const validAssignId = toValidUuid(assignmentId) || assignmentId;
        await resilientUpdate('faculty_course_assignments', validAssignId, {
          end_date: prevDateStr,
          is_active: false
        });
      } else {
        // Query and deactivate existing active assignment for this group and old faculty
        await supabase
          .from('faculty_course_assignments')
          .update({ end_date: prevDateStr, is_active: false })
          .match({ course_group_id: validGroupId, faculty_id: validOldFacId, is_active: true });
      }

      // 2. Update assignment history record for ended teacher
      try {
        await supabase
          .from('faculty_assignment_history')
          .update({
            effective_until: prevDateStr,
            ended_by: toValidUuid(validAssignedBy) || validAssignedBy
          })
          .match({ course_group_id: validGroupId, faculty_id: validOldFacId });
      } catch {}

      // 3. Create new assignment for new teacher starting from effectiveDate
      const newAssignPayload: any = {
        faculty_id: toValidUuid(validNewFacId) || validNewFacId,
        course_offering_id: courseOfferingId ? toValidUuid(courseOfferingId) || courseOfferingId : null,
        course_group_id: toValidUuid(validGroupId) || validGroupId,
        assignment_role: 'PRIMARY',
        start_date: effectiveDate,
        is_active: true
      };

      const { data: newAssignData, error: newAssignErr } = await resilientInsert(
        'faculty_course_assignments',
        newAssignPayload,
        true
      );
      if (newAssignErr) throw newAssignErr;

      // 4. Record new entry in faculty_assignment_history
      const historyPayload: any = {
        course_group_id: toValidUuid(validGroupId) || validGroupId,
        faculty_id: toValidUuid(validNewFacId) || validNewFacId,
        faculty_auth_user_id: toValidUuid(validNewFacId) || null,
        department_id: toValidUuid(validDeptId) || validDeptId,
        assignment_role: 'PRIMARY',
        effective_from: effectiveDate,
        assigned_by: toValidUuid(validAssignedBy) || validAssignedBy,
        reason: reason.trim() || 'Teacher Reassignment by HOD'
      };

      try {
        await resilientInsert('faculty_assignment_history', historyPayload, true);
      } catch {}

      // 5. Update timetable entries for this course group to point to new teacher if requested
      if (params.updateTimetable) {
        try {
          await supabase
            .from('timetable_entries')
            .update({ faculty_id: toValidUuid(validNewFacId) || validNewFacId })
            .eq('course_group_id', validGroupId);
        } catch {}
      }

      // 6. Audit log
      try {
        await this.logAudit({
          action: 'TEACHER_REASSIGNED',
          performedBy: validAssignedBy,
          details: {
            courseGroupId,
            oldFacultyId: currentFacultyId,
            newFacultyId,
            effectiveDate,
            reason
          }
        });
      } catch {}

      return {
        success: true,
        error: null,
        newAssignmentId: newAssignData ? newAssignData.id : undefined
      };
    } catch (err: any) {
      console.warn('Supabase facultySubjectService.reassignFaculty fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  /**
   * End an existing faculty course assignment
   */
  async endFacultyAssignment(params: {
    assignmentId: string;
    courseGroupId: string;
    facultyId: string;
    endDate: string;
    reason: string;
    endedBy: string;
  }): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { assignmentId, courseGroupId, facultyId, endDate, reason, endedBy } = params;
      const validAssignId = toValidUuid(assignmentId) || assignmentId;
      const validGroupId = (await safeGroupId(courseGroupId)) || courseGroupId;
      const validFacId = (await safeFacultyId(facultyId)) || facultyId;
      const validEndedBy = (await safeFacultyId(endedBy)) || endedBy;

      // 1. Update faculty_course_assignments
      await resilientUpdate('faculty_course_assignments', validAssignId, {
        end_date: endDate,
        is_active: false
      });

      // 2. Update faculty_assignment_history
      try {
        await supabase
          .from('faculty_assignment_history')
          .update({
            effective_until: endDate,
            ended_by: toValidUuid(validEndedBy) || validEndedBy,
            reason: reason || 'Assignment Concluded'
          })
          .match({ course_group_id: validGroupId, faculty_id: validFacId });
      } catch {}

      // 3. Log audit
      try {
        await this.logAudit({
          action: 'ASSIGNMENT_ENDED',
          performedBy: validEndedBy,
          details: { assignmentId, courseGroupId, facultyId, endDate, reason }
        });
      } catch {}

      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase facultySubjectService.endFacultyAssignment fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  /**
   * Directly assign a teacher to a course group (without request workflow)
   */
  async directAssignFaculty(params: {
    facultyId: string;
    courseOfferingId?: string;
    courseGroupId: string;
    departmentId: string;
    role?: 'PRIMARY' | 'CO_TEACHER' | 'LAB_INSTRUCTOR';
    effectiveFrom: string;
    assignedBy: string;
    reason?: string;
  }): Promise<{ data: FacultyCourseAssignment | null; error: Error | null }> {
    try {
      const {
        facultyId,
        courseOfferingId,
        courseGroupId,
        departmentId,
        role = 'PRIMARY',
        effectiveFrom,
        assignedBy,
        reason
      } = params;

      const validFacId = (await safeFacultyId(facultyId)) || facultyId;
      const validOffId = courseOfferingId ? (await safeOfferingId(courseOfferingId)) || courseOfferingId : null;
      const validGroupId = (await safeGroupId(courseGroupId)) || courseGroupId;
      const validDeptId = (await safeDepartmentId(departmentId)) || departmentId;
      const validAssignedBy = (await safeFacultyId(assignedBy)) || assignedBy;

      // 1. Insert into faculty_course_assignments
      const payload: any = {
        faculty_id: toValidUuid(validFacId) || validFacId,
        course_offering_id: validOffId ? toValidUuid(validOffId) || validOffId : null,
        course_group_id: toValidUuid(validGroupId) || validGroupId,
        assignment_role: role,
        start_date: effectiveFrom,
        is_active: true
      };

      const { data, error } = await resilientInsert('faculty_course_assignments', payload, true);
      if (error) throw error;

      // 2. Insert into faculty_assignment_history
      try {
        await resilientInsert(
          'faculty_assignment_history',
          {
            course_group_id: toValidUuid(validGroupId) || validGroupId,
            faculty_id: toValidUuid(validFacId) || validFacId,
            faculty_auth_user_id: toValidUuid(validFacId) || null,
            department_id: toValidUuid(validDeptId) || validDeptId,
            assignment_role: role,
            effective_from: effectiveFrom,
            assigned_by: toValidUuid(validAssignedBy) || validAssignedBy,
            reason: reason || 'Direct HOD Allocation'
          },
          true
        );
      } catch {}

      // 3. Log audit
      try {
        await this.logAudit({
          action: 'DIRECT_ASSIGNMENT',
          performedBy: validAssignedBy,
          details: { facultyId, courseGroupId, role, effectiveFrom, reason }
        });
      } catch {}

      return { data: data ? mapFacultyAssignmentFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase facultySubjectService.directAssignFaculty fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  /**
   * Fetch teaching assignment history for a course group or faculty
   */
  async getAssignmentHistory(courseGroupId?: string, facultyId?: string): Promise<{
    data: FacultyAssignmentHistory[] | null;
    error: Error | null;
  }> {
    try {
      let query = supabase
        .from('faculty_assignment_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (courseGroupId) {
        query = query.eq('course_group_id', courseGroupId);
      }
      if (facultyId) {
        query = query.or(`faculty_id.eq.${facultyId},faculty_auth_user_id.eq.${facultyId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: (data || []).map(mapAssignmentHistoryFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase facultySubjectService.getAssignmentHistory fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  /**
   * Map a provisional course (TEMP-2026-XXXX) to official University of Calicut details
   * Preserves all linked attendance records, timetable slots, offerings, and groups!
   */
  async mapProvisionalCourse(
    provisionalCourseId: string,
    officialDetails: {
      courseCode: string;
      courseTitle: string;
      credits?: number;
      categoryId?: string;
    },
    mappedBy: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validCourseId = toValidUuid(provisionalCourseId) || provisionalCourseId;
      const validMappedBy = (await safeFacultyId(mappedBy)) || mappedBy;

      const updatePayload: any = {
        course_code: officialDetails.courseCode.trim().toUpperCase(),
        course_title: officialDetails.courseTitle.trim()
      };
      if (officialDetails.credits) updatePayload.credits = officialDetails.credits;
      if (officialDetails.categoryId) {
        updatePayload.course_category_id = toValidUuid(officialDetails.categoryId) || officialDetails.categoryId;
      }

      const { error } = await resilientUpdate('courses', validCourseId, updatePayload);
      if (error) throw error;

      // Update related requests to reflect mapped status
      try {
        await supabase
          .from('faculty_subject_requests')
          .update({
            proposed_course_code: officialDetails.courseCode.trim().toUpperCase(),
            course_name: officialDetails.courseTitle.trim()
          })
          .eq('existing_course_id', validCourseId);
      } catch {}

      // Log audit
      try {
        await this.logAudit({
          action: 'PROVISIONAL_MAPPED_TO_OFFICIAL',
          performedBy: validMappedBy,
          details: {
            provisionalCourseId,
            officialCode: officialDetails.courseCode,
            officialTitle: officialDetails.courseTitle
          }
        });
      } catch {}

      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase facultySubjectService.mapProvisionalCourse fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  /**
   * Internal audit log helper
   */
  async logAudit(entry: {
    requestId?: string;
    assignmentHistoryId?: string;
    action: string;
    performedBy: string;
    details?: any;
  }): Promise<void> {
    try {
      const payload: any = {
        request_id: entry.requestId ? toValidUuid(entry.requestId) || null : null,
        assignment_history_id: entry.assignmentHistoryId ? toValidUuid(entry.assignmentHistoryId) || null : null,
        action: entry.action,
        performed_by: toValidUuid(entry.performedBy) || entry.performedBy,
        details: entry.details || {}
      };
      await resilientInsert('faculty_subject_audit', payload, false);
    } catch (e) {
      // non-blocking
    }
  }
};
