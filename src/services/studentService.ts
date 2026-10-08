import { supabase } from '../lib/supabase';
import { Student, StudentCourseRegistration } from '../types';
import { mapStudentFromDb, mapStudentRegistrationFromDb } from '../lib/dataMappers';
import { toValidUuid } from '../lib/uuidMapping';
import { safeDepartmentId, safeProgrammeId, safeStudentId, safeOfferingId, safeGroupId, safeCategoryId } from '../lib/foreignKeyHelper';
import { resilientInsert, resilientUpdate, resilientUpsert } from '../lib/resilientMutation';

export const studentService = {
  async getStudents(): Promise<{ data: Student[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('roll_number');

      if (error) throw error;
      return { data: (data || []).map(mapStudentFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase studentService.getStudents fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async getRegistrations(): Promise<{ data: StudentCourseRegistration[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from('student_course_registrations').select('*');
      if (error) throw error;
      return { data: (data || []).map(mapStudentRegistrationFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase studentService.getRegistrations fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createStudent(student: Omit<Student, 'id' | 'createdAt'>): Promise<{ data: Student | null; error: Error | null }> {
    try {
      const mobile = student.mobileNumber || student.phone || student.phoneNumber || null;
      const verifiedDeptId = await safeDepartmentId(student.homeDepartmentId || (student as any).departmentId);
      const verifiedProgId = await safeProgrammeId(student.programmeId);

      const payload: any = {
        admission_number: student.admissionNumber,
        roll_number: student.rollNumber || student.admissionNumber,
        university_register_number: student.universityRegisterNumber || null,
        full_name: student.fullName,
        username: student.username || student.admissionNumber,
        password: student.password || 'Student@123',
        email: student.email || null,
        mobile_number: mobile,
        phone: mobile,
        home_department_id: verifiedDeptId,
        programme_id: verifiedProgId,
        current_semester: Number(student.currentSemester) || 1,
        blood_group: student.bloodGroup || null,
        status: student.status || 'ACTIVE'
      };

      const { data, error } = await resilientInsert('students', payload, true);
      if (error) throw error;
      return { data: data ? mapStudentFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase studentService.createStudent fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async updateStudent(id: string, student: Partial<Student>): Promise<{ success: boolean; error: Error | null }> {
    try {
      const payload: any = {};
      if (student.admissionNumber !== undefined) payload.admission_number = student.admissionNumber;
      if (student.rollNumber !== undefined) payload.roll_number = student.rollNumber;
      if (student.universityRegisterNumber !== undefined) payload.university_register_number = student.universityRegisterNumber;
      if (student.fullName !== undefined) payload.full_name = student.fullName;
      if (student.username !== undefined) payload.username = student.username;
      if (student.password !== undefined) payload.password = student.password;
      if (student.email !== undefined) payload.email = student.email;
      if (student.mobileNumber !== undefined || student.phone !== undefined || student.phoneNumber !== undefined) {
        const mobile = student.mobileNumber || student.phone || student.phoneNumber || null;
        payload.mobile_number = mobile;
        payload.phone = mobile;
      }
      if (student.homeDepartmentId !== undefined || (student as any).departmentId !== undefined) {
        payload.home_department_id = await safeDepartmentId(student.homeDepartmentId || (student as any).departmentId);
      }
      if (student.programmeId !== undefined) {
        payload.programme_id = await safeProgrammeId(student.programmeId);
      }
      if (student.currentSemester !== undefined) payload.current_semester = Number(student.currentSemester);
      if (student.bloodGroup !== undefined) payload.blood_group = student.bloodGroup;
      if (student.status !== undefined) payload.status = student.status;

      const validId = toValidUuid(id) || id;
      const { error } = await resilientUpdate('students', validId, payload);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase studentService.updateStudent fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async deleteStudent(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;

      // 1. Delete student course registrations
      try {
        await supabase
          .from('student_course_registrations')
          .delete()
          .eq('student_id', validId);
      } catch (e) {
        console.warn('Could not clean student registrations:', e);
      }

      // 2. Delete attendance records for this student
      try {
        await supabase
          .from('attendance_records')
          .delete()
          .eq('student_id', validId);
      } catch (e) {
        console.warn('Could not clean attendance records:', e);
      }

      // 3. Delete attendance correction requests for this student
      try {
        await supabase
          .from('attendance_correction_requests')
          .delete()
          .eq('student_id', validId);
      } catch (e) {
        console.warn('Could not clean correction requests:', e);
      }

      // 4. Delete semester enrollments
      try {
        await supabase
          .from('semester_enrollments')
          .delete()
          .eq('student_id', validId);
      } catch (e) {
        console.warn('Could not clean semester enrollments:', e);
      }

      // 5. Delete student record from students table
      const { error } = await supabase.from('students').delete().eq('id', validId);
      if (error) {
        console.warn('Supabase student delete warning:', error.message);
      }

      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase studentService.deleteStudent fallback:', err?.message || err);
      // Return success true so local state can still delete even if remote is offline or item is local mock
      return { success: true, error: null };
    }
  },

  async createRegistration(reg: Omit<StudentCourseRegistration, 'id'>): Promise<{ data: StudentCourseRegistration | null; error: Error | null }> {
    try {
      const verifiedStudentId = await safeStudentId(reg.studentId);
      const verifiedOffId = await safeOfferingId(reg.courseOfferingId);
      const verifiedGrpId = await safeGroupId(reg.courseGroupId);
      const verifiedCatId = await safeCategoryId(reg.courseCategoryId);

      if (!verifiedStudentId || !verifiedOffId) {
        console.warn('Skipping remote registration insert: student or course offering not in database yet.');
        return { data: null, error: null };
      }

      const payload = {
        student_id: verifiedStudentId,
        course_offering_id: verifiedOffId,
        course_group_id: verifiedGrpId,
        course_category_id: verifiedCatId,
        registration_status: reg.status || 'REGISTERED',
        registration_date: reg.registrationDate || new Date().toISOString().split('T')[0]
      };
      const { data, error } = await resilientInsert('student_course_registrations', payload, true);
      if (error) throw error;
      return { data: data ? mapStudentRegistrationFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase studentService.createRegistration fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async bulkCreateRegistrations(regs: Omit<StudentCourseRegistration, 'id'>[]): Promise<{ success: boolean; error: Error | null }> {
    try {
      const verifiedRegs = [];
      for (const reg of regs) {
        const verifiedStudentId = await safeStudentId(reg.studentId);
        const verifiedOffId = await safeOfferingId(reg.courseOfferingId);
        if (verifiedStudentId && verifiedOffId) {
          verifiedRegs.push({
            student_id: verifiedStudentId,
            course_offering_id: verifiedOffId,
            course_group_id: await safeGroupId(reg.courseGroupId),
            course_category_id: await safeCategoryId(reg.courseCategoryId),
            registration_status: reg.status || 'REGISTERED',
            registration_date: reg.registrationDate || new Date().toISOString().split('T')[0]
          });
        }
      }

      if (verifiedRegs.length === 0) {
        return { success: true, error: null };
      }

      const { error } = await resilientUpsert('student_course_registrations', verifiedRegs, { onConflict: 'student_id,course_offering_id' });
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase studentService.bulkCreateRegistrations fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async deleteRegistration(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const { error } = await supabase.from('student_course_registrations').delete().eq('id', validId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase studentService.deleteRegistration fallback:', err?.message || err);
      return { success: false, error: err };
    }
  }
};
