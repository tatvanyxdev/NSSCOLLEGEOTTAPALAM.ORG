import React, { useState, useMemo } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { FacultySubjectRequest, CourseType, Course } from '../../types';
import { Modal, Badge } from '../common/UIComponents';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  Building,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';

interface HodSubjectReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FacultySubjectRequest;
  onSuccess?: () => void;
}

export const HodSubjectReviewModal: React.FC<HodSubjectReviewModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess
}) => {
  const {
    faculty,
    departments,
    courses,
    courseCategories,
    courseOfferings,
    courseGroups,
    settings,
    reviewFacultySubjectRequest
  } = useCollegeData();

  const { user } = useAuth();

  // Find requesting teacher
  const requestingTeacher = useMemo(() => {
    return (
      faculty.find(
        f =>
          f.id === request.requestedBy ||
          f.id === request.requestedByFacultyId ||
          (f.email && request.requestedBy && f.email.toLowerCase() === request.requestedBy.toLowerCase())
      ) || null
    );
  }, [faculty, request]);

  const requestingDept = departments.find(d => d.id === request.departmentId);

  // Approval configuration states
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT' | 'CHANGES'>('APPROVE');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    request.existingCourseId ||
      courses.find(c => c.courseTitle.toLowerCase() === request.courseName.toLowerCase())?.id ||
      ''
  );
  const [isProvisionalApproval, setIsProvisionalApproval] = useState<boolean>(
    request.isProvisional || !request.existingCourseId
  );
  const [confirmedCourseCode, setConfirmedCourseCode] = useState<string>(
    request.proposedCourseCode || `TEMP-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [confirmedCourseName, setConfirmedCourseName] = useState<string>(request.courseName);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(request.existingCourseGroupId || '');
  const [newGroupName, setNewGroupName] = useState<string>(
    request.proposedGroupName || `${request.courseName} - Batch A`
  );
  const [assignmentRole, setAssignmentRole] = useState<'PRIMARY' | 'CO_TEACHER'>('PRIMARY');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Existing matching courses
  const matchingCourses = useMemo(() => {
    const q = request.courseName.toLowerCase();
    return courses.filter(
      c =>
        c.courseTitle.toLowerCase().includes(q) ||
        (request.proposedCourseCode && c.courseCode.toLowerCase() === request.proposedCourseCode.toLowerCase())
    );
  }, [courses, request]);

  // Offerings for chosen course
  const courseOfferingsList = useMemo(() => {
    if (!selectedCourseId) return [];
    return courseOfferings.filter(o => o.courseId === selectedCourseId);
  }, [courseOfferings, selectedCourseId]);

  // Groups for chosen offering
  const availableGroups = useMemo(() => {
    if (!selectedOfferingId) return [];
    return courseGroups.filter(g => g.courseOfferingId === selectedOfferingId);
  }, [courseGroups, selectedOfferingId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const reviewerId = user?.id || 'hod-faculty';

    if (approvalAction === 'REJECT' && !reviewNotes.trim()) {
      setErrorMessage('Please provide a reason for rejecting this subject request.');
      return;
    }

    if (approvalAction === 'CHANGES' && !reviewNotes.trim()) {
      setErrorMessage('Please specify what changes the faculty member needs to make.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (approvalAction === 'APPROVE') {
        const result = await reviewFacultySubjectRequest(
          request.id,
          'APPROVED',
          reviewNotes.trim() || 'Approved by Head of Department',
          reviewerId,
          {
            courseId: selectedCourseId || undefined,
            courseOfferingId: selectedOfferingId || undefined,
            courseGroupId: selectedGroupId || undefined,
            targetFacultyId: requestingTeacher?.id || request.requestedBy,
            departmentId: request.departmentId,
            isProvisional: isProvisionalApproval,
            proposedCourseCode: confirmedCourseCode.trim(),
            courseName: confirmedCourseName.trim(),
            groupName: newGroupName.trim(),
            courseType: request.courseType,
            programmeId: request.programmeId,
            semesterNumber: request.semesterNumber,
            academicYear: request.academicYear || settings.activeAcademicYear
          }
        );

        if (!result.success) {
          setErrorMessage(result.error || 'Failed to approve subject request.');
          setIsSubmitting(false);
          return;
        }
      } else if (approvalAction === 'REJECT') {
        const result = await reviewFacultySubjectRequest(
          request.id,
          'REJECTED',
          reviewNotes.trim(),
          reviewerId
        );
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to reject request.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const result = await reviewFacultySubjectRequest(
          request.id,
          'NEEDS_CHANGES',
          reviewNotes.trim(),
          reviewerId
        );
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to return request.');
          setIsSubmitting(false);
          return;
        }
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error processing request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Faculty Subject Request"
      subtitle={`Submitted by ${requestingTeacher?.fullName || 'Faculty Member'}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleReviewSubmit} className="p-4 sm:p-6 space-y-5">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Teacher Details Summary Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
              {requestingTeacher?.fullName?.charAt(0) || <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {requestingTeacher?.fullName || 'Faculty Member'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                  {requestingTeacher?.designation || 'Faculty'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {requestingDept?.name || 'Department'} • {requestingTeacher?.email || 'N/A'} • {requestingTeacher?.employeeCode || requestingTeacher?.employeeId || 'Code N/A'}
              </p>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-3">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Request Date</span>
            <span className="font-mono text-slate-700 font-semibold">
              {new Date(request.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Request Specifications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Requested Subject Particulars
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
              {request.courseType}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Subject Name:</span>
              <span className="font-bold text-slate-900 text-sm">{request.courseName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Proposed / Temp Code:</span>
              <span className="font-mono font-bold text-slate-800">
                {request.proposedCourseCode || 'TEMP (Auto-generated)'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Semester & Academic Year:</span>
              <span className="font-semibold text-slate-800">
                Semester {request.semesterNumber} • AY {request.academicYear || '2026-27'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Proposed Section / Group:</span>
              <span className="font-semibold text-slate-800">
                {request.proposedGroupName || 'General Group (Batch A)'}
              </span>
            </div>
          </div>

          {request.requestNotes && (
            <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
              <span className="font-bold block text-[11px] mb-0.5">Faculty Notes:</span>
              <p className="italic">{request.requestNotes}</p>
            </div>
          )}
        </div>

        {/* Action Decision Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            HOD Decision & Action
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setApprovalAction('APPROVE')}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                approvalAction === 'APPROVE'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Allocate</span>
            </button>
            <button
              type="button"
              onClick={() => setApprovalAction('CHANGES')}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                approvalAction === 'CHANGES'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Request Changes</span>
            </button>
            <button
              type="button"
              onClick={() => setApprovalAction('REJECT')}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                approvalAction === 'REJECT'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Request</span>
            </button>
          </div>
        </div>

        {/* Approval Configuration (shown only if APPROVE) */}
        {approvalAction === 'APPROVE' && (
          <div className="space-y-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                Allocation & Course Linkage Setup
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Ready to Allocate
              </span>
            </div>

            {/* Catalog Linkage Option */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">
                Link to Course in College Catalogue
              </label>
              <select
                value={selectedCourseId}
                onChange={e => {
                  setSelectedCourseId(e.target.value);
                  const found = courses.find(c => c.id === e.target.value);
                  if (found) {
                    setConfirmedCourseCode(found.courseCode);
                    setConfirmedCourseName(found.courseTitle);
                    setIsProvisionalApproval(found.courseCode.startsWith('TEMP-'));
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value="">-- Create or Keep as Provisional Course --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} - {c.courseTitle} ({departments.find(d => d.id === c.departmentId)?.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Course Code & Name Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Confirmed Course Code
                </label>
                <input
                  type="text"
                  value={confirmedCourseCode}
                  onChange={e => setConfirmedCourseCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Teaching Role
                </label>
                <select
                  value={assignmentRole}
                  onChange={e => setAssignmentRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                >
                  <option value="PRIMARY">Primary Instructor (Attendance Lead)</option>
                  <option value="CO_TEACHER">Co-Teacher / Lab Instructor</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Course Group / Section Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. Batch A, Practical Lab 1"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Students will be enrolled into this exact group for verified attendance marking.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Upon approval, this subject will immediately activate in <strong className="font-bold">{requestingTeacher?.fullName}</strong>'s attendance dashboard and timetable allocation.
              </span>
            </div>
          </div>
        )}

        {/* Review Notes / Justification */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {approvalAction === 'APPROVE'
              ? 'Approval Remarks / Allocation Note (Optional)'
              : approvalAction === 'REJECT'
              ? 'Rejection Reason (Required) *'
              : 'Required Changes Note for Faculty (Required) *'}
          </label>
          <textarea
            rows={2}
            required={approvalAction !== 'APPROVE'}
            placeholder={
              approvalAction === 'APPROVE'
                ? 'e.g. Approved as primary faculty for FYUGP Batch CS-A.'
                : approvalAction === 'REJECT'
                ? 'e.g. Subject workload already filled by another faculty member.'
                : 'e.g. Please clarify your available practical lab hours.'
            }
            value={reviewNotes}
            onChange={e => setReviewNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>

        {/* Footer Actions */}
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
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 ${
              approvalAction === 'APPROVE'
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                : approvalAction === 'CHANGES'
                ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
            }`}
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>
                  {approvalAction === 'APPROVE'
                    ? 'Confirm & Allocate Subject'
                    : approvalAction === 'CHANGES'
                    ? 'Submit Change Request'
                    : 'Confirm Rejection'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
