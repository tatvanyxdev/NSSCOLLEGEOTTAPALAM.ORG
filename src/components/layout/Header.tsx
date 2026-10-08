import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { UserRole } from '../../types';
import { CollegeLogo } from '../common/CollegeLogo';
import {
  Bell,
  LogOut,
  ChevronDown,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Menu,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Database,
  Search,
  KeyRound,
  X,
  Lock,
  UserCheck,
  Wrench
} from 'lucide-react';
import { securityShieldService } from '../../services/securityShieldService';
import { pushNotificationService } from '../../services/pushNotificationService';
import { SecurityOperationsModal } from '../modals/SecurityOperationsModal';
import { ThemeToggleButton, ThemeToggleSwitch } from '../common/ThemeToggle';

interface HeaderProps {
  onOpenSidebar?: () => void;
  onOpenNotifications: () => void;
  onOpenRoleSwitcher: () => void;
  onOpenSearch?: () => void;
  onOpenMaintenance?: () => void;
  activeTabTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenNotifications,
  onOpenRoleSwitcher,
  onOpenSearch,
  onOpenMaintenance,
  activeTabTitle = 'Dashboard'
}) => {
  const { user, activeRole, availableRoles, switchRole, logout } = useAuth();
  const {
    settings,
    notifications,
    isDbConnected,
    syncStatus,
    domainHealth,
    lastSyncTimestamp,
    syncWithDatabase
  } = useCollegeData();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isSyncingManually, setIsSyncingManually] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isDbPaused, setIsDbPaused] = useState(securityShieldService.isDatabaseConnectionPaused());
  const [threatCount, setThreatCount] = useState(securityShieldService.getSecurityIncidents().length);

  useEffect(() => {
    const handleStatus = () => {
      setIsDbPaused(securityShieldService.isDatabaseConnectionPaused());
      setThreatCount(securityShieldService.getSecurityIncidents().length);
    };
    window.addEventListener('nss-security-threat-detected', handleStatus);
    window.addEventListener('nss-security-status-change', handleStatus);
    return () => {
      window.removeEventListener('nss-security-threat-detected', handleStatus);
      window.removeEventListener('nss-security-status-change', handleStatus);
    };
  }, []);

  const [pushUnreadCount, setPushUnreadCount] = useState(() =>
    pushNotificationService.getUnreadCount(activeRole, user?.departmentId)
  );

  useEffect(() => {
    const unsub = pushNotificationService.subscribe(() => {
      setPushUnreadCount(pushNotificationService.getUnreadCount(activeRole, user?.departmentId));
    });
    return () => unsub();
  }, [activeRole, user]);

  const unreadCount = notifications.filter(n => !n.isRead).length + pushUnreadCount;

  const handleManualResync = async () => {
    setIsSyncingManually(true);
    await syncWithDatabase();
    setIsSyncingManually(false);
  };

  const domainCount = domainHealth ? Object.keys(domainHealth).length : 0;
  const healthyCount = domainHealth
    ? Object.values(domainHealth).filter((h: any) => h === 'ok' || h === 'empty').length
    : 0;

  const roleLabels: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    PRINCIPAL: 'Principal',
    HOD: 'Head of Department',
    TEACHER: 'Faculty / Teacher',
    CLASS_TUTOR: 'Class Tutor',
    COURSE_COORDINATOR: 'Course Coordinator',
    ATTENDANCE_COORDINATOR: 'Attendance Coordinator',
    OFFICE_STAFF: 'Office Staff',
    STUDENT: 'Student'
  };

  const currentRoleName = roleLabels[activeRole] || activeRole;

  // Security RBAC Check:
  // Students must NEVER be able to switch roles or open the Role Switcher.
  // SuperAdmin has full role switcher privileges.
  // Multi-role staff can only switch between their assigned roles via profile.
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || activeRole === 'SUPER_ADMIN';
  const isStudent = activeRole === 'STUDENT' || user?.roles?.includes('STUDENT');
  const canOpenRoleSwitcherModal = isSuperAdmin && !isStudent;

  const currentFaculty = useCollegeData().faculty.find(
    f =>
      f.id === user?.id ||
      f.id === user?.facultyProfile?.id ||
      (f.email && user?.email && f.email.toLowerCase() === user.email.toLowerCase())
  );
  const { updateFaculty } = useCollegeData();

  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [credSaveMessage, setCredSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenCredentialsModal = () => {
    setIsProfileOpen(false);
    const targetFac = currentFaculty || user?.facultyProfile;
    setProfileUsername(targetFac?.username || user?.email?.split('@')[0] || '');
    setProfilePassword(targetFac?.password || 'Staff2026!');
    setProfilePhone(targetFac?.phoneNumber || targetFac?.mobileNumber || '');
    setCredSaveMessage(null);
    setIsCredentialModalOpen(true);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredSaveMessage(null);
    const targetFac = currentFaculty || user?.facultyProfile;
    if (!targetFac) {
      setCredSaveMessage({ type: 'error', text: 'No associated faculty profile found for this account.' });
      return;
    }

    const cleanUsername = profileUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (cleanUsername.length < 3) {
      setCredSaveMessage({ type: 'error', text: 'Username must be at least 3 characters and contain only letters, numbers, dot, underscore, or hyphen.' });
      return;
    }

    const cleanPassword = profilePassword.trim();
    if (cleanPassword.length < 4) {
      setCredSaveMessage({ type: 'error', text: 'Password must be at least 4 characters long.' });
      return;
    }

    setIsSavingCreds(true);
    const res = await updateFaculty(targetFac.id, {
      username: cleanUsername,
      password: cleanPassword,
      phoneNumber: profilePhone.trim() || targetFac.phoneNumber,
      mobileNumber: profilePhone.trim() || targetFac.phoneNumber
    });

    setIsSavingCreds(false);
    if (res.success) {
      setCredSaveMessage({ type: 'success', text: `Staff portal username "${cleanUsername}" successfully updated & permanently saved!` });
      setTimeout(() => {
        setIsCredentialModalOpen(false);
      }, 1400);
    } else {
      setCredSaveMessage({ type: 'error', text: res.error || 'Failed to update credentials.' });
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2.5 sm:px-6 lg:px-8 flex items-center justify-between z-30 shrink-0 select-none w-full max-w-full text-slate-900 dark:text-slate-100">
      {/* Left: Mobile hamburger & Breadcrumb */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1 mr-1.5 sm:mr-2">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-1 sm:p-2 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="md:hidden shrink-0">
          <CollegeLogo size="xs" variant="icon" />
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 text-slate-500 text-xs sm:text-sm truncate min-w-0">
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs sm:text-sm">
            {activeTabTitle}
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight truncate hidden sm:inline">
            {currentRoleName}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Supabase PostgreSQL Status Indicator & Health Details */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsHealthOpen(!isHealthOpen)}
            className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium border transition-all ${
              syncStatus === 'CONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : syncStatus === 'SYNCING'
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : syncStatus === 'PARTIAL'
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
            title="Click to view Supabase database sync health and manually trigger resync"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'CONNECTED'
                  ? 'bg-emerald-500 animate-pulse'
                  : syncStatus === 'SYNCING'
                  ? 'bg-blue-500 animate-ping'
                  : syncStatus === 'PARTIAL'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold hidden sm:inline text-[11px]">
              {syncStatus === 'CONNECTED'
                ? 'Online'
                : syncStatus === 'SYNCING'
                ? 'Syncing'
                : syncStatus === 'PARTIAL'
                ? 'Partial'
                : 'Offline'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60 hidden sm:inline" />
          </button>

          {isHealthOpen && (
            <div
              className="absolute right-0 sm:right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900">Database Sync</h4>
                </div>
                <button
                  type="button"
                  disabled={isSyncingManually || syncStatus === 'SYNCING'}
                  onClick={handleManualResync}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  title="Resync records"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingManually ? 'animate-spin' : ''}`} />
                  <span>Resync</span>
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {syncStatus === 'CONNECTED' ? 'Synchronized' : syncStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Tables:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {healthyCount} / {domainCount} Active
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Last Synced:</span>
                  <span className="text-slate-700 font-mono text-[11px]">
                    {lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleTimeString() : 'Startup'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Shield Pill (Tablet & Desktop) */}
        <button
          type="button"
          onClick={() => setIsSecurityModalOpen(true)}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
            isDbPaused
              ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 animate-pulse'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          }`}
          title="Security status"
        >
          {isDbPaused ? (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          <span className="font-semibold hidden lg:inline text-[11px]">
            {isDbPaused ? 'Paused' : 'Security'}
          </span>
          {threatCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[9px] font-bold">
              {threatCount}
            </span>
          )}
        </button>

        {/* System Maintenance Active Pill */}
        {(settings?.maintenanceMode || settings?.maintenanceConfig?.enabled) && (
          <button
            onClick={onOpenMaintenance}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200 shadow-2xs animate-pulse"
            title="System Maintenance Mode is currently ACTIVE. Click to configure."
          >
            <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Maintenance Active
            </span>
          </button>
        )}

        {/* Academic Year & Semester Pill */}
        <div className="hidden sm:flex items-center px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 text-xs font-medium shadow-2xs">
          <span className="mr-1.5 font-bold uppercase text-amber-900">AY:</span>
          <span>
            {settings.activeAcademicYear} ({settings.activeSemester})
          </span>
        </div>

        {/* Universal Search Trigger */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
            title="Search campus circulars, faculty, courses (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline text-slate-500">Search campus...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.2 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Role Switcher Pill - STRICTLY visible only to SUPER_ADMIN to test/preview portals */}
        {canOpenRoleSwitcherModal ? (
          <button
            onClick={onOpenRoleSwitcher}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-bold border border-blue-200 transition-colors shadow-2xs"
            title="SuperAdmin: Switch role or preview portals"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="hidden md:inline max-w-[130px] truncate">{currentRoleName}</span>
            <ChevronDown className="w-3 h-3 text-blue-400 shrink-0" />
          </button>
        ) : (
          /* For standard users (Faculty, HOD, Student), display a clean non-interactive role badge */
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="max-w-[130px] truncate">{currentRoleName}</span>
          </div>
        )}

        {/* Accessible Dark / Light Mode Switch */}
        <ThemeToggleButton
          variant="outline"
          size="sm"
          className="rounded-full w-7 h-7 sm:w-8 sm:h-8"
        />

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-rose-500 text-white text-[8px] sm:text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-0.5 sm:p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={user?.name || 'User'}
              referrerPolicy="no-referrer"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
            />
          </button>

          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setIsProfileOpen(false)}
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {currentRoleName}
                  </span>
                  {(currentFaculty?.username || user?.facultyProfile?.username) && (
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      @{currentFaculty?.username || user?.facultyProfile?.username}
                    </span>
                  )}
                </div>
              </div>

              {/* Staff Portal Credentials Edit */}
              {!isStudent && (
                <div className="px-2 py-1.5 border-b border-slate-100">
                  <button
                    onClick={handleOpenCredentialsModal}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-md font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      Staff Credentials
                    </span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-100">
                      Edit
                    </span>
                  </button>
                </div>
              )}

              {/* Quick Role Switch - NEVER visible to students; only shown for staff with legitimately assigned multiple roles */}
              {!isStudent && availableRoles.length > 1 && (
                <div className="px-2 py-1.5 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Assigned Roles
                  </p>
                  {availableRoles.map(r => (
                    <button
                      key={r}
                      onClick={() => switchRole(r)}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md font-medium flex items-center justify-between transition-colors ${
                        r === activeRole
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{roleLabels[r]}</span>
                      {r === activeRole && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Theme Preference Switch */}
              <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Display Theme</span>
                <ThemeToggleSwitch size="sm" showLabels={true} />
              </div>

              <div className="p-1">
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Staff Portal Credentials Modal */}
      {isCredentialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Staff Portal Credentials</h3>
                  <p className="text-xs text-slate-500">Update your login username & credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsCredentialModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="p-6 space-y-4">
              {credSaveMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    credSaveMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {credSaveMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{credSaveMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Staff Portal Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileUsername}
                  onChange={e => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  placeholder="e.g. anita_cs or prof_smith"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  At least 3 characters. Use letters, numbers, dot, underscore, or hyphen.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Staff Portal Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={profilePassword}
                  onChange={e => setProfilePassword(e.target.value)}
                  placeholder="Staff2026!"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Minimum 4 characters. Used to log into the staff portal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contact Mobile Number
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  placeholder="+91 94471 23456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingCreds}
                  onClick={() => setIsCredentialModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCreds}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSavingCreds ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Save Credentials
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Security Operations Modal */}
      <SecurityOperationsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </header>
  );
};

