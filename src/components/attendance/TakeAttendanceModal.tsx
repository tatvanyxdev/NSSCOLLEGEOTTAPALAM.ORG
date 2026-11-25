import React, { useState, useEffect, useRef } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceStatus, ClassSession } from '../../types';
import { Modal } from '../common/UIComponents';
import { inferPeriodSession } from '../../utils/dualAttendanceEngine';
import {
  CheckCircle2,
  XCircle,
  Ban,
  Save,
  Lock,
  Search
} from 'lucide-react';

interface TakeAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClassSession | null;
}

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  short: string;
  label: string;
  activeClass: string;
}[] = [
  { value: 'PRESENT', short: 'P', label: 'Present', activeClass: 'bg-emerald-600 text-white shadow-2xs' },
  { value: 'ABSENT', short: 'A', label: 'Absent', activeClass: 'bg-rose-600 text-white shadow-2xs' },
  { value: 'DUTY_LEAVE', short: 'DL', label: 'Duty Leave', activeClass: 'bg-indigo-600 text-white shadow-2xs' },
  { value: 'OD', short: 'OD', label: 'On Duty (OD)', activeClass: 'bg-purple-600 text-white shadow-2xs' },
  { value: 'MEDICAL_LEAVE', short: 'ML', label: 'Medical Leave', activeClass: 'bg-amber-600 text-white shadow-2xs' },
  { value: 'CANCELLED', short: 'CANC', label: 'Cancelled / Excluded', activeClass: 'bg-slate-700 text-white shadow-2xs' }
];

