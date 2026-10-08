import React, { useState } from 'react';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { StudentLeaveRequest, LeaveType } from '../../types';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileCheck,
  User,
  Calendar,
  Layers,
  Upload,
  Paperclip,
  Check,
  X
} from 'lucide-react';

export const LeaveRequestsView: React.FC = () => {
  const {
    leaveRequests,
    currentStudent,
    currentFaculty,
    submitLeaveRequest,
    reviewLeaveRequest
  } = usePersonalizedCollege();

  const { students, timetablePeriods } = useCollegeData();
  const { activeRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'MY_APPLICATIONS' | 'PENDING_APPROVALS'>('MY_APPLICATIONS');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Apply Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('OD');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isFullDay, setIsFullDay] = useState(true);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState<{ [id: string]: string }>({});

  const isStudent = activeRole === 'STUDENT';
  const canReview = ['TEACHER', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(activeRole);

  const myRequests = leaveRequests.filter(
    r => currentStudent && r.studentId === currentStudent.id
  );

  const pendingRequests = leaveRequests.filter(
    r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
  );

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !fromDate || !reason) return;

    await submitLeaveRequest({
      studentId: currentStudent.id,
      type: leaveType,
      fromDate,
      toDate: toDate || fromDate,
      isFullDay,
      affectedPeriodIds: isFullDay ? [] : selectedPeriods,
      reason,
      documentName: documentName || (leaveType === 'MEDICAL_LEAVE' ? 'Medical_Certificate.pdf' : 'Duty_Slip.pdf'),
      documentUrl: '#'
    });

    setIsApplyModalOpen(false);
    setReason('');
    setFromDate('');
    setToDate('');
    setDocumentName('');
    setSelectedPeriods([]);
  };

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const remarks = reviewRemarks[id] || (status === 'APPROVED' ? 'Approved by Tutor' : 'Rejected');
    await reviewLeaveRequest(id, status, remarks);
  };

  const togglePeriod = (pId: string) => {
    setSelectedPeriods(prev =>
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-amber-50 text-amber-800 rounded-xl">
            <FileText className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            OD & Leave Requests
          </h1>
        </div>

        {isStudent && (
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Apply Leave / OD
          </button>
        )}
      </div>

      {/* Tabs for Reviewers */}
      {canReview && (
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs w-full min-w-0">
          <button
            onClick={() => setActiveTab('PENDING_APPROVALS')}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'PENDING_APPROVALS'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Pending Approvals</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('MY_APPLICATIONS')}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'MY_APPLICATIONS'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>All Records ({leaveRequests.length})</span>
          </button>
        </div>
      )}

      {/* Content List */}
      <div className="space-y-4">
        {(!canReview || activeTab === 'MY_APPLICATIONS') && isStudent && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                My Submitted Applications
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {myRequests.length} record(s) found
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {myRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  You have not submitted any OD or leave requests yet.
                </div>
              ) : (
                myRequests.map(req => (
                  <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-800 uppercase">
                          {req.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {req.fromDate} {req.toDate !== req.fromDate && `to ${req.toDate}`}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          • {req.isFullDay ? 'Full Day' : `${req.affectedPeriodIds?.length || 0} Periods`}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-900">{req.reason}</p>

                      {req.reviewedByName && (
                        <p className="text-xs text-slate-500">
                          Reviewed by <span className="font-semibold text-slate-700">{req.reviewedByName}</span>: "{req.reviewRemarks || 'No remarks'}"
                        </p>
                      )}

                      {req.documentName && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-900 font-medium">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{req.documentName}</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {req.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {req.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                        {req.status === 'SUBMITTED' && <Clock className="w-3.5 h-3.5" />}
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Pending Approvals List for Staff */}
        {canReview && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {activeTab === 'PENDING_APPROVALS' ? 'Applications Pending Decision' : 'All Institutional Leave Requests'}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {(activeTab === 'PENDING_APPROVALS' ? pendingRequests : leaveRequests).length} entries
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {(activeTab === 'PENDING_APPROVALS' ? pendingRequests : leaveRequests).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No requests pending review.
                </div>
              ) : (
                (activeTab === 'PENDING_APPROVALS' ? pendingRequests : leaveRequests).map(req => {
                  const student = students.find(s => s.id === req.studentId);

                  return (
                    <div key={req.id} className="p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              {student?.fullName || 'Student'}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              ({student?.universityRegisterNumber || student?.admissionNumber})
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-50 text-rose-900 uppercase">
                              {req.type.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-medium">
                            <span className="text-slate-400">Date:</span> {req.fromDate}{' '}
                            {req.toDate !== req.fromDate && `to ${req.toDate}`} (
                            {req.isFullDay ? 'Full Day' : 'Selected Periods'})
                          </p>

                          <p className="text-sm font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            "{req.reason}"
                          </p>
                        </div>

                        {/* Review Action Controls */}
                        {req.status === 'SUBMITTED' ? (
                          <div className="flex flex-col sm:items-end gap-2 shrink-0">
                            <input
                              type="text"
                              placeholder="Review remarks..."
                              value={reviewRemarks[req.id] || ''}
                              onChange={e =>
                                setReviewRemarks({ ...reviewRemarks, [req.id]: e.target.value })
                              }
                              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-48"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReview(req.id, 'APPROVED')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve & Credit
                              </button>
                              <button
                                onClick={() => handleReview(req.id, 'REJECTED')}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold self-start ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {req.status} by {req.reviewedByName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Submit OD / Leave Application</h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="OD">On-Duty (OD) - Co-curricular / Inter-Collegiate</option>
                  <option value="SPORTS_OD">Sports / Athletics OD</option>
                  <option value="NSS_NCC_OD">NSS / NCC Sanctioned Duty</option>
                  <option value="MEDICAL_LEAVE">Medical Leave (Certificate Attached)</option>
                  <option value="AUTHORIZED_LEAVE">Authorized Personal Absence</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="fullDayCheck"
                  checked={isFullDay}
                  onChange={e => setIsFullDay(e.target.checked)}
                  className="rounded text-rose-900 focus:ring-rose-900"
                />
                <label htmlFor="fullDayCheck" className="font-bold text-slate-700 cursor-pointer">
                  Full Day Absence
                </label>
              </div>

              {!isFullDay && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Select Specific Periods Affected:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {timetablePeriods.map(p => {
                      const isSelected = selectedPeriods.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => togglePeriod(p.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-rose-900 text-white border-rose-900'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Period {p.periodNumber} ({p.startTime})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Justification</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="State clear purpose or medical symptoms..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Attach Supporting Slip / Medical Document
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={documentName}
                    onChange={e => setDocumentName(e.target.value)}
                    placeholder="e.g. Medical_Certificate_Hospital.pdf"
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <span className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" /> Attach
                  </span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-900 text-white rounded-xl font-bold hover:bg-rose-950"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
