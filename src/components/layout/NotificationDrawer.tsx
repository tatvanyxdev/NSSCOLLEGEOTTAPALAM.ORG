import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { Modal } from '../common/UIComponents';
import { pushNotificationService } from '../../services/pushNotificationService';
import { PushNotificationMessage } from '../../types/pushNotification';
import { SendPushNotificationModal } from '../modals/SendPushNotificationModal';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  FileText,
  Sparkles,
  Radio,
  Send,
  BellRing,
  Volume2,
  ShieldCheck,
  Building2,
  ExternalLink
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { user, activeRole } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useCollegeData();

  const [pushList, setPushList] = useState<PushNotificationMessage[]>(() =>
    pushNotificationService.getNotificationsForUser(activeRole, user?.departmentId)
  );
  const [permissionStatus, setPermissionStatus] = useState<string>(() =>
    pushNotificationService.getPermissionStatus()
  );
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'push'>('all');

  const canSendBroadcast = ['PRINCIPAL', 'HOD', 'SUPER_ADMIN'].includes(activeRole);

  useEffect(() => {
    const unsub = pushNotificationService.subscribe(() => {
      setPushList(pushNotificationService.getNotificationsForUser(activeRole, user?.departmentId));
    });
    return () => unsub();
  }, [activeRole, user]);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const res = await pushNotificationService.requestPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      pushNotificationService.playChime();
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    pushNotificationService.markAllAsRead();
  };

  const handleNotificationClick = (item: PushNotificationMessage) => {
    pushNotificationService.markAsRead(item.id);
    if (item.actionUrl && onNavigate) {
      onNavigate(item.actionUrl);
      onClose();
    }
  };

  const unreadPushCount = pushList.filter((n) => !pushNotificationService.isRead(n.id)).length;
  const unreadStandardCount = notifications.filter((n) => !n.isRead).length;
  const totalUnread = unreadPushCount + unreadStandardCount;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Notifications & Push Broadcasts"
        subtitle="Institutional announcements, live directives & system alerts"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {/* Push Notification Browser Permission Bar */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 text-amber-300 shrink-0">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight">
                  Browser Push Notifications
                </span>
                <span className="text-[10px] text-slate-300">
                  Status:{' '}
                  <strong className="text-amber-300 capitalize">
                    {permissionStatus === 'granted'
                      ? 'Enabled (Live)'
                      : permissionStatus === 'denied'
                      ? 'Blocked by Browser'
                      : 'Permission Pending'}
                  </strong>
                </span>
              </div>
            </div>

            {permissionStatus !== 'granted' ? (
              <button
                type="button"
                onClick={handleEnablePush}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                Enable Push
              </button>
            ) : (
              <button
                type="button"
                onClick={() => pushNotificationService.playChime()}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 shrink-0"
                title="Test audio chime"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Sound</span>
              </button>
            )}
          </div>

          {/* Authority Send Broadcast Trigger */}
          {canSendBroadcast && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-blue-950 block">
                  Broadcast Dispatcher Control
                </span>
                <span className="text-[11px] text-blue-800">
                  {activeRole === 'PRINCIPAL'
                    ? 'Broadcast campus directives to all students & departments'
                    : activeRole === 'HOD'
                    ? 'Send instant push alerts to department students & faculty'
                    : 'Dispatch global system broadcasts & emergency alerts'}
                </span>
              </div>
              <button
                onClick={() => setIsSendModalOpen(true)}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-amber-300" />
                <span>Send Message</span>
              </button>
            </div>
          )}

          {/* Sub-header controls */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              {totalUnread} Unread alerts
            </span>
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {/* 1. Push Broadcast Messages */}
            {pushList.map((n) => {
              const isRead = pushNotificationService.isRead(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isRead
                      ? 'bg-white border-slate-200 opacity-75'
                      : n.priority === 'EMERGENCY'
                      ? 'bg-rose-50 border-rose-300 shadow-xs'
                      : n.priority === 'HIGH'
                      ? 'bg-amber-50 border-amber-300 shadow-xs'
                      : 'bg-blue-50/70 border-blue-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div
                        className={`p-1.5 rounded-lg text-white shrink-0 mt-0.5 ${
                          n.priority === 'EMERGENCY'
                            ? 'bg-rose-600'
                            : n.priority === 'HIGH'
                            ? 'bg-amber-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded font-mono ${
                              n.priority === 'EMERGENCY'
                                ? 'bg-rose-600 text-white'
                                : n.priority === 'HIGH'
                                ? 'bg-amber-500 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {n.priority}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {n.senderName}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                          {n.title}
                        </h5>
                      </div>
                    </div>
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 pl-7 leading-relaxed">
                    {n.body}
                  </p>

                  <div className="text-[10px] text-slate-400 mt-2 pl-7 flex items-center justify-between">
                    <span>
                      {new Date(n.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}{' '}
                      •{' '}
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {n.actionUrl && (
                      <span className="text-blue-600 font-bold flex items-center gap-1">
                        Open view <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 2. System / Academic Activity Notifications */}
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  n.isRead
                    ? 'bg-white border-slate-200 opacity-75'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {n.type === 'ATTENDANCE_WARNING' && (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    {n.type === 'SUBMISSION_PENDING' && (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    {n.type === 'CORRECTION_REQUEST' && (
                      <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                    )}
                    {n.type === 'SYSTEM' && (
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <h5 className="text-xs font-bold text-slate-900">{n.title}</h5>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 pl-6 leading-relaxed">{n.body}</p>
                <p className="text-[10px] text-slate-400 mt-2 pl-6">
                  {new Date(n.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))}

            {pushList.length === 0 && notifications.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No notifications or broadcasts recorded yet.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Broadcast Composer Modal */}
      {isSendModalOpen && (
        <SendPushNotificationModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
        />
      )}
    </>
  );
};
