import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Modal, Badge } from '../common/UIComponents';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Faculty, UserRole } from '../../types';
import {
  checkCredentialRules,
  checkStaffUsernameRules,
  checkStaffPasswordRules
} from '../../utils/credentialValidation';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building,
  BookOpen,
  ShieldCheck,
  Users,
  Search,
  KeyRound,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface StaffEnrollmentViewProps {
  onNavigateToStudents?: () => void;
  onNavigateToCourseAllocation?: () => void;
}

export const StaffEnrollmentView: React.FC<StaffEnrollmentViewProps> = ({
  onNavigateToStudents,
  onNavigateToCourseAllocation
}) => {
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
  const isHOD = activeRole === 'HOD';

  const currentFaculty =
    faculty.find(
      f =>
        f.id === user?.id ||
        (f.username && user?.name && f.username.toLowerCase() === user.name.toLowerCase()) ||
        (user?.email && f.email.toLowerCase() === user.email.toLowerCase())
    ) || null;

  const hodDeptId = isHOD
    ? departments.find(d => d.hodFacultyId === currentFaculty?.id)?.id ||
      user?.departmentId ||
      currentFaculty?.departmentId ||
      departments[0]?.id
    : undefined;
  const hodDepartment = departments.find(d => d.id === hodDeptId);

  // Permissions: Super Admin and Principal have full access; HOD has scoped access to their department
  const canAdd = can(activeRole, 'faculty', 'create') || ['SUPER_ADMIN', 'PRINCIPAL', 'HOD'].includes(activeRole);
  const canEdit = can(activeRole, 'faculty', 'update') || ['SUPER_ADMIN', 'PRINCIPAL', 'HOD'].includes(activeRole);
  const canDelete = ['SUPER_ADMIN', 'PRINCIPAL'].includes(activeRole);
  const canAssign = can(activeRole, 'faculty', 'assign_course') || ['SUPER_ADMIN', 'HOD'].includes(activeRole);
  const canManageRoles = can(activeRole, 'faculty', 'manage_roles') || ['SUPER_ADMIN', 'HOD'].includes(activeRole);
  const isStudent = activeRole === 'STUDENT';

  // UI States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFac, setEditingFac] = useState<Faculty | null>(null);
  const [facultyToDelete, setFacultyToDelete] = useState<Faculty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>(isHOD && hodDeptId ? hodDeptId : 'ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (activeRole !== 'SUPER_ADMIN' && activeRole !== 'PRINCIPAL' && activeRole !== 'HOD') {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3 max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Staff Enrollment Restricted</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The institutional staff registry and faculty enrollment management are restricted to Super Administrator, Principal, and Head of Department consoles.
        </p>
      </div>
    );
  }

  // Teaching Course Allocation modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedFacForAssign, setSelectedFacForAssign] = useState<Faculty | null>(null);
  const [assignCourseGroupId, setAssignCourseGroupId] = useState(courseGroups[0]?.id || '');
  const [assignRole, setAssignRole] = useState<'PRIMARY' | 'CO_TEACHER' | 'LAB_INSTRUCTOR'>('PRIMARY');

  // Loading & Database Error states
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [staffModalError, setStaffModalError] = useState<string | null>(null);
  const [assignModalError, setAssignModalError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Streamlined Form State for Staff (HOD, Tutor, Faculty, Office Staff, Principal)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [departmentId, setDepartmentId] = useState(isHOD && hodDeptId ? hodDeptId : departments[0]?.id || '');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [qualification, setQualification] = useState('M.Tech, Ph.D');
  const [roles, setRoles] = useState<UserRole[]>(['TEACHER']);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'RETIRED'>('ACTIVE');

  const allAvailableRoles: { role: UserRole; label: string; desc: string }[] = isHOD
    ? [
        { role: 'CLASS_TUTOR', label: 'Class Tutor', desc: 'Batch / Cohort Mentor' },
        { role: 'TEACHER', label: 'Faculty / Teacher', desc: 'Course Instruction & Marks' },
        { role: 'COURSE_COORDINATOR', label: 'Course Coordinator', desc: 'FYUGP Major/Minor Setup' }
      ]
    : [
        { role: 'HOD', label: 'HOD', desc: 'Head of Department' },
        { role: 'CLASS_TUTOR', label: 'Class Tutor', desc: 'Batch / Cohort Mentor' },
        { role: 'TEACHER', label: 'Faculty / Teacher', desc: 'Course Instruction & Marks' },
        { role: 'OFFICE_STAFF', label: 'Office Staff', desc: 'Student Admissions & Admin' },
        { role: 'PRINCIPAL', label: 'Principal', desc: 'Institutional Executive Head' },
        { role: 'COURSE_COORDINATOR', label: 'Course Coordinator', desc: 'FYUGP Major/Minor Setup' },
        { role: 'ATTENDANCE_COORDINATOR', label: 'Attendance Coordinator', desc: 'Condonation & College Approvals' },
        { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full System Configuration' }
      ];

  // Quick Preset Handlers
  const handleQuickPreset = (presetRole: UserRole) => {
    if (!canAdd) return;
    setEditingFac(null);
    setShowPassword(false);

    let defaultTitle = 'Assistant Professor';
    let defaultRoles: UserRole[] = [presetRole];

    if (presetRole === 'HOD') {
      defaultTitle = 'Professor & HOD';
      defaultRoles = ['HOD', 'TEACHER'];
    } else if (presetRole === 'CLASS_TUTOR') {
      defaultTitle = 'Assistant Professor & Class Tutor';
      defaultRoles = ['CLASS_TUTOR', 'TEACHER'];
    } else if (presetRole === 'OFFICE_STAFF') {
      defaultTitle = 'Office Superintendent';
      defaultRoles = ['OFFICE_STAFF'];
    } else if (presetRole === 'PRINCIPAL') {
      defaultTitle = 'Principal';
      defaultRoles = ['PRINCIPAL'];
    }

    setFullName('');
    setEmail('');
    setMobileNumber('');
    setEmployeeCode('');
    setDepartmentId(departments[0]?.id || '');
    setDesignation(defaultTitle);
    setQualification('');
    setRoles(defaultRoles);
    setUsername('');
    setPassword('');
    setStatus('ACTIVE');
    setIsAddOpen(true);
  };

  const handleOpenAdd = () => {
    if (!canAdd) return;
    setEditingFac(null);
    setShowPassword(false);

    setFullName('');
    setEmail('');
    setMobileNumber('');
    setEmployeeCode('');
    setDepartmentId(isHOD && hodDeptId ? hodDeptId : departments[0]?.id || '');
    setDesignation('Assistant Professor');
    setQualification('');
    setRoles(['TEACHER']);
    setUsername('');
    setPassword('');
    setStatus('ACTIVE');
    setIsAddOpen(true);
  };

  const handleAutoFillSuggestedCredentials = () => {
    const cleanPrefix = (employeeCode.trim() || email.split('@')[0] || fullName.trim().split(' ')[0] || 'staff').toLowerCase().replace(/[^a-z0-9]/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    setUsername(`${cleanPrefix || 'staff'}${randNum}`);
    setPassword(`Staff${randNum}!`);
  };

  const handleOpenEdit = (f: Faculty) => {
    if (!canEdit) return;
    setEditingFac(f);
    setShowPassword(false);
    setFullName(f.fullName);
    setEmail(f.email);
    setMobileNumber(f.mobileNumber || f.phoneNumber || f.phone || '');
    setEmployeeCode(f.employeeCode || f.employeeId || '');
    setDepartmentId(f.departmentId);
    setDesignation(f.designation);
    setQualification(f.qualification || '');
    setRoles(f.roles);
    setUsername(f.username || f.email.split('@')[0]);
    setPassword(f.password || 'Staff2026!');
    setStatus(f.status || 'ACTIVE');
    setIsAddOpen(true);
  };

  const handleDeleteStaff = (f: Faculty) => {
    if (!canDelete) return;
    setFacultyToDelete(f);
  };

  const handleConfirmDelete = async () => {
    if (!facultyToDelete) return;
    const target = facultyToDelete;
    setDeletingStaffId(target.id);
    setPageError(null);
    const res = await deleteFaculty(target.id);
    setDeletingStaffId(null);
    setFacultyToDelete(null);

    if (!res.success) {
      setPageError(res.error || `Failed to remove ${target.fullName} from registry.`);
    } else {
      setSuccessMessage(`Successfully deleted ${target.fullName} (${target.designation}) from the staff registry.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const toggleRole = (r: UserRole) => {
    if (!canManageRoles) return;
    if (roles.includes(r)) {
      if (roles.length > 1) setRoles(roles.filter(x => x !== r));
    } else {
      setRoles([...roles, r]);
    }
  };

  // Real-time Credential Validation using flexible Staff Rules (letters, numbers, dot, underscore; numbers optional)
  const usernameCheck = checkStaffUsernameRules(username);
  const passwordCheck = checkStaffPasswordRules(password);
  const areCredentialsValid =
    (!username.trim() || usernameCheck.isValid) && (!password.trim() || passwordCheck.isValid);

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffModalError(null);

    if (!fullName.trim() || !email.trim() || !mobileNumber.trim()) {
      setStaffModalError('Please fill all mandatory fields (Full Name, Mobile Number, Email).');
      return;
    }

    // Auto-generate credentials if left empty
    let finalUsername = username.trim().toLowerCase();
    if (!finalUsername) {
      const cleanPrefix = (employeeCode.trim() || email.split('@')[0] || fullName.trim().split(' ')[0] || 'staff').toLowerCase().replace(/[^a-z0-9]/g, '');
      const randNum = Math.floor(100 + Math.random() * 900);
      finalUsername = `${cleanPrefix || 'staff'}${randNum}`;
    }

    let finalPassword = password.trim();
    if (!finalPassword) {
      const randNum = Math.floor(100 + Math.random() * 900);
      finalPassword = `Staff${randNum}!`;
    }

    const usernameCheckResult = checkStaffUsernameRules(finalUsername);
    const passwordCheckResult = checkStaffPasswordRules(finalPassword);
    if (!usernameCheckResult.isValid) {
      setStaffModalError('Staff Portal Username must be at least 3 characters and contain only letters, numbers, dot, underscore, or hyphen.');
      return;
    }
    if (!passwordCheckResult.isValid) {
      setStaffModalError('Staff Portal Password must be at least 4 characters long.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const duplicateEmail = faculty.find(
      f => (!editingFac || f.id !== editingFac.id) && f.email?.toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      setStaffModalError(`Email "${cleanEmail}" is already registered to ${duplicateEmail.fullName}. Duplicate staff email is not allowed.`);
      return;
    }

    const cleanUsername = finalUsername;
    const duplicateUsername = faculty.find(
      f => (!editingFac || f.id !== editingFac.id) && f.username?.toLowerCase() === cleanUsername
    );
    if (duplicateUsername) {
      setStaffModalError(`Username "${finalUsername}" is already assigned to ${duplicateUsername.fullName}. Please choose a unique username.`);
      return;
    }

    const cleanEmpCode = employeeCode.trim().toUpperCase();
    if (cleanEmpCode) {
      const duplicateEmpCode = faculty.find(
        f => (!editingFac || f.id !== editingFac.id) && (f.employeeCode?.toUpperCase() === cleanEmpCode || f.employeeId?.toUpperCase() === cleanEmpCode)
      );
      if (duplicateEmpCode) {
        setStaffModalError(`Employee Code "${cleanEmpCode}" is already assigned to ${duplicateEmpCode.fullName}.`);
        return;
      }
    }

    setIsSavingStaff(true);
    let res: { success: boolean; error?: string };

    if (editingFac) {
      if (!canEdit) {
        setIsSavingStaff(false);
        return;
      }
      res = await updateFaculty(editingFac.id, {
        fullName: fullName.trim(),
        email: cleanEmail,
        mobileNumber: mobileNumber.trim(),
        phoneNumber: mobileNumber.trim(),
        phone: mobileNumber.trim(),
        employeeCode: cleanEmpCode,
        employeeId: cleanEmpCode,
        departmentId: isHOD && hodDeptId ? hodDeptId : departmentId,
        designation,
        qualification: qualification.trim(),
        username: finalUsername,
        password: finalPassword,
        status,
        roles: canManageRoles ? roles : editingFac.roles
      });
    } else {
      if (!canAdd) {
        setIsSavingStaff(false);
        return;
      }
      res = await addFaculty({
        fullName: fullName.trim(),
        email: cleanEmail,
        mobileNumber: mobileNumber.trim(),
        phoneNumber: mobileNumber.trim(),
        phone: mobileNumber.trim(),
        employeeCode: cleanEmpCode,
        employeeId: cleanEmpCode,
        departmentId: isHOD && hodDeptId ? hodDeptId : departmentId,
        designation,
        qualification: qualification.trim(),
        username: finalUsername,
        password: finalPassword,
        status,
        roles: canManageRoles ? roles : ['TEACHER'],
        isActive: status === 'ACTIVE',
        profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      });
    }

    setIsSavingStaff(false);

    if (!res.success) {
      setStaffModalError(res.error || 'Failed to persist staff record to Supabase.');
      return;
    }

    setIsAddOpen(false);
  };

  // Teaching Course Group Allocation
  const handleOpenAssign = (f: Faculty) => {
    if (!canAssign) return;
    setSelectedFacForAssign(f);
    setAssignCourseGroupId(courseGroups[0]?.id || '');
    setAssignRole('PRIMARY');
    setAssignModalError(null);
    setIsAssignOpen(true);
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssign) return;
    if (!selectedFacForAssign || !assignCourseGroupId) return;

    setIsSavingAssign(true);
    setAssignModalError(null);

    const res = await assignFacultyToCourse({
      facultyId: selectedFacForAssign.id,
      courseGroupId: assignCourseGroupId,
      role: assignRole
    });

    setIsSavingAssign(false);

    if (!res.success) {
      setAssignModalError(res.error || 'Failed to allocate teaching course group in Supabase.');
      return;
    }

    setIsAssignOpen(false);
  };

  const handleCopyCredentials = (f: Faculty) => {
    const u = f.username || f.email.split('@')[0];
    const p = f.password || 'Staff2026!';
    navigator.clipboard.writeText(`Portal Login for ${f.fullName}\nUsername: ${u}\nPassword: ${p}\nDesignation: ${f.designation}`);
    setCopiedId(f.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtering
  const filteredFaculty = faculty.filter(f => {
    // If HOD, strictly isolate to their respective department only!
    if (isHOD && hodDeptId && f.departmentId !== hodDeptId) {
      return false;
    }

    const matchesSearch =
      f.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.employeeCode || f.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.mobileNumber || f.phoneNumber || f.phone || '').includes(searchQuery);

    const matchesRole =
      roleFilter === 'ALL' ||
      f.roles.includes(roleFilter as UserRole);

    const matchesDept =
      isHOD ? true : deptFilter === 'ALL' || f.departmentId === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  // Metrics
  const baseFacultySet = isHOD && hodDeptId ? faculty.filter(f => f.departmentId === hodDeptId) : faculty;
  const hodCount = baseFacultySet.filter(f => f.roles.includes('HOD')).length;
  const tutorCount = baseFacultySet.filter(f => f.roles.includes('CLASS_TUTOR')).length;
  const teacherCount = baseFacultySet.filter(f => f.roles.includes('TEACHER')).length;
  const officeCount = baseFacultySet.filter(f => f.roles.includes('OFFICE_STAFF')).length;
  const principalCount = baseFacultySet.filter(f => f.roles.includes('PRINCIPAL')).length;

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Full Name',
      'Employee Code / PEN',
      'Designation',
      'Department',
      'Roles',
      'Email ID',
      'Mobile Number',
      'Username',
      'Status'
    ];
    const rows = filteredFaculty.map(f => {
      const dept = departments.find(d => d.id === f.departmentId)?.name || 'General / Office';
      return [
        `"${f.fullName}"`,
        `"${f.employeeCode || f.employeeId || ''}"`,
        `"${f.designation}"`,
        `"${dept}"`,
        `"${f.roles.join(', ')}"`,
        `"${f.email}"`,
        `"${f.mobileNumber || f.phoneNumber || f.phone || ''}"`,
        `"${f.username || ''}"`,
        `"${f.status || 'ACTIVE'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${isHOD ? (hodDepartment?.code || 'Dept') + '_Staff_Register' : 'NSS_Staff_Register'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (activeRole !== 'SUPER_ADMIN' && activeRole !== 'PRINCIPAL' && activeRole !== 'HOD') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Restricted Administrative Registry</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The institutional staff directory, credentials, and onboarding records are restricted to the College Principal, System Administrators, and Head of Departments for their respective department.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between gap-2 shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {pageError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Database Error: {pageError}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold font-display text-slate-900">
            {isHOD ? `${hodDepartment?.code || 'Department'} Staff` : 'Staff & Faculty'}
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
            {baseFacultySet.length} Members
          </span>
        </div>

        {onNavigateToStudents && (
          <button
            onClick={onNavigateToStudents}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all w-fit"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Students Directory</span>
          </button>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isHOD ? 'Dept Faculty' : 'Total Staff'}
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{baseFacultySet.length}</p>
          <span className="text-[10px] text-slate-400">{isHOD ? `${hodDepartment?.code || 'Dept'} registered` : 'All registered'}</span>
        </div>
        {!isHOD && (
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">HODs</p>
            <p className="text-xl sm:text-2xl font-black text-blue-700 mt-1">{hodCount}</p>
            <span className="text-[10px] text-slate-400">Department heads</span>
          </div>
        )}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Class Tutors</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{tutorCount}</p>
          <span className="text-[10px] text-slate-400">Cohort mentors</span>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Teaching Faculty</p>
          <p className="text-xl sm:text-2xl font-black text-purple-700 mt-1">{teacherCount}</p>
          <span className="text-[10px] text-slate-400">Course instructors</span>
        </div>
        {isHOD ? (
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Coordinators</p>
            <p className="text-xl sm:text-2xl font-black text-indigo-700 mt-1">
              {baseFacultySet.filter(f => f.roles.includes('COURSE_COORDINATOR')).length}
            </p>
            <span className="text-[10px] text-slate-400">Curriculum / FYUGP</span>
          </div>
        ) : (
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Office Staff</p>
            <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{officeCount}</p>
            <span className="text-[10px] text-slate-400">Admin & Records</span>
          </div>
        )}
        {isHOD ? (
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Active Status</p>
            <p className="text-xl sm:text-2xl font-black text-teal-700 mt-1">
              {baseFacultySet.filter(f => f.status === 'ACTIVE' || !f.status).length}
            </p>
            <span className="text-[10px] text-slate-400">Teaching active</span>
          </div>
        ) : (
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Principal</p>
            <p className="text-xl sm:text-2xl font-black text-rose-700 mt-1">{principalCount}</p>
            <span className="text-[10px] text-slate-400">Executive head</span>
          </div>
        )}
      </div>

      {/* Quick Role Onboarding Preset Bar */}
      {canAdd && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Quick Register by Role
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!isHOD && (
              <button
                onClick={() => handleQuickPreset('HOD')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition-all"
              >
                <Building className="w-3.5 h-3.5" /> + Quick Register HOD
              </button>
            )}
            <button
              onClick={() => handleQuickPreset('CLASS_TUTOR')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5" /> + Quick Register Class Tutor
            </button>
            <button
              onClick={() => handleQuickPreset('TEACHER')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" /> + Quick Register Faculty
            </button>
            {!isHOD && (
              <>
                <button
                  onClick={() => handleQuickPreset('OFFICE_STAFF')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5 transition-all"
                >
                  <Briefcase className="w-3.5 h-3.5" /> + Quick Register Office Staff
                </button>
                <button
                  onClick={() => handleQuickPreset('PRINCIPAL')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> + Quick Register Principal
                </button>
              </>
            )}
            <button
              onClick={handleOpenAdd}
              className="w-full sm:w-auto sm:ml-auto px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Staff Onboarding Form
            </button>
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Mobile Number, Email ID, or PEN / Employee Code..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Department Filter */}
            {!isHOD ? (
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
              >
                <option value="ALL">All Departments & Units</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                <span>{hodDepartment?.name || 'Department'} Scope</span>
              </div>
            )}

            {/* Export & View Toggles */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
              </button>

              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-100 shrink-0">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Role Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Filter Role:</span>
          {[
            { id: 'ALL', label: 'All Staff' },
            { id: 'HOD', label: 'HODs' },
            { id: 'CLASS_TUTOR', label: 'Class Tutors' },
            { id: 'TEACHER', label: 'Teachers' },
            { id: 'OFFICE_STAFF', label: 'Office Staff' },
            { id: 'PRINCIPAL', label: 'Principal' },
            { id: 'COURSE_COORDINATOR', label: 'Course Coordinators' },
            { id: 'ATTENDANCE_COORDINATOR', label: 'Attendance Coordinators' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                roleFilter === r.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Roster Content */}
      {filteredFaculty.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No staff members found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new staff member (HOD, Class Tutor, Faculty, Office Staff) using the quick buttons above.
          </p>
          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Enroll First Staff Member
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFaculty.map(fac => {
            const dept = departments.find(d => d.id === fac.departmentId);
            const assignments = facultyAssignments.filter(fa => fa.facultyId === fac.id);
            const userLogin = fac.username || fac.email.split('@')[0];

            return (
              <div
                key={fac.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Avatar, Name, Designation */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                      {fac.fullName.replace(/Dr\.|Prof\.|Sri\.|Smt\./g, '').trim().slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{fac.fullName}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          fac.status === 'ON_LEAVE'
                            ? 'bg-amber-100 text-amber-800'
                            : fac.status === 'RETIRED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {fac.status || 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-indigo-700">{fac.designation}</p>
                      <p className="text-[11px] text-slate-500 truncate">{dept?.name || 'General / Office'}</p>
                    </div>
                  </div>

                  {/* Role Badges */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {fac.roles.map(r => (
                      <span
                        key={r}
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                          r === 'HOD'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : r === 'CLASS_TUTOR'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : r === 'OFFICE_STAFF'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : r === 'PRINCIPAL'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  {/* Contact & PEN Details */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">Employee / PEN:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {fac.employeeCode || fac.employeeId || 'PEN-2026-REG'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-700 truncate">
                      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{fac.mobileNumber || fac.phoneNumber || fac.phone || 'Contact not set'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-700 truncate">
                      <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{fac.email}</span>
                    </div>
                  </div>

                  {/* Portal Credentials Section */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px] text-slate-500">Username:</span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">{userLogin}</span>
                    </div>
                    <button
                      onClick={() => handleCopyCredentials(fac)}
                      className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 transition-all"
                    >
                      {copiedId === fac.id ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Credentials
                        </>
                      )}
                    </button>
                  </div>

                  {/* Teaching Allocations (If applicable) */}
                  {fac.roles.some(r => ['TEACHER', 'HOD', 'CLASS_TUTOR'].includes(r)) && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Course Cohorts ({assignments.length})
                        </span>
                        {canAssign && (
                          <button
                            onClick={() => handleOpenAssign(fac)}
                            className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Assign Course
                          </button>
                        )}
                      </div>
                      {assignments.length === 0 ? (
                        <p className="text-slate-400 italic text-[11px]">No active course groups allocated.</p>
                      ) : (
                        <div className="space-y-1">
                          {assignments.slice(0, 2).map(a => {
                            const grp = courseGroups.find(g => g.id === a.courseGroupId);
                            const off = courseOfferings.find(o => o.id === grp?.courseOfferingId);
                            const crs = courses.find(c => c.id === off?.courseId);
                            return (
                              <div key={a.id} className="text-[11px] text-slate-700 bg-purple-50/60 border border-purple-100 px-2 py-1 rounded flex justify-between">
                                <span className="font-semibold text-purple-950">{crs?.courseCode}</span>
                                <span className="text-purple-800 text-[10px]">{grp?.groupName}</span>
                              </div>
                            );
                          })}
                          {assignments.length > 2 && (
                            <p className="text-[10px] text-slate-400 text-right">+{assignments.length - 2} more cohorts</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    ID: <span className="font-mono">{fac.id.slice(-6)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(fac)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteStaff(fac)}
                        disabled={deletingStaffId === fac.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50"
                        title="Delete staff record"
                      >
                        {deletingStaffId === fac.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Staff Member & Designation</th>
                  <th className="py-3 px-4">PEN / Code</th>
                  <th className="py-3 px-4">Department / Unit</th>
                  <th className="py-3 px-4">Assigned Roles</th>
                  <th className="py-3 px-4">Contact (Mobile & Email)</th>
                  <th className="py-3 px-4">Portal Username</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredFaculty.map(fac => {
                  const dept = departments.find(d => d.id === fac.departmentId);
                  const userLogin = fac.username || fac.email.split('@')[0];

                  return (
                    <tr key={fac.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{fac.fullName}</div>
                        <div className="text-indigo-700 text-[11px] font-semibold">{fac.designation}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {fac.employeeCode || fac.employeeId || 'PEN-2026-REG'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {dept?.name || 'Administrative Office'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {fac.roles.map(r => (
                            <span key={r} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{fac.mobileNumber || fac.phoneNumber || fac.phone || '-'}</div>
                        <div className="text-[11px] text-slate-400">{fac.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {userLogin}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyCredentials(fac)}
                            className="p-1.5 rounded text-indigo-700 hover:bg-indigo-50"
                            title="Copy credentials"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(fac)}
                              className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
                              title="Edit staff details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteStaff(fac)}
                              disabled={deletingStaffId === fac.id}
                              className="p-1.5 rounded text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                              title="Delete staff"
                            >
                              {deletingStaffId === fac.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Enrollment & Edit Modal */}
      {canAdd && (
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title={editingFac ? 'Edit Staff Details' : 'Add Staff Member'}
        >
          <form onSubmit={handleSaveStaff} className="space-y-4">
            {/* Full Name & Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name with Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Dr. Radhakrishnan K. or Smt. Priya M."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Mobile Number & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  placeholder="10-digit mobile number (e.g. 9447123450)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Official Email ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="staff@nssce.ac.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Employee Code / PEN & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Employee Code / PEN (Permanent Employee Number) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={employeeCode}
                  onChange={e => setEmployeeCode(e.target.value)}
                  placeholder="e.g. PEN-1995-CS01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Department / Office Unit <span className="text-rose-500">*</span>
                  {isHOD && <span className="text-[10px] text-indigo-600 font-semibold ml-2">(Locked to your Department)</span>}
                </label>
                <select
                  value={isHOD && hodDeptId ? hodDeptId : departmentId}
                  disabled={isHOD}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-700 disabled:cursor-not-allowed"
                >
                  {departments
                    .filter(d => !isHOD || d.id === hodDeptId)
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Designation & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Designation <span className="text-rose-500">*</span>
                </label>
                <select
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {isHOD ? (
                    <>
                      <option value="Assistant Professor & Class Tutor">Assistant Professor & Class Tutor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Lab Instructor">Lab Instructor</option>
                      <option value="Guest Lecturer">Guest Lecturer</option>
                    </>
                  ) : (
                    <>
                      <option value="Professor & HOD">Professor & HOD</option>
                      <option value="Associate Professor & HOD">Associate Professor & HOD</option>
                      <option value="Assistant Professor & Class Tutor">Assistant Professor & Class Tutor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Principal">Principal</option>
                      <option value="Office Superintendent">Office Superintendent</option>
                      <option value="Senior Clerk">Senior Clerk</option>
                      <option value="Head Accountant">Head Accountant</option>
                      <option value="Junior Superintendent">Junior Superintendent</option>
                      <option value="Lab Instructor">Lab Instructor</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Account Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="RESIGNED">RESIGNED</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </div>
            </div>

            {/* Assigned Authority Roles */}
            {canManageRoles && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Institutional Authority Roles (Multi-Role Allowed)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {allAvailableRoles.map(r => {
                    const isSelected = roles.includes(r.role);
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => toggleRole(r.role)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-extrabold">{r.label}</span>
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {r.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Portal Login Credentials */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-800">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Portal Login Credentials</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillSuggestedCredentials}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2"
                >
                  Generate Suggested
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Staff Portal Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Auto-generated if left blank"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  />
                  <div className="flex items-center gap-1 mt-1">
                    {!username.trim() ? (
                      <span className="text-[10px] text-slate-400">Auto-generated upon save if blank</span>
                    ) : usernameCheck.isValid ? (
                      <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Valid username
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> Min 4 chars & 1 number
                      </span>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Staff Portal Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Auto-generated if left blank"
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {!password.trim() ? (
                      <span className="text-[10px] text-slate-400">Auto-generated upon save if blank</span>
                    ) : passwordCheck.isValid ? (
                      <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Valid password
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> Min 4 chars & 1 number
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {staffModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Database Error:</span> {staffModalError}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isSavingStaff}
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!areCredentialsValid || isSavingStaff}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                  areCredentialsValid && !isSavingStaff
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {isSavingStaff ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <span>{editingFac ? 'Update Staff Member' : 'Complete Staff Enrollment'}</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Teaching Course Group Allocation Modal */}
      {canAssign && (
        <Modal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          title="Assign Teaching Cohort / Course Group"
          subtitle={`Staff: ${selectedFacForAssign?.fullName} (${selectedFacForAssign?.designation})`}
        >
          <form onSubmit={handleSaveAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select Course Group & Classroom
              </label>
              <select
                value={assignCourseGroupId}
                onChange={e => setAssignCourseGroupId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {courseGroups.map(g => {
                  const off = courseOfferings.find(o => o.id === g.courseOfferingId);
                  const crs = courses.find(c => c.id === off?.courseId);
                  return (
                    <option key={g.id} value={g.id}>
                      {crs?.courseCode} - {crs?.courseTitle} ({g.groupName}, Room: {g.room})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Instructional Role
              </label>
              <select
                value={assignRole}
                onChange={e => setAssignRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="PRIMARY">Primary Instructor / Lead Faculty</option>
                <option value="CO_TEACHER">Co-Teacher / Tutorial Guide</option>
                <option value="LAB_INSTRUCTOR">Practical / Lab Instructor</option>
              </select>
            </div>

            {assignModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Database Error:</span> {assignModalError}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isSavingAssign}
                onClick={() => setIsAssignOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingAssign}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
              >
                {isSavingAssign ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Allocating in Supabase...</span>
                  </>
                ) : (
                  <span>Confirm Course Allocation</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Dialog for Deleting Staff Member */}
      <ConfirmDialog
        isOpen={!!facultyToDelete}
        onClose={() => setFacultyToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={!!deletingStaffId}
        title={`Delete ${facultyToDelete?.roles?.includes('HOD') ? 'HOD' : 'Faculty'} Record`}
        message={
          <div>
            <p>
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">{facultyToDelete?.fullName}</strong>{' '}
              ({facultyToDelete?.designation})?
            </p>
            <p className="mt-2 text-rose-600 font-medium">
              This action unbinds any department HOD assignments, clears course allocations, and removes credentials from the system.
            </p>
          </div>
        }
        detailText={
          facultyToDelete
            ? `ID: ${facultyToDelete.id} • Employee ID: ${facultyToDelete.employeeId || 'N/A'} • Dept: ${departments.find(d => d.id === facultyToDelete.departmentId)?.name || 'N/A'}`
            : undefined
        }
        confirmLabel="Yes, Delete Record"
        variant="danger"
      />
    </div>
  );
};
