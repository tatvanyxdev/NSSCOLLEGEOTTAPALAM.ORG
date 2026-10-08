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
  SpecialAttendanceRecord
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

// Academic Masters & Course Architecture for NSS College Ottapalam
export const initialCourses: Course[] = [
  {
    id: 'crs-cs101',
    courseCode: 'CSC1B01T',
    courseTitle: 'Programming in C and Python Basics',
    shortCode: 'Prog C/Python',
    departmentId: 'dept-cs',
    categoryId: 'cat-major',
    credits: 4,
    lectureHours: 3,
    practicalHours: 2,
    totalContactHours: 60,
    defaultSemester: 1,
    description: 'Foundation course in structured procedural programming and modern Python scripting.',
    isActive: true
  },
  {
    id: 'crs-cs102',
    courseCode: 'CSC1B02T',
    courseTitle: 'Digital Electronics & Computer Architecture',
    shortCode: 'Digital Arch',
    departmentId: 'dept-cs',
    categoryId: 'cat-major',
    credits: 3,
    lectureHours: 3,
    practicalHours: 0,
    totalContactHours: 45,
    defaultSemester: 1,
    description: 'Logic circuits, boolean algebra, processor microarchitecture, and memory hierarchy.',
    isActive: true
  },
  {
    id: 'crs-mat101',
    courseCode: 'MAT1C01T',
    courseTitle: 'Foundations of Discrete Mathematics',
    shortCode: 'Discrete Maths',
    departmentId: 'dept-mat',
    categoryId: 'cat-minor',
    credits: 4,
    lectureHours: 4,
    practicalHours: 0,
    totalContactHours: 60,
    defaultSemester: 1,
    description: 'Set theory, propositional logic, graph theory, and mathematical induction.',
    isActive: true
  },
  {
    id: 'crs-phy101',
    courseCode: 'PHY1C01T',
    courseTitle: 'Mechanics and Properties of Matter',
    shortCode: 'Mechanics',
    departmentId: 'dept-phy',
    categoryId: 'cat-minor',
    credits: 3,
    lectureHours: 3,
    practicalHours: 0,
    totalContactHours: 45,
    defaultSemester: 1,
    description: 'Rotational dynamics, elasticity, fluid dynamics, and harmonic oscillations.',
    isActive: true
  },
  {
    id: 'crs-mdc101',
    courseCode: 'MDC101',
    courseTitle: 'Principles of Modern Management',
    shortCode: 'Modern Mgmt',
    departmentId: 'dept-com',
    categoryId: 'cat-mdc',
    credits: 3,
    lectureHours: 3,
    practicalHours: 0,
    totalContactHours: 45,
    defaultSemester: 1,
    description: 'Interdisciplinary exploration of managerial economics, human resources, and leadership.',
    isActive: true
  },
  {
    id: 'crs-mdc102',
    courseCode: 'MDC102',
    courseTitle: 'Introductory Environmental Science & Ecology',
    shortCode: 'Env Science',
    departmentId: 'dept-bot',
    categoryId: 'cat-mdc',
    credits: 3,
    lectureHours: 3,
    practicalHours: 0,
    totalContactHours: 45,
    defaultSemester: 1,
    description: 'Ecosystems, conservation biology, climate change policies, and sustainability.',
    isActive: true
  },
  {
    id: 'crs-aec101',
    courseCode: 'ENG1A01T',
    courseTitle: 'Communicative English & Critical Reading',
    shortCode: 'English Comm',
    departmentId: 'dept-eng',
    categoryId: 'cat-aec',
    credits: 3,
    lectureHours: 3,
    practicalHours: 0,
    totalContactHours: 45,
    defaultSemester: 1,
    description: 'Professional verbal communication, technical writing, academic vocabulary, and rhetoric.',
    isActive: true
  },
  {
    id: 'crs-sec101',
    courseCode: 'SEC101T',
    courseTitle: 'Web Application Development & UI Design',
    shortCode: 'Web Dev & UI',
    departmentId: 'dept-cs',
    categoryId: 'cat-sec',
    credits: 2,
    lectureHours: 1,
    practicalHours: 2,
    totalContactHours: 30,
    defaultSemester: 1,
    description: 'Modern frontend development, responsive layouts, web accessibility, and interactive design.',
    isActive: true
  },
  {
    id: 'crs-vac101',
    courseCode: 'VAC101',
    courseTitle: 'Ethics, Constitutional Values & Digital Citizenship',
    shortCode: 'Ethics & Values',
    departmentId: 'dept-cs',
    categoryId: 'cat-vac',
    credits: 2,
    lectureHours: 2,
    practicalHours: 0,
    totalContactHours: 30,
    defaultSemester: 1,
    description: 'Constitutional rights, ethical reasoning in digital age, and cyber law awareness.',
    isActive: true
  }
];

