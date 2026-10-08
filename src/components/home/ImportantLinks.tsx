import React from 'react';
import { ExternalLink, Landmark, FileText, Shield, Globe } from 'lucide-react';
import { COLLEGE_INFO } from '../../config/collegeInfo';

export const ImportantLinks: React.FC = () => {
  return (
    <section id="links" className="py-10 sm:py-12 bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-[11px] font-bold text-rose-900 dark:text-rose-400 uppercase tracking-widest">
              Statutory & Regulatory
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
              Important Links & Portals
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Official University & Governmental Gateways
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {COLLEGE_INFO.importantLinks.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-rose-300 dark:hover:border-amber-400/50 transition-all flex items-center justify-between group"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-900 dark:group-hover:text-amber-300 transition-colors truncate">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-rose-50 dark:group-hover:bg-amber-400/10 group-hover:text-rose-900 dark:group-hover:text-amber-300 transition-colors shrink-0">
                <ExternalLink className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
