import {
  SystemSettings,
  Department,
  Programme,
  AcademicYear,
  AdmissionBatch,
  Semester,
  CourseCategory,
  Course,
  CourseOffering,
  CourseGroup,
  Student,
  SemesterEnrollment,
  StudentCourseRegistration,
  Faculty,
  FacultyCourseAssignment,
  TimetablePeriod,
  TimetableEntry,
  ClassSession,
  AttendanceRecord,
  AttendanceCorrectionRequest,
  SubstituteAssignment,
  Announcement,
  AppNotification,
  AuditLog,
  SpecialAttendanceEvent,
  SpecialAttendanceRecord,
  FacultySubjectRequest,
  FacultyAssignmentHistory
} from '../types';

export const initialSystemSettings: SystemSettings = {
  id: 'settings-1',
  collegeName: 'NSS COLLEGE OTTAPALAM',
  collegeCode: 'NSS-OTP-1961',
  affiliation: 'Affiliated to University of Calicut',
  accreditation: "Accredited with 'A' Grade by NAAC",
  address: 'NSS College, Ottapalam, Palakkad District, Kerala - 679103',
  contactEmail: 'nsscollegeottapalam@gmail.com',
  contactPhone: '+91 466 2244382',
  activeAcademicYear: '2026-27',
  activeSemester: 'Semester 1',
  minAttendancePercentage: 75,
  warningAttendancePercentage: 70,
  attendanceCorrectionWindowHours: 24,
  allowTeacherDirectEdit: false,
  requireHodApprovalForCorrection: true,
  workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  enableStudentPortal: true,
  enableFacultyPortal: true,
  maintenanceMode: false,
  maintenanceConfig: {
    enabled: false,
    targetScope: 'ALL',
    affectedRoles: ['STUDENT', 'TEACHER', 'HOD', 'OFFICE_STAFF', 'PRINCIPAL'],
    lockoutAttendanceOnly: false,
    title: 'Scheduled System Maintenance',
    message: 'The institutional attendance and academic management system is currently undergoing scheduled maintenance. Attendance marking, timetable access, and student portals are temporarily unavailable.',
    expectedEndTime: 'Today at 04:00 PM IST',
    supportContact: 'nsscollegeottapalam@gmail.com'
  },
  enablePushNotifications: true,
  enableOdAutomation: true,
  institutionLogoText: 'NSS COLLEGE OTTAPALAM'
};

export const initialAcademicYears: AcademicYear[] = [
  { id: 'ay-2026-27', yearName: '2026-27', startDate: '2026-06-01', endDate: '2027-03-31', isCurrent: true },
  { id: 'ay-2025-26', yearName: '2025-26', startDate: '2025-06-01', endDate: '2026-03-31', isCurrent: false },
  { id: 'ay-2024-25', yearName: '2024-25', startDate: '2024-06-01', endDate: '2025-03-31', isCurrent: false }
];

export const initialAdmissionBatches: AdmissionBatch[] = [
  { id: 'batch-2026', batchName: '2026', academicYearId: 'ay-2026-27', isActive: true },
  { id: 'batch-2025', batchName: '2025', academicYearId: 'ay-2025-26', isActive: true },
  { id: 'batch-2024', batchName: '2024', academicYearId: 'ay-2024-25', isActive: true }
];

export const initialSemesters: Semester[] = [
  { id: 'sem-1', semesterNumber: 1, name: 'Semester 1', type: 'ODD', isActive: true },
  { id: 'sem-2', semesterNumber: 2, name: 'Semester 2', type: 'EVEN', isActive: false },
  { id: 'sem-3', semesterNumber: 3, name: 'Semester 3', type: 'ODD', isActive: false },
  { id: 'sem-4', semesterNumber: 4, name: 'Semester 4', type: 'EVEN', isActive: false },
  { id: 'sem-5', semesterNumber: 5, name: 'Semester 5', type: 'ODD', isActive: false },
  { id: 'sem-6', semesterNumber: 6, name: 'Semester 6', type: 'EVEN', isActive: false },
  { id: 'sem-7', semesterNumber: 7, name: 'Semester 7', type: 'ODD', isActive: false },
  { id: 'sem-8', semesterNumber: 8, name: 'Semester 8', type: 'EVEN', isActive: false }
];

