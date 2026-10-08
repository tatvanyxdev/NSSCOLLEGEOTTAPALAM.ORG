import { supabase } from '../lib/supabase';
import { Course, CourseCategory, CourseOffering, CourseGroup } from '../types';
import {
  mapCourseFromDb,
  mapCourseCategoryFromDb,
  mapCourseOfferingFromDb,
  mapCourseGroupFromDb
} from '../lib/dataMappers';
import { toValidUuid } from '../lib/uuidMapping';
import { safeDepartmentId, safeCategoryId, safeCourseId, safeOfferingId } from '../lib/foreignKeyHelper';
import { resilientInsert, resilientUpdate } from '../lib/resilientMutation';

export const courseService = {
  async getCategories(): Promise<{ data: CourseCategory[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from('course_categories').select('*').order('name');
      if (error) throw error;
      return { data: (data || []).map(mapCourseCategoryFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.getCategories fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async getCourses(): Promise<{ data: Course[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from('courses').select('*').order('course_code');
      if (error) throw error;
      return { data: (data || []).map(mapCourseFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.getCourses fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async getOfferings(): Promise<{ data: CourseOffering[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from('course_offerings').select('*');
      if (error) throw error;
      return { data: (data || []).map(mapCourseOfferingFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.getOfferings fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async getGroups(): Promise<{ data: CourseGroup[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.from('course_groups').select('*');
      if (error) throw error;
      return { data: (data || []).map(mapCourseGroupFromDb), error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.getGroups fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createCourse(course: Omit<Course, 'id'>): Promise<{ data: Course | null; error: Error | null }> {
    try {
      const verifiedDeptId = await safeDepartmentId(course.departmentId);
      const verifiedCatId = await safeCategoryId(course.categoryId || (course as any).courseCategoryId);

      const payload: any = {
        course_code: course.courseCode,
        course_title: course.courseTitle,
        department_id: verifiedDeptId,
        course_category_id: verifiedCatId,
        credits: course.credits || 0,
        lecture_hours: course.lectureHours ?? 0,
        tutorial_hours: course.theoryHours ?? course.lectureHours ?? 0,
        practical_hours: course.practicalHours ?? 0,
        description: course.description || null,
        is_active: course.isActive !== undefined ? course.isActive : true
      };
      const { data, error } = await resilientInsert('courses', payload, true);
      if (error) throw error;
      return { data: data ? mapCourseFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.createCourse fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async updateCourse(id: string, course: Partial<Course>): Promise<{ success: boolean; error: Error | null }> {
    try {
      const payload: any = {};
      if (course.courseCode !== undefined) payload.course_code = course.courseCode;
      if (course.courseTitle !== undefined) payload.course_title = course.courseTitle;
      if (course.departmentId !== undefined) {
        payload.department_id = await safeDepartmentId(course.departmentId);
      }
      if (course.categoryId !== undefined || (course as any).courseCategoryId !== undefined) {
        payload.course_category_id = await safeCategoryId(course.categoryId || (course as any).courseCategoryId);
      }
      if (course.credits !== undefined) payload.credits = course.credits;
      if (course.lectureHours !== undefined) payload.lecture_hours = course.lectureHours;
      if (course.theoryHours !== undefined) payload.tutorial_hours = course.theoryHours;
      if (course.practicalHours !== undefined) payload.practical_hours = course.practicalHours;
      if (course.description !== undefined) payload.description = course.description;
      if (course.isActive !== undefined) payload.is_active = course.isActive;

      const validId = toValidUuid(id) || id;
      const { error } = await resilientUpdate('courses', validId, payload);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.updateCourse fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async deleteCourse(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const { error } = await supabase.from('courses').delete().eq('id', validId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.deleteCourse fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async createCategory(cat: Omit<CourseCategory, 'id'>): Promise<{ data: CourseCategory | null; error: Error | null }> {
    try {
      const payload = {
        code: cat.code,
        name: cat.name,
        description: cat.description,
        color_hex: (cat as any).colorHex || '#2563eb',
        is_active: cat.isActive !== undefined ? cat.isActive : true
      };
      const { data, error } = await resilientInsert('course_categories', payload, true);
      if (error) throw error;
      return { data: data ? mapCourseCategoryFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.createCategory fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createOffering(offering: Omit<CourseOffering, 'id'>): Promise<{ data: CourseOffering | null; error: Error | null }> {
    try {
      const verifiedCourseId = await safeCourseId(offering.courseId);
      const verifiedDeptId = await safeDepartmentId(offering.departmentId || (offering as any).offeringDepartmentId);

      if (!verifiedCourseId) {
        console.warn('Skipping remote course offering insert: course not in database yet.');
        return { data: null, error: null };
      }

      let academicYearId = (offering as any).academicYearId;
      let semesterId = (offering as any).semesterId;

      if (!academicYearId) {
        const { data: ay } = await supabase.from('academic_years').select('id').limit(1).maybeSingle();
        if (ay) academicYearId = ay.id;
      }
      if (!semesterId) {
        const { data: sem } = await supabase.from('semesters').select('id').limit(1).maybeSingle();
        if (sem) semesterId = sem.id;
      }

      const payload: any = {
        course_id: verifiedCourseId,
        offering_department_id: verifiedDeptId,
        department_id: verifiedDeptId,
        is_active: offering.isActive !== undefined ? offering.isActive : true
      };
      if (academicYearId) payload.academic_year_id = toValidUuid(academicYearId);
      if (semesterId) payload.semester_id = toValidUuid(semesterId);

      const { data, error } = await resilientInsert('course_offerings', payload, true);
      if (error) throw error;
      return { data: data ? mapCourseOfferingFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.createOffering fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async deleteOffering(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const { error } = await supabase.from('course_offerings').delete().eq('id', validId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.deleteOffering fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async createGroup(group: Omit<CourseGroup, 'id'>): Promise<{ data: CourseGroup | null; error: Error | null }> {
    try {
      const verifiedOffId = await safeOfferingId(group.courseOfferingId);
      if (!verifiedOffId) {
        console.warn('Skipping remote course group insert: course offering not in database yet.');
        return { data: null, error: null };
      }

      const payload = {
        course_offering_id: verifiedOffId,
        group_name: group.groupName || (group as any).name || 'Group A',
        capacity: group.capacity || (group as any).maxStrength || 60,
        room: group.room || 'Room 101',
        is_active: group.isActive !== undefined ? group.isActive : true
      };
      const { data, error } = await resilientInsert('course_groups', payload, true);
      if (error) throw error;
      return { data: data ? mapCourseGroupFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.createGroup fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async updateCategory(id: string, cat: Partial<CourseCategory>): Promise<{ success: boolean; error: Error | null }> {
    try {
      const payload: any = {};
      if (cat.code !== undefined) payload.code = cat.code;
      if (cat.name !== undefined) payload.name = cat.name;
      if (cat.description !== undefined) payload.description = cat.description;
      if ((cat as any).colorHex !== undefined) payload.color_hex = (cat as any).colorHex;
      if (cat.isActive !== undefined) payload.is_active = cat.isActive;

      const validId = toValidUuid(id) || id;
      const { error } = await resilientUpdate('course_categories', validId, payload);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.updateCategory fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async updateOffering(id: string, offering: Partial<CourseOffering>): Promise<{ success: boolean; error: Error | null }> {
    try {
      const payload: any = {};
      if (offering.courseId !== undefined) {
        payload.course_id = await safeCourseId(offering.courseId);
      }
      if (offering.departmentId !== undefined) {
        payload.offering_department_id = await safeDepartmentId(offering.departmentId);
      }
      if (offering.isActive !== undefined) payload.is_active = offering.isActive;

      const validId = toValidUuid(id) || id;
      const { error } = await resilientUpdate('course_offerings', validId, payload);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.updateOffering fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async updateGroup(id: string, group: Partial<CourseGroup>): Promise<{ success: boolean; error: Error | null }> {
    try {
      const payload: any = {};
      if (group.courseOfferingId !== undefined) {
        payload.course_offering_id = await safeOfferingId(group.courseOfferingId);
      }
      if (group.groupName !== undefined) payload.group_name = group.groupName;
      if (group.capacity !== undefined) payload.capacity = group.capacity;
      if (group.room !== undefined) payload.room = group.room;
      if (group.isActive !== undefined) payload.is_active = group.isActive;

      const validId = toValidUuid(id) || id;
      const { error } = await resilientUpdate('course_groups', validId, payload);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.updateGroup fallback:', err?.message || err);
      return { success: false, error: err };
    }
  },

  async deleteGroup(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const validId = toValidUuid(id) || id;
      const { error } = await supabase.from('course_groups').delete().eq('id', validId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('Supabase courseService.deleteGroup fallback:', err?.message || err);
      return { success: false, error: err };
    }
  }
};
