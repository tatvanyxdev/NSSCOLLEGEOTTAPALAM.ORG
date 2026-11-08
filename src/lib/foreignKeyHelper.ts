import { supabase } from './supabase';
import { toValidUuid } from './uuidMapping';
import { initialDepartments, initialProgrammes } from '../data/initialData';

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

const codeToIdMap: {
  departments: Map<string, string>;
  programmes: Map<string, string>;
} = {
  departments: new Map(),
  programmes: new Map()
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
      codeToIdMap.departments.clear();
      deptRes.value.data.forEach((r: any) => {
        if (r.id) idCache.departments.add(r.id);
        if (r.code && r.id) codeToIdMap.departments.set(String(r.code).toUpperCase(), r.id);
      });
    }
    if (progRes.status === 'fulfilled' && progRes.value.data) {
      idCache.programmes.clear();
      codeToIdMap.programmes.clear();
      progRes.value.data.forEach((r: any) => {
        if (r.id) idCache.programmes.add(r.id);
        if (r.code && r.id) codeToIdMap.programmes.set(String(r.code).toUpperCase(), r.id);
      });
    }
    if (catRes.status === 'fulfilled' && catRes.value.data) {
      idCache.course_categories.clear();
      catRes.value.data.forEach((r: any) => {
        if (r.id) idCache.course_categories.add(r.id);
      });
    }
    if (crsRes.status === 'fulfilled' && crsRes.value.data) {
      idCache.courses.clear();
      crsRes.value.data.forEach((r: any) => {
        if (r.id) idCache.courses.add(r.id);
      });
    }
    if (offRes.status === 'fulfilled' && offRes.value.data) {
      idCache.course_offerings.clear();
      offRes.value.data.forEach((r: any) => {
        if (r.id) idCache.course_offerings.add(r.id);
      });
    }
    if (grpRes.status === 'fulfilled' && grpRes.value.data) {
      idCache.course_groups.clear();
      grpRes.value.data.forEach((r: any) => {
        if (r.id) idCache.course_groups.add(r.id);
      });
    }
    if (facRes.status === 'fulfilled' && facRes.value.data) {
      idCache.faculty.clear();
      facRes.value.data.forEach((r: any) => {
        if (r.id) idCache.faculty.add(r.id);
      });
    }
    if (stuRes.status === 'fulfilled' && stuRes.value.data) {
      idCache.students.clear();
      stuRes.value.data.forEach((r: any) => {
        if (r.id) idCache.students.add(r.id);
      });
    }
    if (perRes.status === 'fulfilled' && perRes.value.data) {
      idCache.timetable_periods.clear();
      perRes.value.data.forEach((r: any) => {
        if (r.id) idCache.timetable_periods.add(r.id);
      });
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

/**
 * Ensures that a valid programme exists in Supabase.
 * If the provided id/code is not found, it checks by code, auto-seeds from initialProgrammes,
 * or falls back to the first available programme in Supabase.
 */
export async function ensureProgrammeInSupabase(idOrCode?: string | null): Promise<string | null> {
  const verified = await verifyId('programmes', idOrCode);
  if (verified) return verified;

  await refreshIdCache();

  // Try matching via code
  const candidate = (idOrCode || 'prog-bsc-cs').trim();
  const matchedInitial = initialProgrammes.find(
    p => p.id === candidate || p.code.toUpperCase() === candidate.toUpperCase()
  );

  const codeToLookup = matchedInitial ? matchedInitial.code.toUpperCase() : candidate.toUpperCase();
  if (codeToIdMap.programmes.has(codeToLookup)) {
    return codeToIdMap.programmes.get(codeToLookup)!;
  }

  // Check Supabase directly by code
  try {
    const { data: progByCode } = await supabase
      .from('programmes')
      .select('id, code')
      .eq('code', codeToLookup)
      .maybeSingle();

    if (progByCode?.id) {
      idCache.programmes.add(progByCode.id);
      codeToIdMap.programmes.set(codeToLookup, progByCode.id);
      return progByCode.id;
    }
  } catch (e) {
    console.warn('Error querying programme by code:', e);
  }

  // If initial programme match exists, auto-insert into Supabase
  const progToInsert = matchedInitial || initialProgrammes[0];
  if (progToInsert) {
    try {
      const validUuid = toValidUuid(progToInsert.id) || undefined;
      const { data: newProg, error } = await supabase
        .from('programmes')
        .insert([{
          id: validUuid,
          code: progToInsert.code,
          name: progToInsert.name,
          type: progToInsert.type || 'UG',
          duration_years: progToInsert.durationYears || 4,
          total_semesters: progToInsert.totalSemesters || 8,
          expected_strength: progToInsert.expectedStrength || 50,
          max_strength: progToInsert.maxStrength || 60,
          is_active: true
        }])
        .select('id')
        .maybeSingle();

      if (!error && newProg?.id) {
        idCache.programmes.add(newProg.id);
        codeToIdMap.programmes.set(progToInsert.code.toUpperCase(), newProg.id);
        return newProg.id;
      }
    } catch (e) {
      console.warn('Error auto-inserting programme into Supabase:', e);
    }
  }

  // Fallback: Return any existing programme ID if available in database
  if (idCache.programmes.size > 0) {
    return Array.from(idCache.programmes)[0];
  }

  // Final fallback: return deterministic UUID for candidate
  return toValidUuid(candidate) || null;
}

/**
 * Ensures that a valid department exists in Supabase.
 */
export async function ensureDepartmentInSupabase(idOrCode?: string | null): Promise<string | null> {
  const verified = await verifyId('departments', idOrCode);
  if (verified) return verified;

  await refreshIdCache();

  const candidate = (idOrCode || 'dept-cs').trim();
  const matchedInitial = initialDepartments.find(
    d => d.id === candidate || d.code.toUpperCase() === candidate.toUpperCase()
  );

  const codeToLookup = matchedInitial ? matchedInitial.code.toUpperCase() : candidate.toUpperCase();
  if (codeToIdMap.departments.has(codeToLookup)) {
    return codeToIdMap.departments.get(codeToLookup)!;
  }

  try {
    const { data: deptByCode } = await supabase
      .from('departments')
      .select('id, code')
      .eq('code', codeToLookup)
      .maybeSingle();

    if (deptByCode?.id) {
      idCache.departments.add(deptByCode.id);
      codeToIdMap.departments.set(codeToLookup, deptByCode.id);
      return deptByCode.id;
    }
  } catch (e) {
    console.warn('Error querying department by code:', e);
  }

  const deptToInsert = matchedInitial || initialDepartments[0];
  if (deptToInsert) {
    try {
      const validUuid = toValidUuid(deptToInsert.id) || undefined;
      const { data: newDept, error } = await supabase
        .from('departments')
        .insert([{
          id: validUuid,
          code: deptToInsert.code,
          name: deptToInsert.name,
          type: deptToInsert.type || 'ACADEMIC',
          is_active: true
        }])
        .select('id')
        .maybeSingle();

      if (!error && newDept?.id) {
        idCache.departments.add(newDept.id);
        codeToIdMap.departments.set(deptToInsert.code.toUpperCase(), newDept.id);
        return newDept.id;
      }
    } catch (e) {
      console.warn('Error auto-inserting department into Supabase:', e);
    }
  }

  if (idCache.departments.size > 0) {
    return Array.from(idCache.departments)[0];
  }

  return toValidUuid(candidate) || null;
}

export async function safeDepartmentId(id?: string | null): Promise<string | null> {
  const verified = await verifyId('departments', id);
  if (verified) return verified;
  return ensureDepartmentInSupabase(id);
}

export async function safeProgrammeId(id?: string | null): Promise<string | null> {
  const verified = await verifyId('programmes', id);
  if (verified) return verified;
  return ensureProgrammeInSupabase(id);
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

