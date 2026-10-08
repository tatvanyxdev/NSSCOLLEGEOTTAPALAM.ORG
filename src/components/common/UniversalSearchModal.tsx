import React, { useEffect, useRef } from 'react';
import { usePersonalizedCollege, SearchResultItem } from '../../contexts/PersonalizedCollegeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  X,
  Bell,
  Calendar,
  BookOpen,
  Building2,
  Users,
  Download,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { searchQuery, setSearchQuery, searchResults } = usePersonalizedCollege();
  const { activeRole } = useAuth();
  const isAdmin = activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchResultItem) => {
    onNavigate(item.linkTab);
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NOTICE':
      case 'CIRCULAR':
        return <Bell className="w-4 h-4 text-rose-800" />;
      case 'EVENT':
        return <Calendar className="w-4 h-4 text-blue-700" />;
      case 'COURSE':
        return <BookOpen className="w-4 h-4 text-emerald-700" />;
      case 'DEPARTMENT':
        return <Building2 className="w-4 h-4 text-purple-700" />;
      case 'FACULTY':
        return <Users className="w-4 h-4 text-amber-700" />;
      case 'RESOURCE':
        return <Download className="w-4 h-4 text-indigo-700" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isAdmin
                ? "Type to search circulars, courses, departments, faculty, events, resources..."
                : "Type to search circulars, courses, departments, events, resources..."
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-md"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
          {searchQuery.trim().length < 2 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Type to search circulars, courses, and events.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No results found.
            </div>
          ) : (
            searchResults.map(item => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700 shrink-0 transition-colors">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {item.type}
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-bold text-rose-900 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-rose-900 dark:group-hover:text-amber-300 shrink-0 transition-colors" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Tip: Press ESC to close</span>
          <span>NSS College Ottapalam ERP</span>
        </div>
      </div>
    </div>
  );
};
