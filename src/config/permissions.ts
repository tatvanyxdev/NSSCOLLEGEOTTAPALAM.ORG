import { UserRole } from '../types';

/**
 * ==============================================================================
 * CENTRALIZED ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS SYSTEM
 * ==============================================================================
 * Single source of truth for authorization across all portals.
 * Enforces strict principle of least privilege.
 * Unauthorized buttons, menus, actions, forms, and routes must NOT be rendered.
 * ==============================================================================
 */

export type ResourceType =
  | 'faculty'
  | 'students'
  | 'attendance'
  | 'special_attendance'
  | 'courses'
  | 'course_groups'
  | 'course_offerings'
  | 'course_registrations'
  | 'departments'
  | 'programmes'
  | 'categories'
  | 'timetable'
  | 'announcements'
  | 'reports'
  | 'settings'
  | 'audit_logs';

export type ActionType =
  | 'read'
  | 'read_own'
  | 'read_assigned'
  | 'read_department'
  | 'read_college'
  | 'read_directory'
  | 'create'
  | 'update'
  | 'delete'
  | 'mark_assigned'
  | 'mark_department'
  | 'mark_all'
  | 'request_correction'
  | 'approve_correction'
  | 'assign_substitute'
  | 'assign_course'
  | 'manage_roles'
  | 'register'
  | 'bulk_register'
  | 'export_csv'
  | 'export_admin';

