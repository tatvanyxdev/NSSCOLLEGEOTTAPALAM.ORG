import React, { useState } from 'react';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Circular, TargetScope } from '../../types';
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
  ExternalLink
} from 'lucide-react';

export const NoticesAndCircularsView: React.FC = () => {
  const {
    circulars,
    currentStudent,
    acknowledgeCircular,
    userContext
  } = usePersonalizedCollege();
  const { departments, programmes } = useCollegeData();
  const { activeRole, user } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACK_PENDING' | 'URGENT' | 'DEPARTMENT' | 'COLLEGE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const canPost = ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'ADMIN'].includes(activeRole);

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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Notices & Circulars
          </h1>
        </div>

        {canPost && (
          <button
            onClick={() => alert('New circular issuance form will open')}
            className="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
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
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
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
            <p className="text-xs text-slate-400 mt-1">No announcements match the selected criteria.</p>
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
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Effective: {c.effectiveFrom}
                    </span>

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
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
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
    </div>
  );
};
