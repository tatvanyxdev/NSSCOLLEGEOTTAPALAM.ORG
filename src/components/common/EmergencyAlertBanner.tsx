import React from 'react';
import { EmergencyAlert } from '../../types';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { AlertOctagon, AlertTriangle, X, Clock, ShieldAlert } from 'lucide-react';

interface EmergencyAlertBannerProps {
  alert?: EmergencyAlert | null;
  onDismiss?: (id: string) => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({ alert: propAlert, onDismiss: propOnDismiss }) => {
  const context = usePersonalizedCollege();
  
  const alert = propAlert !== undefined ? propAlert : context?.activeEmergencyAlert;
  const onDismiss = propOnDismiss || context?.dismissEmergencyAlert;

  if (!alert) return null;

  const isCritical = alert.priority === 'CRITICAL' || alert.type === 'CAMPUS_CLOSED' || alert.type === 'CLASSES_SUSPENDED';

  return (
    <div
      className={`rounded-2xl p-3.5 sm:p-4 border transition-all shadow-sm w-full min-w-0 ${
        isCritical
          ? 'bg-rose-900 text-white border-rose-950 shadow-rose-900/20'
          : 'bg-amber-500 text-slate-950 border-amber-600 shadow-amber-500/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              isCritical ? 'bg-rose-800 text-rose-200' : 'bg-amber-600 text-amber-950'
            }`}
          >
            {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                  isCritical ? 'bg-rose-950 text-rose-200' : 'bg-amber-700 text-white'
                }`}
              >
                {alert.type.replace('_', ' ')}
              </span>
              <span className="text-[11px] opacity-80 flex items-center gap-1 font-medium truncate">
                <Clock className="w-3 h-3 shrink-0" />
                Issued: {new Date(alert.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • By {alert.createdByName}
              </span>
            </div>

            <h4 className="text-sm font-bold mt-1 tracking-tight break-words">{alert.title}</h4>
            <p className="text-xs mt-1 leading-relaxed opacity-95 break-words">{alert.message}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              isCritical ? 'hover:bg-rose-800 text-rose-300 hover:text-white' : 'hover:bg-amber-600 text-amber-900 hover:text-black'
            }`}
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