// Resource-action permissions matrix per role
export const ROLE_PERMISSIONS: Record<UserRole, Partial<Record<ResourceType, ActionType[]>>> = {
  SUPER_ADMIN: {
    faculty: ['read', 'read_directory', 'create', 'update', 'delete', 'assign_course', 'manage_roles'],
    students: ['read', 'create', 'update', 'delete', 'export_admin'],
    attendance: ['read_college', 'mark_all', 'request_correction', 'approve_correction', 'assign_substitute'],
    special_attendance: ['read', 'create', 'update', 'delete', 'read_college'],
    courses: ['read_all' as ActionType, 'create', 'update', 'delete'],
    course_groups: ['read' as ActionType, 'create', 'update', 'delete'],
    course_offerings: ['read' as ActionType, 'create', 'update', 'delete'],
    course_registrations: ['read_all' as ActionType, 'register', 'bulk_register'],
    departments: ['read', 'create', 'update', 'delete'],
    programmes: ['read', 'create', 'update', 'delete'],
    categories: ['read', 'create', 'update', 'delete'],
    timetable: ['read_college', 'create', 'update', 'delete'],
    announcements: ['read', 'create', 'delete'],
    reports: ['read_college', 'export_csv'],
    settings: ['read', 'update'],
    audit_logs: ['read']
  },

  PRINCIPAL: {
    faculty: ['read', 'read_directory', 'create', 'update', 'delete', 'assign_course'],
    students: ['read', 'create', 'update', 'delete', 'export_admin'],
    attendance: ['read_college', 'approve_correction'],
    special_attendance: ['read', 'create', 'update', 'delete', 'read_college'],
    courses: ['read_all' as ActionType, 'create', 'update', 'delete'],
    course_groups: ['read' as ActionType, 'create', 'update', 'delete'],
    course_offerings: ['read' as ActionType, 'create', 'update', 'delete'],
    course_registrations: ['read_all' as ActionType, 'register', 'bulk_register'],
    departments: ['read', 'create', 'update', 'delete'],
    programmes: ['read', 'create', 'update', 'delete'],
    categories: ['read', 'create', 'update', 'delete'],
    timetable: ['read_college', 'create', 'update', 'delete'],
    announcements: ['read', 'create', 'delete'],
    reports: ['read_college', 'export_csv']
  },

  HOD: {
    faculty: ['read_department', 'create', 'update', 'assign_course'],
    students: ['read_department', 'create', 'update', 'delete'],
    attendance: ['read_department', 'approve_correction', 'assign_substitute', 'mark_department'],
    special_attendance: ['read', 'create', 'update', 'read_department'],
    courses: ['read_department', 'create', 'update', 'delete'],
    course_groups: ['read_department' as ActionType, 'create', 'update', 'delete'],
    course_offerings: ['read_department' as ActionType, 'create', 'update', 'delete'],
    course_registrations: ['read_department', 'register', 'bulk_register'],
    departments: ['read'],
    programmes: ['read'],
    categories: ['read'],
    timetable: ['read_department', 'create', 'update', 'delete'],
    announcements: ['read', 'create', 'delete'],
    reports: ['read_department', 'export_csv']
  },

  TEACHER: {
    faculty: [],
    students: ['read_assigned'],
    attendance: ['read_assigned', 'mark_assigned', 'request_correction'],
    courses: ['read_assigned'],
    course_groups: ['read_assigned' as ActionType],
    course_offerings: ['read_assigned' as ActionType],
    course_registrations: ['read_assigned'],
    timetable: ['read_assigned'],
    announcements: ['read', 'create']
  },

  CLASS_TUTOR: {
    faculty: [],
    students: ['read_assigned', 'create', 'update'],
    attendance: ['read_assigned', 'mark_assigned', 'request_correction'],
    courses: ['read_assigned'],
    course_groups: ['read_assigned' as ActionType],
    course_offerings: ['read_assigned' as ActionType],
    course_registrations: ['read_assigned', 'register', 'bulk_register'],
    timetable: ['read_assigned'],
    announcements: ['read', 'create'],
    reports: ['read_college' as ActionType, 'export_csv']
  },

  COURSE_COORDINATOR: {
    faculty: [],
    students: ['read_assigned'],
    attendance: ['read_assigned', 'mark_assigned'],
    courses: ['read_assigned', 'update'],
    course_groups: ['read_assigned' as ActionType, 'create', 'update'],
    course_offerings: ['read_assigned' as ActionType, 'update'],
    course_registrations: ['read_assigned'],
    timetable: ['read_assigned'],
    announcements: ['read', 'create'],
    reports: ['read_college' as ActionType, 'export_csv']
  },

  ATTENDANCE_COORDINATOR: {
    faculty: [],
    students: ['read'],
    attendance: ['read_college', 'approve_correction', 'assign_substitute'],
    special_attendance: ['read', 'create', 'update', 'read_college'],
    courses: ['read_all' as ActionType],
    course_groups: ['read' as ActionType],
    course_offerings: ['read' as ActionType],
    course_registrations: ['read_all' as ActionType],
    timetable: ['read_college'],
    announcements: ['read', 'create'],
    reports: ['read_college', 'export_csv']
  },

  OFFICE_STAFF: {
    faculty: [],
    students: ['read', 'create', 'update', 'delete', 'export_admin'],
    course_registrations: ['read_all' as ActionType, 'register', 'bulk_register'],
    departments: ['read'],
    programmes: ['read'],
    announcements: ['read'],
    reports: ['read_college', 'export_csv']
  },

  STUDENT: {
    faculty: [],
    students: ['read_own'],
    attendance: ['read_own', 'request_correction'],
    courses: ['read_own' as ActionType],
    course_groups: ['read_own' as ActionType],
    course_offerings: ['read_own' as ActionType],
    course_registrations: ['read_own'],
    timetable: ['read_own'],
    announcements: ['read']
  }
};

// Allowed view tabs per role
export const ROLE_ALLOWED_VIEWS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    'dashboard',
    'attendance',
    'corrections',
    'special-attendance',
    'timetable',
    'departments',
    'programmes',
    'course-categories',
    'courses',
    'students',
    'staff-enrollment',
    'registrations',
    'faculty',
    'reports',
    'announcements',
    'settings'
  ],

  PRINCIPAL: [
    'dashboard',
    'attendance',
    'corrections',
    'special-attendance',
    'timetable',
    'departments',
    'programmes',
    'course-categories',
    'courses',
    'students',
    'staff-enrollment',
    'registrations',
    'faculty',
    'reports',
    'announcements'
  ],

  HOD: [
    'dashboard',
    'attendance',
    'corrections',
    'special-attendance',
    'timetable',
    'departments',
    'programmes',
    'courses',
    'students',
    'registrations',
    'reports',
    'announcements'
  ],

  TEACHER: [
    'dashboard',
    'attendance',
    'corrections',
    'timetable',
    'courses',
    'registrations',
    'students',
    'announcements'
  ],

  CLASS_TUTOR: [
    'dashboard',
    'attendance',
    'corrections',
    'timetable',
    'courses',
    'registrations',
    'students',
    'reports',
    'announcements'
  ],

  COURSE_COORDINATOR: [
    'dashboard',
    'attendance',
    'timetable',
    'courses',
    'registrations',
    'students',
    'reports',
    'announcements'
  ],

  ATTENDANCE_COORDINATOR: [
    'dashboard',
    'attendance',
    'corrections',
    'special-attendance',
    'timetable',
    'students',
    'reports',
    'announcements'
  ],

  OFFICE_STAFF: [
    'dashboard',
    'students',
    'registrations',
    'programmes',
    'departments',
    'reports',
    'announcements'
  ],

  STUDENT: [
    'dashboard',
    'attendance',
    'timetable',
    'registrations',
    'students',
    'announcements'
  ]
};