export const initialCourseOfferings: CourseOffering[] = [
  { id: 'off-cs101', courseId: 'crs-cs101', academicYear: '2026-27', semesterNumber: 1, departmentId: 'dept-cs', coordinatorFacultyId: 'fac-1', isActive: true },
  { id: 'off-cs102', courseId: 'crs-cs102', academicYear: '2026-27', semesterNumber: 1, departmentId: 'dept-cs', coordinatorFacultyId: 'fac-2', isActive: true },
  { id: 'off-mat101', courseId: 'crs-mat101', academicYear: '2026-27', semesterNumber: 1, departmentId: 'dept-mat', coordinatorFacultyId: 'fac-3', isActive: true },
  { id: 'off-phy101', courseId: 'crs-phy101', academicYear: '2026-27', semesterNumber: 1, departmentId: 'dept-phy', coordinatorFacultyId: 'fac-4', isActive: true },
  { id: 'off-mdc101', courseId: 'crs-mdc101', academicYear: '2026-27', semesterNumber: 1, departmentId: 'dept-com', coordinatorFacultyId: 'fac-1', isActive: true },
  { id: 'off-mdc102', courseId: 'crs-mdc102', academicYear: '2026-27', semesterNumber: 1, departmentId: 'dept-bot', coordinatorFacultyId: 'fac-3', isActive: true },
  { id: 'off-aec101', courseId: 'crs-aec101', academicYear: '2026-27', semesterNumber: 1, departmentId: 'dept-eng', coordinatorFacultyId: 'fac-5', isActive: true },
  { id: 'off-sec101', courseId: 'crs-sec101', academicYear: '2026-27', semesterNumber: 1, departmentId: 'dept-cs', coordinatorFacultyId: 'fac-2', isActive: true },
  { id: 'off-vac101', courseId: 'crs-vac101', academicYear: '2026-27', semesterNumber: 1, departmentId: 'dept-cs', coordinatorFacultyId: 'fac-1', isActive: true }
];

export const initialCourseGroups: CourseGroup[] = [
  { id: 'grp-cs101-a', courseOfferingId: 'off-cs101', groupName: 'Batch CS-A', capacity: 45, expectedStrength: 40, room: 'CS Lab 1 / Room 102', isActive: true },
  { id: 'grp-cs102-a', courseOfferingId: 'off-cs102', groupName: 'Batch CS-A', capacity: 45, expectedStrength: 40, room: 'Room 102', isActive: true },
  { id: 'grp-mat101-a', courseOfferingId: 'off-mat101', groupName: 'Minor Group M1', capacity: 55, expectedStrength: 45, room: 'Ramanujan Hall 204', isActive: true },
  { id: 'grp-phy101-a', courseOfferingId: 'off-phy101', groupName: 'Minor Group P1', capacity: 50, expectedStrength: 40, room: 'Physics Lecture Hall 108', isActive: true },
  { id: 'grp-mdc101-a', courseOfferingId: 'off-mdc101', groupName: 'MDC Cluster C1', capacity: 60, expectedStrength: 50, room: 'Commerce Seminar Hall', isActive: true },
  { id: 'grp-mdc102-a', courseOfferingId: 'off-mdc102', groupName: 'MDC Cluster B1', capacity: 50, expectedStrength: 40, room: 'Botany Smart Room 202', isActive: true },
  { id: 'grp-aec101-a', courseOfferingId: 'off-aec101', groupName: 'AEC English Cohort 1', capacity: 60, expectedStrength: 45, room: 'Language Lab 105', isActive: true },
  { id: 'grp-sec101-a', courseOfferingId: 'off-sec101', groupName: 'SEC Web Lab S1', capacity: 40, expectedStrength: 35, room: 'Computing Centre Lab 3', isActive: true }
];

