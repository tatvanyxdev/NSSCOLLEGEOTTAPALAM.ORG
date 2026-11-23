import {
  AttendanceRecord,
  AttendanceStatus,
  ClassSession,
  Course,
  CourseAttendanceSummary,
  CourseCategory,
  CourseGroup,
  CourseOffering,
  DayOfWeek,
  Department,
  DepartmentAttendancePolicy,
  Faculty,
  FacultyCourseAssignment,
  SessionSlot,
  SpecialAttendanceEvent,
  SpecialAttendanceEventType,
  SpecialAttendanceRecord,
  SpecialAttendanceStatus,
  Student,
  StudentCourseRegistration,
  SystemSettings,
  TimetableEntry,
  TimetablePeriod
} from '../types';

export interface HalfDayPenaltyDetail {
  date: string;
  session: SessionSlot;
  conductedPeriods: number;
  absentPeriods: number;
  lostDays: number; // Always 0.5
  coursesAffected: string[];
  absentPeriodLabels: string[];
}

export interface StudentSpecialEventDetail {
  id: string;
  title: string;
  eventType: SpecialAttendanceEventType;
  eventDate: string;
  isFullDay: boolean;
  dutyCertificateRef?: string;
  reason: string;
  status: SpecialAttendanceStatus;
  periodsCount: number;
  forwardedByHodName?: string;
  approvedByName?: string;
  principalRemarks?: string;
}

export interface DualAttendanceSummary {
  policy: DepartmentAttendancePolicy;
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
  consolidatedTotalAttended: number;
  totalWorkingDays: number;
  awardedDays: number;
  halfDaysLost: number;
  halfDayPenalties: HalfDayPenaltyDetail[];
  isShortage: boolean;
  isWarning: boolean;
  courses: CourseAttendanceSummary[];
  studentSpecialEvents: StudentSpecialEventDetail[];
}

export interface DualCalculationInput {
  studentId: string;
  students: Student[];
  departments: Department[];
  settings: SystemSettings;
  courseCategories: CourseCategory[];
  courses: Course[];
  courseOfferings: CourseOffering[];
  courseGroups: CourseGroup[];
  faculty: Faculty[];
  facultyAssignments: FacultyCourseAssignment[];
  studentCourseRegistrations: StudentCourseRegistration[];
  timetablePeriods: TimetablePeriod[];
  timetableEntries: TimetableEntry[];
  classSessions: ClassSession[];
  attendanceRecords: AttendanceRecord[];
  specialAttendanceEvents: SpecialAttendanceEvent[];
  specialAttendanceRecords: SpecialAttendanceRecord[];
}

export function getPolicyBadgeLabel(policy: DepartmentAttendancePolicy): string {
  return policy === 'SESSION_STRICT' ? 'Policy: Session Half-Day Rule' : 'Policy: Hour-Wise';
}

export function inferPeriodSession(period?: TimetablePeriod, fallbackPeriodId?: string): SessionSlot {
  if (period?.session === 'FN' || period?.session === 'AN') {
    return period.session;
  }
  if (period && typeof period.periodNumber === 'number' && period.periodNumber > 0) {
    return period.periodNumber <= 3 ? 'FN' : 'AN';
  }
  if (fallbackPeriodId) {
    const match = String(fallbackPeriodId).match(/(\d+)/);
    if (match) {
      const n = Number(match[1]);
      if (n >= 4) return 'AN';
      if (n >= 1) return 'FN';
    }
  }
  return 'FN';
}

export function getSlotStatusRank(status: AttendanceStatus, enableOdAutomation: boolean): number {
  switch (status) {
    case 'PRESENT':
    case 'APPROVED_LEAVE':
      return 4;
    case 'SPECIAL':
    case 'DUTY_LEAVE':
    case 'OD':
      return 3;
    case 'MEDICAL_LEAVE':
      return enableOdAutomation ? 3 : 2;
    case 'ABSENT':
      return 1;
    case 'CANCELLED':
    default:
      return 0;
  }
}

