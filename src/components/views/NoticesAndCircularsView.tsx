import React, { useState } from 'react';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Circular, PriorityLevel, TargetScope } from '../../types';
import { Modal } from '../common/UIComponents';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Bell,
  Search,
  CheckCircle2,
  FileCheck,
  Download,
  Filter,
  Plus,
  Calendar,
  AlertCircle,
  Building2,
  Users,
  Clock,
  RefreshCw,
  ExternalLink,
  Trash2,
  Send,
  FileText
} from 'lucide-react';

export const NoticesAndCircularsView: React.FC = () => {
  const {
    circulars,
    currentStudent,
    acknowledgeCircular,
    issueCircular,
    deleteCircular,
    userContext
  } = usePersonalizedCollege();
  const { departments, programmes } = useCollegeData();
  const { activeRole, user } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACK_PENDING' | 'URGENT' | 'DEPARTMENT' | 'COLLEGE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [circularToDelete, setCircularToDelete] = useState<Circular | null>(null);

  // Issue Circular Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('Office of Principal');
  const [scope, setScope] = useState<TargetScope>('COLLEGE');
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [effectiveUntil, setEffectiveUntil] = useState('');
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const canPost = ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'ADMIN'].includes(activeRole);
  const canDelete = ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'ADMIN'].includes(activeRole);

  const openIssueModal = () => {
    const yr = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    setReferenceNumber(`NSS/CIR/${yr}/${rand}`);
    setTitle('');
    setDescription('');
    setIssuingAuthority(
      activeRole === 'PRINCIPAL' || activeRole === 'SUPER_ADMIN'
        ? 'Office of Principal'
        : activeRole === 'HOD'
        ? 'Head of Department'
        : 'College Administration'
    );
    setScope(activeRole === 'HOD' ? 'DEPARTMENT' : 'COLLEGE');
    setTargetDepartmentId(departments[0]?.id || '');
    setPriority('NORMAL');
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setEffectiveUntil('');
    setRequiresAcknowledgement(false);
    setAttachmentName('');
    setAttachmentUrl('');
    setFormError(null);
    setIsIssueModalOpen(true);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFormError('Please enter both title and description for the circular.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const res = await issueCircular({
      referenceNumber: referenceNumber.trim() || `NSS/CIR/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      description: description.trim(),
      issuingAuthority: issuingAuthority.trim() || 'Office of Principal',
      scope,
      targetDepartmentId: scope === 'DEPARTMENT' && targetDepartmentId ? targetDepartmentId : undefined,
      priority,
      effectiveFrom: effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveUntil: effectiveUntil || undefined,
      requiresAcknowledgement,
      acknowledgedStudentIds: [],
      attachmentName: attachmentName.trim() || undefined,
      attachmentUrl: attachmentUrl.trim() || undefined,
      targetRoles: ['STUDENT', 'TEACHER', 'HOD'],
      status: 'PUBLISHED'
    });

    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to issue circular. Please try again.');
      return;
    }

    setIsIssueModalOpen(false);
  };

  const handleDeleteClick = (c: Circular) => {
    if (!canDelete) return;
    setCircularToDelete(c);
  };

  const handleConfirmDelete = async () => {
    if (!circularToDelete) return;
    const target = circularToDelete;
    setDeletingId(target.id);
    try {
      await deleteCircular(target.id);
    } finally {
      setDeletingId(null);
      setCircularToDelete(null);
    }
  };

  const filteredCirculars = circulars.filter(c => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.title.toLowerCase().includes(q) ||
        c.referenceNumber.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.issuingAuthority.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Filter type
    if (activeFilter === 'ACK_PENDING') {
      if (!c.requiresAcknowledgement) return false;
      if (currentStudent && c.acknowledgedStudentIds?.includes(currentStudent.id)) return false;
    } else if (activeFilter === 'URGENT') {
      if (c.priority !== 'URGENT' && c.priority !== 'HIGH') return false;
    } else if (activeFilter === 'DEPARTMENT') {
      if (c.scope !== 'DEPARTMENT') return false;
    } else if (activeFilter === 'COLLEGE') {
      if (c.scope !== 'COLLEGE') return false;
    }

    return true;
  });

  const handleAcknowledge = async (id: string) => {
    setAcknowledgingId(id);
    try {
      await acknowledgeCircular(id);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-rose-50 text-rose-800 rounded-xl">
            <Bell className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Notices & Circulars
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Official collegiate directives, notifications & acknowledgement log
            </p>
          </div>
        </div>

        {canPost && (
          <button
            onClick={openIssueModal}
            className="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Issue Circular
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'ACK_PENDING', label: 'Action Required' },
            { key: 'URGENT', label: 'Urgent' },
            { key: 'COLLEGE', label: 'College' },
            { key: 'DEPARTMENT', label: 'Department' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeFilter === tab.key
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search circulars..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition-all font-medium"
          />
        </div>
      </div>

      {/* Circulars List */}
      <div className="space-y-4">
        {filteredCirculars.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No circulars found</p>
            <p className="text-xs text-slate-400 mt-1">
              {canPost
                ? 'No official circulars have been issued yet. Click "Issue Circular" to publish the first notice.'
                : 'No announcements match the selected criteria.'}
            </p>
          </div>
        ) : (
          filteredCirculars.map(c => {
            const isAcknowledged = currentStudent && c.acknowledgedStudentIds?.includes(currentStudent.id);
            const dept = departments.find(d => d.id === c.targetDepartmentId);

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-950 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-md">
                        {c.referenceNumber}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {c.issuingAuthority}
                      </span>
                      {dept && (
                        <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                          {dept.name}
                        </span>
                      )}
                      {c.priority === 'URGENT' && (
                        <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Urgent Priority
                        </span>
                      )}
                      {c.scope === 'COLLEGE' && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                          College-Wide Notice
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                      {c.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {c.description}
                    </p>
                  </div>

                  {/* Right Side Action / Acknowledgement */}
                  <div className="sm:text-right shrink-0 flex flex-col items-start sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Effective: {c.effectiveFrom}
                      </span>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteClick(c)}
                          disabled={deletingId === c.id}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Circular"
                        >
                          {deletingId === c.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {c.requiresAcknowledgement && (
                      <div className="pt-2">
                        {isAcknowledged ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Acknowledged by You</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAcknowledge(c.id)}
                            disabled={acknowledgingId === c.id}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            {acknowledgingId === c.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileCheck className="w-3.5 h-3.5" />
                            )}
                            Click to Acknowledge Receipt
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Attachment & Metrics */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    {c.attachmentName && (
                      <a
                        href={c.attachmentUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-rose-900 hover:text-rose-950 bg-rose-50/80 hover:bg-rose-100 px-3 py-1 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Attached Document ({c.attachmentName})
                      </a>
                    )}
                  </div>

                  {c.requiresAcknowledgement && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      {c.acknowledgedStudentIds?.length || 0} students have confirmed receipt
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Issue Circular Modal */}
      {canPost && (
        <Modal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          title="Issue Official College Circular"
          subtitle="Publish a formal circular with optional student acknowledgement tracking"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleIssueSubmit} className="space-y-4 p-1">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reference Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="e.g. NSS/CIR/2026/104"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-semibold focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Issuing Authority <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={issuingAuthority}
                  onChange={e => setIssuingAuthority(e.target.value)}
                  placeholder="e.g. Office of Principal / HOD Physics"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Circular Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. End Semester Continuous Evaluation & Grievance Schedule"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Description & Directive Content <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide the detailed content, directives, rules, or instructions of this circular..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Scope</label>
                <select
                  value={scope}
                  onChange={e => setScope(e.target.value as TargetScope)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="COLLEGE">College-Wide</option>
                  <option value="DEPARTMENT">Departmental Only</option>
                </select>
              </div>

              {scope === 'DEPARTMENT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Department</label>
                  <select
                    value={targetDepartmentId}
                    onChange={e => setTargetDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Effective Date</label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={e => setEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresAcknowledgement}
                  onChange={e => setRequiresAcknowledgement(e.target.checked)}
                  className="w-4 h-4 text-rose-900 rounded border-slate-300 focus:ring-rose-900"
                />
                <span className="text-xs font-bold text-slate-800">
                  Require Student Acknowledgement Receipt
                </span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6">
                When enabled, students must tap "Acknowledge Receipt" in their dashboard, recording their audit confirmation.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-rose-900 hover:bg-rose-950 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Publish Circular
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Circular Modal */}
      <ConfirmDialog
        isOpen={!!circularToDelete}
        onClose={() => setCircularToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={!!deletingId}
        title="Delete Institutional Circular"
        message={
          <div>
            <p>
              Are you sure you want to permanently delete circular{' '}
              <strong className="text-slate-900">{circularToDelete?.referenceNumber}</strong> ({circularToDelete?.title})?
            </p>
            <p className="mt-2 text-rose-600 font-medium">
              This circular and its student acknowledgements will be removed across all portals immediately.
            </p>
          </div>
        }
        confirmLabel="Yes, Delete Circular"
        variant="danger"
      />
    </div>
  );
};
