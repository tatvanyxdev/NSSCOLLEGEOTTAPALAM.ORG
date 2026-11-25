import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useCollegeData } from './CollegeDataContext';
import {
  Circular,
  StudentLeaveRequest,
  StudentCertificateRequest,
  AcademicCalendarEvent,
  AcademicResource,
  EmergencyAlert,
  TimetableChangeAlert,
  Student,
  Faculty,
  DayOfWeek,
  TimetablePeriod,
  Course,
  CourseCategory,
  CourseGroup,
  ClassSession,
  DepartmentAttendancePolicy
} from '../types';
import { HalfDayPenaltyDetail } from '../utils/dualAttendanceEngine';
import {
  initialCirculars,
  initialLeaveRequests,
  initialCertificateRequests,
  initialAcademicEvents,
  initialAcademicResources,
  initialEmergencyAlerts,
  initialTimetableChangeAlerts
} from '../data/extendedInitialData';
import {
  resolveUserAcademicContext,
  isItemRelevantToAudience,
  UserAcademicContext
} from '../utils/audienceEngine';
import { personalizedModulesService } from '../services/personalizedModulesService';

export interface ResolvedTimetableSlot {
  period: TimetablePeriod;
  entry?: any;
  course?: Course;
  category?: CourseCategory;
  group?: CourseGroup;
  faculty?: Faculty;
  session?: ClassSession;
  changeAlert?: TimetableChangeAlert;
  isCancelled: boolean;
  isSubstitute: boolean;
  substituteFacultyName?: string;
  room: string;
}

export interface AttendanceIntelligence {
  attendancePolicy: DepartmentAttendancePolicy;
  policyLabel: string;
  overallPercentage: number;
  hourWisePercentage: number;
  regularPercentage: number;
  consolidatedPercentage: number;
  totalConducted: number;
  totalPresent: number;
  totalDutyLeave: number;
  totalOd: number;
  totalMedicalLeave: number;
  totalAbsent: number;
  cancelledCount: number;
  specialDutyApprovedCount: number;
  specialDutyPendingCount: number;
  totalWorkingDays: number;
  awardedDays: number;
  halfDaysLost: number;
  halfDayPenalties: HalfDayPenaltyDetail[];
  minThreshold: number;
  warningThreshold: number;
  isShortage: boolean;
  isWarning: boolean;
  classesNeededToMeetMin: number;
  classesCanMissSafely: number;
  shortageCourseCount: number;
  courseSummaries: any[];
  studentSpecialEvents?: any[];
}

export interface SearchResultItem {
  id: string;
  type: 'NOTICE' | 'CIRCULAR' | 'EVENT' | 'COURSE' | 'DEPARTMENT' | 'FACULTY' | 'RESOURCE';
  title: string;
  subtitle: string;
  category?: string;
  date?: string;
  linkTab: string;
  data: any;
}

interface PersonalizedCollegeContextType {
  // Academic Context
  userContext: UserAcademicContext;
  currentStudent: Student | null;
  currentFaculty: Faculty | null;
  switchActiveStudent: (studentId: string) => void;

  // Personalized Collections
  circulars: Circular[];
  leaveRequests: StudentLeaveRequest[];
  certificateRequests: StudentCertificateRequest[];
  academicEvents: AcademicCalendarEvent[];
  academicResources: AcademicResource[];
  emergencyAlerts: EmergencyAlert[];
  timetableChangeAlerts: TimetableChangeAlert[];