export function deduplicateClassSessions(sessions: ClassSession[]): ClassSession[] {
  const activeSlotMap = new Map<string, ClassSession>();
  const cancelledSlotMap = new Map<string, ClassSession>();
  const withoutPeriod: ClassSession[] = [];

  sessions.forEach(sess => {
    if (!sess.periodId) {
      withoutPeriod.push(sess);
      return;
    }
    const slotKey = `${sess.courseGroupId}__${sess.date}__${sess.periodId}`;
    if (sess.status === 'CANCELLED') {
      if (!cancelledSlotMap.has(slotKey)) {
        cancelledSlotMap.set(slotKey, sess);
      }
      return;
    }

    const existing = activeSlotMap.get(slotKey);
    if (!existing) {
      activeSlotMap.set(slotKey, sess);
      return;
    }

    const existingSubmitted = Boolean(existing.attendanceSubmitted);
    const currentSubmitted = Boolean(sess.attendanceSubmitted);
    if (currentSubmitted && !existingSubmitted) {
      activeSlotMap.set(slotKey, sess);
    } else if (currentSubmitted === existingSubmitted) {
      const tExisting = existing.submittedTimestamp ? Date.parse(existing.submittedTimestamp) : 0;
      const tCurrent = sess.submittedTimestamp ? Date.parse(sess.submittedTimestamp) : 0;
      if (tCurrent >= tExisting) {
        activeSlotMap.set(slotKey, sess);
      }
    }
  });

  const merged: ClassSession[] = [...withoutPeriod, ...activeSlotMap.values()];
  cancelledSlotMap.forEach((cancelledSess, slotKey) => {
    if (!activeSlotMap.has(slotKey)) {
      merged.push(cancelledSess);
    }
  });
  return merged;
}

export function isAttendedStatus(status: AttendanceStatus, countMedicalAsAttended: boolean): boolean {
  if (
    status === 'PRESENT' ||
    status === 'DUTY_LEAVE' ||
    status === 'OD' ||
    status === 'SPECIAL' ||
    status === 'APPROVED_LEAVE'
  ) {
    return true;
  }
  if (status === 'MEDICAL_LEAVE' && countMedicalAsAttended) {
    return true;
  }
  return false;
}

interface SessionSlotObservation {
  key: string; // `${date}__${periodId}`
  date: string;
  sessionSlot: SessionSlot;
  status: AttendanceStatus;
  courseCode: string;
  periodLabel: string;
}

