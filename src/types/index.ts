export type UserRole =
  | 'SUPER_ADMIN'
  | 'PRINCIPAL'
  | 'HOD'
  | 'TEACHER'
  | 'CLASS_TUTOR'
  | 'COURSE_COORDINATOR'
  | 'ATTENDANCE_COORDINATOR'
  | 'OFFICE_STAFF'
  | 'STUDENT';

export type ProgrammeType = 'UG' | 'PG' | 'DIPLOMA' | 'CERTIFICATE' | 'RESEARCH';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export type StudentStatus =
  | 'ACTIVE'
  | 'GRADUATED'
  | 'DROPOUT'
  | 'TRANSFERRED'
  | 'SUSPENDED'
  | 'DISCONTINUED';

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'OD'
  | 'MEDICAL_LEAVE'
  | 'APPROVED_LEAVE'
  | 'SPECIAL';

export type AssignmentRole =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'CO_TEACHER'
  | 'SUBSTITUTE'
  | 'COORDINATOR'
  | 'LAB_INSTRUCTOR';

export type CorrectionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AnnouncementAudience =
  | 'ALL'
  | 'STUDENTS'
  | 'FACULTY'
  | 'DEPARTMENT'
  | 'PROGRAMME'
  | 'SEMESTER'
  | 'SPECIFIC_USERS';

export type PriorityLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// Maintenance Configuration Interface
export interface MaintenanceConfig {
  enabled: boolean;
  targetScope: 'ALL' | 'CUSTOM'; // 'ALL' = Everyone (except SUPER_ADMIN), 'CUSTOM' = specific roles
  affectedRoles: UserRole[]; // e.g. ['STUDENT', 'TEACHER', 'HOD']
  lockoutAttendanceOnly?: boolean; // false = entire portal blocked, true = only attendance & marking locked
  title?: string;
  message?: string;
  expectedEndTime?: string; // e.g. "Today at 04:00 PM"
  supportContact?: string;
  activatedAt?: string;
  activatedBy?: string;
}

// System Settings Interface
export interface SystemSettings {
  id: string;
  collegeName: string;
  collegeCode: string;
  affiliation: string;
  accreditation: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  activeAcademicYear: string;
  activeSemester: string;
  minAttendancePercentage: number;
  warningAttendancePercentage: number;
  attendanceCorrectionWindowHours: number;
  allowTeacherDirectEdit: boolean;
  requireHodApprovalForCorrection: boolean;
  workingDays: string[];
  enableStudentPortal: boolean;
  enableFacultyPortal: boolean;
  maintenanceMode: boolean;
  maintenanceConfig?: MaintenanceConfig;
  enablePushNotifications: boolean;
  enableOdAutomation: boolean;
  institutionLogoText: string;

  // Aliases for convenient access
  institutionName?: string;
  currentAcademicYear?: string;
  currentSemester?: number;
  isOdAutomatic?: boolean;
  maxOdPerSemester?: number;
}

// Department
export interface Department {
  id: string;
  code: string;
  name: string;
  type?: 'ACADEMIC' | 'ASSOCIATE' | 'SUPPORTING' | 'ADMINISTRATIVE';
  hodFacultyId?: string;
  isActive: boolean;
  description?: string;
  establishedYear?: number;
}

// Programme
export interface Programme {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  type?: ProgrammeType;
  degreeType?: 'UG' | 'PG' | 'RESEARCH';
  durationYears?: number;
  durationSemesters?: number;
  totalSemesters?: number;
  sanctionedIntake?: number;
  expectedStrength?: number;
  maxStrength?: number;
  admittedCount?: number;
  isActive: boolean;
  fyugpMajorDepartmentId?: string;
}

// Academic Year
export interface AcademicYear {
  id: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

// Admission Batch
export interface AdmissionBatch {
  id: string;
  batchName: string;
  academicYearId: string;
  expectedStrength?: number;
  maxStrength?: number;
  isActive: boolean;
}

// Semester
export interface Semester {
  id: string;
  semesterNumber: number;
  name: string;
  type: 'ODD' | 'EVEN';
  isActive: boolean;
}

// Course Category
export interface CourseCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  colorHex?: string;
  isActive?: boolean;
  isElective?: boolean;
  isMultiDisciplinary?: boolean;
}

// Course Master
export interface Course {
  id: string;
  courseCode: string;
  shortCode?: string;
  courseTitle: string;
  departmentId: string;
  categoryId: string;
  credits: number;
  lectureHours?: number;
  theoryHours?: number;
  practicalHours: number;
  totalContactHours?: number;
  defaultSemester?: number;
  semester?: number;
  description?: string;
  isActive: boolean;
}

