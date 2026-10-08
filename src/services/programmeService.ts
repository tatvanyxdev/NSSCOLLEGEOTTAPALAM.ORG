import { supabase } from '../lib/supabase';
import { Programme } from '../types';
import { mapProgrammeFromDb } from '../lib/dataMappers';

export const programmeService = {
  async getProgrammes(): Promise<{ data: Programme[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('programmes')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data: (data || []).map(mapProgrammeFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase programmeService.getProgrammes fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createProgramme(prog: Omit<Programme, 'id'>): Promise<{ data: Programme | null; error: Error | null }> {
    try {
      const payload: any = {
        name: prog.name,
        code: prog.code,
        department_id: prog.departmentId,
        type: prog.type || 'UG',
        duration_years: prog.durationYears || 4,
        total_semesters: prog.totalSemesters || 8,
        expected_strength: prog.expectedStrength || 40,
        max_strength: prog.maxStrength || 50,
        sanctioned_intake: prog.sanctionedIntake || prog.maxStrength || 40,
        admitted_count: prog.admittedCount || 0,
        is_active: prog.isActive !== undefined ? prog.isActive : true
      };

      const { data, error } = await supabase
        .from('programmes')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { data: data ? mapProgrammeFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase programmeService.createProgramme fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async updateProgramme(id: string, prog: Partial<Programme>): Promise<{ success: boolean; error: Error | null }> {
    try {
      const payload: any = {};
      if (prog.name !== undefined) payload.name = prog.name;
      if (prog.code !== undefined) payload.code = prog.code;
      if (prog.departmentId !== undefined) payload.department_id = prog.departmentId;
      if (prog.type !== undefined) payload.type = prog.type;
      if (prog.durationYears !== undefined) payload.duration_years = prog.durationYears;
      if (prog.totalSemesters !== undefined) payload.total_semesters = prog.totalSemesters;
      if (prog.expectedStrength !== undefined) payload.expected_strength = prog.expectedStrength;
      if (prog.maxStrength !== undefined) payload.max_strength = prog.maxStrength;
      if (prog.sanctionedIntake !== undefined) payload.sanctioned_intake = prog.sanctionedIntake;
      if (prog.admittedCount !== undefined) payload.admitted_count = prog.admittedCount;
      if (prog.isActive !== undefined) payload.is_active = prog.isActive;

      const { error } = await supabase
        .from('programmes')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase programmeService.updateProgramme fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async deleteProgramme(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('programmes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase programmeService.deleteProgramme fallback:', err?.message || err);
      return { success: false, error: err };
    }
  }
};

