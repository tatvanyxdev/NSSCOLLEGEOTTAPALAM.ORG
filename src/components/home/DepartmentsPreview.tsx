import React, { useState } from 'react';
import {
  Building2,
  GraduationCap,
  Users,
  Search,
  ChevronRight,
  Sparkles,
  BookOpen,
  Calendar,
  X
} from 'lucide-react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { Department } from '../../types';

export const DepartmentsPreview: React.FC = () => {
  const { departments, programmes, faculty } = useCollegeData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const activeDepartments = departments.filter((d) => d.isActive);

  const filteredDepts = activeDepartments.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
  });

  const getDeptProgrammes = (deptId: string) => {
    return programmes.filter((p) => p.departmentId === deptId && p.isActive);
  };

  const getDeptFaculty = (deptId: string) => {
    return faculty.filter((f) => f.departmentId === deptId && f.isActive);
  };

  const getDeptHod = (deptId: string) => {
    // Dynamic lookup from ERP database
    const deptFac = faculty.filter((f) => f.departmentId === deptId && f.isActive);
    return deptFac.find((f) => f.designation?.toLowerCase().includes('head') || f.designation?.toLowerCase().includes('hod'));
  };

  return (
    <section id="departments" className="py-12 sm:py-16 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-purple-50 text-purple-900 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2 border border-purple-200">
              <Building2 className="w-3.5 h-3.5" />
              <span>Faculties of Excellence</span>
            </div>
            <h2 className="text-lg sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display leading-tight">
              Academic Departments
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Explore NSS College Ottapalam's distinguished humanities, sciences, commerce, and language departments, fostering interdisciplinary scholarship and research.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments (e.g. Physics)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
            />
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDepts.map((dept) => {
            const deptProgs = getDeptProgrammes(dept.id);
            const deptFacCount = getDeptFaculty(dept.id).length;
            const hod = getDeptHod(dept.id);

            return (
              <div
                key={dept.id}
                onClick={() => setSelectedDept(dept)}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-850 hover:border-rose-300 dark:hover:border-rose-500/40 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20 group-hover:text-rose-900 dark:group-hover:text-rose-300 transition-colors">
                      {dept.code}
                    </span>
                    {dept.establishedYear && (
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        Est. {dept.establishedYear}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-900 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                    {dept.name}
                  </h3>

                  {hod && (
                    <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">HOD:</span>
                      <span className="truncate">{hod.fullName}</span>
                    </div>
                  )}

                  {deptProgs.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {deptProgs.map((p) => (
                        <span
                          key={p.id}
                          className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {p.code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <GraduationCap className="w-3.5 h-3.5 text-rose-900 dark:text-rose-400" />
                    <strong className="text-slate-700 dark:text-slate-300">{deptProgs.length}</strong> {deptProgs.length === 1 ? 'Prog' : 'Progs'}
                  </span>
                  <span className="flex items-center gap-1 text-rose-900 dark:text-rose-400 font-bold group-hover:translate-x-0.5 transition-transform text-[11px]">
                    <span>View Info</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Detail Modal */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                    {selectedDept.code}
                  </span>
                  {selectedDept.establishedYear && (
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Established {selectedDept.establishedYear}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                  {selectedDept.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close Department Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {/* Programmes */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-rose-900 dark:text-rose-400" />
                  <span>Programmes Offered ({getDeptProgrammes(selectedDept.id).length})</span>
                </h4>
                <div className="space-y-1.5">
                  {getDeptProgrammes(selectedDept.id).length === 0 ? (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      Supporting academic faculty offering complementary, Minor, and FYUGP Multidisciplinary courses.
                    </p>
                  ) : (
                    getDeptProgrammes(selectedDept.id).map((prog) => (
                      <div
                        key={prog.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{prog.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {prog.durationYears} Years • {prog.type} Degree
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-700 text-rose-900 dark:text-rose-300 border border-slate-200 dark:border-slate-600">
                          {prog.code}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Faculty members dynamically from ERP */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-rose-900 dark:text-rose-400" />
                  <span>Department Faculty ({getDeptFaculty(selectedDept.id).length})</span>
                </h4>
                {getDeptFaculty(selectedDept.id).length === 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                    Faculty directory records are synchronized via the college administration office.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {getDeptFaculty(selectedDept.id).map((fac) => (
                      <div
                        key={fac.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{fac.fullName}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{fac.designation}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{fac.qualification}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDept(null)}
                className="px-4 py-1.5 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
