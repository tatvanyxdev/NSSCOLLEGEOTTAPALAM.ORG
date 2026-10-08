import React, { useState, useMemo } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { ClassSession, AttendanceCorrectionRequest } from '../../types';
import { TakeAttendanceModal } from '../attendance/TakeAttendanceModal';
import { AttendanceCorrectionModal } from '../attendance/AttendanceCorrectionModal';
import { SubstituteTeacherModal } from '../attendance/SubstituteTeacherModal';
import { Badge, Modal } from '../common/UIComponents';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  UserCheck,
  Award,
  Download,
  RefreshCw,
  CalendarX,
  Check,
  X,
  GraduationCap,
  ShieldCheck,
  CheckSquare,
  Square
} from 'lucide-react';

export const AttendanceHubView: React.FC = () => {
  const {
    classSessions,
    courseOfferings,
    courses,
    courseCategories,
    courseGroups,
    departments,
    programmes,
    timetablePeriods,
    faculty,
    students,
    studentCourseRegistrations,
    attendanceRecords,
    getCourseGroupRegisteredStudents,
    specialAttendanceEvents,
    dailyScheduleOverrides,
    getDailyScheduledClasses,
    getOrCreateSessionForTimetableEntry,
    cancelScheduledClass,
    classTutorAssignments,
    getClassTutorCohort,
    correctionRequests,
    reviewCorrectionBatch,
    getStudentAttendanceSummary,
    exportAttendanceReportToCsv
  } = useCollegeData();

  const { user, activeRole } = useAuth();
  const isStudent = activeRole === 'STUDENT';
  const isHOD = activeRole === 'HOD';
  const isPrincipal = activeRole === 'PRINCIPAL' || activeRole === 'SUPER_ADMIN';

  // Identify current faculty / student
  const currentFaculty = faculty.find(f => f.id === user?.id || f.email === user?.email);
  const currentStudent =
    user?.studentProfile ||
    students.find(
      s =>
        s.id === user?.id ||
        (s.username && user?.name && s.username.toLowerCase() === user.name.toLowerCase()) ||
        (s.universityRegisterNumber && user?.name && s.universityRegisterNumber.toLowerCase() === user.name.toLowerCase()) ||
        (user?.email && s.email.toLowerCase() === user.email.toLowerCase())
    );

  const hodDeptId = isHOD ? (user?.departmentId || currentFaculty?.departmentId) : undefined;
  const tutorCohort = getClassTutorCohort(user?.id);
  const isClassTutor = activeRole === 'CLASS_TUTOR' || !!tutorCohort;

  // View state & navigation tabs
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'SESSIONS' | 'CORRECTIONS' | 'TUTOR_COHORT'>(() => {
    if (activeRole === 'CLASS_TUTOR') return 'TUTOR_COHORT';
    if (isStudent) return 'SESSIONS';
    return 'SCHEDULE';
  });

  const todayDateStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [filterDepartment, setFilterDepartment] = useState<string>(hodDeptId || 'ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONDUCTED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tutorShortageFilter, setTutorShortageFilter] = useState<'ALL' | 'SHORTAGE' | 'CRITICAL' | 'ELIGIBLE'>('ALL');

  // Modal states
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [correctionSession, setCorrectionSession] = useState<ClassSession | null>(null);
  const [isSubstituteOpen, setIsSubstituteOpen] = useState(false);
  const [loadingSessionKey, setLoadingSessionKey] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelModalItem, setCancelModalItem] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Correction Review modal state for HOD
  const [reviewingRequest, setReviewingRequest] = useState<AttendanceCorrectionRequest | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isProcessingReview, setIsProcessingReview] = useState(false);

  // Selected corrections for bulk review
  const [selectedCorrectionIds, setSelectedCorrectionIds] = useState<string[]>([]);

  // Permissions
  const canAssignSubstitute = can(activeRole, 'attendance', 'assign_substitute');
  const canMarkAttendance = can(activeRole, 'attendance', 'mark_assigned') || can(activeRole, 'attendance', 'mark_all') || isHOD || isPrincipal;
  const canRequestCorrection = can(activeRole, 'attendance', 'request_correction');
  const canReviewCorrection = isHOD || isPrincipal || can(activeRole, 'attendance', 'approve_correction');

  // Daily Scheduled Classes resolved dynamically from timetable with overrides
  const scheduledClassesForDate = useMemo(() => {
    const targetDept = hodDeptId || (filterDepartment !== 'ALL' ? filterDepartment : undefined);
    const targetFac = activeRole === 'TEACHER' ? user?.id : undefined;
    return getDailyScheduledClasses(selectedDate, targetFac, targetDept);
  }, [selectedDate, hodDeptId, filterDepartment, activeRole, user?.id, getDailyScheduledClasses]);

  const scheduledPendingCount = scheduledClassesForDate.filter(c => c.isPending).length;
  const scheduledConductedCount = scheduledClassesForDate.filter(c => c.isConducted).length;
  const scheduledSubstitutesCount = scheduledClassesForDate.filter(c => c.isSubstitute).length;

  // Filter historical class sessions
  const filteredSessions = useMemo(() => {
    return classSessions.filter(session => {
      const offering = courseOfferings.find(o => o.id === session.courseOfferingId);
      const course = courses.find(c => c.id === offering?.courseId);
      const assignedFac = faculty.find(f => f.id === session.facultyId);

      // Teacher scoping
      if (activeRole === 'TEACHER' && user?.id) {
        if (session.facultyId !== user.id && session.substituteFacultyId !== user.id) {
          return false;
        }
      }

      // HOD scoping
      if (isHOD && hodDeptId) {
        if (offering?.departmentId !== hodDeptId) {
          return false;
        }
      }

      // Student scoping
      if (isStudent) {
        if (!currentStudent) return false;
        const isRegistered = studentCourseRegistrations.some(
          r => r.studentId === currentStudent.id && r.courseGroupId === session.courseGroupId
        );
        if (!isRegistered) return false;
      }

      const effectiveDeptFilter = hodDeptId || filterDepartment;
      const matchesDept = effectiveDeptFilter === 'ALL' || offering?.departmentId === effectiveDeptFilter;
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'CONDUCTED' && session.attendanceSubmitted) ||
        (filterStatus === 'PENDING' && !session.attendanceSubmitted);

      const matchesSearch =
        course?.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course?.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignedFac?.fullName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDept && matchesStatus && matchesSearch;
    });
  }, [
    classSessions,
    courseOfferings,
    courses,
    faculty,
    activeRole,
    user?.id,
    isHOD,
    hodDeptId,
    isStudent,
    currentStudent,
    studentCourseRegistrations,
    filterDepartment,
    filterStatus,
    searchQuery
  ]);

  // Filter pending corrections for HOD review
  const departmentCorrectionRequests = useMemo(() => {
    return correctionRequests.filter(req => {
      const sess = classSessions.find(s => s.id === req.classSessionId);
      const offering = courseOfferings.find(o => o.id === sess?.courseOfferingId);
      if (isHOD && hodDeptId) {
        return offering?.departmentId === hodDeptId;
      }
      return true;
    });
  }, [correctionRequests, classSessions, courseOfferings, isHOD, hodDeptId]);

  const pendingCorrectionRequests = departmentCorrectionRequests.filter(r => r.status === 'PENDING');

  // Handle lazy loading session creation on-demand
  const handleOpenAttendanceForScheduledClass = async (item: any) => {
    try {
      if (item.session) {
        setActiveSession(item.session);
        return;
      }
      if (item.timetableEntry) {
        setLoadingSessionKey(item.timetableEntry.id);
        const sess = await getOrCreateSessionForTimetableEntry(item.timetableEntry.id, selectedDate);
        setActiveSession(sess);
      }
    } catch (err: any) {
      console.error('Failed to open attendance session:', err);
    } finally {
      setLoadingSessionKey(null);
    }
  };

  // Confirm class cancellation
  const handleConfirmCancelClass = async () => {
    if (!cancelModalItem || !cancelReason.trim()) return;
    setIsCancelling(true);
    setCancelError(null);
    const res = await cancelScheduledClass(cancelModalItem.timetableEntry.id, selectedDate, cancelReason.trim(), user?.id);
    setIsCancelling(false);
    if (!res.success) {
      setCancelError(res.error || 'Failed to cancel scheduled class.');
      return;
    }
    setCancelModalItem(null);
    setCancelReason('');
  };

  // HOD single request review
  const handleReviewSingleRequest = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewingRequest) return;
    setIsProcessingReview(true);
    await reviewCorrectionBatch(reviewingRequest.id, status, reviewRemarks || undefined, user?.id);
    setIsProcessingReview(false);
    setReviewingRequest(null);
    setReviewRemarks('');
  };

  // HOD batch review
  const handleBulkReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (selectedCorrectionIds.length === 0) return;
    setIsProcessingReview(true);
    for (const reqId of selectedCorrectionIds) {
      await reviewCorrectionBatch(reqId, status, `Bulk ${status.toLowerCase()} by HOD`, user?.id);
    }
    setIsProcessingReview(false);
    setSelectedCorrectionIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {isStudent
                ? 'Attendance'
                : isClassTutor && activeTab === 'TUTOR_COHORT'
                ? 'Tutor Cohort'
                : 'Attendance'}
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
              {isStudent
                ? 'Student View'
                : isHOD
                ? `HOD (${departments.find(d => d.id === hodDeptId)?.code || 'Dept'})`
                : isClassTutor && activeTab === 'TUTOR_COHORT'
                ? `Tutor (${tutorCohort?.programme?.shortName || tutorCohort?.programme?.title || 'Cohort'})`
                : 'Classes'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Quick Date Selector */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500 ml-1.5 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:outline-none pr-1"
              />
            </div>
            {selectedDate !== todayDateStr && (
              <button
                onClick={() => setSelectedDate(todayDateStr)}
                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100 transition-colors shrink-0"
              >
                Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canAssignSubstitute && (
              <button
                onClick={() => setIsSubstituteOpen(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <UserCheck className="w-4 h-4" /> <span>Substitute</span>
              </button>
            )}

            {!isStudent && (
              <button
                onClick={() => exportAttendanceReportToCsv(hodDeptId || undefined)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs transition-all"
              >
                <Download className="w-4 h-4" /> <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Horizontally scrollable on mobile */}
      {!isStudent && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'SCHEDULE'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {isHOD ? "Schedule" : "Scheduled Classes"}
            </span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'SCHEDULE' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {scheduledClassesForDate.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SESSIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'SESSIONS'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Sessions</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'SESSIONS' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredSessions.length}
            </span>
          </button>

          {canReviewCorrection && (
            <button
              onClick={() => setActiveTab('CORRECTIONS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'CORRECTIONS'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileEdit className="w-4 h-4" />
              <span>Correction Requests</span>
              {pendingCorrectionRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {pendingCorrectionRequests.length}
                </span>
              )}
            </button>
          )}

          {isClassTutor && (
            <button
              onClick={() => setActiveTab('TUTOR_COHORT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'TUTOR_COHORT'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>My Cohort Register</span>
              {tutorCohort?.cohortStudents && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'TUTOR_COHORT' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tutorCohort.cohortStudents.length}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Special Attendance Concession Banner if applicable */}
      {specialAttendanceEvents.some(
        e => e.eventDate === selectedDate && (e.status === 'APPLIED' || e.status === 'APPROVED')
      ) && (
        <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              <strong>Special Institutional Attendance Active on {selectedDate}:</strong>{' '}
              {specialAttendanceEvents
                .filter(e => e.eventDate === selectedDate && (e.status === 'APPLIED' || e.status === 'APPROVED'))
                .map(e => `${e.title} (${e.eventType})`)
                .join(' • ')}
              . Students with verified concessions will automatically receive duty attendance credits.
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SCHEDULED CLASSES FOR SELECTED DATE (TIMETABLE-DRIVEN LAZY ENGINE) */}
      {/* ========================================================================= */}
      {activeTab === 'SCHEDULE' && !isStudent && (
        <div className="space-y-4">
          {/* Quick Metrics & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Scheduled Classes</p>
                <p className="text-xl font-black text-slate-900 mt-1">{scheduledClassesForDate.length}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">For {selectedDate}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Pending Marking</p>
                <p className="text-xl font-black text-rose-600 mt-1">{scheduledPendingCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Requires submission</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Conducted & Saved</p>
                <p className="text-xl font-black text-emerald-600 mt-1">{scheduledConductedCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Attendance recorded</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Substitutes Active</p>
                <p className="text-xl font-black text-purple-600 mt-1">{scheduledSubstitutesCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Faculty covering periods</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Scheduled Period List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                {isHOD ? "Department Schedule" : "Classes"}
              </h3>
              <div className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {scheduledClassesForDate.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No scheduled classes for this date.
                </div>
              ) : (
                scheduledClassesForDate.map((item, idx) => {
                  const isLoadingThis = loadingSessionKey === item.timetableEntry?.id;

                  return (
                    <div
                      key={item.timetableEntry?.id || item.session?.id || idx}
                      className="p-3.5 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center font-mono text-blue-900 shrink-0">
                          <span className="text-[9px] font-bold uppercase">{item.period?.label?.split(' ')[0] || 'Period'}</span>
                          <span className="text-xs sm:text-sm font-black">{item.period?.label?.split(' ')[1] || item.period?.periodNumber || (idx + 1)}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {item.category && (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                                style={{ backgroundColor: item.category.colorHex || '#2563eb' }}
                              >
                                {item.category.name}
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-900">{item.course?.courseCode}</span>
                            <span className="text-xs text-slate-500 font-medium truncate">
                              • {item.courseGroup?.groupName} ({item.room || item.courseGroup?.room || 'LH-101'})
                            </span>

                            {item.isSubstitute && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                Substitute: {item.faculty?.fullName}
                              </span>
                            )}

                            {item.isExtra && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Extra Class
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 break-words">{item.course?.courseTitle}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                            <span>Timing: {item.period?.startTime || '09:30'} - {item.period?.endTime || '10:30'}</span>
                            <span className="hidden sm:inline text-slate-400">•</span>
                            <span>Faculty: <strong className="text-slate-700">{item.faculty?.fullName || 'Assigned Staff'}</strong></span>
                            {item.isCancelled ? (
                              <span className="text-rose-600 font-bold">
                                • Reason: {item.override?.reason || 'Cancelled'}
                              </span>
                            ) : item.session?.topicCovered ? (
                              <span className="text-slate-700 font-medium">• Topic: {item.session.topicCovered}</span>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2.5 w-full md:w-auto pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {item.isCancelled ? (
                          <Badge variant="neutral" size="md">
                            Cancelled
                          </Badge>
                        ) : item.isConducted ? (
                          <div className="text-left sm:text-right">
                            <Badge variant="success" size="md">
                              ✓ Attendance Submitted
                            </Badge>
                            <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">Conducted & Recorded</p>
                          </div>
                        ) : (
                          <Badge variant="danger" size="md">
                            ● Pending Submission
                          </Badge>
                        )}

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {item.isCancelled ? (
                            <button
                              disabled
                              className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              <CalendarX className="w-3.5 h-3.5" /> Cancelled
                            </button>
                          ) : (
                            <>
                              <button
                                disabled={isLoadingThis}
                                onClick={() => handleOpenAttendanceForScheduledClass(item)}
                                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all ${
                                  item.isConducted
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                {isLoadingThis ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Opening...</span>
                                  </>
                                ) : (
                                  <>
                                    <CalendarCheck className="w-3.5 h-3.5" />
                                    <span>{item.isConducted ? 'Edit Attendance' : 'Mark Attendance'}</span>
                                  </>
                                )}
                              </button>

                              {!item.isConducted && (
                                <button
                                  title="Cancel this period for selected date"
                                  onClick={() => setCancelModalItem(item)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                                >
                                  <CalendarX className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTORICAL CLASS SESSIONS ARCHIVE                                   */}
      {/* ========================================================================= */}
      {(activeTab === 'SESSIONS' || isStudent) && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {!isStudent && !hodDeptId && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={filterDepartment}
                    onChange={e => setFilterDepartment(e.target.value)}
                    className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Academic Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({filteredSessions.length})
                </button>
                <button
                  onClick={() => setFilterStatus('PENDING')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    filterStatus === 'PENDING' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('CONDUCTED')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    filterStatus === 'CONDUCTED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  Conducted
                </button>
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search course or faculty..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
          </div>

          {/* Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200">
                <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">No Class Sessions Found</h4>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or date selection.</p>
              </div>
            ) : (
              filteredSessions.map(session => {
                const offering = courseOfferings.find(o => o.id === session.courseOfferingId);
                const course = courses.find(c => c.id === offering?.courseId);
                const category = courseCategories.find(cat => cat.id === course?.categoryId);
                const group = courseGroups.find(g => g.id === session.courseGroupId);
                const period = timetablePeriods.find(p => p.id === session.periodId);
                const assignedFac = faculty.find(f => f.id === session.facultyId);
                const substituteFac = faculty.find(f => f.id === session.substituteFacultyId);

                const registeredStudents = getCourseGroupRegisteredStudents(session.courseGroupId);
                const sessionRecords = attendanceRecords.filter(r => r.classSessionId === session.id);
                const presentRecords = sessionRecords.filter(r => r.status === 'PRESENT' || r.status === 'OD');
                const percent =
                  registeredStudents.length > 0 && session.attendanceSubmitted
                    ? Math.round((presentRecords.length / registeredStudents.length) * 100)
                    : null;

                // Student specific status in this session
                const myRecord = isStudent && currentStudent
                  ? sessionRecords.find(r => r.studentId === currentStudent.id)
                  : null;

                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: category?.colorHex || '#2563eb' }}
                        >
                          {category?.name}
                        </span>

                        {isStudent ? (
                          <Badge
                            variant={
                              myRecord?.status === 'PRESENT'
                                ? 'success'
                                : myRecord?.status === 'OD'
                                ? 'purple'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {myRecord ? myRecord.status : 'NOT MARKED'}
                          </Badge>
                        ) : session.attendanceSubmitted ? (
                          <Badge variant="success" size="sm">
                            ✓ {percent}% Attendance
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            ● Pending Marking
                          </Badge>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mt-2.5 line-clamp-1">
                        {course?.courseTitle}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {course?.courseCode} • {course?.credits} Credits
                      </p>

                      <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Date:</span>
                          <span className="font-semibold text-slate-800">{session.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Group & Room:</span>
                          <span className="font-semibold text-slate-800">
                            {group?.groupName} ({group?.room})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Schedule:</span>
                          <span className="font-semibold text-blue-700">
                            {period?.label} ({session.startTime} - {session.endTime})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Faculty:</span>
                          <span className="font-semibold text-slate-800">
                            {assignedFac?.fullName}
                          </span>
                        </div>
                        {session.substituteFacultyId && (
                          <div className="flex justify-between text-purple-700 font-bold">
                            <span>Substitute:</span>
                            <span>{substituteFac?.fullName}</span>
                          </div>
                        )}
                        {!isStudent && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Cohort Size:</span>
                            <span className="font-semibold text-slate-800">
                              {registeredStudents.length} Students
                            </span>
                          </div>
                        )}
                      </div>

                      {session.topicCovered && (
                        <p className="text-xs text-slate-600 mt-2.5 bg-blue-50/50 p-2 rounded-lg border border-blue-100/60 line-clamp-2">
                          <strong className="text-blue-900">Topic:</strong> {session.topicCovered}
                        </p>
                      )}
                    </div>

                    {!isStudent && (canRequestCorrection || canMarkAttendance) && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {canRequestCorrection ? (
                          <button
                            onClick={() => setCorrectionSession(session)}
                            className="text-xs text-slate-600 hover:text-blue-600 font-semibold flex items-center gap-1 py-1"
                            title="Request attendance correction or submit batch OD concession"
                          >
                            <FileEdit className="w-3.5 h-3.5" /> Correction / Batch OD
                          </button>
                        ) : (
                          <div />
                        )}

                        {canMarkAttendance && (
                          <button
                            onClick={() => setActiveSession(session)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                              session.attendanceSubmitted
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                            {session.attendanceSubmitted ? 'Edit Roster' : 'Mark Attendance'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HOD BATCH CORRECTION APPROVALS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'CORRECTIONS' && canReviewCorrection && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase">Department Attendance Correction Approvals</h3>
                  {pendingCorrectionRequests.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                      {pendingCorrectionRequests.length} Pending Review
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approve or reject individual or multi-student batch attendance corrections submitted by teaching faculty.
                </p>
              </div>

              {pendingCorrectionRequests.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={selectedCorrectionIds.length === 0 || isProcessingReview}
                    onClick={() => handleBulkReview('APPROVED')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve Selected ({selectedCorrectionIds.length})
                  </button>
                  <button
                    disabled={selectedCorrectionIds.length === 0 || isProcessingReview}
                    onClick={() => handleBulkReview('REJECTED')}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject Selected
                  </button>
                </div>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {departmentCorrectionRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-bold text-slate-700">No correction requests found</p>
                  <p className="text-xs text-slate-400 mt-1">All attendance changes are up to date and verified.</p>
                </div>
              ) : (
                departmentCorrectionRequests.map(req => {
                  const sess = classSessions.find(s => s.id === req.classSessionId);
                  const off = courseOfferings.find(o => o.id === sess?.courseOfferingId);
                  const crs = courses.find(c => c.id === off?.courseId);
                  const stu = students.find(s => s.id === req.studentId);
                  const fac = faculty.find(f => f.id === req.requestedByFacultyId);
                  const isPending = req.status === 'PENDING';
                  const isSelected = selectedCorrectionIds.includes(req.id);

                  return (
                    <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {isPending && (
                          <button
                            onClick={() => {
                              setSelectedCorrectionIds(prev =>
                                prev.includes(req.id) ? prev.filter(id => id !== req.id) : [...prev, req.id]
                              );
                            }}
                            className="mt-1 text-slate-400 hover:text-blue-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        )}

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{stu?.fullName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({stu?.rollNumber || stu?.admissionNumber})
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-semibold text-slate-700">
                              {crs?.courseCode} - {crs?.courseTitle}
                            </span>
                            <span className="text-[11px] text-slate-500">({sess?.date})</span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-slate-500">Status Change:</span>
                            <Badge variant="danger" size="sm">{req.oldStatus}</Badge>
                            <span className="text-slate-400 font-bold">→</span>
                            <Badge variant="purple" size="sm">{req.requestedStatus}</Badge>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">
                              Requested by: <strong className="text-slate-700">{fac?.fullName || 'Faculty'}</strong>
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <strong>Reason:</strong> {req.reason}
                          </p>

                          {req.reviewRemarks && (
                            <p className="mt-1 text-xs text-emerald-800 bg-emerald-50/60 p-1.5 rounded border border-emerald-100">
                              <strong>Review Remarks:</strong> {req.reviewRemarks}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Badge
                          variant={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'danger' : 'warning'}
                          size="md"
                        >
                          {req.status}
                        </Badge>

                        {isPending && (
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={isProcessingReview}
                              onClick={() => {
                                setReviewingRequest(req);
                                setReviewRemarks('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                            >
                              Review
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CLASS TUTOR COHORT REGISTER                                        */}
      {/* ========================================================================= */}
      {activeTab === 'TUTOR_COHORT' && isClassTutor && (
        <div className="space-y-4">
          {/* Tutor Cohort Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    {tutorCohort?.programme?.title || 'FYUGP Programme Cohort'} ({tutorCohort?.batchName || '2026-2030'})
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                    Class Tutor Official Register
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Department of {tutorCohort?.department?.name || 'Science'} • Tracking cumulative attendance across all FYUGP Major, Minor, MDC, AEC & SEC course registrations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportAttendanceReportToCsv(tutorCohort?.department?.id)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <Download className="w-4 h-4" /> Export Cohort Roster (CSV)
                </button>
              </div>
            </div>

            {/* Quick Cohort Summary Cards */}
            {(() => {
              const cohortStudents = tutorCohort?.cohortStudents || [];
              const studentSummaries = cohortStudents.map(s => ({
                student: s,
                summary: getStudentAttendanceSummary(s.id)
              }));

              const shortageCount = studentSummaries.filter(s => s.summary.overallPercentage < 75).length;
              const criticalCount = studentSummaries.filter(s => s.summary.overallPercentage < 65).length;
              const eligibleCount = studentSummaries.filter(s => s.summary.overallPercentage >= 75).length;

              const filteredList = studentSummaries.filter(item => {
                if (tutorShortageFilter === 'SHORTAGE') return item.summary.overallPercentage < 75;
                if (tutorShortageFilter === 'CRITICAL') return item.summary.overallPercentage < 65;
                if (tutorShortageFilter === 'ELIGIBLE') return item.summary.overallPercentage >= 75;
                return true;
              });

              return (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">Total Enrolled</p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">{cohortStudents.length}</p>
                      <p className="text-[11px] text-slate-400">Registered Students</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-[11px] font-bold text-emerald-700 uppercase">Eligible (&ge; 75%)</p>
                      <p className="text-xl font-black text-emerald-800 mt-0.5">{eligibleCount}</p>
                      <p className="text-[11px] text-emerald-600">Exam Qualified</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-[11px] font-bold text-amber-700 uppercase">Shortage (&lt; 75%)</p>
                      <p className="text-xl font-black text-amber-800 mt-0.5">{shortageCount}</p>
                      <p className="text-[11px] text-amber-600">Condonation Required</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                      <p className="text-[11px] font-bold text-rose-700 uppercase">Critical (&lt; 65%)</p>
                      <p className="text-xl font-black text-rose-800 mt-0.5">{criticalCount}</p>
                      <p className="text-[11px] text-rose-600">Detention Warning</p>
                    </div>
                  </div>

                  {/* Filter Chips */}
                  <div className="flex items-center gap-1.5 pt-2">
                    <span className="text-xs font-bold text-slate-500 mr-2">Filter Cohort:</span>
                    <button
                      onClick={() => setTutorShortageFilter('ALL')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        tutorShortageFilter === 'ALL'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({cohortStudents.length})
                    </button>
                    <button
                      onClick={() => setTutorShortageFilter('SHORTAGE')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        tutorShortageFilter === 'SHORTAGE'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      Shortage (&lt;75%)
                    </button>
                    <button
                      onClick={() => setTutorShortageFilter('CRITICAL')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        tutorShortageFilter === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      Critical (&lt;65%)
                    </button>
                    <button
                      onClick={() => setTutorShortageFilter('ELIGIBLE')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        tutorShortageFilter === 'ELIGIBLE'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      Eligible (&ge;75%)
                    </button>
                  </div>

                  {/* Student Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Roll / Adm No</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Total Classes</th>
                          <th className="py-3 px-4">Attended (P+OD)</th>
                          <th className="py-3 px-4">Absent</th>
                          <th className="py-3 px-4">Overall %</th>
                          <th className="py-3 px-4">Examination Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredList.map(({ student, summary }) => {
                          const pct = summary.overallPercentage;
                          const isEligible = pct >= 75;
                          const isCritical = pct < 65;

                          return (
                            <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                {student.rollNumber || student.admissionNumber}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900">{student.fullName}</span>
                                <span className="block text-[11px] text-slate-400 font-mono">{student.email}</span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-700">
                                {summary.totalClasses}
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-700">
                                {summary.attendedClasses}
                              </td>
                              <td className="py-3 px-4 font-bold text-rose-600">
                                {summary.absentClasses}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className={`font-black ${
                                    isEligible ? 'text-emerald-700' : isCritical ? 'text-rose-600' : 'text-amber-700'
                                  }`}>
                                    {pct}%
                                  </span>
                                  <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        isEligible ? 'bg-emerald-500' : isCritical ? 'bg-rose-500' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  variant={isEligible ? 'success' : isCritical ? 'danger' : 'warning'}
                                  size="sm"
                                >
                                  {isEligible ? 'Exam Eligible' : isCritical ? 'Detention Risk' : 'Shortage'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: ATTENDANCE MARKING, CORRECTIONS, SUBSTITUTES, CANCELLATION        */}
      {/* ========================================================================= */}
      {canMarkAttendance && (
        <TakeAttendanceModal
          isOpen={!!activeSession}
          onClose={() => setActiveSession(null)}
          session={activeSession}
        />
      )}

      {canRequestCorrection && (
        <AttendanceCorrectionModal
          isOpen={!!correctionSession}
          onClose={() => setCorrectionSession(null)}
          session={correctionSession}
        />
      )}

      {canAssignSubstitute && (
        <SubstituteTeacherModal
          isOpen={isSubstituteOpen}
          onClose={() => setIsSubstituteOpen(false)}
        />
      )}

      {/* Cancel Scheduled Class Modal */}
      {cancelModalItem && (
        <Modal
          isOpen={!!cancelModalItem}
          onClose={() => {
            setCancelModalItem(null);
            setCancelReason('');
            setCancelError(null);
          }}
          title="Cancel Scheduled Class"
          subtitle={`${cancelModalItem.course?.courseCode} - ${cancelModalItem.course?.courseTitle}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              You are cancelling this period for <strong>{selectedDate}</strong> ({cancelModalItem.period?.label}). This cancellation will be recorded in the daily schedule overrides and displayed across the college portal.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason for Cancellation <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Official faculty leave, Department conference, or College sports meet"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {cancelError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => {
                  setCancelModalItem(null);
                  setCancelReason('');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isCancelling || !cancelReason.trim()}
                onClick={handleConfirmCancelClass}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Single Correction Modal for HOD */}
      {reviewingRequest && (
        <Modal
          isOpen={!!reviewingRequest}
          onClose={() => setReviewingRequest(null)}
          title="Review Attendance Correction"
          subtitle={`Student: ${students.find(s => s.id === reviewingRequest.studentId)?.fullName}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold text-rose-600">{reviewingRequest.oldStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Status:</span>
                <span className="font-bold text-purple-700">{reviewingRequest.requestedStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reason Provided:</span>
                <span className="font-semibold text-slate-800">{reviewingRequest.reason}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                HOD Review Remarks (Optional)
              </label>
              <input
                type="text"
                value={reviewRemarks}
                onChange={e => setReviewRemarks(e.target.value)}
                placeholder="e.g. Verified with Student Affairs OD certificate"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessingReview}
                onClick={() => setReviewingRequest(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingReview}
                onClick={() => handleReviewSingleRequest('REJECTED')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Reject Request
              </button>
              <button
                type="button"
                disabled={isProcessingReview}
                onClick={() => handleReviewSingleRequest('APPROVED')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                Approve Request
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
