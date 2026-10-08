import { supabase } from './supabase';
import { toValidUuid } from './uuidMapping';

// In-memory cache of valid Supabase IDs to avoid repetitive queries
const idCache: Record<string, Set<string>> = {
  departments: new Set(),
  programmes: new Set(),
  course_categories: new Set(),
  courses: new Set(),
  course_offerings: new Set(),
  course_groups: new Set(),
  faculty: new Set(),
  students: new Set(),
  timetable_periods: new Set()
};

let lastCacheRefresh = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export async function refreshIdCache(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastCacheRefresh < CACHE_TTL_MS && idCache.departments.size > 0) {
    return;
  }

  try {
    const [
      deptRes,
      progRes,
      catRes,
      crsRes,
      offRes,
      grpRes,
      facRes,
      stuRes,
      perRes
    ] = await Promise.allSettled([
      supabase.from('departments').select('id, code'),
      supabase.from('programmes').select('id, code'),
      supabase.from('course_categories').select('id, code'),
      supabase.from('courses').select('id, course_code'),
      supabase.from('course_offerings').select('id'),
      supabase.from('course_groups').select('id'),
      supabase.from('faculty').select('id, employee_id'),
      supabase.from('students').select('id, admission_number'),
      supabase.from('timetable_periods').select('id')
    ]);

    if (deptRes.status === 'fulfilled' && deptRes.value.data) {
      idCache.departments.clear();
      deptRes.value.data.forEach((r: any) => idCache.departments.add(r.id));
    }
    if (progRes.status === 'fulfilled' && progRes.value.data) {
      idCache.programmes.clear();
      progRes.value.data.forEach((r: any) => idCache.programmes.add(r.id));
    }
    if (catRes.status === 'fulfilled' && catRes.value.data) {
      idCache.course_categories.clear();
      catRes.value.data.forEach((r: any) => idCache.course_categories.add(r.id));
    }
    if (crsRes.status === 'fulfilled' && crsRes.value.data) {
      idCache.courses.clear();
      crsRes.value.data.forEach((r: any) => idCache.courses.add(r.id));
    }
    if (offRes.status === 'fulfilled' && offRes.value.data) {
      idCache.course_offerings.clear();
      offRes.value.data.forEach((r: any) => idCache.course_offerings.add(r.id));
    }
    if (grpRes.status === 'fulfilled' && grpRes.value.data) {
      idCache.course_groups.clear();
      grpRes.value.data.forEach((r: any) => idCache.course_groups.add(r.id));
    }
    if (facRes.status === 'fulfilled' && facRes.value.data) {
      idCache.faculty.clear();
      facRes.value.data.forEach((r: any) => idCache.faculty.add(r.id));
    }
    if (stuRes.status === 'fulfilled' && stuRes.value.data) {
      idCache.students.clear();
      stuRes.value.data.forEach((r: any) => idCache.students.add(r.id));
    }
    if (perRes.status === 'fulfilled' && perRes.value.data) {
      idCache.timetable_periods.clear();
      perRes.value.data.forEach((r: any) => idCache.timetable_periods.add(r.id));
    }

    lastCacheRefresh = now;
  } catch (err) {
    console.warn('Failed to refresh Supabase ID cache:', err);
  }
}

/**
 * Checks if a specific ID exists in a given table.
 * If not in cache, does a quick single check against Supabase.
 */
async function verifyId(table: keyof typeof idCache, id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const validUuid = toValidUuid(id);
  if (!validUuid) return null;

  // Check memory cache first
  if (idCache[table].has(validUuid)) {
    return validUuid;
  }

  // Refresh cache if stale
  await refreshIdCache();
  if (idCache[table].has(validUuid)) {
    return validUuid;
  }

  // Final direct check against DB
  try {
    const { data } = await supabase.from(table).select('id').eq('id', validUuid).maybeSingle();
    if (data?.id) {
      idCache[table].add(data.id);
      return data.id;
    }
  } catch {
    // If query fails or table empty
  }

  return null;
}

export async function safeDepartmentId(id?: string | null): Promise<string | null> {
  return verifyId('departments', id);
}

export async function safeProgrammeId(id?: string | null): Promise<string | null> {
  return verifyId('programmes', id);
}

export async function safeCategoryId(id?: string | null): Promise<string | null> {
  return verifyId('course_categories', id);
}

export async function safeCourseId(id?: string | null): Promise<string | null> {
  return verifyId('courses', id);
}

export async function safeOfferingId(id?: string | null): Promise<string | null> {
  return verifyId('course_offerings', id);
}

export async function safeGroupId(id?: string | null): Promise<string | null> {
  return verifyId('course_groups', id);
}

export async function safeFacultyId(id?: string | null): Promise<string | null> {
  return verifyId('faculty', id);
}

export async function safeStudentId(id?: string | null): Promise<string | null> {
  return verifyId('students', id);
}

export async function safePeriodId(id?: string | null): Promise<string | null> {
  return verifyId('timetable_periods', id);
}
