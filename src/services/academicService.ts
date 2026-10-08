import { supabase } from '../lib/supabase';
import { 
  mapAcademicYearFromDb, 
  mapSemesterFromDb, 
  mapAdmissionBatchFromDb, 
  mapSemesterEnrollmentFromDb 
} from '../lib/dataMappers';
import { toValidUuid } from '../lib/uuidMapping';
import { safeProgrammeId, safeStudentId } from '../lib/foreignKeyHelper';
import { resilientInsert, resilientUpdate } from '../lib/resilientMutation';

export const academicService = {
  // Academic Years
  async getAcademicYears(): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: (data || []).map(mapAcademicYearFromDb), error: null };
    } catch (err: any) {
      console.warn('academicService.getAcademicYears fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createAcademicYear(ay: any): Promise<{ data: any | null; error: Error | null }> {
    try {
      const payload = {
        name: ay.name || ay.yearName,
        start_date: ay.startDate,
        end_date: ay.endDate,
        is_active: ay.isActive !== undefined ? ay.isActive : true,
        is_current: !!ay.isCurrent
      };
      const { data, error } = await supabase.from('academic_years').insert([payload]).select().single();
      if (error) throw error;
      return { data: data ? mapAcademicYearFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('academicService.createAcademicYear fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  // Semesters
  async getSemesters(): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('*')
        .order('semester_number', { ascending: true });

      if (error) throw error;
      return { data: (data || []).map(mapSemesterFromDb), error: null };
    } catch (err: any) {
      console.warn('academicService.getSemesters fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createSemester(sem: any): Promise<{ data: any | null; error: Error | null }> {
    try {
      const payload = {
        semester_number: sem.semesterNumber,
        academic_year: sem.academicYear,
        term: sem.term || 'ODD',
        is_active: sem.isActive !== undefined ? sem.isActive : true,
        is_current: !!sem.isCurrent
      };
      const { data, error } = await supabase.from('semesters').insert([payload]).select().single();
      if (error) throw error;
      return { data: data ? mapSemesterFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('academicService.createSemester fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  // Admission Batches
  async getAdmissionBatches(): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('admission_batches')
        .select('*')
        .order('batch_name', { ascending: false });

      if (error) throw error;
      return { data: (data || []).map(mapAdmissionBatchFromDb), error: null };
    } catch (err: any) {
      console.warn('academicService.getAdmissionBatches fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createAdmissionBatch(batch: any): Promise<{ data: any | null; error: Error | null }> {
    try {
      const verifiedProgId = await safeProgrammeId(batch.programmeId);
      const payload = {
        batch_name: batch.batchName || batch.name,
        academic_year: batch.academicYear,
        programme_id: verifiedProgId,
        max_capacity: batch.maxCapacity || 60,
        is_active: batch.isActive !== undefined ? batch.isActive : true
      };
      const { data, error } = await resilientInsert('admission_batches', payload, true);
      if (error) throw error;
      return { data: data ? mapAdmissionBatchFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('academicService.createAdmissionBatch fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async updateAdmissionBatch(id: string, batch: any): Promise<{ data: any | null; error: Error | null }> {
    try {
      const payload: Record<string, any> = {};
      if (batch.batchName || batch.name) payload.batch_name = batch.batchName || batch.name;
      if (batch.academicYear) payload.academic_year = batch.academicYear;
      if (batch.programmeId) payload.programme_id = await safeProgrammeId(batch.programmeId);
      if (batch.maxCapacity !== undefined) payload.max_capacity = batch.maxCapacity;
      if (batch.isActive !== undefined) payload.is_active = batch.isActive;

      const validId = toValidUuid(id) || id;
      const { success, error } = await resilientUpdate('admission_batches', validId, payload);
      if (error) throw error;
      return { data: success ? { id: validId, ...payload } : null, error: null };
    } catch (err: any) {
      console.warn('academicService.updateAdmissionBatch fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  // Semester Enrollments
  async getSemesterEnrollments(): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('semester_enrollments')
        .select('*');

      if (error) throw error;
      return { data: (data || []).map(mapSemesterEnrollmentFromDb), error: null };
    } catch (err: any) {
      console.warn('academicService.getSemesterEnrollments fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createSemesterEnrollment(enr: any): Promise<{ data: any | null; error: Error | null }> {
    try {
      const verifiedStudentId = await safeStudentId(enr.studentId);
      if (!verifiedStudentId) {
        console.warn('Skipping remote enrollment insert: student not in database yet.');
        return { data: null, error: null };
      }

      const payload = {
        student_id: verifiedStudentId,
        academic_year: enr.academicYear,
        semester_number: enr.semesterNumber,
        enrolled_date: enr.enrollmentDate || new Date().toISOString().split('T')[0],
        status: enr.status || 'ACTIVE'
      };
      const { data, error } = await resilientInsert('semester_enrollments', payload, true);
      if (error) throw error;
      return { data: data ? mapSemesterEnrollmentFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('academicService.createSemesterEnrollment fallback:', err?.message || err);
      return { data: null, error: err };
    }
  }
};
