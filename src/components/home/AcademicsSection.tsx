import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Layers,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  X,
  Search,
  Filter
} from 'lucide-react';
import { useCollegeData } from '../../contexts/CollegeDataContext';

export const AcademicsSection: React.FC = () => {
  const { programmes, departments } = useCollegeData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'ALL' | 'UG' | 'PG'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const ugProgrammes = programmes.filter((p) => p.type === 'UG' && p.isActive);
  const pgProgrammes = programmes.filter((p) => p.type === 'PG' && p.isActive);

  const filteredProgrammes = programmes.filter((p) => {
    if (!p.isActive) return false;
    if (selectedType !== 'ALL' && p.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const dept = departments.find((d) => d.id === p.departmentId);
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (dept && dept.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getDeptName = (deptId: string) => {
    return departments.find((d) => d.id === deptId)?.name || 'Academic Department';
  };

  return (
    <section id="academics" className="py-12 sm:py-16 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-50 text-blue-900 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2 border border-blue-200">
              <Layers className="w-3.5 h-3.5" />
              <span>FYUGP Curricular Excellence</span>
            </div>
            <h2 className="text-lg sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display leading-tight">
              Academic Programmes
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Designed according to the University of Calicut Four Year Undergraduate Programme (FYUGP) framework, offering multidisciplinary flexibility, hands-on skill components, and research honours.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedType('ALL');
              setIsModalOpen(true);
            }}
            className="self-start md:self-auto px-5 py-2.5 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 min-h-[44px]"
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>Explore All {programmes.length} Programmes</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Two Main Cards: Undergraduate & Postgraduate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Undergraduate Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="p-3 bg-rose-50 dark:bg-rose-500/15 text-rose-900 dark:text-rose-300 rounded-2xl border border-rose-100 dark:border-rose-500/30">
                  <GraduationCap className="w-7 h-7" />
                </span>
                <span className="px-3 py-1 bg-rose-100/70 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 rounded-full text-xs font-black uppercase tracking-wider">
                  {ugProgrammes.length} Verified Programmes
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                Undergraduate (FYUGP)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Four-year honours degree architecture with multiple exit and entry pathways, Major core specializations, elective Minor streams, Multidisciplinary courses (MDC), and capstone research dissertation.
              </p>

              {/* Curricular Pill Highlights */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">13 Specializations:</strong> BA (English, Hindi, Malayalam, Economics, History), BSc (Mathematics, Physics, Chemistry, Computer Science, Botany, Zoology, Industrial Chemistry) & B.Com</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Interdisciplinary Electives:</strong> Cross-departmental Minor allocations for every batch</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Duration:</strong> 4 Years (8 Semesters with Honors with Research degree)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Degree: BA / BSc / BCom (Honours)</span>
              <button
                onClick={() => {
                  setSelectedType('UG');
                  setIsModalOpen(true);
                }}
                className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 min-h-[40px]"
              >
                <span>View 13 UG Degrees</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Postgraduate Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="p-3 bg-blue-50 dark:bg-blue-500/15 text-blue-900 dark:text-blue-300 rounded-2xl border border-blue-100 dark:border-blue-500/30">
                  <BookOpen className="w-7 h-7" />
                </span>
                <span className="px-3 py-1 bg-blue-100/70 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 rounded-full text-xs font-black uppercase tracking-wider">
                  {pgProgrammes.length} Verified Programmes
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                Postgraduate (Master Degrees)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Advanced theoretical inquiry, intensive laboratory experimentation, scholarly publishing, and specialized preparation for national competitive examinations (CSIR-UGC NET/JRF, GATE, and PhD admissions).
              </p>

              {/* Curricular Pill Highlights */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">6 Disciplines:</strong> MA English, MA Economics, MSc Computer Science, MSc Mathematics, MSc Physics, and M.Com Finance</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Research Focus:</strong> Mandatory thesis projects, dissertations, and conference presentations</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Duration:</strong> 2 Years (4 Semesters under University of Calicut)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Degree: MA / MSc / MCom</span>
              <button
                onClick={() => {
                  setSelectedType('PG');
                  setIsModalOpen(true);
                }}
                className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 min-h-[40px]"
              >
                <span>View 6 PG Degrees</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* FYUGP Core Academic Architecture Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-400/20 text-amber-300 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold">
                FYUGP Credit Architecture & Elective Mapping in ERP
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Major, Minor, MDC, AEC, SEC, and VAC courses are dynamically orchestrated by our college ERP engine.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold text-amber-200 border border-white/10 whitespace-nowrap">
            University of Calicut FYUGP Regulations
          </span>
        </div>
      </div>

      {/* Dynamic Programmes Explorer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
                    Academic Programmes Directory
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live ERP Academic Structure ({programmes.length} Active Programmes)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close Programmes Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Controls */}
            <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 border-b border-slate-100 dark:border-slate-800">
              {/* Type Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedType('ALL')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedType === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({programmes.length})
                </button>
                <button
                  onClick={() => setSelectedType('UG')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedType === 'UG'
                      ? 'bg-white dark:bg-slate-700 text-rose-900 dark:text-rose-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  UG ({ugProgrammes.length})
                </button>
                <button
                  onClick={() => setSelectedType('PG')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedType === 'PG'
                      ? 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  PG ({pgProgrammes.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter programme or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
                />
              </div>
            </div>

            {/* Programme List Scrollable */}
            <div className="overflow-y-auto py-3 space-y-2.5 flex-1 pr-1">
              {filteredProgrammes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No academic programmes match your filter criteria.
                </div>
              ) : (
                filteredProgrammes.map((prog) => {
                  const isUG = prog.type === 'UG';
                  return (
                    <div
                      key={prog.id}
                      className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-2xs transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              isUG
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                            }`}
                          >
                            {prog.type} • {prog.code}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                            {getDeptName(prog.departmentId)}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {prog.name}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                          {prog.durationYears} Years ({prog.totalSemesters} Sems)
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block">
                          Sanctioned: {prog.maxStrength} Seats
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
              <span>Authority: University of Calicut FYUGP Syllabus</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-bold"
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