// Course Offering
export interface CourseOffering {
  id: string;
  courseId: string;
  academicYear: string;
  semesterNumber: number;
  departmentId: string;
  coordinatorFacultyId?: string;
  expectedStrength?: number;
  maxStrength?: number;
  isActive: boolean;
}

// Course Group
export interface CourseGroup {
  id: string;
  courseOfferingId: string;
  groupName: string;
  capacity?: number;
  maxCapacity?: number;
  expectedStrength?: number;
  maxStrength?: number;
  room: string;
  isActive?: boolean;
  isCrossDepartmental?: boolean;
}

// Student Master
export interface Student {
  id: string;
  authUserId?: string;
  admissionNumber: string;
  universityRegisterNumber?: string;
  rollNumber: string;
  fullName: string;
  preferredName?: string;
  username?: string;
  password?: string;
  phone?: string;
  mobileNumber?: string;
  phoneNumber?: string;
  programmeId: string;
  homeDepartmentId: string;
  admissionAcademicYear?: string;
  admissionBatch: string;
  currentSemester: number;
  yearOfStudy?: number;
  status: StudentStatus;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  profilePhotoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
}

// Semester Enrollment
export interface SemesterEnrollment {
  id: string;
  studentId: string;
  academicYear: string;
  semesterNumber: number;
  enrollmentDate: string;
  status: 'ENROLLED' | 'PROMOTED' | 'DETAINED' | 'COMPLETED';
}

// Student Course Registration
export interface StudentCourseRegistration {
  id: string;
  studentId: string;
  semesterEnrollmentId?: string;
  courseOfferingId: string;
  courseGroupId: string;
  courseCategoryId: string;
  registrationStatus?: 'REGISTERED' | 'DROPPED' | 'APPROVED' | 'PENDING';
  status?: 'APPROVED' | 'PENDING' | 'REJECTED';
  registrationDate: string;
}

// Faculty Master (All Staff Persons: HOD, Class Tutor, Teachers, Office Staff, Principal)
export interface Faculty {
  id: string;
  authUserId?: string;
  employeeId?: string;
  employeeCode?: string;
  fullName: string;
  username?: string;
  password?: string;
  departmentId: string;
  designation: string;
  email: string;
  mobileNumber?: string;
  phone?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  roles: UserRole[];
  status?: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'RETIRED';
  isActive?: boolean;
  qualification?: string;
  joiningDate?: string;
  mustChangePassword?: boolean;
  isInvited?: boolean;
  invitationSentAt?: string;
}

// Faculty Course Assignment
export interface FacultyCourseAssignment {
  id: string;
  facultyId: string;
  courseOfferingId?: string;
  courseGroupId: string;
  assignmentRole?: AssignmentRole;
  role?: 'PRIMARY' | 'CO_TEACHER' | 'LAB_INSTRUCTOR' | AssignmentRole;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  reason?: string;
}

// Course Type classification for FYUGP subject requests
export type CourseType = 'MAJOR' | 'MINOR' | 'MDC' | 'AEC' | 'SEC' | 'VAC' | 'DSC' | 'OTHER';

// Status for faculty subject requests
export type SubjectRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'CANCELLED' | 'NEEDS_CHANGES';

// Faculty Subject Request (teacher requests teaching assignment)
export interface FacultySubjectRequest {
  id: string;
  requestedBy: string; // Auth User ID or Faculty ID
  requestedByFacultyId?: string;
  departmentId: string; // Department of the course / teacher
  courseName: string;
  proposedCourseCode?: string;
  courseType: CourseType;
  programmeId?: string;
  semesterNumber?: number;
  academicYear?: string;
  academicYearId?: string;
  existingCourseId?: string;
  existingCourseGroupId?: string;
  proposedGroupName?: string;
  requestNotes?: string;
  status: SubjectRequestStatus;
  reviewedBy?: string;
  reviewedByFacultyId?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  isProvisional?: boolean;
}

// Historical record of teaching assignments
export interface FacultyAssignmentHistory {
  id: string;
  courseGroupId: string;
  facultyId: string;
  facultyAuthUserId?: string;
  departmentId: string;
  assignmentRole: 'PRIMARY' | 'CO_TEACHER' | 'LAB_INSTRUCTOR';
  effectiveFrom: string;
  effectiveUntil?: string;
  sourceRequestId?: string;
  assignedBy: string;
  endedBy?: string;
  reason?: string;
  createdAt: string;
}

// Audit events for subject requests and assignments
export interface FacultySubjectAudit {
  id: string;
  requestId?: string;
  assignmentHistoryId?: string;
  action: string;
  performedBy: string;
  details: Record<string, any>;
  createdAt: string;
}

