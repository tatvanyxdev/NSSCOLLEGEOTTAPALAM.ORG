import React, { useState } from 'react';
import { Megaphone, Calendar, ChevronRight, X, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { Announcement } from '../../types';

interface AnnouncementsPreviewProps {
  onLoginClick: () => void;
  onViewAllClick?: () => void;
  showAll?: boolean;
}

export const AnnouncementsPreview: React.FC<AnnouncementsPreviewProps> = ({
  onLoginClick,
  onViewAllClick,
  showAll = false
}) => {
  const { announcements } = useCollegeData();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Take maximum 3 recent announcements on homepage, or all on dedicated page
  const recentAnnouncements = showAll ? announcements : announcements.slice(0, 3);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="announcements" className="py-12 sm:py-16 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-900 dark:text-rose-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2 border border-rose-200 dark:border-rose-500/30">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Notice Board</span>
            </div>
            <h2 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-display leading-tight">
              Latest Announcements & Circulars
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-light">
              Official institutional notifications and Calicut University FYUGP directives.
            </p>
          </div>

          <button
            onClick={onViewAllClick || onLoginClick}
            className="text-xs sm:text-sm font-bold text-rose-900 dark:text-amber-300 hover:text-rose-700 dark:hover:text-amber-200 flex items-center gap-1.5 min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-900 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>{onViewAllClick ? 'View All Circulars & Notices' : 'View All in College Portal'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Real Announcements Content */}
        {recentAnnouncements.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No announcements available.</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Check back later for active institutional updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {recentAnnouncements.map((item) => {
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:bg-white dark:hover:bg-slate-850 hover:border-rose-300 dark:hover:border-rose-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                        {item.category || 'ACADEMIC'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {item.publishedAt ? formatDate(item.publishedAt) : 'Recent'}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-900 dark:group-hover:text-amber-300 transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                      By {item.authorName || 'Principal Office'}
                    </span>
                    <button
                      onClick={() => setSelectedAnnouncement(item)}
                      className="text-xs font-bold text-rose-900 dark:text-amber-300 hover:text-rose-700 dark:hover:text-amber-200 flex items-center gap-1 min-h-[36px] cursor-pointer"
                    >
                      <span>Read Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Read Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider border border-rose-200 dark:border-rose-500/30">
                    {selectedAnnouncement.category || 'NOTICE'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedAnnouncement.publishedAt ? formatDate(selectedAnnouncement.publishedAt) : 'Recent'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
                  {selectedAnnouncement.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close Notice Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>{selectedAnnouncement.content}</p>

              {selectedAnnouncement.targetRoles && selectedAnnouncement.targetRoles.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Applicable Target Roles:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedAnnouncement.targetRoles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Issued by {selectedAnnouncement.authorName || 'Principal Office'}
              </span>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
