import {
  AttendanceRecord,
  AttendanceStatus,
  ClassSession,
  Course,
  CourseCategory,
  CourseGroup,
  CourseOffering,
  DayOfWeek,
  Department,
  DepartmentAttendancePolicy,
  Faculty,
  FacultyCourseAssignment,
  Programme,
  SessionSlot,
  SpecialAttendanceEvent,
  SpecialAttendanceRecord,
  Student,
  StudentCourseRegistration,
  SystemSettings,
  TimetableEntry,
  TimetablePeriod
} from '../types';
import {
  deduplicateClassSessions,
  getPolicyBadgeLabel,
  getSlotStatusRank,
  HalfDayPenaltyDetail,
  inferPeriodSession
} from './dualAttendanceEngine';

export type ReportPeriodMode = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTER' | 'CUSTOM';

export interface ResolvedDateWindow {
  mode: ReportPeriodMode;
  startDate: string; // YYYY-MM-DD or '' for full semester
  endDate: string;   // YYYY-MM-DD or '' for full semester
  label: string;
}

export interface ScopedCourseAttendanceRow {
  courseGroupId: string;
  courseCode: string;
  courseTitle: string;
  categoryName: string;
  groupName: string;
  semesterNumber: number;
  facultyName: string;
  conducted: number;
  present: number;
  od: number;
  specialDuty: number;
  medicalLeave: number;
  absent: number;
  effectiveAttended: number;
  percentage: number;
}

export interface ScopedStudentAttendanceRow {
  student: Student;
  dept?: Department;
  prog?: Programme;
  policy: DepartmentAttendancePolicy;
  policyLabel: string;
  conducted: number;
  present: number;
  od: number;
  specialDuty: number;
  medicalLeave: number;
  absent: number;
  cancelled: number;
  effectiveAttended: number;
  hourWisePercentage: number;
  percentage: number;
  totalWorkingDays: number;
  awardedDays: number;
  halfDaysLost: number;
  halfDayPenalties: HalfDayPenaltyDetail[];
  status: 'ELIGIBLE' | 'WARNING' | 'SHORTAGE' | 'NO_SESSIONS';
  courses: ScopedCourseAttendanceRow[];
}

export interface ScopedClassAttendanceRow {
  courseGroupId: string;
  courseOfferingId: string;
  courseCode: string;
  courseTitle: string;
  categoryName: string;
  groupName: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  semesterNumber: number;
  facultyName: string;
  enrolledCount: number;
  sessionsConducted: number;
  avgPercentage: number;
  shortageCount: number;
  warningCount: number;
}

export interface ScopedSessionRow {
  session: ClassSession;
  date: string;
  periodNumber: number;
  periodLabel: string;
  courseCode: string;
  courseTitle: string;
  groupName: string;
  departmentCode: string;
  departmentName: string;
  semesterNumber: number;
  facultyName: string;
  employeeCode: string;
  presentCount: number;
  odCount: number;
  medicalCount: number;
  absentCount: number;
  totalMarked: number;
}

export interface ScopedSessionStudentMark {
  sessionId: string;
  date: string;
  periodLabel: string;
  departmentCode: string;
  departmentName: string;
  programmeName: string;
  semesterNumber: number;
  courseCode: string;
  courseTitle: string;
  groupName: string;
  facultyName: string;
  rollNumber: string;
  admissionNumber: string;
  universityRegNo: string;
  studentName: string;
  status: string;
  topicCovered: string;
  remarks: string;
}

export interface RegisterMatrixColumn {
  key: string;       // session.id or date string
  date: string;      // YYYY-MM-DD
  label: string;     // Short display header e.g. "23 Nov P1"
  subLabel: string;  // e.g. "CS101"
}

export interface RegisterMatrixRow {
  student: Student;
  deptCode: string;
  progName: string;
  cells: Record<string, string>; // key -> 'P' | 'A' | 'OD' | 'ML' | 'SP' | '-'
  conducted: number;
  attended: number;
  percentage: number;
  status: 'ELIGIBLE' | 'WARNING' | 'SHORTAGE' | 'NO_SESSIONS';
}

export interface AggregatedAttendanceReport {
  dateWindow: ResolvedDateWindow;
  scopedStudents: ScopedStudentAttendanceRow[];
  scopedClasses: ScopedClassAttendanceRow[];
  scopedSessions: ScopedSessionRow[];
  registerEntries: ScopedSessionStudentMark[];
  matrixColumns: RegisterMatrixColumn[];
  matrixRows: RegisterMatrixRow[];
  kpis: {
    totalStudents: number;
    sessionsConducted: number;
    averagePercentage: number;
    eligibleCount: number;
    warningCount: number;
    shortageCount: number;
  };
}

export function formatLocalDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shiftIsoDate(dateStr: string, deltaDays: number): string {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  base.setDate(base.getDate() + deltaDays);
  return formatLocalDateISO(base);
}

