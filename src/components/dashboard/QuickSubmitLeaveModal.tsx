import React, { useState } from 'react';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { LeaveType } from '../../types';
import { Modal, Badge } from '../common/UIComponents';
import {
  FileText,
  Calendar,
  Clock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Award,
  HeartPulse,
  UserCheck,
  Paperclip
} from 'lucide-react';

interface QuickSubmitLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickSubmitLeaveModal: React.FC<QuickSubmitLeaveModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentStudent, submitLeaveRequest } = usePersonalizedCollege();
  const { students, timetablePeriods } = useCollegeData();
  const { activeRole, user } = useAuth();

  const isStudent = activeRole === 'STUDENT';

  // State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    currentStudent?.id || (students.length > 0 ? students[0].id : '')
  );
  const [leaveType, setLeaveType] = useState<LeaveType>('OD');
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [isFullDay, setIsFullDay] = useState(true);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Target student record
  const targetStudent = isStudent
    ? currentStudent || students.find(s => s.id === user?.id) || students[0]
    : students.find(s => s.id === selectedStudentId);

  const togglePeriod = (pId: string) => {
    setSelectedPeriods(prev =>
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const studentIdToUse = targetStudent?.id || selectedStudentId;
    if (!studentIdToUse) {
      setErrorMessage('Please select an active student profile.');
      return;
    }

    if (!fromDate) {
      setErrorMessage('Please select a start date.');
      return;
    }

    if (!isFullDay && selectedPeriods.length === 0) {
      setErrorMessage('Please select at least one affected period or choose Full Day.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Please provide a reason for the leave/OD request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const defaultDocName =
        leaveType === 'MEDICAL_LEAVE'
          ? 'Medical_Certificate.pdf'
          : leaveType === 'SPORTS_OD' || leaveType === 'NSS_NCC_OD'
          ? 'Duty_Deputation_Order.pdf'
          : 'OD_Duty_Slip.pdf';

      const res = await submitLeaveRequest({
        studentId: studentIdToUse,
        type: leaveType,
        fromDate,
        toDate: toDate || fromDate,
        isFullDay,
        affectedPeriodIds: isFullDay ? [] : selectedPeriods,
        reason: reason.trim(),
        documentName: documentName.trim() || defaultDocName,
        documentUrl: '#'
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to submit leave application.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Leave application submitted successfully for Tutor/HOD review!');
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage(null);
        setReason('');
        setSelectedPeriods([]);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while submitting.');
      setIsSubmitting(false);
    }
  };

  const leaveTypeOptions: { type: LeaveType; label: string; desc: string; icon: any; color: string }[] = [
    {
      type: 'OD',
      label: 'On-Duty (OD)',
      desc: 'Seminars, Workshops, College Events',
      icon: Award,
      color: 'border-purple-200 bg-purple-50/60 text-purple-900'
    },
    {
      type: 'SPORTS_OD',
      label: 'Sports / Arts OD',
      desc: 'Tournaments, NSS / NCC Camps',
      icon: UserCheck,
      color: 'border-blue-200 bg-blue-50/60 text-blue-900'
    },
    {
      type: 'MEDICAL_LEAVE',
      label: 'Medical Leave',
      desc: 'Health reasons with doctor note',
      icon: HeartPulse,
      color: 'border-rose-200 bg-rose-50/60 text-rose-900'
    },
    {
      type: 'AUTHORIZED_LEAVE',
      label: 'Casual / Personal Leave',
      desc: 'Authorized personal absence',
      icon: FileText,
      color: 'border-amber-200 bg-amber-50/60 text-amber-900'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit OD & Leave Application"
      subtitle="Quick submission desk for student attendance exemption and tutor review"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Student Context Card */}
        {isStudent && targetStudent ? (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">{targetStudent.fullName}</div>
              <div className="text-[11px] text-slate-500">
                Roll No: {targetStudent.rollNumber} • Adm: {targetStudent.admissionNumber} • Batch: {targetStudent.admissionBatch}
              </div>
            </div>
            <Badge variant="info" size="sm">
              Student Applicant
            </Badge>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Select Student Applicant <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.rollNumber || s.admissionNumber}) - Sem {s.currentSemester}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Leave Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Application Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {leaveTypeOptions.map(opt => {
              const Icon = opt.icon;
              const isSelected = leaveType === opt.type;
              return (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setLeaveType(opt.type)}
                  className={`p-3 text-left rounded-xl border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-rose-800 bg-rose-50/70 shadow-xs ring-1 ring-rose-800'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <span className={`p-1.5 rounded-lg shrink-0 ${opt.color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              From Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={e => {
                  setFromDate(e.target.value);
                  if (!toDate || e.target.value > toDate) setToDate(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Full Day vs Specific Periods */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Leave Duration & Scope
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullDay(true)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  isFullDay
                    ? 'bg-rose-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Full Day
              </button>
              <button
                type="button"
                onClick={() => setIsFullDay(false)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  !isFullDay
                    ? 'bg-rose-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Specific Periods
              </button>
            </div>
          </div>

          {!isFullDay && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-[11px] text-slate-600 font-medium">
                Select periods for which attendance exemption is requested:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {(timetablePeriods.length > 0
                  ? timetablePeriods
                  : [
                      { id: 'p1', periodNumber: 1, label: 'Period 1', startTime: '09:30', endTime: '10:30' },
                      { id: 'p2', periodNumber: 2, label: 'Period 2', startTime: '10:30', endTime: '11:30' },
                      { id: 'p3', periodNumber: 3, label: 'Period 3', startTime: '11:45', endTime: '12:45' },
                      { id: 'p4', periodNumber: 4, label: 'Period 4', startTime: '01:30', endTime: '02:30' },
                      { id: 'p5', periodNumber: 5, label: 'Period 5', startTime: '02:30', endTime: '03:30' }
                    ]
                ).map((p: any) => {
                  const isChecked = selectedPeriods.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => togglePeriod(p.id)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isChecked
                          ? 'border-rose-800 bg-rose-50 text-rose-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs">{p.label || `P${p.periodNumber}`}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{p.startTime}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Reason / Purpose of Leave <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Attending Calicut University Inter-Collegiate Arts Festival at Palakkad, or Doctor prescribed rest for viral fever"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
            required
          />
        </div>

        {/* Supporting Document */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Supporting Document / Slip (Optional)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Paperclip className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={documentName}
                onChange={e => setDocumentName(e.target.value)}
                placeholder="e.g. Medical_Certificate_Hospital.pdf or Duty_Order_2026.pdf"
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => setDocumentName(`Doc_${Date.now().toString().slice(-4)}.pdf`)}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors whitespace-nowrap"
            >
              Attach Sample
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-rose-900 hover:bg-rose-950 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>Submit Application</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
