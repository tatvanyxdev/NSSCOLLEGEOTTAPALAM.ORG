import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal, Badge } from '../common/UIComponents';
import { AttendanceStatus, ClassSession, Student } from '../../types';
import { AlertCircle, Send, Users, User, CheckSquare, Square } from 'lucide-react';

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClassSession | null;
  student?: Student | null;
}

export const AttendanceCorrectionModal: React.FC<AttendanceCorrectionModalProps> = ({
  isOpen,
  onClose,
  session,
  student
}) => {
  const {
    students,
    attendanceRecords,
    courses,
    courseOfferings,
    getCourseGroupRegisteredStudents,
    submitCorrectionRequest,
    submitBatchCorrectionRequest,
    settings
  } = useCollegeData();

  const { user } = useAuth();

  const [mode, setMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(student?.id || '');
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>(student ? [student.id] : []);
  const [requestedStatus, setRequestedStatus] = useState<AttendanceStatus>('PRESENT');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!session) return null;

  const offering = courseOfferings.find(o => o.id === session.courseOfferingId);
  const course = courses.find(c => c.id === offering?.courseId);

  // Group registered students
  const registeredStudents = getCourseGroupRegisteredStudents(session.courseGroupId);
  const sessionRecords = attendanceRecords.filter(r => r.classSessionId === session.id);

  // Find existing record for student if selected
  const activeStudentId = selectedStudentId || student?.id || '';
  const existingRecord = sessionRecords.find(r => r.studentId === activeStudentId);
  const oldStatus = existingRecord?.status || 'ABSENT';

  const toggleBatchStudent = (id: string) => {
    setBatchSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAllAbsent = () => {
    const absentIds = registeredStudents
      .filter(stu => {
        const rec = sessionRecords.find(r => r.studentId === stu.id);
        return rec?.status === 'ABSENT' || !rec;
      })
      .map(s => s.id);
    setBatchSelectedIds(absentIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setSubmitError('Please provide a legitimate justification/reason for the correction.');
      return;
    }

    if (mode === 'SINGLE') {
      if (!activeStudentId) {
        setSubmitError('Please select a student.');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      const res = await submitCorrectionRequest({
        studentId: activeStudentId,
        classSessionId: session.id,
        oldStatus,
        requestedStatus,
        reason,
        requestedByFacultyId: user?.id || 'fac-1'
      });

      setIsSubmitting(false);

      if (!res.success) {
        setSubmitError(res.error || 'Failed to submit correction request.');
        return;
      }
    } else {
      // BATCH MODE
      if (batchSelectedIds.length === 0) {
        setSubmitError('Please select at least one student for batch correction.');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      const items = batchSelectedIds.map(sId => {
        const rec = sessionRecords.find(r => r.studentId === sId);
        return {
          studentId: sId,
          oldStatus: rec?.status || 'ABSENT',
          requestedStatus
        };
      });

      const res = await submitBatchCorrectionRequest({
        classSessionId: session.id,
        reason,
        requestedByFacultyId: user?.id || 'fac-1',
        items
      });

      setIsSubmitting(false);

      if (!res.success) {
        setSubmitError(res.error || 'Failed to submit batch correction request.');
        return;
      }
    }

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Attendance Correction"
      subtitle={`Session: ${course?.courseCode} - ${course?.courseTitle} (${session.date})`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setMode('SINGLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mode === 'SINGLE'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Individual Student
          </button>
          <button
            type="button"
            onClick={() => setMode('BATCH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mode === 'BATCH'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Multi-Student Batch (OD / Concessions)
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Correction Policy:</strong> Attendance corrections past the{' '}
            <strong>{settings.attendanceCorrectionWindowHours}h window</strong> require formal verification and HOD approval. Every change is logged with timestamp and faculty identifier.
          </div>
        </div>

        {mode === 'SINGLE' ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Student --</option>
              {registeredStudents.map(s => {
                const rec = sessionRecords.find(r => r.studentId === s.id);
                return (
                  <option key={s.id} value={s.id}>
                    {s.rollNumber} - {s.fullName} (Currently: {rec?.status || 'ABSENT'})
                  </option>
                );
              })}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Select Students for Batch Correction ({batchSelectedIds.length} selected)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllAbsent}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Select All Absent
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setBatchSelectedIds(registeredStudents.map(s => s.id))}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setBatchSelectedIds([])}
                  className="text-[11px] font-semibold text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 p-1">
              {registeredStudents.map(s => {
                const rec = sessionRecords.find(r => r.studentId === s.id);
                const isSelected = batchSelectedIds.includes(s.id);
                const curStatus = rec?.status || 'ABSENT';

                return (
                  <div
                    key={s.id}
                    onClick={() => toggleBatchStudent(s.id)}
                    className={`p-2 flex items-center justify-between rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-slate-900">{s.rollNumber} - {s.fullName}</span>
                        <span className="text-[11px] text-slate-500 ml-1.5">({s.admissionNumber})</span>
                      </div>
                    </div>
                    <Badge
                      variant={curStatus === 'PRESENT' ? 'success' : curStatus === 'OD' ? 'purple' : 'danger'}
                      size="sm"
                    >
                      {curStatus}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {mode === 'SINGLE' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Marked Status</label>
              <div className="px-3.5 py-2.5 rounded-lg bg-slate-100 border border-slate-200 text-sm font-bold text-slate-700">
                {oldStatus}
              </div>
            </div>
          )}

          <div className={mode === 'BATCH' ? 'col-span-2' : ''}>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Requested Status</label>
            <select
              value={requestedStatus}
              onChange={e => setRequestedStatus(e.target.value as AttendanceStatus)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="PRESENT">PRESENT</option>
              <option value="OD">ON DUTY (OD)</option>
              <option value="MEDICAL_LEAVE">MEDICAL LEAVE</option>
              <option value="APPROVED_LEAVE">APPROVED LEAVE</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Reason & Documentation Reference <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Students attended University Inter-Collegiate Quiz competition with formal approval from Principal & Student Affairs Council."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Submission Error:</span> {submitError}
            </div>
          </div>
        )}

        {submitSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <span className="font-bold">Success!</span> {mode === 'BATCH' ? `${batchSelectedIds.length} correction requests` : 'Correction request'} submitted for HOD review.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || submitSuccess}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Submitting to Supabase...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{mode === 'BATCH' ? `Submit Batch (${batchSelectedIds.length})` : 'Submit Request'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
