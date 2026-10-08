import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Modal, Badge } from '../common/UIComponents';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Student } from '../../types';
import { DigitalIdModal } from '../student/DigitalIdModal';
import { AttendanceCalculatorModal } from '../student/AttendanceCalculatorModal';
import { StudentIndividualProfileView } from './StudentIndividualProfileView';
import { BulkStudentUploadModal } from '../modals/BulkStudentUploadModal';
import {
  checkCredentialRules,
  validateUsername,
  validatePassword,
  generateDefaultStudentPassword,
  formatDobForInput,
  formatDobForDisplay
} from '../../utils/credentialValidation';
import {
  Users,
  Plus,
  Search,
  Filter,
  IdCard,
  Edit2,
  CalendarCheck,
  GraduationCap,
  Sparkles,
  Calculator,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  BookOpen,
  ArrowRight,
  UserCheck,
  Trash2,
  CheckSquare,
  FileSpreadsheet
} from 'lucide-react';

interface StudentsManagerViewProps {
  onNavigateToCourseAllocation?: (studentId: string) => void;
  onNavigateToStaffEnrollment?: () => void;
}

export const StudentsManagerView: React.FC<StudentsManagerViewProps> = ({
  onNavigateToCourseAllocation,
  onNavigateToStaffEnrollment
}) => {
  const {
    students,
    departments,
    programmes,
    admissionBatches,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentAttendanceSummary,
    settings
  } = useCollegeData();

  const { activeRole, user } = useAuth();
  const isStudent = activeRole === 'STUDENT';
  const hodDeptId = activeRole === 'HOD' ? user?.departmentId : undefined;

  // CRITICAL: If the logged in user is a student, strictly isolate them to their individual profile!
  if (isStudent) {
    return <StudentIndividualProfileView />;
  }

  // Enrollment permissions: Super Admin, HOD, Class Tutor, and Office Staff
  const canCreate =
    can(activeRole, 'students', 'create') ||
    ['SUPER_ADMIN', 'HOD', 'CLASS_TUTOR', 'OFFICE_STAFF'].includes(activeRole);

  const canEdit =
    can(activeRole, 'students', 'update') ||
    ['SUPER_ADMIN', 'HOD', 'CLASS_TUTOR', 'OFFICE_STAFF'].includes(activeRole);

  const canDelete =
    can(activeRole, 'students', 'delete') ||
    ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'OFFICE_STAFF', 'CLASS_TUTOR'].includes(activeRole);

  const [filterDept, setFilterDept] = useState<string>(
    hodDeptId || 'ALL'
  );
  const [filterSem, setFilterSem] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Deletion State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingIdStudent, setViewingIdStudent] = useState<Student | null>(null);
  const [calcStudentId, setCalcStudentId] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields as explicitly mandated by user
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [universityRegNo, setUniversityRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [homeDepartmentId, setHomeDepartmentId] = useState(
    activeRole === 'HOD' && user?.departmentId ? user.departmentId : departments[0]?.id || ''
  );
  const [currentSemester, setCurrentSemester] = useState<number>(1);
  const [yearOfStudy, setYearOfStudy] = useState<number>(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Secondary form fields
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id || '');
  const [admissionBatch, setAdmissionBatch] = useState('2026-2030');
  const [bloodGroup, setBloodGroup] = useState('');
  const [gender, setGender] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [address, setAddress] = useState('');

  // Validation errors & saving state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const usernameRules = checkCredentialRules(username);
  const passwordRules = checkCredentialRules(password);

  const filteredStudents = students.filter(s => {
    const matchesDept = filterDept === 'ALL' || s.homeDepartmentId === filterDept;
    const matchesSem = filterSem === 'ALL' || s.currentSemester.toString() === filterSem;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.admissionNumber.toLowerCase().includes(q) ||
      (s.universityRegisterNumber && s.universityRegisterNumber.toLowerCase().includes(q)) ||
      (s.mobileNumber && s.mobileNumber.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      s.email.toLowerCase().includes(q);

    return matchesDept && matchesSem && matchesSearch;
  });

  const handleSemesterChange = (sem: number) => {
    setCurrentSemester(sem);
    // Auto-calculate Year of Study (Sem 1-2 = 1, Sem 3-4 = 2, Sem 5-6 = 3, Sem 7-8 = 4)
    const calculatedYear = Math.ceil(sem / 2);
    setYearOfStudy(calculatedYear);
  };

  const handleUniversityRegChange = (val: string) => {
    const upper = val.toUpperCase();
    // Auto sync username to University Register Number if username was previously unset or matching old reg
    if (!username || username === universityRegNo) {
      setUsername(upper);
    }
    setUniversityRegNo(upper);
  };

  const handleDobChange = (newDob: string) => {
    setDateOfBirth(newDob);
    // Auto-update default password if empty or matching default 10-char pattern
    const generated = generateDefaultStudentPassword(newDob, mobileNumber);
    if (generated && (!password || password.length === 10 || password === 'Nss2026!')) {
      setPassword(generated);
    }
  };

  const handleMobileChange = (newMob: string) => {
    setMobileNumber(newMob);
    // Auto-update default password if empty or matching default 10-char pattern
    const generated = generateDefaultStudentPassword(dateOfBirth, newMob);
    if (generated && (!password || password.length === 10 || password === 'Nss2026!')) {
      setPassword(generated);
    }
  };

  const handleResetToDefaultCredentials = () => {
    if (universityRegNo) {
      setUsername(universityRegNo.trim().toUpperCase());
    }
    const defPass = generateDefaultStudentPassword(dateOfBirth, mobileNumber);
    if (defPass) {
      setPassword(defPass);
    }
  };

  const handleOpenAdd = () => {
    if (!canCreate) return;
    setEditingStudent(null);
    setFormError(null);

    setFullName('');
    setMobileNumber('');
    setDateOfBirth('');
    setUniversityRegNo('');
    setEmail('');
    setAdmissionNumber('');
    setRollNumber('');
    setHomeDepartmentId(
      activeRole === 'HOD' && user?.departmentId ? user.departmentId : departments[0]?.id || ''
    );
    setProgrammeId(programmes[0]?.id || '');
    setAdmissionBatch('2026-2030');
    setCurrentSemester(1);
    setYearOfStudy(1);
    setUsername('');
    setPassword('');
    setBloodGroup('');
    setGender('');
    setGuardianName('');
    setGuardianPhone('');
    setAddress('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    if (!canEdit) return;
    setEditingStudent(s);
    setFormError(null);

    const sDob = formatDobForInput(s.dateOfBirth) || '';
    const sMob = s.mobileNumber || s.phoneNumber || s.phone || '';
    const computedPass = sDob && sMob ? generateDefaultStudentPassword(sDob, sMob) : '';

    setFullName(s.fullName || '');
    setMobileNumber(sMob);
    setDateOfBirth(sDob);
    setUniversityRegNo(s.universityRegisterNumber || '');
    setEmail(s.email || '');
    setAdmissionNumber(s.admissionNumber || '');
    setRollNumber(s.rollNumber || '');
    setHomeDepartmentId(s.homeDepartmentId || departments[0]?.id || '');
    setProgrammeId(s.programmeId || programmes[0]?.id || '');
    setAdmissionBatch(s.admissionBatch || '2026-2030');
    setCurrentSemester(s.currentSemester || 1);
    setYearOfStudy(s.yearOfStudy || Math.ceil((s.currentSemester || 1) / 2));
    setUsername(s.username || s.universityRegisterNumber || s.admissionNumber || '');
    setPassword(s.password || computedPass || 'Nss2026!');
    setBloodGroup(s.bloodGroup || '');
    setGender(s.gender || '');
    setGuardianName(s.guardianName || '');
    setGuardianPhone(s.guardianPhone || '');
    setAddress(s.address || '');
    setIsAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Mandated Fields Validation
    if (!fullName.trim()) {
      setFormError('Student Full Name is required.');
      return;
    }
    if (!mobileNumber.trim()) {
      setFormError('Mobile Number is required as per college structure.');
      return;
    }
    if (!universityRegNo.trim()) {
      setFormError('University REGISTER NUMBER is required.');
      return;
    }
    if (!email.trim()) {
      setFormError('Email ID is required.');
      return;
    }

    // Duplicate Checks
    const cleanRegNo = universityRegNo.trim().toUpperCase();
    const duplicateRegNo = students.find(
      s => (!editingStudent || s.id !== editingStudent.id) &&
           s.universityRegisterNumber?.toUpperCase() === cleanRegNo
    );
    if (duplicateRegNo) {
      setFormError(`University Register Number "${cleanRegNo}" is already registered to student "${duplicateRegNo.fullName}". Duplicate enrollment is prohibited.`);
      return;
    }

    const cleanAdmNo = admissionNumber.trim().toUpperCase();
    if (cleanAdmNo) {
      const duplicateAdmNo = students.find(
        s => (!editingStudent || s.id !== editingStudent.id) &&
             s.admissionNumber?.toUpperCase() === cleanAdmNo
      );
      if (duplicateAdmNo) {
        setFormError(`Admission Number "${cleanAdmNo}" is already assigned to student "${duplicateAdmNo.fullName}".`);
        return;
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const duplicateEmail = students.find(
      s => (!editingStudent || s.id !== editingStudent.id) &&
           s.email?.toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      setFormError(`Email address "${cleanEmail}" is already registered to "${duplicateEmail.fullName}".`);
      return;
    }

    const finalUsername = username.trim() ? username.trim().toUpperCase() : cleanRegNo;
    let finalPassword = password.trim();
    if (!finalPassword) {
      finalPassword = generateDefaultStudentPassword(dateOfBirth, mobileNumber) || 'Nss2026!';
    }

    // Username Validation
    const userVal = validateUsername(finalUsername);
    if (!userVal.isValid) {
      setFormError(`Username Error: ${userVal.errors.join(' ')}`);
      return;
    }

    // Password Validation
    const passVal = validatePassword(finalPassword);
    if (!passVal.isValid) {
      setFormError(`Password Error: ${passVal.errors.join(' ')}`);
      return;
    }

    const payload: Partial<Student> = {
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      phone: mobileNumber.trim(),
      phoneNumber: mobileNumber.trim(),
      dateOfBirth: formatDobForDisplay(dateOfBirth) || dateOfBirth,
      universityRegisterNumber: universityRegNo.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      homeDepartmentId,
      programmeId,
      currentSemester: Number(currentSemester),
      yearOfStudy: Number(yearOfStudy),
      username: finalUsername,
      password: finalPassword,
      admissionNumber: admissionNumber.trim().toUpperCase(),
      rollNumber: rollNumber.trim(),
      admissionBatch,
      bloodGroup,
      gender,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      address: address.trim(),
      status: 'ACTIVE'
    };

    setIsSaving(true);
    try {
      if (editingStudent) {
        if (!canEdit) {
          setIsSaving(false);
          return;
        }
        const res = await updateStudent(editingStudent.id, payload);
        if (!res.success) {
          setFormError(res.error || 'Failed to update student in Supabase PostgreSQL.');
          setIsSaving(false);
          return;
        }
      } else {
        if (!canCreate) {
          setIsSaving(false);
          return;
        }
        const res = await addStudent({
          ...payload,
          status: 'ACTIVE',
          isActive: true,
          profilePhotoUrl:
            gender === 'Male'
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        } as Omit<Student, 'id' | 'createdAt'>);

        if (!res.success) {
          setFormError(res.error || 'Failed to enroll student in Supabase PostgreSQL.');
          setIsSaving(false);
          return;
        }
      }

      setIsSaving(false);
      setIsAddOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Unexpected database error occurred.');
      setIsSaving(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    setActionMessage(null);
    const target = studentToDelete;
    const res = await deleteStudent(target.id);
    setIsDeleting(false);
    setStudentToDelete(null);
    setSelectedStudentIds(prev => prev.filter(id => id !== target.id));

    if (!res.success) {
      setActionMessage({ type: 'error', text: res.error || 'Failed to remove student record.' });
    } else {
      setActionMessage({
        type: 'success',
        text: `Successfully deleted student ${target.fullName} (${target.rollNumber || target.admissionNumber || 'ID: ' + target.id}) from database.`
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    setIsDeleting(true);
    setActionMessage(null);
    let deletedCount = 0;

    for (const id of selectedStudentIds) {
      const res = await deleteStudent(id);
      if (res.success) {
        deletedCount++;
      }
    }

    setIsDeleting(false);
    setIsBulkDeleteOpen(false);
    setSelectedStudentIds([]);

    setActionMessage({
      type: 'success',
      text: `Successfully deleted ${deletedCount} student record(s) from database.`
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold font-display text-slate-900">
            Students
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            {filteredStudents.length} Students
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToStaffEnrollment && (
            <button
              onClick={onNavigateToStaffEnrollment}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Staff Directory</span>
            </button>
          )}

          {canCreate && (
            <>
              <button
                onClick={() => setIsBulkUploadOpen(true)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" /> Import Excel
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <select
            value={hodDeptId || filterDept}
            disabled={Boolean(hodDeptId)}
            onChange={e => setFilterDept(e.target.value)}
            className="w-full sm:w-auto text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-900"
          >
            {!hodDeptId && <option value="ALL">All Departments</option>}
            {departments
              .filter(d => !hodDeptId || d.id === hodDeptId)
              .map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>

          <select
            value={filterSem}
            onChange={e => setFilterSem(e.target.value)}
            className="w-full sm:w-auto text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-900"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s.toString()}>
                Semester {s} (Year {Math.ceil(s / 2)})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Name, Reg No, Mobile, Username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-900"
          />
        </div>
      </div>

      {/* Bulk Action Bar when items are selected */}
      {canDelete && selectedStudentIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-rose-950 font-bold text-xs">
            <CheckSquare className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedStudentIds([])}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-colors text-center"
            >
              Deselect All
            </button>
            <button
              onClick={() => setIsBulkDeleteOpen(true)}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedStudentIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Students Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                {canDelete && (
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-rose-900 focus:ring-rose-800 cursor-pointer"
                      title="Select / Deselect All Visible Students"
                    />
                  </th>
                )}
                <th className="py-3.5 px-4">Student & Contact</th>
                <th className="py-3.5 px-4">Univ Register Number</th>
                <th className="py-3.5 px-4">Department & Programme</th>
                <th className="py-3.5 px-4">Semester & Year</th>
                <th className="py-3.5 px-4">Portal Login</th>
                <th className="py-3.5 px-4 text-center">Attendance %</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 8 : 7} className="py-10 text-center text-slate-400">
                    No student records found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const dept = departments.find(d => d.id === student.homeDepartmentId);
                  const prog = programmes.find(p => p.id === student.programmeId);
                  const summary = getStudentAttendanceSummary(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        selectedStudentIds.includes(student.id) ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {canDelete && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleToggleSelectOne(student.id)}
                            className="w-4 h-4 rounded text-rose-900 focus:ring-rose-800 cursor-pointer"
                          />
                        </td>
                      )}
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              student.profilePhotoUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={student.fullName}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{student.fullName}</p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{student.mobileNumber || student.phoneNumber || student.phone || 'N/A'}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* University Register Number */}
                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-1 rounded bg-amber-50 text-amber-900 font-bold border border-amber-200">
                          {student.universityRegisterNumber || 'PENDING'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Roll: {student.rollNumber} • {student.admissionNumber}</p>
                      </td>

                      {/* Department & Programme */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 truncate">{prog?.name || dept?.name}</p>
                        <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                          {dept?.code || 'DEPT'}
                        </span>
                      </td>

                      {/* Semester & Year of Study */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">
                          Year {student.yearOfStudy || Math.ceil(student.currentSemester / 2)}
                        </p>
                        <p className="text-[11px] text-slate-500">Semester {student.currentSemester}</p>
                        <span className="text-[10px] text-slate-400">{student.admissionBatch}</span>
                      </td>

                      {/* Portal Login Credentials */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-bold text-slate-900">
                          @{student.username || student.universityRegisterNumber || student.admissionNumber.toLowerCase()}
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 mt-0.5 space-y-0.5">
                          <div>
                            <span className="text-slate-400">Pass:</span>{' '}
                            <span className="font-semibold text-amber-900 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                              {student.password || 'DOB+MobLast2'}
                            </span>
                          </div>
                          {student.dateOfBirth && (
                            <div className="text-slate-400 text-[9px]">
                              DOB: {student.dateOfBirth}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Attendance % */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <Badge
                            variant={summary.isShortage ? 'danger' : summary.isWarning ? 'warning' : 'success'}
                            size="md"
                          >
                            {summary.overallPercentage}%
                          </Badge>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {summary.totalPresent + summary.totalOd} / {summary.totalConducted} Sessions
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setCalcStudentId(student.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Forecast Attendance Calculator"
                          >
                            <Calculator className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setViewingIdStudent(student)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="View Digital Student ID"
                          >
                            <IdCard className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(student)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit Student Information"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => setStudentToDelete(student)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Student Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(canCreate || canEdit) && (
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title={editingStudent ? 'Edit Enrolled Student Profile' : 'Enroll New Student (FYUGP)'}
        >
          <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Section 1: Mandated Identity Fields */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rose-900" />
                Mandatory Student Identification
              </h4>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ananya S. Nair"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-900"
                />
              </div>

              {/* Mobile Number, Date of Birth & University Register Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={e => handleMobileChange(e.target.value)}
                    placeholder="10-digit mobile number (e.g. 9847123456)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Last 2 digits used in default password</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date of Birth (DOB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={e => handleDobChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Formatted: {formatDobForDisplay(dateOfBirth) || 'DD/MM/YYYY'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    University REGISTER NUMBER <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={universityRegNo}
                    onChange={e => handleUniversityRegChange(e.target.value)}
                    placeholder="e.g. UCOTFCS001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase font-bold focus:ring-2 focus:ring-rose-900"
                  />
                  <p className="text-[10px] text-amber-700 font-semibold mt-1">Auto-sets Student Username</p>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@nssce.ac.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-900"
                />
              </div>
            </div>

            {/* Section 2: Academic Program, Department, Semester, Year of Study */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-700" />
                Department & Academic Structure
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={homeDepartmentId}
                    onChange={e => setHomeDepartmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Major Programme */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Degree Programme <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={programmeId}
                    onChange={e => setProgrammeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
                  >
                    {programmes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Semester */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={currentSemester}
                    onChange={e => handleSemesterChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year of Study */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Year of Study <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={yearOfStudy}
                    onChange={e => setYearOfStudy(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
                  >
                    <option value={1}>1st Year (FYUGP)</option>
                    <option value={2}>2nd Year (FYUGP)</option>
                    <option value={3}>3rd Year (FYUGP)</option>
                    <option value={4}>4th Year (Honours)</option>
                  </select>
                </div>

                {/* Admission Batch */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Batch</label>
                  <input
                    type="text"
                    value={admissionBatch}
                    onChange={e => setAdmissionBatch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Portal Login Credentials & Rules (Username & Password) */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  Student Portal Credentials (Auto-Derived from Registration)
                </h4>
                <button
                  type="button"
                  onClick={handleResetToDefaultCredentials}
                  className="px-2.5 py-1 text-[11px] bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-bold transition-all shadow-xs self-start sm:self-auto flex items-center gap-1"
                >
                  <span>🔄 Auto-Set Formula Credentials</span>
                </button>
              </div>

              {/* Formula explanation box as mandated by user */}
              <div className="p-3 bg-amber-100/70 border border-amber-300/80 rounded-xl text-xs space-y-1 text-amber-950">
                <p className="font-bold text-slate-900">
                  Default Credentials Formula:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-800 mt-1">
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <span className="font-bold text-rose-900">Username:</span> University Register Number entered above
                    <div className="mt-0.5 font-mono font-bold text-slate-700 truncate">
                      ➔ {universityRegNo ? universityRegNo.toUpperCase() : 'UCOTFCS001'}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <span className="font-bold text-rose-900">Password:</span> Date of Birth (DDMMYYYY) + Mobile Last 2 Digits
                    <div className="mt-0.5 font-mono font-bold text-emerald-800 truncate">
                      ➔ {dateOfBirth && mobileNumber ? generateDefaultStudentPassword(dateOfBirth, mobileNumber) : '1404200590 (e.g. 14/04/2005 + 90)'}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-amber-900/80 mt-1 italic">
                  Example: Raju (DOB: 14/04/2005, Mobile: 1234567890) ➔ Default Password: <strong>1404200590</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Portal Username <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">(Univ Reg No)</span>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toUpperCase())}
                    placeholder="Auto-derived from Univ Reg No (or custom)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase font-bold focus:ring-2 focus:ring-amber-500"
                  />
                  {/* Realtime rules indicator */}
                  <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                    <span className={username ? (usernameRules.hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400') : 'text-slate-400'}>
                      {username && usernameRules.hasMinLength ? '✓ 4+ chars' : '○ 4+ chars'}
                    </span>
                    <span>•</span>
                    <span className={username ? (usernameRules.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400') : 'text-slate-400'}>
                      {username && usernameRules.hasNumber ? '✓ contains number' : '○ contains number'}
                    </span>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Password
                    </label>
                    <span className="text-[10px] text-slate-400">(Auto-derived or custom)</span>
                  </div>
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Auto-derived from DOB + Mobile"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-amber-500"
                  />
                  {/* Realtime rules indicator */}
                  <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                    <span className={password ? (passwordRules.hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400') : 'text-slate-400'}>
                      {password && passwordRules.hasMinLength ? '✓ 4+ chars' : '○ 4+ chars'}
                    </span>
                    <span>•</span>
                    <span className={password ? (passwordRules.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400') : 'text-slate-400'}>
                      {password && passwordRules.hasNumber ? '✓ contains number' : '○ contains number'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Supplementary Institutional Records */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Additional Institutional Information
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Roll No</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={e => setRollNumber(e.target.value)}
                    placeholder="e.g. 01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Adm No</label>
                  <input
                    type="text"
                    value={admissionNumber}
                    onChange={e => setAdmissionNumber(e.target.value)}
                    placeholder="e.g. ADM-2026-101"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="">-- Select Blood Group --</option>
                    {['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'].map(bg => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={e => setGuardianName(e.target.value)}
                    placeholder="Parent or Guardian"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Guardian Mobile</label>
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={e => setGuardianPhone(e.target.value)}
                    placeholder="10-digit guardian mobile"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !usernameRules.isValid || !passwordRules.isValid}
                className="px-6 py-2.5 bg-rose-900 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/20 transition-all flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving to Supabase...</span>
                  </>
                ) : editingStudent ? (
                  'Update Student Record'
                ) : (
                  'Complete Student Enrollment'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Digital ID Modal */}
      <DigitalIdModal
        isOpen={!!viewingIdStudent}
        onClose={() => setViewingIdStudent(null)}
        student={viewingIdStudent}
      />

      {/* Target Calculator Modal */}
      {calcStudentId && (
        <AttendanceCalculatorModal
          isOpen={!!calcStudentId}
          onClose={() => setCalcStudentId(null)}
          studentId={calcStudentId}
        />
      )}

      {/* Confirmation Dialog for Single Student Deletion */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Student Record"
        message={
          <div>
            <p>
              Are you sure you want to permanently delete student{' '}
              <strong className="text-slate-900">{studentToDelete?.fullName}</strong>?
            </p>
            <p className="mt-2 text-rose-600 font-medium">
              This action clears the student's enrollments, course registrations, and attendance history from the database.
            </p>
          </div>
        }
        detailText={
          studentToDelete
            ? `ID: ${studentToDelete.id} • Roll No: ${studentToDelete.rollNumber || 'N/A'} • Reg No: ${studentToDelete.admissionNumber || 'N/A'} • Dept: ${departments.find(d => d.id === studentToDelete.homeDepartmentId)?.name || 'N/A'}`
            : undefined
        }
        confirmLabel="Yes, Delete Student"
        variant="danger"
      />

      {/* Confirmation Dialog for Bulk Student Deletion */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        isLoading={isDeleting}
        title={`Delete ${selectedStudentIds.length} Selected Student Records`}
        message={
          <div>
            <p>
              Are you sure you want to permanently delete all{' '}
              <strong className="text-slate-900">{selectedStudentIds.length} selected students</strong>?
            </p>
            <p className="mt-2 text-rose-600 font-medium">
              All selected students, their course registrations, and attendance records will be removed from the system.
            </p>
          </div>
        }
        confirmLabel={`Yes, Delete All ${selectedStudentIds.length} Students`}
        variant="danger"
      />

      {/* Bulk Student Enrollment Spreadsheet Modal */}
      <BulkStudentUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        departments={departments}
        activeRole={activeRole}
        hodDeptId={hodDeptId}
        onSuccess={() => {
          setActionMessage({ type: 'success', text: 'Bulk student enrollment completed successfully.' });
        }}
      />
    </div>
  );
};
