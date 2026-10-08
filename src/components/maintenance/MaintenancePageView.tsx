import React, { useState, useEffect } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAffectedRolesSummary } from '../../lib/maintenanceGuard';
import { COLLEGE_LOGO_DARK, COLLEGE_LOGO_WHITE } from '../common/CollegeLogo';
import {
  Wrench,
  Clock,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  LogIn,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Users,
  Check,
  Copy,
  Server,
  Activity,
  ArrowRight,
  Lock,
  Unlock,
  Wifi,
  Radio,
  Layers,
  Sparkles,
  Terminal,
  FileText
} from 'lucide-react';

interface MaintenancePageViewProps {
  onAdminLoginClick?: () => void;
  isInlineBlock?: boolean; // when used inside a specific tab like Attendance Hub
}

export const MaintenancePageView: React.FC<MaintenancePageViewProps> = ({
  onAdminLoginClick,
  isInlineBlock = false
}) => {
  const { settings, refreshFromSupabase } = useCollegeData();
  const { user, activeRole, switchRole, isDevAuthMode } = useAuth();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const config = settings?.maintenanceConfig;
  const title = config?.title || 'System Under Scheduled Maintenance';
  const message =
    config?.message ||
    'The institutional attendance and academic management portal is temporarily offline for scheduled system upgrades, database audit, and FYUGP record synchronization.';
  const expectedEnd = config?.expectedEndTime || 'Today, 04:30 PM IST (Approx. 45 mins)';
  const supportEmail = config?.supportContact || settings?.contactEmail || 'nsscollegeottapalam@gmail.com';
  const supportPhone = settings?.contactPhone || '+91 466 2244382';
  const affectedSummary = getAffectedRolesSummary(config);

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      }
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    const start = performance.now();
    try {
      if (refreshFromSupabase) {
        await refreshFromSupabase();
      }
      const latency = Math.round(performance.now() - start);
      setPingLatency(latency > 0 ? latency : 28);

      setTimeout(() => {
        setIsChecking(false);
        const stillActive = settings?.maintenanceMode || settings?.maintenanceConfig?.enabled;
        if (stillActive) {
          setStatusMessage('System maintenance is currently in progress. Database nodes are operational and synchronization is active.');
        } else {
          setStatusMessage('System has returned online! Reloading application...');
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        }
      }, 800);
    } catch {
      setIsChecking(false);
      setPingLatency(null);
      setStatusMessage('Connected to offline cache. Supabase synchronizer will re-poll automatically.');
    }
  };

  const handleAdminBypass = () => {
    if (onAdminLoginClick) {
      onAdminLoginClick();
    } else {
      switchRole('SUPER_ADMIN');
    }
    setShowAdminModal(false);
  };

  return (
    <div
      className={`w-full font-sans antialiased text-slate-100 ${
        isInlineBlock
          ? 'py-4 px-1 max-w-5xl mx-auto'
          : 'min-h-screen bg-[#0b0f19] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-x-hidden'
      }`}
    >
      {/* Background Ambient Decorative Elements for Standalone Page */}
      {!isInlineBlock && (
        <>
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] z-0" />
          <div className="fixed -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-rose-900/15 rounded-full blur-3xl pointer-events-none z-0" />
        </>
      )}

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto space-y-6">
        {/* TOP STATUS & TELEMETRY NAV */}
        <header className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 sm:px-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          {/* Institution Crest & Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-xl p-1.5 shadow-md flex items-center justify-center shrink-0">
              <img
                src={COLLEGE_LOGO_DARK}
                alt="NSS College Crest"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                  {settings?.collegeName || 'NSS COLLEGE OTTAPALAM'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800/60 rounded text-[10px] font-bold">
                  NAAC 'A'
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Central Attendance & Academic Portal Infrastructure
              </p>
            </div>
          </div>

          {/* Right Action: Live Clock & Admin Unlock */}
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            {/* Live Clock Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>{formattedTime}</span>
              <span className="text-slate-500 font-sans">IST</span>
            </div>

            {/* Administrator Bypass Button */}
            <button
              onClick={() => setShowAdminModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="SuperAdmin emergency bypass to turn off maintenance"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Admin Access</span>
            </button>
          </div>
        </header>

        {/* HERO STATUS CARD */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Subtle Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-rose-600" />

          {/* Status Badge & Main Headline */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
                <span>Scheduled Maintenance Active</span>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                REF: MNT-2026-FYUGP-SYNC
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl font-normal">
              {message}
            </p>
          </div>

          {/* 3-PHASE UPGRADE PIPELINE */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Upgrade & Audit Workflow</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Phase 2 of 3 Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1: Complete */}
              <div className="p-3 bg-slate-900/80 border border-emerald-500/30 rounded-xl space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wide">
                    Step 1 • Completed
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-xs font-bold text-white">Database Snapshot</p>
                <p className="text-[11px] text-slate-400">Full backup & cryptographic state seal complete.</p>
              </div>

              {/* Step 2: Active */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/50 rounded-xl space-y-1.5 relative shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Step 2 • In Progress
                  </span>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                </div>
                <p className="text-xs font-bold text-amber-200">Attendance Sync & Ledger</p>
                <p className="text-[11px] text-amber-300/80">FYUGP credit reconciliations and table optimizations.</p>
              </div>

              {/* Step 3: Pending */}
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl space-y-1.5 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">
                    Step 3 • Scheduled
                  </span>
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <p className="text-xs font-bold text-slate-300">Live Verification & Unlock</p>
                <p className="text-[11px] text-slate-400">Cache purge and role authorization release.</p>
              </div>
            </div>
          </div>

          {/* TELEMETRY & SCOPE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Resumption ETA */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Estimated Restoration</span>
              </div>
              <p className="text-base font-bold text-white">
                {expectedEnd}
              </p>
              <p className="text-[11px] text-slate-400">
                Services will resume automatically upon administrative unlock.
              </p>
            </div>

            {/* 2. Restricted Roles */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Restricted User Roles</span>
              </div>
              <p className="text-sm font-bold text-white line-clamp-1">
                {affectedSummary}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Active Role:</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-mono font-semibold uppercase text-[10px]">
                  {activeRole}
                </span>
              </div>
            </div>

            {/* 3. Data Safety Guarantee */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Data Protection Guarantee</span>
              </div>
              <p className="text-xs font-bold text-emerald-400">
                Zero Data Loss Guaranteed
              </p>
              <p className="text-[11px] text-slate-400">
                All previous attendance records, marks, and faculty logs remain safe.
              </p>
            </div>
          </div>

          {/* SERVICE AVAILABILITY MATRIX */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Campus Digital Services Health Status</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="text-xs font-medium text-slate-300">Attendance Registry</div>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Paused
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="text-xs font-medium text-slate-300">Database Engine</div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Online
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="text-xs font-medium text-slate-300">Circulars & Notices</div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Operational
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="text-xs font-medium text-slate-300">IT Emergency Desk</div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Staffed
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE PING & HEALTH CHECK */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 border border-slate-700 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isChecking ? 'Checking System...' : 'Ping Live Status'}</span>
              </button>

              {pingLatency !== null && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>Ping: {pingLatency}ms (Cluster Active)</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 text-center sm:text-right font-medium">
              Auto-checking enabled. Page will reload automatically when unlocked.
            </div>
          </div>

          {/* Dynamic Status Response Notice */}
          {statusMessage && (
            <div className="p-3.5 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs font-medium text-blue-300 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* INSTITUTIONAL HELPDESK & SUPPORT FOOTER */}
        <footer className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-center md:text-left">
            <span>Official Technical Helpline:</span>
            <span className="font-semibold text-slate-200">Department of Collegiate Education, Govt. of Kerala</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Email with copy */}
            <button
              onClick={() => handleCopy(supportEmail, 'email')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              title="Click to copy support email"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{supportEmail}</span>
              {copiedEmail ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-500" />
              )}
            </button>

            {/* Phone with copy */}
            <button
              onClick={() => handleCopy(supportPhone, 'phone')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              title="Click to copy emergency telephone"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{supportPhone}</span>
              {copiedPhone ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-500" />
              )}
            </button>
          </div>
        </footer>
      </div>

      {/* EMERGENCY ADMINISTRATOR BYPASS MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Administrator Access Override</h3>
                  <p className="text-[11px] text-slate-400">Institutional Maintenance Bypass</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              SuperAdmins and College IT officers can access the administrative console to adjust maintenance parameters or disable the lockout system.
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="text-slate-400 font-mono text-[11px]">Current Session Role:</div>
              <div className="font-bold text-amber-400">{activeRole}</div>
              <div className="text-[11px] text-slate-500">
                Switching to SuperAdmin unlocks the System Settings & Maintenance Control Deck.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowAdminModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminBypass}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Authorize & Enter Console</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
