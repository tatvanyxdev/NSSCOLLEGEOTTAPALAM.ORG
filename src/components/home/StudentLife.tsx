import React, { useState } from 'react';
import {
  Users,
  Compass,
  Heart,
  Briefcase,
  ShieldAlert,
  Sparkles,
  TreePine,
  HelpCircle,
  Award
} from 'lucide-react';
import { COLLEGE_INFO, StudentClubCell } from '../../config/collegeInfo';

export const StudentLife: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Units' },
    { id: 'Service', label: 'Community & Nature' },
    { id: 'Academic & Cultural', label: 'Arts & Quiz' },
    { id: 'Entrepreneurship', label: 'Careers & Innovation' },
    { id: 'Support & Welfare', label: 'Student Welfare & Redressal' }
  ];

  const filteredClubs = COLLEGE_INFO.studentClubsAndCells.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  const getCategoryIcon = (cat: StudentClubCell['category']) => {
    switch (cat) {
      case 'Service':
        return TreePine;
      case 'Academic & Cultural':
        return Sparkles;
      case 'Entrepreneurship':
        return Briefcase;
      case 'Support & Welfare':
        return ShieldAlert;
      default:
        return Users;
    }
  };

  return (
    <section id="student-life" className="py-12 sm:py-16 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2 border border-amber-200 dark:border-amber-500/30">
              <Users className="w-3.5 h-3.5" />
              <span>Co-Curricular Life</span>
            </div>
            <h2 className="text-lg sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display leading-tight">
              Clubs & Cells
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Student life at NSS College Ottapalam thrives through active community volunteering, environmental preservation, cultural arts, entrepreneurship incubation, and statutory welfare bodies.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-white dark:bg-slate-800 text-rose-900 dark:text-amber-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.map((club) => {
            const Icon = getCategoryIcon(club.category);
            const isNss = club.id === 'club-nss';
            return (
              <div
                key={club.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isNss
                    ? 'border-rose-300 dark:border-rose-700/60 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 dark:from-rose-950/40 dark:via-slate-900 dark:to-amber-950/20 shadow-sm ring-1 ring-rose-200/60 dark:ring-rose-900/40 hover:shadow-md'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`p-1.5 sm:p-2 bg-white dark:bg-slate-800 rounded-xl border shadow-2xs flex items-center justify-center ${
                      isNss ? 'border-rose-200 dark:border-rose-700 text-rose-900 dark:text-rose-300 ring-2 ring-rose-100 dark:ring-rose-900/30' : 'border-slate-200 dark:border-slate-700 text-rose-900 dark:text-amber-400'
                    }`}>
                      {isNss ? (
                        <img
                          src="/nss-logo.svg"
                          alt="National Service Scheme Official Konark Wheel Logo"
                          className="w-7 h-7 object-contain drop-shadow-xs"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://upload.wikimedia.org/wikipedia/commons/4/4b/National_Service_Scheme_logo.svg';
                          }}
                        />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isNss
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-mono tracking-wide'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {isNss ? 'NSS Units 36 & 94' : club.category}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {club.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {club.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{isNss ? 'Motto: "Not Me But You"' : 'Active Student Body'}</span>
                  <span className="text-rose-900 dark:text-amber-300 font-semibold">{isNss ? 'NSS Units 36 & 94' : 'Official College Unit'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
