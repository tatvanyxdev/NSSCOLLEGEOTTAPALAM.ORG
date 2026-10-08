import React, { useState } from 'react';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { useAuth } from '../../contexts/AuthContext';
import { AcademicCalendarEvent, AcademicEventType } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Filter,
  Plus,
  BookOpen,
  Award,
  Sparkles,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export const AcademicCalendarView: React.FC = () => {
  const { academicEvents, addAcademicEvent } = usePersonalizedCollege();
  const { activeRole } = useAuth();

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state for new event
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<AcademicEventType>('INTERNAL_EXAM');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);

  const canAdd = ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'ADMIN'].includes(activeRole);

  const filteredEvents = academicEvents.filter(e => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'EXAMS') return e.eventType === 'INTERNAL_EXAM' || e.eventType === 'UNIVERSITY_EXAM';
    if (activeFilter === 'HOLIDAYS') return e.isHoliday || e.eventType === 'HOLIDAY';
    if (activeFilter === 'SEMINARS') return e.eventType === 'SEMINAR' || e.eventType === 'WORKSHOP';
    if (activeFilter === 'CULTURAL') return e.eventType === 'CULTURAL' || e.eventType === 'SPORTS';
    if (activeFilter === 'NSS') return e.eventType === 'NSS_NCC';
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newStartDate) return;

    await addAcademicEvent({
      title: newEventTitle,
      description: newDescription,
      eventType: newEventType,
      startDate: newStartDate,
      endDate: newEndDate || newStartDate,
      venue: newVenue || 'College Campus',
      scope: 'COLLEGE',
      isHoliday
    });

    setIsAddOpen(false);
    setNewEventTitle('');
    setNewStartDate('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-blue-50 text-blue-800 rounded-xl">
            <Calendar className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Academic Calendar
          </h1>
        </div>

        {canAdd && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'EXAMS', label: 'Exams' },
          { key: 'HOLIDAYS', label: 'Holidays' },
          { key: 'SEMINARS', label: 'Seminars' },
          { key: 'CULTURAL', label: 'Cultural' },
          { key: 'NSS', label: 'NSS' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeFilter === tab.key
                ? 'bg-rose-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Event Cards Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No academic events scheduled</p>
          <p className="text-xs text-slate-400 mt-1">Events and examinations will appear here once scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map(event => {
          const startDate = new Date(event.startDate);
          const isSameDay = event.startDate === event.endDate;

          return (
            <div
              key={event.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-start gap-4"
            >
              {/* Date Box */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200/80 border border-slate-300/60 flex flex-col items-center justify-center shrink-0 shadow-xs">
                <span className="text-[10px] uppercase font-black text-rose-900">
                  {startDate.toLocaleString('default', { month: 'short' })}
                </span>
                <span className="text-lg font-black text-slate-900 leading-none mt-0.5">
                  {startDate.getDate()}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {event.eventType.replace('_', ' ')}
                  </span>
                  {event.isHoliday && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      Holiday
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {event.title}
                </h3>

                {event.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {event.startDate} {!isSameDay && `to ${event.endDate}`}
                    </span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{event.venue}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add Event Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Schedule Academic Event</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  placeholder="e.g. S1 Continuous Assessment Examination"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-900/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newEventType}
                    onChange={e => setNewEventType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="INTERNAL_EXAM">Internal Exam</option>
                    <option value="UNIVERSITY_EXAM">University Exam</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="SEMINAR">Seminar / Conference</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="CULTURAL">Cultural Event</option>
                    <option value="SPORTS">Sports & Athletics</option>
                    <option value="NSS_NCC">NSS / NCC Drive</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Venue</label>
                  <input
                    type="text"
                    value={newVenue}
                    onChange={e => setNewVenue(e.target.value)}
                    placeholder="e.g. Science Block Auditorium"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Details for students and faculty..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="holidayCheck"
                  checked={isHoliday}
                  onChange={e => setIsHoliday(e.target.checked)}
                  className="rounded text-rose-900 focus:ring-rose-900"
                />
                <label htmlFor="holidayCheck" className="font-bold text-slate-700 cursor-pointer">
                  Mark as Institutional Holiday / Class Suspension
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-900 text-white rounded-xl font-bold hover:bg-rose-950"
                >
                  Publish to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
