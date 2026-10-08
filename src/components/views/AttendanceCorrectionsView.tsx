import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Badge } from '../common/UIComponents';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  User,
  ShieldCheck,
  History
} from 'lucide-react';

export const AttendanceCorrectionsView: React.FC = () => {
  const {
    correctionRequests,
    students,
    classSessions,
    courses,
    courseOfferings,
    faculty,
    reviewCorrectionRequest,
    settings
  } = useCollegeData();

  const { user, activeRole } = useAuth();
  const canApprove = can(activeRole, 'attendance', 'approve_correction');
  const currentFaculty = faculty.find(f => f.id === user?.id || f.email === user?.email);
  const hodDeptId = activeRole === 'HOD' ? (user?.departmentId || currentFaculty?.departmentId) : undefined;

  const [filterTab, setFilterTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [rejectRemarks, setRejectRemarks] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredRequests = correctionRequests.filter(r => {
    if (filterTab !== 'ALL' && r.status !== filterTab) return false;

    // HOD scoping: strictly restrict requests to HOD department offerings
    if (hodDeptId) {
      const session = classSessions.find(s => s.id === r.classSessionId);
      const offering = courseOfferings.find(o => o.id === session?.courseOfferingId);
      if (offering?.departmentId && offering.departmentId !== hodDeptId) {
        return false;
      }
    }

    return true;
  });

  const handleApprove = async (requestId: string) => {
    if (!canApprove || processingId) return;
    setActionMessage(null);
    if (confirm('Are you sure you want to APPROVE this attendance correction? The student attendance record will be modified in Supabase PostgreSQL immediately.')) {
      setProcessingId(requestId);
      const res = await reviewCorrectionRequest(requestId, 'APPROVED', 'Approved by authorized HOD / Admin.');
      setProcessingId(null);
      if (!res.success) {
        setActionMessage({
          type: 'error',
          text: res.error || 'Failed to update attendance correction in Supabase database.'
        });
      } else {
        setActionMessage({
          type: 'success',
          text: 'Supabase confirmed: Attendance correction approved and audit trail logged.'
        });
        setTimeout(() => setActionMessage(null), 4000);
      }
    }
  };

  const handleReject = async (requestId: string) => {
    if (!canApprove || processingId) return;
    setActionMessage(null);
    const remarks = prompt('Please enter rejection remarks / reason:') || 'Insufficient documentation provided.';
    setProcessingId(requestId);
    const res = await reviewCorrectionRequest(requestId, 'REJECTED', remarks);
    setProcessingId(null);
    if (!res.success) {
      setActionMessage({
        type: 'error',
        text: res.error || 'Failed to update rejection in Supabase database.'
      });
    } else {
      setActionMessage({
        type: 'success',
        text: 'Supabase confirmed: Attendance correction marked as rejected.'
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">Attendance Corrections</h2>
          <Badge variant="purple" size="sm">
            HOD Review
          </Badge>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({correctionRequests.filter(r => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilterTab('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'APPROVED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({correctionRequests.filter(r => r.status === 'APPROVED').length})
          </button>
          <button
            onClick={() => setFilterTab('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'REJECTED' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected ({correctionRequests.filter(r => r.status === 'REJECTED').length})
          </button>
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'ALL' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({correctionRequests.length})
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{actionMessage.text}</span>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">No Correction Requests</h4>
            <p className="text-xs text-slate-500 mt-1">There are no {filterTab.toLowerCase()} requests at this time.</p>
          </div>
        ) : (
          filteredRequests.map(req => {
            const student = students.find(s => s.id === req.studentId);
            const session = classSessions.find(s => s.id === req.classSessionId);
            const offering = courseOfferings.find(o => o.id === session?.courseOfferingId);
            const course = courses.find(c => c.id === offering?.courseId);
            const requestingFac = faculty.find(f => f.id === req.requestedByFacultyId);
            const reviewingFac = faculty.find(f => f.id === req.reviewedByFacultyId);

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{student?.fullName}</span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Roll No: {student?.rollNumber} • Adm: {student?.admissionNumber}
                    </span>
                    <Badge
                      variant={
                        req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'danger' : 'warning'
                      }
                      size="sm"
                    >
                      {req.status}
                    </Badge>
                  </div>

                  <p className="text-xs font-semibold text-slate-700">
                    Course: <span className="text-blue-700 font-bold">{course?.courseCode} - {course?.courseTitle}</span> • Session Date:{' '}
                    <span className="font-mono">{session?.date}</span>
                  </p>

                  <div className="flex items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Previous:</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                        {req.oldStatus}
                      </span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Requested:</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {req.requestedStatus}
                      </span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="text-slate-600">
                      Requested by: <strong>{requestingFac?.fullName || 'Faculty Member'}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/80">
                    <strong>Justification:</strong> "{req.reason}"
                  </p>

                  {req.reviewRemarks && (
                    <p className="text-xs text-slate-500">
                      <strong>HOD Review Remarks:</strong> {req.reviewRemarks} (by {reviewingFac?.fullName || 'HOD'})
                    </p>
                  )}
                </div>

                {/* Actions */}
                {req.status === 'PENDING' && canApprove && (
                  <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                    <button
                      disabled={processingId === req.id}
                      onClick={() => handleReject(req.id)}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {processingId === req.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>Reject</span>
                    </button>
                    <button
                      disabled={processingId === req.id}
                      onClick={() => handleApprove(req.id)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                    >
                      {processingId === req.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>{processingId === req.id ? 'Confirming...' : 'Approve Correction'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
