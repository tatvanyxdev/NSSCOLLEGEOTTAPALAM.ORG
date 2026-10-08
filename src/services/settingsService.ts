import { supabase } from '../lib/supabase';
import { SystemSettings } from '../types';
import { mapSystemSettingsFromDb } from '../lib/dataMappers';

export const settingsService = {
  async getSettings(): Promise<{ data: SystemSettings | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return { data: data ? mapSystemSettingsFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase settingsService.getSettings fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<{ success: boolean; error: Error | null }> {
    try {
      const payload: any = {
        updated_at: new Date().toISOString()
      };
      if (settings.collegeName !== undefined) payload.college_name = settings.collegeName;
      if (settings.collegeCode !== undefined) payload.college_code = settings.collegeCode;
      if (settings.affiliation !== undefined) payload.affiliation = settings.affiliation;
      if (settings.accreditation !== undefined) payload.accreditation = settings.accreditation;
      if (settings.address !== undefined) payload.address = settings.address;
      if (settings.contactEmail !== undefined) payload.contact_email = settings.contactEmail;
      if (settings.contactPhone !== undefined) payload.contact_phone = settings.contactPhone;
      if (settings.activeAcademicYear !== undefined) payload.active_academic_year = settings.activeAcademicYear;
      if (settings.activeSemester !== undefined) payload.active_semester = settings.activeSemester;
      if (settings.minAttendancePercentage !== undefined) payload.min_attendance_percentage = settings.minAttendancePercentage;
      if (settings.warningAttendancePercentage !== undefined) payload.warning_attendance_percentage = settings.warningAttendancePercentage;
      if (settings.attendanceCorrectionWindowHours !== undefined) payload.attendance_correction_window_hours = settings.attendanceCorrectionWindowHours;
      if (settings.allowTeacherDirectEdit !== undefined) payload.allow_teacher_direct_edit = settings.allowTeacherDirectEdit;
      if (settings.requireHodApprovalForCorrection !== undefined) payload.require_hod_approval_for_correction = settings.requireHodApprovalForCorrection;
      if (settings.workingDays !== undefined) payload.working_days = settings.workingDays;
      if (settings.enableStudentPortal !== undefined) payload.enable_student_portal = settings.enableStudentPortal;
      if (settings.enableFacultyPortal !== undefined) payload.enable_faculty_portal = settings.enableFacultyPortal;
      if (settings.maintenanceMode !== undefined) payload.maintenance_mode = settings.maintenanceMode;

      const { error } = await supabase
        .from('system_settings')
        .upsert(payload);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase settingsService.updateSettings fallback:', err?.message || err);
      return { success: false, error: err };
    }
  }
};