export const initialDepartments: Department[] = [
  { id: 'dept-eng', code: 'ENG', name: 'Department of English', type: 'ACADEMIC', isActive: true, establishedYear: 1961 },
  { id: 'dept-hin', code: 'HIN', name: 'Department of Hindi', type: 'ACADEMIC', isActive: true, establishedYear: 1961 },
  { id: 'dept-mal', code: 'MAL', name: 'Department of Malayalam', type: 'ACADEMIC', isActive: true, establishedYear: 1961 },
  { id: 'dept-eco', code: 'ECO', name: 'Department of Economics', type: 'ACADEMIC', isActive: true, establishedYear: 1961 },
  { id: 'dept-his', code: 'HIS', name: 'Department of History', type: 'ACADEMIC', isActive: true, establishedYear: 1965 },
  { id: 'dept-bot', code: 'BOT', name: 'Department of Botany', type: 'ACADEMIC', isActive: true, establishedYear: 1967 },
  { id: 'dept-che', code: 'CHE', name: 'Department of Chemistry', type: 'ACADEMIC', isActive: true, establishedYear: 1967 },
  { id: 'dept-cs', code: 'CSC', name: 'Department of Computer Science', type: 'ACADEMIC', isActive: true, establishedYear: 1995 },
  { id: 'dept-ic', code: 'IC', name: 'Department of Industrial Chemistry', type: 'ACADEMIC', isActive: true, establishedYear: 1998 },
  { id: 'dept-mat', code: 'MAT', name: 'Department of Mathematics', type: 'ACADEMIC', isActive: true, establishedYear: 1961 },
  { id: 'dept-phy', code: 'PHY', name: 'Department of Physics', type: 'ACADEMIC', isActive: true, establishedYear: 1961 },
  { id: 'dept-zoo', code: 'ZOO', name: 'Department of Zoology', type: 'ACADEMIC', isActive: true, establishedYear: 1967 },
  { id: 'dept-com', code: 'COM', name: 'Department of Commerce & Management', type: 'ACADEMIC', isActive: true, establishedYear: 1968 },
  { id: 'dept-ped', code: 'PED', name: 'Department of Physical Education', type: 'SUPPORTING', isActive: true },
  { id: 'dept-san', code: 'SAN', name: 'Department of Sanskrit', type: 'SUPPORTING', isActive: true },
  { id: 'dept-pol', code: 'POL', name: 'Department of Political Science', type: 'SUPPORTING', isActive: true },
  { id: 'dept-sta', code: 'STA', name: 'Department of Statistics', type: 'SUPPORTING', isActive: true },
  { id: 'dept-adm', code: 'ADM', name: 'Administrative Office', type: 'ADMINISTRATIVE', isActive: true }
];