export function calculateStudentDualAttendance(input: DualCalculationInput): DualAttendanceSummary {
  const {
    studentId,
    students,
    departments,
    settings,
    courseCategories,
    courses,
    courseOfferings,
    courseGroups,
    faculty,
    facultyAssignments,
    studentCourseRegistrations,
    timetablePeriods,
    timetableEntries,
    classSessions,
    attendanceRecords,
    specialAttendanceEvents,
    specialAttendanceRecords
  } = input;

  const targetStudent = students.find(s => s.id === studentId);
  const homeDept = targetStudent ? departments.find(d => d.id === targetStudent.homeDepartmentId) : undefined;
  const policy: DepartmentAttendancePolicy =
    homeDept?.attendancePolicy === 'SESSION_STRICT' ? 'SESSION_STRICT' : 'HOUR_WISE';
  const policyLabel = getPolicyBadgeLabel(policy);

  const enableOdAutomation = Boolean(settings?.enableOdAutomation);
  const minAttPct = Number(settings?.minAttendancePercentage ?? 75);
  const warnAttPct = Number(settings?.warningAttendancePercentage ?? 70);

  const uniqueClassSessions = deduplicateClassSessions(classSessions);
  const periodMap = new Map<string, TimetablePeriod>(timetablePeriods.map(p => [p.id, p]));
  const rawRegistrations = studentCourseRegistrations.filter(r => r.studentId === studentId);
  const seenGroupIds = new Set<string>();
  const studentRegistrations = rawRegistrations.filter(r => {
    if (seenGroupIds.has(r.courseGroupId)) return false;
    seenGroupIds.add(r.courseGroupId);
    return true;
  });
  const studentSpecialRecords = specialAttendanceRecords.filter(s => s.studentId === studentId);

  const approvedEventIds = new Set(
    specialAttendanceEvents
      .filter(e => e.status === 'APPROVED' || e.status === 'APPLIED')
      .map(e => e.id)
  );
  const pendingEventIds = new Set(
    specialAttendanceEvents
      .filter(e => e.status === 'PENDING_PRINCIPAL' || e.status === 'FORWARDED_TO_PRINCIPAL')
      .map(e => e.id)
  );

  let totalConducted = 0;
  let totalRegularPresent = 0;
  let totalSpecialDutyApproved = 0;
  let totalSpecialDutyPending = 0;
  let totalOd = 0;
  let totalDutyLeaveOnly = 0;
  let totalMedicalLeave = 0;
  let totalAbsent = 0;
  let totalCancelled = 0;

  // Deduplicated period-slot observations for FN/AN session-strict calculation
  const slotObservations = new Map<string, SessionSlotObservation>();

  studentSpecialRecords.forEach(sr => {
    if (pendingEventIds.has(sr.eventId)) {
      totalSpecialDutyPending++;
    }
  });

  const dayNames: DayOfWeek[] = [
    'SUNDAY' as DayOfWeek,
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY'
  ];

  const coursesSummary: CourseAttendanceSummary[] = studentRegistrations.map(reg => {
    const offering = courseOfferings.find(o => o.id === reg.courseOfferingId);
    const course = courses.find(c => c.id === offering?.courseId);
    const category = courseCategories.find(
      cat => cat.id === reg.courseCategoryId || cat.id === course?.categoryId
    );
    const group = courseGroups.find(g => g.id === reg.courseGroupId);
    const facultyAssign =
      facultyAssignments.find(
        fa => fa.courseGroupId === reg.courseGroupId && (fa.assignmentRole === 'PRIMARY' || fa.role === 'PRIMARY')
      ) || facultyAssignments.find(fa => fa.courseGroupId === reg.courseGroupId);
    const assignedFaculty = faculty.find(f => f.id === facultyAssign?.facultyId);

    const sessions = uniqueClassSessions.filter(
      s => s.courseGroupId === reg.courseGroupId && s.attendanceSubmitted && s.status !== 'CANCELLED'
    );

    let courseConducted = 0;
    let courseRegularPresent = 0;
    let courseDutyLeave = 0;
    let courseOd = 0;
    let courseSpecialDutyPresent = 0;
    let courseML = 0;
    let courseAbsent = 0;
    let courseCancelled = 0;

    sessions.forEach(sess => {
      const att = attendanceRecords.find(
        a => a.classSessionId === sess.id && a.studentId === studentId
      );
      const specialRec = studentSpecialRecords.find(
        s => s.date === sess.date && s.periodId === sess.periodId && approvedEventIds.has(s.eventId)
      );

      const periodObj = periodMap.get(sess.periodId);
      const isBreakPeriod = Boolean(periodObj?.isBreak || periodObj?.periodNumber === 0);
      if (isBreakPeriod) {
        return;
      }

      const sessionSlot = inferPeriodSession(periodObj, sess.periodId);
      const periodLabel = periodObj?.label || `Period ${periodObj?.periodNumber || ''}`.trim();

      // Atomic status resolution without altering raw records
      let resolvedStatus: AttendanceStatus;
      if (att?.status === 'CANCELLED') {
        // Excluded from conducted hours & working-day calculations
        courseCancelled++;
        totalCancelled++;
        return;
      }

      if (specialRec) {
        if (att && att.status === 'PRESENT') {
          resolvedStatus = 'PRESENT';
          courseConducted++;
          courseRegularPresent++;
        } else if (att && (att.status === 'OD' || att.status === 'DUTY_LEAVE')) {
          resolvedStatus = att.status;
          courseConducted++;
          if (att.status === 'DUTY_LEAVE') courseDutyLeave++;
          else courseOd++;
        } else {
          resolvedStatus = 'SPECIAL';
          courseConducted++;
          courseSpecialDutyPresent++;
        }
      } else if (att) {
        resolvedStatus = att.status;
        courseConducted++;
        if (att.status === 'PRESENT' || att.status === 'APPROVED_LEAVE') {
          courseRegularPresent++;
        } else if (att.status === 'DUTY_LEAVE') {
          courseDutyLeave++;
        } else if (att.status === 'OD') {
          courseOd++;
        } else if (att.status === 'SPECIAL') {
          courseSpecialDutyPresent++;
        } else if (att.status === 'MEDICAL_LEAVE') {
          courseML++;
        } else {
          courseAbsent++;
        }
      } else {
        resolvedStatus = 'ABSENT';
        courseConducted++;
        courseAbsent++;
      }

      {
        const obsKey = `${sess.date}__${sess.periodId || sess.id}`;
        const existingObs = slotObservations.get(obsKey);
        if (
          !existingObs ||
          getSlotStatusRank(resolvedStatus, enableOdAutomation) >
            getSlotStatusRank(existingObs.status, enableOdAutomation)
        ) {
          slotObservations.set(obsKey, {
            key: obsKey,
            date: sess.date,
            sessionSlot,
            status: resolvedStatus,
            courseCode: course?.courseCode || 'COURSE',
            periodLabel
          });
        }
      }
    });

    // Approved special attendance where no normal class session ran
    const groupTimetable = timetableEntries.filter(te => te.courseGroupId === reg.courseGroupId);
    studentSpecialRecords
      .filter(sr => approvedEventIds.has(sr.eventId))
      .forEach(sr => {
        const srDateClean = String(sr.date || '').slice(0, 10);
        const alreadyCountedInSession = sessions.some(
          s => s.date === srDateClean && s.periodId === sr.periodId
        );
        if (!alreadyCountedInSession && srDateClean) {
          const eventDateObj = new Date(`${srDateClean}T00:00:00Z`);
          const eventDayName = dayNames[eventDateObj.getUTCDay()];
          const isScheduledForThisGroup = groupTimetable.some(
            te => (te.dayOfWeek || te.weekday) === eventDayName && te.periodId === sr.periodId
          );

          if (isScheduledForThisGroup) {
            const periodObj = periodMap.get(sr.periodId);
            const isBreakPeriod = Boolean(periodObj?.isBreak || periodObj?.periodNumber === 0);
            if (isBreakPeriod) return;

            courseConducted++;
            courseSpecialDutyPresent++;

            {
              const sessionSlot = inferPeriodSession(periodObj, sr.periodId);
              const obsKey = `${srDateClean}__${sr.periodId}`;
              const existingObs = slotObservations.get(obsKey);
              if (
                !existingObs ||
                getSlotStatusRank('SPECIAL', enableOdAutomation) >
                  getSlotStatusRank(existingObs.status, enableOdAutomation)
              ) {
                slotObservations.set(obsKey, {
                  key: obsKey,
                  date: srDateClean,
                  sessionSlot,
                  status: 'SPECIAL',
                  courseCode: course?.courseCode || 'COURSE',
                  periodLabel: periodObj?.label || 'Period'
                });
              }
            }
          }
        }
      });

    // Subject-wise percentage is ALWAYS Hour-Wise regardless of department policy
    const combinedCourseDutyLeave = courseDutyLeave + courseOd;
    const regularAttended =
      courseRegularPresent +
      combinedCourseDutyLeave +
      (enableOdAutomation ? courseML : 0);
    const regularPct =
      courseConducted > 0 ? Number(((regularAttended / courseConducted) * 100).toFixed(2)) : 100;

    const effectiveAttended =
      courseRegularPresent +
      combinedCourseDutyLeave +
      courseSpecialDutyPresent +
      (enableOdAutomation ? courseML : 0);
    const percentage =
      courseConducted > 0 ? Number(((effectiveAttended / courseConducted) * 100).toFixed(2)) : 100;

    const isShortage = percentage < minAttPct;
    const isWarning = percentage < warnAttPct && !isShortage;

    const targetRatio = minAttPct / 100;
    let classesNeededForMin = 0;
    let classesCanMiss = 0;
    if (courseConducted > 0) {
      if (percentage < minAttPct && targetRatio < 1) {
        classesNeededForMin = Math.max(
          0,
          Math.ceil((targetRatio * courseConducted - effectiveAttended) / (1 - targetRatio))
        );
      } else if (percentage >= minAttPct && targetRatio > 0) {
        classesCanMiss = Math.max(
          0,
          Math.floor(effectiveAttended / targetRatio - courseConducted)
        );
      }
    }

    totalConducted += courseConducted;
    totalRegularPresent += courseRegularPresent;
    totalDutyLeaveOnly += courseDutyLeave;
    totalOd += courseOd;
    totalSpecialDutyApproved += courseSpecialDutyPresent;
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
      conductedCount: courseConducted,
      presentCount: courseRegularPresent + courseSpecialDutyPresent,
      dutyLeaveCount: combinedCourseDutyLeave,
      odCount: combinedCourseDutyLeave,
      medicalLeaveCount: courseML,
      absentCount: courseAbsent,
      cancelledCount: courseCancelled,
      percentage,
      regularPercentage: regularPct,
      consolidatedPercentage: percentage,
      specialDutyCount: courseSpecialDutyPresent,
      isShortage,
      isWarning,
      classesNeededForMin,
      classesCanMiss
    };
  });

  // 1. Hour-Wise Overall Calculation (ignoring CANCELLED periods)

  const totalDutyLeave = totalDutyLeaveOnly + totalOd + totalSpecialDutyApproved;
  const totalEffectiveAttended =
    totalRegularPresent +
    totalDutyLeave +
    (enableOdAutomation ? totalMedicalLeave : 0);
  const hourWisePercentage =
    totalConducted > 0 ? Number(((totalEffectiveAttended / totalConducted) * 100).toFixed(2)) : 100;

  const regularAttendedAll =
    totalRegularPresent +
    totalDutyLeaveOnly +
    totalOd +
    (enableOdAutomation ? totalMedicalLeave : 0);
  const regularPercentage =
    totalConducted > 0 ? Number(((regularAttendedAll / totalConducted) * 100).toFixed(2)) : 100;

  // 2. Session-Strict Half-Day Penalty Calculation (grouped by date + FN/AN)
  const sessionBuckets = new Map<
    string,
    {
      date: string;
      session: SessionSlot;
      observations: SessionSlotObservation[];
    }
  >();

  slotObservations.forEach(obs => {
    const bucketKey = `${obs.date}__${obs.sessionSlot}`;
    const existing = sessionBuckets.get(bucketKey);
    if (existing) {
      existing.observations.push(obs);
    } else {
      sessionBuckets.set(bucketKey, {
        date: obs.date,
        session: obs.sessionSlot,
        observations: [obs]
      });
    }
  });

  let totalWorkingDays = 0;
  let awardedDays = 0;
  let halfDaysLost = 0;
  const halfDayPenalties: HalfDayPenaltyDetail[] = [];

  sessionBuckets.forEach(bucket => {
    if (bucket.observations.length === 0) return;
    totalWorkingDays += 0.5;

    // If even ONE conducted period in the session is ABSENT (or unexcused ML when OD automation disabled)
    const absentObs = bucket.observations.filter(o => {
      if (o.status === 'ABSENT') return true;
      if (o.status === 'MEDICAL_LEAVE' && !enableOdAutomation) return true;
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

  const sessionStrictPercentage =
    totalWorkingDays > 0 ? Number(((awardedDays / totalWorkingDays) * 100).toFixed(2)) : 100;

  const overallPercentage =
    policy === 'SESSION_STRICT' ? sessionStrictPercentage : hourWisePercentage;

  // Collect student's special attendance events with details
  const studentEventsMap = new Map<string, { event: SpecialAttendanceEvent; count: number }>();
  studentSpecialRecords.forEach(sr => {
    const ev = specialAttendanceEvents.find(e => e.id === sr.eventId);
    if (ev) {
      if (!studentEventsMap.has(ev.id)) {
        studentEventsMap.set(ev.id, { event: ev, count: 1 });
      } else {
        studentEventsMap.get(ev.id)!.count++;
      }
    }
  });

  const studentSpecialEvents: StudentSpecialEventDetail[] = Array.from(studentEventsMap.values()).map(
    ({ event, count }) => ({
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      eventDate: event.eventDate,
      isFullDay: event.isFullDay,
      dutyCertificateRef: event.dutyCertificateRef,
      reason: event.reason,
      status: event.status,
      periodsCount: count,
      forwardedByHodName: event.forwardedByHodName || undefined,
      approvedByName: event.approvedByName || undefined,
      principalRemarks: event.principalRemarks || undefined
    })
  );

  return {
    policy,
    policyLabel,
    overallPercentage,
    hourWisePercentage,
    regularPercentage,
    consolidatedPercentage: overallPercentage,
    totalConducted,
    totalPresent: totalRegularPresent,
    totalDutyLeave,
    totalOd: totalDutyLeaveOnly + totalOd,
    totalMedicalLeave,
    totalAbsent,
    cancelledCount: totalCancelled,
    specialDutyApprovedCount: totalSpecialDutyApproved,
    specialDutyPendingCount: totalSpecialDutyPending,
    consolidatedTotalAttended: totalEffectiveAttended,
    totalWorkingDays: Number(totalWorkingDays.toFixed(1)),
    awardedDays: Number(awardedDays.toFixed(1)),
    halfDaysLost,
    halfDayPenalties,
    isShortage: totalConducted > 0 && overallPercentage < minAttPct,
    isWarning:
      totalConducted > 0 &&
      overallPercentage < warnAttPct &&
      overallPercentage >= minAttPct,
    courses: coursesSummary,
    studentSpecialEvents
  };
}
