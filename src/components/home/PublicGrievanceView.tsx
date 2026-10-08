import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Lock,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  PhoneCall,
  Copy,
  Check,
  Printer,
  X,
  Send,
  AlertCircle,
  FileCheck,
  Info
} from 'lucide-react';
import {
  ComplaintCategory,
  ComplaintUrgency,
  CATEGORY_CONFIG,
  ComplaintRecord
} from '../../types/complaints';
import { complaintsService } from '../../services/complaintsService';
import { useCollegeData } from '../../contexts/CollegeDataContext';

const INSTITUTIONAL_CATEGORIES: ComplaintCategory[] = [
  'ANTI_RAGGING',
  'ANTI_DRUG',
  'INFRASTRUCTURE',
  'WOMEN_ICC',
  'CAMPUS_ADMINISTRATION'
];

const DEPARTMENT_CATEGORIES: ComplaintCategory[] = [
  'DEPT_ACADEMICS',
  'DEPT_LAB_EQUIPMENT',
  'DEPT_INTERNAL_MARKS',
  'DEPT_FACILITY_OTHER'
];

export const PublicGrievanceView: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
  const { departments } = useCollegeData();
  const academicDepartments = departments.filter((d) => d.type === 'ACADEMIC');

  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // Form State
  const [redressalStream, setRedressalStream] = useState<'INSTITUTIONAL' | 'DEPARTMENT_WISE'>('INSTITUTIONAL');
  const [category, setCategory] = useState<ComplaintCategory>('ANTI_RAGGING');
  const [departmentId, setDepartmentId] = useState<string>('dept-phy');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationOnCampus, setLocationOnCampus] = useState('');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [urgency, setUrgency] = useState<ComplaintUrgency>('HIGH');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [complainantName, setComplainantName] = useState('');
  const [complainantRole, setComplainantRole] = useState<'STUDENT' | 'FACULTY' | 'PARENT' | 'VISITOR'>('STUDENT');
  const [complainantAdmissionNo, setComplainantAdmissionNo] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [complainantEmail, setComplainantEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<ComplaintRecord | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Track State
  const [trackTicketNo, setTrackTicketNo] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState<ComplaintRecord | null | 'NOT_FOUND'>(null);

  const selectedCategoryMeta = CATEGORY_CONFIG[category];
  const isDeptWise = redressalStream === 'DEPARTMENT_WISE';

  const handleSelectStream = (stream: 'INSTITUTIONAL' | 'DEPARTMENT_WISE') => {
    setRedressalStream(stream);
    if (stream === 'INSTITUTIONAL' && !INSTITUTIONAL_CATEGORIES.includes(category)) {
      setCategory('ANTI_RAGGING');
    } else if (stream === 'DEPARTMENT_WISE' && !DEPARTMENT_CATEGORIES.includes(category)) {
      setCategory('DEPT_ACADEMICS');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !description.trim()) {
      setFormError('Please provide a subject title and detailed description of the incident.');
      return;
    }

    if (!isAnonymous && !complainantName.trim()) {
      setFormError('Please enter your name or switch to Anonymous mode.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDept = academicDepartments.find((d) => d.id === departmentId);
      const res = await complaintsService.submitComplaint({
        title,
        description,
        category,
        departmentId: isDeptWise ? departmentId : undefined,
        departmentName: isDeptWise ? selectedDept?.name : undefined,
        locationOnCampus,
        incidentDate,
        urgency,
        isAnonymous,
        complainantName: isAnonymous ? undefined : complainantName,
        complainantRole: isAnonymous ? 'ANONYMOUS' : complainantRole,
        complainantAdmissionNo: isAnonymous ? undefined : complainantAdmissionNo,
        complainantPhone: isAnonymous ? undefined : complainantPhone,
        complainantEmail: isAnonymous ? undefined : complainantEmail
      });

      setSubmittedTicket(res.complaint);
      // Reset fields
      setTitle('');
      setDescription('');
      setLocationOnCampus('');
    } catch (err: any) {
      setFormError(err.message || 'Error recording grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTicketNo.trim()) return;
    const found = await complaintsService.findComplaintByTicketAsync(trackTicketNo);
    setTrackedComplaint(found || 'NOT_FOUND');
  };

  const handleCopyTicket = (ticket: string) => {
    navigator.clipboard.writeText(ticket);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-rose-900/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Grievance Desk</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
              Grievance Portal
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Confidential redressal for institutional matters and department academic concerns.
            </p>

            {/* Helpline quick strip */}
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-200">
              <span className="px-2.5 py-1 bg-white/10 rounded-lg border border-white/10 flex items-center gap-1.5 font-medium">
                <PhoneCall className="w-3 h-3 text-amber-300" />
                Anti-Ragging Toll-Free: <strong>1800-180-5522</strong>
              </span>
              <span className="px-2.5 py-1 bg-white/10 rounded-lg border border-white/10 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Vimukthi Anti-Drug Kerala: <strong>14405</strong>
              </span>
              <span className="px-2.5 py-1 bg-white/10 rounded-lg border border-white/10 flex items-center gap-1.5 font-medium">
                <ShieldAlert className="w-3 h-3 text-rose-300" />
                Campus Vigilance Helpline: <strong>0466-2244382</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls: Submit vs Track */}
        <div className="flex border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-xs max-w-md mx-auto">
          <button
            onClick={() => {
              setActiveTab('submit');
              setSubmittedTicket(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-rose-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>File New Grievance</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'track'
                ? 'bg-rose-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Track Grievance Status</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: FILE NEW GRIEVANCE */}
        {/* ========================================================================= */}
        {activeTab === 'submit' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8">
            {submittedTicket ? (
              /* Success / Receipt Screen */
              <div className="space-y-6 text-center max-w-xl mx-auto py-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-emerald-300 dark:border-emerald-700/50">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display">
                    Grievance Registered Successfully
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Your complaint has been encrypted and routed strictly according to your selected category.
                  </p>
                </div>

                {/* Ticket Box */}
                <div className="p-5 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-slate-850 dark:to-slate-950 rounded-2xl border border-rose-200 dark:border-slate-800 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Official Tracking Token</span>
                    <button
                      onClick={() => handleCopyTicket(submittedTicket.ticketNumber)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTicket ? 'Copied' : 'Copy Token'}</span>
                    </button>
                  </div>

                  <div className="text-2xl sm:text-3xl font-black font-mono text-rose-900 dark:text-amber-400 tracking-wider">
                    {submittedTicket.ticketNumber}
                  </div>

                  <div className="pt-2 border-t border-rose-200/60 dark:border-slate-800 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Category:</span>
                      <strong>{CATEGORY_CONFIG[submittedTicket.category]?.label}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Routing Authority:</span>
                      <strong className="text-rose-900 dark:text-amber-300">{submittedTicket.assignedOfficer}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Confidentiality:</span>
                      <span>{submittedTicket.isAnonymous ? '🔒 Anonymous Whistleblower' : submittedTicket.complainantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Current Status:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded text-[11px]">
                        {submittedTicket.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSubmittedTicket(null);
                      setActiveTab('track');
                      setTrackTicketNo(submittedTicket.ticketNumber);
                    }}
                    className="px-5 py-2.5 bg-rose-900 hover:bg-rose-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>View Live Status in Tracker</span>
                  </button>

                  <button
                    onClick={() => setSubmittedTicket(null)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Submit Another Report
                  </button>
                </div>
              </div>
            ) : (
              /* Complaint Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                    File a Complaint or Confidential Report
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select the appropriate category below to ensure strict institutional access control.
                  </p>
                </div>

                {formError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. Category Selection with Scope Distinction */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Step 1: Select Redressal Stream & Category <span className="text-rose-500">*</span>
                    </label>

                    {/* Stream Selector Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Stream 1: Institutional & Statutory */}
                      <button
                        type="button"
                        onClick={() => handleSelectStream('INSTITUTIONAL')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          redressalStream === 'INSTITUTIONAL'
                            ? 'border-rose-900 dark:border-amber-400 bg-rose-50/70 dark:bg-rose-950/40 shadow-md ring-2 ring-rose-900/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-rose-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${
                              redressalStream === 'INSTITUTIONAL' ? 'bg-rose-900 dark:bg-amber-400 text-white dark:text-slate-950' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            }`}>
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-900 dark:text-white font-display">
                                Institutional & Statutory Redressal
                              </h3>
                              <span className="text-[10px] uppercase font-bold text-rose-800 dark:text-amber-300 tracking-wider">
                                Campus-Wide & Statutory
                              </span>
                            </div>
                          </div>
                          {redressalStream === 'INSTITUTIONAL' && (
                            <span className="w-5 h-5 rounded-full bg-rose-900 dark:bg-amber-400 text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-snug">
                          Anti-Ragging squad, Vimukthi anti-drug cell, campus infrastructure, Women ICC & general administration.
                        </p>
                      </button>

                      {/* Stream 2: Department-Wise Academic Concerns */}
                      <button
                        type="button"
                        onClick={() => handleSelectStream('DEPARTMENT_WISE')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          redressalStream === 'DEPARTMENT_WISE'
                            ? 'border-blue-900 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-900/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${
                              redressalStream === 'DEPARTMENT_WISE' ? 'bg-blue-900 dark:bg-blue-400 text-white dark:text-slate-950' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            }`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-900 dark:text-white font-display">
                                Department-Wise Academic Concerns
                              </h3>
                              <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 tracking-wider">
                                Academic & Department Level
                              </span>
                            </div>
                          </div>
                          {redressalStream === 'DEPARTMENT_WISE' && (
                            <span className="w-5 h-5 rounded-full bg-blue-900 dark:bg-blue-400 text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-snug">
                          Course curriculum delivery, laboratory equipment, continuous evaluation (CE) & seminar facilities.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Section for Selected Stream */}
                  {redressalStream === 'INSTITUTIONAL' ? (
                    <div className="p-4 sm:p-5 rounded-2xl border-2 border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-slate-850 space-y-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold text-rose-950 dark:text-rose-200 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                            Select Institutional Redressal Category / Cell <span className="text-rose-500">*</span>
                          </span>
                          <span className="text-[10px] font-semibold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/50">
                            {INSTITUTIONAL_CATEGORIES.length} Statutory Cells Available
                          </span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 dark:focus:border-amber-400 transition-all cursor-pointer"
                        >
                          {INSTITUTIONAL_CATEGORIES.map((catId) => (
                            <option key={catId} value={catId}>
                              {CATEGORY_CONFIG[catId].label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selected Category Details Card */}
                      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-slate-800 shadow-xs space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {selectedCategoryMeta?.label}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 rounded-md border border-rose-200 dark:border-rose-800/40">
                            Handling Authority: {selectedCategoryMeta?.authorityBadge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {selectedCategoryMeta?.description}
                        </p>
                        <div className="pt-2 border-t border-rose-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 shrink-0" />
                          <span>
                            Confidential Statutory Channel: Under strict vigil of the Institutional Redressal Cell and Principal's Office.
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-slate-850 space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Dropdown 1: Academic Concern Category */}
                        <div>
                          <label className="block text-xs font-bold text-blue-950 dark:text-blue-200 mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                              Academic Concern Category <span className="text-rose-500">*</span>
                            </span>
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 dark:focus:border-amber-400 transition-all cursor-pointer"
                          >
                            {DEPARTMENT_CATEGORIES.map((catId) => (
                              <option key={catId} value={catId}>
                                {CATEGORY_CONFIG[catId].label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Dropdown 2: Academic Department */}
                        <div>
                          <label className="block text-xs font-bold text-blue-950 dark:text-blue-200 mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                              Concerned Academic Department <span className="text-rose-500">*</span>
                            </span>
                          </label>
                          <select
                            value={departmentId}
                            onChange={(e) => setDepartmentId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 dark:focus:border-amber-400 transition-all cursor-pointer"
                          >
                            {academicDepartments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Selected Department Category Details Card */}
                      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-slate-800 shadow-xs space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {selectedCategoryMeta?.label}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800/40">
                            Handling Authority: {academicDepartments.find((d) => d.id === departmentId)?.name || 'Department'} HOD
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {selectedCategoryMeta?.description}
                        </p>
                        <div className="pt-2 border-t border-blue-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                          <span>
                            Direct Academic Routing: Dispatched immediately to the Head of Department for timely internal redressal.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Anonymous / Confidential Toggle */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">Confidential / Whistleblower Reporting</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Protect your identity. Recommended for Anti-Ragging and Drug reporting.</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAnonymous ? 'Anonymous' : 'Include Identity'}</span>
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 accent-rose-900 dark:accent-amber-400 rounded"
                      />
                    </label>
                  </div>

                  {!isAnonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Your Full Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul K"
                          value={complainantName}
                          onChange={(e) => setComplainantName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Admission / Staff No.</label>
                        <input
                          type="text"
                          placeholder="e.g. 2024PH012"
                          value={complainantAdmissionNo}
                          onChange={(e) => setComplainantAdmissionNo(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          placeholder="+91 Mobile number"
                          value={complainantPhone}
                          onChange={(e) => setComplainantPhone(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Grievance Content & Urgency */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Subject / Grievance Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Brief summary of the issue or incident..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 dark:focus:border-amber-400 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Urgency Level <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as ComplaintUrgency)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-900/20 cursor-pointer"
                      >
                        <option value="LOW">Low (Routine Feedback)</option>
                        <option value="MEDIUM">Medium (Needs Attention)</option>
                        <option value="HIGH">High (Urgent Resolution)</option>
                        <option value="EMERGENCY">Emergency (Immediate Intervention)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Location on Campus
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Science Block 2nd floor, Canteen, South Gate, Hostel 1"
                        value={locationOnCampus}
                        onChange={(e) => setLocationOnCampus(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Date of Incident
                      </label>
                      <input
                        type="date"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Detailed Description of Grievance <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Please describe facts, specific times, persons involved (if any), equipment details or maintenance issues clearly..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 dark:focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-slate-900 dark:from-amber-400 dark:to-amber-500 text-white dark:text-slate-950 font-bold text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-amber-300 dark:text-slate-950" />
                  <span>{isSubmitting ? 'Recording Grievance...' : 'Submit Grievance to Designated Authority'}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TRACK GRIEVANCE STATUS */}
        {/* ========================================================================= */}
        {activeTab === 'track' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-6">
            <div className="max-w-xl mx-auto space-y-4">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                  Track Your Grievance Status
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter your official Grievance Ticket Reference Number to check real-time investigation and redressal progress.
                </p>
              </div>

              <form onSubmit={handleTrackSearch} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. GRV-2026-1049"
                  value={trackTicketNo}
                  onChange={(e) => setTrackTicketNo(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm font-bold text-rose-900 dark:text-amber-400 focus:ring-2 focus:ring-rose-900/20"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-900 hover:bg-rose-950 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-amber-300 dark:text-slate-950" />
                  <span>Track</span>
                </button>
              </form>

              {/* Sample Ticket Shortcuts for Testing */}
              <div className="text-center pt-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-1">Click a registered ticket to test live status:</span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['GRV-2026-1049', 'GRV-2026-2184', 'GRV-2026-3401', 'GRV-2026-4512', 'GRV-2026-5623'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setTrackTicketNo(sample);
                        const found = complaintsService.getComplaintByTicketNumber(sample);
                        setTrackedComplaint(found || 'NOT_FOUND');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tracking Result Display */}
            {trackedComplaint === 'NOT_FOUND' && (
              <div className="p-6 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-center space-y-2 max-w-lg mx-auto">
                <AlertCircle className="w-8 h-8 text-rose-700 dark:text-rose-400 mx-auto" />
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">Grievance Ticket Not Found</h4>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  No complaint matches <strong>{trackTicketNo}</strong>. Please verify the ticket code received upon submission.
                </p>
              </div>
            )}

            {trackedComplaint && trackedComplaint !== 'NOT_FOUND' && (
              <div className="max-w-2xl mx-auto p-6 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ticket Number</span>
                    <div className="text-xl font-black font-mono text-rose-900 dark:text-amber-400">{trackedComplaint.ticketNumber}</div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      trackedComplaint.status === 'RESOLVED'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50'
                        : trackedComplaint.status === 'ACTION_TAKEN'
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700/50'
                        : trackedComplaint.status === 'UNDER_INVESTIGATION'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    Status: {trackedComplaint.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Category:</span>
                    <strong>{CATEGORY_CONFIG[trackedComplaint.category]?.label}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Handling Unit:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {trackedComplaint.scope === 'DEPARTMENT_WISE'
                        ? `Department of ${trackedComplaint.departmentName || 'Academic Subject'}`
                        : 'Institutional Grievance & Vigilance Desk'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Registered On:</span>
                    <span>{new Date(trackedComplaint.submittedAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Urgency:</span>
                    <span className="font-bold text-rose-700 dark:text-rose-400">{trackedComplaint.urgency}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Grievance Subject</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{trackedComplaint.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{trackedComplaint.description}</p>
                </div>

                {/* Official Action Notes */}
                {trackedComplaint.actionNotes && trackedComplaint.actionNotes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Official Action Timeline:</span>
                    <div className="space-y-2">
                      {trackedComplaint.actionNotes.map((note) => (
                        <div key={note.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <strong>{note.author}</strong>
                            <span>{new Date(note.timestamp).toLocaleDateString('en-IN')}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Summary */}
                {trackedComplaint.resolutionSummary && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl text-xs space-y-1 text-emerald-950 dark:text-emerald-200">
                    <span className="font-bold block text-emerald-900 dark:text-emerald-300">Final Redressal Summary:</span>
                    <p>{trackedComplaint.resolutionSummary}</p>
                    {trackedComplaint.resolvedBy && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-1">
                        Resolved by: {trackedComplaint.resolvedBy} on{' '}
                        {trackedComplaint.resolvedAt ? new Date(trackedComplaint.resolvedAt).toLocaleDateString('en-IN') : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