export const initialProgrammes: Programme[] = [
  // UG Programmes
  { id: 'prog-ba-eng', code: 'BAENG', name: 'BA English Language and Literature', departmentId: 'dept-eng', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 50, maxStrength: 60, admittedCount: 0, isActive: true },
  { id: 'prog-ba-hin', code: 'BAHIN', name: 'BA Hindi Language and Literature', departmentId: 'dept-hin', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 40, maxStrength: 50, admittedCount: 0, isActive: true },
  { id: 'prog-ba-mal', code: 'BAMAL', name: 'BA Malayalam', departmentId: 'dept-mal', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 40, maxStrength: 50, admittedCount: 0, isActive: true },
  { id: 'prog-ba-eco', code: 'BAECO', name: 'BA Economics', departmentId: 'dept-eco', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 60, maxStrength: 70, admittedCount: 0, isActive: true },
  { id: 'prog-ba-his', code: 'BAHIS', name: 'BA History', departmentId: 'dept-his', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 50, maxStrength: 60, admittedCount: 0, isActive: true },
  { id: 'prog-bsc-bot', code: 'BSCBOT', name: 'BSc Botany', departmentId: 'dept-bot', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 40, maxStrength: 48, admittedCount: 0, isActive: true },
  { id: 'prog-bsc-che', code: 'BSCCHE', name: 'BSc Chemistry', departmentId: 'dept-che', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 40, maxStrength: 48, admittedCount: 0, isActive: true },
  { id: 'prog-bsc-cs', code: 'BSCCS', name: 'BSc Computer Science', departmentId: 'dept-cs', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 40, maxStrength: 45, admittedCount: 0, isActive: true },
  { id: 'prog-bsc-ic', code: 'BSCIC', name: 'BSc Industrial Chemistry', departmentId: 'dept-ic', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 30, maxStrength: 36, admittedCount: 0, isActive: true },
  { id: 'prog-bsc-mat', code: 'BSCMAT', name: 'BSc Mathematics', departmentId: 'dept-mat', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 48, maxStrength: 55, admittedCount: 0, isActive: true },
  { id: 'prog-bsc-phy', code: 'BSCPHY', name: 'BSc Physics', departmentId: 'dept-phy', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 40, maxStrength: 48, admittedCount: 0, isActive: true },
  { id: 'prog-bsc-zoo', code: 'BSCZOO', name: 'BSc Zoology', departmentId: 'dept-zoo', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 40, maxStrength: 48, admittedCount: 0, isActive: true },
  { id: 'prog-bcom', code: 'BCOM', name: 'B.Com (Finance & Co-operation)', departmentId: 'dept-com', type: 'UG', durationYears: 4, totalSemesters: 8, expectedStrength: 65, maxStrength: 75, admittedCount: 0, isActive: true },
  // PG Programmes
  { id: 'prog-ma-eng', code: 'MAENG', name: 'MA English Language and Literature', departmentId: 'dept-eng', type: 'PG', durationYears: 2, totalSemesters: 4, expectedStrength: 20, maxStrength: 25, admittedCount: 0, isActive: true },
  { id: 'prog-ma-eco', code: 'MAECO', name: 'MA Economics', departmentId: 'dept-eco', type: 'PG', durationYears: 2, totalSemesters: 4, expectedStrength: 20, maxStrength: 25, admittedCount: 0, isActive: true },
  { id: 'prog-msc-cs', code: 'MSCCS', name: 'MSc Computer Science', departmentId: 'dept-cs', type: 'PG', durationYears: 2, totalSemesters: 4, expectedStrength: 15, maxStrength: 18, admittedCount: 0, isActive: true },
  { id: 'prog-msc-mat', code: 'MSCMAT', name: 'MSc Mathematics', departmentId: 'dept-mat', type: 'PG', durationYears: 2, totalSemesters: 4, expectedStrength: 20, maxStrength: 25, admittedCount: 0, isActive: true },
  { id: 'prog-msc-phy', code: 'MSCPHY', name: 'MSc Physics', departmentId: 'dept-phy', type: 'PG', durationYears: 2, totalSemesters: 4, expectedStrength: 15, maxStrength: 18, admittedCount: 0, isActive: true },
  { id: 'prog-mcom', code: 'MCOM', name: 'M.Com Finance', departmentId: 'dept-com', type: 'PG', durationYears: 2, totalSemesters: 4, expectedStrength: 20, maxStrength: 25, admittedCount: 0, isActive: true }
];

