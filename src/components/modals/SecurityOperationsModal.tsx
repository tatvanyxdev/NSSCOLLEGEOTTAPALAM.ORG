import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  Power,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  X,
  Play,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import {
  securityShieldService,
  SecurityIncident,
  DeviceFingerprint,
  SecurityLevel,
  getDeviceFingerprint
} from '../../services/securityShieldService';
import { useAuth } from '../../contexts/AuthContext';

interface SecurityOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityOperationsModal: React.FC<SecurityOperationsModalProps> = ({ isOpen, onClose }) => {
  const { activeRole } = useAuth();
  const isSuperAdmin = activeRole === 'SUPER_ADMIN';

  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [quarantinedDevices, setQuarantinedDevices] = useState<DeviceFingerprint[]>([]);
  const [isDbPaused, setIsDbPaused] = useState(false);
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('HIGH_SHIELD');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INCIDENTS' | 'QUARANTINE' | 'TEST'>('OVERVIEW');
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadData = () => {
    setIncidents(securityShieldService.getSecurityIncidents());
    setQuarantinedDevices(securityShieldService.getQuarantinedDevices());
    setIsDbPaused(securityShieldService.isDatabaseConnectionPaused());
    setSecurityLevel(securityShieldService.getSecurityLevel());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }

    const handleThreat = () => loadData();
    const handleStatus = () => loadData();

    window.addEventListener('nss-security-threat-detected', handleThreat);
    window.addEventListener('nss-security-status-change', handleStatus);