// Timetable Period
export interface TimetablePeriod {
  id: string;
  periodNumber: number;
  label: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  isActive: boolean;
}

// Timetable Entry
export interface TimetableEntry {
  id: string;
  academicYear?: string;
  semesterNumber?: number;
  courseOfferingId?: string;
  courseGroupId: string;
  facultyId: string;
  dayOfWeek?: DayOfWeek;
  weekday?: DayOfWeek;
  periodId: string;
  room?: string;
  roomNumber?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  isActive?: boolean;
}

// Class Session
export interface ClassSession {
  id: string;
  courseOfferingId: string;
  courseGroupId: string;
  facultyId: string;
  date: string;
  periodId: string;
  startTime: string;
  endTime: string;
  topicCovered: string;
  sessionType: 'REGULAR' | 'SUBSTITUTE' | 'EXTRA' | 'LAB' | 'REMEDIAL';
  status: 'SCHEDULED' | 'CONDUCTED' | 'CANCELLED' | 'COMPLETED';
  attendanceSubmitted: boolean;
  submittedTimestamp?: string;
  substituteFacultyId?: string;
  timetableEntryId?: string;
  sessionSource?: 'TIMETABLE' | 'EXTRA' | 'MANUAL';
  cancellationReason?: string;
  room?: string;
  remarks?: string;
  createdAt?: string;
}

// Attendance Record
export interface AttendanceRecord {
  id: string;
  classSessionId: string;
  studentId: string;
  status: AttendanceStatus;
  markedByFacultyId: string;
  markedTimestamp: string;
  remarks?: string;
}

// Attendance Correction Request
export interface AttendanceCorrectionRequest {
  id: string;
  studentId: string;
  classSessionId: string;
  oldStatus: AttendanceStatus;
  requestedStatus: AttendanceStatus;
  reason: string;
  requestedByFacultyId: string;
  requestedDate: string;
  status: CorrectionRequestStatus;
  reviewedByFacultyId?: string;
  reviewDate?: string;
  reviewRemarks?: string;
  requestGroupId?: string;
}

// Substitute Faculty Assignment
export interface SubstituteAssignment {
  id: string;
  originalFacultyId: string;
  substituteFacultyId: string;
  courseGroupId: string;
  classSessionId?: string;
  timetableEntryId?: string;
  date: string;
  periodId: string;
  reason: string;
  status: 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  approvedByHodId: string;
  createdAt: string;
}

// Daily Schedule Overrides (PERIOD_SWAP, PERIOD_MOVE, ROOM_CHANGE, EXTRA_CLASS, CANCELLED_CLASS, SUBSTITUTE)
export type ScheduleOverrideType =
  | 'PERIOD_SWAP'
  | 'PERIOD_MOVE'
  | 'ROOM_CHANGE'
  | 'EXTRA_CLASS'
  | 'CANCELLED_CLASS'
  | 'SUBSTITUTE';

export interface DailyScheduleOverride {
  id: string;
  date: string;
  timetableEntryId?: string;
  overrideType: ScheduleOverrideType;
  originalPeriodId?: string;
  newPeriodId?: string;
  originalFacultyId?: string;
  substituteFacultyId?: string;
  originalRoom?: string;
  newRoom?: string;
  courseGroupId?: string;
  courseOfferingId?: string;
  reason?: string;
  createdByFacultyId?: string;
  createdAt?: string;
}

// Class Tutor Assignment
export interface ClassTutorAssignment {
  id: string;
  facultyId: string;
  programmeId: string;
  academicYearId?: string;
  semesterId?: string;
  batchName?: string;
  departmentId?: string;
  isActive: boolean;
  createdAt?: string;
}

// Announcement
export interface Announcement {
  id: string;
  title: string;
  message?: string;
  content?: string;
  category?: string;
  targetRoles?: string[];
  isImportant?: boolean;
  publishedAt?: string;
  attachmentUrl?: string;
  priority?: PriorityLevel;
  targetAudience?: AnnouncementAudience | 'ALL' | 'STUDENTS' | 'FACULTY';
  targetDepartmentId?: string;
  targetProgrammeId?: string;
  targetSemester?: number;
  startDate?: string;
  publishDate?: string;
  expiryDate?: string;
  authorName?: string;
  createdBy?: string;
  createdAt?: string;
  isPinned?: boolean;
}

