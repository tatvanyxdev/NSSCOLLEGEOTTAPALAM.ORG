import {
  UserRole,
  TargetScope,
  Student,
  Faculty,
  SemesterEnrollment,
  StudentCourseRegistration,
  Programme,
  Department
} from '../types';

export interface UserAcademicContext {
  role: UserRole;
  userId?: string;
  studentId?: string;
  facultyId?: string;
  departmentId?: string;
  programmeId?: string;
  batchId?: string;
  semesterNumber?: number;
  courseGroupIds: string[];
  isEnrolled: boolean;
}

/**
 * Resolves the complete academic context for the currently active user/student/faculty.
 * Supabase Auth / User -> Student Profile -> Semester Enrollment -> Programme -> Department -> Batch -> Course Registrations -> Course Groups.
 */
export function resolveUserAcademicContext(params: {
  user: any;
  activeRole: UserRole;
  students: Student[];
  faculty: Faculty[];
  semesterEnrollments: SemesterEnrollment[];
  studentCourseRegistrations: StudentCourseRegistration[];
  programmes: Programme[];
  departments: Department[];
}): UserAcademicContext {
  const {
    user,
    activeRole,
    students,
    faculty: facultyList,
    semesterEnrollments,
    studentCourseRegistrations,
    programmes,
    departments
  } = params;

  if (activeRole === 'STUDENT') {
    // 1. Resolve student record strictly by linked profile or verified matching
    let student: Student | null = null;
    if (user?.studentProfile) {
      student = user.studentProfile;
    } else if (user?.id) {
      student =
        students.find(
          s =>
            s.id === user.id ||
            (s as any).auth_user_id === user.id ||
            (s.username && user.name && s.username.toLowerCase() === user.name.toLowerCase()) ||
            (s.universityRegisterNumber &&
              user.name &&
              s.universityRegisterNumber.toLowerCase() === user.name.toLowerCase()) ||
            (user.email && s.email && s.email.toLowerCase() === user.email.toLowerCase())
        ) || null;
    }

    if (!student && students.length > 0) {
      // In dev or preview if user selected Student role but haven't linked:
      // check if user has custom selection saved or default to null so user can select their authentic profile
      const storedStudentId = localStorage.getItem('nss_active_student_id');
      if (storedStudentId) {
        student = students.find(s => s.id === storedStudentId) || null;
      }
    }

    if (student) {
      // Find latest semester enrollment
      const studentEnrollments = semesterEnrollments.filter(e => e.studentId === student!.id);
      const activeEnrollment =
        studentEnrollments.find(e => e.status === 'ENROLLED') ||
        studentEnrollments[studentEnrollments.length - 1];

      const currentSem = activeEnrollment?.semesterNumber || student.currentSemester || 1;

      // Find registrations and enrolled course groups
      const registrations = studentCourseRegistrations.filter(r => r.studentId === student!.id);
      const courseGroupIds = registrations.map(r => r.courseGroupId).filter(Boolean);

      // Find department & programme
      const programme = programmes.find(p => p.id === student!.programmeId);
      const departmentId = student.homeDepartmentId || programme?.departmentId;

      return {
        role: 'STUDENT',
        userId: user?.id,
        studentId: student.id,
        departmentId,
        programmeId: student.programmeId,
        semesterNumber: currentSem,
        courseGroupIds,
        isEnrolled: true
      };
    }

    return {
      role: 'STUDENT',
      userId: user?.id,
      courseGroupIds: [],
      isEnrolled: false
    };
  }

  // If Faculty, HOD, Tutor, Principal
  const facultyMember =
    facultyList.find(
      f =>
        f.id === user?.id ||
        (f.username && user?.name && f.username.toLowerCase() === user.name.toLowerCase()) ||
        (user?.email && f.email && f.email.toLowerCase() === user.email.toLowerCase())
    ) || null;

  const departmentId =
    facultyMember?.departmentId ||
    user?.facultyProfile?.departmentId ||
    user?.departmentId;

  return {
    role: activeRole,
    userId: user?.id,
    facultyId: facultyMember?.id,
    departmentId,
    courseGroupIds: [],
    isEnrolled: true
  };
}

/**
 * Audience targeting evaluation engine.
 * Evaluates whether any content (Notice, Circular, Event, Resource, Notification, Emergency Alert)
 * targets the provided UserAcademicContext.
 */
export function isItemRelevantToAudience(
  item: {
    scope?: TargetScope | string;
    targetDepartmentId?: string | null;
    targetProgrammeId?: string | null;
    targetBatchId?: string | null;
    targetSemester?: number | null;
    targetRoles?: UserRole[] | string[];
    targetUserIds?: string[];
    departmentId?: string | null;
    programmeId?: string | null;
    semester?: number | null;
  },
  context: UserAcademicContext
): boolean {
  // Super Admin and Principal see all institutional items
  if (context.role === 'SUPER_ADMIN' || context.role === 'PRINCIPAL') {
    return true;
  }

  // If specific roles are specified, check if user's active role is included
  if (item.targetRoles && item.targetRoles.length > 0) {
    const roles = item.targetRoles.map(r => String(r).toUpperCase());
    if (!roles.includes('ALL') && !roles.includes(context.role)) {
      return false;
    }
  }

  // If targeted to specific individual user IDs
  if (item.targetUserIds && item.targetUserIds.length > 0) {
    const isTargeted =
      (context.userId && item.targetUserIds.includes(context.userId)) ||
      (context.studentId && item.targetUserIds.includes(context.studentId)) ||
      (context.facultyId && item.targetUserIds.includes(context.facultyId));
    if (isTargeted) return true;
    if (!item.scope || item.scope === 'SELECTED_USERS') return false;
  }

  const scope = (item.scope || 'COLLEGE').toUpperCase();

  // 1. College-wide scope applies to everyone
  if (scope === 'COLLEGE' || scope === 'ALL') {
    return true;
  }

  // 2. Department scope
  if (scope === 'DEPARTMENT') {
    const deptId = item.targetDepartmentId || item.departmentId;
    if (!deptId) return true;
    return deptId === context.departmentId;
  }

  // 3. Programme scope
  if (scope === 'PROGRAMME') {
    const progId = item.targetProgrammeId || item.programmeId;
    if (!progId) return true;
    return progId === context.programmeId;
  }

  // 4. Semester scope
  if (scope === 'SEMESTER') {
    const sem = item.targetSemester || item.semester;
    if (!sem) return true;
    if (context.role !== 'STUDENT') return true; // Faculty may oversee semesters
    return sem === context.semesterNumber;
  }

  // 5. Batch scope
  if (scope === 'BATCH') {
    if (!item.targetBatchId) return true;
    return item.targetBatchId === context.batchId;
  }

  return true;
}