export const TakeAttendanceModal: React.FC<TakeAttendanceModalProps> = ({
  isOpen,
  onClose,
  session
}) => {
  const {
    courseOfferings,
    courses,
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

  const offering = courseOfferings.find(o => o.id === session?.courseOfferingId);
  const course = courses.find(c => c.id === offering?.courseId);
  const group = courseGroups.find(g => g.id === session?.courseGroupId);
  const period = timetablePeriods.find(p => p.id === session?.periodId);
  const assignedFaculty = faculty.find(f => f.id === session?.facultyId);

  const registeredStudents = session ? getCourseGroupRegisteredStudents(session.courseGroupId) : [];

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
    setFilterDept('ALL');
    setSearchQuery('');
    setErrorMessage(null);
    setSubmitSuccess(false);

    const existingRecords = attendanceRecords.filter(r => r.classSessionId === session.id);
    const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    registeredStudents.forEach(stu => {
      const existing = existingRecords.find(r => r.studentId === stu.id);
      initialMap[stu.id] = existing
        ? { status: existing.status, remarks: existing.remarks || '' }
        : { status: 'PRESENT', remarks: '' };
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
        title="Attendance"
        subtitle={`Date: ${session.date}`}
        maxWidth="max-w-md"
      >
        <div className="p-4 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            Course details for this session could not be loaded.
          </p>
          <p className="text-xs text-slate-500">
            Refresh sync from the top bar and try again.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
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
        status,
        remarks: prev[studentId]?.remarks || ''
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
        `Correction window (${windowHours}h) expired. Submit an Attendance Correction Request for HOD approval.`
      );
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    const records = registeredStudents.map(stu => ({
      studentId: stu.id,
      status: studentStatuses[stu.id]?.status || 'PRESENT',
      remarks: studentStatuses[stu.id]?.remarks || ''
    }));

    const res = await submitAttendance(session.id, records, topicCovered.trim() || undefined);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Could not save attendance. Please retry.');
      return;
    }

    setSubmitSuccess(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

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
  const sessionPercent = activeStudents > 0 ? `${Math.round((attendedCount / activeStudents) * 100)}%` : 'N/A';
  const sessionSlot = inferPeriodSession(period, session.periodId);

  const q = searchQuery.trim().toLowerCase();
  const filteredStudents = registeredStudents.filter(stu => {
    const matchesDept = filterDept === 'ALL' || stu.homeDepartmentId === filterDept;
    const matchesSearch =
      !q ||
      stu.fullName.toLowerCase().includes(q) ||
      stu.rollNumber.toLowerCase().includes(q) ||
      stu.admissionNumber.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  const homeDepts = Array.from(new Set(registeredStudents.map(s => s.homeDepartmentId)))
    .map(deptId => departments.find(d => d.id === deptId))
    .filter(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${course.courseCode} · ${course.courseTitle}`}
      subtitle={`${period?.label || 'Period'} (${sessionSlot}) · ${session.date} · ${group?.groupName || 'Batch'}`}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Compact Session Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600">
            <span className="font-semibold text-slate-900">
              {period?.label || 'Period'} ({sessionSlot})
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {session.startTime || period?.startTime || '09:30'}–{session.endTime || period?.endTime || '10:30'}
            </span>
            {group?.room && (
              <>
                <span aria-hidden="true">·</span>
                <span>{group.room}</span>
              </>
            )}
            {assignedFaculty?.fullName && (
              <>
                <span aria-hidden="true">·</span>
                <span>{assignedFaculty.fullName}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span className="font-bold text-slate-900">
              {attendedCount}/{activeStudents}
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-bold text-emerald-700">{sessionPercent}</span>
          </div>
        </div>

        {isCorrectionLocked && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Locked ({windowHours}h window expired).</strong> Use Attendance Corrections for changes.
            </span>
          </div>
        )}

        {/* Single-Row Quick Controls & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isCorrectionLocked}
              onClick={() => handleMarkAll('PRESENT')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All Present</span>
            </button>
            <button
              type="button"
              disabled={isCorrectionLocked}
              onClick={() => handleMarkAll('ABSENT')}
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>All Absent</span>
            </button>
            <button
              type="button"
              disabled={isCorrectionLocked}
              onClick={() => handleMarkAll('CANCELLED')}
              title="Mark entire slot cancelled"
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Period</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end min-w-[180px]">
            {homeDepts.length > 1 && (
              <select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px]"
              >
                <option value="ALL">All ({registeredStudents.length})</option>
                {homeDepts.map(d => (
                  <option key={d?.id} value={d?.id}>
                    {d?.code || d?.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search roll / name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Optional Topic Row */}
        <input
          type="text"
          value={topicCovered}
          disabled={isCorrectionLocked}
          onChange={e => setTopicCovered(e.target.value)}
          placeholder="Topic covered (optional, e.g. Unit 2)"
          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />

        {/* Compact High-Density Student Roster */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="max-h-[46vh] overflow-y-auto divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No registered students found.
              </div>
            ) : (
              filteredStudents.map(student => {
                const currentStatus = studentStatuses[student.id]?.status || 'PRESENT';
                const homeDept = departments.find(d => d.id === student.homeDepartmentId);
                const prog = programmes.find(p => p.id === student.programmeId);

                const rowTint =
                  currentStatus === 'ABSENT'
                    ? 'bg-rose-50/50'
                    : currentStatus === 'DUTY_LEAVE'
                    ? 'bg-indigo-50/40'
                    : currentStatus === 'OD'
                    ? 'bg-purple-50/40'
                    : currentStatus === 'MEDICAL_LEAVE'
                    ? 'bg-amber-50/40'
                    : currentStatus === 'CANCELLED'
                    ? 'bg-slate-100/70 opacity-75'
                    : 'bg-white hover:bg-slate-50/80';

                return (
                  <div
                    key={student.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 gap-2 transition-colors duration-150 ${rowTint}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-800 text-xs tabular-nums shrink-0">
                        {student.rollNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate leading-tight">
                          {student.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {prog?.code || homeDept?.code || 'FYUGP'}
                          {student.universityRegisterNumber ? ` · ${student.universityRegisterNumber}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Unified Segmented Status Control */}
                    <div
                      className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 self-end sm:self-auto"
                      role="group"
                      aria-label={`Attendance for ${student.fullName}`}
                    >
                      {STATUS_OPTIONS.map(opt => {
                        const isActive = currentStatus === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={isCorrectionLocked}
                            title={opt.label}
                            onClick={() => handleStatusChange(student.id, opt.value)}
                            className={`min-w-[30px] px-2 py-1 rounded-md text-[11px] font-bold transition-colors duration-150 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${
                              isActive
                                ? opt.activeClass
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                            }`}
                          >
                            {opt.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
            {errorMessage}
          </div>
        )}

        {submitSuccess && (
          <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Attendance saved.</span>
          </div>
        )}

        {/* Compact Summary + Actions Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono tabular-nums text-slate-600">
            <span className="text-emerald-700 font-semibold">P: {presentCount}</span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-700 font-semibold">A: {absentCount}</span>
            <span aria-hidden="true">·</span>
            <span className="text-indigo-700 font-semibold">DL: {dutyLeaveCount}</span>
            {odCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-purple-700 font-semibold">OD: {odCount}</span>
              </>
            )}
            {medicalCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-semibold">ML: {medicalCount}</span>
              </>
            )}
            {cancelledCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600 font-semibold">CANC: {cancelledCount}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isCorrectionLocked || registeredStudents.length === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : isCorrectionLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{session.attendanceSubmitted ? 'Update Attendance' : 'Save Attendance'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
