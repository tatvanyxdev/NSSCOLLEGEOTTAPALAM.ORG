import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Modal, Badge } from '../common/UIComponents';
import { Programme } from '../../types';
import { GraduationCap, Plus, Edit2, Power, BookOpen } from 'lucide-react';

export const ProgrammesView: React.FC = () => {
  const {
    programmes,
    departments,
    students,
    addProgramme,
    updateProgramme,
    toggleProgrammeStatus
  } = useCollegeData();

  const { activeRole } = useAuth();
  const canCreate = can(activeRole, 'programmes', 'create');
  const canUpdate = can(activeRole, 'programmes', 'update');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<Programme | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [degreeType, setDegreeType] = useState<'UG' | 'PG' | 'RESEARCH'>('UG');
  const [durationSemesters, setDurationSemesters] = useState(8);
  const [sanctionedIntake, setSanctionedIntake] = useState(60);

  const handleOpenAdd = () => {
    if (!canCreate) return;
    setEditingProg(null);
    setErrorMessage(null);
    setName('');
    setCode('');
    setDepartmentId(departments[0]?.id || '');
    setDegreeType('UG');
    setDurationSemesters(8);
    setSanctionedIntake(60);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prog: Programme) => {
    if (!canUpdate) return;
    setEditingProg(prog);
    setErrorMessage(null);
    setName(prog.name);
    setCode(prog.code);
    setDepartmentId(prog.departmentId);
    setDegreeType(prog.degreeType);
    setDurationSemesters(prog.durationSemesters);
    setSanctionedIntake(prog.sanctionedIntake);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !departmentId) return;
    setErrorMessage(null);
    setIsSaving(true);

    let res: { success: boolean; error?: string };

    if (editingProg) {
      if (!canUpdate) {
        setIsSaving(false);
        return;
      }
      res = await updateProgramme(editingProg.id, {
        name,
        code: code.toUpperCase(),
        departmentId,
        degreeType,
        durationSemesters: Number(durationSemesters),
        sanctionedIntake: Number(sanctionedIntake)
      });
    } else {
      if (!canCreate) {
        setIsSaving(false);
        return;
      }
      res = await addProgramme({
        name,
        code: code.toUpperCase(),
        departmentId,
        degreeType,
        durationSemesters: Number(durationSemesters),
        sanctionedIntake: Number(sanctionedIntake),
        isActive: true
      });
    }

    setIsSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to save programme to Supabase database.');
      return;
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">Programmes</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            {programmes.length} Programmes
          </span>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Programme
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programmes.map(prog => {
          const dept = departments.find(d => d.id === prog.departmentId);
          const enrolledStudents = students.filter(s => s.programmeId === prog.id);

          return (
            <div
              key={prog.id}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                prog.isActive
                  ? 'border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300'
                  : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs border border-blue-100 font-mono">
                    {prog.code}
                  </span>
                  <Badge variant={prog.isActive ? 'success' : 'outline'} size="sm">
                    {prog.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                <h4 className="text-base font-bold text-slate-900 mt-3">{prog.name}</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{dept?.name}</p>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Type</p>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">{prog.degreeType}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Duration</p>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">{prog.durationSemesters} Sem</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Enrolled</p>
                    <p className="font-bold text-blue-700 text-xs mt-0.5">
                      {enrolledStudents.length} / {prog.sanctionedIntake}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              {canUpdate && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleProgrammeStatus(prog.id)}
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      prog.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {prog.isActive ? 'Disable' : 'Enable'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(prog)}
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

      {/* Add/Edit Modal */}
      {(canCreate || canUpdate) && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProg ? 'Edit Programme' : 'Add Academic Programme'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Programme Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Bachelor of Commerce in Finance (Honours)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Programme Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="e.g. BCOM_FIN"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Parent Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Degree Type</label>
                <select
                  value={degreeType}
                  onChange={e => setDegreeType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="UG">Undergraduate (UG)</option>
                  <option value="PG">Postgraduate (PG)</option>
                  <option value="RESEARCH">PhD / Research</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duration (Semesters)</label>
                <input
                  type="number"
                  value={durationSemesters}
                  onChange={e => setDurationSemesters(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sanctioned Intake</label>
                <input
                  type="number"
                  value={sanctionedIntake}
                  onChange={e => setSanctionedIntake(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
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
                  <span>{editingProg ? 'Update Programme' : 'Create Programme'}</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
