import React, { useState } from 'react';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { EmergencyAlertBanner } from '../common/EmergencyAlertBanner';
import { TodayTimetableWidget } from '../timetable/TodayTimetableWidget';
import {
  User,
  GraduationCap,
  Building2,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileCheck,
  Download,
  QrCode,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Bell,
  RefreshCw,
  Info,
  Layers,
  Sparkles,
  Bus
} from 'lucide-react';

interface StudentPersonalizedHomeProps {
  onNavigate: (tab: string) => void;
}

export const StudentPersonalizedHome: React.FC<StudentPersonalizedHomeProps> = ({ onNavigate }) => {
  const {
    currentStudent,
    switchActiveStudent,
    activeEmergencyAlert,
    dismissEmergencyAlert,
    relevantCirculars,
    relevantEvents,
    acknowledgeCircular,
    attendanceIntelligence,
    studentLeaveRequests,
    studentCertificateRequests
  } = usePersonalizedCollege();

  const { students, programmes, departments, settings } = useCollegeData();

  const [isSwitchStudentOpen, setIsSwitchStudentOpen] = useState(false);
  const [isDigitalIdOpen, setIsDigitalIdOpen] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  if (!currentStudent) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
          <GraduationCap className="w-12 h-12 text-rose-900 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Student Profile Not Linked</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Your login is not currently bound to an enrolled student profile. Please select your student record from the registered institutional database to access your personalized portal.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setIsSwitchStudentOpen(true)}
              className="px-4 py-2.5 bg-rose-900 text-white rounded-xl text-xs font-bold hover:bg-rose-950 transition-colors shadow-xs"
            >
              Select Enrolled Student Record
            </button>
          </div>
        </div>
      </div>
    );
  }

  const programme = programmes.find(p => p.id === currentStudent.programmeId);
  const department = departments.find(
    d => d.id === (currentStudent.homeDepartmentId || programme?.departmentId)
  );

  const pendingLeaveCount = studentLeaveRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
  const readyCertCount = studentCertificateRequests.filter(r => r.status === 'READY').length;

  const handleAcknowledge = async (circularId: string) => {
    setAcknowledgingId(circularId);
    try {
      await acknowledgeCircular(circularId);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Emergency & Urgent Alerts Banner */}
      {activeEmergencyAlert && (
        <EmergencyAlertBanner
          alert={activeEmergencyAlert}
          onDismiss={dismissEmergencyAlert}
        />
      )}

      {/* 2. Official Student Identity Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden relative w-full min-w-0">
        <div className="min-h-[4.5rem] sm:h-28 bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-bold rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              FYUGP Semester {currentStudent.currentSemester || 1} Enrolled
            </span>
          </div>
          <button
            onClick={() => setIsSwitchStudentOpen(true)}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] sm:text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 border border-white/15 ml-auto sm:ml-0"
            title="Switch authentic student account for demonstration"
          >
            <RefreshCw className="w-3 h-3" />
            Switch Student
          </button>
        </div>

        <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-6 sm:-mt-12 mb-4">
            <div className="flex items-center sm:items-end gap-3 sm:gap-4 min-w-0">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 sm:p-1.5 border-2 border-white shadow-md shrink-0">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 text-rose-900 flex items-center justify-center font-black text-xl sm:text-2xl border border-rose-200">
                  {currentStudent.fullName
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
              </div>

              <div className="mb-0.5 sm:mb-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                    {currentStudent.fullName}
                  </h1>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0">
                    {currentStudent.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5 truncate">
                  {programme?.name || 'Four Year Undergraduate Programme'}
                </p>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsDigitalIdOpen(true)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <QrCode className="w-3.5 h-3.5 text-rose-900" />
                Digital Student ID
              </button>
              <button
                onClick={() => onNavigate('leave-requests')}
                className="flex-1 sm:flex-none px-3 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Apply OD / Leave
              </button>
            </div>
          </div>

          {/* Academic Metadata Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Register Number</span>
              <span className="font-bold text-slate-800 font-mono text-xs truncate block">
                {currentStudent.universityRegisterNumber || 'Pending Allotment'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Admission Number</span>
              <span className="font-bold text-slate-800 font-mono text-xs truncate block">
                {currentStudent.admissionNumber || '—'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Department</span>
              <span className="font-bold text-slate-800 truncate block">
                {department?.name || '—'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Tutor</span>
              <span className="font-bold text-slate-800 truncate block">
                Class Tutor
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Layout: Timetable & Attendance Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timetable & Circulars */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timetable */}
          <TodayTimetableWidget onViewFullTimetable={() => onNavigate('timetable')} />

          {/* Targeted Circulars & Notices */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-50 text-rose-800 rounded-lg">
                  <Bell className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Notices</h3>
              </div>
              <button
                onClick={() => onNavigate('notices')}
                className="text-xs font-bold text-rose-900 hover:text-rose-950 flex items-center gap-1"
              >
                All Notices <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {relevantCirculars.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No notices available.
                </div>
              ) : (
                relevantCirculars.slice(0, 3).map(circular => {
                  const isAcknowledged = circular.acknowledgedStudentIds?.includes(currentStudent.id);

                  return (
                    <div key={circular.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-rose-950 bg-rose-50 px-2 py-0.5 rounded">
                              {circular.referenceNumber}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {circular.issuingAuthority}
                            </span>
                            {circular.priority === 'URGENT' && (
                              <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                                Urgent
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {circular.title}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {circular.description}
                          </p>

                          <div className="flex items-center gap-4 text-[11px] text-slate-600 pt-1">
                            <span>Published: {circular.effectiveFrom}</span>
                            {circular.attachmentName && (
                              <span className="flex items-center gap-1 text-rose-900 font-medium">
                                <Download className="w-3 h-3" /> {circular.attachmentName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Acknowledgement Status / Action */}
                        <div className="sm:text-right shrink-0 pt-1 sm:pt-0">
                          {circular.requiresAcknowledgement ? (
                            isAcknowledged ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Acknowledged
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAcknowledge(circular.id)}
                                disabled={acknowledgingId === circular.id}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                              >
                                {acknowledgingId === circular.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FileCheck className="w-3.5 h-3.5" />
                                )}
                                I Have Read This
                              </button>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-600 font-medium">Informational</span>
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

        {/* Right 1 Col: Attendance Intelligence, Upcoming Events, Quick Services */}
        <div className="space-y-6">
          {/* Attendance Radar & Intelligence */}
          {attendanceIntelligence && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
                    <Award className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Attendance Radar</h3>
                    <span className="text-[11px] text-slate-500">Min. Req: {settings.minAttendancePercentage}%</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${
                    attendanceIntelligence.totalConducted === 0
                      ? 'bg-slate-100 text-slate-600'
                      : attendanceIntelligence.isShortage
                      ? 'bg-rose-100 text-rose-800'
                      : attendanceIntelligence.isWarning
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {attendanceIntelligence.totalConducted === 0
                    ? 'No Records'
                    : attendanceIntelligence.isShortage
                    ? 'Shortage Alert'
                    : attendanceIntelligence.isWarning
                    ? 'Caution'
                    : 'Compliant'}
                </span>
              </div>

              {attendanceIntelligence.totalConducted === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-semibold text-slate-600">No attendance recorded yet</p>
                </div>
              ) : (
                <>
                  {/* Big Metric Display */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-black tracking-tight text-slate-900">
                        {attendanceIntelligence.overallPercentage}%
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {attendanceIntelligence.totalPresent + attendanceIntelligence.totalOd} of{' '}
                        {attendanceIntelligence.totalConducted} class hours attended
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-slate-400 block font-medium">On-Duty Sanctioned</span>
                      <span className="font-bold text-indigo-700 font-mono">
                        {attendanceIntelligence.totalOd} Hours
                      </span>
                    </div>
                  </div>

                  {/* Attendance Guidance / Intelligence Message */}
                  <div
                    className={`p-3 rounded-xl text-xs font-medium leading-relaxed border ${
                      attendanceIntelligence.isShortage
                        ? 'bg-rose-50 text-rose-900 border-rose-200'
                        : 'bg-emerald-50/80 text-emerald-900 border-emerald-200'
                    }`}
                  >
                    {attendanceIntelligence.isShortage ? (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <p>
                          <strong>Action Required:</strong> You must attend{' '}
                          <span className="font-bold underline">
                            {attendanceIntelligence.classesNeededToMeetMin} consecutive classes
                          </span>{' '}
                          without absence to recover above the university {settings.minAttendancePercentage}% examination threshold.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p>
                          <strong>Safe Margin:</strong> You can miss up to{' '}
                          <span className="font-bold">
                            {attendanceIntelligence.classesCanMissSafely} class hours
                          </span>{' '}
                          without dropping below {settings.minAttendancePercentage}%.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Subject Breakdown Progress */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      Subject-Wise Standings
                    </span>
                    {attendanceIntelligence.courseSummaries.slice(0, 4).map(cs => (
                      <div key={cs.courseId} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span className="truncate pr-2">{cs.courseCode}</span>
                          <span className={`font-bold ${cs.isShortage ? 'text-rose-600' : 'text-slate-900'}`}>
                            {cs.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              cs.isShortage ? 'bg-rose-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(100, cs.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onNavigate('attendance')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors text-center block"
                  >
                    Detailed Subject Analysis
                  </button>
                </>
              )}
            </div>
          )}

          {/* Upcoming Academic Calendar Events */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-800 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">Upcoming Events</h3>
              </div>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs font-bold text-rose-900 hover:text-rose-950"
              >
                Calendar
              </button>
            </div>

            <div className="space-y-3">
              {relevantEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] uppercase font-bold text-slate-600">
                      {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {new Date(event.startDate).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{event.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {event.venue ? `Venue: ${event.venue}` : event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Academic Actions */}
          <div className="bg-gradient-to-br from-rose-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xs space-y-2.5">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Student Services
            </h3>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <button
                onClick={() => onNavigate('bus-concession')}
                className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-transparent border border-amber-400/30 hover:border-amber-400/60 hover:bg-white/15 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-300 group-hover:scale-105 transition-transform">
                    <Bus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block text-white text-xs">Bus Concession</span>
                    <span className="text-[10px] text-amber-200/90 block">KSRTC & Private Pass</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-mono shadow-xs">
                  Apply / View
                </span>
              </button>

              <button
                onClick={() => onNavigate('leave-requests')}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-amber-300 mb-1" />
                <span className="font-bold block">OD / Leave</span>
                <span className="text-[10px] text-rose-200 block">
                  {pendingLeaveCount > 0 ? `${pendingLeaveCount} Pending` : 'Apply Online'}
                </span>
              </button>

              <button
                onClick={() => onNavigate('student-requests')}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-left"
              >
                <GraduationCap className="w-4 h-4 text-emerald-300 mb-1" />
                <span className="font-bold block">Certificates</span>
                <span className="text-[10px] text-rose-200 block">
                  {readyCertCount > 0 ? `${readyCertCount} Ready` : 'Bonafide & Conduct'}
                </span>
              </button>

              <button
                onClick={() => onNavigate('resources')}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-left"
              >
                <Download className="w-4 h-4 text-blue-300 mb-1" />
                <span className="font-bold block">Downloads</span>
                <span className="text-[10px] text-rose-200 block">Syllabus & QP</span>
              </button>

              <button
                onClick={() => onNavigate('department-hub')}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-left"
              >
                <Building2 className="w-4 h-4 text-purple-300 mb-1" />
                <span className="font-bold block">Department Hub</span>
                <span className="text-[10px] text-rose-200 block">Staff & Activity</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Switch Student Modal */}
      {isSwitchStudentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Switch Student</h3>
              </div>
              <button
                onClick={() => setIsSwitchStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {students.map(s => {
                const isCurrent = s.id === currentStudent.id;
                const prog = programmes.find(p => p.id === s.programmeId);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      switchActiveStudent(s.id);
                      setIsSwitchStudentOpen(false);
                    }}
                    className={`w-full p-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isCurrent ? 'bg-rose-50/50' : ''
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{s.fullName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {s.universityRegisterNumber || s.admissionNumber} • {prog?.name || 'FYUGP'}
                      </p>
                    </div>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-900 text-white rounded">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Select</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Digital ID Card Modal */}
      {isDigitalIdOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Digital Identity Card</h3>
            </div>

            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 text-rose-900 flex items-center justify-center font-black text-3xl border border-rose-200 shadow-xs">
              {currentStudent.fullName
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">{currentStudent.fullName}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{programme?.name}</p>
              <div className="mt-2 text-xs font-mono font-bold text-slate-800 bg-slate-100 py-1 px-3 rounded-lg inline-block">
                Reg: {currentStudent.universityRegisterNumber || currentStudent.admissionNumber}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
              <QrCode className="w-28 h-28 text-slate-800" />
              <span className="text-[10px] text-slate-600 font-mono mt-2">
                UID: {currentStudent.id}
              </span>
            </div>

            <button
              onClick={() => setIsDigitalIdOpen(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close ID Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