// Notification
export interface AppNotification {
  id: string;
  userId?: string;
  targetRole?: UserRole;
  title: string;
  body: string;
  type:
    | 'ATTENDANCE_WARNING'
    | 'SUBMISSION_PENDING'
    | 'CORRECTION_REQUEST'
    | 'ANNOUNCEMENT'
    | 'SYSTEM'
    | 'SUBJECT_REQUEST'
    | 'SUBJECT_APPROVAL'
    | 'SUBJECT_REJECTION'
    | 'FACULTY_REASSIGNMENT';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
}

// Attendance Statistics for Student View
export interface CourseAttendanceSummary {
  registrationId?: string;
  courseOfferingId?: string;
  courseGroupId?: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  courseCategory: string;
  categoryColorHex: string;
  groupName: string;
  facultyName: string;
  credits: number;
  conductedCount: number;
  presentCount: number;
  odCount: number;
  medicalLeaveCount: number;
  absentCount: number;
  percentage: number;
  isShortage: boolean;
  isWarning: boolean;
  classesNeededForMin: number;
  classesCanMiss: number;
}

// Special Attendance Module Types
export type AttendanceSource = 'NORMAL' | 'SPECIAL';

export type SpecialAttendanceEventType =
  | 'COLLEGE_PROGRAMME'
  | 'UNION_PROGRAMME'
  | 'STRIKE'
  | 'OFFICIAL_EVENT'
  | 'DEPARTMENT_PROGRAMME'
  | 'SPORTS'
  | 'NSS'
  | 'NCC'
  | 'CULTURAL'
  | 'SEMINAR'
  | 'EXAM_DUTY'
  | 'OTHER';

export type SpecialAttendanceScope =
  | 'COLLEGE'
  | 'DEPARTMENT'
  | 'PROGRAMME'
  | 'BATCH'
  | 'COURSE_GROUP'
  | 'SELECTED_STUDENTS';

export type StudentCoverageType = 'ALL_ELIGIBLE' | 'SELECTED_ONLY';

export type SpecialAttendanceStatus = 'DRAFT' | 'APPROVED' | 'APPLIED' | 'CANCELLED';

export interface SpecialAttendanceEvent {
  id: string;
  title: string;
  description?: string;
  eventType: SpecialAttendanceEventType;
  eventDate: string; // YYYY-MM-DD
  periodIds: string[];
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  scopeType: SpecialAttendanceScope;
  departmentId?: string | null;
  programmeId?: string | null;
  batchId?: string | null;
  semesterId?: string | null;
  courseGroupId?: string | null;
  studentCoverage: StudentCoverageType;
  selectedStudentIds?: string[];
  reason: string;
  status: SpecialAttendanceStatus;
  createdBy: string;
  createdByName?: string;
  createdByRole?: UserRole;
  approvedBy?: string | null;
  approvedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialAttendanceRecord {
  id: string;
  eventId: string;
  studentId: string;
  date: string;
  periodId: string;
  attendanceStatus: 'SPECIAL' | 'OD' | 'PRESENT';
  attendanceSource: 'SPECIAL';
  normalSessionConflictStatus?: 'NO_SESSION' | 'NORMAL_PRESENT' | 'NORMAL_ABSENT' | 'OVERRIDDEN' | 'SESSION_CANCELLED';
  remarks?: string;
  createdAt: string;
}

// ==========================================
// AUDIENCE TARGETING & SCOPES
// ==========================================
export type TargetScope = 'COLLEGE' | 'DEPARTMENT' | 'PROGRAMME' | 'BATCH' | 'SEMESTER' | 'COURSE_GROUP' | 'ROLE' | 'SELECTED_USERS';

export interface AudienceCriteria {
  scope: TargetScope;
  targetDepartmentId?: string;
  targetProgrammeId?: string;
  targetBatchId?: string;
  targetSemester?: number;
  targetRoles?: UserRole[];
  targetUserIds?: string[];
}

// ==========================================
// CIRCULARS & NOTICES ENHANCEMENTS
// ==========================================
export interface Circular {
  id: string;
  title: string;
  referenceNumber: string; // e.g. "NSS/CIR/2026/042"
  description: string;
  issuingAuthority: string; // e.g. "Principal Office", "HOD Economics"
  scope: TargetScope;
  targetDepartmentId?: string;
  targetProgrammeId?: string;
  targetBatchId?: string;
  targetSemester?: number;
  targetRoles: UserRole[];
  priority: PriorityLevel;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveUntil?: string; // YYYY-MM-DD
  attachmentUrl?: string;
  attachmentName?: string;
  requiresAcknowledgement: boolean;
  acknowledgedStudentIds?: string[];
  status: 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
}

// ==========================================
// OD / LEAVE REQUEST SYSTEM
// ==========================================
export type LeaveType = 'OD' | 'MEDICAL_LEAVE' | 'AUTHORIZED_LEAVE' | 'SPORTS_OD' | 'NSS_NCC_OD' | 'OTHER';
export type LeaveRequestStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface StudentLeaveRequest {
  id: string;
  studentId: string;
  type: LeaveType;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  isFullDay: boolean;
  affectedPeriodIds?: string[];
  reason: string;
  documentUrl?: string;
  documentName?: string;
  status: LeaveRequestStatus;
  reviewedByFacultyId?: string;
  reviewedByName?: string;
  reviewRemarks?: string;
  reviewedAt?: string;
  appliedToAttendance?: boolean;
  createdAt: string;
}

// ==========================================
// STUDENT CERTIFICATE & SERVICE REQUESTS
// ==========================================
export type CertificateType =
  | 'BONAFIDE'
  | 'CONDUCT'
  | 'FEE_STRUCTURE'
  | 'STUDENT_VERIFICATION'
  | 'RECOMMENDATION_LETTER'
  | 'MEDIUM_OF_INSTRUCTION'
  | 'BUS_CONCESSION'
  | 'OTHER';

export type CertificateRequestStatus = 'SUBMITTED' | 'PROCESSING' | 'READY' | 'COLLECTED' | 'REJECTED';

export interface StudentCertificateRequest {
  id: string;
  studentId: string;
  certificateType: CertificateType;
  purpose: string;
  numberOfCopies: number;
  status: CertificateRequestStatus;
  processingRemarks?: string;
  readyDate?: string;
  collectedDate?: string;
  handledByStaffId?: string;
  handledByName?: string;
  createdAt: string;
}

// ==========================================
// ACADEMIC CALENDAR & EVENTS
// ==========================================
export type AcademicEventType =
  | 'COLLEGE_EVENT'
  | 'DEPARTMENT_EVENT'
  | 'INTERNAL_EXAM'
  | 'UNIVERSITY_EXAM'
  | 'HOLIDAY'
  | 'ACADEMIC_DEADLINE'
  | 'SEMINAR'
  | 'WORKSHOP'
  | 'CULTURAL'
  | 'SPORTS'
  | 'NSS_NCC'
  | 'ASSOCIATION_MEET'
  | 'OTHER';

export interface AcademicCalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: AcademicEventType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  venue?: string;
  scope: TargetScope;
  departmentId?: string;
  programmeId?: string;
  semester?: number;
  targetRoles?: UserRole[];
  isHoliday?: boolean;
  color?: string;
  createdAt: string;
}

