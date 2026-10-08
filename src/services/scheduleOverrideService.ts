import { supabase } from '../lib/supabase';
import { DailyScheduleOverride, ClassTutorAssignment } from '../types';
import { mapDailyScheduleOverrideFromDb, mapClassTutorAssignmentFromDb } from '../lib/dataMappers';
import { resilientInsert, resilientUpdate } from '../lib/resilientMutation';
import { toValidUuid } from '../lib/uuidMapping';

export const scheduleOverrideService = {
  async getOverrides(date?: string): Promise<{ data: DailyScheduleOverride[] | null; error: Error | null }> {
    try {
      let query = supabase.from('daily_schedule_overrides').select('*');
      if (date) {
        query = query.eq('date', date);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { data: (data || []).map(mapDailyScheduleOverrideFromDb), error: null };
    } catch (err: any) {
      console.warn('scheduleOverrideService.getOverrides fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createOverride(override: Omit<DailyScheduleOverride, 'id' | 'createdAt'>): Promise<{ data: DailyScheduleOverride | null; error: Error | null }> {
    try {
      const payload: Record<string, any> = {
        date: override.date,
        override_type: override.overrideType,
        timetable_entry_id: toValidUuid(override.timetableEntryId) || override.timetableEntryId || null,
        original_period_id: toValidUuid(override.originalPeriodId) || override.originalPeriodId || null,
        new_period_id: toValidUuid(override.newPeriodId) || override.newPeriodId || null,
        original_faculty_id: toValidUuid(override.originalFacultyId) || override.originalFacultyId || null,
        substitute_faculty_id: toValidUuid(override.substituteFacultyId) || override.substituteFacultyId || null,
        original_room: override.originalRoom || null,
        new_room: override.newRoom || null,
        course_group_id: toValidUuid(override.courseGroupId) || override.courseGroupId || null,
        course_offering_id: toValidUuid(override.courseOfferingId) || override.courseOfferingId || null,
        reason: override.reason || null,
        created_by_faculty_id: toValidUuid(override.createdByFacultyId) || override.createdByFacultyId || null
      };

      const { data, error } = await resilientInsert('daily_schedule_overrides', payload, true);
      if (error) throw error;
      return {
        data: data ? mapDailyScheduleOverrideFromDb(data) : { ...override, id: `override-${Date.now()}` } as DailyScheduleOverride,
        error: null
      };
    } catch (err: any) {
      console.warn('scheduleOverrideService.createOverride fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async cancelClass(
    date: string,
    periodId: string,
    timetableEntryId: string,
    reason: string,
    facultyId?: string
  ): Promise<{ data: DailyScheduleOverride | null; error: Error | null }> {
    return this.createOverride({
      date,
      overrideType: 'CANCELLED_CLASS',
      timetableEntryId,
      originalPeriodId: periodId,
      reason,
      createdByFacultyId: facultyId
    });
  },

  async deleteOverride(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const { error } = await supabase.from('daily_schedule_overrides').delete().eq('id', validId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('scheduleOverrideService.deleteOverride fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  // Class Tutor Assignments
  async getClassTutorAssignments(): Promise<{ data: ClassTutorAssignment[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from('class_tutor_assignments').select('*');
      if (error) throw error;
      return { data: (data || []).map(mapClassTutorAssignmentFromDb), error: null };
    } catch (err: any) {
      console.warn('scheduleOverrideService.getClassTutorAssignments fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createClassTutorAssignment(assignment: Omit<ClassTutorAssignment, 'id' | 'createdAt'>): Promise<{ data: ClassTutorAssignment | null; error: Error | null }> {
    try {
      const payload: Record<string, any> = {
        faculty_id: toValidUuid(assignment.facultyId) || assignment.facultyId,
        programme_id: toValidUuid(assignment.programmeId) || assignment.programmeId,
        academic_year_id: toValidUuid(assignment.academicYearId) || assignment.academicYearId || null,
        semester_id: toValidUuid(assignment.semesterId) || assignment.semesterId || null,
        batch_name: assignment.batchName || '2024-2028',
        department_id: toValidUuid(assignment.departmentId) || assignment.departmentId || null,
        is_active: assignment.isActive !== false
      };

      const { data, error } = await resilientInsert('class_tutor_assignments', payload, true);
      if (error) throw error;
      return {
        data: data ? mapClassTutorAssignmentFromDb(data) : { ...assignment, id: `cta-${Date.now()}` } as ClassTutorAssignment,
        error: null
      };
    } catch (err: any) {
      console.warn('scheduleOverrideService.createClassTutorAssignment fallback:', err?.message || err);
      return { data: null, error: err };
    }
  }
};
