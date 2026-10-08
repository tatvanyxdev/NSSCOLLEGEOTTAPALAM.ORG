import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Modal, Badge } from '../common/UIComponents';
import { Department } from '../../types';
import {
  Building2,
  Plus,
  Edit2,
  Power,
  Users,
  GraduationCap,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const DepartmentsView: React.FC = () => {
  const {
    departments,
    programmes,
    faculty,
    students,
    addDepartment,
    updateDepartment,
    toggleDepartmentStatus
  } = useCollegeData();

  const { activeRole } = useAuth();
  const canCreate = can(activeRole, 'departments', 'create');
  const canUpdate = can(activeRole, 'departments', 'update');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hodFacultyId, setHodFacultyId] = useState('');

  const handleOpenAdd = () => {
    if (!canCreate) return;
    setEditingDept(null);
    setErrorMessage(null);
    setName('');
    setCode('');
    setHodFacultyId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    if (!canUpdate) return;
    setEditingDept(dept);
    setErrorMessage(null);
    setName(dept.name);
    setCode(dept.code);
    setHodFacultyId(dept.hodFacultyId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setErrorMessage(null);
    setIsSaving(true);

    let res: { success: boolean; error?: string };

    if (editingDept) {
      if (!canUpdate) {
        setIsSaving(false);
        return;
      }
      res = await updateDepartment(editingDept.id, {
        name,
        code: code.toUpperCase(),
        hodFacultyId: hodFacultyId || undefined
      });
    } else {
      if (!canCreate) {
        setIsSaving(false);
        return;
      }
      res = await addDepartment({
        name,
        code: code.toUpperCase(),
        hodFacultyId: hodFacultyId || undefined,
        isActive: true
      });
    }

    setIsSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to save department to Supabase database.');
      return;
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">Departments</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            {departments.length} Departments
          </span>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => {
          const deptProgrammes = programmes.filter(p => p.departmentId === dept.id);
          const deptFaculty = faculty.filter(f => f.departmentId === dept.id);
          const deptStudents = students.filter(s => s.homeDepartmentId === dept.id);
          const hod = faculty.find(f => f.id === dept.hodFacultyId);

          return (
            <div
              key={dept.id}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                dept.isActive
                  ? 'border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300'
                  : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center text-xs border border-blue-100 font-mono">
                    {dept.code}
                  </div>
                  <Badge variant={dept.isActive ? 'success' : 'outline'} size="sm">
                    {dept.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                <h4 className="text-base font-bold text-slate-900 mt-3">{dept.name}</h4>

                <p className="text-xs text-slate-600 mt-1">
                  <strong>Head of Dept:</strong>{' '}
                  <span className="text-blue-700 font-semibold">{hod?.fullName || 'Not Assigned'}</span>
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Programmes</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{deptProgrammes.length}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Faculty</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{deptFaculty.length}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Students</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{deptStudents.length}</p>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              {canUpdate && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleDepartmentStatus(dept.id)}
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      dept.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {dept.isActive ? 'Disable Dept' : 'Enable Dept'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {(canCreate || canUpdate) && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDept ? 'Edit Department' : 'Add New Department'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Department Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Department of Botany"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Department Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. BOT"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Head of Department (HOD)
              </label>
              <select
                value={hodFacultyId}
                onChange={e => setHodFacultyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">-- Unassigned --</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.fullName} ({f.designation})
                  </option>
                ))}
              </select>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                <span className="font-bold">Database Error:</span> {errorMessage}
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
                  <span>{editingDept ? 'Update Department' : 'Create Department'}</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
