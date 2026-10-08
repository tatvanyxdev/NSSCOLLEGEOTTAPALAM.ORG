import React from 'react';
import { Calendar, GraduationCap, BookOpen, Trees, Award, Landmark } from 'lucide-react';
import { COLLEGE_INFO } from '../../config/collegeInfo';

export const CollegeStats: React.FC = () => {
  const stats = [
    {
      id: 'stat-est',
      label: 'Established Year',
      value: COLLEGE_INFO.academicStats.established,
      detail: 'Inaugurated 10 July 1961',
      icon: Calendar,
      color: 'from-amber-500/15 to-amber-500/5 text-amber-800 border-amber-200'
    },
    {
      id: 'stat-ug',
      label: 'UG Programmes',
      value: `${COLLEGE_INFO.academicStats.ugProgrammesCount}`,
      detail: 'Four-Year FYUGP Honours',
      icon: GraduationCap,
      color: 'from-rose-500/15 to-rose-500/5 text-rose-900 border-rose-200'
    },
    {
      id: 'stat-pg',
      label: 'PG Programmes',
      value: `${COLLEGE_INFO.academicStats.pgProgrammesCount}`,
      detail: 'Master Degrees & Research',
      icon: BookOpen,
      color: 'from-blue-500/15 to-blue-500/5 text-blue-900 border-blue-200'
    },
    {
      id: 'stat-campus',
      label: 'Campus Area',
      value: COLLEGE_INFO.academicStats.campusAcres,
      detail: 'Palappuram Green Campus',
      icon: Trees,
      color: 'from-emerald-500/15 to-emerald-500/5 text-emerald-900 border-emerald-200'
    },
    {
      id: 'stat-naac',
      label: 'NAAC Accreditation',
      value: COLLEGE_INFO.academicStats.naacGrade,
      detail: "Accredited with 'A' Grade",
      icon: Award,
      color: 'from-amber-600/15 to-amber-600/5 text-amber-900 border-amber-300'
    },
    {
      id: 'stat-affil',
      label: 'Parent University',
      value: COLLEGE_INFO.academicStats.university,
      detail: 'University of Calicut',
      icon: Landmark,
      color: 'from-indigo-500/15 to-indigo-500/5 text-indigo-900 border-indigo-200'
    }
  ];

  return (
    <section className="py-8 sm:py-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <span className="text-[11px] font-bold text-rose-900 dark:text-rose-400 uppercase tracking-widest">
              Institutional Profile
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              College at a Glance
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline-block font-medium">
            Verified Official Records • Nair Service Society
          </span>
        </div>

        {/* 2-column on mobile, 3-col on tablet, 6-col on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border bg-gradient-to-b ${item.color} dark:from-slate-900 dark:to-slate-950 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="p-1 sm:p-2 bg-white/90 dark:bg-slate-800 rounded-lg shadow-2xs">
                    <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-current dark:text-amber-300" />
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Official
                  </span>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-display">
                    {item.value}
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {item.label}
                  </div>
                  <div className="text-[9.5px] sm:text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    {item.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
