import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessView } from '../../config/permissions';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedViewProps {
  viewId: string;
  children: React.ReactNode;
  onNavigateFallback?: (tab: string) => void;
}

export const ProtectedView: React.FC<ProtectedViewProps> = ({
  viewId,
  children,
  onNavigateFallback
}) => {
  const { activeRole } = useAuth();

  if (!canAccessView(activeRole, viewId)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Access Restricted</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Your current role (<strong className="text-slate-800">{activeRole}</strong>) does not have authorization to access the <strong>{viewId}</strong> management module.
          </p>
          {onNavigateFallback && (
            <button
              onClick={() => onNavigateFallback('dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
