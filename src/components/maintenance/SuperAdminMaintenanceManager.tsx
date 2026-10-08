import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { MaintenanceConfig, UserRole } from '../../types';
import { getAffectedRolesSummary } from '../../lib/maintenanceGuard';
import { MaintenancePageView } from './MaintenancePageView';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Users,
  Shield,
  Clock,
  Eye,
  X,
  Sparkles,
  Lock,
  Unlock,
  Radio,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { Badge, Modal } from '../common/UIComponents';

export const SuperAdminMaintenanceManager: React.FC = () => {
  const { settings, updateSettings } = useCollegeData();

  const currentConfig: MaintenanceConfig = settings?.maintenanceConfig || {
    enabled: settings?.maintenanceMode || false,
    targetScope: 'ALL',
    affectedRoles: ['STUDENT', 'TEACHER', 'HOD', 'OFFICE_STAFF', 'PRINCIPAL'],
    lockoutAttendanceOnly: false,
    title: 'Scheduled System Maintenance',
    message:
      'The institutional attendance and academic management system is currently undergoing scheduled maintenance. Attendance marking, timetable access, and student portals are temporarily unavailable.',
    expectedEndTime: 'Today at 04:00 PM IST',
    supportContact: settings?.contactEmail || 'nsscollegeottapalam@gmail.com'
  };

  const [enabled, setEnabled] = useState<boolean>(
    settings?.maintenanceMode ?? currentConfig.enabled
  );
  const [targetScope, setTargetScope] = useState<'ALL' | 'CUSTOM'>(
    currentConfig.targetScope || 'ALL'
  );
  const [affectedRoles, setAffectedRoles] = useState<UserRole[]>(
    currentConfig.affectedRoles || ['STUDENT', 'TEACHER', 'HOD']
  );
  const [lockoutAttendanceOnly, setLockoutAttendanceOnly] = useState<boolean>(
    currentConfig.lockoutAttendanceOnly || false
  );
  const [title, setTitle] = useState<string>(
    currentConfig.title || 'Scheduled System Maintenance'
  );
  const [message, setMessage] = useState<string>(
    currentConfig.message ||
      'The institutional attendance and academic management system is currently undergoing scheduled maintenance. Attendance marking, timetable access, and student portals are temporarily unavailable.'
  );
  const [expectedEndTime, setExpectedEndTime] = useState<string>(
    currentConfig.expectedEndTime || 'Today at 04:00 PM IST'
  );
  const [supportContact, setSupportContact] = useState<string>(
    currentConfig.supportContact || settings?.contactEmail || 'nsscollegeottapalam@gmail.com'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const toggleRole = (role: UserRole) => {
    setAffectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSave = async (overrides?: Partial<MaintenanceConfig> & { enabled?: boolean }) => {
    setIsSaving(true);
    setSaveError(null);

    const newEnabled = overrides?.enabled !== undefined ? overrides.enabled : enabled;
    const newConfig: MaintenanceConfig = {
      enabled: newEnabled,
      targetScope: overrides?.targetScope ?? targetScope,
      affectedRoles: overrides?.affectedRoles ?? affectedRoles,
      lockoutAttendanceOnly: overrides?.lockoutAttendanceOnly ?? lockoutAttendanceOnly,
      title: overrides?.title ?? title,
      message: overrides?.message ?? message,
      expectedEndTime: overrides?.expectedEndTime ?? expectedEndTime,
      supportContact: overrides?.supportContact ?? supportContact,
      activatedAt: newEnabled ? new Date().toISOString() : undefined,
      activatedBy: 'Super Admin'
    };

    const res = await updateSettings({
      maintenanceMode: newEnabled,
      maintenanceConfig: newConfig
    });

    setIsSaving(false);
    if (!res.success) {
      setSaveError(res.error || 'Failed to save maintenance settings.');
      return;
    }

    if (overrides?.enabled !== undefined) {
      setEnabled(overrides.enabled);
    }
    if (overrides?.targetScope) setTargetScope(overrides.targetScope);
    if (overrides?.affectedRoles) setAffectedRoles(overrides.affectedRoles);

    setSaveSuccess(
      newEnabled
        ? 'System Maintenance Mode ACTIVATED. Restricted users will now see the Under Maintenance page.'
        : 'System Maintenance Mode DEACTIVATED. Full access restored for all students, teachers, and HODs.'
    );
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  // Quick action presets
  const applyPreset = async (type: 'ALL' | 'STUDENTS_ONLY' | 'STAFF_ONLY' | 'OFF') => {
    if (type === 'OFF') {
      await handleSave({ enabled: false });
      return;
    }

    if (type === 'ALL') {
      setTitle('Scheduled Institutional System Maintenance');
      setMessage(
        'The attendance system is currently undergoing critical semester maintenance and database synchronization. Portal services are temporarily offline.'
      );
      setTargetScope('ALL');
      setAffectedRoles(['STUDENT', 'TEACHER', 'HOD', 'OFFICE_STAFF', 'PRINCIPAL']);
      setLockoutAttendanceOnly(false);
      await handleSave({
        enabled: true,
        targetScope: 'ALL',
        affectedRoles: ['STUDENT', 'TEACHER', 'HOD', 'OFFICE_STAFF', 'PRINCIPAL'],
        lockoutAttendanceOnly: false,
        title: 'Scheduled Institutional System Maintenance',
        message:
          'The attendance system is currently undergoing critical semester maintenance and database synchronization. Portal services are temporarily offline.'
      });
    } else if (type === 'STUDENTS_ONLY') {
      setTitle('Student Portal Temporary Freeze');
      setMessage(
        'The student attendance portal is currently closed for internal grade review and end-semester attendance audit. Faculty marking remains operational.'
      );
      setTargetScope('CUSTOM');
      setAffectedRoles(['STUDENT']);
      setLockoutAttendanceOnly(false);
      await handleSave({
        enabled: true,
        targetScope: 'CUSTOM',
        affectedRoles: ['STUDENT'],
        lockoutAttendanceOnly: false,
        title: 'Student Portal Temporary Freeze',
        message:
          'The student attendance portal is currently closed for internal grade review and end-semester attendance audit. Faculty marking remains operational.'
      });
    } else if (type === 'STAFF_ONLY') {
      setTitle('Faculty Attendance Marking Paused');
      setMessage(
        'Timetable and attendance marking are temporarily frozen for course re-allocations and timetable updates.'
      );
      setTargetScope('CUSTOM');
      setAffectedRoles(['TEACHER', 'HOD']);
      setLockoutAttendanceOnly(true);
      await handleSave({
        enabled: true,
        targetScope: 'CUSTOM',
        affectedRoles: ['TEACHER', 'HOD'],
        lockoutAttendanceOnly: true,
        title: 'Faculty Attendance Marking Paused',
        message:
          'Timetable and attendance marking are temporarily frozen for course re-allocations and timetable updates.'
      });
    }
  };

  const activeSummary = getAffectedRolesSummary({
    enabled,
    targetScope,
    affectedRoles
  });

  return (
    <div className="space-y-6">
      {/* Top Status & Master Toggle Card */}
      <div
        className={`rounded-2xl p-6 border transition-all shadow-xs ${
          enabled
            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                enabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Wrench className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  System Maintenance & Role Lockout Control
                </h3>
                {enabled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
                    Maintenance Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Normal System Operations
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                When activated, selected user roles (Students, Teachers, HODs, or Everyone) cannot access the attendance system and will see a dedicated institutional maintenance page. SuperAdmin maintains uninterrupted access.
              </p>
              {enabled && (
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-amber-900">
                  <span className="font-bold">Currently Restricted:</span>
                  <span className="bg-amber-200/80 px-2 py-0.5 rounded-md font-bold">
                    {activeSummary}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span>
                    {lockoutAttendanceOnly
                      ? 'Attendance Marking Only'
                      : 'Complete Portal Lockout'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Master Switch Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Page</span>
            </button>

            {enabled ? (
              <button
                onClick={() => applyPreset('OFF')}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                <span>Turn OFF Maintenance</span>
              </button>
            ) : (
              <button
                onClick={() => handleSave({ enabled: true })}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>Turn ON Maintenance</span>
              </button>
            )}
          </div>
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
          <span>{saveError}</span>
        </div>
      )}

      {/* Quick Action Presets Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-900" />
            <span>Instant Lockout Presets</span>
          </h4>
          <span className="text-[11px] text-slate-500">1-click automated rule configuration</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => applyPreset('ALL')}
            disabled={isSaving}
            className="p-3 text-left rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-amber-950">
              Lock Everyone
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Locks out Students, Teachers, and HODs simultaneously.
            </div>
          </button>

          <button
            onClick={() => applyPreset('STUDENTS_ONLY')}
            disabled={isSaving}
            className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-blue-950">
              Lock Students Only
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Freezes student portal while faculty mark semester attendance.
            </div>
          </button>

          <button
            onClick={() => applyPreset('STAFF_ONLY')}
            disabled={isSaving}
            className="p-3 text-left rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-purple-950">
              Lock Faculty & HODs
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Pauses attendance entry for timetable or course reallocation.
            </div>
          </button>

          <button
            onClick={() => applyPreset('OFF')}
            disabled={isSaving}
            className="p-3 text-left rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-950">
              Restore All Access
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Re-enables portals for students, teachers, and HODs immediately.
            </div>
          </button>
        </div>
      </div>

      {/* Main Configuration Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-700" />
          <span>Granular Role & Maintenance Settings</span>
        </h4>

        {/* 1. Target Scope Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            1. Target Scope (Who is restricted?)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                targetScope === 'ALL'
                  ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="targetScope"
                value="ALL"
                checked={targetScope === 'ALL'}
                onChange={() => setTargetScope('ALL')}
                className="mt-0.5 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Everyone (All Non-Admin Users)
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  Restricts Students, Teachers, HODs, and Administrative Staff. Only SuperAdmin can log in.
                </span>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                targetScope === 'CUSTOM'
                  ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="targetScope"
                value="CUSTOM"
                checked={targetScope === 'CUSTOM'}
                onChange={() => setTargetScope('CUSTOM')}
                className="mt-0.5 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Selected Roles Only (Custom Lockout)
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  Choose exactly which roles (e.g. only Students, or only Teachers and HODs) are locked out.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 2. Granular Role Checkboxes (When CUSTOM is active) */}
        {targetScope === 'CUSTOM' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase">
                Select Roles To Restrict:
              </label>
              <span className="text-[11px] text-slate-500">
                {affectedRoles.length} role category(ies) selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Students */}
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                  affectedRoles.includes('STUDENT')
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={affectedRoles.includes('STUDENT')}
                  onChange={() => toggleRole('STUDENT')}
                  className="mt-0.5 text-emerald-600 rounded"
                />
                <div>
                  <span className="text-xs block">🎓 Students</span>
                  <span className="text-[10px] text-slate-500 font-normal block">
                    Blocks attendance view, digital ID, marks
                  </span>
                </div>
              </label>

              {/* Teachers / Faculty */}
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                  affectedRoles.includes('TEACHER')
                    ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={affectedRoles.includes('TEACHER')}
                  onChange={() => toggleRole('TEACHER')}
                  className="mt-0.5 text-blue-600 rounded"
                />
                <div>
                  <span className="text-xs block">👨‍🏫 Teachers & Tutors</span>
                  <span className="text-[10px] text-slate-500 font-normal block">
                    Blocks timetable attendance marking
                  </span>
                </div>
              </label>

              {/* HODs */}
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                  affectedRoles.includes('HOD')
                    ? 'border-purple-500 bg-purple-50 text-purple-950 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={affectedRoles.includes('HOD')}
                  onChange={() => toggleRole('HOD')}
                  className="mt-0.5 text-purple-600 rounded"
                />
                <div>
                  <span className="text-xs block">🏛️ Department HODs</span>
                  <span className="text-[10px] text-slate-500 font-normal block">
                    Blocks HOD corrections and approvals
                  </span>
                </div>
              </label>

              {/* Office Staff */}
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                  affectedRoles.includes('OFFICE_STAFF')
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={affectedRoles.includes('OFFICE_STAFF')}
                  onChange={() => toggleRole('OFFICE_STAFF')}
                  className="mt-0.5 text-amber-600 rounded"
                />
                <div>
                  <span className="text-xs block">🏢 Office & Admin Staff</span>
                  <span className="text-[10px] text-slate-500 font-normal block">
                    Blocks certificate issues & admissions
                  </span>
                </div>
              </label>

              {/* Principal */}
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                  affectedRoles.includes('PRINCIPAL')
                    ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={affectedRoles.includes('PRINCIPAL')}
                  onChange={() => toggleRole('PRINCIPAL')}
                  className="mt-0.5 text-rose-600 rounded"
                />
                <div>
                  <span className="text-xs block">🏫 Principal Desk</span>
                  <span className="text-[10px] text-slate-500 font-normal block">
                    Locks institutional reports & approvals
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 3. Lockout Depth */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            2. Lockout Depth (How much is locked?)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                !lockoutAttendanceOnly
                  ? 'border-slate-800 bg-slate-50/70 ring-1 ring-slate-800'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="lockoutDepth"
                checked={!lockoutAttendanceOnly}
                onChange={() => setLockoutAttendanceOnly(false)}
                className="mt-0.5 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Complete Portal Lockout (Recommended)
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  Restricted users are blocked from all pages and see the full Under Maintenance page immediately upon entering the portal.
                </span>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                lockoutAttendanceOnly
                  ? 'border-slate-800 bg-slate-50/70 ring-1 ring-slate-800'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="lockoutDepth"
                checked={lockoutAttendanceOnly}
                onChange={() => setLockoutAttendanceOnly(true)}
                className="mt-0.5 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Attendance Marking Lockout Only
                </span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                  Users can view campus news and public notices, but opening Attendance Hub or Timetable displays the Under Maintenance notice.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 4. Display Notice Customization */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            3. Public Notice Details
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notice Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Scheduled System Maintenance"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Resumption Time (Displayed to users)
              </label>
              <input
                type="text"
                value={expectedEndTime}
                onChange={e => setExpectedEndTime(e.target.value)}
                placeholder="Today at 04:00 PM IST"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Maintenance Message / Reason
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Explain why the system is under maintenance..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs leading-relaxed font-medium focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Emergency Contact Email
            </label>
            <input
              type="email"
              value={supportContact}
              onChange={e => setSupportContact(e.target.value)}
              placeholder="nsscollegeottapalam@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>
        </div>

        {/* Save & Apply Controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Changes take effect immediately across all client sessions.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-2xs"
            >
              Preview Under Maintenance Page
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-6 py-2.5 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving Configuration...' : 'Save & Update Maintenance Rules'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Under Maintenance Page (Student & Faculty View Preview)"
          subtitle="This is how affected users will see the portal when locked out"
          maxWidth="max-w-4xl"
        >
          <div className="p-3 bg-[#0b0f19] rounded-2xl max-h-[75vh] overflow-y-auto">
            <MaintenancePageView
              isInlineBlock={true}
              onAdminLoginClick={() => setIsPreviewOpen(false)}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              Close Preview
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
