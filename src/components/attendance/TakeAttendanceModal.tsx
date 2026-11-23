import React, { useState, useEffect, useRef } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceStatus, ClassSession } from '../../types';
import { Modal } from '../common/UIComponents';
import { inferPeriodSession } from '../../utils/dualAttendanceEngine';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Calendar,
  Save,
  Lock
} from 'lucide-react';

interface TakeAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClassSession | null;
}

export const TakeAttendanceModal: React.FC<TakeAttendanceModalProps> = ({
  isOpen,
  onClose,
  session
}) => {
  const {
    courseOfferings,
    courses,
    courseCategories,
    courseGroups,
    departments,
    programmes,
    timetablePeriods,
    faculty,
    attendanceRecords,
    settings,
    getCourseGroupRegisteredStudents,
    submitAttendance
  } = useCollegeData();

  const { user, activeRole } = useAuth();
  const initializedKeyRef = useRef<string | null>(null);
  const initializedCountRef = useRef<number>(0);

  const [studentStatuses, setStudentStatuses] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [topicCovered, setTopicCovered] = useState('');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Derive session context
  const offering = courseOfferings.find(o => o.id === session?.courseOfferingId);
  const course = courses.find(c => c.id === offering?.courseId);
  const category = courseCategories.find(cat => cat.id === course?.categoryId);
  const group = courseGroups.find(g => g.id === session?.courseGroupId);
  const period = timetablePeriods.find(p => p.id === session?.periodId);
  const assignedFaculty = faculty.find(f => f.id === session?.facultyId);

  // Cross-programme registered students for this group
  const registeredStudents = session ? getCourseGroupRegisteredStudents(session.courseGroupId) : [];

  // Populate initial attendance state only when opening modal or changing session
  useEffect(() => {
    if (!isOpen || !session) {
      initializedKeyRef.current = null;
      initializedCountRef.current = 0;
      return;
    }

    const modalKey = `${isOpen}:${session.id}`;
    const alreadyInitializedSameSession = initializedKeyRef.current === modalKey;
    if (alreadyInitializedSameSession && initializedCountRef.current > 0) {
      return;
    }

    setTopicCovered(session.topicCovered || '');
    setErrorMessage(null);
    setSubmitSuccess(false);

    const existingRecords = attendanceRecords.filter(r => r.classSessionId === session.id);
    const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    registeredStudents.forEach(stu => {
      const existing = existingRecords.find(r => r.studentId === stu.id);
      if (existing) {
        initialMap[stu.id] = { status: existing.status, remarks: existing.remarks || '' };
      } else {
        initialMap[stu.id] = { status: 'PRESENT', remarks: '' };
      }
    });

    setStudentStatuses(initialMap);
    initializedKeyRef.current = modalKey;
    initializedCountRef.current = registeredStudents.length;
  }, [isOpen, session, attendanceRecords, registeredStudents]);

  if (!isOpen || !session) return null;

  if (!course) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Attendance Session"
        subtitle={`Session Date: ${session.date}`}
        maxWidth="max-w-lg"
      >
        <div className="p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            Course offering metadata for this session could not be loaded.
          </p>
          <p className="text-xs text-slate-500">
            Please refresh data sync from the top bar and try opening the attendance register again.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const effectiveRole = activeRole || user?.activeRole || 'TEACHER';
  const isPrivilegedEditor =
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'PRINCIPAL' ||
    effectiveRole === 'HOD' ||
    effectiveRole === 'ATTENDANCE_COORDINATOR';
  const windowHours = Number(settings?.attendanceCorrectionWindowHours ?? 24);
  const submittedMs = session.submittedTimestamp ? Date.parse(session.submittedTimestamp) : NaN;
  const elapsedHours = Number.isFinite(submittedMs) ? (Date.now() - submittedMs) / 3600000 : Infinity;
  const isCorrectionLocked =
    Boolean(session.attendanceSubmitted) &&
    !isPrivilegedEditor &&
    Boolean(settings?.requireHodApprovalForCorrection) &&
    !settings?.allowTeacherDirectEdit &&
    elapsedHours > windowHours;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isCorrectionLocked) return;
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (isCorrectionLocked) return;
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    registeredStudents.forEach(stu => {
      updated[stu.id] = {
        status,
        remarks: studentStatuses[stu.id]?.remarks || ''
      };
    });
    setStudentStatuses(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCorrectionLocked) {
      setErrorMessage(
        `Correction window (${windowHours}h) has expired. Please submit an Attendance Correction Request for HOD approval.`
      );
      return;
    }
    setErrorMessage(null);

    if (!topicCovered.trim()) {
      setErrorMessage('Please enter the topic or module covered during this session.');
      return;
    }

    setIsSubmitting(true);
    const records = registeredStudents.map(stu => ({
      studentId: stu.id,
      status: studentStatuses[stu.id]?.status || 'PRESENT',
      remarks: studentStatuses[stu.id]?.remarks || ''
    }));

    const res = await submitAttendance(session.id, records, topicCovered);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Attendance could not be saved to Supabase PostgreSQL. Please retry.');
      return;
    }

    setSubmitSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Stats calculation (excluding CANCELLED periods from session active denominator)
  const totalStudents = registeredStudents.length;
  const statusList = registeredStudents.map(stu => studentStatuses[stu.id]?.status || 'PRESENT');
  const presentCount = statusList.filter(s => s === 'PRESENT').length;
  const absentCount = statusList.filter(s => s === 'ABSENT').length;
  const dutyLeaveCount = statusList.filter(s => s === 'DUTY_LEAVE').length;
  const odCount = statusList.filter(s => s === 'OD').length;
  const medicalCount = statusList.filter(s => s === 'MEDICAL_LEAVE').length;
  const cancelledCount = statusList.filter(s => s === 'CANCELLED').length;
  const activeStudents = Math.max(0, totalStudents - cancelledCount);
  const attendedCount =
    presentCount +
    dutyLeaveCount +
    odCount +
    (settings?.enableOdAutomation ? medicalCount : 0);
  const sessionPercent = activeStudents > 0 ? `${((attendedCount / activeStudents) * 100).toFixed(1)}%` : 'N/A';
  const sessionSlot = inferPeriodSession(period, session.periodId);

  // Filtered roster
  const filteredStudents = registeredStudents.filter(stu => {
    const matchesDept = filterDept === 'ALL' || stu.homeDepartmentId === filterDept;
    const matchesSearch =
      stu.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Distinct departments represented in this FYUGP group
  const homeDepts = Array.from(new Set(registeredStudents.map(s => s.homeDepartmentId))).map(deptId =>
    departments.find(d => d.id === deptId)
  ).filter(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance"
      subtitle={`${course.courseCode} — ${course.courseTitle}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Class Overview Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 sm:p-5 rounded-xl shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold text-white uppercase"
                  style={{ backgroundColor: category?.colorHex || '#2563eb' }}
                >
                  {category?.name || 'Course'}
                </span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono text-blue-200">
                  {group?.groupName}
                </span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-blue-200">
                  Room: {group?.room}
                </span>
                <span className="bg-amber-400/20 border border-amber-300/30 px-2 py-0.5 rounded text-xs font-bold text-amber-200">
                  {sessionSlot === 'FN' ? 'FN · Forenoon' : 'AN · Afternoon'}
                </span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold">{course.courseTitle}</h4>
              <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> {session.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> {period?.label} ({session.startTime} - {session.endTime})
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" /> {assignedFaculty?.fullName}
                </span>
              </p>
            </div>

            {/* Live Percentage Meter */}
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 text-center min-w-[110px]">
              <p className="text-[10px] text-slate-300 font-semibold uppercase">Attendance</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-400">{sessionPercent}</p>
              <p className="text-[10px] text-slate-300">
                {attendedCount} / {activeStudents} Present
              </p>
            </div>
          </div>
        </div>

        {isCorrectionLocked && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Direct Edit Locked ({windowHours}h Correction Window Expired)</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                This session is locked per institutional policy. To amend a student&apos;s mark, submit a formal Attendance Correction Request for HOD approval.
              </p>
            </div>
          </div>
        )}

        {/* Topic Covered Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Topic / Module Covered <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={topicCovered}
            onChange={e => setTopicCovered(e.target.value)}
            placeholder="e.g. Module 2: Elasticity of Demand, Numerical Applications & Market Equilibrium"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white shadow-2xs"
          />
        </div>

        {/* Roster Controls & Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Present All
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Absent All
            </button>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
            >
              <option value="ALL">All Departments ({registeredStudents.length})</option>
              {homeDepts.map(d => (
                <option key={d?.id} value={d?.id}>
                  {d?.name} ({registeredStudents.filter(s => s.homeDepartmentId === d?.id).length})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search student / roll no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 w-full sm:w-44"
            />
          </div>
        </div>

        {/* Attendance Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-100 p-2.5 rounded-xl text-center text-xs font-bold">
          <div className="bg-white p-2 rounded-lg text-emerald-700 border border-emerald-100">
            Present: <span className="text-sm">{presentCount}</span>
          </div>
          <div className="bg-white p-2 rounded-lg text-rose-700 border border-rose-100">
            Absent: <span className="text-sm">{absentCount}</span>
          </div>
          <div className="bg-white p-2 rounded-lg text-indigo-700 border border-indigo-100">
            Duty Leave: <span className="text-sm">{dutyLeaveCount}</span>
          </div>
          <div className="bg-white p-2 rounded-lg text-purple-700 border border-purple-100">
            On Duty (OD): <span className="text-sm">{odCount}</span>
          </div>
          <div className="bg-white p-2 rounded-lg text-amber-700 border border-amber-100">
            Medical: <span className="text-sm">{medicalCount}</span>
          </div>
          <div className="bg-white p-2 rounded-lg text-slate-600 border border-slate-200">
            Cancelled: <span className="text-sm">{cancelledCount}</span>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No registered students found.</div>
            ) : (
              filteredStudents.map(student => {
                const currentStatus = studentStatuses[student.id]?.status || 'PRESENT';
                const homeDept = departments.find(d => d.id === student.homeDepartmentId);
                const prog = programmes.find(p => p.id === student.programmeId);

                return (
                  <div
                    key={student.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2.5 sm:gap-4 transition-colors ${
                      currentStatus === 'ABSENT'
                        ? 'bg-rose-50/40'
                        : currentStatus === 'DUTY_LEAVE'
                        ? 'bg-indigo-50/40'
                        : currentStatus === 'OD'
                        ? 'bg-purple-50/40'
                        : currentStatus === 'MEDICAL_LEAVE'
                        ? 'bg-amber-50/40'
                        : currentStatus === 'CANCELLED'
                        ? 'bg-slate-100/80 opacity-75'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                        {student.rollNumber}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <p className="text-sm font-bold text-slate-900 truncate">{student.fullName}</p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                            {prog?.code || homeDept?.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono truncate">
                          Adm: {student.admissionNumber} • Reg: {student.universityRegisterNumber || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'PRESENT')}
                        title="Present"
                        className={`px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        P
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'ABSENT')}
                        title="Absent"
                        className={`px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-800'
                        }`}
                      >
                        A
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'DUTY_LEAVE')}
                        title="Duty Leave (DL)"
                        className={`px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'DUTY_LEAVE'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-800'
                        }`}
                      >
                        DL
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'OD')}
                        title="On Duty (OD)"
                        className={`px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'OD'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-800'
                        }`}
                      >
                        OD
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'MEDICAL_LEAVE')}
                        title="Medical Leave"
                        className={`px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'MEDICAL_LEAVE'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                        }`}
                      >
                        ML
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'CANCELLED')}
                        title="Cancelled / Excluded"
                        className={`px-2 py-1.5 sm:py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          currentStatus === 'CANCELLED'
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                        }`}
                      >
                        CANC
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <span className="font-bold text-rose-600 uppercase text-[10px] tracking-wider bg-rose-200/60 px-1.5 py-0.5 rounded shrink-0">
              Database Error
            </span>
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-[11px] text-rose-600 mt-0.5">
                Attendance was not committed to Supabase. Your roster selections are preserved; please verify your network or click retry below.
              </p>
            </div>
          </div>
        )}

        {submitSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">Supabase confirmed: Attendance records successfully committed to database.</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isCorrectionLocked}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving to Supabase...</span>
              </>
            ) : isCorrectionLocked ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Window Closed (HOD Approval Req.)</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {session.attendanceSubmitted ? 'Update Attendance' : 'Submit & Finalize Attendance'}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
