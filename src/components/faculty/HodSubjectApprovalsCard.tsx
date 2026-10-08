import React, { useState, useMemo } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { FacultySubjectRequest } from '../../types';
import { HodSubjectReviewModal } from './HodSubjectReviewModal';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  ArrowRight,
  Eye,
  Calendar,
  Building,
  Check,
  Sparkles
} from 'lucide-react';

interface HodSubjectApprovalsCardProps {
  onNavigateToStaff?: () => void;
}

export const HodSubjectApprovalsCard: React.FC<HodSubjectApprovalsCardProps> = ({
  onNavigateToStaff
}) => {
  const {
    facultySubjectRequests,
    faculty,
    departments,
    courses
  } = useCollegeData();

  const { user, activeRole } = useAuth();

  // Find HOD's department
  const currentFaculty = useMemo(() => {
    return (
      faculty.find(
        f =>
          f.id === user?.id ||
          (f.email && user?.email && f.email.toLowerCase() === user.email.toLowerCase()) ||
          (f.username && user?.name && f.username.toLowerCase() === user.name.toLowerCase())
      ) || null
    );
  }, [faculty, user]);

  const hodDeptId = useMemo(() => {
    if (activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL') {
      return null; // Admin sees all
    }
    return (
      departments.find(d => d.hodFacultyId === currentFaculty?.id)?.id ||
      user?.departmentId ||
      currentFaculty?.departmentId ||
      departments[0]?.id
    );
  }, [activeRole, departments, currentFaculty, user]);

  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<FacultySubjectRequest | null>(null);

  // Filter requests relevant to this HOD's department
  const relevantRequests = useMemo(() => {
    return facultySubjectRequests.filter(r => {
      if (hodDeptId && r.departmentId !== hodDeptId) {
        // Allow cross-department or if user is superadmin/principal
        if (activeRole !== 'SUPER_ADMIN' && activeRole !== 'PRINCIPAL') {
          return false;
        }
      }
      if (statusFilter === 'ALL') return true;
      return r.status === statusFilter;
    });
  }, [facultySubjectRequests, hodDeptId, statusFilter, activeRole]);

  const pendingCount = useMemo(() => {
    return facultySubjectRequests.filter(r => {
      if (hodDeptId && r.departmentId !== hodDeptId && activeRole !== 'SUPER_ADMIN' && activeRole !== 'PRINCIPAL') {
        return false;
      }
      return r.status === 'PENDING';
    }).length;
  }, [facultySubjectRequests, hodDeptId, activeRole]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-purple-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Subject Approval Requests
              </h3>
              {pendingCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                  {pendingCount} Pending Review
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  All Reviewed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Review teacher subject assignments, verify course groups, and grant attendance authority
            </p>
          </div>
        </div>

        {onNavigateToStaff && (
          <button
            onClick={onNavigateToStaff}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Manage Department Faculty</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 pt-2.5 flex items-center gap-2 border-b border-slate-100 text-xs font-bold">
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
            statusFilter === 'PENDING'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending ({pendingCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
            statusFilter === 'APPROVED'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved</span>
        </button>

        <button
          onClick={() => setStatusFilter('ALL')}
          className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
            statusFilter === 'ALL'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>All Requests</span>
        </button>
      </div>

      {/* List */}
      <div className="p-4 sm:p-5">
        {relevantRequests.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">
              {statusFilter === 'PENDING' ? 'No Pending Subject Requests' : 'No Subject Requests Found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
              {statusFilter === 'PENDING'
                ? 'All teacher subject registrations for your department have been reviewed and allocated.'
                : 'No subject requests match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {relevantRequests.map(req => {
              const teacher = faculty.find(
                f => f.id === req.requestedBy || f.id === req.requestedByFacultyId
              );
              const dept = departments.find(d => d.id === req.departmentId);
              const isPending = req.status === 'PENDING';
              const isApproved = req.status === 'APPROVED';

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isPending
                      ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                      : isApproved
                      ? 'border-slate-200 bg-white hover:border-purple-300'
                      : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">
                        {req.courseType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {isPending && <Clock className="w-3 h-3" />}
                        {isApproved && <CheckCircle2 className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </div>

                    {/* Teacher info */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {teacher?.fullName?.charAt(0) || <User className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {teacher?.fullName || 'Faculty Member'}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {dept?.name || 'Department'}
                        </span>
                      </div>
                    </div>

                    {/* Subject info */}
                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{req.courseName}</h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Code: {req.proposedCourseCode || 'Provisional'}</span>
                        <span>Sem {req.semesterNumber}</span>
                      </div>
                      {req.proposedGroupName && (
                        <span className="text-[10px] text-slate-600 block">
                          Group: <span className="font-semibold">{req.proposedGroupName}</span>
                        </span>
                      )}
                    </div>

                    {req.requestNotes && (
                      <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg line-clamp-2">
                        "{req.requestNotes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => setSelectedRequestForReview(req)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        isPending
                          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isPending ? 'Review & Allocate' : 'View Details'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Allocate Modal */}
      {selectedRequestForReview && (
        <HodSubjectReviewModal
          isOpen={!!selectedRequestForReview}
          onClose={() => setSelectedRequestForReview(null)}
          request={selectedRequestForReview}
        />
      )}
    </div>
  );
};
