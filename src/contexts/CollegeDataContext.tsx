import React, { createContext, useContext, useState, useEffect } from 'react';
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
  AttendanceStatus,
  CourseAttendanceSummary,
  SpecialAttendanceEvent,
  SpecialAttendanceRecord,
  SpecialAttendanceStatus,
  DayOfWeek,
  DailyScheduleOverride,
  ClassTutorAssignment,
  ScheduleOverrideType,
  FacultySubjectRequest,
  FacultyAssignmentHistory,
  CourseType,
  SubjectRequestStatus,
  UserRole
} from '../types';
import {
  initialSystemSettings,
  initialDepartments,
  initialProgrammes,
  initialAcademicYears,
  initialAdmissionBatches,
  initialSemesters,
  initialCourseCategories,
  initialCourses,
  initialCourseOfferings,
  initialCourseGroups,
  initialStudents,
  initialSemesterEnrollments,
  initialStudentCourseRegistrations,
  initialFaculty,
  initialFacultyAssignments,
  initialTimetablePeriods,
  initialTimetableEntries,
  initialClassSessions,
  initialAttendanceRecords,
  initialCorrectionRequests,
  initialSubstituteAssignments,
  initialAnnouncements,
  initialNotifications,
  initialAuditLogs,
  initialSpecialAttendanceEvents,
  initialSpecialAttendanceRecords,
  initialDailyScheduleOverrides,
  initialClassTutorAssignments,
  initialFacultySubjectRequests,
  initialFacultyAssignmentHistory
} from '../data/initialData';
import { generateDefaultStudentPassword } from '../utils/credentialValidation';
import { useAuth } from './AuthContext';
import { departmentService } from '../services/departmentService';
import { programmeService } from '../services/programmeService';
import { courseService } from '../services/courseService';
import { studentService } from '../services/studentService';
import { facultyService } from '../services/facultyService';
import { timetableService } from '../services/timetableService';
import { attendanceService } from '../services/attendanceService';
import { scheduleOverrideService } from '../services/scheduleOverrideService';
import { specialAttendanceService } from '../services/specialAttendanceService';
import { settingsService } from '../services/settingsService';
import { academicService } from '../services/academicService';
import { announcementService } from '../services/announcementService';
import { auditLogService } from '../services/auditLogService';
import { facultySubjectService } from '../services/facultySubjectService';

export type SyncStatus = 'CONNECTED' | 'SYNCING' | 'PARTIAL' | 'OFFLINE';

export interface DomainHealth {
  departments: 'ok' | 'error' | 'empty';
  programmes: 'ok' | 'error' | 'empty';
  courses: 'ok' | 'error' | 'empty';
  courseCategories: 'ok' | 'error' | 'empty';
  courseOfferings: 'ok' | 'error' | 'empty';
  courseGroups: 'ok' | 'error' | 'empty';
  students: 'ok' | 'error' | 'empty';
  faculty: 'ok' | 'error' | 'empty';
  facultyAssignments: 'ok' | 'error' | 'empty';
  timetablePeriods: 'ok' | 'error' | 'empty';
  timetableEntries: 'ok' | 'error' | 'empty';
  classSessions: 'ok' | 'error' | 'empty';
  attendanceRecords: 'ok' | 'error' | 'empty';
  correctionRequests: 'ok' | 'error' | 'empty';
  studentRegistrations: 'ok' | 'error' | 'empty';
  semesterEnrollments: 'ok' | 'error' | 'empty';
  announcements: 'ok' | 'error' | 'empty';
  auditLogs: 'ok' | 'error' | 'empty';
  specialAttendance: 'ok' | 'error' | 'empty';
  settings: 'ok' | 'error';
}

interface CollegeDataContextType {
  isDbConnected: boolean;
  syncStatus: SyncStatus;
  domainHealth: DomainHealth;
  lastSyncTimestamp: string | null;
  syncWithDatabase: () => Promise<void>;
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<{ success: boolean; error?: string }>;

  departments: Department[];
  addDepartment: (dept: Omit<Department, 'id'>) => Promise<{ success: boolean; data?: Department; error?: string }>;
  updateDepartment: (id: string, dept: Partial<Department>) => Promise<{ success: boolean; error?: string }>;
  toggleDepartmentStatus: (id: string) => Promise<{ success: boolean; error?: string }>;

  programmes: Programme[];
  addProgramme: (prog: Omit<Programme, 'id'>) => Promise<{ success: boolean; data?: Programme; error?: string }>;
  updateProgramme: (id: string, prog: Partial<Programme>) => Promise<{ success: boolean; error?: string }>;
  toggleProgrammeStatus: (id: string) => Promise<{ success: boolean; error?: string }>;

  academicYears: AcademicYear[];
  admissionBatches: AdmissionBatch[];
  updateAdmissionBatch: (id: string, batch: Partial<AdmissionBatch>) => Promise<{ success: boolean; error?: string }>;
  semesters: Semester[];

  courseCategories: CourseCategory[];
  addCourseCategory: (cat: Omit<CourseCategory, 'id'>) => Promise<{ success: boolean; data?: CourseCategory; error?: string }>;
  updateCourseCategory: (id: string, cat: Partial<CourseCategory>) => Promise<{ success: boolean; error?: string }>;

  courses: Course[];
  addCourse: (course: Omit<Course, 'id'>) => Promise<{ success: boolean; data?: Course; error?: string }>;
  updateCourse: (id: string, course: Partial<Course>) => Promise<{ success: boolean; error?: string }>;

  courseOfferings: CourseOffering[];
  addCourseOffering: (off: Omit<CourseOffering, 'id'>) => Promise<{ success: boolean; data?: CourseOffering; error?: string }>;
  updateCourseOffering: (id: string, off: Partial<CourseOffering>) => Promise<{ success: boolean; error?: string }>;

  courseGroups: CourseGroup[];
  addCourseGroup: (group: Omit<CourseGroup, 'id'>) => Promise<{ success: boolean; data?: CourseGroup; error?: string }>;
  updateCourseGroup: (id: string, group: Partial<CourseGroup>) => Promise<{ success: boolean; error?: string }>;

