import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import {
  ComplaintRecord,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintUrgency,
  CATEGORY_CONFIG
} from '../../types/complaints';
import { complaintsService } from '../../services/complaintsService';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  AlertCircle,
  Plus,
  RefreshCw,
  Send,
  X,
  FileCheck,
  Eye,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export const ComplaintsManagerView: React.FC = () => {
  const { user, activeRole } = useAuth();
  const { departments } = useCollegeData();
  const { currentStudent } = usePersonalizedCollege();

  const isSuperOrPrincipal = ['SUPER_ADMIN', 'PRINCIPAL'].includes(activeRole);
  const isHod = activeRole === 'HOD';
  const isStudent = activeRole === 'STUDENT';

  // Determine HOD's active department
  const hodDeptId = user?.departmentId || 'dept-phy';
  const hodDepartment = useMemo(() => {
    return departments.find((d) => d.id === hodDeptId) || {
      id: hodDeptId,
      name: 'Department of Physics',
      code: 'PHY'
    };
  }, [departments, hodDeptId]);

  // Student identifier
  const studentIdentifier = currentStudent?.admissionNumber || user?.name || '';

  // Data state
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(() => {
    return complaintsService.getComplaintsForRole(activeRole, hodDeptId, studentIdentifier);
  });

  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Action form inside modal
  const [actionStatus, setActionStatus] = useState<ComplaintStatus>('UNDER_INVESTIGATION');
  const [actionNoteText, setActionNoteText] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [isSavingAction, setIsSavingAction] = useState(false);

  const reloadData = () => {
    const list = complaintsService.getComplaintsForRole(activeRole, hodDeptId, studentIdentifier);
    setComplaints(list);
  };

  // Real-time synchronization with Firebase complaints updates
  useEffect(() => {
    const unsubscribe = complaintsService.subscribe(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, [activeRole, hodDeptId, studentIdentifier]);

  // Filtered view
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      result = result.filter((c) => c.category === categoryFilter);
    }

    // Department filter (only applicable for Principal/SuperAdmin)
    if (isSuperOrPrincipal && deptFilter !== 'ALL') {
      result = result.filter((c) => c.departmentId === deptFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.ticketNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.complainantName && c.complainantName.toLowerCase().includes(q)) ||
          (c.departmentName && c.departmentName.toLowerCase().includes(q)) ||
          (c.locationOnCampus && c.locationOnCampus.toLowerCase().includes(q))
      );
    }

    return result;
  }, [complaints, statusFilter, categoryFilter, deptFilter, searchQuery, isSuperOrPrincipal]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: complaints.length,
      submitted: complaints.filter((c) => c.status === 'SUBMITTED').length,
      investigating: complaints.filter((c) => c.status === 'UNDER_INVESTIGATION').length,
      actionTaken: complaints.filter((c) => c.status === 'ACTION_TAKEN').length,
      resolved: complaints.filter((c) => c.status === 'RESOLVED').length,
      emergency: complaints.filter((c) => c.urgency === 'EMERGENCY' || c.urgency === 'HIGH').length
    };
  }, [complaints]);

  // Save action / resolution
  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsSavingAction(true);
    const authorName = user?.name || (isHod ? `${hodDepartment.name} HOD` : 'Principal Office');
    const roleTitle = isHod ? 'HOD' : activeRole === 'PRINCIPAL' ? 'College Principal' : 'Super Administrator';

    try {
      const res = await complaintsService.updateComplaintStatus(
        selectedComplaint.id,
        actionStatus,
        authorName,
        roleTitle,
        actionNoteText,
        actionStatus === 'RESOLVED' ? resolutionSummary : undefined
      );

      if (res.success && res.complaint) {
        setSelectedComplaint(res.complaint);
        setActionNoteText('');
        setResolutionSummary('');
        reloadData();
        setIsActionModalOpen(false);
      }
    } catch (err) {
      console.error('Error saving action to Firebase:', err);
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleExportCsv = () => {
    const filename = isHod
      ? `grievances_${hodDepartment.code?.toLowerCase() || 'dept'}`
      : 'nss_college_all_grievances';
    complaintsService.exportToCsv(filteredComplaints, filename);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isSuperOrPrincipal
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : isHod
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-emerald-100 text-emerald-900'
              }`}
            >
              {isSuperOrPrincipal
                ? 'Grievance Cell'
                : isHod
                ? `${hodDepartment.name}`
                : 'My Requests'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
            {isSuperOrPrincipal
              ? 'Complaints & Grievances'
              : isHod
              ? 'Department Grievances'
              : 'Complaints'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={reloadData}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          {!isStudent && (
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Files</span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.total}</div>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase block">New / Submitted</span>
          <div className="text-2xl font-black text-amber-900 mt-1 font-mono">{stats.submitted}</div>
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-800 uppercase block">Investigating</span>
          <div className="text-2xl font-black text-blue-900 mt-1 font-mono">{stats.investigating}</div>
        </div>

        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 shadow-xs">
          <span className="text-[11px] font-bold text-purple-800 uppercase block">Action Taken</span>
          <div className="text-2xl font-black text-purple-900 mt-1 font-mono">{stats.actionTaken}</div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase block">Resolved</span>
          <div className="text-2xl font-black text-emerald-900 mt-1 font-mono">{stats.resolved}</div>
        </div>

        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-800 uppercase block">High / Emergency</span>
          <div className="text-2xl font-black text-rose-900 mt-1 font-mono">{stats.emergency}</div>
        </div>
      </div>

      {/* Role-Specific Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket no, keywords, complainant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-900/20"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="ACTION_TAKEN">Action Taken</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        {/* Category Filter */}
        {isSuperOrPrincipal && (
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="ANTI_RAGGING">Anti-Ragging Cell</option>
              <option value="ANTI_DRUG">Anti-Drug / Vimukthi</option>
              <option value="INFRASTRUCTURE">Campus Infrastructure</option>
              <option value="WOMEN_ICC">Internal Complaints Committee</option>
              <option value="CAMPUS_ADMINISTRATION">General Administration</option>
              <option value="DEPT_ACADEMICS">Department Academics</option>
              <option value="DEPT_LAB_EQUIPMENT">Department Lab Equipment</option>
              <option value="DEPT_INTERNAL_MARKS">Continuous Evaluation (CE)</option>
            </select>
          </div>
        )}

        {/* Department Filter (Principal & SuperAdmin only) */}
        {isSuperOrPrincipal && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="ALL">All Departments</option>
              {departments
                .filter((d) => d.type === 'ACADEMIC')
                .map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket & Category</th>
                <th className="py-3 px-4">Subject & Description</th>
                <th className="py-3 px-4">Scope & Department</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Complainant</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-600">No grievances recorded under this view.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Complaints matching your access rights and filters will be displayed here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((item) => {
                  const meta = CATEGORY_CONFIG[item.category];
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ticket & Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-black text-rose-900 block text-xs">
                          {item.ticketNumber}
                        </span>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.category === 'ANTI_RAGGING'
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : item.category === 'ANTI_DRUG'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : item.category === 'INFRASTRUCTURE'
                              ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                              : 'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}
                        >
                          {meta?.label || item.category}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(item.submittedAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>

                      {/* Subject & Description */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <strong className="text-slate-900 text-xs block leading-snug">{item.title}</strong>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                        {item.locationOnCampus && (
                          <span className="text-[10px] text-slate-400 block mt-1">
                            📍 {item.locationOnCampus}
                          </span>
                        )}
                      </td>

                      {/* Scope & Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.scope === 'DEPARTMENT_WISE' ? (
                          <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{item.departmentName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                            <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Campus-Wide (Statutory)</span>
                          </div>
                        )}
                      </td>

                      {/* Urgency */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.urgency === 'EMERGENCY'
                              ? 'bg-rose-600 text-white'
                              : item.urgency === 'HIGH'
                              ? 'bg-rose-100 text-rose-900'
                              : item.urgency === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.urgency}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : item.status === 'ACTION_TAKEN'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : item.status === 'UNDER_INVESTIGATION'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Complainant Identity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.isAnonymous ? (
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Anonymous</span>
                          </span>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{item.complainantName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {item.complainantAdmissionNo || item.complainantRole}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedComplaint(item);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                            title="View Full File"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!isStudent && (
                            <button
                              onClick={() => {
                                setSelectedComplaint(item);
                                setActionStatus(item.status);
                                setIsActionModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-rose-900 hover:bg-rose-950 text-white font-bold text-[11px] rounded-lg transition-all"
                            >
                              Update Status
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FULL COMPLAINT DOSSIER */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900">
                  {CATEGORY_CONFIG[selectedComplaint.category]?.label}
                </span>
                <h3 className="text-xl font-black text-slate-900 font-mono">
                  {selectedComplaint.ticketNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-sm">{selectedComplaint.title}</span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedComplaint.description}</p>
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-slate-500 text-[11px]">
                  <div>Incident Date: <strong>{selectedComplaint.incidentDate || 'Not specified'}</strong></div>
                  <div>Campus Location: <strong>{selectedComplaint.locationOnCampus || 'General Campus'}</strong></div>
                </div>
              </div>

              {/* Authority & Confidentiality Banner */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 flex justify-between items-center text-xs">
                <span>Jurisdiction: <strong>{selectedComplaint.assignedOfficer}</strong></span>
                <span className="font-bold text-blue-800">
                  {selectedComplaint.isAnonymous ? '🔒 Anonymous Whistleblower' : `Complainant: ${selectedComplaint.complainantName}`}
                </span>
              </div>

              {/* Action Notes History */}
              {selectedComplaint.actionNotes && selectedComplaint.actionNotes.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 block">Investigation & Action Log:</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedComplaint.actionNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <strong>{note.author} ({note.role})</strong>
                          <span>{new Date(note.timestamp).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-slate-800">{note.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Summary */}
              {selectedComplaint.resolutionSummary && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-1">
                  <span className="font-bold text-emerald-900 block">Final Redressal Summary:</span>
                  <p className="text-emerald-950">{selectedComplaint.resolutionSummary}</p>
                  <span className="text-[10px] text-emerald-700 block mt-1">
                    Endorsed by {selectedComplaint.resolvedBy}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsPrintModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Dossier</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UPDATE STATUS & ACTION LOG */}
      {/* ========================================================================= */}
      {isActionModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900">
                  Update Vigilance Record
                </span>
                <h3 className="text-lg font-black text-slate-900 font-mono">
                  {selectedComplaint.ticketNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Update Complaint Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-rose-900/20"
                >
                  <option value="SUBMITTED">SUBMITTED (Pending Initial Review)</option>
                  <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION (Assigned Committee)</option>
                  <option value="ACTION_TAKEN">ACTION TAKEN (Corrective Measures Deployed)</option>
                  <option value="RESOLVED">RESOLVED (Closed & Redressed)</option>
                  <option value="DISMISSED">DISMISSED (Non-Actionable / Invalid)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Add Official Investigation / Action Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Record steps taken, maintenance work order sanctioned, or inquiry findings..."
                  value={actionNoteText}
                  onChange={(e) => setActionNoteText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-900/20"
                />
              </div>

              {actionStatus === 'RESOLVED' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <label className="block text-[11px] font-bold text-emerald-900">
                    Final Redressal Summary (Visible to Complainant in Tracker) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Concise statement explaining how the grievance was resolved..."
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAction}
                  className="px-5 py-2 bg-rose-900 hover:bg-rose-950 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  {isSavingAction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PRINT OFFICIAL GRIEVANCE DOSSIER */}
      {/* ========================================================================= */}
      {isPrintModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
              <span className="text-xs font-bold text-slate-600">Printable Official Grievance Dossier</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-rose-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-rose-800 transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border-2 border-slate-900 p-6 rounded-2xl font-serif text-slate-900 text-xs space-y-4">
              <div className="text-center border-b border-slate-900 pb-3 font-sans">
                <h3 className="text-base font-black uppercase">N.S.S. COLLEGE, OTTAPALAM</h3>
                <p className="text-[11px] text-slate-600">Affiliated to University of Calicut • Accredited NAAC 'A' Grade</p>
                <span className="inline-block mt-1 font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                  Official Vigilance & Grievance Redressal Dossier
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-sans text-xs">
                <div>Ticket ID: <strong className="font-mono">{selectedComplaint.ticketNumber}</strong></div>
                <div>Status: <strong>{selectedComplaint.status}</strong></div>
                <div>Category: <strong>{CATEGORY_CONFIG[selectedComplaint.category]?.label}</strong></div>
                <div>Urgency: <strong>{selectedComplaint.urgency}</strong></div>
                <div>Jurisdiction: <strong>{selectedComplaint.assignedOfficer}</strong></div>
                <div>Filing Date: <strong>{new Date(selectedComplaint.submittedAt).toLocaleDateString('en-IN')}</strong></div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl font-sans text-xs space-y-1">
                <strong>Subject: {selectedComplaint.title}</strong>
                <p className="text-[11px] text-slate-700">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.resolutionSummary && (
                <div className="p-3 border border-slate-900 rounded-xl font-sans text-xs space-y-1">
                  <strong>Resolution Statement:</strong>
                  <p className="text-[11px]">{selectedComplaint.resolutionSummary}</p>
                </div>
              )}

              <div className="pt-8 font-sans flex items-end justify-between border-t border-slate-400 text-[10px]">
                <div className="text-center">
                  <div className="w-28 border-b border-slate-900 mb-1" />
                  <span>Investigating Officer</span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-900 mb-1" />
                  <span>College Principal Seal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
