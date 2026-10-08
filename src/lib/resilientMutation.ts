import { supabase } from './supabase';
import { securityShieldService } from '../services/securityShieldService';

function assertWriteConnectionAllowed(): { allowed: boolean; reason?: string } {
  if (securityShieldService.isDatabaseConnectionPaused()) {
    return {
      allowed: false,
      reason: 'Database write connection is PAUSED by Anti-Hack Security Protocol.'
    };
  }
  if (securityShieldService.isCurrentDeviceQuarantined()) {
    return {
      allowed: false,
      reason: 'This device is currently quarantined due to suspicious tampering.'
    };
  }
  return { allowed: true };
}

/**
 * Common column alias mappings for cross-version compatibility
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  student_status: ['status'],
  status: ['student_status', 'registration_status'],
  registration_status: ['status'],
  home_department_id: ['department_id'],
  department_id: ['home_department_id', 'offering_department_id'],
  offering_department_id: ['department_id'],
  university_register_number: ['university_reg_no', 'reg_no'],
  university_reg_no: ['university_register_number', 'reg_no'],
  phone: ['mobile_number', 'phone_number'],
  mobile_number: ['phone', 'phone_number'],
  phone_number: ['phone', 'mobile_number'],
  tutorial_hours: ['theory_hours', 'lecture_hours'],
  theory_hours: ['tutorial_hours', 'lecture_hours'],
  room: ['room_number'],
  room_number: ['room'],
  course_category_id: ['category_id'],
  category_id: ['course_category_id'],
  employee_id: ['employee_code'],
  employee_code: ['employee_id'],
  day_of_week: ['weekday'],
  weekday: ['day_of_week']
};

/**
 * Resilient Insert:
 * Catches PostgREST schema cache errors (e.g. "Could not find the 'xyz' column of 'table' in the schema cache"),
 * swaps with known alternative column names or strips missing columns, and retries automatically.
 */
export async function resilientInsert<T = any>(
  table: string,
  payload: Record<string, any>,
  selectSingle = true
): Promise<{ data: T | null; error: any }> {
  const gate = assertWriteConnectionAllowed();
  if (!gate.allowed) {
    return { data: null, error: new Error(`Security Block: ${gate.reason}`) };
  }

  let currentPayload = { ...payload };
  const triedStripped = new Set<string>();

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const query = supabase.from(table).insert([currentPayload]);
      const res = selectSingle ? await query.select().single() : await query.select();

      if (!res.error) {
        return { data: (selectSingle ? res.data : (res.data as any)?.[0]) as T, error: null };
      }

      const errorMsg = res.error.message || '';
      const match = errorMsg.match(/Could not find the '([^']+)' column of/i);

      if (match && match[1]) {
        const missingCol = match[1];
        if (triedStripped.has(missingCol)) {
          return { data: null, error: res.error };
        }
        triedStripped.add(missingCol);

        const val = currentPayload[missingCol];
        delete currentPayload[missingCol];

        // Check if an alias exists that isn't yet in currentPayload
        const aliases = COLUMN_ALIASES[missingCol] || [];
        for (const alias of aliases) {
          if (!(alias in currentPayload) && !triedStripped.has(alias) && val !== undefined) {
            currentPayload[alias] = val;
            break;
          }
        }
        continue;
      }

      return { data: null, error: res.error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  return { data: null, error: new Error(`Failed resilient insert into ${table} after multiple schema retries`) };
}

/**
 * Resilient Update:
 * Automatically strips columns that do not exist in the database schema cache and retries.
 */
export async function resilientUpdate(
  table: string,
  id: string,
  payload: Record<string, any>
): Promise<{ success: boolean; error: any }> {
  const gate = assertWriteConnectionAllowed();
  if (!gate.allowed) {
    return { success: false, error: new Error(`Security Block: ${gate.reason}`) };
  }

  let currentPayload = { ...payload };
  const triedStripped = new Set<string>();

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      if (Object.keys(currentPayload).length === 0) {
        return { success: true, error: null };
      }

      const res = await supabase.from(table).update(currentPayload).eq('id', id);

      if (!res.error) {
        return { success: true, error: null };
      }

      const errorMsg = res.error.message || '';
      const match = errorMsg.match(/Could not find the '([^']+)' column of/i);

      if (match && match[1]) {
        const missingCol = match[1];
        if (triedStripped.has(missingCol)) {
          return { success: false, error: res.error };
        }
        triedStripped.add(missingCol);

        const val = currentPayload[missingCol];
        delete currentPayload[missingCol];

        const aliases = COLUMN_ALIASES[missingCol] || [];
        for (const alias of aliases) {
          if (!(alias in currentPayload) && !triedStripped.has(alias) && val !== undefined) {
            currentPayload[alias] = val;
            break;
          }
        }
        continue;
      }

      return { success: false, error: res.error };
    } catch (err: any) {
      return { success: false, error: err };
    }
  }

  return { success: false, error: new Error(`Failed resilient update on ${table} after schema retries`) };
}

/**
 * Resilient Upsert for batch records
 */
export async function resilientUpsert<T = any>(
  table: string,
  records: Record<string, any>[],
  options?: { onConflict?: string }
): Promise<{ success: boolean; error: any }> {
  const gate = assertWriteConnectionAllowed();
  if (!gate.allowed) {
    return { success: false, error: new Error(`Security Block: ${gate.reason}`) };
  }

  if (!records || records.length === 0) {
    return { success: true, error: null };
  }

  let currentRecords = records.map(r => ({ ...r }));
  const triedStripped = new Set<string>();

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await supabase.from(table).upsert(currentRecords, options);

      if (!res.error) {
        return { success: true, error: null };
      }

      const errorMsg = res.error.message || '';
      const match = errorMsg.match(/Could not find the '([^']+)' column of/i);

      if (match && match[1]) {
        const missingCol = match[1];
        if (triedStripped.has(missingCol)) {
          return { success: false, error: res.error };
        }
        triedStripped.add(missingCol);

        currentRecords = currentRecords.map(rec => {
          const newRec = { ...rec };
          const val = newRec[missingCol];
          delete newRec[missingCol];
          const aliases = COLUMN_ALIASES[missingCol] || [];
          for (const alias of aliases) {
            if (!(alias in newRec) && !triedStripped.has(alias) && val !== undefined) {
              newRec[alias] = val;
              break;
            }
          }
          return newRec;
        });
        continue;
      }

      return { success: false, error: res.error };
    } catch (err: any) {
      return { success: false, error: err };
    }
  }

  return { success: false, error: new Error(`Failed resilient upsert on ${table}`) };
}
