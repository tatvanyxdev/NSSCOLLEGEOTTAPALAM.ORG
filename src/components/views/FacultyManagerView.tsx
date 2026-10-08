import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Modal, Badge } from '../common/UIComponents';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Faculty, UserRole } from '../../types';
import { UserCheck, Plus, Edit2, Trash2, Mail, Phone, Building, BookOpen, ShieldCheck, Users, CheckCircle2, AlertCircle } from 'lucide-react';

export const FacultyManagerView: React.FC = () => {
  const {
    faculty,
    departments,
    facultyAssignments,
    courseGroups,
    courseOfferings,
    courses,
    addFaculty,
    updateFaculty,
    deleteFaculty,
    assignFacultyToCourse
  } = useCollegeData();

  const { activeRole, user } = useAuth();

  // Permissions
  const canAdd = can(activeRole, 'faculty', 'create') || ['SUPER_ADMIN', 'PRINCIPAL'].includes(activeRole);
  const canEdit = can(activeRole, 'faculty', 'update') || ['SUPER_ADMIN', 'PRINCIPAL'].includes(activeRole);
  const canDelete = can(activeRole, 'faculty', 'delete') || ['SUPER_ADMIN', 'PRINCIPAL'].includes(activeRole);
  const canAssign = can(activeRole, 'faculty', 'assign_course') || ['SUPER_ADMIN', 'PRINCIPAL'].includes(activeRole);
  const canManageRoles = can(activeRole, 'faculty', 'manage_roles') || activeRole === 'SUPER_ADMIN';
  const isStudent = activeRole === 'STUDENT';

  if (activeRole !== 'SUPER_ADMIN' && activeRole !== 'PRINCIPAL') {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3 max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Staff Directory Restricted</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The institutional staff registry and faculty management console are restricted to Super Administrator and Principal consoles.
        </p>
      </div>
    );
  }

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFac, setEditingFac] = useState<Faculty | null>(null);
  const [facultyToDelete, setFacultyToDelete] = useState<Faculty | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Allocation modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedFacForAssign, setSelectedFacForAssign] = useState<Faculty | null>(null);
  const [assignCourseGroupId, setAssignCourseGroupId] = useState(courseGroups[0]?.id || '');
  const [assignRole, setAssignRole] = useState<'PRIMARY' | 'CO_TEACHER' | 'LAB_INSTRUCTOR'>('PRIMARY');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [qualification, setQualification] = useState('M.Com, NET, Ph.D');
  const [roles, setRoles] = useState<UserRole[]>(['TEACHER']);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const allAvailableRoles: UserRole[] = [
    'TEACHER',
    'HOD',
    'CLASS_TUTOR',
    'COURSE_COORDINATOR',
    'ATTENDANCE_COORDINATOR',
    'PRINCIPAL',
    'OFFICE_STAFF',
    'SUPER_ADMIN'
  ];

  const handleOpenAdd = () => {
    if (!canAdd) return;
    setEditingFac(null);
    setSaveError(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setUsername('');
    setPassword('Staff2026!');
    setDepartmentId(departments[0]?.id || '');
    setDesignation('Assistant Professor');
    setQualification('M.A., NET, Ph.D');
    setRoles(['TEACHER']);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (f: Faculty) => {
    if (!canEdit) return;
    setEditingFac(f);
    setSaveError(null);
    setFullName(f.fullName);
    setEmail(f.email);
    setPhone(f.phoneNumber || '');
    setUsername(f.username || f.email?.split('@')[0] || '');
    setPassword(f.password || 'Staff2026!');
    setDepartmentId(f.departmentId);
    setDesignation(f.designation);
    setQualification(f.qualification || '');
    setRoles(f.roles);
    setIsAddOpen(true);
  };

  const toggleRole = (r: UserRole) => {
    if (!canManageRoles) return;
    if (roles.includes(r)) {
      if (roles.length > 1) setRoles(roles.filter(x => x !== r));
    } else {
      setRoles([...roles, r]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setSaveError(null);
    setIsSaving(true);

    let res: { success: boolean; error?: string };

    if (editingFac) {
      if (!canEdit) {
        setIsSaving(false);
        return;
      }
      res = await updateFaculty(editingFac.id, {
        fullName,
        email,
        phoneNumber: phone,
        departmentId,
        designation,
        qualification,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        roles: canManageRoles ? roles : editingFac.roles
      });
    } else {
      if (!canAdd) {
        setIsSaving(false);
        return;
      }
      res = await addFaculty({
        fullName,
        email,
        phoneNumber: phone,
        departmentId,
        designation,
        qualification,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        roles: canManageRoles ? roles : ['TEACHER'],
        isActive: true,
        profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      });
    }

    setIsSaving(false);

    if (!res.success) {
      setSaveError(res.error || 'Failed to save faculty record to Supabase database.');
      return;
    }

    setIsAddOpen(false);
  };

  const handleOpenAssign = (f: Faculty) => {
    if (!canAssign) return;
    setSelectedFacForAssign(f);
    setAssignError(null);
    setAssignCourseGroupId(courseGroups[0]?.id || '');
    setAssignRole('PRIMARY');
    setIsAssignOpen(true);
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssign) return;
    if (!selectedFacForAssign || !assignCourseGroupId) return;
    setAssignError(null);
    setIsAssigning(true);

    const res = await assignFacultyToCourse({
      facultyId: selectedFacForAssign.id,
      courseGroupId: assignCourseGroupId,
      role: assignRole
    });

    setIsAssigning(false);

    if (!res.success) {
      setAssignError(res.error || 'Failed to assign course to faculty in Supabase.');
      return;
    }

    setIsAssignOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!facultyToDelete) return;
    setIsDeleting(true);
    setActionMessage(null);
    const target = facultyToDelete;
    const res = await deleteFaculty(target.id);
    setIsDeleting(false);
    setFacultyToDelete(null);
    if (!res.success) {
      setActionMessage({ type: 'error', text: res.error || 'Failed to remove faculty member.' });
    } else {
      setActionMessage({
        type: 'success',
        text: `Successfully deleted ${target.fullName} (${target.designation}) from faculty directory.`
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  if (activeRole !== 'SUPER_ADMIN' && activeRole !== 'PRINCIPAL') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Restricted Administrative Registry</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The institutional faculty directory and staff management records are restricted to College Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shadow-xs transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">Faculty</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            {faculty.length} Faculty
          </span>
        </div>

        {canAdd && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Faculty
          </button>
        )}
      </div>

      {/* Empty State */}
      {faculty.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No faculty records available.</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Faculty records will appear here once loaded from the official database or added by administration.
          </p>
          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" /> Add First Faculty Member
            </button>
          )}
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {faculty.map(fac => {
            const dept = departments.find(d => d.id === fac.departmentId);
            const assignments = facultyAssignments.filter(fa => fa.facultyId === fac.id);

            return (
              <div
                key={fac.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <img
                      src={fac.profileImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={fac.fullName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{fac.fullName}</h4>
                      <p className="text-xs text-blue-700 font-semibold">{fac.designation}</p>
                      <p className="text-[11px] text-slate-500">{dept?.name}</p>
                    </div>
                  </div>

                  {/* Roles Badges */}
                  {!isStudent && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {fac.roles.map(r => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Course Assignments */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Teaching Allocations ({assignments.length})
                    </p>
                    {assignments.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No active course groups assigned.</p>
                    ) : (
                      <div className="space-y-1">
                        {assignments.map(a => {
                          const grp = courseGroups.find(g => g.id === a.courseGroupId);
                          const off = courseOfferings.find(o => o.id === grp?.courseOfferingId);
                          const crs = courses.find(c => c.id === off?.courseId);
                          return (
                            <div key={a.id} className="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded flex justify-between">
                              <span className="font-semibold">{crs?.courseCode}</span>
                              <span>{grp?.groupName} {isStudent ? '' : `(${a.role})`}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Administrative Actions (NEVER rendered for Students or unauthorized roles) */}
                {(canAssign || canEdit || canDelete) && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {canAssign ? (
                      <button
                        onClick={() => handleOpenAssign(fac)}
                        className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Assign Course
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(fac)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => setFacultyToDelete(fac)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={`Delete ${fac.roles?.includes('HOD') ? 'HOD' : 'Faculty'} record`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Faculty Modal */}
      {canAdd && (
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title={editingFac ? 'Edit Faculty Details' : 'Add Faculty Member'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name with Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Narayanan"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Official Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="faculty@nssce.ac.in"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 94471 23456"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Designation</label>
                <select
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Principal">Principal</option>
                  <option value="Senior Superintendent">Senior Superintendent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Staff Portal Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  placeholder={email ? email.split('@')[0] : 'faculty_username'}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Unique login ID for staff portal</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Staff Portal Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Staff2026!"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Min 4 chars; used to log into staff portal</p>
              </div>
            </div>

            {canManageRoles && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Assigned Authority Roles
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {allAvailableRoles.map(r => {
                    const isSelected = roles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRole(r)}
                        className={`px-2.5 py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                <span className="font-bold">Database Error:</span> {saveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsAddOpen(false)}
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
                  <span>{editingFac ? 'Update Faculty' : 'Add Faculty Member'}</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Course Modal */}
      {canAssign && (
        <Modal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          title="Assign Course Group to Faculty"
          subtitle={`Faculty: ${selectedFacForAssign?.fullName}`}
        >
          <form onSubmit={handleSaveAssign} className="space-y-4">
            {assignError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                <span className="font-bold">Database Error:</span> {assignError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select Course Group & Cohort
              </label>
              <select
                value={assignCourseGroupId}
                onChange={e => setAssignCourseGroupId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {courseGroups.map(g => {
                  const off = courseOfferings.find(o => o.id === g.courseOfferingId);
                  const crs = courses.find(c => c.id === off?.courseId);
                  return (
                    <option key={g.id} value={g.id}>
                      {crs?.courseCode} - {crs?.courseTitle} ({g.groupName})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Teaching Role
              </label>
              <select
                value={assignRole}
                onChange={e => setAssignRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="PRIMARY">Primary Instructor</option>
                <option value="CO_TEACHER">Co-Teacher</option>
                <option value="LAB_INSTRUCTOR">Lab / Practical Instructor</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isAssigning}
                onClick={() => setIsAssignOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAssigning}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-xs flex items-center gap-2"
              >
                {isAssigning ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Assigning in Supabase...</span>
                  </>
                ) : (
                  <span>Assign Course</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Dialog for Deleting Faculty / HOD */}
      <ConfirmDialog
        isOpen={!!facultyToDelete}
        onClose={() => setFacultyToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={`Delete ${facultyToDelete?.roles?.includes('HOD') ? 'HOD' : 'Faculty'} Record`}
        message={
          <div>
            <p>
              Are you sure you want to permanently remove{' '}
              <strong className="text-slate-900">{facultyToDelete?.fullName}</strong>{' '}
              ({facultyToDelete?.designation})?
            </p>
            <p className="mt-2 text-rose-600 font-medium">
              This action unlinks any department HOD assignments, clears course allocations, and deletes the record from the college directory.
            </p>
          </div>
        }
        detailText={
          facultyToDelete
            ? `ID: ${facultyToDelete.id} • Employee Code: ${facultyToDelete.employeeId || 'N/A'} • Dept: ${departments.find(d => d.id === facultyToDelete.departmentId)?.name || 'N/A'}`
            : undefined
        }
        confirmLabel="Yes, Delete Record"
        variant="danger"
      />
    </div>
  );
};