  // Action Handlers
  acknowledgeCircular: (circularId: string) => Promise<{ success: boolean; error?: string }>;
  issueCircular: (
    circular: Omit<Circular, 'id' | 'createdAt'>
  ) => Promise<{ success: boolean; data?: Circular; error?: string }>;
  deleteCircular: (id: string) => Promise<{ success: boolean; error?: string }>;
  submitLeaveRequest: (
    req: Omit<StudentLeaveRequest, 'id' | 'createdAt' | 'status'>
  ) => Promise<{ success: boolean; data?: StudentLeaveRequest; error?: string }>;
  reviewLeaveRequest: (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    remarks?: string
  ) => Promise<{ success: boolean; error?: string }>;
  submitCertificateRequest: (
    req: Omit<StudentCertificateRequest, 'id' | 'createdAt' | 'status'>
  ) => Promise<{ success: boolean; data?: StudentCertificateRequest; error?: string }>;
  updateCertificateRequestStatus: (
    id: string,
    status: 'SUBMITTED' | 'PROCESSING' | 'READY' | 'COLLECTED' | 'REJECTED',
    remarks?: string
  ) => Promise<{ success: boolean; error?: string }>;
  addAcademicEvent: (event: Omit<AcademicCalendarEvent, 'id' | 'createdAt'>) => Promise<{ success: boolean }>;
  addAcademicResource: (res: Omit<AcademicResource, 'id' | 'uploadedAt' | 'downloadCount'>) => Promise<{ success: boolean }>;
  addEmergencyAlert: (alert: Omit<EmergencyAlert, 'id' | 'createdAt' | 'isActive'>) => Promise<{ success: boolean }>;
  dismissEmergencyAlert: (id: string) => void;

  // Filtered/Computed for current user
  activeEmergencyAlert: EmergencyAlert | null;
  relevantCirculars: Circular[];
  relevantEvents: AcademicCalendarEvent[];
  relevantResources: AcademicResource[];
  studentLeaveRequests: StudentLeaveRequest[];
  studentCertificateRequests: StudentCertificateRequest[];

  // Dynamic Timetable & Intelligence
  getTodayResolvedTimetable: (overrideDay?: DayOfWeek) => ResolvedTimetableSlot[];
  attendanceIntelligence: AttendanceIntelligence | null;

  // Universal Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResultItem[];
}

const PersonalizedCollegeContext = createContext<PersonalizedCollegeContextType | undefined>(undefined);

const STORAGE_PREFIX = 'nss_erp_p_';

