import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Department } from '../../types';
import {
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Mail,
  Award,
  ChevronRight,
  Search,
  ExternalLink,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export const DepartmentHubView: React.FC = () => {
  const { departments, programmes, faculty, courses } = useCollegeData();
  const { circulars, academicResources } = usePersonalizedCollege();
  const { activeRole, user } = useAuth();

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepartments = departments.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
  });

  const activeDepartment = selectedDeptId
    ? departments.find(d => d.id === selectedDeptId)
    : null;

  const deptProgrammes = activeDepartment
    ? programmes.filter(p => p.departmentId === activeDepartment.id)
    : [];

  const deptFaculty = activeDepartment
    ? faculty.filter(f => f.departmentId === activeDepartment.id)
    : [];

  const deptCirculars = activeDepartment
    ? circulars.filter(c => c.targetDepartmentId === activeDepartment.id)
    : [];

  const deptResources = activeDepartment
    ? academicResources.filter(r => r.departmentId === activeDepartment.id)
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-purple-50 text-purple-800 rounded-xl">
            <Building2 className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Department Hub
          </h1>
        </div>

        {activeDepartment ? (
          <button
            onClick={() => setSelectedDeptId(null)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" /> All Departments
          </button>
        ) : (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-900/20"
            />
          </div>
        )}
      </div>

      {/* Selected Department In-Depth View */}
      {activeDepartment ? (
        <div className="space-y-6">
          {/* Department Banner Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-xs font-mono font-bold">
                  Code: {activeDepartment.code} • Established {activeDepartment.establishedYear || 1961}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  {activeDepartment.name}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-xl font-black text-slate-900 block">{deptFaculty.length}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Faculty</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-xl font-black text-slate-900 block">{deptProgrammes.length}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Programmes</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Split: Faculty, Programmes, Resources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Faculty Directory */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-700" /> Teaching Faculty Members
                  </h3>
                  <span className="text-xs text-slate-400">{deptFaculty.length} members</span>
                </div>

                {activeRole !== 'SUPER_ADMIN' && activeRole !== 'PRINCIPAL' ? (
                  <p className="text-xs text-slate-400 py-3 italic">
                    Faculty contact details and staff lists are restricted to institutional administrators.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {deptFaculty.map(fac => (
                      <div
                        key={fac.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 font-bold text-sm flex items-center justify-center shrink-0">
                          {fac.fullName
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {fac.fullName}
                          </h4>
                          <p className="text-[11px] text-purple-800 font-medium truncate">
                            {fac.designation || 'Assistant Professor'}
                          </p>
                          {fac.email && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400" /> {fac.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Departmental Circulars & Notices */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-800" /> Department Circulars & Updates
                </h3>

                <div className="divide-y divide-slate-100">
                  {deptCirculars.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      No active circulars for this department.
                    </p>
                  ) : (
                    deptCirculars.map(c => (
                      <div key={c.id} className="py-3 space-y-1">
                        <span className="font-mono text-[10px] font-bold text-rose-900 bg-rose-50 px-1.5 py-0.5 rounded">
                          {c.referenceNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{c.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{c.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar: Degree Programmes & Materials */}
            <div className="space-y-6">
              {/* Programmes Offered */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-700" /> Degree Programmes
                </h3>

                <div className="space-y-2">
                  {deptProgrammes.map(prog => (
                    <div
                      key={prog.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                    >
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded">
                        {prog.level} • {prog.durationSemesters} Semesters
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{prog.name}</h4>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Materials & Resources */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" /> Department Resources
                </h3>

                <div className="space-y-2">
                  {deptResources.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2 text-center">
                      No specialized files uploaded yet.
                    </p>
                  ) : (
                    deptResources.map(r => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{r.title}</h4>
                          <span className="text-[10px] text-slate-400">{r.fileSize}</span>
                        </div>
                        <a
                          href={r.fileUrl}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200"
                        >
                          View
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Department Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map(dept => {
            const facCount = faculty.filter(f => f.departmentId === dept.id).length;
            const progCount = programmes.filter(p => p.departmentId === dept.id).length;

            return (
              <div
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md">
                      {dept.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Est. {dept.establishedYear || 1961}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-900 transition-colors">
                    {dept.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    Undergraduate & Postgraduate Academic Department with research labs and curriculum councils.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {facCount} Staff
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> {progCount} Courses
                    </span>
                  </div>

                  <span className="text-purple-800 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Explore <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
