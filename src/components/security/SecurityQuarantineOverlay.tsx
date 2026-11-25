import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Unlock, AlertTriangle, RefreshCw, KeyRound, Terminal } from 'lucide-react';
import { securityShieldService, getDeviceFingerprint } from '../../services/securityShieldService';
import { useAuth } from '../../contexts/AuthContext';

export const SecurityQuarantineOverlay: React.FC = () => {
  const { activeRole, user } = useAuth();
  const [isQuarantined, setIsQuarantined] = useState(false);
  const [quarantineReason, setQuarantineReason] = useState<string>('Suspicious payload or rate-limit violation detected.');
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const isSuperAdmin = Boolean(user?.roles?.includes('SUPER_ADMIN'));
  const deviceId = getDeviceFingerprint();

  const checkStatus = () => {
    const quarantined = securityShieldService.isCurrentDeviceQuarantined();
    setIsQuarantined(quarantined);
    if (quarantined) {
      const dev = securityShieldService.getQuarantinedDevices().find(d => d.deviceHash === deviceId);
      if (dev?.quarantineReason) {
        setQuarantineReason(dev.quarantineReason);
      }
    }
  };

  useEffect(() => {
    checkStatus();

    const handleQuarantine = (e: any) => {
      setIsQuarantined(true);
      if (e.detail?.reason) {
        setQuarantineReason(e.detail.reason);
      }
    };

    const handleStatusChange = () => {
      checkStatus();
    };

    window.addEventListener('nss-security-quarantine-triggered', handleQuarantine);
    window.addEventListener('nss-security-status-change', handleStatusChange);

    return () => {
      window.removeEventListener('nss-security-quarantine-triggered', handleQuarantine);
      window.removeEventListener('nss-security-status-change', handleStatusChange);
    };
  }, [deviceId]);

  if (!isQuarantined) return null;

  const handleManualUnlock = async () => {
    setUnlockError(null);
    if (!isSuperAdmin) {
      setUnlockError('Only an authenticated Super Administrator session can release a quarantined device.');
      return;
    }
    setIsUnlocking(true);
    const res = await securityShieldService.unquarantineDevice(deviceId);
    setIsUnlocking(false);
    if (res.success) {
      setIsQuarantined(false);
      setUnlockCode('');
    } else {
      setUnlockError(res.error || 'Server rejected device unquarantine request.');
    }
  };

  return (
    <div className="fixed inset-0 z-9999 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-rose-600/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl shadow-rose-950/80 relative overflow-hidden">
        {/* Glowing warning halo */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/50 flex items-center justify-center mx-auto mb-4 text-rose-500 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
            Security Defense Active
          </span>

          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white mt-3">
            Device Access Suspended
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            The automated security protocol has detected an anomalous payload or unauthorized tampering attempt.
            To safeguard college records, <strong className="text-rose-400">write connections to the Supabase database have been severed</strong> for this device.
          </p>

          {/* Incident Diagnostic Box */}
          <div className="mt-5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left font-mono text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1.5 mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                <Terminal className="w-3.5 h-3.5 text-amber-400" /> Security Telemetry
              </span>
              <span className="text-[10px] text-rose-400 font-bold">CIRCUIT_BREAKER_TRIPPED</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Device Hash:</span>
              <span className="text-slate-300 font-bold">{deviceId}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-[11px]">
              <span className="text-slate-500">Trigger Reason:</span>
              <span className="text-amber-300 font-semibold break-words">{quarantineReason}</span>
            </div>
          </div>

          {/* Recovery / Unlock section */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
            {isSuperAdmin ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isUnlocking}
                  onClick={handleManualUnlock}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-700/30 transition-all cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isUnlocking ? 'Verifying Server Authorization...' : 'SuperAdmin Override: Restore Connection'}</span>
                </button>
                {unlockError && <p className="text-[11px] text-rose-400 font-semibold">{unlockError}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2 justify-center">
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Device release requires verified Super Administrator clearance in the SOC panel.</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Please contact college IT administration or SuperAdmin with Device Hash <span className="font-mono text-slate-300">{deviceId}</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