export const initialFaculty: Faculty[] = [
  {
    id: 'fac-1',
    employeeId: 'PEN-1995-CS01',
    fullName: 'Dr. Radhakrishnan K.',
    email: 'radhakrishnan.cs@nssce.ac.in',
    phone: '+91 94471 23450',
    phoneNumber: '+91 94471 23450',
    departmentId: 'dept-cs',
    designation: 'Associate Professor & HOD',
    qualification: 'M.Tech, Ph.D in Computer Science',
    roles: ['HOD', 'TEACHER'],
    status: 'ACTIVE',
    isActive: true
  },
  {
    id: 'fac-2',
    employeeId: 'PEN-2005-CS02',
    fullName: 'Prof. Lekha S. Pillai',
    email: 'lekha.cs@nssce.ac.in',
    phone: '+91 94472 34561',
    phoneNumber: '+91 94472 34561',
    departmentId: 'dept-cs',
    designation: 'Assistant Professor & Class Tutor',
    qualification: 'M.Tech in Software Engineering',
    roles: ['CLASS_TUTOR', 'TEACHER'],
    status: 'ACTIVE',
    isActive: true
  },
  {
    id: 'fac-3',
    employeeId: 'PEN-1998-MAT01',
    fullName: 'Dr. Narayanan M.',
    email: 'narayanan.mat@nssce.ac.in',
    phone: '+91 94473 45672',
    phoneNumber: '+91 94473 45672',
    departmentId: 'dept-mat',
    designation: 'Associate Professor & HOD',
    qualification: 'M.Sc, Ph.D in Applied Mathematics',
    roles: ['HOD', 'TEACHER'],
    status: 'ACTIVE',
    isActive: true
  },
  {
    id: 'fac-4',
    employeeId: 'PEN-2002-PHY01',
    fullName: 'Dr. Gopakumar V.',
    email: 'gopakumar.phy@nssce.ac.in',
    phone: '+91 94474 56783',
    phoneNumber: '+91 94474 56783',
    departmentId: 'dept-phy',
    designation: 'Associate Professor',
    qualification: 'M.Sc, Ph.D in Condensed Matter Physics',
    roles: ['TEACHER'],
    status: 'ACTIVE',
    isActive: true
  },
  {
    id: 'fac-5',
    employeeId: 'PEN-2010-ENG01',
    fullName: 'Prof. Meera Nair',
    email: 'meera.eng@nssce.ac.in',
    phone: '+91 94475 67894',
    phoneNumber: '+91 94475 67894',
    departmentId: 'dept-eng',
    designation: 'Assistant Professor & Coordinator',
    qualification: 'MA, M.Phil in English Literature',
    roles: ['COURSE_COORDINATOR', 'TEACHER'],
    status: 'ACTIVE',
    isActive: true
  }
];