export const PersonalizedCollegeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeRole } = useAuth();
  const {
    students,
    faculty,
    semesterEnrollments,
    studentCourseRegistrations,
    programmes,
    departments,
    courses,
    courseCategories,
    courseOfferings,
    courseGroups,
    timetablePeriods,
    timetableEntries,
    classSessions,
    substituteAssignments,
    getStudentAttendanceSummary,
    settings,
    announcements
  } = useCollegeData();

  // Active student inspection override (in-memory only, strictly for SUPER_ADMIN)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const switchActiveStudent = (studentId: string) => {
    if (activeRole !== 'SUPER_ADMIN') {
      return;
    }
    setSelectedStudentId(studentId);
  };

  // 1. Resolve Academic Context
  const currentStudent = useMemo(() => {
    if (activeRole !== 'STUDENT') return null;

    // Check if explicitly linked
    if (user?.studentProfile) return user.studentProfile;

    // Match by user properties
    if (user?.id) {
      const match = students.find(
        s =>
          s.id === user.id ||
          (s as any).auth_user_id === user.id ||
          (s.username && user.name && s.username.toLowerCase() === user.name.toLowerCase()) ||
          (s.universityRegisterNumber &&
            user.name &&
            s.universityRegisterNumber.toLowerCase() === user.name.toLowerCase()) ||
          (user.email && s.email && s.email.toLowerCase() === user.email.toLowerCase())
      );
      if (match) return match;
    }

    // Allow switcher fallback strictly for Super Admin inspection
    if (activeRole === 'SUPER_ADMIN') {
      return students.find(s => s.id === selectedStudentId) || students[0] || null;
    }

    return null;
  }, [activeRole, user, students, selectedStudentId]);

  const currentFaculty = useMemo(() => {
    if (['STUDENT'].includes(activeRole)) return null;
    return (
      faculty.find(
        f =>
          f.id === user?.id ||
          (f.username && user?.name && f.username.toLowerCase() === user.name.toLowerCase()) ||
          (user?.email && f.email && f.email.toLowerCase() === user.email.toLowerCase())
      ) || null
    );
  }, [activeRole, user, faculty]);

  const userContext = useMemo<UserAcademicContext>(() => {
    return resolveUserAcademicContext({
      user: currentStudent ? { ...user, studentProfile: currentStudent } : user,
      activeRole,
      students,
      faculty,
      semesterEnrollments,
      studentCourseRegistrations,
      programmes,
      departments
    });
  }, [user, activeRole, currentStudent, students, faculty, semesterEnrollments, studentCourseRegistrations, programmes, departments]);

  // 2. Persistent Module States
  const [circulars, setCirculars] = useState<Circular[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}circulars`);
    return saved ? JSON.parse(saved) : initialCirculars;
  });

  const [leaveRequests, setLeaveRequests] = useState<StudentLeaveRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}leave_requests`);
    return saved ? JSON.parse(saved) : initialLeaveRequests;
  });

  const [certificateRequests, setCertificateRequests] = useState<StudentCertificateRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}certificate_requests`);
    return saved ? JSON.parse(saved) : initialCertificateRequests;
  });

  const [academicEvents, setAcademicEvents] = useState<AcademicCalendarEvent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}academic_events`);
    return saved ? JSON.parse(saved) : initialAcademicEvents;
  });

  const [academicResources, setAcademicResources] = useState<AcademicResource[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}academic_resources`);
    return saved ? JSON.parse(saved) : initialAcademicResources;
  });

  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}emergency_alerts`);
    return saved ? JSON.parse(saved) : initialEmergencyAlerts;
  });

  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const [timetableChangeAlerts, setTimetableChangeAlerts] = useState<TimetableChangeAlert[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}timetable_change_alerts`);
    return saved ? JSON.parse(saved) : initialTimetableChangeAlerts;
  });

  // Clear personalized cached data upon logout
  useEffect(() => {
    const handleLogoutPurge = () => {
      try {
        localStorage.removeItem('nss_active_student_id');
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) {
            localStorage.removeItem(k);
          }
        }
      } catch {
        // ignore storage cleanup errors
      }
      setSelectedStudentId('');
      setCirculars([]);
      setLeaveRequests([]);
      setCertificateRequests([]);
      setAcademicEvents([]);
      setAcademicResources([]);
      setEmergencyAlerts([]);
      setDismissedAlertIds([]);
      setTimetableChangeAlerts([]);
    };

    window.addEventListener('nss-auth-logout', handleLogoutPurge);
    return () => window.removeEventListener('nss-auth-logout', handleLogoutPurge);
  }, []);

  // Background sync with Supabase when authenticated
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    const fetchRemoteData = async () => {
      try {
        const [circRes, leaveRes, certRes, eventRes, resRes, alertRes] = await Promise.all([
          personalizedModulesService.getCirculars(),
          personalizedModulesService.getLeaveRequests(),
          personalizedModulesService.getCertificateRequests(),
          personalizedModulesService.getAcademicEvents(),
          personalizedModulesService.getAcademicResources(),
          personalizedModulesService.getEmergencyAlerts()
        ]);

        if (isMounted) {
          if (circRes.data && circRes.data.length > 0) {
            setCirculars(circRes.data);
            localStorage.setItem(`${STORAGE_PREFIX}circulars`, JSON.stringify(circRes.data));
          }
          if (leaveRes.data && leaveRes.data.length > 0) {
            setLeaveRequests(leaveRes.data);
            localStorage.setItem(`${STORAGE_PREFIX}leave_requests`, JSON.stringify(leaveRes.data));
          }
          if (certRes.data && certRes.data.length > 0) {
            setCertificateRequests(certRes.data);
            localStorage.setItem(`${STORAGE_PREFIX}certificate_requests`, JSON.stringify(certRes.data));
          }
          if (eventRes.data && eventRes.data.length > 0) {
            setAcademicEvents(eventRes.data);
            localStorage.setItem(`${STORAGE_PREFIX}academic_events`, JSON.stringify(eventRes.data));
          }
          if (resRes.data && resRes.data.length > 0) {
            setAcademicResources(resRes.data);
            localStorage.setItem(`${STORAGE_PREFIX}academic_resources`, JSON.stringify(resRes.data));
          }
          if (alertRes.data && alertRes.data.length > 0) {
            setEmergencyAlerts(alertRes.data);
            localStorage.setItem(`${STORAGE_PREFIX}emergency_alerts`, JSON.stringify(alertRes.data));
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchRemoteData();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // 3. Action Handlers
  const acknowledgeCircular = async (circularId: string) => {
    const studentId = currentStudent?.id || user?.id;
    if (!studentId) return { success: false, error: 'Authenticated user required.' };
    const target = circulars.find(c => c.id === circularId);
    if (!target) return { success: false, error: 'Circular not found' };

    const currentAcks = target.acknowledgedStudentIds || [];
    if (currentAcks.includes(studentId)) return { success: true };

    const updated = circulars.map(c =>
      c.id === circularId
        ? { ...c, acknowledgedStudentIds: [...(c.acknowledgedStudentIds || []), studentId] }
        : c
    );

    setCirculars(updated);
    localStorage.setItem(`${STORAGE_PREFIX}circulars`, JSON.stringify(updated));

    // Async sync to Supabase
    personalizedModulesService.acknowledgeCircular(circularId, studentId, currentAcks);

    return { success: true };
  };

  const issueCircular = async (
    circular: Omit<Circular, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; data?: Circular; error?: string }> => {
    try {
      const res = await personalizedModulesService.createCircular(circular);
      if (!res.data) {
        return { success: false, error: 'Database did not return the created circular.' };
      }

      const updated = [res.data, ...circulars];
      setCirculars(updated);
      localStorage.setItem(`${STORAGE_PREFIX}circulars`, JSON.stringify(updated));

      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to publish circular to database.' };
    }
  };

  const deleteCircular = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await personalizedModulesService.deleteCircular(id);
      const updated = circulars.filter(c => c.id !== id);
      setCirculars(updated);
      localStorage.setItem(`${STORAGE_PREFIX}circulars`, JSON.stringify(updated));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete circular.' };
    }
  };

  const submitLeaveRequest = async (
    req: Omit<StudentLeaveRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    const newRequest: StudentLeaveRequest = {
      ...req,
      id: `leave-${Date.now()}`,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString()
    };

    const updated = [newRequest, ...leaveRequests];
    setLeaveRequests(updated);
    localStorage.setItem(`${STORAGE_PREFIX}leave_requests`, JSON.stringify(updated));

    // Try remote sync
    personalizedModulesService.createLeaveRequest(req);

    return { success: true, data: newRequest };
  };

  const reviewLeaveRequest = async (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    remarks?: string
  ) => {
    const facultyId = currentFaculty?.id || user?.id;
    if (!facultyId) {
      return { success: false, error: 'Authenticated staff identity required.' };
    }
    const facultyName = currentFaculty?.fullName || user?.name || 'Class Tutor';

    const updated = leaveRequests.map(r =>
      r.id === id
        ? {
            ...r,
            status,
            reviewedByFacultyId: facultyId,
            reviewedByName: facultyName,
            reviewRemarks: remarks,
            reviewedAt: new Date().toISOString(),
            appliedToAttendance: status === 'APPROVED'
          }
        : r
    );

    setLeaveRequests(updated);
    localStorage.setItem(`${STORAGE_PREFIX}leave_requests`, JSON.stringify(updated));

    personalizedModulesService.reviewLeaveRequest(id, status, facultyId, facultyName, remarks);

    return { success: true };
  };

  const submitCertificateRequest = async (
    req: Omit<StudentCertificateRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    const newRequest: StudentCertificateRequest = {
      ...req,
      id: `cert-${Date.now()}`,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString()
    };

    const updated = [newRequest, ...certificateRequests];
    setCertificateRequests(updated);
    localStorage.setItem(`${STORAGE_PREFIX}certificate_requests`, JSON.stringify(updated));

    personalizedModulesService.createCertificateRequest(req);

    return { success: true, data: newRequest };
  };

  const updateCertificateRequestStatus = async (
    id: string,
    status: 'SUBMITTED' | 'PROCESSING' | 'READY' | 'COLLECTED' | 'REJECTED',
    remarks?: string
  ) => {
    const staffName = user?.name || 'Administrative Office';
    const readyDate = status === 'READY' ? new Date().toISOString().split('T')[0] : undefined;
    const collectedDate = status === 'COLLECTED' ? new Date().toISOString().split('T')[0] : undefined;

    const updated = certificateRequests.map(r =>
      r.id === id
        ? {
            ...r,
            status,
            processingRemarks: remarks || r.processingRemarks,
            readyDate: readyDate || r.readyDate,
            collectedDate: collectedDate || r.collectedDate,
            handledByName: staffName
          }
        : r
    );

    setCertificateRequests(updated);
    localStorage.setItem(`${STORAGE_PREFIX}certificate_requests`, JSON.stringify(updated));

    return { success: true };
  };

  const addAcademicEvent = async (event: Omit<AcademicCalendarEvent, 'id' | 'createdAt'>) => {
    const newEvent: AcademicCalendarEvent = {
      ...event,
      id: `event-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [...academicEvents, newEvent];
    setAcademicEvents(updated);
    localStorage.setItem(`${STORAGE_PREFIX}academic_events`, JSON.stringify(updated));
    return { success: true };
  };

  const addAcademicResource = async (res: Omit<AcademicResource, 'id' | 'uploadedAt' | 'downloadCount'>) => {
    const newResource: AcademicResource = {
      ...res,
      id: `res-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      downloadCount: 0
    };
    const updated = [newResource, ...academicResources];
    setAcademicResources(updated);
    localStorage.setItem(`${STORAGE_PREFIX}academic_resources`, JSON.stringify(updated));
    return { success: true };
  };

  const addEmergencyAlert = async (alert: Omit<EmergencyAlert, 'id' | 'createdAt' | 'isActive'>) => {
    const newAlert: EmergencyAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    const updated = [newAlert, ...emergencyAlerts];
    setEmergencyAlerts(updated);
    localStorage.setItem(`${STORAGE_PREFIX}emergency_alerts`, JSON.stringify(updated));
    return { success: true };
  };

  const dismissEmergencyAlert = (id: string) => {
    setDismissedAlertIds(prev => [...prev, id]);
  };

  // 4. Filtered Content according to Audience Engine
  const relevantCirculars = useMemo(() => {
    return circulars.filter(c => isItemRelevantToAudience(c, userContext));
  }, [circulars, userContext]);

  const relevantEvents = useMemo(() => {
    return academicEvents.filter(e => isItemRelevantToAudience(e, userContext));
  }, [academicEvents, userContext]);

  const relevantResources = useMemo(() => {
    return academicResources.filter(r => isItemRelevantToAudience(r, userContext));
  }, [academicResources, userContext]);

  const activeEmergencyAlert = useMemo(() => {
    const now = new Date().toISOString();
    const active = emergencyAlerts.find(
      a =>
        a.isActive &&
        !dismissedAlertIds.includes(a.id) &&
        (!a.expiryTime || a.expiryTime >= now) &&
        isItemRelevantToAudience(a, userContext)
    );
    return active || null;
  }, [emergencyAlerts, dismissedAlertIds, userContext]);

  const studentLeaveRequests = useMemo(() => {
    if (!currentStudent) return [];
    return leaveRequests.filter(r => r.studentId === currentStudent.id);
  }, [leaveRequests, currentStudent]);

  const studentCertificateRequests = useMemo(() => {
    if (!currentStudent) return [];
    return certificateRequests.filter(r => r.studentId === currentStudent.id);
  }, [certificateRequests, currentStudent]);

  // 5. Dynamic Timetable Resolver
  const getTodayResolvedTimetable = (overrideDay?: DayOfWeek): ResolvedTimetableSlot[] => {
    // 1. Determine target DayOfWeek
    let dayOfWeek: DayOfWeek = overrideDay || 'MONDAY';
    if (!overrideDay) {
      const dayNum = new Date().getDay();
      const map: Record<number, DayOfWeek> = {
        1: 'MONDAY',
        2: 'TUESDAY',
        3: 'WEDNESDAY',
        4: 'THURSDAY',
        5: 'FRIDAY',
        6: 'SATURDAY',
        0: 'MONDAY' // fallback for Sunday
      };
      dayOfWeek = map[dayNum] || 'MONDAY';
    }

    // Sort periods
    const sortedPeriods = [...timetablePeriods].sort((a, b) => a.periodNumber - b.periodNumber);

    if (activeRole === 'STUDENT') {
      const enrolledGroupIds = new Set(userContext.courseGroupIds);

      return sortedPeriods.map(period => {
        // Find matching timetable entry for student's registered course groups
        const entry = timetableEntries.find(
          e =>
            e.dayOfWeek === dayOfWeek &&
            (e.periodId === period.id ||
              e.periodId === `period-${period.periodNumber}` ||
              e.periodId.endsWith(`${period.periodNumber}`)) &&
            enrolledGroupIds.has(e.courseGroupId) &&
            e.isActive
        );

        if (!entry) {
          return {
            period,
            isCancelled: false,
            isSubstitute: false,
            room: ''
          };
        }

        const offering = courseOfferings.find(o => o.id === entry.courseOfferingId);
        const course = courses.find(c => c.id === offering?.courseId);
        const category = courseCategories.find(cat => cat.id === course?.categoryId);
        const group = courseGroups.find(g => g.id === entry.courseGroupId);
        const facultyMember = faculty.find(f => f.id === entry.facultyId);

        // Check if there is an active session today
        const todayDateStr = new Date().toISOString().split('T')[0];
        const session = classSessions.find(
          s =>
            s.courseGroupId === entry.courseGroupId &&
            (s.periodId === period.id || s.periodId === entry.periodId) &&
            s.date === todayDateStr
        );

        // Check for timetable change alert
        const changeAlert = timetableChangeAlerts.find(
          a =>
            a.courseGroupId === entry.courseGroupId &&
            (a.periodId === period.id || a.periodId === entry.periodId)
        );

        // Check substitute
        const sub = substituteAssignments.find(
          sa =>
            sa.courseGroupId === entry.courseGroupId &&
            sa.date === todayDateStr &&
            sa.status === 'APPROVED'
        );

        const subFaculty = sub ? faculty.find(f => f.id === sub.substituteFacultyId) : undefined;

        return {
          period,
          entry,
          course,
          category,
          group,
          faculty: facultyMember,
          session,
          changeAlert,
          isCancelled: session?.status === 'CANCELLED' || changeAlert?.changeType === 'CANCELLED',
          isSubstitute: !!sub,
          substituteFacultyName: subFaculty?.fullName,
          room: changeAlert?.newRoom || group?.room || entry.room || 'Classroom'
        };
      });
    }

    // If Faculty / Teacher
    const facultyId = currentFaculty?.id;
    return sortedPeriods.map(period => {
      const entry = timetableEntries.find(
        e =>
          e.dayOfWeek === dayOfWeek &&
          (e.periodId === period.id ||
            e.periodId === `period-${period.periodNumber}` ||
            e.periodId.endsWith(`${period.periodNumber}`)) &&
          e.facultyId === facultyId &&
          e.isActive
      );

      if (!entry) {
        return {
          period,
          isCancelled: false,
          isSubstitute: false,
          room: ''
        };
      }

      const offering = courseOfferings.find(o => o.id === entry.courseOfferingId);
      const course = courses.find(c => c.id === offering?.courseId);
      const category = courseCategories.find(cat => cat.id === course?.categoryId);
      const group = courseGroups.find(g => g.id === entry.courseGroupId);

      const todayDateStr = new Date().toISOString().split('T')[0];
      const session = classSessions.find(
        s =>
          s.courseGroupId === entry.courseGroupId &&
          (s.periodId === period.id || s.periodId === entry.periodId) &&
          s.date === todayDateStr
      );

      return {
        period,
        entry,
        course,
        category,
        group,
        faculty: currentFaculty || undefined,
        session,
        isCancelled: session?.status === 'CANCELLED',
        isSubstitute: false,
        room: group?.room || entry.room || 'Classroom'
      };
    });
  };

  // 6. Attendance Intelligence (Policy-Aware: Hour-Wise vs Session-Strict)
  const attendanceIntelligence = useMemo<AttendanceIntelligence | null>(() => {
    if (!currentStudent) return null;

    const summary = getStudentAttendanceSummary(currentStudent.id);
    const minThreshold = settings.minAttendancePercentage || 75;
    const warningThreshold = settings.warningAttendancePercentage || 70;

    const isSessionStrict = summary.policy === 'SESSION_STRICT';
    const C = isSessionStrict ? summary.totalWorkingDays : summary.totalConducted;
    const P = isSessionStrict ? summary.awardedDays : summary.consolidatedTotalAttended;

    const rawOverallPct = summary.totalConducted > 0 ? summary.overallPercentage : 100;
    const overallPct = Number(rawOverallPct.toFixed(1));
    const isShortage = summary.totalConducted > 0 && rawOverallPct < minThreshold;
    const isWarning = summary.totalConducted > 0 && !isShortage && rawOverallPct < warningThreshold;

    // Mathematical forecast calculations (hours for HOUR_WISE, working days/sessions for SESSION_STRICT)
    let classesNeededToMeetMin = 0;
    if (isShortage && minThreshold < 100 && C > 0) {
      if (isSessionStrict) {
        // Each clean half-day adds 0.5 to both awardedDays (P) and totalWorkingDays (C)
        const numerator = minThreshold * C - 100 * P;
        const denominator = 100 - minThreshold;
        const daysNeeded = Math.max(0, numerator / denominator);
        classesNeededToMeetMin = Math.max(0, Math.ceil(daysNeeded / 0.5)); // expressed in clean FN/AN sessions needed
      } else {
        const numerator = minThreshold * C - 100 * P;
        const denominator = 100 - minThreshold;
        classesNeededToMeetMin = Math.max(0, Math.ceil(numerator / denominator));
      }
    }

    let classesCanMissSafely = 0;
    if (!isShortage && minThreshold > 0 && C > 0) {
      if (isSessionStrict) {
        const numerator = 100 * P - minThreshold * C;
        const daysCanLose = Math.max(0, numerator / minThreshold);
        classesCanMissSafely = Math.max(0, Math.floor(daysCanLose / 0.5)); // half-day sessions
      } else {
        const numerator = 100 * P - minThreshold * C;
        classesCanMissSafely = Math.max(0, Math.floor(numerator / minThreshold));
      }
    }

    const shortageCourseCount = summary.courses.filter(c => c.isShortage).length;

    return {
      attendancePolicy: summary.policy,
      policyLabel: summary.policyLabel,
      overallPercentage: overallPct,
      hourWisePercentage: Number((summary.hourWisePercentage ?? overallPct).toFixed(1)),
      regularPercentage: summary.regularPercentage,
      consolidatedPercentage: overallPct,
      totalConducted: summary.totalConducted,
      totalPresent: summary.totalPresent,
      totalDutyLeave: summary.totalDutyLeave,
      totalOd: summary.totalOd,
      totalMedicalLeave: summary.totalMedicalLeave,
      totalAbsent: summary.totalAbsent,
      cancelledCount: summary.cancelledCount,
      specialDutyApprovedCount: summary.specialDutyApprovedCount,
      specialDutyPendingCount: summary.specialDutyPendingCount,
      totalWorkingDays: summary.totalWorkingDays,
      awardedDays: summary.awardedDays,
      halfDaysLost: summary.halfDaysLost,
      halfDayPenalties: summary.halfDayPenalties,
      minThreshold,
      warningThreshold,
      isShortage,
      isWarning,
      classesNeededToMeetMin,
      classesCanMissSafely,
      shortageCourseCount,
      courseSummaries: summary.courses,
      studentSpecialEvents: summary.studentSpecialEvents
    };
  }, [currentStudent, getStudentAttendanceSummary, settings]);

  // 7. Universal College-Wide Search
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const results: SearchResultItem[] = [];

    // Notices / Announcements
    announcements.forEach(a => {
      if (
        a.title.toLowerCase().includes(q) ||
        (a.content && a.content.toLowerCase().includes(q))
      ) {
        results.push({
          id: a.id,
          type: 'NOTICE',
          title: a.title,
          subtitle: a.content ? a.content.slice(0, 100) + '...' : 'Notice',
          category: a.category || 'General',
          date: a.publishDate || a.publishedAt,
          linkTab: 'notices',
          data: a
        });
      }
    });

    // Circulars
    circulars.forEach(c => {
      if (
        c.title.toLowerCase().includes(q) ||
        c.referenceNumber.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      ) {
        results.push({
          id: c.id,
          type: 'CIRCULAR',
          title: `${c.referenceNumber}: ${c.title}`,
          subtitle: c.description.slice(0, 100) + '...',
          category: c.issuingAuthority,
          date: c.effectiveFrom,
          linkTab: 'notices',
          data: c
        });
      }
    });

    // Academic Events
    academicEvents.forEach(e => {
      if (
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.venue && e.venue.toLowerCase().includes(q))
      ) {
        results.push({
          id: e.id,
          type: 'EVENT',
          title: e.title,
          subtitle: `${e.startDate} • Venue: ${e.venue || 'College Campus'}`,
          category: e.eventType.replace('_', ' '),
          date: e.startDate,
          linkTab: 'events',
          data: e
        });
      }
    });

    // Academic Resources
    academicResources.forEach(r => {
      if (
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.courseCode && r.courseCode.toLowerCase().includes(q))
      ) {
        results.push({
          id: r.id,
          type: 'RESOURCE',
          title: r.title,
          subtitle: `${r.fileName} • ${r.fileSize} (${r.fileType})`,
          category: r.category,
          date: r.uploadedAt,
          linkTab: 'resources',
          data: r
        });
      }
    });

    // Courses
    courses.forEach(crs => {
      if (
        crs.courseCode.toLowerCase().includes(q) ||
        crs.courseTitle.toLowerCase().includes(q) ||
        (crs.shortCode && crs.shortCode.toLowerCase().includes(q))
      ) {
        results.push({
          id: crs.id,
          type: 'COURSE',
          title: `${crs.courseCode}: ${crs.courseTitle}`,
          subtitle: `${crs.credits} Credits • ${crs.totalContactHours} Contact Hours`,
          category: 'Course',
          linkTab: 'courses',
          data: crs
        });
      }
    });

    // Departments
    departments.forEach(dept => {
      if (
        dept.name.toLowerCase().includes(q) ||
        dept.code.toLowerCase().includes(q)
      ) {
        results.push({
          id: dept.id,
          type: 'DEPARTMENT',
          title: dept.name,
          subtitle: `Code: ${dept.code} • Established: ${dept.establishedYear || 1961}`,
          category: 'Department',
          linkTab: 'department-hub',
          data: dept
        });
      }
    });

    // Faculty Directory (Restricted to Administrators; hidden from HOD, Teachers, and Students)
    if (activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL') {
      faculty.forEach(fac => {
        if (
          fac.fullName.toLowerCase().includes(q) ||
          (fac.designation && fac.designation.toLowerCase().includes(q)) ||
          (fac.email && fac.email.toLowerCase().includes(q))
        ) {
          const dept = departments.find(d => d.id === fac.departmentId);
          results.push({
            id: fac.id,
            type: 'FACULTY',
            title: fac.fullName,
            subtitle: `${fac.designation} • ${dept?.name || ''}`,
            category: 'Faculty',
            linkTab: 'department-hub',
            data: fac
          });
        }
      });
    }

    return results.slice(0, 15);
  }, [searchQuery, announcements, circulars, academicEvents, academicResources, courses, departments, faculty, activeRole]);

  return (
    <PersonalizedCollegeContext.Provider
      value={{
        userContext,
        currentStudent,
        currentFaculty,
        switchActiveStudent,

        circulars,
        leaveRequests,
        certificateRequests,
        academicEvents,
        academicResources,
        emergencyAlerts,
        timetableChangeAlerts,

        acknowledgeCircular,
        issueCircular,
        deleteCircular,
        submitLeaveRequest,
        reviewLeaveRequest,
        submitCertificateRequest,
        updateCertificateRequestStatus,
        addAcademicEvent,
        addAcademicResource,
        addEmergencyAlert,
        dismissEmergencyAlert,

        activeEmergencyAlert,
        relevantCirculars,
        relevantEvents,
        relevantResources,
        studentLeaveRequests,
        studentCertificateRequests,

        getTodayResolvedTimetable,
        attendanceIntelligence,

        searchQuery,
        setSearchQuery,
        searchResults
      }}
    >
      {children}
    </PersonalizedCollegeContext.Provider>
  );
};

export const usePersonalizedCollege = (): PersonalizedCollegeContextType => {
  const context = useContext(PersonalizedCollegeContext);
  if (!context) {
    throw new Error('usePersonalizedCollege must be used within a PersonalizedCollegeProvider');
  }
  return context;
};
