import { supabase } from '../lib/supabase';
import { Department } from '../types';
import { mapDepartmentFromDb } from '../lib/dataMappers';
import { toValidUuid } from '../lib/uuidMapping';
import { safeFacultyId } from '../lib/foreignKeyHelper';

export const departmentService = {
  async getDepartments(): Promise<{ data: Department[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data: (data || []).map(mapDepartmentFromDb), error: null };
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
        is_active: dept.isActive !== undefined ? dept.isActive : true
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

      // If 'type' column is missing from database schema cache, retry without 'type'
      if (error && error.message?.includes("'type' column")) {
        delete payload.type;
        const retry = await supabase.from('departments').insert([payload]).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      return { data: data ? mapDepartmentFromDb(data) : null, error: null };
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
      if (dept.isActive !== undefined) payload.is_active = dept.isActive;

      let { error } = await supabase
        .from('departments')
        .update(payload)
        .eq('id', validId);

      // If 'type' column missing, retry without 'type'
      if (error && error.message?.includes("'type' column")) {
        delete payload.type;
        const retry = await supabase.from('departments').update(payload).eq('id', validId);
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