export const initialFacultyAssignments: FacultyCourseAssignment[] = [
  { id: 'fca-1', facultyId: 'fac-1', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', assignmentRole: 'PRIMARY', startDate: '2026-06-01', isActive: true },
  { id: 'fca-2', facultyId: 'fac-2', courseOfferingId: 'off-sec101', courseGroupId: 'grp-sec101-a', assignmentRole: 'PRIMARY', startDate: '2026-06-01', isActive: true },
  { id: 'fca-3', facultyId: 'fac-2', courseOfferingId: 'off-cs102', courseGroupId: 'grp-cs102-a', assignmentRole: 'PRIMARY', startDate: '2026-06-01', isActive: true },
  { id: 'fca-4', facultyId: 'fac-3', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', assignmentRole: 'PRIMARY', startDate: '2026-06-01', isActive: true },
  { id: 'fca-5', facultyId: 'fac-5', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', assignmentRole: 'PRIMARY', startDate: '2026-06-01', isActive: true },
  { id: 'fca-6', facultyId: 'fac-1', courseOfferingId: 'off-mdc101', courseGroupId: 'grp-mdc101-a', assignmentRole: 'PRIMARY', startDate: '2026-06-01', isActive: true }
];

export const initialTimetableEntries: TimetableEntry[] = [
  // Monday
  { id: 'tt-mon-1', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'MONDAY', weekday: 'MONDAY', periodId: 'period-1', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', facultyId: 'fac-1', room: 'LH-201', isActive: true },
  { id: 'tt-mon-2', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'MONDAY', weekday: 'MONDAY', periodId: 'period-2', courseOfferingId: 'off-sec101', courseGroupId: 'grp-sec101-a', facultyId: 'fac-2', room: 'Lab-1', isActive: true },
  { id: 'tt-mon-3', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'MONDAY', weekday: 'MONDAY', periodId: 'period-3', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', facultyId: 'fac-3', room: 'LH-202', isActive: true },
  { id: 'tt-mon-4', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'MONDAY', weekday: 'MONDAY', periodId: 'period-4', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', facultyId: 'fac-5', room: 'LH-105', isActive: true },
  { id: 'tt-mon-5', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'MONDAY', weekday: 'MONDAY', periodId: 'period-5', courseOfferingId: 'off-mdc101', courseGroupId: 'grp-mdc101-a', facultyId: 'fac-1', room: 'Lab-2', isActive: true },

  // Tuesday
  { id: 'tt-tue-1', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'TUESDAY', weekday: 'TUESDAY', periodId: 'period-1', courseOfferingId: 'off-cs102', courseGroupId: 'grp-cs102-a', facultyId: 'fac-2', room: 'Lab-1', isActive: true },
  { id: 'tt-tue-2', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'TUESDAY', weekday: 'TUESDAY', periodId: 'period-2', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', facultyId: 'fac-1', room: 'LH-201', isActive: true },
  { id: 'tt-tue-3', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'TUESDAY', weekday: 'TUESDAY', periodId: 'period-3', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', facultyId: 'fac-3', room: 'LH-202', isActive: true },
  { id: 'tt-tue-4', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'TUESDAY', weekday: 'TUESDAY', periodId: 'period-4', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', facultyId: 'fac-5', room: 'LH-105', isActive: true },
  { id: 'tt-tue-5', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'TUESDAY', weekday: 'TUESDAY', periodId: 'period-5', courseOfferingId: 'off-sec101', courseGroupId: 'grp-sec101-a', facultyId: 'fac-2', room: 'Lab-1', isActive: true },

  // Wednesday
  { id: 'tt-wed-1', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'WEDNESDAY', weekday: 'WEDNESDAY', periodId: 'period-1', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', facultyId: 'fac-1', room: 'LH-201', isActive: true },
  { id: 'tt-wed-2', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'WEDNESDAY', weekday: 'WEDNESDAY', periodId: 'period-2', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', facultyId: 'fac-3', room: 'LH-202', isActive: true },
  { id: 'tt-wed-3', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'WEDNESDAY', weekday: 'WEDNESDAY', periodId: 'period-3', courseOfferingId: 'off-cs102', courseGroupId: 'grp-cs102-a', facultyId: 'fac-2', room: 'Lab-1', isActive: true },
  { id: 'tt-wed-4', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'WEDNESDAY', weekday: 'WEDNESDAY', periodId: 'period-4', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', facultyId: 'fac-5', room: 'LH-105', isActive: true },
  { id: 'tt-wed-5', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'WEDNESDAY', weekday: 'WEDNESDAY', periodId: 'period-5', courseOfferingId: 'off-mdc101', courseGroupId: 'grp-mdc101-a', facultyId: 'fac-1', room: 'Lab-2', isActive: true },

  // Thursday
  { id: 'tt-thu-1', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'THURSDAY', weekday: 'THURSDAY', periodId: 'period-1', courseOfferingId: 'off-sec101', courseGroupId: 'grp-sec101-a', facultyId: 'fac-2', room: 'Lab-1', isActive: true },
  { id: 'tt-thu-2', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'THURSDAY', weekday: 'THURSDAY', periodId: 'period-2', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', facultyId: 'fac-5', room: 'LH-105', isActive: true },
  { id: 'tt-thu-3', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'THURSDAY', weekday: 'THURSDAY', periodId: 'period-3', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', facultyId: 'fac-1', room: 'LH-201', isActive: true },
  { id: 'tt-thu-4', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'THURSDAY', weekday: 'THURSDAY', periodId: 'period-4', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', facultyId: 'fac-3', room: 'LH-202', isActive: true },
  { id: 'tt-thu-5', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'THURSDAY', weekday: 'THURSDAY', periodId: 'period-5', courseOfferingId: 'off-cs102', courseGroupId: 'grp-cs102-a', facultyId: 'fac-2', room: 'Lab-1', isActive: true },

  // Friday
  { id: 'tt-fri-1', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'FRIDAY', weekday: 'FRIDAY', periodId: 'period-1', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', facultyId: 'fac-3', room: 'LH-202', isActive: true },
  { id: 'tt-fri-2', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'FRIDAY', weekday: 'FRIDAY', periodId: 'period-2', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', facultyId: 'fac-1', room: 'LH-201', isActive: true },
  { id: 'tt-fri-3', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'FRIDAY', weekday: 'FRIDAY', periodId: 'period-3', courseOfferingId: 'off-sec101', courseGroupId: 'grp-sec101-a', facultyId: 'fac-2', room: 'Lab-1', isActive: true },
  { id: 'tt-fri-4', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'FRIDAY', weekday: 'FRIDAY', periodId: 'period-4', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', facultyId: 'fac-5', room: 'LH-105', isActive: true },
  { id: 'tt-fri-5', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'FRIDAY', weekday: 'FRIDAY', periodId: 'period-5', courseOfferingId: 'off-mdc101', courseGroupId: 'grp-mdc101-a', facultyId: 'fac-1', room: 'Lab-2', isActive: true },

  // Saturday (for weekend schedule tests)
  { id: 'tt-sat-1', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'SATURDAY', weekday: 'SATURDAY', periodId: 'period-1', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', facultyId: 'fac-1', room: 'LH-201', isActive: true },
  { id: 'tt-sat-2', academicYear: '2026-27', semesterNumber: 1, dayOfWeek: 'SATURDAY', weekday: 'SATURDAY', periodId: 'period-2', courseOfferingId: 'off-sec101', courseGroupId: 'grp-sec101-a', facultyId: 'fac-2', room: 'Lab-1', isActive: true }
];

export const initialDailyScheduleOverrides: any[] = [];

export const initialClassTutorAssignments: any[] = [
  {
    id: 'cta-1',
    facultyId: 'fac-2', // Prof. Lekha S. Pillai
    programmeId: 'prog-bsc-cs', // BSc Computer Science
    academicYearId: 'ay-2026-27',
    semesterId: 'sem-1',
    batchName: '2026-2030',
    departmentId: 'dept-cs',
    isActive: true,
    createdAt: '2026-06-01T00:00:00Z'
  }
];

export const initialStudents: Student[] = [
  {
    id: 'stu-1',
    admissionNumber: 'ADM-2026-101',
    rollNumber: '01',
    universityRegisterNumber: 'UCOTFCS001',
    fullName: 'Ananya S. Nair',
    preferredName: 'Ananya',
    username: 'UCOTFCS001',
    password: '1204200556',
    email: 'ananya.nair@nssce.ac.in',
    mobileNumber: '+91 98471 23456',
    phone: '+91 98471 23456',
    phoneNumber: '+91 98471 23456',
    homeDepartmentId: 'dept-cs',
    programmeId: 'prog-bsc-cs',
    currentSemester: 1,
    yearOfStudy: 1,
    admissionBatch: '2026-2030',
    admissionAcademicYear: '2026-27',
    status: 'ACTIVE',
    bloodGroup: 'O+ve',
    dateOfBirth: '2005-04-12',
    gender: 'Female',
    guardianName: 'Suresh Nair',
    guardianPhone: '+91 94471 98765',
    address: 'Nair Villa, Ottapalam, Palakkad District, Kerala - 679103',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-06-10T10:00:00Z'
  },
  {
    id: 'stu-2',
    admissionNumber: 'ADM-2026-102',
    rollNumber: '02',
    universityRegisterNumber: 'UCOTFCS002',
    fullName: 'Rahul K. Menon',
    preferredName: 'Rahul',
    username: 'UCOTFCS002',
    password: '2108200567',
    email: 'rahul.menon@nssce.ac.in',
    mobileNumber: '+91 97452 34567',
    phone: '+91 97452 34567',
    phoneNumber: '+91 97452 34567',
    homeDepartmentId: 'dept-cs',
    programmeId: 'prog-bsc-cs',
    currentSemester: 1,
    yearOfStudy: 1,
    admissionBatch: '2026-2030',
    admissionAcademicYear: '2026-27',
    status: 'ACTIVE',
    bloodGroup: 'B+ve',
    dateOfBirth: '2005-08-21',
    gender: 'Male',
    guardianName: 'Kesavan Menon',
    guardianPhone: '+91 94472 87654',
    address: 'Menon House, Main Road, Ottapalam, Kerala',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-06-10T10:05:00Z'
  },
  {
    id: 'stu-3',
    admissionNumber: 'ADM-2026-103',
    rollNumber: '03',
    universityRegisterNumber: 'UCOTFCS003',
    fullName: 'Sneha V. Pillai',
    preferredName: 'Sneha',
    username: 'UCOTFCS003',
    password: '1511200554',
    email: 'sneha.pillai@nssce.ac.in',
    mobileNumber: '+91 94951 87654',
    phone: '+91 94951 87654',
    phoneNumber: '+91 94951 87654',
    homeDepartmentId: 'dept-cs',
    programmeId: 'prog-bsc-cs',
    currentSemester: 1,
    yearOfStudy: 1,
    admissionBatch: '2026-2030',
    admissionAcademicYear: '2026-27',
    status: 'ACTIVE',
    bloodGroup: 'A+ve',
    dateOfBirth: '2005-11-15',
    gender: 'Female',
    guardianName: 'Vijayan Pillai',
    guardianPhone: '+91 94473 76543',
    address: 'Pillai Nilayam, Shoranur, Palakkad, Kerala',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-06-10T10:10:00Z'
  },
  {
    id: 'stu-4',
    admissionNumber: 'ADM-2026-104',
    rollNumber: '04',
    universityRegisterNumber: 'UCOTFMA001',
    fullName: 'Muhammed Favas',
    preferredName: 'Favas',
    username: 'UCOTFMA001',
    password: '1802200545',
    email: 'favas.m@nssce.ac.in',
    mobileNumber: '+91 98950 12345',
    phone: '+91 98950 12345',
    phoneNumber: '+91 98950 12345',
    homeDepartmentId: 'dept-mat',
    programmeId: 'prog-bsc-mat',
    currentSemester: 1,
    yearOfStudy: 1,
    admissionBatch: '2026-2030',
    admissionAcademicYear: '2026-27',
    status: 'ACTIVE',
    bloodGroup: 'AB+ve',
    dateOfBirth: '2005-02-18',
    gender: 'Male',
    guardianName: 'Abdul Majeed',
    guardianPhone: '+91 94474 65432',
    address: 'Darussalam, Pattambi, Palakkad, Kerala',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-06-10T10:15:00Z'
  },
  {
    id: 'stu-5',
    admissionNumber: 'ADM-2026-105',
    rollNumber: '05',
    universityRegisterNumber: 'UCOTFPH001',
    fullName: 'Devika R. Nambiar',
    preferredName: 'Devika',
    username: 'UCOTFPH001',
    password: '0907200565',
    email: 'devika.nambiar@nssce.ac.in',
    mobileNumber: '+91 98460 98765',
    phone: '+91 98460 98765',
    phoneNumber: '+91 98460 98765',
    homeDepartmentId: 'dept-phy',
    programmeId: 'prog-bsc-phy',
    currentSemester: 1,
    yearOfStudy: 1,
    admissionBatch: '2026-2030',
    admissionAcademicYear: '2026-27',
    status: 'ACTIVE',
    bloodGroup: 'O+ve',
    dateOfBirth: '2005-07-09',
    gender: 'Female',
    guardianName: 'Ramachandran Nambiar',
    guardianPhone: '+91 94475 54321',
    address: 'Nambiar Complex, Cherpulassery, Kerala',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-06-10T10:20:00Z'
  }
];

export const initialSemesterEnrollments: SemesterEnrollment[] = [
  { id: 'se-stu-1', studentId: 'stu-1', academicYear: '2026-27', semesterNumber: 1, enrollmentDate: '2026-06-01', status: 'ENROLLED' },
  { id: 'se-stu-2', studentId: 'stu-2', academicYear: '2026-27', semesterNumber: 1, enrollmentDate: '2026-06-01', status: 'ENROLLED' },
  { id: 'se-stu-3', studentId: 'stu-3', academicYear: '2026-27', semesterNumber: 1, enrollmentDate: '2026-06-01', status: 'ENROLLED' },
  { id: 'se-stu-4', studentId: 'stu-4', academicYear: '2026-27', semesterNumber: 1, enrollmentDate: '2026-06-01', status: 'ENROLLED' },
  { id: 'se-stu-5', studentId: 'stu-5', academicYear: '2026-27', semesterNumber: 1, enrollmentDate: '2026-06-01', status: 'ENROLLED' }
];

// FYUGP Subject Allocations (Major, Minor, MDC, AEC, SEC) for enrolled students
export const initialStudentCourseRegistrations: StudentCourseRegistration[] = [
  // Ananya S. Nair (stu-1) allocations
  { id: 'reg-101', studentId: 'stu-1', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', courseCategoryId: 'cat-major', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-102', studentId: 'stu-1', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', courseCategoryId: 'cat-minor', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-103', studentId: 'stu-1', courseOfferingId: 'off-mdc101', courseGroupId: 'grp-mdc101-a', courseCategoryId: 'cat-mdc', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-104', studentId: 'stu-1', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', courseCategoryId: 'cat-aec', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-105', studentId: 'stu-1', courseOfferingId: 'off-sec101', courseGroupId: 'grp-sec101-a', courseCategoryId: 'cat-sec', registrationDate: '2026-06-01', status: 'APPROVED' },

  // Rahul K. Menon (stu-2) allocations
  { id: 'reg-201', studentId: 'stu-2', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', courseCategoryId: 'cat-major', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-202', studentId: 'stu-2', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', courseCategoryId: 'cat-minor', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-203', studentId: 'stu-2', courseOfferingId: 'off-mdc101', courseGroupId: 'grp-mdc101-a', courseCategoryId: 'cat-mdc', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-204', studentId: 'stu-2', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', courseCategoryId: 'cat-aec', registrationDate: '2026-06-01', status: 'APPROVED' },

  // Sneha V. Pillai (stu-3) allocations
  { id: 'reg-301', studentId: 'stu-3', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', courseCategoryId: 'cat-major', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-302', studentId: 'stu-3', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', courseCategoryId: 'cat-minor', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-303', studentId: 'stu-3', courseOfferingId: 'off-mdc101', courseGroupId: 'grp-mdc101-a', courseCategoryId: 'cat-mdc', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-304', studentId: 'stu-3', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', courseCategoryId: 'cat-aec', registrationDate: '2026-06-01', status: 'APPROVED' },

  // Muhammed Favas (stu-4) allocations
  { id: 'reg-401', studentId: 'stu-4', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', courseCategoryId: 'cat-major', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-402', studentId: 'stu-4', courseOfferingId: 'off-cs101', courseGroupId: 'grp-cs101-a', courseCategoryId: 'cat-minor', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-403', studentId: 'stu-4', courseOfferingId: 'off-mdc102', courseGroupId: 'grp-mdc102-a', courseCategoryId: 'cat-mdc', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-404', studentId: 'stu-4', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', courseCategoryId: 'cat-aec', registrationDate: '2026-06-01', status: 'APPROVED' },

  // Devika R. Nambiar (stu-5) allocations
  { id: 'reg-501', studentId: 'stu-5', courseOfferingId: 'off-phy101', courseGroupId: 'grp-phy101-a', courseCategoryId: 'cat-major', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-502', studentId: 'stu-5', courseOfferingId: 'off-mat101', courseGroupId: 'grp-mat101-a', courseCategoryId: 'cat-minor', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-503', studentId: 'stu-5', courseOfferingId: 'off-mdc101', courseGroupId: 'grp-mdc101-a', courseCategoryId: 'cat-mdc', registrationDate: '2026-06-01', status: 'APPROVED' },
  { id: 'reg-504', studentId: 'stu-5', courseOfferingId: 'off-aec101', courseGroupId: 'grp-aec101-a', courseCategoryId: 'cat-aec', registrationDate: '2026-06-01', status: 'APPROVED' }
];

export const initialClassSessions: ClassSession[] = [];
export const initialAttendanceRecords: AttendanceRecord[] = [];
export const initialCorrectionRequests: AttendanceCorrectionRequest[] = [];
export const initialSubstituteAssignments: SubstituteAssignment[] = [];
export const initialAnnouncements: Announcement[] = [];
export const initialNotifications: AppNotification[] = [];
export const initialAuditLogs: AuditLog[] = [];
export const initialSpecialAttendanceEvents: SpecialAttendanceEvent[] = [];
export const initialSpecialAttendanceRecords: SpecialAttendanceRecord[] = [];

// Faculty Subject Requests (Teacher Subject Registration & HOD Workflow)
export const initialFacultySubjectRequests: FacultySubjectRequest[] = [
  {
    id: 'fsr-1',
    requestedBy: 'fac-2',
    requestedByFacultyId: 'fac-2',
    departmentId: 'dept-cs',
    courseName: 'Web Application Development Essentials',
    proposedCourseCode: 'SEC101',
    courseType: 'SEC',
    programmeId: 'prog-cs',
    semesterNumber: 1,
    academicYear: '2026-27',
    existingCourseId: 'c-sec101',
    existingCourseGroupId: 'grp-sec101-a',
    proposedGroupName: 'SEC Web Lab S1',
    requestNotes: 'Handled SEC Practical Lab for Semester 1 Computer Science students.',
    status: 'APPROVED',
    reviewedBy: 'fac-1',
    reviewedByFacultyId: 'fac-1',
    reviewedAt: '2026-06-02T10:00:00Z',
    reviewNotes: 'Approved. Allocated as Primary Instructor for Web Lab Batch S1.',
    createdAt: '2026-06-01T09:30:00Z',
    updatedAt: '2026-06-02T10:00:00Z'
  },
  {
    id: 'fsr-2',
    requestedBy: 'fac-2',
    requestedByFacultyId: 'fac-2',
    departmentId: 'dept-cs',
    courseName: 'Introduction to Python & Data Science',
    proposedCourseCode: 'TEMP-2026-0001',
    courseType: 'MDC',
    programmeId: 'prog-cs',
    semesterNumber: 1,
    academicYear: '2026-27',
    proposedGroupName: 'Python Beginners MDC-1',
    requestNotes: 'Requesting allocation for the new Multidisciplinary Python course offered to Non-CS students under FYUGP.',
    status: 'PENDING',
    isProvisional: true,
    createdAt: '2026-10-06T11:15:00Z',
    updatedAt: '2026-10-06T11:15:00Z'
  },
  {
    id: 'fsr-3',
    requestedBy: 'fac-4',
    requestedByFacultyId: 'fac-4',
    departmentId: 'dept-phy',
    courseName: 'Computational Physics Lab',
    proposedCourseCode: 'PHY-LAB-02',
    courseType: 'DSC',
    programmeId: 'prog-phy',
    semesterNumber: 2,
    academicYear: '2026-27',
    proposedGroupName: 'Physics Lab Cohort 2',
    requestNotes: 'Proposing DSC laboratory module for semester 2 physics major cohort.',
    status: 'NEEDS_CHANGES',
    reviewedBy: 'fac-3',
    reviewedByFacultyId: 'fac-3',
    reviewedAt: '2026-10-05T14:20:00Z',
    reviewNotes: 'Please specify the exact lab workload hours and whether this is co-taught with Electronics lab.',
    createdAt: '2026-10-04T16:00:00Z',
    updatedAt: '2026-10-05T14:20:00Z'
  }
];

// Faculty Assignment History (Audit trail of teacher allocations across time)
export const initialFacultyAssignmentHistory: FacultyAssignmentHistory[] = [
  {
    id: 'fah-1',
    courseGroupId: 'grp-sec101-a',
    facultyId: 'fac-2',
    departmentId: 'dept-cs',
    assignmentRole: 'PRIMARY',
    effectiveFrom: '2026-06-01',
    sourceRequestId: 'fsr-1',
    assignedBy: 'fac-1',
    reason: 'Approved Subject Request: Primary Instructor for Web Lab Batch S1',
    createdAt: '2026-06-02T10:00:00Z'
  },
  {
    id: 'fah-2',
    courseGroupId: 'grp-cs101-a',
    facultyId: 'fac-1',
    departmentId: 'dept-cs',
    assignmentRole: 'PRIMARY',
    effectiveFrom: '2026-06-01',
    assignedBy: 'fac-1',
    reason: 'Department Initial Teaching Workload Allocation',
    createdAt: '2026-06-01T08:00:00Z'
  }
];