/**
 * Check if a role has permission to perform an action on a resource
 */
export function can(
  role: UserRole | undefined,
  resource: ResourceType,
  action: ActionType
): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;

  const perms = ROLE_PERMISSIONS[role]?.[resource];
  if (!perms) return false;

  return perms.includes(action);
}

/**
 * Check if a role is allowed to access a specific navigation view / tab
 */
export function canAccessView(role: UserRole | undefined, viewId: string): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;

  const allowedViews = ROLE_ALLOWED_VIEWS[role] || ['dashboard'];
  return allowedViews.includes(viewId);
}

/**
 * Check if role is strictly read-only (e.g. Student)
 */
export function isReadOnlyRole(role: UserRole | undefined): boolean {
  return role === 'STUDENT';
}

/**
 * Check if the role is scoped to a specific department (e.g. HOD)
 */
export function isDepartmentScoped(role: UserRole | undefined): boolean {
  return role === 'HOD';
}

/**
 * Check if HOD or user is authorized for specific department
 */
export function canManageDepartmentScope(
  role: UserRole | undefined,
  userDepartmentId: string | undefined,
  targetDepartmentId: string | undefined
): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  if (role === 'HOD') {
    if (!userDepartmentId || !targetDepartmentId) return true; // fallback if unlinked in demo
    return userDepartmentId === targetDepartmentId;
  }
  return false;
}

/**
 * Friendly Portal and Role presentation metadata
 */
export function getRolePortalMeta(role: UserRole): {
  portalName: string;
  badgeLabel: string;
  badgeColor: string;
  isReadOnly: boolean;
} {
  switch (role) {
    case 'STUDENT':
      return {
        portalName: 'Student Portal (Read-Only)',
        badgeLabel: 'Student',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        isReadOnly: true
      };
    case 'TEACHER':
      return {
        portalName: 'Faculty & Teacher Portal',
        badgeLabel: 'Faculty',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        isReadOnly: false
      };
    case 'CLASS_TUTOR':
      return {
        portalName: 'Class Tutor Portal',
        badgeLabel: 'Class Tutor',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
        isReadOnly: false
      };
    case 'HOD':
      return {
        portalName: 'Head of Department Portal',
        badgeLabel: 'HOD',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        isReadOnly: false
      };
    case 'COURSE_COORDINATOR':
      return {
        portalName: 'Course Coordinator Portal',
        badgeLabel: 'Course Coord',
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
        isReadOnly: false
      };
    case 'ATTENDANCE_COORDINATOR':
      return {
        portalName: 'Attendance Coordinator Portal',
        badgeLabel: 'Attendance Coord',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        isReadOnly: false
      };
    case 'OFFICE_STAFF':
      return {
        portalName: 'Administrative Office Portal',
        badgeLabel: 'Office Staff',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        isReadOnly: false
      };
    case 'PRINCIPAL':
      return {
        portalName: 'Principal Office Portal',
        badgeLabel: 'Principal',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        isReadOnly: false
      };
    case 'SUPER_ADMIN':
      return {
        portalName: 'Super Administrator Portal',
        badgeLabel: 'Super Admin',
        badgeColor: 'bg-slate-900 text-white border-slate-900',
        isReadOnly: false
      };
    default:
      return {
        portalName: 'Institutional Portal',
        badgeLabel: 'User',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        isReadOnly: false
      };
  }
}

/**
 * Checks if a user role is permitted to create/manage special institutional attendance events
 */
export const canManageSpecialAttendance = (role: UserRole): boolean => {
  return role === 'SUPER_ADMIN' || role === 'PRINCIPAL' || role === 'HOD' || role === 'ATTENDANCE_COORDINATOR';
};

