import React, { useState } from 'react';
import { Modal, Badge } from '../common/UIComponents';
import {
  CalendarCheck,
  Clock,
  BookOpen,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  CalendarX,
  AlertCircle
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
  onNavigateToSpecial,
  userRole
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
  const conductedClasses = scheduledClasses.filter(c => c.isConducted);
  const cancelledClasses = scheduledClasses.filter(c => c.isCancelled);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Mark Attendance"
      subtitle="Instantly conduct attendance for today's scheduled lectures or open the central hub"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {scheduledClasses.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Today's Scheduled Periods ({scheduledClasses.length})
              </span>
              {pendingClasses.length > 0 && (
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  ● {pendingClasses.length} Pending
                </span>
              )}
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {scheduledClasses.map((item, idx) => {
                const itemId = item.timetableEntry?.id || item.session?.id || idx.toString();
                const isLoading = loadingItemId === itemId;

                return (
                  <div
                    key={itemId}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.isCancelled
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : item.isConducted
                        ? 'bg-emerald-50/30 border-emerald-200/80'
                        : 'bg-white border-slate-200 hover:border-rose-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-700 shrink-0 text-center min-w-[54px]">
                        <div className="text-xs font-bold text-slate-900">
                          {item.period?.label || `P${item.period?.periodNumber || idx + 1}`}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {item.period?.startTime || '09:30'}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {item.course?.courseCode} - {item.course?.courseTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.programme?.name} • Sem {item.timetableEntry?.semester || 1} • Room: {item.room || 'LH-101'}
                          {item.isSubstitute && (
                            <span className="ml-1 text-purple-700 font-bold">(Substitute Assigned)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      {item.isCancelled ? (
                        <Badge variant="neutral" size="sm">
                          Cancelled
                        </Badge>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleMark(item)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all ${
                            item.isConducted
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              : 'bg-rose-900 hover:bg-rose-950 text-white'
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <CalendarCheck className="w-3.5 h-3.5" />
                              <span>{item.isConducted ? 'Edit Attendance' : 'Mark Now'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              No Specific Timetable Classes Assigned for Today
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You do not have pending scheduled lectures assigned for today. You can open the central Attendance Hub to record, edit, or search any departmental attendance records.
            </p>
          </div>
        )}

        {/* Action Shortcuts */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigateToSpecial) onNavigateToSpecial();
            }}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Special / Extra Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToHub();
            }}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Open Central Attendance Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
