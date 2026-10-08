import React, { useState } from 'react';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { AcademicResource, ResourceCategory } from '../../types';
import {
  Download,
  Search,
  Filter,
  FileText,
  Plus,
  BookOpen,
  Calendar,
  Building2,
  FileCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const AcademicResourcesView: React.FC = () => {
  const { academicResources, addAcademicResource } = usePersonalizedCollege();
  const { departments } = useCollegeData();
  const { activeRole, user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // New resource form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ResourceCategory>('SYLLABUS');
  const [newDeptId, setNewDeptId] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const canUpload = ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER', 'ADMIN'].includes(activeRole);

  const filteredResources = academicResources.filter(res => {
    if (activeCategory !== 'ALL' && res.category !== activeCategory) return false;
    if (selectedDeptId !== 'ALL' && res.departmentId !== selectedDeptId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        res.title.toLowerCase().includes(q) ||
        (res.description && res.description.toLowerCase().includes(q)) ||
        (res.courseCode && res.courseCode.toLowerCase().includes(q)) ||
        res.fileName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newFileName) return;

    await addAcademicResource({
      title: newTitle,
      category: newCategory,
      description: newDesc,
      departmentId: newDeptId || undefined,
      fileName: newFileName,
      fileUrl: '#',
      fileSize: '2.5 MB',
      fileType: 'PDF',
      uploadedBy: user?.id || 'Office',
      uploadedByName: user?.name || 'Faculty Member'
    });

    setIsUploadOpen(false);
    setNewTitle('');
    setNewFileName('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-blue-50 text-blue-800 rounded-xl">
            <Download className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Academic Resources
          </h1>
        </div>

        {canUpload && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Upload Resource
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { key: 'ALL', label: 'All Resources' },
            { key: 'SYLLABUS', label: 'Syllabi' },
            { key: 'REGULATIONS', label: 'Regulations' },
            { key: 'CALENDAR', label: 'Calendars' },
            { key: 'PREVIOUS_QP', label: 'Question Papers' },
            { key: 'FORMS', label: 'Student Forms' }
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeCategory === cat.key
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(e.target.value)}
            className="text-xs font-medium p-2 bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search downloads..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-900/20"
            />
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Download className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No academic resources found</p>
          <p className="text-xs text-slate-400 mt-1">Syllabi, regulations, and model papers will appear here once uploaded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(res => {
            const dept = departments.find(d => d.id === res.departmentId);

            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-900 border border-rose-100">
                      {res.category.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {res.fileSize} • {res.fileType}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {res.title}
                  </h3>

                  {res.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>
                  )}

                  {dept && (
                    <p className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {dept.name}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Uploaded: {res.uploadedAt}
                  </span>

                  <a
                    href={res.fileUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-900 hover:text-white text-slate-800 rounded-xl font-bold transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Upload Academic Material</h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Resource Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. S1 Computer Science FYUGP Detailed Syllabus"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="SYLLABUS">Syllabus</option>
                    <option value="REGULATIONS">Regulations</option>
                    <option value="CALENDAR">Academic Calendar</option>
                    <option value="PREVIOUS_QP">Question Paper</option>
                    <option value="DEPT_MATERIAL">Department Material</option>
                    <option value="FORMS">Application Form</option>
                    <option value="HANDBOOK">Handbook</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newDeptId}
                    onChange={e => setNewDeptId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">College-Wide (All)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Document File Name</label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  placeholder="e.g. Calicut_University_CS_Syllabus_2026.pdf"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Outline syllabus modules or examination reference..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-900 text-white rounded-xl font-bold hover:bg-rose-950"
                >
                  Publish Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