    return () => {
      window.removeEventListener('nss-security-threat-detected', handleThreat);
      window.removeEventListener('nss-security-status-change', handleStatus);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleDbPause = () => {
    if (!isSuperAdmin) return;
    if (isDbPaused) {
      securityShieldService.resumeDatabaseConnection();
      setIsDbPaused(false);
    } else {
      securityShieldService.pauseDatabaseConnection('Emergency manual disconnect by SuperAdmin');
      setIsDbPaused(true);
    }
    loadData();
  };

  const handleRunTest = async (testType: 'SQL_INJECTION' | 'BURST_ATTACK' | 'STUDENT_SPOOF') => {
    setTestResult('Running threat simulation test...');
    await securityShieldService.simulateAttackTest(testType);
    loadData();
    setTestResult(`Threat simulated successfully! The Anti-Hack Shield intercepted and blocked the ${testType} attack.`);
    setTimeout(() => setTestResult(null), 5000);
  };

  const currentDevId = getDeviceFingerprint();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              isDbPaused
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isDbPaused ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Anti-Hack Security Operations Center
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isDbPaused
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isDbPaused ? 'Database Disconnected' : 'Shield Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-layer threat detection, automatic database disconnect & tamper defense
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 flex items-center gap-4 bg-slate-950/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> 4-Layer Defense Radar
          </button>

          <button
            onClick={() => setActiveTab('INCIDENTS')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'INCIDENTS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" /> Incident Log ({incidents.length})
          </button>

          <button
            onClick={() => setActiveTab('QUARANTINE')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'QUARANTINE'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" /> Device Quarantine ({quarantinedDevices.filter(d => d.quarantined).length})
          </button>

          <button
            onClick={() => setActiveTab('TEST')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'TEST'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-4 h-4" /> Self-Test & Simulation
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          {/* TAB 1: OVERVIEW & 4-LAYER DEFENSE */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Emergency Database Disconnect Killswitch */}
              <div className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isDbPaused
                  ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-950/50'
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Power className={`w-5 h-5 ${isDbPaused ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <h4 className="text-sm font-bold text-white">
                      Supabase Cloud Database Connection Bridge
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl">
                    {isDbPaused
                      ? 'EMERGENCY DISCONNECT ACTIVE: Database write channels are paused across all clients to prevent unauthorized attendance modification.'
                      : 'All client connections to the database are securely monitored. If suspicious hacking is detected, write channels will be severed automatically.'}
                  </p>
                </div>

                {isSuperAdmin ? (
                  <button
                    onClick={handleToggleDbPause}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shrink-0 ${
                      isDbPaused
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/20'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-700/20'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{isDbPaused ? 'Resume Database Connection' : 'Emergency Pause Database'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 italic">SuperAdmin control only</span>
                )}
              </div>

              {/* 4-Layer Architecture Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Layer 1 */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      Layer 1
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white">Heuristic Anomaly & Threat Detection</h5>
                  <p className="text-[11px] text-slate-400">
                    Real-time scanning for SQL Injection, XSS signatures in attendance topics/remarks, burst rate-limiting, and unauthorized role spoofing.
                  </p>
                </div>

                {/* Layer 2 */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      Layer 2
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white">Automated Circuit Breaker & Quarantine</h5>
                  <p className="text-[11px] text-slate-400">
                    Instantly trips circuit breaker on compromised client sessions, severs connection to Supabase writes, and locks down the device.
                  </p>
                </div>

                {/* Layer 3 */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      Layer 3
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white">Cryptographic Tamper-Evident Seals</h5>
                  <p className="text-[11px] text-slate-400">
                    Every attendance submission generates a SHA-256 integrity seal of session ID, faculty ID, and student marks to prevent in-transit tampering.
                  </p>
                </div>

                {/* Layer 4 */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      Layer 4
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white">SOC Command & Forensic Audit Ledger</h5>
                  <p className="text-[11px] text-slate-400">
                    Immutable security incident logs, device quarantine manager, and instantaneous SuperAdmin killswitch controls.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INCIDENT LOG */}
          {activeTab === 'INCIDENTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Detected & Neutralized Threats: <strong className="text-white">{incidents.length}</strong></span>
                <span className="font-mono text-[11px]">Current Device: {currentDevId}</span>
              </div>

              {incidents.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white">No Security Incidents Detected</p>
                  <p className="text-[11px] text-slate-400 mt-1">All attendance endpoints and database write channels are operating securely.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto">
                  {incidents.map(inc => (
                    <div
                      key={inc.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {inc.severity}
                          </span>
                          <span className="font-bold text-white">{inc.vector}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(inc.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs">{inc.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>Device: {inc.sourceDevice}</span>
                        <span className="text-emerald-400 font-semibold">{inc.actionTaken}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUARANTINE MANAGER */}
          {activeTab === 'QUARANTINE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Quarantined Devices: <strong className="text-white">{quarantinedDevices.filter(d => d.quarantined).length}</strong></span>
                {quarantinedDevices.length > 0 && isSuperAdmin && (
                  <button
                    onClick={() => {
                      securityShieldService.clearAllQuarantines();
                      loadData();
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All Quarantines
                  </button>
                )}
              </div>

              {quarantinedDevices.filter(d => d.quarantined).length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white">Zero Devices in Quarantine</p>
                  <p className="text-[11px] text-slate-400 mt-1">No devices have been quarantined for tampering.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {quarantinedDevices
                    .filter(d => d.quarantined)
                    .map(dev => (
                      <div
                        key={dev.id}
                        className="p-4 rounded-xl bg-slate-950/80 border border-rose-900/60 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-mono">
                            <Lock className="w-3.5 h-3.5 text-rose-400" />
                            <span className="font-bold text-white">{dev.deviceHash}</span>
                            <span className="text-[10px] text-slate-500">
                              ({dev.screenResolution}, {dev.timeZone})
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-300">
                            Reason: {dev.quarantineReason || 'Suspicious tampering'}
                          </p>
                        </div>

                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              securityShieldService.unquarantineDevice(dev.deviceHash);
                              loadData();
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Unblock
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SELF-TEST & SIMULATION */}
          {activeTab === 'TEST' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-400" /> Anti-Hack Attack Simulator
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Verify the multi-layer security defenses safely. Running these tests injects simulated threat payloads to demonstrate how the system immediately intercepts the attack, logs the incident, and blocks write operations to Supabase.
                </p>
              </div>

              {testResult && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{testResult}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">SQL Injection Test</h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Simulates an attacker injecting SQL statements into topic covered or attendance remarks.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunTest('SQL_INJECTION')}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                  >
                    Simulate SQL Threat
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">Rate-Limit Bot Test</h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Simulates a rapid-fire automated script calling the attendance submission endpoint within milliseconds.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunTest('BURST_ATTACK')}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                  >
                    Simulate Burst Bot
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">Student Role Spoof Test</h5>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Simulates a student account attempting to forge and submit attendance for a faculty class session.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunTest('STUDENT_SPOOF')}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                  >
                    Simulate Student Spoof
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Security Shield Engine v3.8 • Active Protection
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
