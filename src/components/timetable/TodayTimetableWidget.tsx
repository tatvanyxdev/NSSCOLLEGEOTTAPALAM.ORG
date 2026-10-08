import React, { useState } from 'react';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { DayOfWeek } from '../../types';
import { Calendar, Clock, MapPin, User, AlertCircle, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';

interface TodayTimetableWidgetProps {
  onViewFullTimetable?: () => void;
}

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'MONDAY', label: 'Monday', short: 'Mon' },
  { key: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { key: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { key: 'FRIDAY', label: 'Friday', short: 'Fri' }
];

export const TodayTimetableWidget: React.FC<TodayTimetableWidgetProps> = ({ onViewFullTimetable }) => {
  const { getTodayResolvedTimetable } = usePersonalizedCollege();

  // Get current weekday or default to Monday
  const todayIndex = new Date().getDay();
  const defaultDay: DayOfWeek =
    todayIndex === 1
      ? 'MONDAY'
      : todayIndex === 2
      ? 'TUESDAY'
      : todayIndex === 3
      ? 'WEDNESDAY'
      : todayIndex === 4
      ? 'THURSDAY'
      : todayIndex === 5
      ? 'FRIDAY'
      : 'MONDAY';

  const [activeDay, setActiveDay] = useState<DayOfWeek>(defaultDay);

  const slots = getTodayResolvedTimetable(activeDay);

  const activeDayLabel = DAYS.find(d => d.key === activeDay)?.label || 'Today';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 to-white">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-rose-50 text-rose-800 rounded-lg">
            <Calendar className="w-4 h-4" />
          </span>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Today's Classes</h3>
        </div>

        {/* Day of Week Selector */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl self-start sm:self-auto border border-slate-200/50 max-w-full overflow-x-auto">
          {DAYS.map(d => {
            const isSelected = activeDay === d.key;
            return (
              <button
                key={d.key}
                onClick={() => setActiveDay(d.key)}
                className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  isSelected
                    ? 'bg-white text-rose-950 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Period Slots List */}
      <div className="divide-y divide-slate-100">
        {slots.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No classes defined.
          </div>
        ) : !slots.some(s => !!s.course) ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No classes scheduled for {activeDayLabel}.
          </div>
        ) : (
          slots.map((slot, index) => {
            const hasClass = !!slot.course;
            const isBreak = slot.period.isBreak;

            if (isBreak) {
              return (
                <div
                  key={slot.period.id || index}
                  className="px-5 py-2.5 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500 font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.period.label} ({slot.period.startTime} - {slot.period.endTime})</span>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Intermission</span>
                </div>
              );
            }

            return (
              <div
                key={slot.period.id || index}
                className={`p-4 transition-colors ${
                  slot.isCancelled
                    ? 'bg-rose-50/40 opacity-75'
                    : hasClass
                    ? 'hover:bg-slate-50/50'
                    : 'bg-slate-50/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Period Time & Slot ID */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-500">P{slot.period.periodNumber}</span>
                      <span className="text-xs font-black text-slate-800">
                        {slot.period.startTime.slice(0, 5)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      {hasClass ? (
                        <>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span
                              className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider"
                              style={{
                                backgroundColor: slot.category?.colorHex ? `${slot.category.colorHex}18` : '#e2e8f0',
                                color: slot.category?.colorHex || '#475569'
                              }}
                            >
                              {slot.category?.name || 'Course'}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {slot.course?.courseCode}
                            </span>
                            {slot.isCancelled && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-md flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Cancelled
                              </span>
                            )}
                            {slot.isSubstitute && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-md">
                                Sub: {slot.substituteFacultyName}
                              </span>
                            )}
                          </div>
                          <h4
                            className={`text-xs sm:text-sm font-semibold mt-0.5 text-slate-800 break-words ${
                              slot.isCancelled ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {slot.course?.courseTitle}
                          </h4>
                        </>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-slate-400">Free Period / Self Study</p>
                          <span className="text-xs text-slate-400">
                            {slot.period.startTime} - {slot.period.endTime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Session Status */}
                  {hasClass && (
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs text-slate-600 pt-1 sm:pt-0">
                      {slot.room && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{slot.room}</span>
                        </div>
                      )}

                      {slot.faculty && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{slot.faculty.fullName}</span>
                        </div>
                      )}

                      {/* Attendance / Session Indicator */}
                      {slot.session?.attendanceSubmitted ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Attendance Logged
                        </span>
                      ) : slot.isCancelled ? (
                        <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-md">
                          Cancelled
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          Scheduled
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {onViewFullTimetable && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Includes Major, Minor, MDC, AEC, SEC, and VAC courses</span>
          <button
            onClick={onViewFullTimetable}
            className="text-rose-900 hover:text-rose-950 font-bold flex items-center gap-1 transition-colors"
          >
            View Weekly Grid <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
