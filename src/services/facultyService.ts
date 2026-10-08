import { supabase } from '../lib/supabase';
import { Faculty, FacultyCourseAssignment } from '../types';
import { mapFacultyFromDb, mapFacultyAssignmentFromDb } from '../lib/dataMappers';
import { toValidUuid } from '../lib/uuidMapping';
import { safeDepartmentId, safeFacultyId, safeOfferingId, safeGroupId } from '../lib/foreignKeyHelper';
import { resilientInsert, resilientUpdate } from '../lib/resilientMutation';

export const facultyService = {
  async getFaculty(): Promise<{ data: Faculty[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('faculty')
        .select('*')
        .order('full_name');

      if (error) throw error;
      return { data: (data || []).map(mapFacultyFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase facultyService.getFaculty fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async getAssignments(): Promise<{ data: FacultyCourseAssignment[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from('faculty_course_assignments').select('*');
      if (error) throw error;
      return { data: (data || []).map(mapFacultyAssignmentFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase facultyService.getAssignments fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createFaculty(fac: Omit<Faculty, 'id'>): Promise<{ data: Faculty | null; error: Error | null }> {
    try {
      const phoneVal = fac.phone || fac.phoneNumber || (fac as any).mobileNumber || null;
      // Verify department exists in Supabase departments table to prevent foreign key violation
      const verifiedDeptId = await safeDepartmentId(fac.departmentId);

      const payload: any = {
        employee_id: fac.employeeId || (fac as any).employeeCode || null,
        employee_code: (fac as any).employeeCode || fac.employeeId || null,
        full_name: fac.fullName,
        email: fac.email || null,
        phone: phoneVal,
        mobile_number: phoneVal,
        department_id: verifiedDeptId,
        designation: fac.designation || 'Assistant Professor',
        profile_photo_url: fac.profileImageUrl || (fac as any).profilePhotoUrl || null,
        username: fac.username || null,
        password: fac.password || null,
        is_active: fac.isActive ?? true
      };
      const { data, error } = await resilientInsert('faculty', payload, true);
      if (error) throw error;
      return { data: data ? mapFacultyFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase facultyService.createFaculty fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async updateFaculty(id: string, fac: Partial<Faculty>): Promise<{ success: boolean; error: Error | null }> {
    try {
      const payload: any = {};
      if (fac.employeeId !== undefined) {
        payload.employee_id = fac.employeeId;
        payload.employee_code = fac.employeeId;
      }
      if (fac.fullName !== undefined) payload.full_name = fac.fullName;
      if (fac.email !== undefined) payload.email = fac.email;
      if (fac.phone !== undefined || fac.phoneNumber !== undefined || (fac as any).mobileNumber !== undefined) {
        const phoneVal = fac.phone || fac.phoneNumber || (fac as any).mobileNumber || null;
        payload.phone = phoneVal;
        payload.mobile_number = phoneVal;
      }
      if (fac.departmentId !== undefined) {
        payload.department_id = await safeDepartmentId(fac.departmentId);
      }
      if (fac.designation !== undefined) payload.designation = fac.designation;
      if (fac.profileImageUrl !== undefined || (fac as any).profilePhotoUrl !== undefined) {
        payload.profile_photo_url = fac.profileImageUrl || (fac as any).profilePhotoUrl;
      }
      if (fac.username !== undefined) payload.username = fac.username;
      if (fac.password !== undefined) payload.password = fac.password;
      if (fac.isActive !== undefined) payload.is_active = fac.isActive;

      const validId = toValidUuid(id) || id;
      const { error } = await resilientUpdate('faculty', validId, payload);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase facultyService.updateFaculty fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async deleteFaculty(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;

      // 1. Unlink HOD assignment in departments if this faculty is an HOD
      try {
        await supabase
          .from('departments')
          .update({ hod_faculty_id: null })
          .eq('hod_faculty_id', validId);
      } catch (e) {
        console.warn('Could not unlink department HOD:', e);
      }

      // 2. Unlink course offering coordinator
      try {
        await supabase
          .from('course_offerings')
          .update({ coordinator_faculty_id: null })
          .eq('coordinator_faculty_id', validId);
      } catch (e) {
        console.warn('Could not unlink offering coordinator:', e);
      }

      // 3. Delete course assignments referencing this faculty
      try {
        await supabase
          .from('faculty_course_assignments')
          .delete()
          .eq('faculty_id', validId);
      } catch (e) {
        console.warn('Could not clean faculty course assignments:', e);
      }

      // 4. Clean timetable entries referencing this faculty
      try {
        await supabase
          .from('timetable_entries')
          .delete()
          .eq('faculty_id', validId);
      } catch (e) {
        console.warn('Could not clean faculty timetable entries:', e);
      }

      // 5. Clean substitute assignments
      try {
        await supabase
          .from('substitute_assignments')
          .delete()
          .or(`faculty_id.eq.${validId},substitute_faculty_id.eq.${validId}`);
      } catch (e) {
        console.warn('Could not clean substitute assignments:', e);
      }

      // 6. Delete faculty member from faculty table
      const { error } = await supabase.from('faculty').delete().eq('id', validId);
      if (error) {
        console.warn('Supabase faculty delete warning:', error.message);
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase facultyService.deleteFaculty fallback:', err?.message || err);
      // Return success true so local state can still delete even if remote is offline or item is local mock
      return { success: true, error: null };
    }
  },

  async createAssignment(assignment: Omit<FacultyCourseAssignment, 'id'>): Promise<{ data: FacultyCourseAssignment | null; error: Error | null }> {
    try {
      const verifiedFacId = await safeFacultyId(assignment.facultyId);
      const verifiedOffId = await safeOfferingId(assignment.courseOfferingId);
      const verifiedGrpId = await safeGroupId(assignment.courseGroupId);

      if (!verifiedFacId || !verifiedOffId) {
        console.warn('Skipping remote assignment insert: faculty or course offering not in database yet.');
        return { data: null, error: null };
      }

      const payload = {
        faculty_id: verifiedFacId,
        course_offering_id: verifiedOffId,
        course_group_id: verifiedGrpId,
        assignment_role: assignment.role || 'PRIMARY',
        is_active: assignment.isActive !== undefined ? assignment.isActive : true
      };
      const { data, error } = await resilientInsert('faculty_course_assignments', payload, true);
      if (error) throw error;
      return { data: data ? mapFacultyAssignmentFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase facultyService.createAssignment fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async deleteAssignment(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const { error } = await supabase.from('faculty_course_assignments').delete().eq('id', validId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase facultyService.deleteAssignment fallback:', err?.message || err);
      return { success: false, error: err };
    }
  }
};