  students: Student[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<{ success: boolean; data?: Student; error?: string }>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<{ success: boolean; error?: string }>;
  deleteStudent: (id: string) => Promise<{ success: boolean; error?: string }>;

  semesterEnrollments: SemesterEnrollment[];
  studentCourseRegistrations: StudentCourseRegistration[];
  registerStudentForCourse: (reg: Omit<StudentCourseRegistration, 'id'>) => Promise<{ success: boolean; data?: StudentCourseRegistration; error?: string }>;
  bulkRegisterStudents: (regs: Omit<StudentCourseRegistration, 'id'>[]) => Promise<{ success: boolean; error?: string }>;
  removeStudentCourseRegistration: (id: string) => Promise<{ success: boolean; error?: string }>;

  faculty: Faculty[];
  addFaculty: (fac: Omit<Faculty, 'id'>) => Promise<{ success: boolean; data?: Faculty; error?: string }>;
  updateFaculty: (id: string, fac: Partial<Faculty>) => Promise<{ success: boolean; error?: string }>;
  deleteFaculty: (id: string) => Promise<{ success: boolean; error?: string }>;

  facultyAssignments: FacultyCourseAssignment[];
  assignFacultyToCourse: (assign: Omit<FacultyCourseAssignment, 'id'>) => Promise<{ success: boolean; data?: FacultyCourseAssignment; error?: string }>;
  deleteFacultyAssignment: (id: string) => Promise<{ success: boolean; error?: string }>;

  facultySubjectRequests: FacultySubjectRequest[];
  facultyAssignmentHistory: FacultyAssignmentHistory[];
  submitFacultySubjectRequest: (req: Omit<FacultySubjectRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<{ success: boolean; data?: FacultySubjectRequest; error?: string }>;
  reviewFacultySubjectRequest: (
    requestId: string,
    status: SubjectRequestStatus,
    reviewNotes: string,
    reviewerId: string,
    approvalOptions?: {
      courseId?: string;
      courseOfferingId?: string;
      courseGroupId?: string;
      targetFacultyId?: string;
      departmentId?: string;
      isProvisional?: boolean;
      proposedCourseCode?: string;
      courseName?: string;
      groupName?: string;
      courseType?: CourseType;
      programmeId?: string;
      semesterNumber?: number;
      academicYear?: string;
    }
  ) => Promise<{ success: boolean; error?: string; assignmentId?: string }>;
  reassignFacultySubject: (params: {
    assignmentId?: string;
    courseGroupId: string;
    courseOfferingId?: string;
    departmentId: string;
    currentFacultyId: string;
    newFacultyId: string;
    effectiveDate: string;
    reason: string;
    assignedBy: string;
    updateTimetable?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  mapProvisionalCourse: (
    provisionalCourseId: string,
    officialDetails: {
      courseCode: string;
      courseTitle: string;
      credits?: number;
      categoryId?: string;
    },
    mappedBy: string
  ) => Promise<{ success: boolean; error?: string }>;
  inviteOrEnrollTeacher: (teacherData: {
    fullName: string;
    employeeCode: string;
    departmentId: string;
    email: string;
    phone: string;
    designation: string;
    roles: UserRole[];
    status?: 'ACTIVE' | 'INACTIVE';
  }) => Promise<{ success: boolean; data?: Faculty; tempPassword?: string; error?: string }>;

  timetablePeriods: TimetablePeriod[];
  updateTimetablePeriods: (periods: TimetablePeriod[]) => Promise<{ success: boolean; error?: string }>;

  timetableEntries: TimetableEntry[];
  addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => Promise<{ success: boolean; data?: TimetableEntry; error?: string }>;
  updateTimetableEntry: (id: string, entry: Partial<TimetableEntry>) => Promise<{ success: boolean; error?: string }>;
  deleteTimetableEntry: (id: string) => Promise<{ success: boolean; error?: string }>;

  classSessions: ClassSession[];
  addClassSession: (session: Omit<ClassSession, 'id'>) => Promise<{ success: boolean; data?: ClassSession; error?: string; id?: string }>;
  updateClassSession: (id: string, session: Partial<ClassSession>) => Promise<{ success: boolean; error?: string }>;

  attendanceRecords: AttendanceRecord[];
  submitAttendance: (
    classSessionId: string,
    records: { studentId: string; status: AttendanceStatus; remarks?: string }[],
    topicCovered?: string
  ) => Promise<{ success: boolean; error?: string }>;

  correctionRequests: AttendanceCorrectionRequest[];
  submitCorrectionRequest: (req: Omit<AttendanceCorrectionRequest, 'id' | 'requestedDate' | 'status'>) => Promise<{ success: boolean; data?: AttendanceCorrectionRequest; error?: string }>;
  reviewCorrectionRequest: (requestId: string, status: 'APPROVED' | 'REJECTED', remarks?: string) => Promise<{ success: boolean; error?: string }>;

  // Special / Institutional Attendance
  specialAttendanceEvents: SpecialAttendanceEvent[];
  specialAttendanceRecords: SpecialAttendanceRecord[];
  createSpecialAttendanceEvent: (
    event: Omit<SpecialAttendanceEvent, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ success: boolean; data?: SpecialAttendanceEvent; error?: string }>;
  updateSpecialAttendanceStatus: (
    id: string,
    status: SpecialAttendanceStatus,
    remarks?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteSpecialAttendanceEvent: (id: string) => Promise<{ success: boolean; error?: string }>;

  substituteAssignments: SubstituteAssignment[];
  assignSubstitute: (sub: {
    classSessionId?: string;
    timetableEntryId?: string;
    originalFacultyId: string;
    substituteFacultyId: string;
    courseGroupId: string;
    date: string;
    periodId: string;
    reason: string;
    approvedByHodId: string;
  }) => Promise<{ success: boolean; error?: string }>;

  dailyScheduleOverrides: DailyScheduleOverride[];
  classTutorAssignments: ClassTutorAssignment[];
  getOrCreateSessionForTimetableEntry: (timetableEntryId: string, date: string) => Promise<ClassSession>;
  getDailyScheduledClasses: (date: string, facultyId?: string, departmentId?: string) => {
    timetableEntry?: TimetableEntry;
    session?: ClassSession;
    period?: TimetablePeriod;
    courseOffering?: CourseOffering;
    course?: Course;
    courseGroup?: CourseGroup;
    category?: CourseCategory;
    scheduledFaculty?: Faculty;
    effectiveFaculty?: Faculty;
    substituteFaculty?: Faculty;
    isSubstitute: boolean;
    isCancelled: boolean;
    isExtra: boolean;
    isPending: boolean;
    isConducted: boolean;
    room: string;
    statusBadge: 'CONDUCTED' | 'PENDING' | 'CANCELLED' | 'UPCOMING';
  }[];
  createScheduleOverride: (override: Omit<DailyScheduleOverride, 'id' | 'createdAt'>) => Promise<{ success: boolean; data?: DailyScheduleOverride; error?: string }>;
  cancelScheduledClass: (timetableEntryId: string, date: string, reason: string, facultyId?: string) => Promise<{ success: boolean; error?: string }>;
  createExtraClass: (data: {
    date: string;
    periodId: string;
    courseOfferingId: string;
    courseGroupId: string;
    facultyId: string;
    room?: string;
    reason?: string;
  }) => Promise<{ success: boolean; data?: ClassSession; error?: string }>;
  submitBatchCorrectionRequest: (
    sessionId: string,
    corrections: { studentId: string; oldStatus: AttendanceStatus; requestedStatus: AttendanceStatus }[],
    reason: string,
    facultyId: string
  ) => Promise<{ success: boolean; requestGroupId?: string; error?: string }>;
  reviewCorrectionBatch: (
    requestGroupId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewRemarks?: string,
    reviewedByFacultyId?: string
  ) => Promise<{ success: boolean; error?: string }>;
  getClassTutorCohort: (facultyId?: string) => {
    assignment?: ClassTutorAssignment;
    programme?: Programme;
    department?: Department;
    batchName: string;
    cohortStudents: Student[];
  } | null;

  announcements: Announcement[];
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt'>) => Promise<{ success: boolean; data?: Announcement; error?: string }>;
  deleteAnnouncement: (id: string) => Promise<{ success: boolean; error?: string }>;

  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, entityType: string, entityId: string, newData?: any, oldData?: any) => void;

  // Analytical Helpers
  getStudentAttendanceSummary: (studentId: string) => {
    overallPercentage: number;
    totalConducted: number;
    totalPresent: number;
    totalOd: number;
    totalMedicalLeave: number;
    totalAbsent: number;
    isShortage: boolean;
    isWarning: boolean;
    courses: CourseAttendanceSummary[];
  };

  getCourseGroupRegisteredStudents: (courseGroupId: string) => (Student & { registrationCategory: CourseCategory | undefined })[];
  getPendingAttendanceSessions: (facultyId?: string, departmentId?: string) => ClassSession[];
  exportAttendanceReportToCsv: (filename?: string) => void;
  resetToDefaultData: () => void;
}

const CollegeDataContext = createContext<CollegeDataContextType | undefined>(undefined);

const STORAGE_PREFIX = 'nss_erp_';

export const getFacultyCredentialOverrides = (): Record<string, { username?: string; password?: string }> => {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(`${STORAGE_PREFIX}faculty_credentials`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveFacultyCredentialOverride = (id: string, username?: string, password?: string, altKeys: string[] = []) => {
  try {
    if (typeof window === 'undefined') return;
    const creds = getFacultyCredentialOverrides();
    const entry = {
      ...(creds[id] || {}),
      ...(username ? { username } : {}),
      ...(password ? { password } : {})
    };
    creds[id] = entry;
    altKeys.forEach(k => {
      if (k && k.trim()) creds[k] = entry;
    });
    localStorage.setItem(`${STORAGE_PREFIX}faculty_credentials`, JSON.stringify(creds));
  } catch (e) {
    console.error('Error saving faculty credential override:', e);
  }
};

// Purge legacy demo / fake data from localStorage so the app starts with real data only
if (typeof window !== 'undefined') {
  const cleanupKey = `${STORAGE_PREFIX}real_data_purged_v4`;
  if (localStorage.getItem(cleanupKey) !== 'true') {
    const keysToPurge = [
      `${STORAGE_PREFIX}timetable_entries`,
      `${STORAGE_PREFIX}class_sessions`,
      `${STORAGE_PREFIX}attendance_records`,
      `${STORAGE_PREFIX}correction_requests`,
      `${STORAGE_PREFIX}substitute_assignments`,
      `${STORAGE_PREFIX}announcements`,
      `${STORAGE_PREFIX}notifications`,
      `${STORAGE_PREFIX}special_attendance_events`,
      `${STORAGE_PREFIX}special_attendance_records`,
      `${STORAGE_PREFIX}circulars`,
      `${STORAGE_PREFIX}leave_requests`,
      `${STORAGE_PREFIX}certificate_requests`,
      `${STORAGE_PREFIX}academic_events`,
      `${STORAGE_PREFIX}academic_resources`,
      `${STORAGE_PREFIX}emergency_alerts`,
      `${STORAGE_PREFIX}timetable_change_alerts`
    ];
    keysToPurge.forEach(k => localStorage.removeItem(k));
    localStorage.setItem(cleanupKey, 'true');
  }
}

export const CollegeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Initialize state from LocalStorage or initial seeded data
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    return saved ? JSON.parse(saved) : initialSystemSettings;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}departments`);
    return saved ? JSON.parse(saved) : initialDepartments;
  });

  const [programmes, setProgrammes] = useState<Programme[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}programmes`);
    return saved ? JSON.parse(saved) : initialProgrammes;
  });

  const [academicYears] = useState<AcademicYear[]>(initialAcademicYears);
  const [admissionBatches, setAdmissionBatches] = useState<AdmissionBatch[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}admission_batches`);
    return saved ? JSON.parse(saved) : initialAdmissionBatches;
  });
  const [semesters] = useState<Semester[]>(initialSemesters);

  const [courseCategories, setCourseCategories] = useState<CourseCategory[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}course_categories`);
    return saved ? JSON.parse(saved) : initialCourseCategories;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}courses`);
    return saved ? JSON.parse(saved) : initialCourses;
  });

  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}course_offerings`);
    return saved ? JSON.parse(saved) : initialCourseOfferings;
  });

  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}course_groups`);
    return saved ? JSON.parse(saved) : initialCourseGroups;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}students`);
    if (saved) {
      try {
        const parsed: Student[] = JSON.parse(saved);
        // Normalize any students to ensure username is University Register Number and default password is DOB + Mobile last 2 digits
        return parsed.map(s => {
          let updated = { ...s };
          if (!updated.username && updated.universityRegisterNumber) {
            updated.username = updated.universityRegisterNumber.toUpperCase();
          } else if (updated.username && updated.username.startsWith('stu') && updated.universityRegisterNumber) {
            updated.username = updated.universityRegisterNumber.toUpperCase();
          }
          if ((!updated.password || updated.password === 'Nss2026!') && updated.dateOfBirth && (updated.mobileNumber || updated.phone || updated.phoneNumber)) {
            const defPass = generateDefaultStudentPassword(updated.dateOfBirth, updated.mobileNumber || updated.phone || updated.phoneNumber);
            if (defPass) {
              updated.password = defPass;
            }
          }
          return updated;
        });
      } catch (e) {
        console.error('Error parsing stored students:', e);
      }
    }
    return initialStudents;
  });

  const [semesterEnrollments, setSemesterEnrollments] = useState<SemesterEnrollment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}semester_enrollments`);
    return saved ? JSON.parse(saved) : initialSemesterEnrollments;
  });

  const [studentCourseRegistrations, setStudentCourseRegistrations] = useState<StudentCourseRegistration[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}student_course_registrations`);
    return saved ? JSON.parse(saved) : initialStudentCourseRegistrations;
  });

  const [faculty, setFaculty] = useState<Faculty[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}faculty`);
    const base: Faculty[] = saved ? JSON.parse(saved) : initialFaculty;
    const creds = getFacultyCredentialOverrides();
    return base.map(f => {
      const override = creds[f.id] || creds[f.employeeId || ''] || creds[f.email || ''];
      return {
        ...f,
        username: override?.username || f.username || '',
        password: override?.password || f.password || ''
      };
    });
  });

  const [facultyAssignments, setFacultyAssignments] = useState<FacultyCourseAssignment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}faculty_assignments`);
    return saved ? JSON.parse(saved) : initialFacultyAssignments;
  });

  const [timetablePeriods, setTimetablePeriods] = useState<TimetablePeriod[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}timetable_periods`);
    return saved ? JSON.parse(saved) : initialTimetablePeriods;
  });

  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}timetable_entries`);
    return saved ? JSON.parse(saved) : initialTimetableEntries;
  });

  const [classSessions, setClassSessions] = useState<ClassSession[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}class_sessions`);
    return saved ? JSON.parse(saved) : initialClassSessions;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}attendance_records`);
    return saved ? JSON.parse(saved) : initialAttendanceRecords;
  });

  const [correctionRequests, setCorrectionRequests] = useState<AttendanceCorrectionRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}correction_requests`);
    return saved ? JSON.parse(saved) : initialCorrectionRequests;
  });

  const [substituteAssignments, setSubstituteAssignments] = useState<SubstituteAssignment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}substitute_assignments`);
    return saved ? JSON.parse(saved) : initialSubstituteAssignments;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}announcements`);
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}notifications`);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}audit_logs`);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [specialAttendanceEvents, setSpecialAttendanceEvents] = useState<SpecialAttendanceEvent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}special_attendance_events`);
    return saved ? JSON.parse(saved) : initialSpecialAttendanceEvents;
  });

  const [specialAttendanceRecords, setSpecialAttendanceRecords] = useState<SpecialAttendanceRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}special_attendance_records`);
    return saved ? JSON.parse(saved) : initialSpecialAttendanceRecords;
  });

  const [dailyScheduleOverrides, setDailyScheduleOverrides] = useState<DailyScheduleOverride[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}daily_schedule_overrides`);
    return saved ? JSON.parse(saved) : initialDailyScheduleOverrides;
  });

  const [classTutorAssignments, setClassTutorAssignments] = useState<ClassTutorAssignment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}class_tutor_assignments`);
    return saved ? JSON.parse(saved) : initialClassTutorAssignments;
  });

  const [facultySubjectRequests, setFacultySubjectRequests] = useState<FacultySubjectRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}faculty_subject_requests`);
    return saved ? JSON.parse(saved) : initialFacultySubjectRequests;
  });

  const [facultyAssignmentHistory, setFacultyAssignmentHistory] = useState<FacultyAssignmentHistory[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}faculty_assignment_history`);
    return saved ? JSON.parse(saved) : initialFacultyAssignmentHistory;
  });

  // Auto-persist reactive changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}faculty_subject_requests`, JSON.stringify(facultySubjectRequests));
  }, [facultySubjectRequests]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}faculty_assignment_history`, JSON.stringify(facultyAssignmentHistory));
  }, [facultyAssignmentHistory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}departments`, JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}programmes`, JSON.stringify(programmes));
  }, [programmes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}admission_batches`, JSON.stringify(admissionBatches));
  }, [admissionBatches]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}course_categories`, JSON.stringify(courseCategories));
  }, [courseCategories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}courses`, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}course_offerings`, JSON.stringify(courseOfferings));
  }, [courseOfferings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}course_groups`, JSON.stringify(courseGroups));
  }, [courseGroups]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}students`, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}student_course_registrations`, JSON.stringify(studentCourseRegistrations));
  }, [studentCourseRegistrations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}faculty`, JSON.stringify(faculty));
  }, [faculty]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}faculty_assignments`, JSON.stringify(facultyAssignments));
  }, [facultyAssignments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}timetable_periods`, JSON.stringify(timetablePeriods));
  }, [timetablePeriods]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}timetable_entries`, JSON.stringify(timetableEntries));
  }, [timetableEntries]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}class_sessions`, JSON.stringify(classSessions));
  }, [classSessions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}attendance_records`, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}correction_requests`, JSON.stringify(correctionRequests));
  }, [correctionRequests]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}substitute_assignments`, JSON.stringify(substituteAssignments));
  }, [substituteAssignments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}announcements`, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}special_attendance_events`, JSON.stringify(specialAttendanceEvents));
  }, [specialAttendanceEvents]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}special_attendance_records`, JSON.stringify(specialAttendanceRecords));
  }, [specialAttendanceRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}daily_schedule_overrides`, JSON.stringify(dailyScheduleOverrides));
  }, [dailyScheduleOverrides]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}class_tutor_assignments`, JSON.stringify(classTutorAssignments));
  }, [classTutorAssignments]);

  // Database Connection State & Initial Hydration
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('SYNCING');
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);
  const [domainHealth, setDomainHealth] = useState<DomainHealth>({
    departments: 'empty',
    programmes: 'empty',
    courses: 'empty',
    courseCategories: 'empty',
    courseOfferings: 'empty',
    courseGroups: 'empty',
    students: 'empty',
    faculty: 'empty',
    facultyAssignments: 'empty',
    timetablePeriods: 'empty',
    timetableEntries: 'empty',
    classSessions: 'empty',
    attendanceRecords: 'empty',
    correctionRequests: 'empty',
    studentRegistrations: 'empty',
    semesterEnrollments: 'empty',
    announcements: 'empty',
    auditLogs: 'empty',
    specialAttendance: 'empty',
    settings: 'ok'
  });

  const syncWithDatabase = async () => {
    setSyncStatus('SYNCING');
    try {
      const [
        deptRes,
        progRes,
        crsRes,
        catRes,
        offRes,
        grpRes,
        stuRes,
        facRes,
        facAssignRes,
        periodRes,
        ttRes,
        sessRes,
        attRes,
        corrRes,
        regRes,
        enrRes,
        annRes,
        logRes,
        settRes,
        specialEventsRes,
        specialRecordsRes,
        overridesRes,
        tutorRes
      ] = await Promise.allSettled([
        departmentService.getDepartments(),
        programmeService.getProgrammes(),
        courseService.getCourses(),
        courseService.getCategories(),
        courseService.getOfferings(),
        courseService.getGroups(),
        studentService.getStudents(),
        facultyService.getFaculty(),
        facultyService.getAssignments(),
        timetableService.getPeriods(),
        timetableService.getEntries(),
        attendanceService.getSessions(),
        attendanceService.getRecords(),
        attendanceService.getCorrections(),
        studentService.getRegistrations(),
        academicService.getSemesterEnrollments(),
        announcementService.getAnnouncements(),
        auditLogService.getAuditLogs(),
        settingsService.getSettings(),
        specialAttendanceService.getEvents(),
        specialAttendanceService.getRecords(),
        scheduleOverrideService.getOverrides(),
        scheduleOverrideService.getClassTutorAssignments()
      ]);

      const health: DomainHealth = {
        departments: 'empty',
        programmes: 'empty',
        courses: 'empty',
        courseCategories: 'empty',
        courseOfferings: 'empty',
        courseGroups: 'empty',
        students: 'empty',
        faculty: 'empty',
        facultyAssignments: 'empty',
        timetablePeriods: 'empty',
        timetableEntries: 'empty',
        classSessions: 'empty',
        attendanceRecords: 'empty',
        correctionRequests: 'empty',
        studentRegistrations: 'empty',
        semesterEnrollments: 'empty',
        announcements: 'empty',
        auditLogs: 'empty',
        specialAttendance: 'empty',
        settings: 'ok'
      };

      let successCount = 0;
      let errorCount = 0;

      // Departments
      if (deptRes.status === 'fulfilled') {
        if (deptRes.value.error) {
          health.departments = 'error';
          errorCount++;
        } else if (deptRes.value.data && deptRes.value.data.length > 0) {
          setDepartments(deptRes.value.data);
          health.departments = 'ok';
          successCount++;
        } else {
          health.departments = 'empty';
          successCount++;
        }
      } else {
        health.departments = 'error';
        errorCount++;
      }

      // Programmes
      if (progRes.status === 'fulfilled') {
        if (progRes.value.error) {
          health.programmes = 'error';
          errorCount++;
        } else if (progRes.value.data && progRes.value.data.length > 0) {
          setProgrammes(progRes.value.data);
          health.programmes = 'ok';
          successCount++;
        } else {
          health.programmes = 'empty';
          successCount++;
        }
      } else {
        health.programmes = 'error';
        errorCount++;
      }

      // Courses
      if (crsRes.status === 'fulfilled') {
        if (crsRes.value.error) {
          health.courses = 'error';
          errorCount++;
        } else if (crsRes.value.data && crsRes.value.data.length > 0) {
          setCourses(crsRes.value.data);
          health.courses = 'ok';
          successCount++;
        } else {
          health.courses = 'empty';
          successCount++;
        }
      } else {
        health.courses = 'error';
        errorCount++;
      }

      // Course Categories
      if (catRes.status === 'fulfilled') {
        if (catRes.value.error) {
          health.courseCategories = 'error';
          errorCount++;
        } else if (catRes.value.data && catRes.value.data.length > 0) {
          setCourseCategories(catRes.value.data);
          health.courseCategories = 'ok';
          successCount++;
        } else {
          health.courseCategories = 'empty';
          successCount++;
        }
      } else {
        health.courseCategories = 'error';
        errorCount++;
      }

      // Course Offerings
      if (offRes.status === 'fulfilled') {
        if (offRes.value.error) {
          health.courseOfferings = 'error';
          errorCount++;
        } else if (offRes.value.data && offRes.value.data.length > 0) {
          setCourseOfferings(offRes.value.data);
          health.courseOfferings = 'ok';
          successCount++;
        } else {
          health.courseOfferings = 'empty';
          successCount++;
        }
      } else {
        health.courseOfferings = 'error';
        errorCount++;
      }

      // Course Groups
      if (grpRes.status === 'fulfilled') {
        if (grpRes.value.error) {
          health.courseGroups = 'error';
          errorCount++;
        } else if (grpRes.value.data && grpRes.value.data.length > 0) {
          setCourseGroups(grpRes.value.data);
          health.courseGroups = 'ok';
          successCount++;
        } else {
          health.courseGroups = 'empty';
          successCount++;
        }
      } else {
        health.courseGroups = 'error';
        errorCount++;
      }

      // Students
      if (stuRes.status === 'fulfilled') {
        if (stuRes.value.error) {
          health.students = 'error';
          errorCount++;
        } else if (stuRes.value.data && stuRes.value.data.length > 0) {
          setStudents(stuRes.value.data);
          health.students = 'ok';
          successCount++;
        } else {
          health.students = 'empty';
          successCount++;
        }
      } else {
        health.students = 'error';
        errorCount++;
      }

      // Faculty
      if (facRes.status === 'fulfilled') {
        if (facRes.value.error) {
          health.faculty = 'error';
          errorCount++;
        } else if (facRes.value.data && facRes.value.data.length > 0) {
          const remoteFaculty = facRes.value.data;
          const creds = getFacultyCredentialOverrides();
          setFaculty(prevLocal => {
            const merged = remoteFaculty.map(rf => {
              const localMatch = prevLocal.find(
                l =>
                  l.id === rf.id ||
                  (l.email && rf.email && l.email.toLowerCase() === rf.email.toLowerCase()) ||
                  (l.employeeCode && rf.employeeCode && l.employeeCode.toUpperCase() === rf.employeeCode.toUpperCase())
              );
              const override =
                creds[rf.id] ||
                creds[localMatch?.id || ''] ||
                (localMatch?.employeeCode ? creds[localMatch.employeeCode] : undefined) ||
                (localMatch?.email ? creds[localMatch.email] : undefined) ||
                (rf.email ? creds[rf.email] : undefined);

              const finalUsername = override?.username || localMatch?.username || rf.username || '';
              const finalPassword = override?.password || localMatch?.password || rf.password || '';

              return {
                ...rf,
                ...(localMatch || {}),
                username: finalUsername,
                password: finalPassword
              };
            });

            // Preserve any locally added faculty members that are not yet in remote
            const remoteIds = new Set(remoteFaculty.map(rf => rf.id));
            const localOnly = prevLocal.filter(l => !remoteIds.has(l.id));
            return [...merged, ...localOnly];
          });
          health.faculty = 'ok';
          successCount++;
        } else {
          health.faculty = 'empty';
          successCount++;
        }
      } else {
        health.faculty = 'error';
        errorCount++;
      }

      // Faculty Assignments
      if (facAssignRes.status === 'fulfilled') {
        if (facAssignRes.value.error) {
          health.facultyAssignments = 'error';
          errorCount++;
        } else if (facAssignRes.value.data && facAssignRes.value.data.length > 0) {
          setFacultyAssignments(facAssignRes.value.data);
          health.facultyAssignments = 'ok';
          successCount++;
        } else {
          health.facultyAssignments = 'empty';
          successCount++;
        }
      } else {
        health.facultyAssignments = 'error';
        errorCount++;
      }

      // Timetable Periods
      if (periodRes.status === 'fulfilled') {
        if (periodRes.value.error) {
          health.timetablePeriods = 'error';
          errorCount++;
        } else if (periodRes.value.data && periodRes.value.data.length > 0) {
          setTimetablePeriods(periodRes.value.data);
          health.timetablePeriods = 'ok';
          successCount++;
        } else {
          health.timetablePeriods = 'empty';
          successCount++;
        }
      } else {
        health.timetablePeriods = 'error';
        errorCount++;
      }

      // Timetable Entries
      if (ttRes.status === 'fulfilled') {
        if (ttRes.value.error) {
          health.timetableEntries = 'error';
          errorCount++;
        } else if (ttRes.value.data && ttRes.value.data.length > 0) {
          setTimetableEntries(ttRes.value.data);
          health.timetableEntries = 'ok';
          successCount++;
        } else {
          health.timetableEntries = 'empty';
          successCount++;
        }
      } else {
        health.timetableEntries = 'error';
        errorCount++;
      }

      // Class Sessions
      if (sessRes.status === 'fulfilled') {
        if (sessRes.value.error) {
          health.classSessions = 'error';
          errorCount++;
        } else if (sessRes.value.data && sessRes.value.data.length > 0) {
          setClassSessions(sessRes.value.data);
          health.classSessions = 'ok';
          successCount++;
        } else {
          health.classSessions = 'empty';
          successCount++;
        }
      } else {
        health.classSessions = 'error';
        errorCount++;
      }

      // Attendance Records
      if (attRes.status === 'fulfilled') {
        if (attRes.value.error) {
          health.attendanceRecords = 'error';
          errorCount++;
        } else if (attRes.value.data && attRes.value.data.length > 0) {
          setAttendanceRecords(attRes.value.data);
          health.attendanceRecords = 'ok';
          successCount++;
        } else {
          health.attendanceRecords = 'empty';
          successCount++;
        }
      } else {
        health.attendanceRecords = 'error';
        errorCount++;
      }

      // Correction Requests
      if (corrRes.status === 'fulfilled') {
        if (corrRes.value.error) {
          health.correctionRequests = 'error';
          errorCount++;
        } else if (corrRes.value.data && corrRes.value.data.length > 0) {
          setCorrectionRequests(corrRes.value.data);
          health.correctionRequests = 'ok';
          successCount++;
        } else {
          health.correctionRequests = 'empty';
          successCount++;
        }
      } else {
        health.correctionRequests = 'error';
        errorCount++;
      }

      // Student Course Registrations
      if (regRes.status === 'fulfilled') {
        if (regRes.value.error) {
          health.studentRegistrations = 'error';
          errorCount++;
        } else if (regRes.value.data && regRes.value.data.length > 0) {
          setStudentCourseRegistrations(regRes.value.data);
          health.studentRegistrations = 'ok';
          successCount++;
        } else {
          health.studentRegistrations = 'empty';
          successCount++;
        }
      } else {
        health.studentRegistrations = 'error';
        errorCount++;
      }

      // Semester Enrollments
      if (enrRes.status === 'fulfilled') {
        if (enrRes.value.error) {
          health.semesterEnrollments = 'error';
          errorCount++;
        } else if (enrRes.value.data && enrRes.value.data.length > 0) {
          setSemesterEnrollments(enrRes.value.data);
          health.semesterEnrollments = 'ok';
          successCount++;
        } else {
          health.semesterEnrollments = 'empty';
          successCount++;
        }
      } else {
        health.semesterEnrollments = 'error';
        errorCount++;
      }

      // Announcements
      if (annRes.status === 'fulfilled') {
        if (annRes.value.error) {
          health.announcements = 'error';
          errorCount++;
        } else if (annRes.value.data && annRes.value.data.length > 0) {
          setAnnouncements(annRes.value.data);
          health.announcements = 'ok';
          successCount++;
        } else {
          health.announcements = 'empty';
          successCount++;
        }
      } else {
        health.announcements = 'error';
        errorCount++;
      }

      // Audit Logs
      if (logRes.status === 'fulfilled') {
        if (logRes.value.error) {
          health.auditLogs = 'error';
          errorCount++;
        } else if (logRes.value.data && logRes.value.data.length > 0) {
          setAuditLogs(logRes.value.data);
          health.auditLogs = 'ok';
          successCount++;
        } else {
          health.auditLogs = 'empty';
          successCount++;
        }
      } else {
        health.auditLogs = 'error';
        errorCount++;
      }

      // Settings
      if (settRes.status === 'fulfilled') {
        if (settRes.value.error) {
          health.settings = 'error';
          errorCount++;
        } else if (settRes.value.data) {
          setSettings(settRes.value.data);
          health.settings = 'ok';
          successCount++;
        }
      } else {
        health.settings = 'error';
        errorCount++;
      }

      // Special Attendance Events & Records
      if (specialEventsRes.status === 'fulfilled') {
        if (specialEventsRes.value.error) {
          health.specialAttendance = 'error';
          errorCount++;
        } else if (specialEventsRes.value.data && specialEventsRes.value.data.length > 0) {
          setSpecialAttendanceEvents(specialEventsRes.value.data);
          health.specialAttendance = 'ok';
          successCount++;
        } else {
          health.specialAttendance = 'empty';
          successCount++;
        }
      } else {
        health.specialAttendance = 'error';
        errorCount++;
      }

      if (specialRecordsRes.status === 'fulfilled' && !specialRecordsRes.value.error && specialRecordsRes.value.data) {
        if (specialRecordsRes.value.data.length > 0) {
          setSpecialAttendanceRecords(specialRecordsRes.value.data);
        }
      }

      if (overridesRes.status === 'fulfilled' && !overridesRes.value.error && overridesRes.value.data) {
        if (overridesRes.value.data.length > 0) {
          setDailyScheduleOverrides(overridesRes.value.data);
        }
      }

      if (tutorRes.status === 'fulfilled' && !tutorRes.value.error && tutorRes.value.data) {
        if (tutorRes.value.data.length > 0) {
          setClassTutorAssignments(tutorRes.value.data);
        }
      }

      setDomainHealth(health);
      setLastSyncTimestamp(new Date().toISOString());

      // Overall database status calculation
      if (errorCount === 0 && successCount > 0) {
        setSyncStatus('CONNECTED');
        setIsDbConnected(true);
      } else if (successCount > 0 && errorCount > 0) {
        setSyncStatus('PARTIAL');
        setIsDbConnected(true);
      } else {
        setSyncStatus('OFFLINE');
        setIsDbConnected(false);
      }
    } catch (err) {
      console.warn('Supabase sync error:', err);
      setSyncStatus('OFFLINE');
      setIsDbConnected(false);
    }
  };

  useEffect(() => {
    syncWithDatabase();
  }, []);

  // Logging helper
  const addAuditLog = (action: string, entityType: string, entityId: string, newData?: any, oldData?: any) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actorName: user?.name || 'System User',
      actorRole: user?.activeRole || 'SUPER_ADMIN',
      action,
      entityType,
      entityId,
      oldData,
      newData,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    auditLogService.createAuditLog({
      actorName: newLog.actorName,
      actorRole: newLog.actorRole,
      action: newLog.action,
      entityType: newLog.entityType,
      entityId: newLog.entityId,
      oldData: newLog.oldData,
      newData: newLog.newData
    });
  };

  // Settings
  const updateSettings = async (newSettings: Partial<SystemSettings>): Promise<{ success: boolean; error?: string }> => {
    const old = { ...settings };
    const res = await settingsService.updateSettings(newSettings);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to persist settings update to database.' };
    }
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    addAuditLog('UPDATE_SETTINGS', 'SYSTEM_SETTINGS', updated.id, updated, old);
    return { success: true };
  };

  // Departments
  const addDepartment = async (dept: Omit<Department, 'id'>): Promise<{ success: boolean; data?: Department; error?: string }> => {
    const res = await departmentService.createDepartment(dept);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to create department in database.' };
    }
    const created = res.data;
    setDepartments(prev => [...prev, created]);
    addAuditLog('CREATE_DEPARTMENT', 'DEPARTMENT', created.id, created);
    return { success: true, data: created };
  };

  const updateDepartment = async (id: string, dept: Partial<Department>): Promise<{ success: boolean; error?: string }> => {
    const prevDept = departments.find(d => d.id === id);
    const res = await departmentService.updateDepartment(id, dept);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to update department in database.' };
    }
    setDepartments(prev => prev.map(d => (d.id === id ? { ...d, ...dept } : d)));
    addAuditLog('UPDATE_DEPARTMENT', 'DEPARTMENT', id, { ...prevDept, ...dept }, prevDept);
    return { success: true };
  };

  const toggleDepartmentStatus = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const target = departments.find(d => d.id === id);
    if (!target) return { success: false, error: 'Department not found.' };
    const newStatus = !target.isActive;
    const res = await departmentService.updateDepartment(id, { isActive: newStatus });
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to toggle department status in database.' };
    }
    setDepartments(prev => prev.map(d => (d.id === id ? { ...d, isActive: newStatus } : d)));
    addAuditLog('TOGGLE_DEPARTMENT_STATUS', 'DEPARTMENT', id, { isActive: newStatus }, { isActive: target.isActive });
    return { success: true };
  };

  // Programmes
  const addProgramme = async (prog: Omit<Programme, 'id'>): Promise<{ success: boolean; data?: Programme; error?: string }> => {
    const res = await programmeService.createProgramme(prog);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to create programme in database.' };
    }
    const created = res.data;
    setProgrammes(prev => [...prev, created]);
    addAuditLog('CREATE_PROGRAMME', 'PROGRAMME', created.id, created);
    return { success: true, data: created };
  };

  const updateProgramme = async (id: string, prog: Partial<Programme>): Promise<{ success: boolean; error?: string }> => {
    const prevProg = programmes.find(p => p.id === id);
    const res = await programmeService.updateProgramme(id, prog);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to update programme in database.' };
    }
    setProgrammes(prev => prev.map(p => (p.id === id ? { ...p, ...prog } : p)));
    addAuditLog('UPDATE_PROGRAMME', 'PROGRAMME', id, { ...prevProg, ...prog }, prevProg);
    return { success: true };
  };

  const toggleProgrammeStatus = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const target = programmes.find(p => p.id === id);
    if (!target) return { success: false, error: 'Programme not found.' };
    const newStatus = !target.isActive;
    const res = await programmeService.updateProgramme(id, { isActive: newStatus });
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to toggle programme status in database.' };
    }
    setProgrammes(prev => prev.map(p => (p.id === id ? { ...p, isActive: newStatus } : p)));
    addAuditLog('TOGGLE_PROGRAMME_STATUS', 'PROGRAMME', id, { isActive: newStatus }, { isActive: target.isActive });
    return { success: true };
  };

  // Course Categories
  const addCourseCategory = async (cat: Omit<CourseCategory, 'id'>): Promise<{ success: boolean; data?: CourseCategory; error?: string }> => {
    const res = await courseService.createCategory(cat);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to create course category in database.' };
    }
    const created = res.data;
    setCourseCategories(prev => [...prev, created]);
    addAuditLog('CREATE_COURSE_CATEGORY', 'COURSE_CATEGORY', created.id, created);
    return { success: true, data: created };
  };

  const updateCourseCategory = async (id: string, cat: Partial<CourseCategory>): Promise<{ success: boolean; error?: string }> => {
    const prevCat = courseCategories.find(c => c.id === id);
    const res = await courseService.updateCategory(id, cat);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to update course category in database.' };
    }
    setCourseCategories(prev => prev.map(c => (c.id === id ? { ...c, ...cat } : c)));
    addAuditLog('UPDATE_COURSE_CATEGORY', 'COURSE_CATEGORY', id, { ...prevCat, ...cat }, prevCat);
    return { success: true };
  };

  // Courses Master
  const addCourse = async (course: Omit<Course, 'id'>): Promise<{ success: boolean; data?: Course; error?: string }> => {
    const res = await courseService.createCourse(course);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to create course in database.' };
    }
    const created = res.data;
    setCourses(prev => [...prev, created]);
    addAuditLog('CREATE_COURSE', 'COURSE', created.id, created);
    return { success: true, data: created };
  };

  const updateCourse = async (id: string, course: Partial<Course>): Promise<{ success: boolean; error?: string }> => {
    const prevCourse = courses.find(c => c.id === id);
    const res = await courseService.updateCourse(id, course);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to update course in database.' };
    }
    setCourses(prev => prev.map(c => (c.id === id ? { ...c, ...course } : c)));
    addAuditLog('UPDATE_COURSE', 'COURSE', id, { ...prevCourse, ...course }, prevCourse);
    return { success: true };
  };

  // Admission Batches
  const updateAdmissionBatch = async (id: string, batch: Partial<AdmissionBatch>): Promise<{ success: boolean; error?: string }> => {
    const prevBatch = admissionBatches.find(b => b.id === id);
    const res = await academicService.updateAdmissionBatch(id, batch);
    if (res.error) {
      return { success: false, error: res.error.message || 'Failed to update admission batch in database.' };
    }
    setAdmissionBatches(prev => prev.map(b => (b.id === id ? { ...b, ...batch } : b)));
    addAuditLog('UPDATE_ADMISSION_BATCH', 'ADMISSION_BATCH', id, { ...prevBatch, ...batch }, prevBatch);
    return { success: true };
  };

  // Course Offerings
  const addCourseOffering = async (off: Omit<CourseOffering, 'id'>): Promise<{ success: boolean; data?: CourseOffering; error?: string }> => {
    const res = await courseService.createOffering(off);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to create course offering in database.' };
    }
    const created = res.data;
    setCourseOfferings(prev => [...prev, created]);
    addAuditLog('CREATE_COURSE_OFFERING', 'COURSE_OFFERING', created.id, created);
    return { success: true, data: created };
  };

  const updateCourseOffering = async (id: string, off: Partial<CourseOffering>): Promise<{ success: boolean; error?: string }> => {
    const prevOff = courseOfferings.find(o => o.id === id);
    const res = await courseService.updateOffering(id, off);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to update course offering in database.' };
    }
    setCourseOfferings(prev => prev.map(o => (o.id === id ? { ...o, ...off } : o)));
    addAuditLog('UPDATE_COURSE_OFFERING', 'COURSE_OFFERING', id, { ...prevOff, ...off }, prevOff);
    return { success: true };
  };

  // Course Groups
  const addCourseGroup = async (group: Omit<CourseGroup, 'id'>): Promise<{ success: boolean; data?: CourseGroup; error?: string }> => {
    const res = await courseService.createGroup(group);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to create course group in database.' };
    }
    const created = res.data;
    setCourseGroups(prev => [...prev, created]);
    addAuditLog('CREATE_COURSE_GROUP', 'COURSE_GROUP', created.id, created);
    return { success: true, data: created };
  };

  const updateCourseGroup = async (id: string, group: Partial<CourseGroup>): Promise<{ success: boolean; error?: string }> => {
    const prevGroup = courseGroups.find(g => g.id === id);
    const res = await courseService.updateGroup(id, group);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to update course group in database.' };
    }
    setCourseGroups(prev => prev.map(g => (g.id === id ? { ...g, ...group } : g)));
    addAuditLog('UPDATE_COURSE_GROUP', 'COURSE_GROUP', id, { ...prevGroup, ...group }, prevGroup);
    return { success: true };
  };

  // Students
  const addStudent = async (student: Omit<Student, 'id' | 'createdAt'>): Promise<{ success: boolean; data?: Student; error?: string }> => {
    // If username is not set, set to university register number
    const finalUsername = student.username?.trim() || student.universityRegisterNumber?.trim().toUpperCase() || `stu${Date.now().toString().slice(-4)}`;
    
    // Default password formula
    let finalPassword = student.password;
    if (!finalPassword || finalPassword === 'Nss2026!') {
      const computedPass = generateDefaultStudentPassword(student.dateOfBirth, student.mobileNumber || student.phone || student.phoneNumber);
      finalPassword = computedPass || finalPassword || 'Nss2026!';
    }

    const payloadStudent: Omit<Student, 'id'> = {
      ...student,
      username: finalUsername,
      password: finalPassword,
      status: student.status || 'ACTIVE',
      isActive: student.isActive !== undefined ? student.isActive : true
    };

    const res = await studentService.createStudent(payloadStudent);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to insert student into Supabase.' };
    }

    const createdStudent = res.data;
    setStudents(prev => [createdStudent, ...prev]);

    // Automatically create semester 1 enrollment
    const newEnrollment: SemesterEnrollment = {
      id: `se-${createdStudent.id}`,
      studentId: createdStudent.id,
      academicYear: settings.activeAcademicYear,
      semesterNumber: createdStudent.currentSemester,
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'ENROLLED'
    };
    setSemesterEnrollments(prev => [...prev, newEnrollment]);
    academicService.createSemesterEnrollment(newEnrollment);

    addAuditLog('CREATE_STUDENT', 'STUDENT', createdStudent.id, createdStudent);
    return { success: true, data: createdStudent };
  };

  const updateStudent = async (id: string, student: Partial<Student>): Promise<{ success: boolean; error?: string }> => {
    const prevStudent = students.find(s => s.id === id);
    if (!prevStudent) return { success: false, error: 'Student not found.' };

    const updated = { ...prevStudent, ...student };
    if (student.universityRegisterNumber && (!updated.username || updated.username === prevStudent.universityRegisterNumber)) {
      updated.username = student.universityRegisterNumber.trim().toUpperCase();
    }
    if ((student.dateOfBirth || student.mobileNumber) && (!updated.password || updated.password === 'Nss2026!' || updated.password.length === 10)) {
      const computedPass = generateDefaultStudentPassword(updated.dateOfBirth, updated.mobileNumber || updated.phone || updated.phoneNumber);
      if (computedPass) {
        updated.password = computedPass;
      }
    }

    const res = await studentService.updateStudent(id, updated);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to update student in database.' };
    }

    setStudents(prev => prev.map(s => (s.id === id ? updated : s)));
    addAuditLog('UPDATE_STUDENT', 'STUDENT', id, updated, prevStudent);
    return { success: true };
  };

  const deleteStudent = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await studentService.deleteStudent(id);
      if (!res.success) {
        return { success: false, error: res.error?.message || 'Failed to delete student from database.' };
      }
      setStudents(prev => prev.filter(s => s.id !== id));
      setStudentCourseRegistrations(prev => prev.filter(r => r.studentId !== id));
      setAttendanceRecords(prev => prev.filter(a => a.studentId !== id));
      setSemesterEnrollments(prev => prev.filter(e => e.studentId !== id));
      setCorrectionRequests(prev => prev.filter(c => c.studentId !== id));
      addAuditLog('DELETE_STUDENT', 'STUDENT', id);
      return { success: true };
    } catch (err: any) {
      console.warn('Fallback delete student:', err?.message || err);
      // Ensure local state is updated even if remote threw an exception
      setStudents(prev => prev.filter(s => s.id !== id));
      setStudentCourseRegistrations(prev => prev.filter(r => r.studentId !== id));
      setAttendanceRecords(prev => prev.filter(a => a.studentId !== id));
      setSemesterEnrollments(prev => prev.filter(e => e.studentId !== id));
      setCorrectionRequests(prev => prev.filter(c => c.studentId !== id));
      return { success: true };
    }
  };

  // Course Registrations
  const registerStudentForCourse = async (reg: Omit<StudentCourseRegistration, 'id'>): Promise<{ success: boolean; data?: StudentCourseRegistration; error?: string }> => {
    // Uniqueness validation
    const exists = studentCourseRegistrations.some(
      r => r.studentId === reg.studentId && r.courseOfferingId === reg.courseOfferingId
    );
    if (exists) {
      return { success: false, error: 'Student is already registered in this course offering.' };
    }

    const res = await studentService.createRegistration(reg);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Database registration failed.' };
    }

    const confirmedReg = res.data;
    setStudentCourseRegistrations(prev => [...prev, confirmedReg]);
    addAuditLog('REGISTER_STUDENT_COURSE', 'STUDENT_COURSE_REGISTRATION', confirmedReg.id, confirmedReg);
    return { success: true, data: confirmedReg };
  };

  const bulkRegisterStudents = async (regs: Omit<StudentCourseRegistration, 'id'>[]): Promise<{ success: boolean; error?: string }> => {
    const res = await studentService.bulkCreateRegistrations(regs);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to bulk-register students in database.' };
    }

    // Refresh registrations from database to guarantee synchronization
    const refetch = await studentService.getRegistrations();
    if (refetch.data) {
      setStudentCourseRegistrations(refetch.data);
    }
    addAuditLog('BULK_REGISTER_STUDENTS', 'STUDENT_COURSE_REGISTRATION', 'batch', { count: regs.length });
    return { success: true };
  };

  const removeStudentCourseRegistration = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const res = await studentService.deleteRegistration(id);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to remove registration from database.' };
    }
    setStudentCourseRegistrations(prev => prev.filter(r => r.id !== id));
    addAuditLog('DELETE_STUDENT_COURSE_REGISTRATION', 'STUDENT_COURSE_REGISTRATION', id);
    return { success: true };
  };

  // Faculty
  const addFaculty = async (fac: Omit<Faculty, 'id'>): Promise<{ success: boolean; data?: Faculty; error?: string }> => {
    const res = await facultyService.createFaculty(fac);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to insert faculty member into database.' };
    }
    const created = res.data;
    if (fac.username || fac.password) {
      saveFacultyCredentialOverride(
        created.id,
        fac.username,
        fac.password,
        [created.employeeCode || '', created.employeeId || '', created.email || '']
      );
    }
    setFaculty(prev => [...prev, created]);
    addAuditLog('CREATE_FACULTY', 'FACULTY', created.id, created);
    return { success: true, data: created };
  };

  const updateFaculty = async (id: string, fac: Partial<Faculty>): Promise<{ success: boolean; error?: string }> => {
    const prevFac = faculty.find(f => f.id === id);

    // Persist credentials override so background sync can never overwrite updated username or password
    if (fac.username || fac.password) {
      saveFacultyCredentialOverride(
        id,
        fac.username,
        fac.password,
        [
          prevFac?.employeeCode || '',
          prevFac?.employeeId || '',
          prevFac?.email || '',
          fac.email || ''
        ]
      );
    }

    // Update in-memory state immediately
    setFaculty(prev => prev.map(f => (f.id === id ? { ...f, ...fac } : f)));

    // Synchronize active logged-in user profile in localStorage and dispatch event if active user is this faculty
    try {
      if (typeof window !== 'undefined') {
        const savedAuthUser = localStorage.getItem('nss_auth_user');
        if (savedAuthUser) {
          const parsed = JSON.parse(savedAuthUser);
          const isCurrentStaff =
            parsed.id === id ||
            parsed.facultyProfile?.id === id ||
            (parsed.email && prevFac?.email && parsed.email.toLowerCase() === prevFac.email.toLowerCase());

          if (isCurrentStaff) {
            const mergedFac: Faculty = {
              ...(parsed.facultyProfile || prevFac || {}),
              ...fac,
              id: parsed.facultyProfile?.id || id
            } as Faculty;

            const updatedAuth = {
              ...parsed,
              name: fac.fullName || parsed.name,
              email: fac.email || parsed.email,
              facultyProfile: mergedFac
            };
            localStorage.setItem('nss_auth_user', JSON.stringify(updatedAuth));
            window.dispatchEvent(new CustomEvent('nss-auth-update', { detail: updatedAuth }));
          }
        }
      }
    } catch (e) {
      console.warn('Could not sync auth user after faculty update:', e);
    }

    // Call service to update Supabase database in background
    const res = await facultyService.updateFaculty(id, fac);
    if (!res.success && res.error) {
      console.warn('Database remote update warning for faculty (local state preserved):', res.error);
    }

    addAuditLog('UPDATE_FACULTY', 'FACULTY', id, { ...prevFac, ...fac }, prevFac);
    return { success: true };
  };

  const deleteFaculty = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await facultyService.deleteFaculty(id);
      if (!res.success) {
        return { success: false, error: res.error?.message || 'Failed to delete faculty member from database.' };
      }
      setFaculty(prev => prev.filter(f => f.id !== id));
      setFacultyAssignments(prev => prev.filter(fa => fa.facultyId !== id));
      // If deleted faculty was an HOD of any department, unbind HOD in local state
      setDepartments(prev =>
        prev.map(d => (d.hodFacultyId === id ? { ...d, hodFacultyId: undefined } : d))
      );
      // Remove any timetable entries assigned to this faculty member
      setTimetableEntries(prev => prev.filter(t => t.facultyId !== id));
      // Remove substitute assignments
      setSubstituteAssignments(prev =>
        prev.filter(sa => sa.facultyId !== id && sa.substituteFacultyId !== id)
      );
      addAuditLog('DELETE_FACULTY', 'FACULTY', id);
      return { success: true };
    } catch (err: any) {
      console.warn('Fallback delete faculty:', err?.message || err);
      setFaculty(prev => prev.filter(f => f.id !== id));
      setFacultyAssignments(prev => prev.filter(fa => fa.facultyId !== id));
      setDepartments(prev =>
        prev.map(d => (d.hodFacultyId === id ? { ...d, hodFacultyId: undefined } : d))
      );
      setTimetableEntries(prev => prev.filter(t => t.facultyId !== id));
      setSubstituteAssignments(prev =>
        prev.filter(sa => sa.facultyId !== id && sa.substituteFacultyId !== id)
      );
      return { success: true };
    }
  };

  // Faculty Course Assignment
  const assignFacultyToCourse = async (assign: Omit<FacultyCourseAssignment, 'id'>): Promise<{ success: boolean; data?: FacultyCourseAssignment; error?: string }> => {
    const res = await facultyService.createAssignment(assign);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to assign faculty to course in database.' };
    }
    const created = res.data;
    setFacultyAssignments(prev => [...prev, created]);
    addAuditLog('ASSIGN_FACULTY_COURSE', 'FACULTY_ASSIGNMENT', created.id, created);
    return { success: true, data: created };
  };

  const deleteFacultyAssignment = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const res = await facultyService.deleteAssignment(id);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to remove faculty course assignment.' };
    }
    setFacultyAssignments(prev => prev.filter(fa => fa.id !== id));
    addAuditLog('DELETE_FACULTY_ASSIGNMENT', 'FACULTY_ASSIGNMENT', id);
    return { success: true };
  };

  // =========================================================================
  // FACULTY SUBJECT REGISTRATION, HOD APPROVAL & REASSIGNMENT WORKFLOW
  // =========================================================================

  const submitFacultySubjectRequest = async (
    req: Omit<FacultySubjectRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<{ success: boolean; data?: FacultySubjectRequest; error?: string }> => {
    // 1. Validation
    if (!req.courseName?.trim()) {
      return { success: false, error: 'Course name is required.' };
    }
    if (!req.departmentId) {
      return { success: false, error: 'Department is required.' };
    }

    // 2. Check for duplicate pending requests for this teacher & course
    const isDuplicate = facultySubjectRequests.some(r => {
      const isSameTeacher =
        r.requestedBy === req.requestedBy ||
        (req.requestedByFacultyId && r.requestedByFacultyId === req.requestedByFacultyId);
      const isSameName = r.courseName.trim().toLowerCase() === req.courseName.trim().toLowerCase();
      const isSameCode =
        req.proposedCourseCode &&
        r.proposedCourseCode &&
        r.proposedCourseCode.trim().toLowerCase() === req.proposedCourseCode.trim().toLowerCase();
      return isSameTeacher && r.status === 'PENDING' && (isSameName || isSameCode);
    });

    if (isDuplicate) {
      return { success: false, error: 'A pending request for this subject is already submitted and awaiting HOD approval.' };
    }

    // Auto-generate provisional code if missing and requested as provisional
    let code = req.proposedCourseCode?.trim() || null;
    let isProvisional = req.isProvisional || false;
    if (!code && !req.existingCourseId) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      code = `TEMP-2026-${randNum}`;
      isProvisional = true;
    }

    const payloadToService: Omit<FacultySubjectRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
      ...req,
      proposedCourseCode: code || undefined,
      isProvisional
    };

    // 3. Call database service
    const res = await facultySubjectService.submitSubjectRequest(payloadToService);
    const newId = res.data?.id || `fsr-${Date.now()}`;
    const now = new Date().toISOString();

    const createdReq: FacultySubjectRequest = {
      ...payloadToService,
      id: newId,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now
    };

    // 4. Update reactive state
    setFacultySubjectRequests(prev => [createdReq, ...prev]);

    // 5. Add notification for HOD
    const dept = departments.find(d => d.id === req.departmentId);
    const reqFaculty = faculty.find(f => f.id === req.requestedBy || f.id === req.requestedByFacultyId);
    const teacherName = reqFaculty?.fullName || 'Teacher';

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: dept?.hodFacultyId || 'hod',
      title: 'New Subject Registration Request',
      message: `${teacherName} submitted a subject registration request for "${req.courseName}" (${req.courseType}).`,
      type: 'ACADEMIC',
      isRead: false,
      createdAt: now,
      actionUrl: '/dashboard'
    };
    setNotifications(prev => [notif, ...prev]);

    addAuditLog('SUBMIT_FACULTY_SUBJECT_REQUEST', 'FACULTY_SUBJECT_REQUEST', newId, createdReq);

    return { success: true, data: createdReq };
  };

  const reviewFacultySubjectRequest = async (
    requestId: string,
    status: SubjectRequestStatus,
    reviewNotes: string,
    reviewerId: string,
    approvalOptions?: {
      courseId?: string;
      courseOfferingId?: string;
      courseGroupId?: string;
      targetFacultyId?: string;
      departmentId?: string;
      isProvisional?: boolean;
      proposedCourseCode?: string;
      courseName?: string;
      groupName?: string;
      courseType?: CourseType;
      programmeId?: string;
      semesterNumber?: number;
      academicYear?: string;
    }
  ): Promise<{ success: boolean; error?: string; assignmentId?: string }> => {
    const existingReq = facultySubjectRequests.find(r => r.id === requestId);
    if (!existingReq) {
      return { success: false, error: 'Subject request not found.' };
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    let createdAssignmentId: string | undefined = undefined;

    // Call database service
    const res = await facultySubjectService.reviewSubjectRequest(
      requestId,
      status as any,
      reviewNotes,
      reviewerId,
      approvalOptions
    );

    // If APPROVED, ensure Course, Offering, CourseGroup, and FacultyCourseAssignment exist
    if (status === 'APPROVED') {
      const targetFacultyId = approvalOptions?.targetFacultyId || existingReq.requestedByFacultyId || existingReq.requestedBy;
      const deptId = approvalOptions?.departmentId || existingReq.departmentId;
      const courseName = approvalOptions?.courseName || existingReq.courseName;
      const courseCode = approvalOptions?.proposedCourseCode || existingReq.proposedCourseCode || `TEMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Course ID
      let resolvedCourseId = approvalOptions?.courseId || existingReq.existingCourseId;
      if (!resolvedCourseId) {
        // Find existing course by code or title
        const existingC = courses.find(
          c => c.courseCode.toLowerCase() === courseCode.toLowerCase() ||
               c.courseTitle.toLowerCase() === courseName.toLowerCase()
        );
        if (existingC) {
          resolvedCourseId = existingC.id;
        } else {
          // Create new course
          const newCourseId = `c-${Date.now()}`;
          const defaultCategory = courseCategories[0]?.id || 'cat-major';
          const newCourse: Course = {
            id: newCourseId,
            courseCode: courseCode.toUpperCase(),
            courseTitle: courseName,
            departmentId: deptId,
            categoryId: defaultCategory,
            credits: 3,
            practicalHours: 0,
            lectureHours: 3,
            isActive: true,
            defaultSemester: existingReq.semesterNumber || 1
          };
          setCourses(prev => [...prev, newCourse]);
          resolvedCourseId = newCourseId;
        }
      }

      // 2. Course Offering ID
      let resolvedOfferingId = approvalOptions?.courseOfferingId;
      if (!resolvedOfferingId) {
        const existingOff = courseOfferings.find(
          o => o.courseId === resolvedCourseId &&
               o.academicYear === (existingReq.academicYear || settings.activeAcademicYear)
        );
        if (existingOff) {
          resolvedOfferingId = existingOff.id;
        } else {
          const newOffId = `off-${Date.now()}`;
          const newOff: CourseOffering = {
            id: newOffId,
            courseId: resolvedCourseId,
            academicYear: existingReq.academicYear || settings.activeAcademicYear,
            semesterNumber: existingReq.semesterNumber || 1,
            departmentId: deptId,
            coordinatorFacultyId: targetFacultyId,
            expectedStrength: 40,
            maxStrength: 50,
            isActive: true
          };
          setCourseOfferings(prev => [...prev, newOff]);
          resolvedOfferingId = newOffId;
        }
      }

      // 3. Course Group ID
      let resolvedGroupId = approvalOptions?.courseGroupId || existingReq.existingCourseGroupId;
      if (!resolvedGroupId) {
        const existingGrp = courseGroups.find(g => g.courseOfferingId === resolvedOfferingId);
        if (existingGrp) {
          resolvedGroupId = existingGrp.id;
        } else {
          const newGrpId = `grp-${Date.now()}`;
          const groupName = approvalOptions?.groupName || existingReq.proposedGroupName || `${courseName} - Batch A`;
          const newGrp: CourseGroup = {
            id: newGrpId,
            courseOfferingId: resolvedOfferingId,
            groupName,
            capacity: 50,
            room: 'LH-101',
            isActive: true
          };
          setCourseGroups(prev => [...prev, newGrp]);
          resolvedGroupId = newGrpId;
        }
      }

      // 4. Create active assignment in facultyAssignments
      const assignId = res.assignmentId || `fca-${Date.now()}`;
      createdAssignmentId = assignId;

      const newAssignment: FacultyCourseAssignment = {
        id: assignId,
        facultyId: targetFacultyId,
        courseOfferingId: resolvedOfferingId,
        courseGroupId: resolvedGroupId,
        assignmentRole: 'PRIMARY',
        startDate: today,
        isActive: true
      };

      // Add to facultyAssignments state (avoid duplicates)
      setFacultyAssignments(prev => {
        const filtered = prev.filter(fa => !(fa.facultyId === targetFacultyId && fa.courseGroupId === resolvedGroupId));
        return [...filtered, newAssignment];
      });

      // 5. Create entry in facultyAssignmentHistory
      const newHistory: FacultyAssignmentHistory = {
        id: `fah-${Date.now()}`,
        courseGroupId: resolvedGroupId,
        facultyId: targetFacultyId,
        departmentId: deptId,
        assignmentRole: 'PRIMARY',
        effectiveFrom: today,
        sourceRequestId: requestId,
        assignedBy: reviewerId,
        reason: reviewNotes ? `HOD Approval: ${reviewNotes}` : 'Approved Faculty Subject Request',
        createdAt: now
      };
      setFacultyAssignmentHistory(prev => [newHistory, ...prev]);
    }

    // Update request state
    setFacultySubjectRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status,
              reviewedBy: reviewerId,
              reviewedByFacultyId: reviewerId,
              reviewedAt: now,
              reviewNotes: reviewNotes.trim() || undefined,
              updatedAt: now
            }
          : r
      )
    );

    // Notify teacher
    const statusText = status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'RETURNED FOR CHANGES';
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: existingReq.requestedByFacultyId || existingReq.requestedBy,
      title: `Subject Request ${statusText}`,
      message: `Your request for "${existingReq.courseName}" has been ${statusText.toLowerCase()}.${reviewNotes ? ` Note: ${reviewNotes}` : ''}`,
      type: 'ACADEMIC',
      isRead: false,
      createdAt: now,
      actionUrl: '/dashboard'
    };
    setNotifications(prev => [notif, ...prev]);

    addAuditLog('REVIEW_FACULTY_SUBJECT_REQUEST', 'FACULTY_SUBJECT_REQUEST', requestId, { status, reviewNotes, approvalOptions });

    return { success: true, assignmentId: createdAssignmentId };
  };

  const reassignFacultySubject = async (params: {
    assignmentId?: string;
    courseGroupId: string;
    courseOfferingId?: string;
    departmentId: string;
    currentFacultyId: string;
    newFacultyId: string;
    effectiveDate: string;
    reason: string;
    assignedBy: string;
    updateTimetable?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    const {
      assignmentId,
      courseGroupId,
      courseOfferingId,
      departmentId,
      currentFacultyId,
      newFacultyId,
      effectiveDate,
      reason,
      assignedBy,
      updateTimetable = true
    } = params;

    // Call service
    const res = await facultySubjectService.reassignFaculty({
      assignmentId,
      courseGroupId,
      courseOfferingId,
      departmentId,
      currentFacultyId,
      newFacultyId,
      effectiveDate,
      reason,
      assignedBy,
      updateTimetable
    });

    const now = new Date().toISOString();
    const effDateObj = new Date(effectiveDate);
    const prevDateObj = new Date(effDateObj.getTime() - 24 * 60 * 60 * 1000);
    const prevDateStr = prevDateObj.toISOString().split('T')[0];

    // 1. Update facultyAssignments state:
    // Mark previous faculty assignment inactive with end date
    setFacultyAssignments(prev => {
      const updated = prev.map(fa => {
        if (fa.courseGroupId === courseGroupId && fa.facultyId === currentFacultyId) {
          return { ...fa, isActive: false, endDate: prevDateStr };
        }
        return fa;
      });

      // Add new assignment for new teacher starting on effectiveDate
      const newAssignId = res.newAssignmentId || `fca-${Date.now()}`;
      const newAssignment: FacultyCourseAssignment = {
        id: newAssignId,
        facultyId: newFacultyId,
        courseOfferingId,
        courseGroupId,
        assignmentRole: 'PRIMARY',
        startDate: effectiveDate,
        isActive: true
      };
      return [...updated, newAssignment];
    });

    // 2. Update facultyAssignmentHistory state:
    setFacultyAssignmentHistory(prev => {
      const updated = prev.map(h => {
        if (h.courseGroupId === courseGroupId && h.facultyId === currentFacultyId && !h.effectiveUntil) {
          return { ...h, effectiveUntil: prevDateStr, endedBy: assignedBy };
        }
        return h;
      });

      const newHistory: FacultyAssignmentHistory = {
        id: `fah-${Date.now()}`,
        courseGroupId,
        facultyId: newFacultyId,
        departmentId,
        assignmentRole: 'PRIMARY',
        effectiveFrom: effectiveDate,
        assignedBy,
        reason: reason || 'Teacher Reassigned by HOD',
        createdAt: now
      };
      return [newHistory, ...updated];
    });

    // 3. Update Timetable entries if requested
    if (updateTimetable) {
      setTimetableEntries(prev =>
        prev.map(entry => {
          if (entry.courseGroupId === courseGroupId) {
            return { ...entry, facultyId: newFacultyId };
          }
          return entry;
        })
      );
    }

    // 4. Notifications to both teachers
    const grp = courseGroups.find(g => g.id === courseGroupId);
    const grpName = grp?.groupName || 'Course Group';

    const notifOld: AppNotification = {
      id: `notif-${Date.now()}-1`,
      userId: currentFacultyId,
      title: 'Teaching Assignment Concluded',
      message: `Your assignment for ${grpName} has ended effective ${effectiveDate}. Reason: ${reason}. Historical attendance is fully preserved.`,
      type: 'ACADEMIC',
      isRead: false,
      createdAt: now
    };

    const notifNew: AppNotification = {
      id: `notif-${Date.now()}-2`,
      userId: newFacultyId,
      title: 'New Teaching Assignment Allocated',
      message: `You have been allocated to teach ${grpName} effective from ${effectiveDate}. Reason: ${reason}.`,
      type: 'ACADEMIC',
      isRead: false,
      createdAt: now
    };

    setNotifications(prev => [notifOld, notifNew, ...prev]);

    addAuditLog('REASSIGN_FACULTY_SUBJECT', 'FACULTY_ASSIGNMENT', courseGroupId, params);

    return { success: true };
  };

  const mapProvisionalCourse = async (
    provisionalCourseId: string,
    officialDetails: {
      courseCode: string;
      courseTitle: string;
      credits?: number;
      categoryId?: string;
    },
    mappedBy: string
  ): Promise<{ success: boolean; error?: string }> => {
    await facultySubjectService.mapProvisionalCourse(provisionalCourseId, officialDetails, mappedBy);

    // Update local course in state
    setCourses(prev =>
      prev.map(c => {
        if (c.id === provisionalCourseId) {
          return {
            ...c,
            courseCode: officialDetails.courseCode.toUpperCase(),
            courseTitle: officialDetails.courseTitle,
            credits: officialDetails.credits || c.credits,
            categoryId: officialDetails.categoryId || c.categoryId
          };
        }
        return c;
      })
    );

    // Update related requests
    setFacultySubjectRequests(prev =>
      prev.map(r => {
        if (r.existingCourseId === provisionalCourseId) {
          return {
            ...r,
            proposedCourseCode: officialDetails.courseCode.toUpperCase(),
            courseName: officialDetails.courseTitle,
            isProvisional: false
          };
        }
        return r;
      })
    );

    addAuditLog('MAP_PROVISIONAL_COURSE', 'COURSE', provisionalCourseId, officialDetails);
    return { success: true };
  };

  const inviteOrEnrollTeacher = async (teacherData: {
    fullName: string;
    employeeCode: string;
    departmentId: string;
    email: string;
    phone: string;
    designation: string;
    roles: UserRole[];
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<{ success: boolean; data?: Faculty; tempPassword?: string; error?: string }> => {
    // 1. Validation
    if (!teacherData.fullName?.trim() || !teacherData.email?.trim()) {
      return { success: false, error: 'Full name and email are required.' };
    }

    // Check duplicate email
    const exists = faculty.find(f => f.email.toLowerCase() === teacherData.email.trim().toLowerCase());
    if (exists) {
      return { success: false, error: `A faculty member with email ${teacherData.email} already exists.` };
    }

    // Generate unique username
    const nameSlug = teacherData.fullName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const generatedUsername = `nss_${nameSlug}_${randSuffix}`;
    const generatedTempPassword = 'Staff2026!';

    const newFacultyObj: Omit<Faculty, 'id'> = {
      fullName: teacherData.fullName.trim(),
      employeeCode: teacherData.employeeCode.trim().toUpperCase(),
      employeeId: teacherData.employeeCode.trim().toUpperCase(),
      username: generatedUsername,
      password: generatedTempPassword,
      email: teacherData.email.trim().toLowerCase(),
      phone: teacherData.phone.trim(),
      phoneNumber: teacherData.phone.trim(),
      departmentId: teacherData.departmentId,
      designation: teacherData.designation.trim() || 'Assistant Professor',
      roles: teacherData.roles && teacherData.roles.length > 0 ? teacherData.roles : ['TEACHER'],
      status: teacherData.status || 'ACTIVE',
      isActive: teacherData.status !== 'INACTIVE',
      mustChangePassword: true,
      isInvited: true,
      invitationSentAt: new Date().toISOString()
    };

    const res = await facultyService.createFaculty(newFacultyObj);
    const created: Faculty = res.data || { ...newFacultyObj, id: `fac-${Date.now()}` };

    setFaculty(prev => [...prev, created]);
    addAuditLog('INVITE_TEACHER', 'FACULTY', created.id, { ...created, password: '[PROTECTED]' });

    return { success: true, data: created, tempPassword: generatedTempPassword };
  };

  // Timetable Periods
  const updateTimetablePeriods = async (periods: TimetablePeriod[]): Promise<{ success: boolean; error?: string }> => {
    const res = await timetableService.updatePeriods(periods);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to save timetable periods to database.' };
    }
    setTimetablePeriods(periods);
    addAuditLog('UPDATE_TIMETABLE_PERIODS', 'TIMETABLE_PERIODS', 'all', periods);
    return { success: true };
  };

  // Timetable Entries
  const addTimetableEntry = async (entry: Omit<TimetableEntry, 'id'>): Promise<{ success: boolean; data?: TimetableEntry; error?: string }> => {
    const res = await timetableService.createEntry(entry);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to create timetable entry in database.' };
    }
    const created = res.data;
    setTimetableEntries(prev => [...prev, created]);
    addAuditLog('CREATE_TIMETABLE_ENTRY', 'TIMETABLE_ENTRY', created.id, created);
    return { success: true, data: created };
  };

  const updateTimetableEntry = async (id: string, entry: Partial<TimetableEntry>): Promise<{ success: boolean; error?: string }> => {
    const prevEntry = timetableEntries.find(t => t.id === id);
    const res = await timetableService.updateEntry(id, entry);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to update timetable entry in database.' };
    }
    setTimetableEntries(prev => prev.map(t => (t.id === id ? { ...t, ...entry } : t)));
    addAuditLog('UPDATE_TIMETABLE_ENTRY', 'TIMETABLE_ENTRY', id, { ...prevEntry, ...entry }, prevEntry);
    return { success: true };
  };

  const deleteTimetableEntry = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const res = await timetableService.deleteEntry(id);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to delete timetable entry from database.' };
    }
    setTimetableEntries(prev => prev.filter(t => t.id !== id));
    addAuditLog('DELETE_TIMETABLE_ENTRY', 'TIMETABLE_ENTRY', id);
    return { success: true };
  };

  // Class Sessions
  const addClassSession = async (session: Omit<ClassSession, 'id'>): Promise<{ success: boolean; data?: ClassSession; error?: string; id?: string }> => {
    const res = await attendanceService.createSession(session);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to create class session in database.' };
    }
    const created = res.data;
    setClassSessions(prev => [created, ...prev]);
    addAuditLog('CREATE_CLASS_SESSION', 'CLASS_SESSION', created.id, created);
    return { success: true, data: created, id: created.id };
  };

  const updateClassSession = async (id: string, session: Partial<ClassSession>): Promise<{ success: boolean; error?: string }> => {
    const prevSession = classSessions.find(s => s.id === id);
    // Persist to database
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.from('class_sessions').update(session).eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Database update error.' };
    }
    setClassSessions(prev => prev.map(s => (s.id === id ? { ...s, ...session } : s)));
    addAuditLog('UPDATE_CLASS_SESSION', 'CLASS_SESSION', id, { ...prevSession, ...session }, prevSession);
    return { success: true };
  };

  // Core Attendance Submission - ATOMIC & CONFIRMED-ONLY
  const submitAttendance = async (
    classSessionId: string,
    records: { studentId: string; status: AttendanceStatus; remarks?: string }[],
    topicCovered?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const facultyId = user?.id || 'fac-1';
    const actorName = user?.name || 'Faculty';
    const actorRole = user?.activeRole || 'TEACHER';

    // Submit to Supabase database (uses atomic RPC or safe transactional fallback)
    const dbRes = await attendanceService.submitSessionAttendance(
      classSessionId,
      records,
      facultyId,
      topicCovered,
      actorName,
      actorRole
    );

    if (!dbRes.success) {
      return {
        success: false,
        error: dbRes.error?.message || 'Attendance could not be saved to Supabase. Please retry.'
      };
    }

    const confirmedTimestamp = dbRes.submittedTimestamp || new Date().toISOString();

    // 1. Update session status in local cache ONLY after confirmed write
    setClassSessions(prev =>
      prev.map(s => {
        if (s.id === classSessionId) {
          return {
            ...s,
            status: 'CONDUCTED',
            attendanceSubmitted: true,
            submittedTimestamp: confirmedTimestamp,
            topicCovered: topicCovered || s.topicCovered
          };
        }
        return s;
      })
    );

    // 2. Update attendance records in local cache
    const newAttendanceRecords: AttendanceRecord[] = records.map(r => ({
      id: `att-${classSessionId}-${r.studentId}`,
      classSessionId,
      studentId: r.studentId,
      status: r.status,
      markedByFacultyId: facultyId,
      markedTimestamp: confirmedTimestamp,
      remarks: r.remarks
    }));

    setAttendanceRecords(prev => {
      const filtered = prev.filter(a => a.classSessionId !== classSessionId);
      return [...filtered, ...newAttendanceRecords];
    });

    addAuditLog('SUBMIT_ATTENDANCE_CONFIRMED', 'CLASS_SESSION', classSessionId, {
      totalRecords: records.length,
      presentCount: records.filter(r => r.status === 'PRESENT').length,
      absentCount: records.filter(r => r.status === 'ABSENT').length,
      odCount: records.filter(r => r.status === 'OD').length,
      submittedAt: confirmedTimestamp
    });

    return { success: true };
  };

  // Attendance Correction Requests
  const submitCorrectionRequest = async (req: Omit<AttendanceCorrectionRequest, 'id' | 'requestedDate' | 'status'>): Promise<{ success: boolean; data?: AttendanceCorrectionRequest; error?: string }> => {
    const res = await attendanceService.submitCorrection(req);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to submit correction request to database.' };
    }
    const created = res.data;
    setCorrectionRequests(prev => [created, ...prev]);

    // Send in-app notification to HOD
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      targetRole: 'HOD',
      title: 'New Attendance Correction Request',
      body: `Correction request submitted for session ${req.classSessionId}. Reason: ${req.reason}`,
      type: 'CORRECTION_REQUEST',
      isRead: false,
      link: '/hod/corrections',
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);

    addAuditLog('REQUEST_ATTENDANCE_CORRECTION', 'CORRECTION_REQUEST', created.id, created);
    return { success: true, data: created };
  };

  const reviewCorrectionRequest = async (
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    remarks?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const targetReq = correctionRequests.find(r => r.id === requestId);
    if (!targetReq) return { success: false, error: 'Correction request not found.' };

    const reviewerFacultyId = user?.id || 'fac-1';
    const actorName = user?.name || 'Reviewer';
    const actorRole = user?.activeRole || 'HOD';

    // Submit review to Supabase via atomic RPC / transactional method
    const res = await attendanceService.reviewCorrection(
      requestId,
      status,
      reviewerFacultyId,
      remarks,
      actorName,
      actorRole
    );

    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to update correction request in database.' };
    }

    const now = new Date().toISOString();

    // 1. Update correction request status in local cache
    setCorrectionRequests(prev =>
      prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            status,
            reviewedByFacultyId: reviewerFacultyId,
            reviewDate: now,
            reviewRemarks: remarks
          };
        }
        return r;
      })
    );

    // 2. If approved, update the actual Attendance Record in local cache
    if (status === 'APPROVED') {
      setAttendanceRecords(prev =>
        prev.map(a => {
          if (a.classSessionId === targetReq.classSessionId && a.studentId === targetReq.studentId) {
            return {
              ...a,
              status: targetReq.requestedStatus,
              remarks: `Corrected via Approval (${remarks || 'HOD Approved'})`
            };
          }
          return a;
        })
      );
    }

    addAuditLog('REVIEW_CORRECTION_REQUEST', 'CORRECTION_REQUEST', requestId, { status, remarks });
    return { success: true };
  };

  // Substitute Faculty Assignment
  const assignSubstitute = async (sub: {
    classSessionId?: string;
    timetableEntryId?: string;
    originalFacultyId: string;
    substituteFacultyId: string;
    courseGroupId: string;
    date: string;
    periodId: string;
    reason: string;
    approvedByHodId: string;
  }): Promise<{ success: boolean; error?: string }> => {
    // 1. Record in substitute_assignments via attendanceService
    const res = await attendanceService.assignSubstitute({
      classSessionId: sub.classSessionId,
      timetableEntryId: sub.timetableEntryId,
      date: sub.date,
      originalFacultyId: sub.originalFacultyId,
      substituteFacultyId: sub.substituteFacultyId,
      assignedByFacultyId: sub.approvedByHodId || user?.id || 'fac-1',
      reason: sub.reason
    });

    if (!res.success) {
      console.warn('AttendanceService assignSubstitute notice:', res.error?.message);
    }

    // 2. Record daily schedule override
    const overrideRes = await scheduleOverrideService.createOverride({
      date: sub.date,
      originalPeriodId: sub.periodId,
      timetableEntryId: sub.timetableEntryId,
      overrideType: 'SUBSTITUTE',
      originalFacultyId: sub.originalFacultyId,
      substituteFacultyId: sub.substituteFacultyId,
      courseGroupId: sub.courseGroupId,
      reason: sub.reason,
      createdByFacultyId: sub.approvedByHodId || user?.id || 'fac-1'
    });

    if (overrideRes.data) {
      setDailyScheduleOverrides(prev => [overrideRes.data!, ...prev]);
    }

    // 3. If there is a matching classSession in local state, update it
    setClassSessions(prev =>
      prev.map(s => {
        const matchesById = sub.classSessionId && s.id === sub.classSessionId;
        const matchesByEntry = sub.timetableEntryId && s.timetableEntryId === sub.timetableEntryId && s.date === sub.date;
        if (matchesById || matchesByEntry) {
          return {
            ...s,
            substituteFacultyId: sub.substituteFacultyId,
            sessionType: 'SUBSTITUTE'
          };
        }
        return s;
      })
    );

    const newSub: SubstituteAssignment = {
      id: `sub-${Date.now()}`,
      classSessionId: sub.classSessionId || '',
      timetableEntryId: sub.timetableEntryId,
      date: sub.date,
      periodId: sub.periodId,
      originalFacultyId: sub.originalFacultyId,
      substituteFacultyId: sub.substituteFacultyId,
      courseGroupId: sub.courseGroupId,
      approvedByHodId: sub.approvedByHodId || user?.id || 'fac-1',
      reason: sub.reason,
      status: 'ASSIGNED',
      createdAt: new Date().toISOString()
    };
    setSubstituteAssignments(prev => [newSub, ...prev]);
    addAuditLog('ASSIGN_SUBSTITUTE_FACULTY', 'SUBSTITUTE_ASSIGNMENT', newSub.id, newSub);
    return { success: true };
  };

  const createScheduleOverride = async (
    override: Omit<DailyScheduleOverride, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; data?: DailyScheduleOverride; error?: string }> => {
    const res = await scheduleOverrideService.createOverride(override);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to create schedule override.' };
    }
    setDailyScheduleOverrides(prev => [res.data!, ...prev]);
    addAuditLog('CREATE_SCHEDULE_OVERRIDE', 'DAILY_SCHEDULE_OVERRIDE', res.data.id, res.data);
    return { success: true, data: res.data };
  };

  const cancelScheduledClass = async (
    timetableEntryId: string,
    date: string,
    reason: string,
    facultyId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const entry = timetableEntries.find(t => t.id === timetableEntryId);
    if (!entry) return { success: false, error: 'Timetable entry not found.' };

    const res = await scheduleOverrideService.cancelClass(
      date,
      entry.periodId,
      timetableEntryId,
      reason,
      facultyId || user?.id || 'fac-1'
    );

    if (res.data) {
      setDailyScheduleOverrides(prev => [res.data!, ...prev]);
    }

    // Update session if it already exists
    setClassSessions(prev =>
      prev.map(s => {
        if (s.timetableEntryId === timetableEntryId && s.date === date) {
          return {
            ...s,
            status: 'CANCELLED',
            cancellationReason: reason
          };
        }
        return s;
      })
    );

    addAuditLog('CANCEL_SCHEDULED_CLASS', 'CLASS_SESSION', timetableEntryId, { date, reason });
    return { success: true };
  };

  const createExtraClass = async (data: {
    date: string;
    periodId: string;
    courseOfferingId: string;
    courseGroupId: string;
    facultyId: string;
    room?: string;
    reason?: string;
  }): Promise<{ success: boolean; data?: ClassSession; error?: string }> => {
    const period = timetablePeriods.find(p => p.id === data.periodId);
    const newSessionData: Omit<ClassSession, 'id'> = {
      courseOfferingId: data.courseOfferingId,
      courseGroupId: data.courseGroupId,
      facultyId: data.facultyId,
      sessionSource: 'EXTRA',
      sessionType: 'EXTRA',
      date: data.date,
      periodId: data.periodId,
      startTime: period?.startTime || '15:30',
      endTime: period?.endTime || '16:30',
      room: data.room || 'LH-101',
      topicCovered: data.reason || 'Extra class session',
      status: 'SCHEDULED',
      attendanceSubmitted: false
    };

    const res = await addClassSession(newSessionData);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    await scheduleOverrideService.createOverride({
      date: data.date,
      newPeriodId: data.periodId,
      overrideType: 'EXTRA_CLASS',
      courseOfferingId: data.courseOfferingId,
      courseGroupId: data.courseGroupId,
      substituteFacultyId: data.facultyId,
      newRoom: data.room,
      reason: data.reason || 'Extra class scheduled'
    });

    addAuditLog('CREATE_EXTRA_CLASS', 'CLASS_SESSION', res.data?.id || res.id || '', newSessionData);
    return { success: true, data: res.data };
  };

  // Timetable-driven lazy session instantiation
  const getOrCreateSessionForTimetableEntry = async (timetableEntryId: string, date: string): Promise<ClassSession> => {
    // 1. Check if session already exists in state
    const existing = classSessions.find(
      s => (s.timetableEntryId === timetableEntryId || s.id === timetableEntryId) && s.date === date
    );
    if (existing) {
      return existing;
    }

    // 2. Find timetable entry
    const entry = timetableEntries.find(t => t.id === timetableEntryId);
    if (!entry) {
      throw new Error(`Timetable entry ${timetableEntryId} not found`);
    }

    // 3. Check for any daily schedule override for this entry and date
    const override = dailyScheduleOverrides.find(
      o => o.timetableEntryId === timetableEntryId && o.date === date
    );

    const periodId = override?.newPeriodId || entry.periodId;
    const period = timetablePeriods.find(p => p.id === periodId);
    const facultyId = entry.facultyId;
    const substituteFacultyId = override?.substituteFacultyId;
    const room = override?.newRoom || entry.room || entry.roomNumber || 'LH-101';
    const isCancelled = override?.overrideType === 'CANCELLED_CLASS';

    const newSessionData: Omit<ClassSession, 'id'> = {
      courseOfferingId: entry.courseOfferingId,
      courseGroupId: entry.courseGroupId,
      facultyId,
      substituteFacultyId,
      timetableEntryId: entry.id,
      sessionSource: 'TIMETABLE',
      room,
      date,
      periodId,
      startTime: period?.startTime || '09:30',
      endTime: period?.endTime || '10:30',
      topicCovered: '',
      sessionType: substituteFacultyId ? 'SUBSTITUTE' : 'REGULAR',
      status: isCancelled ? 'CANCELLED' : 'SCHEDULED',
      cancellationReason: isCancelled ? (override?.reason || 'Cancelled by department') : undefined,
      attendanceSubmitted: false
    };

    const res = await addClassSession(newSessionData);
    if (res.data) {
      return res.data;
    }

    const fallbackSession: ClassSession = {
      ...newSessionData,
      id: res.id || `sess-${Date.now()}`
    };
    setClassSessions(prev => [fallbackSession, ...prev]);
    return fallbackSession;
  };

  const getDailyScheduledClasses = (dateStr: string, filterFacultyId?: string, filterDepartmentId?: string) => {
    const d = new Date(dateStr);
    const dayIndex = d.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
    if (dayIndex === 0) {
      return [];
    }
    const days: DayOfWeek[] = ['MONDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDayOfWeek = days[dayIndex];

    const entriesForDay = timetableEntries.filter(
      t => (t.dayOfWeek === currentDayOfWeek || t.weekday === currentDayOfWeek) && t.isActive !== false
    );

    const overridesForDate = dailyScheduleOverrides.filter(o => o.date === dateStr);
    const results: any[] = [];

    for (const entry of entriesForDay) {
      const override = overridesForDate.find(o => o.timetableEntryId === entry.id);
      const isCancelled = override?.overrideType === 'CANCELLED_CLASS';
      const effectivePeriodId = override?.newPeriodId || entry.periodId;
      const period = timetablePeriods.find(p => p.id === effectivePeriodId);
      const courseOffering = courseOfferings.find(o => o.id === entry.courseOfferingId);
      const course = courses.find(c => c.id === courseOffering?.courseId);
      const courseGroup = courseGroups.find(g => g.id === entry.courseGroupId);
      const category = courseCategories.find(cat => cat.id === courseOffering?.courseCategoryId);

      const scheduledFaculty = faculty.find(f => f.id === entry.facultyId);
      const subFacultyId = override?.substituteFacultyId;
      const substituteFaculty = subFacultyId ? faculty.find(f => f.id === subFacultyId) : undefined;
      const effectiveFaculty = substituteFaculty || scheduledFaculty;

      const existingSession = classSessions.find(
        s => (s.timetableEntryId === entry.id || s.id === entry.id) && s.date === dateStr
      );

      const isConducted = existingSession?.attendanceSubmitted === true;
      const isPending = !isCancelled && !isConducted;

      let statusBadge: 'CONDUCTED' | 'PENDING' | 'CANCELLED' | 'UPCOMING' = 'UPCOMING';
      if (isCancelled) {
        statusBadge = 'CANCELLED';
      } else if (isConducted) {
        statusBadge = 'CONDUCTED';
      } else if (isPending) {
        statusBadge = 'PENDING';
      }

      if (filterDepartmentId && filterDepartmentId !== 'ALL' && courseOffering?.departmentId !== filterDepartmentId) {
        continue;
      }

      if (filterFacultyId) {
        const matchesScheduled = entry.facultyId === filterFacultyId;
        const matchesSubstitute = subFacultyId === filterFacultyId || existingSession?.substituteFacultyId === filterFacultyId;
        if (!matchesScheduled && !matchesSubstitute) {
          continue;
        }
      }

      results.push({
        timetableEntry: entry,
        session: existingSession,
        period,
        courseOffering,
        course,
        courseGroup,
        category,
        scheduledFaculty,
        effectiveFaculty,
        substituteFaculty,
        isSubstitute: !!substituteFaculty,
        isCancelled,
        isExtra: false,
        isPending,
        isConducted,
        room: override?.newRoom || existingSession?.room || entry.room || entry.roomNumber || 'LH-101',
        statusBadge
      });
    }

    // Extra class sessions for this date
    const extraSessions = classSessions.filter(
      s => s.date === dateStr && (s.sessionSource === 'EXTRA' || s.sessionType === 'EXTRA')
    );
    for (const extraSess of extraSessions) {
      const period = timetablePeriods.find(p => p.id === extraSess.periodId);
      const courseOffering = courseOfferings.find(o => o.id === extraSess.courseOfferingId);
      const course = courses.find(c => c.id === courseOffering?.courseId);
      const courseGroup = courseGroups.find(g => g.id === extraSess.courseGroupId);
      const category = courseCategories.find(cat => cat.id === courseOffering?.courseCategoryId);
      const effectiveFaculty = faculty.find(f => f.id === extraSess.facultyId);

      if (filterDepartmentId && filterDepartmentId !== 'ALL' && courseOffering?.departmentId !== filterDepartmentId) {
        continue;
      }
      if (filterFacultyId && extraSess.facultyId !== filterFacultyId && extraSess.substituteFacultyId !== filterFacultyId) {
        continue;
      }

      results.push({
        session: extraSess,
        period,
        courseOffering,
        course,
        courseGroup,
        category,
        scheduledFaculty: effectiveFaculty,
        effectiveFaculty,
        substituteFaculty: undefined,
        isSubstitute: false,
        isCancelled: extraSess.status === 'CANCELLED',
        isExtra: true,
        isPending: !extraSess.attendanceSubmitted && extraSess.status !== 'CANCELLED',
        isConducted: extraSess.attendanceSubmitted,
        room: extraSess.room || 'LH-101',
        statusBadge: extraSess.status === 'CANCELLED' ? 'CANCELLED' : extraSess.attendanceSubmitted ? 'CONDUCTED' : 'PENDING'
      });
    }

    return results.sort((a, b) => {
      const pA = a.period?.periodNumber ?? 99;
      const pB = b.period?.periodNumber ?? 99;
      return pA - pB;
    });
  };

  const submitBatchCorrectionRequest = async (
    sessionId: string,
    corrections: { studentId: string; oldStatus: AttendanceStatus; requestedStatus: AttendanceStatus }[],
    reason: string,
    facultyId: string
  ): Promise<{ success: boolean; requestGroupId?: string; error?: string }> => {
    if (!corrections.length) return { success: false, error: 'No students selected for correction.' };

    const requestGroupId = `grp-corr-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const createdList: AttendanceCorrectionRequest[] = [];

    for (const c of corrections) {
      const payload: Omit<AttendanceCorrectionRequest, 'id' | 'requestedDate' | 'status'> = {
        classSessionId: sessionId,
        studentId: c.studentId,
        oldStatus: c.oldStatus,
        requestedStatus: c.requestedStatus,
        reason,
        requestedByFacultyId: facultyId || user?.id || 'fac-1',
        requestGroupId
      };

      const res = await attendanceService.submitCorrection(payload);
      if (res.data) {
        createdList.push(res.data);
      } else {
        createdList.push({
          ...payload,
          id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          status: 'PENDING',
          requestedDate: timestamp
        });
      }
    }

    setCorrectionRequests(prev => [...createdList, ...prev]);

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      targetRole: 'HOD',
      title: 'Batch Attendance Correction Request',
      body: `${corrections.length} student attendance correction(s) submitted for approval.`,
      type: 'CORRECTION_REQUEST',
      isRead: false,
      link: '/hod/corrections',
      createdAt: timestamp
    };
    setNotifications(prev => [notif, ...prev]);

    addAuditLog('SUBMIT_BATCH_CORRECTION_REQUEST', 'CORRECTION_REQUEST', requestGroupId, {
      count: corrections.length,
      sessionId,
      reason
    });

    return { success: true, requestGroupId };
  };

  const reviewCorrectionBatch = async (
    requestGroupId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewRemarks?: string,
    reviewedByFacultyId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const matchingRequests = correctionRequests.filter(
      r => r.requestGroupId === requestGroupId || r.id === requestGroupId
    );

    if (!matchingRequests.length) {
      return { success: false, error: 'No matching correction requests found.' };
    }

    const reviewerId = reviewedByFacultyId || user?.id || 'fac-1';
    const now = new Date().toISOString();

    for (const req of matchingRequests) {
      await attendanceService.reviewCorrection(
        req.id,
        status,
        reviewerId,
        reviewRemarks,
        user?.name || 'Reviewer',
        user?.activeRole || 'HOD'
      );
    }

    setCorrectionRequests(prev =>
      prev.map(r => {
        if (r.requestGroupId === requestGroupId || r.id === requestGroupId) {
          return {
            ...r,
            status,
            reviewedByFacultyId: reviewerId,
            reviewDate: now,
            reviewRemarks
          };
        }
        return r;
      })
    );

    if (status === 'APPROVED') {
      setAttendanceRecords(prev =>
        prev.map(a => {
          const matchedReq = matchingRequests.find(
            mr => mr.classSessionId === a.classSessionId && mr.studentId === a.studentId
          );
          if (matchedReq) {
            return {
              ...a,
              status: matchedReq.requestedStatus,
              remarks: `Corrected via Approval (${reviewRemarks || 'HOD Approved'})`
            };
          }
          return a;
        })
      );
    }

    addAuditLog('REVIEW_BATCH_CORRECTION_REQUEST', 'CORRECTION_REQUEST', requestGroupId, { status, reviewRemarks });
    return { success: true };
  };

  const getClassTutorCohort = (facultyId?: string) => {
    const targetFacId = facultyId || user?.id;
    if (!targetFacId) return null;

    const assignment = classTutorAssignments.find(
      a => (a.facultyId === targetFacId || a.id === targetFacId) && a.isActive !== false
    ) || (user?.activeRole === 'CLASS_TUTOR' ? classTutorAssignments[0] : undefined);

    if (!assignment) {
      const fac = faculty.find(f => f.id === targetFacId);
      const deptProg = programmes.find(p => p.departmentId === fac?.departmentId);
      if (deptProg) {
        const cohortStudents = students.filter(s => s.programmeId === deptProg.id);
        const dept = departments.find(d => d.id === deptProg.departmentId);
        return {
          programme: deptProg,
          department: dept,
          batchName: '2026-2030',
          cohortStudents
        };
      }
      return null;
    }

    const prog = programmes.find(p => p.id === assignment.programmeId);
    const dept = departments.find(d => d.id === (assignment.departmentId || prog?.departmentId));
    const cohortStudents = students.filter(
      s => s.programmeId === assignment.programmeId &&
           (!assignment.batchName || s.admissionBatch === assignment.batchName || !s.admissionBatch)
    );

    return {
      assignment,
      programme: prog,
      department: dept,
      batchName: assignment.batchName || '2026-2030',
      cohortStudents
    };
  };

  // Special / Institutional Attendance Event & Record Creation
  const createSpecialAttendanceEvent = async (
    eventData: Omit<SpecialAttendanceEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; data?: SpecialAttendanceEvent; error?: string }> => {
    try {
      // 1. Role boundaries enforcement:
      // HOD scope is restricted to their own department (or programme under department)
      if (user?.activeRole === 'HOD' && user.departmentId) {
        if (eventData.scopeType === 'COLLEGE') {
          return {
            success: false,
            error: 'HODs cannot grant College-wide special attendance. Institutional college-wide events require Principal or Super Admin approval.'
          };
        }
        if (eventData.departmentId && eventData.departmentId !== user.departmentId) {
          return {
            success: false,
            error: 'HODs are restricted to granting special attendance for their own department only.'
          };
        }
      }

      // 2. Determine eligible students based on scope
      let eligibleStudents: Student[] = [];
      if (eventData.scopeType === 'COLLEGE') {
        eligibleStudents = [...students];
      } else if (eventData.scopeType === 'DEPARTMENT') {
        eligibleStudents = students.filter(s => s.homeDepartmentId === eventData.departmentId || s.departmentId === eventData.departmentId);
      } else if (eventData.scopeType === 'PROGRAMME') {
        eligibleStudents = students.filter(s => s.programmeId === eventData.programmeId);
      } else if (eventData.scopeType === 'BATCH') {
        eligibleStudents = students.filter(s => s.admissionBatchId === eventData.batchId || s.batchId === eventData.batchId);
      } else if (eventData.scopeType === 'COURSE_GROUP') {
        const regs = studentCourseRegistrations.filter(r => r.courseGroupId === eventData.courseGroupId);
        const stuIds = new Set(regs.map(r => r.studentId));
        eligibleStudents = students.filter(s => stuIds.has(s.id));
      } else if (eventData.scopeType === 'SELECTED_STUDENTS') {
        const stuIds = new Set(eventData.selectedStudentIds || []);
        eligibleStudents = students.filter(s => stuIds.has(s.id));
      }

      if (eventData.studentCoverage === 'SELECTED_ONLY' && eventData.selectedStudentIds && eventData.selectedStudentIds.length > 0) {
        const selectedSet = new Set(eventData.selectedStudentIds);
        eligibleStudents = eligibleStudents.filter(s => selectedSet.has(s.id));
      }

      // 3. Determine affected periods
      let targetPeriodIds = eventData.periodIds || [];
      if (eventData.isFullDay || targetPeriodIds.length === 0) {
        targetPeriodIds = timetablePeriods.map(p => p.id);
      }

      // 4. Generate individual records with normal class session conflict analysis
      const generatedRecords: Omit<SpecialAttendanceRecord, 'id' | 'createdAt'>[] = [];
      const timestamp = new Date().toISOString();

      eligibleStudents.forEach(stu => {
        // Collect student's registered course group IDs
        const studentGroupIds = studentCourseRegistrations
          .filter(r => r.studentId === stu.id)
          .map(r => r.courseGroupId);

        targetPeriodIds.forEach(periodId => {
          // Check if there was a normal class session for this student at this date and period
          const normalSession = classSessions.find(
            s => s.date === eventData.eventDate &&
                 s.periodId === periodId &&
                 studentGroupIds.includes(s.courseGroupId)
          );

          let conflictStatus: SpecialAttendanceRecord['normalSessionConflictStatus'] = 'NO_SESSION';
          if (normalSession) {
            if (normalSession.status === 'CANCELLED') {
              conflictStatus = 'SESSION_CANCELLED';
            } else {
              const existingRecord = attendanceRecords.find(
                r => r.classSessionId === normalSession.id && r.studentId === stu.id
              );
              if (existingRecord) {
                if (existingRecord.status === 'PRESENT' || existingRecord.status === 'OD') {
                  conflictStatus = 'NORMAL_PRESENT';
                } else if (existingRecord.status === 'ABSENT') {
                  conflictStatus = 'OVERRIDDEN';
                }
              } else {
                conflictStatus = 'NO_SESSION';
              }
            }
          }

          generatedRecords.push({
            eventId: '',
            studentId: stu.id,
            date: eventData.eventDate,
            periodId,
            attendanceStatus: 'SPECIAL',
            attendanceSource: 'SPECIAL',
            normalSessionConflictStatus: conflictStatus,
            remarks: eventData.reason
          });
        });
      });

      // 5. Persist to Supabase via service
      const res = await specialAttendanceService.createEventWithRecords(eventData, generatedRecords);
      const newEvent: SpecialAttendanceEvent = res.data?.event || {
        ...eventData,
        id: `spec-event-${Date.now()}`,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const newRecords: SpecialAttendanceRecord[] = res.data?.records || generatedRecords.map((r, i) => ({
        ...r,
        id: `spec-rec-${Date.now()}-${i}`,
        eventId: newEvent.id,
        createdAt: timestamp
      }));

      setSpecialAttendanceEvents(prev => [newEvent, ...prev]);
      setSpecialAttendanceRecords(prev => [...newRecords, ...prev]);

      addAuditLog('CREATE_SPECIAL_ATTENDANCE', 'SPECIAL_ATTENDANCE_EVENT', newEvent.id, {
        title: newEvent.title,
        scopeType: newEvent.scopeType,
        eventDate: newEvent.eventDate,
        periodsCount: targetPeriodIds.length,
        studentsCount: eligibleStudents.length
      });

      // Notify relevant users
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        targetRole: eventData.scopeType === 'COLLEGE' ? 'PRINCIPAL' : 'HOD',
        title: `Special Attendance: ${newEvent.title}`,
        body: `Special attendance granted for ${newEvent.eventDate} (${newEvent.scopeType}) to ${eligibleStudents.length} students.`,
        type: 'SYSTEM',
        isRead: false,
        link: '/special-attendance',
        createdAt: timestamp
      };
      setNotifications(prev => [newNotif, ...prev]);

      return { success: true, data: newEvent };
    } catch (err: any) {
      console.error('Error creating special attendance event:', err);
      return { success: false, error: err?.message || 'Failed to create special attendance event.' };
    }
  };

  const updateSpecialAttendanceStatus = async (
    id: string,
    status: SpecialAttendanceStatus,
    remarks?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await specialAttendanceService.updateEventStatus(
        id,
        status,
        user?.id,
        user?.name
      );
      if (!res.success) {
        return { success: false, error: res.error?.message || 'Failed to update special attendance status.' };
      }

      setSpecialAttendanceEvents(prev =>
        prev.map(e => (e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e))
      );

      addAuditLog('UPDATE_SPECIAL_ATTENDANCE_STATUS', 'SPECIAL_ATTENDANCE_EVENT', id, { status, remarks });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update status.' };
    }
  };

  const deleteSpecialAttendanceEvent = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await specialAttendanceService.deleteEvent(id);
      if (!res.success) {
        return { success: false, error: res.error?.message || 'Failed to delete event.' };
      }

      setSpecialAttendanceEvents(prev => prev.filter(e => e.id !== id));
      setSpecialAttendanceRecords(prev => prev.filter(r => r.eventId !== id));

      addAuditLog('DELETE_SPECIAL_ATTENDANCE', 'SPECIAL_ATTENDANCE_EVENT', id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete event.' };
    }
  };

  // Announcements
  const addAnnouncement = async (ann: Omit<Announcement, 'id' | 'createdAt'>): Promise<{ success: boolean; data?: Announcement; error?: string }> => {
    const res = await announcementService.createAnnouncement(ann);
    if (res.error || !res.data) {
      return { success: false, error: res.error?.message || 'Failed to post announcement to database.' };
    }
    const created = res.data;
    setAnnouncements(prev => [created, ...prev]);
    addAuditLog('CREATE_ANNOUNCEMENT', 'ANNOUNCEMENT', created.id, created);
    return { success: true, data: created };
  };

  const deleteAnnouncement = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const res = await announcementService.deleteAnnouncement(id);
    if (!res.success) {
      return { success: false, error: res.error?.message || 'Failed to delete announcement from database.' };
    }
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    addAuditLog('DELETE_ANNOUNCEMENT', 'ANNOUNCEMENT', id);
    return { success: true };
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Analytical Calculation for Student FYUGP Attendance
  const getStudentAttendanceSummary = (studentId: string) => {
    // Find all course registrations for this student
    const studentRegistrations = studentCourseRegistrations.filter(r => r.studentId === studentId);

    let totalConducted = 0;
    let totalPresent = 0;
    let totalOd = 0;
    let totalMedicalLeave = 0;
    let totalAbsent = 0;

    const coursesSummary: CourseAttendanceSummary[] = studentRegistrations.map(reg => {
      const offering = courseOfferings.find(o => o.id === reg.courseOfferingId);
      const course = courses.find(c => c.id === offering?.courseId);
      const category = courseCategories.find(cat => cat.id === reg.courseCategoryId || cat.id === course?.categoryId);
      const group = courseGroups.find(g => g.id === reg.courseGroupId);
      const facultyAssign = facultyAssignments.find(fa => fa.courseGroupId === reg.courseGroupId);
      const assignedFaculty = faculty.find(f => f.id === facultyAssign?.facultyId);

      // Find all conducted class sessions for this course group
      const sessions = classSessions.filter(
        s => s.courseGroupId === reg.courseGroupId && s.attendanceSubmitted
      );

      // Total conducted sessions for this course group
      const courseConducted = sessions.length;
      let coursePresent = 0;
      let courseOd = 0;
      let courseML = 0;
      let courseAbsent = 0;

      sessions.forEach(sess => {
        const att = attendanceRecords.find(
          a => a.classSessionId === sess.id && a.studentId === studentId
        );
        const specialRec = specialAttendanceRecords.find(
          s => s.studentId === studentId && s.date === sess.date && s.periodId === sess.periodId
        );

        if (specialRec) {
          // Special attendance applied for this date and period!
          if (att && (att.status === 'PRESENT' || att.status === 'OD')) {
            if (att.status === 'PRESENT') coursePresent++;
            else courseOd++;
          } else {
            // Overrides absent / unmarked session as authorized institutional attendance
            coursePresent++;
          }
        } else if (att) {
          if (att.status === 'PRESENT') coursePresent++;
          else if (att.status === 'OD') courseOd++;
          else if (att.status === 'MEDICAL_LEAVE') courseML++;
          else if (att.status === 'ABSENT') courseAbsent++;
          else if (att.status === 'APPROVED_LEAVE') coursePresent++; // institutional benefit
        } else {
          // If session was conducted but no record marked, counted as absent
          courseAbsent++;
        }
      });

      // Account for timetable periods covered by special attendance where NO normal session was conducted
      const groupTimetable = timetableEntries.filter(te => te.courseGroupId === reg.courseGroupId);
      const studentSpecialRecords = specialAttendanceRecords.filter(s => s.studentId === studentId);

      let specialConducted = 0;
      let specialPresent = 0;

      studentSpecialRecords.forEach(sr => {
        const alreadyCountedInSession = sessions.some(s => s.date === sr.date && s.periodId === sr.periodId);
        if (!alreadyCountedInSession) {
          const eventDateObj = new Date(sr.date + 'T00:00:00Z');
          const dayIndex = eventDateObj.getUTCDay();
          const dayNames: DayOfWeek[] = ['SUNDAY' as any, 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
          const eventDayName = dayNames[dayIndex];

          const isScheduledForThisGroup = groupTimetable.some(
            te => te.dayOfWeek === eventDayName && te.periodId === sr.periodId
          );

          if (isScheduledForThisGroup) {
            specialConducted++;
            specialPresent++;
          }
        }
      });

      const effectiveCourseConducted = courseConducted + specialConducted;
      const effectiveCoursePresent = coursePresent + specialPresent;

      // Total effective attendance count = Present + OD + (ML if enabled)
      const effectiveAttended = effectiveCoursePresent + courseOd + (settings.enableOdAutomation ? courseML : 0);
      const percentage = effectiveCourseConducted > 0 ? Number(((effectiveAttended / effectiveCourseConducted) * 100).toFixed(2)) : 100;

      const isShortage = percentage < settings.minAttendancePercentage;
      const isWarning = percentage < settings.warningAttendancePercentage && !isShortage;

      // Attendance Calculator:
      // Minimum needed = ceil((minPercent * conducted - attended) / (1 - minPercent))
      const targetRatio = settings.minAttendancePercentage / 100;
      let classesNeededForMin = 0;
      let classesCanMiss = 0;

      if (effectiveCourseConducted > 0) {
        if (percentage < settings.minAttendancePercentage) {
          // calculate future classes needed: (effectiveAttended + x) / (courseConducted + x) >= targetRatio
          // x >= (targetRatio * courseConducted - effectiveAttended) / (1 - targetRatio)
          const needed = Math.ceil((targetRatio * effectiveCourseConducted - effectiveAttended) / (1 - targetRatio));
          classesNeededForMin = Math.max(0, needed);
        } else {
          // calculate how many classes can miss: effectiveAttended / (courseConducted + y) >= targetRatio
          // effectiveAttended / targetRatio - courseConducted >= y
          const canMiss = Math.floor(effectiveAttended / targetRatio - effectiveCourseConducted);
          classesCanMiss = Math.max(0, canMiss);
        }
      }

      totalConducted += effectiveCourseConducted;
      totalPresent += effectiveCoursePresent;
      totalOd += courseOd;
      totalMedicalLeave += courseML;
      totalAbsent += courseAbsent;

      return {
        registrationId: reg.id,
        courseOfferingId: reg.courseOfferingId,
        courseGroupId: reg.courseGroupId,
        courseId: course?.id || 'crs-unknown',
        courseCode: course?.courseCode || 'NSS-CRS',
        courseTitle: course?.courseTitle || 'Course Title',
        courseCategory: category?.name || 'Major',
        categoryColorHex: category?.colorHex || '#2563eb',
        groupName: group?.groupName || 'Group A',
        facultyName: assignedFaculty?.fullName || 'Faculty Member',
        credits: course?.credits || 4,
        conductedCount: effectiveCourseConducted,
        presentCount: effectiveCoursePresent,
        odCount: courseOd,
        medicalLeaveCount: courseML,
        absentCount: courseAbsent,
        percentage,
        isShortage,
        isWarning,
        classesNeededForMin,
        classesCanMiss
      };
    });

    const totalEffectiveAttended = totalPresent + totalOd + (settings.enableOdAutomation ? totalMedicalLeave : 0);
    const overallPercentage = totalConducted > 0 ? Number(((totalEffectiveAttended / totalConducted) * 100).toFixed(2)) : 100;

    return {
      overallPercentage,
      totalConducted,
      totalPresent,
      totalOd,
      totalMedicalLeave,
      totalAbsent,
      isShortage: overallPercentage < settings.minAttendancePercentage,
      isWarning: overallPercentage < settings.warningAttendancePercentage && overallPercentage >= settings.minAttendancePercentage,
      courses: coursesSummary
    };
  };

  // Helper: Retrieve all registered students for a Course Group (demonstrating cross-major cohort)
  const getCourseGroupRegisteredStudents = (courseGroupId: string) => {
    const regs = studentCourseRegistrations.filter(r => r.courseGroupId === courseGroupId);
    return regs
      .map(reg => {
        const student = students.find(s => s.id === reg.studentId);
        if (!student) return null;
        const category = courseCategories.find(c => c.id === reg.courseCategoryId);
        return {
          ...student,
          registrationCategory: category
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  };

  // Helper: Detect Pending Attendance Sessions
  const getPendingAttendanceSessions = (facultyId?: string, departmentId?: string) => {
    const unsubmitted = classSessions.filter(sess => {
      if (sess.attendanceSubmitted) return false;
      if (sess.status === 'CANCELLED') return false;
      if (facultyId && sess.facultyId !== facultyId && sess.substituteFacultyId !== facultyId) return false;
      if (departmentId && departmentId !== 'ALL') {
        const offering = courseOfferings.find(o => o.id === sess.courseOfferingId);
        if (offering?.departmentId !== departmentId) return false;
      }
      return true;
    });

    const today = new Date().toISOString().split('T')[0];
    const scheduled = getDailyScheduledClasses(today, facultyId, departmentId);
    const uninstantiated = scheduled
      .filter(c => c.isPending && !c.session && c.timetableEntry)
      .map(c => {
        const entry = c.timetableEntry!;
        const synthetic: ClassSession = {
          id: `entry-${entry.id}-${today}`,
          courseOfferingId: entry.courseOfferingId,
          courseGroupId: entry.courseGroupId,
          facultyId: entry.facultyId,
          substituteFacultyId: c.substituteFaculty?.id,
          timetableEntryId: entry.id,
          sessionSource: 'TIMETABLE',
          room: c.room,
          date: today,
          periodId: entry.periodId,
          startTime: c.period?.startTime || '09:30',
          endTime: c.period?.endTime || '10:30',
          topicCovered: '',
          sessionType: c.substituteFaculty ? 'SUBSTITUTE' : 'REGULAR',
          status: 'SCHEDULED',
          attendanceSubmitted: false
        };
        return synthetic;
      });

    return [...unsubmitted, ...uninstantiated];
  };

  // Helper: Export full attendance report to CSV
  const exportAttendanceReportToCsv = (filename = 'NSS_College_Attendance_Report.csv') => {
    const headers = [
      'Student Roll No',
      'Admission No',
      'Student Name',
      'Home Department',
      'Course Code',
      'Course Title',
      'Category',
      'Classes Conducted',
      'Classes Attended (P+OD)',
      'Attendance %',
      'Status'
    ];

    const rows: string[][] = [];

    students.forEach(stu => {
      const dept = departments.find(d => d.id === stu.homeDepartmentId);
      const summary = getStudentAttendanceSummary(stu.id);
      summary.courses.forEach(crs => {
        const attended = crs.presentCount + crs.odCount + crs.medicalLeaveCount;
        rows.push([
          stu.rollNumber,
          stu.admissionNumber,
          `"${stu.fullName}"`,
          `"${dept?.name || 'Department'}"`,
          crs.courseCode,
          `"${crs.courseTitle}"`,
          `"${crs.courseCategory}"`,
          crs.conductedCount.toString(),
          attended.toString(),
          `${crs.percentage}%`,
          crs.isShortage ? 'SHORTAGE' : crs.isWarning ? 'WARNING' : 'NORMAL'
        ]);
      });
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setSettings(initialSystemSettings);
    setDepartments(initialDepartments);
    setProgrammes(initialProgrammes);
    setCourseCategories(initialCourseCategories);
    setCourses(initialCourses);
    setCourseOfferings(initialCourseOfferings);
    setCourseGroups(initialCourseGroups);
    setStudents(initialStudents);
    setSemesterEnrollments(initialSemesterEnrollments);
    setStudentCourseRegistrations(initialStudentCourseRegistrations);
    setFaculty(initialFaculty);
    setFacultyAssignments(initialFacultyAssignments);
    setTimetablePeriods(initialTimetablePeriods);
    setTimetableEntries(initialTimetableEntries);
    setClassSessions(initialClassSessions);
    setAttendanceRecords(initialAttendanceRecords);
    setCorrectionRequests(initialCorrectionRequests);
    setSubstituteAssignments(initialSubstituteAssignments);
    setAnnouncements(initialAnnouncements);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);
    setSpecialAttendanceEvents(initialSpecialAttendanceEvents);
    setSpecialAttendanceRecords(initialSpecialAttendanceRecords);
    alert('System data reset to default NSS College Ottapalam database state.');
  };

  return (
    <CollegeDataContext.Provider
      value={{
        isDbConnected,
        syncStatus,
        domainHealth,
        lastSyncTimestamp,
        syncWithDatabase,
        settings,
        updateSettings,
        departments,
        addDepartment,
        updateDepartment,
        toggleDepartmentStatus,
        programmes,
        addProgramme,
        updateProgramme,
        toggleProgrammeStatus,
        academicYears,
        admissionBatches,
        updateAdmissionBatch,
        semesters,
        courseCategories,
        addCourseCategory,
        updateCourseCategory,
        courses,
        addCourse,
        updateCourse,
        courseOfferings,
        addCourseOffering,
        updateCourseOffering,
        courseGroups,
        addCourseGroup,
        updateCourseGroup,
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        semesterEnrollments,
        studentCourseRegistrations,
        registerStudentForCourse,
        bulkRegisterStudents,
        removeStudentCourseRegistration,
        faculty,
        addFaculty,
        updateFaculty,
        deleteFaculty,
        facultyAssignments,
        assignFacultyToCourse,
        deleteFacultyAssignment,
        facultySubjectRequests,
        facultyAssignmentHistory,
        submitFacultySubjectRequest,
        reviewFacultySubjectRequest,
        reassignFacultySubject,
        mapProvisionalCourse,
        inviteOrEnrollTeacher,
        timetablePeriods,
        updateTimetablePeriods,
        timetableEntries,
        addTimetableEntry,
        updateTimetableEntry,
        deleteTimetableEntry,
        classSessions,
        addClassSession,
        updateClassSession,
        attendanceRecords,
        submitAttendance,
        correctionRequests,
        submitCorrectionRequest,
        reviewCorrectionRequest,
        substituteAssignments,
        assignSubstitute,
        dailyScheduleOverrides,
        classTutorAssignments,
        getOrCreateSessionForTimetableEntry,
        getDailyScheduledClasses,
        createScheduleOverride,
        cancelScheduledClass,
        createExtraClass,
        submitBatchCorrectionRequest,
        reviewCorrectionBatch,
        getClassTutorCohort,
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        auditLogs,
        addAuditLog,
        specialAttendanceEvents,
        specialAttendanceRecords,
        createSpecialAttendanceEvent,
        updateSpecialAttendanceStatus,
        deleteSpecialAttendanceEvent,
        getStudentAttendanceSummary,
        getCourseGroupRegisteredStudents,
        getPendingAttendanceSessions,
        exportAttendanceReportToCsv,
        resetToDefaultData
      }}
    >
      {children}
    </CollegeDataContext.Provider>
  );
};

export const useCollegeData = () => {
  const context = useContext(CollegeDataContext);
  if (!context) {
    throw new Error('useCollegeData must be used within a CollegeDataProvider');
  }
  return context;
};
