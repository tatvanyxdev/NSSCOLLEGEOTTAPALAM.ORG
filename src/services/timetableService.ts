import { supabase } from '../lib/supabase';
import { TimetablePeriod, TimetableEntry } from '../types';
import { mapTimetablePeriodFromDb, mapTimetableEntryFromDb } from '../lib/dataMappers';
import { toValidUuid } from '../lib/uuidMapping';
import { safePeriodId, safeOfferingId, safeGroupId, safeFacultyId } from '../lib/foreignKeyHelper';
import { resilientInsert, resilientUpdate } from '../lib/resilientMutation';

const dayToWeekdayInt = (day?: string): number => {
  if (!day) return 1;
  const map: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7
  };
  return map[day.toUpperCase()] || 1;
};

export const timetableService = {
  async getPeriods(): Promise<{ data: TimetablePeriod[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from('timetable_periods').select('*').order('period_number');
      if (error) throw error;
      return { data: (data || []).map(mapTimetablePeriodFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase timetableService.getPeriods fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async getEntries(): Promise<{ data: TimetableEntry[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from('timetable_entries').select('*');
      if (error) throw error;
      return { data: (data || []).map(mapTimetableEntryFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase timetableService.getEntries fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createEntry(entry: Omit<TimetableEntry, 'id'>): Promise<{ data: TimetableEntry | null; error: Error | null }> {
    try {
      const verifiedPeriodId = await safePeriodId(entry.periodId);
      const verifiedOfferingId = await safeOfferingId(entry.courseOfferingId);
      const verifiedGroupId = await safeGroupId(entry.courseGroupId);
      const verifiedFacultyId = await safeFacultyId(entry.facultyId);

      if (!verifiedOfferingId || !verifiedPeriodId) {
        console.warn('Skipping remote timetable entry insert: offering or period not in database yet.');
        return { data: null, error: null };
      }

      // Find academic_year_id and semester_id from course_offering if available
      let academicYearId = (entry as any).academicYearId;
      let semesterId = (entry as any).semesterId;

      if (!academicYearId && verifiedOfferingId) {
        const { data: off } = await supabase
          .from('course_offerings')
          .select('academic_year_id, semester_id')
          .eq('id', verifiedOfferingId)
          .maybeSingle();

        if (off) {
          academicYearId = off.academic_year_id;
          semesterId = off.semester_id;
        }
      }

      if (!academicYearId) {
        const { data: ay } = await supabase.from('academic_years').select('id').limit(1).maybeSingle();
        if (ay) academicYearId = ay.id;
      }

      const weekdayNumber = dayToWeekdayInt(entry.dayOfWeek || entry.weekday);

      const payload: any = {
        weekday: weekdayNumber,
        period_id: verifiedPeriodId,
        course_offering_id: verifiedOfferingId,
        course_group_id: verifiedGroupId,
        faculty_id: verifiedFacultyId,
        room: entry.room || entry.roomNumber || 'Room 101',
        is_active: entry.isActive ?? true
      };

      if (academicYearId) payload.academic_year_id = toValidUuid(academicYearId);
      if (semesterId) payload.semester_id = toValidUuid(semesterId);

      const { data, error } = await resilientInsert('timetable_entries', payload, true);
      if (error) throw error;
      return { data: data ? mapTimetableEntryFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase timetableService.createEntry fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async updateEntry(id: string, entry: Partial<TimetableEntry>): Promise<{ success: boolean; error: Error | null }> {
    try {
      const payload: any = {};
      if (entry.dayOfWeek !== undefined || entry.weekday !== undefined) {
        payload.weekday = dayToWeekdayInt(entry.dayOfWeek || entry.weekday);
      }
      if (entry.periodId !== undefined) payload.period_id = await safePeriodId(entry.periodId);
      if (entry.courseOfferingId !== undefined) payload.course_offering_id = await safeOfferingId(entry.courseOfferingId);
      if (entry.courseGroupId !== undefined) payload.course_group_id = await safeGroupId(entry.courseGroupId);
      if (entry.facultyId !== undefined) payload.faculty_id = await safeFacultyId(entry.facultyId);
      if (entry.room !== undefined) payload.room = entry.room;
      if (entry.isActive !== undefined) payload.is_active = entry.isActive;

      const validId = toValidUuid(id) || id;
      const { error } = await resilientUpdate('timetable_entries', validId, payload);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase timetableService.updateEntry fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async deleteEntry(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const { error } = await supabase.from('timetable_entries').delete().eq('id', validId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase timetableService.deleteEntry fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async updatePeriods(periods: TimetablePeriod[]): Promise<{ success: boolean; error: Error | null }> {
    try {
      for (const p of periods) {
        const payload = {
          period_number: p.periodNumber,
          start_time: p.startTime,
          end_time: p.endTime,
          name: p.label || `Period ${p.periodNumber}`,
          label: p.label || `Period ${p.periodNumber}`,
          is_break: !!p.isBreak,
          is_active: p.isActive !== undefined ? p.isActive : true
        };
        const validPeriodId = toValidUuid(p.id) || p.id;
        await supabase.from('timetable_periods').upsert({ id: validPeriodId, ...payload });
      }
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase timetableService.updatePeriods fallback:', err?.message || err);
      return { success: false, error: err };
    }
  }
};
