import { UserRole, SystemSettings, MaintenanceConfig } from '../types';

/**
 * Checks if a specific role is currently restricted by System Maintenance Mode.
 * SUPER_ADMIN is always exempt to ensure administrative recovery.
 */
export function isRoleUnderMaintenance(role: UserRole, settings?: SystemSettings | null): boolean {
  if (!settings) return false;
  
  // SuperAdmin is always immune to lockouts
  if (role === 'SUPER_ADMIN') return false;

  const config = settings.maintenanceConfig;
  const isEnabled = settings.maintenanceMode || config?.enabled;

  if (!isEnabled) return false;

  // If no granular config is set, default behavior is ALL non-admin users
  if (!config || config.targetScope === 'ALL') {
    return true;
  }

  const affected = config.affectedRoles || [];

  // Exact match
  if (affected.includes(role)) {
    return true;
  }

  // Group alias matching: if TEACHER is selected, all faculty coordinator roles match
  const facultyGroup: UserRole[] = [
    'TEACHER',
    'CLASS_TUTOR',
    'COURSE_COORDINATOR',
    'ATTENDANCE_COORDINATOR'
  ];
  if (facultyGroup.includes(role) && affected.includes('TEACHER')) {
    return true;
  }

  return false;
}

/**
 * Checks if only attendance features are locked out (vs entire portal)
 */
export function isAttendanceOnlyLockout(settings?: SystemSettings | null): boolean {
  return !!settings?.maintenanceConfig?.lockoutAttendanceOnly;
}

/**
 * Formats affected roles into a clean, human-readable string
 */
export function getAffectedRolesSummary(config?: MaintenanceConfig): string {
  if (!config) return 'All Roles (Students, Teachers, HODs)';
  if (config.targetScope === 'ALL') return 'Everyone (Students, Teachers, HODs & Staff)';

  const names: string[] = [];
  const roles = config.affectedRoles || [];

  if (roles.includes('STUDENT')) names.push('Students');
  if (roles.includes('TEACHER')) names.push('Teachers & Faculty');
  if (roles.includes('HOD')) names.push('Department HODs');
  if (roles.includes('OFFICE_STAFF')) names.push('Office Staff');
  if (roles.includes('PRINCIPAL')) names.push('Principal');

  return names.length > 0 ? names.join(', ') : 'None Selected';
}