export const initialCourseCategories: CourseCategory[] = [
  { id: 'cat-major', code: 'MAJOR', name: 'Major Core Course', description: 'Core discipline course of the admitted programme', colorHex: '#2563eb', isActive: true },
  { id: 'cat-minor', code: 'MINOR', name: 'Minor Course', description: 'Discipline specific minor chosen from other departments', colorHex: '#7c3aed', isActive: true },
  { id: 'cat-mdc', code: 'MDC', name: 'Multidisciplinary Course (MDC)', description: 'Introductory courses across various discipline clusters', colorHex: '#059669', isActive: true },
  { id: 'cat-aec', code: 'AEC', name: 'Ability Enhancement Course (AEC)', description: 'Language and Communication proficiency (English)', colorHex: '#d97706', isActive: true },
  { id: 'cat-sec', code: 'SEC', name: 'Skill Enhancement Course (SEC)', description: 'Hands-on practical skills & modern applied languages', colorHex: '#0891b2', isActive: true },
  { id: 'cat-vac', code: 'VAC', name: 'Value Added Course (VAC)', description: 'Environmental studies, Ethics, Indian Constitution', colorHex: '#db2777', isActive: true },
  { id: 'cat-intern', code: 'INTERN', name: 'Internship / Field Project', description: 'Industrial training and community engagement', colorHex: '#4f46e5', isActive: true },
  { id: 'cat-proj', code: 'PROJECT', name: 'Research Project / Dissertation', description: 'Capstone undergraduate or postgraduate thesis', colorHex: '#0d9488', isActive: true }
];

export const initialTimetablePeriods: TimetablePeriod[] = [
  { id: 'period-1', periodNumber: 1, label: 'Period 1', startTime: '09:30', endTime: '10:30', isBreak: false, isActive: true },
  { id: 'period-2', periodNumber: 2, label: 'Period 2', startTime: '10:30', endTime: '11:30', isBreak: false, isActive: true },
  { id: 'period-3', periodNumber: 3, label: 'Period 3', startTime: '11:30', endTime: '12:30', isBreak: false, isActive: true },
  { id: 'period-lunch', periodNumber: 0, label: 'Lunch Break', startTime: '12:30', endTime: '01:30', isBreak: true, isActive: true },
  { id: 'period-4', periodNumber: 4, label: 'Period 4', startTime: '01:30', endTime: '02:30', isBreak: false, isActive: true },
  { id: 'period-5', periodNumber: 5, label: 'Period 5', startTime: '02:30', endTime: '03:30', isBreak: false, isActive: true }
];

// Academic Masters & Course Architecture (Starts empty - add courses manually or upload spreadsheet)
export const initialCourses: Course[] = [];
export const initialCourseOfferings: CourseOffering[] = [];
export const initialCourseGroups: CourseGroup[] = [];

// Faculty & Teaching Staff Registry (Starts empty - add staff manually or use Quick Register)
export const initialFaculty: Faculty[] = [];
export const initialFacultyAssignments: FacultyCourseAssignment[] = [];

// Timetable & Scheduling (Starts empty - assign timetable entries manually)
export const initialTimetableEntries: TimetableEntry[] = [];
export const initialDailyScheduleOverrides: any[] = [];
export const initialClassTutorAssignments: any[] = [];

// Student Registry & FYUGP Allocations (Starts empty - enroll students manually or via bulk upload)
export const initialStudents: Student[] = [];
export const initialSemesterEnrollments: SemesterEnrollment[] = [];
export const initialStudentCourseRegistrations: StudentCourseRegistration[] = [];

// Class Sessions, Attendance & Academic Activity (Starts clean)
export const initialClassSessions: ClassSession[] = [];
export const initialAttendanceRecords: AttendanceRecord[] = [];
export const initialCorrectionRequests: AttendanceCorrectionRequest[] = [];
export const initialSubstituteAssignments: SubstituteAssignment[] = [];
export const initialAnnouncements: Announcement[] = [];
export const initialNotifications: AppNotification[] = [];
export const initialAuditLogs: AuditLog[] = [];

// Special & Union Attendance (Starts clean)
export const initialSpecialAttendanceEvents: SpecialAttendanceEvent[] = [];
export const initialSpecialAttendanceRecords: SpecialAttendanceRecord[] = [];

// Faculty Workload & Subject Requests (Starts clean)
export const initialFacultySubjectRequests: FacultySubjectRequest[] = [];
export const initialFacultyAssignmentHistory: FacultyAssignmentHistory[] = [];



