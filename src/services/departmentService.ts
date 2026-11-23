import { supabase } from '../lib/supabase';
import { Department } from '../types';
import { mapDepartmentFromDb } from '../lib/dataMappers';
import { toValidUuid } from '../lib/uuidMapping';
import { safeFacultyId } from '../lib/foreignKeyHelper';

export const departmentService = {
  async getDepartments(): Promise<{ data: Department[] | null; hasPolicyColumn?: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      const rows = data || [];
      const hasPolicyColumn = rows.some((r: any) => r.attendance_policy !== undefined);
      return { data: rows.map(mapDepartmentFromDb), hasPolicyColumn, error: null };
    } catch (err: any) {
      console.warn('Supabase departmentService.getDepartments fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createDepartment(dept: Omit<Department, 'id'>): Promise<{ data: Department | null; error: Error | null }> {
    try {
      const payload: any = {
        name: dept.name,
        code: dept.code,
        is_active: dept.isActive !== undefined ? dept.isActive : true,
        attendance_policy: dept.attendancePolicy || 'HOUR_WISE'
      };
      if (dept.type) payload.type = dept.type;
      if (dept.hodFacultyId) {
        const verifiedHod = await safeFacultyId(dept.hodFacultyId);
        if (verifiedHod) payload.hod_faculty_id = verifiedHod;
      }

      let { data, error } = await supabase
        .from('departments')
        .insert([payload])
        .select()
        .single();

      // If 'type' or 'attendance_policy' column is missing from database schema cache, strip and retry cleanly
      for (let attempt = 0; attempt < 2 && error; attempt++) {
        let stripped = false;
        if (error.message?.includes("'type' column") && 'type' in payload) {
          delete payload.type;
          stripped = true;
        }
        if (error.message?.includes("'attendance_policy' column") && 'attendance_policy' in payload) {
          delete payload.attendance_policy;
          stripped = true;
        }
        if (!stripped) break;
        const retry = await supabase.from('departments').insert([payload]).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      return {
        data: data
          ? {
              ...mapDepartmentFromDb(data),
              attendancePolicy: dept.attendancePolicy || mapDepartmentFromDb(data).attendancePolicy
            }
          : null,
        error: null
      };
    } catch (err: any) {
      console.warn('Supabase departmentService.createDepartment fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async updateDepartment(id: string, dept: Partial<Department>): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const payload: any = {};
      if (dept.name !== undefined) payload.name = dept.name;
      if (dept.code !== undefined) payload.code = dept.code;
      if (dept.type !== undefined) payload.type = dept.type;
      if (dept.hodFacultyId !== undefined) {
        payload.hod_faculty_id = await safeFacultyId(dept.hodFacultyId);
      }
      if (dept.attendancePolicy !== undefined) payload.attendance_policy = dept.attendancePolicy;
      if (dept.isActive !== undefined) payload.is_active = dept.isActive;

      let { error } = await supabase
        .from('departments')
        .update(payload)
        .eq('id', validId);

      // If 'type' or 'attendance_policy' column is missing, strip missing column and retry
      for (let attempt = 0; attempt < 2 && error; attempt++) {
        let stripped = false;
        if (error.message?.includes("'type' column") && 'type' in payload) {
          delete payload.type;
          stripped = true;
        }
        if (error.message?.includes("'attendance_policy' column") && 'attendance_policy' in payload) {
          delete payload.attendance_policy;
          stripped = true;
        }
        if (!stripped) break;
        const retry = Object.keys(payload).length > 0
          ? await supabase.from('departments').update(payload).eq('id', validId)
          : { error: null };
        error = retry.error;
      }

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase departmentService.updateDepartment fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async deleteDepartment(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', validId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase departmentService.deleteDepartment fallback:', err?.message || err);
      return { success: false, error: err };
    }
  }
};