export function shiftMonthIso(monthStr: string, deltaMonths: number): string {
  const [yStr, mStr] = (monthStr || formatLocalDateISO(new Date()).slice(0, 7)).split('-');
  const y = Number(yStr) || new Date().getFullYear();
  const m = (Number(mStr) || 1) - 1;
  const d = new Date(y, m + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatPrettyDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T00:00:00`);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function resolveDateWindow(
  mode: ReportPeriodMode,
  anchorDate: string,
  monthStr: string,
  customStart: string,
  customEnd: string,
  semesterNumber: number | 'ALL'
): ResolvedDateWindow {
  const safeAnchor = anchorDate || formatLocalDateISO(new Date());

  if (mode === 'DAILY') {
    return {
      mode,
      startDate: safeAnchor,
      endDate: safeAnchor,
      label: `Daily · ${formatPrettyDate(safeAnchor)}`
    };
  }

  if (mode === 'WEEKLY') {
    const d = new Date(`${safeAnchor}T00:00:00`);
    const day = d.getDay(); // 0=Sun .. 6=Sat
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const startDate = formatLocalDateISO(mon);
    const endDate = formatLocalDateISO(sun);
    return {
      mode,
      startDate,
      endDate,
      label: `Weekly · ${formatPrettyDate(startDate)} – ${formatPrettyDate(endDate)}`
    };
  }

  if (mode === 'MONTHLY') {
    const safeMonth = monthStr || safeAnchor.slice(0, 7);
    const [yStr, mStr] = safeMonth.split('-');
    const y = Number(yStr) || new Date().getFullYear();
    const m = Number(mStr) || 1;
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    const startDate = formatLocalDateISO(first);
    const endDate = formatLocalDateISO(last);
    const monthLabel = first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return {
      mode,
      startDate,
      endDate,
      label: `Monthly · ${monthLabel}`
    };
  }

  if (mode === 'CUSTOM') {
    const s = customStart || safeAnchor;
    const e = customEnd || s;
    const [startDate, endDate] = s <= e ? [s, e] : [e, s];
    return {
      mode,
      startDate,
      endDate,
      label: `Custom · ${formatPrettyDate(startDate)} – ${formatPrettyDate(endDate)}`
    };
  }

  // SEMESTER
  const semTag = semesterNumber === 'ALL' ? 'All Semesters' : `Semester ${semesterNumber}`;
  return {
    mode: 'SEMESTER',
    startDate: '',
    endDate: '',
    label: `Full Semester · ${semTag}`
  };
}

function isDateInWindow(dateStr: string, startDate: string, endDate: string): boolean {
  if (!startDate && !endDate) return true;
  if (!dateStr) return false;
  const clean = dateStr.slice(0, 10);
  if (startDate && clean < startDate) return false;
  if (endDate && clean > endDate) return false;
  return true;
}

function shortStatusCode(status?: string): string {
  switch (status) {
    case 'PRESENT':
    case 'APPROVED_LEAVE':
      return 'P';
    case 'ABSENT':
      return 'A';
    case 'DUTY_LEAVE':
      return 'DL';
    case 'OD':
      return 'OD';
    case 'MEDICAL_LEAVE':
      return 'ML';
    case 'SPECIAL':
      return 'SP';
    case 'CANCELLED':
      return 'CX';
    default:
      return '-';
  }
}

export interface ComputeReportInput {
  mode: ReportPeriodMode;
  anchorDate: string;
  monthStr: string;
  customStart: string;
  customEnd: string;
  departmentId: string;
  programmeId: string;
  semesterNumber: number | 'ALL';
  courseGroupId: string;
  searchQuery: string;
  statusFilter: 'ALL' | 'SHORTAGE' | 'WARNING' | 'ELIGIBLE';
  facultyScopeId?: string;
  settings: SystemSettings;
  departments: Department[];
  programmes: Programme[];
  courses: Course[];
  courseCategories: CourseCategory[];
  courseOfferings: CourseOffering[];
  courseGroups: CourseGroup[];
  faculty: Faculty[];
  facultyAssignments: FacultyCourseAssignment[];
  students: Student[];
  studentCourseRegistrations: StudentCourseRegistration[];
  timetablePeriods: TimetablePeriod[];
  timetableEntries: TimetableEntry[];
  classSessions: ClassSession[];
  attendanceRecords: AttendanceRecord[];
  specialAttendanceEvents: SpecialAttendanceEvent[];
  specialAttendanceRecords: SpecialAttendanceRecord[];
}

export function buildAggregatedAttendanceReport(input: ComputeReportInput): AggregatedAttendanceReport {
  const {
    mode,
    anchorDate,
    monthStr,
    customStart,
    customEnd,
    departmentId,
    programmeId,
    semesterNumber,
    courseGroupId,
    searchQuery,
    statusFilter,
    facultyScopeId,
    settings,
    departments,
    programmes,
    courses,
    courseCategories,
    courseOfferings,
    courseGroups,
    faculty,
    facultyAssignments,
    students,
    studentCourseRegistrations,
    timetablePeriods,
    timetableEntries,
    classSessions,
    attendanceRecords,
    specialAttendanceEvents,
    specialAttendanceRecords
  } = input;

  const dateWindow = resolveDateWindow(mode, anchorDate, monthStr, customStart, customEnd, semesterNumber);

  // Fast lookup maps
  const deptMap = new Map(departments.map(d => [d.id, d]));
  const progMap = new Map(programmes.map(p => [p.id, p]));
  const courseMap = new Map(courses.map(c => [c.id, c]));
  const catMap = new Map(courseCategories.map(c => [c.id, c]));
  const offeringMap = new Map(courseOfferings.map(o => [o.id, o]));
  const groupMap = new Map(courseGroups.map(g => [g.id, g]));
  const facultyMap = new Map(faculty.map(f => [f.id, f]));
  const periodMap = new Map(timetablePeriods.map(p => [p.id, p]));
  const studentMap = new Map(students.map(s => [s.id, s]));

  const approvedEventIds = new Set(
    specialAttendanceEvents
      .filter(e => e.status === 'APPROVED' || e.status === 'APPLIED')
      .map(e => e.id)
  );

  // Identify course groups belonging to faculty scope (if TEACHER role)
  const teacherAllowedGroupIds = facultyScopeId
    ? new Set(
        facultyAssignments
          .filter(fa => fa.facultyId === facultyScopeId)
          .map(fa => fa.courseGroupId)
      )
    : null;

  const uniqueClassSessions = deduplicateClassSessions(classSessions);

  // Helper: determine if a course group matches academic filters
  const doesGroupMatchScope = (groupId: string): boolean => {
    if (courseGroupId !== 'ALL' && groupId !== courseGroupId) return false;
    const grp = groupMap.get(groupId);
    const off = grp ? offeringMap.get(grp.courseOfferingId) : undefined;
    const crs = off ? courseMap.get(off.courseId) : undefined;
    const effDept = off?.departmentId || crs?.departmentId;
    const effSem = off?.semesterNumber;

    if (departmentId !== 'ALL' && effDept && effDept !== departmentId) return false;
    if (semesterNumber !== 'ALL' && effSem && effSem !== semesterNumber) return false;

    if (teacherAllowedGroupIds) {
      const teachesSession = uniqueClassSessions.some(
        s =>
          s.courseGroupId === groupId &&
          (s.facultyId === facultyScopeId || s.substituteFacultyId === facultyScopeId)
      );
      if (!teacherAllowedGroupIds.has(groupId) && !teachesSession) return false;
    }
    return true;
  };

  // 1. Scope sessions in dateWindow + academic scope
  const matchingSessions = uniqueClassSessions
    .filter(s => {
      if (s.status === 'CANCELLED') return false;
      const pObj = periodMap.get(s.periodId);
      if (pObj?.isBreak || pObj?.periodNumber === 0) return false;
      if (!s.attendanceSubmitted && s.status !== 'CONDUCTED' && s.status !== 'COMPLETED') return false;
      if (!isDateInWindow(s.date, dateWindow.startDate, dateWindow.endDate)) return false;

      if (facultyScopeId && s.facultyId !== facultyScopeId && s.substituteFacultyId !== facultyScopeId) {
        if (!teacherAllowedGroupIds?.has(s.courseGroupId)) return false;
      }

      if (courseGroupId !== 'ALL' && s.courseGroupId !== courseGroupId) return false;

      const off = offeringMap.get(s.courseOfferingId);
      const crs = off ? courseMap.get(off.courseId) : undefined;
      const effDept = off?.departmentId || crs?.departmentId;
      const effSem = off?.semesterNumber;

      if (departmentId !== 'ALL' && effDept && effDept !== departmentId) return false;
      if (semesterNumber !== 'ALL' && effSem && effSem !== semesterNumber) return false;

      // If programmeId is filtered, ensure at least one registered/participating student or department matches
      if (programmeId !== 'ALL') {
        const prog = progMap.get(programmeId);
        const hasRegisteredFromProg = studentCourseRegistrations.some(reg => {
          if (reg.courseGroupId !== s.courseGroupId) return false;
          const stu = studentMap.get(reg.studentId);
          return stu?.programmeId === programmeId;
        });
        if (!hasRegisteredFromProg && prog?.departmentId && effDept && prog.departmentId !== effDept) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      const pa = periodMap.get(a.periodId)?.periodNumber ?? 99;
      const pb = periodMap.get(b.periodId)?.periodNumber ?? 99;
      return pa - pb;
    });

  // Index attendance records by sessionId -> studentId -> AttendanceRecord
  const recordsBySessionAndStudent = new Map<string, Map<string, AttendanceRecord>>();
  const recordsBySession = new Map<string, AttendanceRecord[]>();
  attendanceRecords.forEach(rec => {
    let smap = recordsBySessionAndStudent.get(rec.classSessionId);
    if (!smap) {
      smap = new Map();
      recordsBySessionAndStudent.set(rec.classSessionId, smap);
    }
    smap.set(rec.studentId, rec);

    const arr = recordsBySession.get(rec.classSessionId) || [];
    arr.push(rec);
    recordsBySession.set(rec.classSessionId, arr);
  });

  // 2. Scope students
  const q = searchQuery.trim().toLowerCase();
  const baseScopedStudents = students.filter(s => {
    if (departmentId !== 'ALL' && s.homeDepartmentId !== departmentId) return false;
    if (programmeId !== 'ALL' && s.programmeId !== programmeId) return false;
    if (semesterNumber !== 'ALL' && Number(s.currentSemester) !== Number(semesterNumber)) return false;

    if (courseGroupId !== 'ALL') {
      const isReg = studentCourseRegistrations.some(
        r => r.studentId === s.id && r.courseGroupId === courseGroupId
      );
      if (!isReg) return false;
    }

    if (facultyScopeId) {
      const registeredGroupIds = studentCourseRegistrations
        .filter(r => r.studentId === s.id)
        .map(r => r.courseGroupId);
      const teachesStudent = registeredGroupIds.some(gid => teacherAllowedGroupIds?.has(gid));
      const markedInSessions = matchingSessions.some(sess =>
        recordsBySessionAndStudent.get(sess.id)?.has(s.id)
      );
      if (!teachesStudent && !markedInSessions) return false;
    }

    if (q) {
      const haystack = `${s.fullName} ${s.rollNumber} ${s.admissionNumber} ${s.universityRegisterNumber || ''} ${s.email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  // Sort students naturally by rollNumber / name
  const sortedStudents = [...baseScopedStudents].sort((a, b) => {
    const ra = Number(a.rollNumber);
    const rb = Number(b.rollNumber);
    if (!isNaN(ra) && !isNaN(rb) && ra !== rb) return ra - rb;
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  // Group sessions by courseGroupId for fast lookup
  const sessionsByGroup = new Map<string, ClassSession[]>();
  matchingSessions.forEach(sess => {
    const arr = sessionsByGroup.get(sess.courseGroupId) || [];
    arr.push(sess);
    sessionsByGroup.set(sess.courseGroupId, arr);
  });

  // 3. Build Scoped Student Attendance Summaries (Policy-Aware: Hour-Wise vs Session-Strict)
  const allStudentSummaries: ScopedStudentAttendanceRow[] = sortedStudents.map(stu => {
    const dept = deptMap.get(stu.homeDepartmentId);
    const prog = progMap.get(stu.programmeId);
    const policy: DepartmentAttendancePolicy =
      dept?.attendancePolicy === 'SESSION_STRICT' ? 'SESSION_STRICT' : 'HOUR_WISE';
    const policyLabel = getPolicyBadgeLabel(policy);

    const stuRegs = studentCourseRegistrations.filter(
      r => r.studentId === stu.id && doesGroupMatchScope(r.courseGroupId)
    );
    const stuSpecial = specialAttendanceRecords.filter(
      sr => sr.studentId === stu.id && isDateInWindow(sr.date, dateWindow.startDate, dateWindow.endDate)
    );

    let totalConducted = 0;
    let totalPresent = 0;
    let totalOd = 0;
    let totalSpecialDuty = 0;
    let totalML = 0;
    let totalAbsent = 0;
    let totalCancelled = 0;

    const slotObservations = new Map<
      string,
      {
        date: string;
        sessionSlot: SessionSlot;
        status: AttendanceStatus;
        courseCode: string;
        periodLabel: string;
      }
    >();

    const courseRows: ScopedCourseAttendanceRow[] = [];

    // Include registered groups + any session where student was explicitly marked
    const regGroupIds = new Set(stuRegs.map(r => r.courseGroupId));
    matchingSessions.forEach(sess => {
      if (!regGroupIds.has(sess.courseGroupId) && recordsBySessionAndStudent.get(sess.id)?.has(stu.id)) {
        regGroupIds.add(sess.courseGroupId);
      }
    });

    regGroupIds.forEach(gid => {
      const grp = groupMap.get(gid);
      const off = grp ? offeringMap.get(grp.courseOfferingId) : undefined;
      const crs = off ? courseMap.get(off.courseId) : undefined;
      const cat = catMap.get(crs?.categoryId || '');
      const fa = facultyAssignments.find(a => a.courseGroupId === gid && (a.assignmentRole === 'PRIMARY' || a.role === 'PRIMARY')) ||
                 facultyAssignments.find(a => a.courseGroupId === gid);
      const fac = fa ? facultyMap.get(fa.facultyId) : undefined;

      const grpSessions = sessionsByGroup.get(gid) || [];
      let cConducted = 0;
      let cPresent = 0;
      let cOd = 0;
      let cSpecial = 0;
      let cML = 0;
      let cAbsent = 0;
      let cCancelled = 0;

      grpSessions.forEach(sess => {
        const att = recordsBySessionAndStudent.get(sess.id)?.get(stu.id);
        const specialRec = stuSpecial.find(
          sr => sr.date === sess.date && sr.periodId === sess.periodId && approvedEventIds.has(sr.eventId)
        );
        const periodObj = periodMap.get(sess.periodId);
        const isBreakPeriod = Boolean(periodObj?.isBreak || periodObj?.periodNumber === 0);
        if (isBreakPeriod) {
          return;
        }
        const sessionSlot = inferPeriodSession(periodObj, sess.periodId);
        const periodLabel = periodObj?.label || `Period ${periodObj?.periodNumber || ''}`.trim();

        if (att?.status === 'CANCELLED') {
          cCancelled++;
          return;
        }

        let resolvedStatus: AttendanceStatus;
        cConducted++;

        if (specialRec) {
          if (att && att.status === 'PRESENT') {
            cPresent++;
            resolvedStatus = 'PRESENT';
          } else if (att && (att.status === 'OD' || att.status === 'DUTY_LEAVE')) {
            cOd++;
            resolvedStatus = att.status;
          } else {
            cSpecial++;
            resolvedStatus = 'SPECIAL';
          }
        } else if (att) {
          resolvedStatus = att.status;
          if (att.status === 'PRESENT' || att.status === 'APPROVED_LEAVE') cPresent++;
          else if (att.status === 'OD' || att.status === 'DUTY_LEAVE') cOd++;
          else if (att.status === 'MEDICAL_LEAVE') cML++;
          else if (att.status === 'SPECIAL') cSpecial++;
          else cAbsent++;
        } else {
          cAbsent++;
          resolvedStatus = 'ABSENT';
        }

        {
          const obsKey = `${sess.date}__${sess.periodId || sess.id}`;
          const existingObs = slotObservations.get(obsKey);
          if (
            !existingObs ||
            getSlotStatusRank(resolvedStatus, Boolean(settings.enableOdAutomation)) >
              getSlotStatusRank(existingObs.status, Boolean(settings.enableOdAutomation))
          ) {
            slotObservations.set(obsKey, {
              date: sess.date,
              sessionSlot,
              status: resolvedStatus,
              courseCode: crs?.courseCode || 'COURSE',
              periodLabel
            });
          }
        }
      });

      // Approved special attendance on scheduled periods where no normal session ran
      const grpTimetable = timetableEntries.filter(te => te.courseGroupId === gid);
      stuSpecial
        .filter(sr => approvedEventIds.has(sr.eventId))
        .forEach(sr => {
          const srDateClean = String(sr.date || '').slice(0, 10);
          const alreadyInSession = grpSessions.some(s => s.date === srDateClean && s.periodId === sr.periodId);
          if (!alreadyInSession && srDateClean) {
            const d = new Date(`${srDateClean}T00:00:00Z`);
            const dayNames: DayOfWeek[] = [
              'SUNDAY' as DayOfWeek,
              'MONDAY',
              'TUESDAY',
              'WEDNESDAY',
              'THURSDAY',
              'FRIDAY',
              'SATURDAY'
            ];
            const evDay = dayNames[d.getUTCDay()];
            const isScheduled = grpTimetable.some(
              te => (te.dayOfWeek || te.weekday) === evDay && te.periodId === sr.periodId
            );
            if (isScheduled) {
              const periodObj = periodMap.get(sr.periodId);
              const isBreakPeriod = Boolean(periodObj?.isBreak || periodObj?.periodNumber === 0);
              if (isBreakPeriod) return;

              cConducted++;
              cSpecial++;
              {
                const obsKey = `${srDateClean}__${sr.periodId}`;
                const existingObs = slotObservations.get(obsKey);
                if (
                  !existingObs ||
                  getSlotStatusRank('SPECIAL', Boolean(settings.enableOdAutomation)) >
                    getSlotStatusRank(existingObs.status, Boolean(settings.enableOdAutomation))
                ) {
                  slotObservations.set(obsKey, {
                    date: srDateClean,
                    sessionSlot: inferPeriodSession(periodObj, sr.periodId),
                    status: 'SPECIAL',
                    courseCode: crs?.courseCode || 'COURSE',
                    periodLabel: periodObj?.label || 'Period'
                  });
                }
              }
            }
          }
        });

      // Subject-wise percentage is ALWAYS Hour-Wise regardless of department policy
      const cEffectiveAttended =
        cPresent + cOd + cSpecial + (settings.enableOdAutomation ? cML : 0);
      const cPct = cConducted > 0 ? Number(((cEffectiveAttended / cConducted) * 100).toFixed(1)) : 100;

      totalConducted += cConducted;
      totalPresent += cPresent;
      totalOd += cOd;
      totalSpecialDuty += cSpecial;
      totalML += cML;
      totalAbsent += cAbsent;
      totalCancelled += cCancelled;

      courseRows.push({
        courseGroupId: gid,
        courseCode: crs?.courseCode || 'COURSE',
        courseTitle: crs?.courseTitle || grp?.groupName || 'Course',
        categoryName: cat?.name || cat?.code || 'Core',
        groupName: grp?.groupName || 'Main Batch',
        semesterNumber: off?.semesterNumber || stu.currentSemester || 1,
        facultyName: fac?.fullName || 'Assigned Faculty',
        conducted: cConducted,
        present: cPresent,
        od: cOd,
        specialDuty: cSpecial,
        medicalLeave: cML,
        absent: cAbsent,
        effectiveAttended: cEffectiveAttended,
        percentage: cPct
      });
    });

    const effectiveAttended =
      totalPresent + totalOd + totalSpecialDuty + (settings.enableOdAutomation ? totalML : 0);
    const hourWisePct = totalConducted > 0 ? Number(((effectiveAttended / totalConducted) * 100).toFixed(1)) : 0;

    // Session-Strict FN/AN half-day calculation
    const sessionBuckets = new Map<
      string,
      {
        date: string;
        session: SessionSlot;
        observations: Array<{
          date: string;
          sessionSlot: SessionSlot;
          status: AttendanceStatus;
          courseCode: string;
          periodLabel: string;
        }>;
      }
    >();

    slotObservations.forEach(obs => {
      const bucketKey = `${obs.date}__${obs.sessionSlot}`;
      const existing = sessionBuckets.get(bucketKey);
      if (existing) existing.observations.push(obs);
      else sessionBuckets.set(bucketKey, { date: obs.date, session: obs.sessionSlot, observations: [obs] });
    });

    let totalWorkingDays = 0;
    let awardedDays = 0;
    let halfDaysLost = 0;
    const halfDayPenalties: HalfDayPenaltyDetail[] = [];

    sessionBuckets.forEach(bucket => {
      if (bucket.observations.length === 0) return;
      totalWorkingDays += 0.5;
      const absentObs = bucket.observations.filter(o => {
        if (o.status === 'ABSENT') return true;
        if (o.status === 'MEDICAL_LEAVE' && !settings.enableOdAutomation) return true;
        return false;
      });
      if (absentObs.length === 0) {
        awardedDays += 0.5;
      } else {
        halfDaysLost += 1;
        halfDayPenalties.push({
          date: bucket.date,
          session: bucket.session,
          conductedPeriods: bucket.observations.length,
          absentPeriods: absentObs.length,
          lostDays: 0.5,
          coursesAffected: Array.from(new Set(absentObs.map(o => o.courseCode))),
          absentPeriodLabels: Array.from(new Set(absentObs.map(o => o.periodLabel)))
        });
      }
    });

    halfDayPenalties.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.session.localeCompare(b.session);
    });

    const sessionStrictPct =
      totalWorkingDays > 0 ? Number(((awardedDays / totalWorkingDays) * 100).toFixed(1)) : 0;

    const pct = totalConducted > 0
      ? (policy === 'SESSION_STRICT' ? sessionStrictPct : hourWisePct)
      : 0;

    let status: ScopedStudentAttendanceRow['status'] = 'NO_SESSIONS';
    if (totalConducted > 0) {
      if (pct < settings.minAttendancePercentage) status = 'SHORTAGE';
      else if (pct < settings.warningAttendancePercentage) status = 'WARNING';
      else status = 'ELIGIBLE';
    }

    return {
      student: stu,
      dept,
      prog,
      policy,
      policyLabel,
      conducted: totalConducted,
      present: totalPresent,
      od: totalOd,
      specialDuty: totalSpecialDuty,
      medicalLeave: totalML,
      absent: totalAbsent,
      cancelled: totalCancelled,
      effectiveAttended,
      hourWisePercentage: hourWisePct,
      percentage: pct,
      totalWorkingDays: Number(totalWorkingDays.toFixed(1)),
      awardedDays: Number(awardedDays.toFixed(1)),
      halfDaysLost,
      halfDayPenalties,
      status,
      courses: courseRows
    };
  });

  const scopedStudents = allStudentSummaries.filter(row => {
    if (statusFilter === 'ALL') return true;
    return row.status === statusFilter;
  });

  // 4. Build Scoped Class / Subject Summary
  const scopedClassGroupIds = new Set<string>();
  courseGroups.forEach(g => {
    if (doesGroupMatchScope(g.id)) {
      const hasSession = (sessionsByGroup.get(g.id)?.length || 0) > 0;
      const hasStudents = allStudentSummaries.some(st =>
        st.courses.some(c => c.courseGroupId === g.id)
      );
      if (hasSession || hasStudents) {
        scopedClassGroupIds.add(g.id);
      }
    }
  });

  const scopedClasses: ScopedClassAttendanceRow[] = Array.from(scopedClassGroupIds)
    .map(gid => {
      const grp = groupMap.get(gid);
      const off = grp ? offeringMap.get(grp.courseOfferingId) : undefined;
      const crs = off ? courseMap.get(off.courseId) : undefined;
      const cat = catMap.get(crs?.categoryId || '');
      const effDeptId = off?.departmentId || crs?.departmentId || '';
      const dept = deptMap.get(effDeptId);
      const fa =
        facultyAssignments.find(a => a.courseGroupId === gid && (a.assignmentRole === 'PRIMARY' || a.role === 'PRIMARY')) ||
        facultyAssignments.find(a => a.courseGroupId === gid);
      const fac = fa ? facultyMap.get(fa.facultyId) : undefined;

      const grpSessions = sessionsByGroup.get(gid) || [];
      const enrolledStudents = allStudentSummaries.filter(st =>
        st.courses.some(c => c.courseGroupId === gid)
      );

      let pctSum = 0;
      let pctCount = 0;
      let shortageCount = 0;
      let warningCount = 0;

      enrolledStudents.forEach(st => {
        const cRow = st.courses.find(c => c.courseGroupId === gid);
        if (cRow && cRow.conducted > 0) {
          pctSum += cRow.percentage;
          pctCount++;
          if (cRow.percentage < settings.minAttendancePercentage) shortageCount++;
          else if (cRow.percentage < settings.warningAttendancePercentage) warningCount++;
        }
      });

      return {
        courseGroupId: gid,
        courseOfferingId: off?.id || '',
        courseCode: crs?.courseCode || 'CORE',
        courseTitle: crs?.courseTitle || grp?.groupName || 'Course',
        categoryName: cat?.name || cat?.code || 'Core',
        groupName: grp?.groupName || 'Main Batch',
        departmentId: effDeptId,
        departmentCode: dept?.code || 'DEPT',
        departmentName: dept?.name || 'Department',
        semesterNumber: off?.semesterNumber || 1,
        facultyName: fac?.fullName || 'Assigned Faculty',
        enrolledCount: enrolledStudents.length,
        sessionsConducted: grpSessions.length,
        avgPercentage: pctCount > 0 ? Number((pctSum / pctCount).toFixed(1)) : 0,
        shortageCount,
        warningCount
      };
    })
    .sort((a, b) => a.courseCode.localeCompare(b.courseCode));

  // 5. Build Scoped Session Rows & Detailed Register Entries
  const scopedStudentIdSet = new Set(scopedStudents.map(s => s.student.id));
  const registerEntries: ScopedSessionStudentMark[] = [];

  const scopedSessions: ScopedSessionRow[] = matchingSessions.map(sess => {
    const off = offeringMap.get(sess.courseOfferingId);
    const crs = off ? courseMap.get(off.courseId) : undefined;
    const grp = groupMap.get(sess.courseGroupId);
    const effDept = deptMap.get(off?.departmentId || crs?.departmentId || '');
    const fac = facultyMap.get(sess.substituteFacultyId || sess.facultyId);
    const period = periodMap.get(sess.periodId);

    const recs = recordsBySession.get(sess.id) || [];
    let presentCount = 0;
    let odCount = 0;
    let medicalCount = 0;
    let absentCount = 0;

    recs.forEach(rec => {
      if (rec.status === 'CANCELLED') {
        // Excluded from present/absent counts
      } else if (rec.status === 'PRESENT' || rec.status === 'APPROVED_LEAVE') presentCount++;
      else if (rec.status === 'OD' || rec.status === 'DUTY_LEAVE' || rec.status === 'SPECIAL') odCount++;
      else if (rec.status === 'MEDICAL_LEAVE') medicalCount++;
      else absentCount++;

      const stu = studentMap.get(rec.studentId);
      if (stu && (scopedStudentIdSet.size === 0 || scopedStudentIdSet.has(stu.id))) {
        const sDept = deptMap.get(stu.homeDepartmentId);
        const sProg = progMap.get(stu.programmeId);
        registerEntries.push({
          sessionId: sess.id,
          date: sess.date,
          periodLabel: period ? `${period.label} (${period.startTime}-${period.endTime})` : `${sess.startTime}-${sess.endTime}`,
          departmentCode: sDept?.code || effDept?.code || 'DEPT',
          departmentName: sDept?.name || effDept?.name || 'Department',
          programmeName: sProg?.name || 'Programme',
          semesterNumber: off?.semesterNumber || stu.currentSemester || 1,
          courseCode: crs?.courseCode || 'CORE',
          courseTitle: crs?.courseTitle || 'Course',
          groupName: grp?.groupName || 'Main Batch',
          facultyName: fac?.fullName || 'Assigned Faculty',
          rollNumber: stu.rollNumber,
          admissionNumber: stu.admissionNumber,
          universityRegNo: stu.universityRegisterNumber || 'Pending',
          studentName: stu.fullName,
          status: rec.status,
          topicCovered: sess.topicCovered || 'Regular Lecture',
          remarks: rec.remarks || ''
        });
      }
    });

    return {
      session: sess,
      date: sess.date,
      periodNumber: period?.periodNumber ?? 0,
      periodLabel: period ? `${period.label} (${period.startTime}–${period.endTime})` : `${sess.startTime}–${sess.endTime}`,
      courseCode: crs?.courseCode || 'CORE',
      courseTitle: crs?.courseTitle || 'Course',
      groupName: grp?.groupName || 'Main Batch',
      departmentCode: effDept?.code || 'DEPT',
      departmentName: effDept?.name || 'Department',
      semesterNumber: off?.semesterNumber || 1,
      facultyName: fac?.fullName || 'Assigned Faculty',
      employeeCode: fac?.employeeCode || fac?.employeeId || '',
      presentCount,
      odCount,
      medicalCount,
      absentCount,
      totalMarked: recs.length
    };
  });

  // 6. Build Date/Period Register Matrix (Chronological ascending columns, capped cleanly for UI/Sheets)
  const sessionsChronological = [...matchingSessions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const pa = periodMap.get(a.periodId)?.periodNumber ?? 99;
    const pb = periodMap.get(b.periodId)?.periodNumber ?? 99;
    return pa - pb;
  });

  const matrixSessions = sessionsChronological.slice(-45);
  const matrixColumns: RegisterMatrixColumn[] = matrixSessions.map(sess => {
    const off = offeringMap.get(sess.courseOfferingId);
    const crs = off ? courseMap.get(off.courseId) : undefined;
    const period = periodMap.get(sess.periodId);
    const dObj = new Date(`${sess.date}T00:00:00`);
    const shortDate = isNaN(dObj.getTime())
      ? sess.date
      : dObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const pShort = period ? `P${period.periodNumber}` : '';
    return {
      key: sess.id,
      date: sess.date,
      label: `${shortDate}${pShort ? ` ${pShort}` : ''}`,
      subLabel: crs?.courseCode || 'CLS'
    };
  });

  const matrixRows: RegisterMatrixRow[] = scopedStudents.map(stSummary => {
    const cells: Record<string, string> = {};
    const stuSpecial = specialAttendanceRecords.filter(sr => sr.studentId === stSummary.student.id);

    matrixSessions.forEach(sess => {
      const att = recordsBySessionAndStudent.get(sess.id)?.get(stSummary.student.id);
      const sp = stuSpecial.find(
        sr => sr.date === sess.date && sr.periodId === sess.periodId && approvedEventIds.has(sr.eventId)
      );
      if (sp) {
        cells[sess.id] = att?.status === 'PRESENT' ? 'P' : att?.status === 'OD' ? 'OD' : att?.status === 'DUTY_LEAVE' ? 'DL' : 'SP';
      } else if (att) {
        cells[sess.id] = shortStatusCode(att.status);
      } else {
        // Only default registered missing student to 'A' if the session actually has student attendance marks
        const sessionHasRecords = (recordsBySession.get(sess.id)?.length || 0) > 0;
        const isReg = studentCourseRegistrations.some(
          r => r.studentId === stSummary.student.id && r.courseGroupId === sess.courseGroupId
        );
        cells[sess.id] = isReg && sessionHasRecords ? 'A' : '-';
      }
    });

    return {
      student: stSummary.student,
      deptCode: stSummary.dept?.code || 'DEPT',
      progName: stSummary.prog?.code || stSummary.prog?.name || '',
      cells,
      conducted: stSummary.conducted,
      attended: stSummary.effectiveAttended,
      percentage: stSummary.percentage,
      status: stSummary.status
    };
  });

  // 7. KPI Summary
  const activeStudentsWithSessions = scopedStudents.filter(s => s.conducted > 0);
  const avgPct =
    activeStudentsWithSessions.length > 0
      ? Number(
          (
            activeStudentsWithSessions.reduce((acc, s) => acc + s.percentage, 0) /
            activeStudentsWithSessions.length
          ).toFixed(1)
        )
      : 0;

  return {
    dateWindow,
    scopedStudents,
    scopedClasses,
    scopedSessions,
    registerEntries,
    matrixColumns,
    matrixRows,
    kpis: {
      totalStudents: scopedStudents.length,
      sessionsConducted: scopedSessions.length,
      averagePercentage: avgPct,
      eligibleCount: scopedStudents.filter(s => s.status === 'ELIGIBLE').length,
      warningCount: scopedStudents.filter(s => s.status === 'WARNING').length,
      shortageCount: scopedStudents.filter(s => s.status === 'SHORTAGE').length
    }
  };
}
