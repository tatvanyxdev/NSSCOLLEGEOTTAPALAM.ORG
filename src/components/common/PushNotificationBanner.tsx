import React, { useState, useEffect } from 'react';
import { PushNotificationMessage } from '../../types/pushNotification';
import { pushNotificationService } from '../../services/pushNotificationService';
import { useAuth } from '../../contexts/AuthContext';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  Radio,
  X,
  ArrowRight,
  Sparkles,
  Volume2
} from 'lucide-react';

interface PushNotificationBannerProps {
  onNavigate?: (tab: string) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({ onNavigate }) => {
  const { user, activeRole } = useAuth();
  const [activeAlert, setActiveAlert] = useState<PushNotificationMessage | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>(() =>
    pushNotificationService.getPermissionStatus()
  );
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    // Subscribe to incoming push notifications
    const unsubscribe = pushNotificationService.subscribeToNewArrivals((notif) => {
      // Check if alert is targeted to this user
      if (pushNotificationService.isNotificationForUser(notif, activeRole, user?.departmentId)) {
        setActiveAlert(notif);

        // Auto-dismiss after 8 seconds unless EMERGENCY
        if (notif.priority !== 'EMERGENCY') {
          setTimeout(() => {
            setActiveAlert((curr) => (curr?.id === notif.id ? null : curr));
          }, 8000);
        }
      }
    });

    // Check if browser notifications are supported but permission is default
    if (pushNotificationService.isPushSupported() && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        setShowPermissionPrompt(true);
      }, 4000);
      return () => {
        unsubscribe();
        clearTimeout(timer);
      };
    }

    return () => unsubscribe();
  }, [activeRole, user]);

  const handleRequestPermission = async () => {
    const res = await pushNotificationService.requestPermission();
    setPermissionStatus(res);
    setShowPermissionPrompt(false);
  };

  const handleDismissAlert = () => {
    if (activeAlert) {
      pushNotificationService.markAsRead(activeAlert.id);
    }
    setActiveAlert(null);
  };

  const handleActionClick = () => {
    if (activeAlert?.actionUrl && onNavigate) {
      onNavigate(activeAlert.actionUrl);
    }
    handleDismissAlert();
  };

  return (
    <>
      {/* 1. Browser Push Permission Prompt Strip (Non-intrusive) */}
      {showPermissionPrompt && permissionStatus === 'default' && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md relative z-40 border-b border-blue-400/20 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
            <span>
              <strong>Enable Push Notifications:</strong> Receive live broadcast alerts from the Principal, HOD, and Exam cell directly on your desktop or mobile.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-[11px] shadow-xs transition-colors cursor-pointer"
            >
              Allow Notifications
            </button>
            <button
              onClick={() => setShowPermissionPrompt(false)}
              className="p-1 text-slate-300 hover:text-white rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Push Notification Arrival Toast Banner */}
      {activeAlert && (
        <div className="fixed top-4 right-4 sm:right-6 max-w-md w-[calc(100vw-2rem)] z-50 animate-in slide-in-from-top-4 zoom-in-95 duration-200 shadow-2xl">
          <div
            className={`rounded-2xl border-2 p-4 text-white shadow-xl backdrop-blur-md ${
              activeAlert.priority === 'EMERGENCY'
                ? 'bg-rose-950/95 border-rose-500 shadow-rose-950/50'
                : activeAlert.priority === 'HIGH'
                ? 'bg-amber-950/95 border-amber-500 shadow-amber-950/50'
                : 'bg-slate-950/95 border-blue-500 shadow-slate-950/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                    activeAlert.priority === 'EMERGENCY'
                      ? 'bg-rose-600 animate-pulse'
                      : activeAlert.priority === 'HIGH'
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                  }`}
                >
                  {activeAlert.priority === 'EMERGENCY' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : activeAlert.priority === 'HIGH' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Radio className="w-5 h-5 animate-pulse" />
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                      {activeAlert.priority}
                    </span>
                    <span className="text-xs text-amber-300 font-semibold truncate">
                      {activeAlert.senderName}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {activeAlert.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {activeAlert.body}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismissAlert}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Strip */}
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">
                {new Date(activeAlert.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>

              <div className="flex items-center gap-2">
                {activeAlert.actionUrl && onNavigate && (
                  <button
                    onClick={handleActionClick}
                    className="px-3 py-1 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <span>View in Portal</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={handleDismissAlert}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
