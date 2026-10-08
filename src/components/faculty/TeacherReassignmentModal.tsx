import React, { useState, useMemo } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../common/UIComponents';
import {
  UserCheck,
  RefreshCw,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight
} from 'lucide-react';

interface TeacherReassignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedGroupId?: string;
  onSuccess?: () => void;
}

export const TeacherReassignmentModal: React.FC<TeacherReassignmentModalProps> = ({
  isOpen,
  onClose,
  preselectedGroupId,
  onSuccess
}) => {
  const {
    courseGroups,
    courseOfferings,
    courses,
    faculty,
    facultyAssignments,
    departments,
    reassignFacultySubject
  } = useCollegeData();

  const { user } = useAuth();

  // Find assigned subjects eligible for reassignment
  const activeAssignments = useMemo(() => {
    return facultyAssignments.filter(fa => fa.isActive !== false);
  }, [facultyAssignments]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    preselectedGroupId || activeAssignments[0]?.courseGroupId || ''
  );

  // Current assignment details for selected group
  const currentAssignment = useMemo(() => {
    return activeAssignments.find(fa => fa.courseGroupId === selectedGroupId) || null;
  }, [activeAssignments, selectedGroupId]);

  const selectedGroup = courseGroups.find(g => g.id === selectedGroupId);
  const selectedOffering = courseOfferings.find(
    o => o.id === currentAssignment?.courseOfferingId || o.id === selectedGroup?.courseOfferingId
  );
  const selectedCourse = courses.find(c => c.id === selectedOffering?.courseId);
  const currentTeacher = faculty.find(f => f.id === currentAssignment?.facultyId);
  const courseDept = departments.find(d => d.id === selectedCourse?.departmentId);

  // Eligible replacement teachers in same department (or college)
  const candidateTeachers = useMemo(() => {
    return faculty.filter(f => f.id !== currentAssignment?.facultyId && f.isActive !== false);
  }, [faculty, currentAssignment]);

  const [newFacultyId, setNewFacultyId] = useState<string>(candidateTeachers[0]?.id || '');
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('Mid-semester workload redistribution');
  const [updateTimetable, setUpdateTimetable] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDone, setSuccessDone] = useState(false);

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedGroupId) {
      setErrorMessage('Please select a course group.');
      return;
    }
    if (!currentAssignment || !currentAssignment.facultyId) {
      setErrorMessage('No active teacher is currently assigned to this course group.');
      return;
    }
    if (!newFacultyId) {
      setErrorMessage('Please select the new replacement teacher.');
      return;
    }
    if (!effectiveDate) {
      setErrorMessage('Please specify the effective date.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Please provide a reason for the reassignment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await reassignFacultySubject({
        assignmentId: currentAssignment.id,
        courseGroupId: selectedGroupId,
        courseOfferingId: currentAssignment.courseOfferingId,
        departmentId: selectedCourse?.departmentId || departments[0]?.id || '',
        currentFacultyId: currentAssignment.facultyId,
        newFacultyId,
        effectiveDate,
        reason: reason.trim(),
        assignedBy: user?.id || 'hod-authority',
        updateTimetable
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to reassign teacher.');
        setIsSubmitting(false);
        return;
      }

      setSuccessDone(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Subject Teacher"
      subtitle="Safely transition teaching responsibility without losing past attendance records"
      maxWidth="max-w-xl"
    >
      {successDone ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Teaching Assignment Reassigned!</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              The subject has been successfully transitioned. Historical attendance taken by the previous teacher remains 100% intact and immutable.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleReassignSubmit} className="p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Historical Attendance Protection Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900 block mb-0.5">
                Attendance Continuity & Audit Guarantee:
              </span>
              <span>
                All past class sessions, attendance registers, and marks recorded by the outgoing teacher remain permanently preserved and immutable. The new teacher will conduct attendance from the specified effective date onward.
              </span>
            </div>
          </div>

          {/* Subject / Group Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Subject & Course Group *
            </label>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
            >
              {activeAssignments.map(fa => {
                const grp = courseGroups.find(g => g.id === fa.courseGroupId);
                const off = courseOfferings.find(o => o.id === fa.courseOfferingId || o.id === grp?.courseOfferingId);
                const crs = courses.find(c => c.id === off?.courseId);
                const fac = faculty.find(f => f.id === fa.facultyId);
                return (
                  <option key={fa.id} value={fa.courseGroupId}>
                    {crs?.courseCode || 'Course'} - {crs?.courseTitle} ({grp?.groupName}) [Current: {fac?.fullName}]
                  </option>
                );
              })}
            </select>
          </div>

          {/* Transition Visual Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Outgoing Teacher */}
            <div className="space-y-1 p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Current Assigned Teacher
              </span>
              <span className="font-bold text-slate-900 text-sm block">
                {currentTeacher?.fullName || 'Not Assigned'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {currentTeacher?.designation || 'Faculty'}
              </span>
              <span className="text-[10px] text-rose-600 font-semibold block pt-1">
                Role will conclude on transition
              </span>
            </div>

            {/* Incoming Teacher Selector */}
            <div className="space-y-1 p-2.5 rounded-lg bg-white border border-blue-200">
              <span className="text-[10px] font-bold uppercase text-blue-700 block">
                New Assigned Teacher *
              </span>
              <select
                value={newFacultyId}
                onChange={e => setNewFacultyId(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-blue-50/50 border border-blue-200 rounded-lg font-bold text-slate-900 mt-1"
              >
                {candidateTeachers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.fullName} ({departments.find(d => d.id === f.departmentId)?.code || 'Dept'})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-emerald-600 font-semibold block pt-1">
                Takes over from effective date
              </span>
            </div>
          </div>

          {/* Transition Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Effective Transition Date *
              </label>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={e => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Timetable Automatic Update
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateTimetable}
                  onChange={e => setUpdateTimetable(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-slate-700 font-medium">
                  Update timetable slots for new teacher
                </span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reassignment Reason / Justification *
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Faculty medical leave replacement, semester load redistribution, sabbatical cover..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Reassigning...</span>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Execute Teacher Reassignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