// ==========================================
// ACADEMIC RESOURCES & DOWNLOADS
// ==========================================
export type ResourceCategory =
  | 'SYLLABUS'
  | 'CALENDAR'
  | 'REGULATIONS'
  | 'FORMS'
  | 'PREVIOUS_QP'
  | 'DEPT_MATERIAL'
  | 'COURSE_RESOURCE'
  | 'HANDBOOK'
  | 'LAB_MANUAL'
  | 'OTHER';

export interface AcademicResource {
  id: string;
  title: string;
  category: ResourceCategory;
  description?: string;
  departmentId?: string;
  programmeId?: string;
  semester?: number;
  courseId?: string;
  courseCode?: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  downloadCount: number;
}

// ==========================================
// EMERGENCY & IMPORTANT ALERTS
// ==========================================
export type EmergencyAlertType =
  | 'CLASSES_SUSPENDED'
  | 'CAMPUS_CLOSED'
  | 'EXAM_POSTPONED'
  | 'EMERGENCY_INSTRUCTION'
  | 'WEATHER_ALERT'
  | 'IMPORTANT_ACADEMIC';

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  type: EmergencyAlertType;
  priority: 'HIGH' | 'CRITICAL';
  scope: 'COLLEGE' | 'DEPARTMENT';
  departmentId?: string;
  startTime: string; // ISO date-time
  expiryTime: string; // ISO date-time
  isActive: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

// ==========================================
// TIMETABLE CHANGE ALERTS
// ==========================================
export type TimetableChangeType =
  | 'CANCELLED'
  | 'SUBSTITUTE'
  | 'ROOM_CHANGED'
  | 'PERIOD_SWAP'
  | 'EXTRA_CLASS'
  | 'PERIOD_MOVED';

export interface TimetableChangeAlert {
  id: string;
  date: string; // YYYY-MM-DD
  periodId: string;
  courseGroupId: string;
  changeType: TimetableChangeType;
  description: string;
  originalFacultyId?: string;
  originalFacultyName?: string;
  substituteFacultyId?: string;
  substituteFacultyName?: string;
  newRoom?: string;
  createdAt: string;
}
