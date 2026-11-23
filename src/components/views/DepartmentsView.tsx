import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Badge, Modal } from '../common/UIComponents';
import { Department, DepartmentAttendancePolicy } from '../../types';
import {
  Building2,
  Plus,
  Edit2,
  Power,
  Users,
  GraduationCap,
  Sparkles,
  BookOpen,
  ShieldAlert,
  Clock
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

  const { user, activeRole } = useAuth();
  const canCreate = can(activeRole, 'departments', 'create');
  const canUpdate = can(activeRole, 'departments', 'update');
  const currentFaculty = faculty.find(f => f.id === user?.id || (user?.email && f.email?.toLowerCase() === user.email.toLowerCase()));
  const hodDeptId = activeRole === 'HOD' ? (user?.departmentId || currentFaculty?.departmentId) : undefined;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingPolicyId, setTogglingPolicyId] = useState<string | null>(null);
  const [policyNotice, setPolicyNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hodFacultyId, setHodFacultyId] = useState('');
  const [attendancePolicy, setAttendancePolicy] = useState<DepartmentAttendancePolicy>('HOUR_WISE');

  const handleOpenAdd = () => {
    if (!canCreate) return;
    setEditingDept(null);
    setErrorMessage(null);
    setName('');
    setCode('');
    setHodFacultyId('');
    setAttendancePolicy('HOUR_WISE');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    if (!canUpdate) return;
    setEditingDept(dept);
    setErrorMessage(null);
    setName(dept.name);
    setCode(dept.code);
    setHodFacultyId(dept.hodFacultyId || '');
    setAttendancePolicy(dept.attendancePolicy === 'SESSION_STRICT' ? 'SESSION_STRICT' : 'HOUR_WISE');
    setIsModalOpen(true);
  };

  const handleToggleAttendancePolicy = async (dept: Department) => {
    const canToggleThis =
      canUpdate || (activeRole === 'HOD' && (hodDeptId === dept.id || dept.hodFacultyId === user?.id || dept.hodFacultyId === currentFaculty?.id));
    if (!canToggleThis) return;

    const nextPolicy: DepartmentAttendancePolicy =
      dept.attendancePolicy === 'SESSION_STRICT' ? 'HOUR_WISE' : 'SESSION_STRICT';

    setTogglingPolicyId(dept.id);
    const res = await updateDepartment(dept.id, { attendancePolicy: nextPolicy });
    setTogglingPolicyId(null);

    if (res.success) {
      setErrorMessage(null);
      setPolicyNotice(
        `${dept.name} switched to ${nextPolicy === 'SESSION_STRICT' ? 'Strict Half-Day Penalty (FN/AN)' : 'Liberal Hour-Wise'} mode. All student percentages updated dynamically without altering period logs.`
      );
      setTimeout(() => setPolicyNotice(null), 4500);
    } else {
      setErrorMessage(res.error || 'Failed to update department attendance policy.');
    }
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
        hodFacultyId: hodFacultyId || undefined,
        attendancePolicy
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
        attendancePolicy,
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

      {/* Dynamic Recalculation Notice */}
      {policyNotice && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium flex items-center justify-between gap-2">
          <span>{policyNotice}</span>
          <button
            type="button"
            onClick={() => setPolicyNotice(null)}
            className="text-indigo-700 font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && !isModalOpen && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center justify-between gap-2">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => {
          const deptProgrammes = programmes.filter(p => p.departmentId === dept.id);
          const deptFaculty = faculty.filter(f => f.departmentId === dept.id);
          const deptStudents = students.filter(s => s.homeDepartmentId === dept.id);
          const hod = faculty.find(f => f.id === dept.hodFacultyId);
          const isStrict = dept.attendancePolicy === 'SESSION_STRICT';
          const canTogglePolicy =
            canUpdate || (activeRole === 'HOD' && (hodDeptId === dept.id || dept.hodFacultyId === user?.id || dept.hodFacultyId === currentFaculty?.id));

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
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center text-xs border border-blue-100 font-mono">
                    {dept.code}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 ${
                        isStrict
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {isStrict ? (
                        <>
                          <ShieldAlert className="w-3 h-3" /> Session Half-Day Rule
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Hour-Wise Policy
                        </>
                      )}
                    </span>
                    <Badge variant={dept.isActive ? 'success' : 'outline'} size="sm">
                      {dept.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
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

                {/* Department Attendance Calculation Policy Toggle */}
                <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <label
                      htmlFor={`policy-toggle-${dept.id}`}
                      className={`text-xs font-bold text-slate-800 leading-snug ${canTogglePolicy ? 'cursor-pointer' : ''}`}
                    >
                      Strict Half-Day Penalty (Missing 1 period in FN/AN cuts half-day attendance)
                    </label>
                    <button
                      id={`policy-toggle-${dept.id}`}
                      type="button"
                      role="switch"
                      aria-checked={isStrict}
                      disabled={!canTogglePolicy || togglingPolicyId === dept.id}
                      onClick={() => handleToggleAttendancePolicy(dept)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isStrict ? 'bg-amber-600' : 'bg-slate-300'
                      } ${canTogglePolicy ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          isStrict ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Toggling this dynamically recalculates overall student percentages without losing period-level data. Subject-wise percentages always remain Hour-Wise.
                  </p>
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

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Strict Half-Day Penalty (Missing 1 period in FN/AN cuts half-day attendance)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dynamically recalculates overall percentages without losing period-level logs.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={attendancePolicy === 'SESSION_STRICT'}
                  onClick={() =>
                    setAttendancePolicy(prev => (prev === 'SESSION_STRICT' ? 'HOUR_WISE' : 'SESSION_STRICT'))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                    attendancePolicy === 'SESSION_STRICT' ? 'bg-amber-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      attendancePolicy === 'SESSION_STRICT' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="text-[11px] font-semibold text-slate-700">
                Selected Mode:{' '}
                <span className={attendancePolicy === 'SESSION_STRICT' ? 'text-amber-700' : 'text-blue-700'}>
                  {attendancePolicy === 'SESSION_STRICT' ? 'Session Half-Day Rule (SESSION_STRICT)' : 'Hour-Wise Rule (HOUR_WISE)'}
                </span>
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
