import React, { useState } from 'react';
import { Modal } from '../common/UIComponents';
import { inferPeriodSession } from '../../utils/dualAttendanceEngine';
import {
  CalendarCheck,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface QuickMarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledClasses: any[];
  onOpenSessionForClass: (item: any) => Promise<void>;
  onNavigateToHub: () => void;
  onNavigateToSpecial?: () => void;
  userRole: string;
}

export const QuickMarkAttendanceModal: React.FC<QuickMarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  scheduledClasses,
  onOpenSessionForClass,
  onNavigateToHub,
  onNavigateToSpecial
}) => {
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const handleMark = async (item: any) => {
    try {
      const id = item.timetableEntry?.id || item.session?.id || 'sess';
      setLoadingItemId(id);
      await onOpenSessionForClass(item);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItemId(null);
    }
  };

  const pendingClasses = scheduledClasses.filter(c => c.isPending && !c.isCancelled);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Attendance"
      subtitle="Select a period below to open its attendance sheet"
      maxWidth="max-w-xl"
    >
      <div className="space-y-3">
        {scheduledClasses.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-semibold text-slate-700 tabular-nums">
                Today&apos;s Periods ({scheduledClasses.length})
              </span>
              {pendingClasses.length > 0 && (
                <span className="font-semibold text-rose-700 tabular-nums">
                  {pendingClasses.length} pending
                </span>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
              {scheduledClasses.map((item, idx) => {
                const itemId = item.timetableEntry?.id || item.session?.id || idx.toString();
                const isLoading = loadingItemId === itemId;
                const slot = inferPeriodSession(item.period, item.session?.periodId);

                return (
                  <div
                    key={itemId}
                    className={`px-3 py-2.5 flex items-center justify-between gap-3 ${
                      item.isCancelled ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 text-center shrink-0 font-mono tabular-nums">
                        <div className="text-xs font-bold text-slate-900">
                          {item.period?.label || `P${item.period?.periodNumber || idx + 1}`}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {slot} · {item.period?.startTime || '09:30'}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.course?.courseCode} · {item.course?.courseTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.courseGroup?.groupName || item.programme?.name} · {item.room || 'LH-101'}
                          {item.isSubstitute ? ' · Substitute' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {item.isCancelled ? (
                        <span className="text-xs font-medium text-slate-500">Cancelled</span>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleMark(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                            item.isConducted
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CalendarCheck className="w-3.5 h-3.5" />
                          )}
                          <span>{item.isConducted ? 'Edit' : 'Mark'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1.5">
            <Clock className="w-5 h-5 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-800">No timetable classes scheduled today</p>
            <p className="text-xs text-slate-500">
              Use Quick Mark on your dashboard or open Attendance Hub to select any subject and period.
            </p>
          </div>
        )}

        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigateToSpecial) onNavigateToSpecial();
            }}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap"
          >
            Special Attendance
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToHub();
            }}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>Attendance Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
