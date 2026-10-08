import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { can } from '../../config/permissions';
import { StatCard, Badge, Modal } from '../common/UIComponents';
import { CollegeLogo } from '../common/CollegeLogo';
import { TakeAttendanceModal } from '../attendance/TakeAttendanceModal';
import { AttendanceCalculatorModal } from '../student/AttendanceCalculatorModal';
import { DigitalIdModal } from '../student/DigitalIdModal';
import { SubstituteTeacherModal } from '../attendance/SubstituteTeacherModal';
import { StudentPersonalizedHome } from '../student/StudentPersonalizedHome';
import { QuickActionsFloatingButton } from '../dashboard/QuickActionsFloatingButton';
import { SendPushNotificationModal } from '../modals/SendPushNotificationModal';
import { TeacherSubjectsCard } from '../faculty/TeacherSubjectsCard';
import { HodSubjectApprovalsCard } from '../faculty/HodSubjectApprovalsCard';
import { HodFacultyManagementCard } from '../faculty/HodFacultyManagementCard';
import { pushNotificationService } from '../../services/pushNotificationService';
import { PushNotificationMessage } from '../../types/pushNotification';
import {
  CalendarCheck,
  Calendar,
  CalendarX,
  Clock,
  Users,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Award,
  Download,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  IdCard,
  Building,
  GraduationCap,
  RefreshCw,
  UserCheck,
  BellRing,
  Radio,
  Volume2,
  Send
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { ClassSession } from '../../types';

interface DashboardViewProps {
  setActiveTab?: (tab: string) => void;
  onNavigate?: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, onNavigate }) => {
  const navigateTo = onNavigate || setActiveTab || (() => {});
  const { user, activeRole } = useAuth();
  const {
    settings,
    departments,
    programmes,
    students,
    faculty,
    courses,
    courseCategories,
    courseGroups,
    courseOfferings,
    timetablePeriods,
    classSessions,
    attendanceRecords,
    correctionRequests,
    announcements,
    getStudentAttendanceSummary,
    getPendingAttendanceSessions,
    exportAttendanceReportToCsv,
    dailyScheduleOverrides,
    getDailyScheduledClasses,
    getOrCreateSessionForTimetableEntry,
    cancelScheduledClass
  } = useCollegeData();

  // Modals state
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<ClassSession | null>(null);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isDigitalIdOpen, setIsDigitalIdOpen] = useState(false);
  const [isSubstituteOpen, setIsSubstituteOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [pushBroadcasts, setPushBroadcasts] = useState<PushNotificationMessage[]>(() =>
    pushNotificationService.getAllNotifications()
  );
  const [loadingSessionKey, setLoadingSessionKey] = useState<string | null>(null);
  const [cancelModalItem, setCancelModalItem] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = pushNotificationService.subscribe((list) => {
      setPushBroadcasts(list);
    });
    return () => unsub();
  }, []);

  // Today's date string
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Timetable-driven scheduled classes for today (including substitutes, regular & extras)
  const teacherScheduledClasses = getDailyScheduledClasses(todayDateStr, user?.id);
  const teacherPendingClasses = teacherScheduledClasses.filter(c => c.isPending);
  const teacherConductedClasses = teacherScheduledClasses.filter(c => c.isConducted);

  // Lazy instantiate session on-demand when teacher clicks 'Mark Attendance'
  const handleOpenAttendanceForScheduledClass = async (item: any) => {
    try {
      if (item.session) {
        setSelectedSessionForAttendance(item.session);
        return;
      }
      if (item.timetableEntry) {
        setLoadingSessionKey(item.timetableEntry.id);
        const sess = await getOrCreateSessionForTimetableEntry(item.timetableEntry.id, todayDateStr);
        setSelectedSessionForAttendance(sess);
      }
    } catch (err: any) {
      console.error('Failed to open attendance session:', err);
    } finally {
      setLoadingSessionKey(null);
    }
  };

  const handleConfirmCancelClass = async () => {
    if (!cancelModalItem || !cancelReason.trim()) return;
    setIsCancelling(true);
    setCancelError(null);
    const res = await cancelScheduledClass(cancelModalItem.timetableEntry.id, todayDateStr, cancelReason.trim(), user?.id);
    setIsCancelling(false);
    if (!res.success) {
      setCancelError(res.error || 'Failed to cancel scheduled class.');
      return;
    }
    setCancelModalItem(null);
    setCancelReason('');
  };

  // Student specific summary - strictly isolated to authenticated student
  const currentStudent =
    user?.studentProfile ||
    students.find(
      s =>
        s.id === user?.id ||
        (s.username && user?.name && s.username.toLowerCase() === user.name.toLowerCase()) ||
        (s.universityRegisterNumber && user?.name && s.universityRegisterNumber.toLowerCase() === user.name.toLowerCase()) ||
        (user?.email && s.email.toLowerCase() === user.email.toLowerCase())
    ) ||
    null;

  const studentSummary = currentStudent
    ? getStudentAttendanceSummary(currentStudent.id)
    : {
        overallPercentage: 0,
        totalConducted: 0,
        totalPresent: 0,
        totalOd: 0,
        totalMedicalLeave: 0,
        totalAbsent: 0,
        isShortage: false,
        isWarning: false,
        courses: []
      };

  // Teacher specific sessions - strictly assigned to this teacher
  const teacherSessions = classSessions.filter(
    s => s.facultyId === user?.id || s.substituteFacultyId === user?.id
  );
  const teacherPending = teacherSessions.filter(s => !s.attendanceSubmitted);

  // HOD / Admin department stats
  const deptAttendanceData = departments.map(d => {
    const deptStudents = students.filter(s => s.homeDepartmentId === d.id);
    let totalP = 0;
    let totalC = 0;

    deptStudents.forEach(stu => {
      const sum = getStudentAttendanceSummary(stu.id);
      totalC += sum.totalConducted;
      totalP += sum.totalPresent + sum.totalOd + sum.totalMedicalLeave;
    });

    const avg = totalC > 0 ? Number(((totalP / totalC) * 100).toFixed(1)) : 0;
    return {
      name: d.code,
      fullName: d.name,
      attendance: avg,
      students: deptStudents.length
    };
  });

  // FYUGP Category Breakdown
  const categoryStats = courseCategories.map(cat => {
    const matchingCourses = courses.filter(c => c.categoryId === cat.id);
    return {
      name: cat.code,
      fullName: cat.name,
      coursesCount: matchingCourses.length,
      color: cat.colorHex
    };
  });

  // ==========================================
  // 1. STUDENT DASHBOARD VIEW
  // ==========================================
  if (activeRole === 'STUDENT') {
    return (
      <div className="relative">
        <StudentPersonalizedHome onNavigate={navigateTo} />
        <QuickActionsFloatingButton
          onNavigate={navigateTo}
          scheduledClasses={teacherScheduledClasses}
          onOpenSessionForClass={handleOpenAttendanceForScheduledClass}
          onOpenSubstituteModal={() => setIsSubstituteOpen(true)}
          onExportCsv={() => exportAttendanceReportToCsv()}
        />
      </div>
    );
  }

  if (false as boolean) {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-4 sm:p-6 shadow-sm w-full min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="relative z-10 min-w-0 flex-1 w-full space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-400/25 text-[11px] font-bold uppercase tracking-wider font-mono">
                {currentStudent.admissionBatch} • Semester {currentStudent.currentSemester}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 text-amber-300 border border-amber-400/25 text-[11px] font-bold uppercase tracking-wider">
                FYUGP Single Major
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white leading-tight">
              Welcome back, {currentStudent.fullName}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span>Roll No: <strong className="text-white font-mono">{currentStudent.rollNumber}</strong></span>
              <span className="text-slate-500">•</span>
              <span>Adm No: <strong className="text-white font-mono">{currentStudent.admissionNumber}</strong></span>
              <span className="text-slate-500">•</span>
              <span>Univ Reg: <strong className="text-amber-300 font-mono">{currentStudent.universityRegisterNumber}</strong></span>
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
            <button
              onClick={() => setIsCalcOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all min-h-[42px]"
            >
              <TrendingUp className="w-4 h-4 shrink-0" /> Target Calculator
            </button>

            <button
              onClick={() => setIsDigitalIdOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all min-h-[42px]"
            >
              <IdCard className="w-4 h-4 text-amber-300 shrink-0" /> Digital Student ID
            </button>
          </div>
        </div>

        {/* Shortage Warning Banner if applicable */}
        {studentSummary.isShortage && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900 flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-tight">Critical Attendance Shortage Alert</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Your overall attendance ({studentSummary.overallPercentage}%) is below the University mandated{' '}
                <strong>{settings.minAttendancePercentage}%</strong> threshold required for end-semester examination eligibility. Please consult your Class Tutor immediately.
              </p>
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Institutional Attendance"
            value={`${studentSummary.overallPercentage}%`}
            subtitle={`${studentSummary.totalPresent + studentSummary.totalOd + studentSummary.totalMedicalLeave} / ${studentSummary.totalConducted} classes attended`}
            icon={<CalendarCheck className="w-5 h-5" />}
            color={studentSummary.isShortage ? 'rose' : studentSummary.isWarning ? 'amber' : 'emerald'}
          />
          <StatCard
            title="Present Sessions"
            value={studentSummary.totalPresent}
            subtitle="Regular classroom presence"
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="emerald"
          />
          <StatCard
            title="Duty / Institutional Leave"
            value={studentSummary.totalOd}
            subtitle="Sports, NSS, Arts & Seminars"
            icon={<Award className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Registered Courses"
            value={studentSummary.courses.length}
            subtitle="FYUGP Multidisciplinary Basket"
            icon={<BookOpen className="w-5 h-5" />}
            color="blue"
          />
        </div>

        {/* Course-Wise Attendance Matrix */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Registered FYUGP Courses & Attendance</h3>
              <p className="text-xs text-slate-500">
                Single Major Pathway with Minor, Multidisciplinary, AEC, and Skill Enhancement Courses
              </p>
            </div>
            <button
              onClick={() => setIsCalcOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Simulate Target →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentSummary.courses.map((crs, idx) => (
              <div
                key={crs.registrationId || `${crs.courseId}-${crs.courseCategory}-${crs.groupName}-${idx}`}
                className={`p-4 rounded-xl border transition-all ${
                  crs.isShortage
                    ? 'bg-rose-50/40 border-rose-200'
                    : crs.isWarning
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-slate-50/70 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                    style={{ backgroundColor: crs.categoryColorHex }}
                  >
                    {crs.courseCategory}
                  </span>
                  <Badge variant={crs.isShortage ? 'danger' : crs.isWarning ? 'warning' : 'success'} size="sm">
                    {crs.percentage}%
                  </Badge>
                </div>

                <h4 className="text-xs font-bold text-slate-900 mt-2.5">{crs.courseTitle}</h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {crs.courseCode} • {crs.credits} Credits • {crs.groupName}
                </p>

                {/* Progress bar */}
                <div className="mt-3 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      crs.isShortage ? 'bg-rose-500' : crs.isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, crs.percentage)}%` }}
                  ></div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Conducted: <strong>{crs.conductedCount}</strong></span>
                  <span>Attended: <strong>{crs.presentCount + crs.odCount}</strong></span>
                  <span>Absent: <strong>{crs.absentCount}</strong></span>
                </div>

                <div className="mt-2 text-[10px]">
                  {crs.percentage >= settings.minAttendancePercentage ? (
                    <span className="text-emerald-700 font-semibold">
                      ✓ Can miss up to <strong>{crs.classesCanMiss}</strong> more class(es)
                    </span>
                  ) : (
                    <span className="text-rose-700 font-semibold">
                      ⚠ Need <strong>+{crs.classesNeededForMin}</strong> consecutive classes for 75%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements for Students */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-3">Notice Board & Circulars</h3>
          <div className="space-y-3">
            {announcements
              .filter(a => a.targetAudience === 'ALL' || a.targetAudience === 'STUDENTS')
              .map(a => (
                <div key={a.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{a.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{a.publishDate}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{a.content}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Attendance Calculator Modal */}
        <AttendanceCalculatorModal
          isOpen={isCalcOpen}
          onClose={() => setIsCalcOpen(false)}
          studentId={currentStudent.id}
        />

        {/* Digital ID Modal */}
        <DigitalIdModal
          isOpen={isDigitalIdOpen}
          onClose={() => setIsDigitalIdOpen(false)}
          student={currentStudent}
        />
      </div>
    );
  }

  // ==========================================
  // 2. TEACHER DASHBOARD VIEW
  // ==========================================
  if (activeRole === 'TEACHER' || activeRole === 'CLASS_TUTOR') {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-4 sm:p-6 shadow-sm w-full min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Subtle Institutional Background Glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 min-w-0 flex-1 w-full space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-400/25 text-[11px] font-bold uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                {activeRole === 'CLASS_TUTOR' ? 'Class Tutor & Faculty' : 'Faculty'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 text-[11px] font-bold font-mono">
                AY {settings.activeAcademicYear}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white leading-tight">
              {user?.name || 'Faculty Member'}
            </h2>

            <p className="text-xs text-slate-300 font-medium">
              {user?.departmentId ? departments.find(d => d.id === user.departmentId)?.name : 'NSS College Ottapalam'}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
            <button
              onClick={() => navigateTo('attendance')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all min-h-[40px]"
            >
              <CalendarCheck className="w-4 h-4 shrink-0" /> Attendance
            </button>
          </div>
        </div>

        {/* 1. FIRST ACTION: My Teaching Subjects & Registration Queue */}
        <TeacherSubjectsCard onNavigateToAttendance={() => navigateTo('attendance')} />

        {/* Teacher Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Scheduled Today"
            value={teacherScheduledClasses.length}
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Pending Attendance"
            value={teacherPendingClasses.length}
            subtitle={teacherPendingClasses.length > 0 ? "Requires submission" : "All marked"}
            icon={<AlertTriangle className="w-5 h-5" />}
            color={teacherPendingClasses.length > 0 ? "rose" : "emerald"}
          />
          <StatCard
            title="Conducted Today"
            value={teacherConductedClasses.length}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="emerald"
          />
          <StatCard
            title="Corrections"
            value={correctionRequests.length}
            icon={<FileSpreadsheet className="w-5 h-5" />}
            color="amber"
          />
        </div>

        {/* Today's Teaching Schedule */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Today's Classes</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {teacherScheduledClasses.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No classes scheduled today.
              </div>
            ) : (
              teacherScheduledClasses.map((item, idx) => {
                const isLoadingThis = loadingSessionKey === item.timetableEntry?.id;

                return (
                  <div key={item.timetableEntry?.id || item.session?.id || idx} className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center justify-center font-mono text-blue-900 shrink-0">
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
                              Substitute (for {item.scheduledFaculty?.fullName})
                            </span>
                          )}

                          {item.isExtra && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Extra Class
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 break-words">{item.course?.courseTitle}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>Timing: {item.period?.startTime || '09:30'} - {item.period?.endTime || '10:30'}</span>
                          {item.isCancelled ? (
                            <span className="text-rose-600 font-medium">
                              • Reason: {item.override?.reason || 'Cancelled by department'}
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

                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                        {item.isCancelled ? (
                          <button
                            disabled
                            className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <CalendarX className="w-3.5 h-3.5" /> Cancelled
                          </button>
                        ) : (
                          <>
                            <button
                              disabled={isLoadingThis}
                              onClick={() => handleOpenAttendanceForScheduledClass(item)}
                              className={`w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all ${
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
                                title="Cancel this scheduled period for today"
                                onClick={() => setCancelModalItem(item)}
                                className="p-2 sm:p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
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

        {/* Take Attendance Modal */}
        <TakeAttendanceModal
          isOpen={!!selectedSessionForAttendance}
          onClose={() => setSelectedSessionForAttendance(null)}
          session={selectedSessionForAttendance}
        />

        {/* Cancel Class Modal */}
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
                You are cancelling this class for <strong>{todayDateStr}</strong> ({cancelModalItem.period?.label}). This cancellation will be recorded in the daily schedule overrides and visible across the college.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Cancellation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Department seminar, Official meeting, or Personal emergency"
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

        <QuickActionsFloatingButton
          onNavigate={navigateTo}
          scheduledClasses={teacherScheduledClasses}
          onOpenSessionForClass={handleOpenAttendanceForScheduledClass}
          onOpenSubstituteModal={() => setIsSubstituteOpen(true)}
          onExportCsv={() => exportAttendanceReportToCsv()}
        />
      </div>
    );
  }

  // ==========================================
  // 3. ADMINISTRATIVE / HOD / PRINCIPAL DASHBOARD VIEW
  // ==========================================
  const totalStudentsCount = students.length;
  const totalConductedToday = classSessions.filter(s => s.attendanceSubmitted).length;
  const totalScheduledToday = classSessions.length;
  const facultySubmissionRate = totalScheduledToday > 0 ? ((totalConductedToday / totalScheduledToday) * 100).toFixed(1) : null;

  let totalCampusP = 0;
  let totalCampusC = 0;
  students.forEach(s => {
    const sum = getStudentAttendanceSummary(s.id);
    totalCampusC += sum.totalConducted;
    totalCampusP += sum.totalPresent + sum.totalOd + sum.totalMedicalLeave;
  });
  const institutionalAvg = totalCampusC > 0 ? `${((totalCampusP / totalCampusC) * 100).toFixed(1)}%` : '—';
  const hasAttendanceData = totalCampusC > 0;

  return (
    <div className="space-y-6">
      {/* Executive Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-4 sm:p-5 shadow-sm w-full min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10 min-w-0 flex-1 w-full space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/25 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              {activeRole === 'PRINCIPAL' ? 'Principal' : activeRole === 'HOD' ? 'Department Head' : 'Super Admin'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-400/25 text-[11px] font-bold font-mono">
              AY {settings.activeAcademicYear}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white leading-tight">
            {settings.collegeName}
          </h2>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center flex-wrap gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
          {can(activeRole, 'timetable', 'create') && (
            <button
              onClick={() => navigateTo('timetable')}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all min-h-[38px]"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" /> Timetable
            </button>
          )}

          {can(activeRole, 'courses', 'create') && (
            <button
              onClick={() => navigateTo('courses')}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all min-h-[38px]"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" /> Add Course
            </button>
          )}

          {can(activeRole, 'attendance', 'assign_substitute') && (
            <button
              onClick={() => setIsSubstituteOpen(true)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all min-h-[38px]"
            >
              <Users className="w-3.5 h-3.5 shrink-0" /> Substitute
            </button>
          )}

          {can(activeRole, 'reports', 'export_csv') && (
            <button
              onClick={() => exportAttendanceReportToCsv()}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all min-h-[38px]"
            >
              <Download className="w-3.5 h-3.5 shrink-0" /> Export CSV
            </button>
          )}

          {['PRINCIPAL', 'HOD', 'SUPER_ADMIN'].includes(activeRole) && (
            <button
              onClick={() => setIsPushModalOpen(true)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all min-h-[38px] cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 shrink-0" />
              <span>Send Alert</span>
            </button>
          )}
        </div>
      </div>

      {/* Institutional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Campus Attendance"
          value={institutionalAvg}
          icon={<CalendarCheck className="w-5 h-5" />}
          color={hasAttendanceData ? "emerald" : "blue"}
        />
        <StatCard
          title="Submission Rate"
          value={facultySubmissionRate ? `${facultySubmissionRate}%` : "—"}
          subtitle={totalScheduledToday > 0 ? `${totalConductedToday} / ${totalScheduledToday} logged` : "No sessions"}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Enrolled Students"
          value={totalStudentsCount}
          icon={<GraduationCap className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Pending Corrections"
          value={correctionRequests.filter(c => c.status === 'PENDING').length}
          subtitle="Pending approval"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="amber"
          onClick={() => navigateTo('corrections')}
        />
      </div>

      {/* HOD Subject Approval Requests & Allocation Queue */}
      {['HOD', 'PRINCIPAL', 'SUPER_ADMIN'].includes(activeRole) && (
        <HodSubjectApprovalsCard onNavigateToStaff={() => navigateTo('staff-enrollment')} />
      )}

      {/* HOD Faculty Management Console */}
      {['HOD', 'PRINCIPAL', 'SUPER_ADMIN'].includes(activeRole) && (
        <HodFacultyManagementCard />
      )}

      {/* Broadcast & Push Notification Center for Administrative Roles */}
      {['PRINCIPAL', 'HOD', 'SUPER_ADMIN'].includes(activeRole) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl text-white shadow-xs ${
                  activeRole === 'PRINCIPAL'
                    ? 'bg-amber-600'
                    : activeRole === 'HOD'
                    ? 'bg-blue-600'
                    : 'bg-purple-600'
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Broadcasts & Push Alerts
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => pushNotificationService.playChime()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Test alert audio chime"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Test Sound</span>
              </button>

              <button
                onClick={() => setIsPushModalOpen(true)}
                className={`px-3.5 py-1.5 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeRole === 'PRINCIPAL'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : activeRole === 'HOD'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compose Alert</span>
              </button>
            </div>
          </div>

          {/* Recent Broadcast Messages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Recent Dispatches</span>
              <button
                onClick={() => setIsPushModalOpen(true)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
              >
                + New Alert
              </button>
            </div>

            {pushBroadcasts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No push alerts sent yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {pushBroadcasts.slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
                          b.priority === 'EMERGENCY'
                            ? 'bg-rose-100 text-rose-800'
                            : b.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {b.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(b.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        })}{' '}
                        {new Date(b.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 line-clamp-1">{b.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{b.body}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                      <span>Target: {b.targetAudience.replace(/_/g, ' ')}</span>
                      <span>By: {b.senderName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-full min-w-0">
        {/* Department-Wise Attendance Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-2xs w-full max-w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Department Attendance (%)</h3>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
              Min: {settings.minAttendancePercentage}%
            </span>
          </div>

          {!hasAttendanceData ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              <CalendarCheck className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No attendance data recorded yet.</p>
            </div>
          ) : (
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Avg Attendance']}
                  />
                  <Bar dataKey="attendance" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* FYUGP Course Categories Breakdown */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between w-full max-w-full min-w-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-3">Course Categories</h3>

            <div className="space-y-3">
              {categoryStats.map(cat => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="font-bold text-slate-800">{cat.name}</span>
                    <span className="text-slate-500 text-[11px] truncate max-w-[120px]">{cat.fullName}</span>
                  </div>
                  <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                    {cat.coursesCount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => navigateTo('course-categories')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-blue-600 rounded-md border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            >
              Categories <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SubstituteTeacherModal
        isOpen={isSubstituteOpen}
        onClose={() => setIsSubstituteOpen(false)}
      />

      <TakeAttendanceModal
        isOpen={!!selectedSessionForAttendance}
        onClose={() => setSelectedSessionForAttendance(null)}
        session={selectedSessionForAttendance}
      />

      <SendPushNotificationModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
      />

      <QuickActionsFloatingButton
        onNavigate={navigateTo}
        scheduledClasses={teacherScheduledClasses}
        onOpenSessionForClass={handleOpenAttendanceForScheduledClass}
        onOpenSubstituteModal={() => setIsSubstituteOpen(true)}
        onExportCsv={() => exportAttendanceReportToCsv()}
      />
    </div>
  );
};

