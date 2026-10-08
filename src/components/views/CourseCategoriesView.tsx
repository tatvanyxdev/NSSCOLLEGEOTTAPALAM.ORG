import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Modal, Badge } from '../common/UIComponents';
import { CourseCategory } from '../../types';
import { Layers, Plus, Edit2, BookOpen, Sparkles } from 'lucide-react';

export const CourseCategoriesView: React.FC = () => {
  const { courseCategories, courses, addCourseCategory, updateCourseCategory } = useCollegeData();
  const { activeRole } = useAuth();
  const canCreate = can(activeRole, 'categories', 'create');
  const canUpdate = can(activeRole, 'categories', 'update');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CourseCategory | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isElective, setIsElective] = useState(false);
  const [isMultiDisciplinary, setIsMultiDisciplinary] = useState(false);
  const [colorHex, setColorHex] = useState('#2563eb');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    if (!canCreate) return;
    setEditingCat(null);
    setName('');
    setCode('');
    setDescription('');
    setIsElective(false);
    setIsMultiDisciplinary(false);
    setColorHex('#2563eb');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CourseCategory) => {
    if (!canUpdate) return;
    setEditingCat(cat);
    setName(cat.name);
    setCode(cat.code);
    setDescription(cat.description || '');
    setIsElective(cat.isElective);
    setIsMultiDisciplinary(cat.isMultiDisciplinary);
    setColorHex(cat.colorHex || '#2563eb');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSaving(true);
    setModalError(null);

    let res: { success: boolean; error?: string };
    if (editingCat) {
      if (!canUpdate) {
        setIsSaving(false);
        return;
      }
      res = await updateCourseCategory(editingCat.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        isElective,
        isMultiDisciplinary,
        colorHex
      });
    } else {
      if (!canCreate) {
        setIsSaving(false);
        return;
      }
      res = await addCourseCategory({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        isElective,
        isMultiDisciplinary,
        colorHex
      });
    }

    setIsSaving(false);

    if (!res.success) {
      setModalError(res.error || 'Failed to save course category to database.');
      return;
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">Course Categories</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            {courseCategories.length} Categories
          </span>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courseCategories.map(cat => {
          const matchingCourses = courses.filter(c => c.categoryId === cat.id);

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span
                    className="px-3 py-1 rounded-lg text-white font-black text-xs uppercase tracking-wider font-mono shadow-2xs"
                    style={{ backgroundColor: cat.colorHex || '#2563eb' }}
                  >
                    {cat.code}
                  </span>
                  <div className="flex items-center gap-1">
                    {cat.isMultiDisciplinary && (
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                        Multi-Disc
                      </span>
                    )}
                    {cat.isElective && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Elective
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-900 mt-3">{cat.name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description || 'No description added'}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Active Courses:</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                    {matchingCourses.length} Courses Offered
                  </span>
                </div>
              </div>

              {canUpdate && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Rules
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {(canCreate || canUpdate) && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCat ? 'Edit FYUGP Category' : 'Add FYUGP Category'}
        >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Category Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Multi-Disciplinary Course"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. MDC"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={e => setColorHex(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={colorHex}
                  onChange={e => setColorHex(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Explains the purpose under the FYUGP curriculum framework"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isElective}
                onChange={e => setIsElective(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              Is Elective Choice
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isMultiDisciplinary}
                onChange={e => setIsMultiDisciplinary(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              Cross-Major / Multi-Disciplinary
            </label>
          </div>

          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              <span className="font-bold">Database Error:</span> {modalError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-xs flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <span>{editingCat ? 'Update Category' : 'Create Category'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
      )}
    </div>
  );
};
