import React, { useState } from 'react';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { StudentCertificateRequest, CertificateType, CertificateRequestStatus } from '../../types';
import {
  GraduationCap,
  Plus,
  Clock,
  CheckCircle2,
  FileCheck,
  Building2,
  Check,
  AlertCircle,
  FileText,
  Printer,
  ChevronRight
} from 'lucide-react';

export const CertificateRequestsView: React.FC = () => {
  const {
    certificateRequests,
    currentStudent,
    submitCertificateRequest,
    updateCertificateRequestStatus
  } = usePersonalizedCollege();

  const { students } = useCollegeData();
  const { activeRole } = useAuth();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [certType, setCertType] = useState<CertificateType>('BONAFIDE');
  const [purpose, setPurpose] = useState('');
  const [numCopies, setNumCopies] = useState(1);
  const [statusRemarks, setStatusRemarks] = useState<{ [id: string]: string }>({});

  const isStudent = activeRole === 'STUDENT';
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD'].includes(activeRole);

  const myRequests = certificateRequests.filter(
    r => currentStudent && r.studentId === currentStudent.id
  );

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !purpose) return;

    await submitCertificateRequest({
      studentId: currentStudent.id,
      certificateType: certType,
      purpose,
      numberOfCopies: numCopies
    });

    setIsApplyModalOpen(false);
    setPurpose('');
    setNumCopies(1);
  };

  const handleStatusChange = async (id: string, newStatus: CertificateRequestStatus) => {
    const remarks = statusRemarks[id] || (newStatus === 'READY' ? 'Signed & sealed. Collect at Office Counter 2.' : '');
    await updateCertificateRequestStatus(id, newStatus, remarks);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Certificates
          </h1>
        </div>

        {isStudent && (
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Request Certificate
          </button>
        )}
      </div>

      {/* Student View: My Certificate Applications */}
      {isStudent && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              My Requests
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {myRequests.length} record(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {myRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No certificate applications submitted yet.
              </div>
            ) : (
              myRequests.map(req => (
                <div key={req.id} className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-rose-50 text-rose-900 uppercase">
                          {req.certificateType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          Applied: {req.createdAt.split('T')[0]} • Copies: {req.numberOfCopies}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Purpose: {req.purpose}
                      </h4>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold self-start sm:self-auto ${
                        req.status === 'READY'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : req.status === 'PROCESSING'
                          ? 'bg-blue-100 text-blue-900'
                          : req.status === 'COLLECTED'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {req.status === 'READY' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {req.status === 'PROCESSING' && <Clock className="w-4 h-4 text-blue-600" />}
                      {req.status === 'SUBMITTED' && <Clock className="w-4 h-4 text-amber-600" />}
                      Status: {req.status}
                    </span>
                  </div>

                  {/* Processing / Collection Instruction */}
                  {req.processingRemarks && (
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-center justify-between">
                      <span>
                        <strong>Office Note:</strong> {req.processingRemarks}
                      </span>
                      {req.status === 'READY' && (
                        <span className="font-bold text-emerald-800 shrink-0">
                          Bring College ID Card
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress Timeline */}
                  <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-slate-400">
                    <span className="text-rose-900">1. Submitted</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className={req.status !== 'SUBMITTED' ? 'text-rose-900' : ''}>
                      2. Office Processing
                    </span>
                    <ChevronRight className="w-3 h-3" />
                    <span className={req.status === 'READY' || req.status === 'COLLECTED' ? 'text-emerald-700' : ''}>
                      3. Ready for Counter Pickup
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Staff / Office Desk: All Requests */}
      {canManage && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Administrative Certificate Processing Queue
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {certificateRequests.length} total request(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {certificateRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No certificate requests pending or in queue.
              </div>
            ) : (
              certificateRequests.map(req => {
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
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-800 uppercase">
                          {req.certificateType.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        <strong>Purpose:</strong> {req.purpose} • Copies: {req.numberOfCopies}
                      </p>

                      {req.processingRemarks && (
                        <p className="text-xs text-slate-500 italic">
                          "{req.processingRemarks}"
                        </p>
                      )}
                    </div>

                    {/* Status Management */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        value={req.status}
                        onChange={e => handleStatusChange(req.id, e.target.value as any)}
                        className="text-xs font-bold p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="READY">READY FOR PICKUP</option>
                        <option value="COLLECTED">COLLECTED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {/* Apply Certificate Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Request Official Certificate</h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Certificate Type</label>
                <select
                  value={certType}
                  onChange={e => setCertType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="BONAFIDE">Bonafide Student Certificate</option>
                  <option value="CONDUCT">Conduct / Character Certificate</option>
                  <option value="FEE_STRUCTURE">Official Fee Structure & Statement</option>
                  <option value="STUDENT_VERIFICATION">University Student Verification Letter</option>
                  <option value="RECOMMENDATION_LETTER">Principal Recommendation Letter</option>
                  <option value="MEDIUM_OF_INSTRUCTION">Medium of Instruction (English) Certificate</option>
                  <option value="BUS_CONCESSION">KSRTC / Transport Concession Endorsement</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Number of Copies</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={numCopies}
                  onChange={e => setNumCopies(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Purpose / Beneficiary</label>
                <textarea
                  required
                  rows={3}
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="e.g. Higher Education Merit Scholarship / Bank Education Loan / Passport Verification..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
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
