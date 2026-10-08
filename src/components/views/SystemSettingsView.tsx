import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Badge } from '../common/UIComponents';
import { CollegeLogo, COLLEGE_LOGO_WHITE, COLLEGE_LOGO_DARK } from '../common/CollegeLogo';
import { isSupabaseConfigured, SUPABASE_URL, SUPABASE_SCHEMA_SQL } from '../../lib/supabase';
import {
  Settings,
  Database,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Sparkles,
  Server,
  Users,
  Building,
  GraduationCap,
  Bell,
  AlertTriangle,
  Layers,
  BookOpen,
  Save,
  CheckCircle2,
  Lock,
  Smartphone,
  Wrench
} from 'lucide-react';
import { SuperAdminMaintenanceManager } from '../maintenance/SuperAdminMaintenanceManager';

type SettingsTab = 'GENERAL' | 'ATTENDANCE' | 'MAINTENANCE' | 'STRENGTH' | 'DATABASE' | 'NOTIFICATIONS' | 'DANGER';

export const SystemSettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDefaultData,
    programmes,
    updateProgramme,
    admissionBatches,
    updateAdmissionBatch,
    courseOfferings,
    updateCourseOffering,
    courseGroups,
    updateCourseGroup,
    courses,
    departments,
    students,
    studentCourseRegistrations
  } = useCollegeData();

  const { activeRole, isDevAuthMode } = useAuth();
  const canRead = can(activeRole, 'settings', 'read');
  const canUpdate = can(activeRole, 'settings', 'update');
  const canReset = activeRole === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<SettingsTab>('GENERAL');

  // General & Academic Form State
  const [collegeName, setCollegeName] = useState(settings?.collegeName || settings?.institutionName || 'NSS COLLEGE OTTAPALAM');
  const [accreditation, setAccreditation] = useState(settings?.accreditation || "Accredited with 'A' Grade by NAAC");
  const [affiliation, setAffiliation] = useState(settings?.affiliation || 'Affiliated to University of Calicut');
  const [academicYear, setAcademicYear] = useState(settings?.activeAcademicYear || '2026-2027');
  const [activeSemester, setActiveSemester] = useState(settings?.activeSemester || 'S1');
  const [contactEmail, setContactEmail] = useState(settings?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(settings?.contactPhone || '');

  // Attendance Form State
  const [minAttendance, setMinAttendance] = useState(settings?.minAttendancePercentage ?? 75);
  const [warningAttendance, setWarningAttendance] = useState(settings?.warningAttendancePercentage ?? 70);
  const [correctionWindow, setCorrectionWindow] = useState(settings?.attendanceCorrectionWindowHours ?? 24);
  const [requireHodApproval, setRequireHodApproval] = useState(settings?.requireHodApprovalForCorrection ?? true);
  const [isOdAutomatic, setIsOdAutomatic] = useState(settings?.enableOdAutomation ?? true);

  // Notifications State
  const [enablePush, setEnablePush] = useState(settings?.enablePushNotifications ?? true);
  const [enableStudentPortal, setEnableStudentPortal] = useState(settings?.enableStudentPortal ?? true);
  const [enableFacultyPortal, setEnableFacultyPortal] = useState(settings?.enableFacultyPortal ?? true);

  // Editable strength sub-tab
  const [strengthLevel, setStrengthLevel] = useState<'PROGRAMMES' | 'BATCHES' | 'OFFERINGS' | 'GROUPS'>('PROGRAMMES');

  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const triggerSuccess = (msg: string) => {
    setSaveError(null);
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGeneral(true);
    setSaveError(null);
    const res = await updateSettings({
      collegeName,
      institutionName: collegeName,
      institutionLogoText: collegeName,
      accreditation,
      affiliation,
      activeAcademicYear: academicYear,
      activeSemester,
      contactEmail,
      contactPhone
    });
    setIsSavingGeneral(false);
    if (!res.success) {
      setSaveError(res.error || 'Failed to save academic profile to Supabase.');
      return;
    }
    triggerSuccess('General and Academic settings updated successfully in Supabase.');
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAttendance(true);
    setSaveError(null);
    const res = await updateSettings({
      minAttendancePercentage: Number(minAttendance),
      warningAttendancePercentage: Number(warningAttendance),
      attendanceCorrectionWindowHours: Number(correctionWindow),
      requireHodApprovalForCorrection: requireHodApproval,
      enableOdAutomation: isOdAutomatic
    });
    setIsSavingAttendance(false);
    if (!res.success) {
      setSaveError(res.error || 'Failed to save attendance rules to Supabase.');
      return;
    }
    triggerSuccess('Attendance threshold rules updated successfully in Supabase.');
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotifications(true);
    setSaveError(null);
    const res = await updateSettings({
      enablePushNotifications: enablePush,
      enableStudentPortal,
      enableFacultyPortal
    });
    setIsSavingNotifications(false);
    if (!res.success) {
      setSaveError(res.error || 'Failed to save portal access settings to Supabase.');
      return;
    }
    triggerSuccess('Portal access and notification settings saved in Supabase.');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleResetData = () => {
    if (!canReset) return;
    if (confirm('CRITICAL ACTION: Are you sure you want to reset all mock records to the initial NSS College Ottapalam dataset?')) {
      resetToDefaultData();
    }
  };

  if (!canRead) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-lg mx-auto my-8 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          You do not have permission to view or configure institutional system settings. This area is reserved for authorized administrative leadership.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">System Settings</h2>
          <Badge variant="purple" size="sm">
            Admin
          </Badge>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'GENERAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ATTENDANCE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'MAINTENANCE'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : (settings?.maintenanceMode || settings?.maintenanceConfig?.enabled)
                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Maintenance</span>
            {(settings?.maintenanceMode || settings?.maintenanceConfig?.enabled) && (
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('STRENGTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'STRENGTH' ? 'bg-rose-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Strength
          </button>
          <button
            onClick={() => setActiveTab('DATABASE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'DATABASE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Database
          </button>
          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'NOTIFICATIONS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Notifications
          </button>
          {canReset && (
            <button
              onClick={() => setActiveTab('DANGER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'DANGER' ? 'bg-rose-100 text-rose-800' : 'text-rose-600 hover:text-rose-800'
              }`}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Database Error: {saveError}</span>
        </div>
      )}

      {/* TAB 1: GENERAL & ACADEMIC */}
      {activeTab === 'GENERAL' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-rose-900" /> Institutional Profile & Academic Term
            </h3>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg flex items-center gap-2 border border-slate-800" title="White Outline Logo for Dark Surfaces">
                <img src={COLLEGE_LOGO_WHITE} alt="White Outline Logo" referrerPolicy="no-referrer" className="w-6 h-6 object-contain" />
                <span className="text-[10px] text-slate-300 font-bold uppercase hidden md:inline">Dark Canvas</span>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg flex items-center gap-2 border border-slate-200" title="Dark Outline Logo for Light Surfaces">
                <img src={COLLEGE_LOGO_DARK} alt="Dark Outline Logo" referrerPolicy="no-referrer" className="w-6 h-6 object-contain" />
                <span className="text-[10px] text-slate-700 font-bold uppercase hidden md:inline">Light Canvas</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={e => setCollegeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Active Academic Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Accreditation Status
                </label>
                <input
                  type="text"
                  value={accreditation}
                  onChange={e => setAccreditation(e.target.value)}
                  placeholder="e.g. ACCREDITED WITH 'A' GRADE BY NAAC"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  University Affiliation
                </label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={e => setAffiliation(e.target.value)}
                  placeholder="e.g. Affiliated to University of Calicut"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Active Semester Cycle
                </label>
                <select
                  value={activeSemester}
                  onChange={e => setActiveSemester(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white font-medium"
                >
                  <option value="S1">Semester 1 (FYUGP Odd)</option>
                  <option value="S2">Semester 2 (FYUGP Even)</option>
                  <option value="S3">Semester 3 (FYUGP Odd)</option>
                  <option value="S4">Semester 4 (FYUGP Even)</option>
                  <option value="S5">Semester 5 (FYUGP Odd)</option>
                  <option value="S6">Semester 6 (FYUGP Even)</option>
                  <option value="S7">Semester 7 (FYUGP Research Odd)</option>
                  <option value="S8">Semester 8 (FYUGP Research Even)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Office Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Office Contact Phone
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingGeneral}
                className="px-6 py-2.5 bg-rose-900 hover:bg-rose-950 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                {isSavingGeneral ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Academic Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ATTENDANCE RULES */}
      {activeTab === 'ATTENDANCE' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-700" /> FYUGP Attendance Regulations & Safe Harbor
          </h3>

          <form onSubmit={handleSaveAttendance} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  University Minimum (%)
                </label>
                <p className="text-[11px] text-slate-500 mb-3">Mandatory minimum required for university exam eligibility</p>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={minAttendance}
                  onChange={e => setMinAttendance(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-base font-bold text-slate-900"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Early Warning Level (%)
                </label>
                <p className="text-[11px] text-slate-500 mb-3">Triggers warning alert on student radar and tutor dashboard</p>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={warningAttendance}
                  onChange={e => setWarningAttendance(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-base font-bold text-slate-900"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Faculty Correction Window
                </label>
                <p className="text-[11px] text-slate-500 mb-3">Hours teacher has before correction locks and requires HOD approval</p>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={correctionWindow}
                  onChange={e => setCorrectionWindow(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-base font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <label className="p-4 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={requireHodApproval}
                  onChange={e => setRequireHodApproval(e.target.checked)}
                  className="w-4 h-4 text-rose-900 rounded mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Require HOD Approval After Correction Window</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    When enabled, any attendance edit after 24 hours creates a review request for the department head.
                  </div>
                </div>
              </label>

              <label className="p-4 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={isOdAutomatic}
                  onChange={e => setIsOdAutomatic(e.target.checked)}
                  className="w-4 h-4 text-rose-900 rounded mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Auto-Apply Approved On-Duty (OD) Credits</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Automatically convert absent records to OD when sanctioned for NSS/NCC or University sports.
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingAttendance}
                className="px-6 py-2.5 bg-rose-900 hover:bg-rose-950 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                {isSavingAttendance ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Attendance Rules
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: SYSTEM MAINTENANCE & ROLE LOCKOUT */}
      {activeTab === 'MAINTENANCE' && (
        <SuperAdminMaintenanceManager />
      )}

      {/* TAB 3: STUDENT STRENGTH CONFIGURATION (REQUIREMENT 8) */}
      {activeTab === 'STRENGTH' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-900" />
                <h3 className="text-base font-bold text-slate-900">
                  Student Strength & Intake Configuration
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure Expected and Maximum Strength. Currently Enrolled numbers are automatically calculated from live database registrations.
              </p>
            </div>

            {/* Level Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setStrengthLevel('PROGRAMMES')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  strengthLevel === 'PROGRAMMES' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Programmes ({programmes.length})
              </button>
              <button
                onClick={() => setStrengthLevel('BATCHES')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  strengthLevel === 'BATCHES' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Batches ({admissionBatches.length})
              </button>
              <button
                onClick={() => setStrengthLevel('OFFERINGS')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  strengthLevel === 'OFFERINGS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Offerings ({courseOfferings.length})
              </button>
              <button
                onClick={() => setStrengthLevel('GROUPS')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  strengthLevel === 'GROUPS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Groups ({courseGroups.length})
              </button>
            </div>
          </div>

          {/* LEVEL: PROGRAMMES */}
          {strengthLevel === 'PROGRAMMES' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Programme Name</th>
                      <th className="p-3">Parent Department</th>
                      <th className="p-3 w-32">Expected Strength</th>
                      <th className="p-3 w-32">Maximum Strength</th>
                      <th className="p-3 w-36">Currently Enrolled (DB)</th>
                      <th className="p-3 w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {programmes.map(prog => {
                      const enrolledCount = students.filter(s => s.programmeId === prog.id).length;
                      const dept = departments.find(d => d.id === prog.departmentId);
                      const expected = prog.expectedStrength || prog.sanctionedIntake || 60;
                      const max = prog.maxStrength || prog.sanctionedIntake || 72;

                      return (
                        <tr key={prog.id} className="hover:bg-slate-50/70">
                          <td className="p-3 font-mono font-bold text-blue-700">{prog.code}</td>
                          <td className="p-3 font-semibold text-slate-900">{prog.name}</td>
                          <td className="p-3 text-slate-500">{dept?.name || 'Academic'}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              defaultValue={expected}
                              id={`exp-prog-${prog.id}`}
                              className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              defaultValue={max}
                              id={`max-prog-${prog.id}`}
                              className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-bold font-mono">
                                {enrolledCount}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                / {max} cap
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                const expEl = document.getElementById(`exp-prog-${prog.id}`) as HTMLInputElement;
                                const maxEl = document.getElementById(`max-prog-${prog.id}`) as HTMLInputElement;
                                const newExp = Number(expEl?.value || expected);
                                const newMax = Number(maxEl?.value || max);
                                updateProgramme(prog.id, {
                                  expectedStrength: newExp,
                                  maxStrength: newMax,
                                  sanctionedIntake: newMax
                                });
                                triggerSuccess(`Updated strengths for ${prog.code}: Expected ${newExp}, Max ${newMax}`);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold transition-colors"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LEVEL: BATCHES */}
          {strengthLevel === 'BATCHES' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Batch Name</th>
                      <th className="p-3">Academic Year</th>
                      <th className="p-3 w-32">Expected Strength</th>
                      <th className="p-3 w-32">Maximum Strength</th>
                      <th className="p-3 w-36">Currently Enrolled (DB)</th>
                      <th className="p-3 w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admissionBatches.map(batch => {
                      const enrolledCount = students.filter(s => s.admissionBatchId === batch.id).length;
                      const expected = batch.expectedStrength || 60;
                      const max = batch.maxStrength || 72;

                      return (
                        <tr key={batch.id} className="hover:bg-slate-50/70">
                          <td className="p-3 font-bold text-slate-900">{batch.batchName}</td>
                          <td className="p-3 font-mono text-slate-600">{settings.activeAcademicYear}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              defaultValue={expected}
                              id={`exp-batch-${batch.id}`}
                              className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              defaultValue={max}
                              id={`max-batch-${batch.id}`}
                              className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded bg-purple-50 text-purple-800 font-bold font-mono">
                                {enrolledCount}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                / {max} cap
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                const expEl = document.getElementById(`exp-batch-${batch.id}`) as HTMLInputElement;
                                const maxEl = document.getElementById(`max-batch-${batch.id}`) as HTMLInputElement;
                                const newExp = Number(expEl?.value || expected);
                                const newMax = Number(maxEl?.value || max);
                                updateAdmissionBatch(batch.id, {
                                  expectedStrength: newExp,
                                  maxStrength: newMax
                                });
                                triggerSuccess(`Updated strengths for ${batch.batchName}: Expected ${newExp}, Max ${newMax}`);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold transition-colors"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LEVEL: COURSE OFFERINGS */}
          {strengthLevel === 'OFFERINGS' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Course</th>
                      <th className="p-3">Term & Department</th>
                      <th className="p-3 w-32">Expected Strength</th>
                      <th className="p-3 w-32">Maximum Strength</th>
                      <th className="p-3 w-36">Currently Enrolled (DB)</th>
                      <th className="p-3 w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courseOfferings.map(off => {
                      const course = courses.find(c => c.id === off.courseId);
                      const dept = departments.find(d => d.id === off.departmentId);
                      const registeredCount = studentCourseRegistrations.filter(r => r.courseOfferingId === off.id).length;
                      const expected = off.expectedStrength || 60;
                      const max = off.maxStrength || 72;

                      return (
                        <tr key={off.id} className="hover:bg-slate-50/70">
                          <td className="p-3">
                            <div className="font-mono font-bold text-blue-700">{course?.courseCode}</div>
                            <div className="text-slate-800 font-medium truncate max-w-xs">{course?.courseTitle}</div>
                          </td>
                          <td className="p-3 text-slate-500">
                            <div>Sem {off.semesterNumber} • {off.academicYear}</div>
                            <div className="text-[11px] text-slate-400">{dept?.name}</div>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              defaultValue={expected}
                              id={`exp-off-${off.id}`}
                              className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              defaultValue={max}
                              id={`max-off-${off.id}`}
                              className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-bold font-mono">
                                {registeredCount}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                / {max} cap
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                const expEl = document.getElementById(`exp-off-${off.id}`) as HTMLInputElement;
                                const maxEl = document.getElementById(`max-off-${off.id}`) as HTMLInputElement;
                                const newExp = Number(expEl?.value || expected);
                                const newMax = Number(maxEl?.value || max);
                                updateCourseOffering(off.id, {
                                  expectedStrength: newExp,
                                  maxStrength: newMax
                                });
                                triggerSuccess(`Updated strengths for ${course?.courseCode}: Expected ${newExp}, Max ${newMax}`);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold transition-colors"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LEVEL: COURSE GROUPS */}
          {strengthLevel === 'GROUPS' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Group Name</th>
                      <th className="p-3">Offering / Room</th>
                      <th className="p-3 w-32">Expected Strength</th>
                      <th className="p-3 w-32">Maximum Strength</th>
                      <th className="p-3 w-36">Currently Assigned (DB)</th>
                      <th className="p-3 w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courseGroups.map(grp => {
                      const offering = courseOfferings.find(o => o.id === grp.courseOfferingId);
                      const course = courses.find(c => c.id === offering?.courseId);
                      const assignedCount = studentCourseRegistrations.filter(r => r.courseGroupId === grp.id).length;
                      const expected = grp.expectedStrength || grp.capacity || 60;
                      const max = grp.maxStrength || grp.maxCapacity || 72;

                      return (
                        <tr key={grp.id} className="hover:bg-slate-50/70">
                          <td className="p-3 font-bold text-slate-900">{grp.groupName}</td>
                          <td className="p-3 text-slate-600">
                            <span className="font-mono font-bold text-blue-700">{course?.courseCode}</span> • {grp.room}
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              defaultValue={expected}
                              id={`exp-grp-${grp.id}`}
                              className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              defaultValue={max}
                              id={`max-grp-${grp.id}`}
                              className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 font-bold font-mono">
                                {assignedCount}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                / {max} cap
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                const expEl = document.getElementById(`exp-grp-${grp.id}`) as HTMLInputElement;
                                const maxEl = document.getElementById(`max-grp-${grp.id}`) as HTMLInputElement;
                                const newExp = Number(expEl?.value || expected);
                                const newMax = Number(maxEl?.value || max);
                                updateCourseGroup(grp.id, {
                                  expectedStrength: newExp,
                                  maxStrength: newMax,
                                  maxCapacity: newMax,
                                  capacity: newExp
                                });
                                triggerSuccess(`Updated strengths for ${grp.groupName}: Expected ${newExp}, Max ${newMax}`);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold transition-colors"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DATABASE & SUPABASE */}
      {activeTab === 'DATABASE' && (
        <div className="space-y-6">
          {/* Supabase Status Card */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold">Supabase Cloud PostgreSQL State</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSupabaseConfigured
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isSupabaseConfigured ? 'LIVE CONNECTED' : 'LOCAL REACTIVE ENGINE'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Target URL: <span className="font-mono text-amber-300">{SUPABASE_URL}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Full schema alignment with Row Level Security (RLS) policies for Student, Teacher, HOD, and Principal.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedSql ? 'SQL Copied to Clipboard!' : 'Copy PostgreSQL DDL & RLS'}
              </button>
            </div>
          </div>

          {/* DDL Schema Preview */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-slate-300 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">PostgreSQL DDL & RLS Blueprint</span>
              </div>
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-sans font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Copied' : 'Copy Full SQL'}
              </button>
            </div>
            <pre className="max-h-72 overflow-y-auto bg-slate-950 p-4 rounded-xl text-[11px] leading-relaxed text-emerald-400/90 select-all">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: MOBILE & NOTIFICATIONS */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-700" /> Android / Capacitor & Push Notification Settings
          </h3>

          <form onSubmit={handleSaveNotifications} className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="font-bold">Capacitor & Firebase Cloud Messaging (FCM) Integration Architecture</div>
              <p className="text-blue-800 leading-relaxed">
                The mobile build is styled with viewport safe-area insets (`env(safe-area-inset-*)`) and responsive touch controls (min 44px) ready for Android compilation via Capacitor.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="p-4 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={enablePush}
                  onChange={e => setEnablePush(e.target.checked)}
                  className="w-4 h-4 text-rose-900 rounded mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Enable Push Notifications for Attendance Shortages</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Broadcast immediate alerts to students and tutors when attendance drops below the 75% safe harbor.
                  </div>
                </div>
              </label>

              <label className="p-4 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={enableStudentPortal}
                  onChange={e => setEnableStudentPortal(e.target.checked)}
                  className="w-4 h-4 text-rose-900 rounded mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Enable Student Portal Access</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Allow enrolled students to log into their individual student dashboards and live target simulator.
                  </div>
                </div>
              </label>

              <label className="p-4 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={enableFacultyPortal}
                  onChange={e => setEnableFacultyPortal(e.target.checked)}
                  className="w-4 h-4 text-rose-900 rounded mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Enable Faculty Marking Hub</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Allow teachers to capture attendance, record substitute classes, and submit corrections.
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingNotifications}
                className="px-6 py-2.5 bg-rose-900 hover:bg-rose-950 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                {isSavingNotifications ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Mobile & Portal Config
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: DANGER ZONE */}
      {activeTab === 'DANGER' && canReset && (
        <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-2xs space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-100 text-rose-800">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold">Dangerous Zone & State Reset</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Resetting system state will restore all mock attendance records, departments, courses, and timetable schedules to the default NSS College Ottapalam FYUGP seed dataset.
          </p>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-rose-950">Reset Database State</h4>
              <p className="text-[11px] text-rose-800 mt-0.5">
                Clears custom local storage modifications and restores clean NSS seed dataset.
              </p>
            </div>

            <button
              onClick={handleResetData}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-600/20 transition-all shrink-0"
            >
              <RefreshCw className="w-4 h-4" /> Reset Mock State
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
