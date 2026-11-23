import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData, getFacultyCredentialOverrides } from '../../contexts/CollegeDataContext';
import { Modal } from '../common/UIComponents';
import {
  checkStaffPasswordRules,
  checkStaffUsernameRules,
  generateDefaultStudentPassword,
  validatePassword,
  validateUsername
} from '../../utils/credentialValidation';
import { Faculty, Student, UserRole } from '../../types';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users
} from 'lucide-react';

type CredentialCategory =
  | 'ALL'
  | 'MASTER'
  | 'PRINCIPAL'
  | 'HOD'
  | 'TEACHER'
  | 'CLASS_TUTOR'
  | 'COORDINATORS'
  | 'OFFICE_STAFF'
  | 'STUDENT';

interface UnifiedCredentialRow {
  rowKey: string;
  sourceType: 'MASTER' | 'STAFF' | 'STUDENT';
  sourceId: string;
  displayName: string;
  subtitle: string;
  departmentId?: string;
  departmentLabel: string;
  roles: UserRole[];
  primaryUsername: string;
  acceptedIdentifiers: string[];
  passwordDisplay: string;
  passwordSource: 'MASTER' | 'SAVED' | 'AUTO_DOB_MOBILE' | 'PORTAL_FALLBACK';
  fallbackNote?: string;
  statusLabel: string;
  editable: boolean;
  facultyRef?: Faculty;
  studentRef?: Student;
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  PRINCIPAL: 'Principal',
  HOD: 'HOD',
  TEACHER: 'Teacher',
  CLASS_TUTOR: 'Class Tutor',
  COURSE_COORDINATOR: 'Course Coord',
  ATTENDANCE_COORDINATOR: 'Attendance Coord',
  OFFICE_STAFF: 'Office Staff',
  STUDENT: 'Student'
};

const ROLE_TEXT_COLOR: Record<UserRole, string> = {
  SUPER_ADMIN: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900',
  PRINCIPAL: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900',
  HOD: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900',
  TEACHER: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900',
  CLASS_TUTOR: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-900',
  COURSE_COORDINATOR: 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-900',
  ATTENDANCE_COORDINATOR: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900',
  OFFICE_STAFF: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  STUDENT: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900'
};

function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  const trimmedStart = str.replace(/^[\u0000-\u001F]+/, '');
  const neutralized = /^[=+\-@\t\r]/.test(trimmedStart) ? `'${str}` : str;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

export const UserCredentialsView: React.FC = () => {
  const { activeRole } = useAuth();
  const {
    faculty,
    students,
    departments,
    programmes,
    updateFaculty,
    updateStudent
  } = useCollegeData();

  const [activeCategory, setActiveCategory] = useState<CredentialCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [revealedRows, setRevealedRows] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pageBanner, setPageBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [editingRow, setEditingRow] = useState<UnifiedCredentialRow | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach(d => map.set(d.id, `${d.code} · ${d.name}`));
    return map;
  }, [departments]);

  const progMap = useMemo(() => {
    const map = new Map<string, string>();
    programmes.forEach(p => map.set(p.id, p.code || p.name));
    return map;
  }, [programmes]);

  // Build unified directory strictly when Super Admin is active
  const allRows = useMemo<UnifiedCredentialRow[]>(() => {
    if (activeRole !== 'SUPER_ADMIN') return [];

    const rows: UnifiedCredentialRow[] = [];

    // 1. Master System Accounts (defined in AuthContext)
    rows.push({
      rowKey: 'master-super-admin',
      sourceType: 'MASTER',
      sourceId: 'super-admin-master',
      displayName: 'System Super Administrator',
      subtitle: 'Root System Control · Google Sign-In: admin@nssce.ac.in, tatvanyxdev@gmail.com, superadmin@nssce.ac.in',
      departmentLabel: 'System Master Console',
      roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER'],
      primaryUsername: 'admin',
      acceptedIdentifiers: ['admin', 'superadmin', 'admin@nssce.ac.in'],
      passwordDisplay: 'Admin2026!',
      passwordSource: 'MASTER',
      fallbackNote: 'Also accepts Nss2026! or Admin@2026',
      statusLabel: 'MASTER KEY',
      editable: false
    });

    rows.push({
      rowKey: 'master-principal',
      sourceType: 'MASTER',
      sourceId: 'principal-master',
      displayName: 'Office of the Principal (Master)',
      subtitle: 'Institutional Executive Master · Can also log in with Google Sign-In using principal@nssce.ac.in',
      departmentLabel: 'Principal Office',
      roles: ['PRINCIPAL', 'TEACHER'],
      primaryUsername: 'principal',
      acceptedIdentifiers: ['principal', 'principal@nssce.ac.in'],
      passwordDisplay: 'Principal2026!',
      passwordSource: 'MASTER',
      fallbackNote: 'Also accepts Nss2026! or Principal@2026',
      statusLabel: 'MASTER KEY',
      editable: false
    });

    // 2. Faculty & Staff Accounts
    const localOverrides = getFacultyCredentialOverrides();
    const sortedFaculty = [...faculty].sort((a, b) =>
      (a.fullName || '').localeCompare(b.fullName || '')
    );

    sortedFaculty.forEach(f => {
      const override =
        localOverrides[f.id] ||
        (f.employeeCode ? localOverrides[f.employeeCode] : undefined) ||
        (f.employeeId ? localOverrides[f.employeeId] : undefined) ||
        (f.email ? localOverrides[f.email] : undefined);

      const resolvedUsername = (override?.username || f.username || '').trim();
      const resolvedPassword = (override?.password || f.password || '').trim();
      const staffRoles: UserRole[] =
        f.roles && f.roles.length > 0 ? (f.roles as UserRole[]) : ['TEACHER'];

      const aliases = Array.from(
        new Set(
          [
            resolvedUsername,
            f.email,
            f.employeeCode,
            f.employeeId
          ]
            .map(v => (v || '').trim())
            .filter(Boolean)
        )
      );

      const empTag = f.employeeCode || f.employeeId;
      const metaParts = [f.designation || 'Faculty', empTag ? `Code: ${empTag}` : null, f.email || null].filter(Boolean);

      rows.push({
        rowKey: `staff-${f.id}`,
        sourceType: 'STAFF',
        sourceId: f.id,
        displayName: f.fullName,
        subtitle: metaParts.join(' · '),
        departmentId: f.departmentId,
        departmentLabel: deptMap.get(f.departmentId) || 'Unassigned Dept',
        roles: staffRoles,
        primaryUsername: resolvedUsername || f.email || empTag || '—',
        acceptedIdentifiers: aliases,
        passwordDisplay: resolvedPassword || 'Staff2026!',
        passwordSource: resolvedPassword ? 'SAVED' : 'PORTAL_FALLBACK',
        fallbackNote: resolvedPassword
          ? 'Also accepts Staff2026! / Nss2026!'
          : 'No custom password saved — portal accepts Staff2026!, Nss2026!, or any ≥4 char password with a digit',
        statusLabel: f.status || (f.isActive === false ? 'INACTIVE' : 'ACTIVE'),
        editable: true,
        facultyRef: {
          ...f,
          username: resolvedUsername || f.username,
          password: resolvedPassword || f.password
        }
      });
    });

    // 3. Student Accounts
    const sortedStudents = [...students].sort((a, b) =>
      (a.fullName || '').localeCompare(b.fullName || '')
    );

    sortedStudents.forEach(s => {
      const mobile = s.mobileNumber || s.phone || s.phoneNumber || '';
      const computedDefaultPass = generateDefaultStudentPassword(s.dateOfBirth, mobile);
      const savedPass = (s.password || '').trim();
      const effectivePassword = savedPass || computedDefaultPass || 'Nss2026!';
      const passwordSource: UnifiedCredentialRow['passwordSource'] = savedPass
        ? 'SAVED'
        : computedDefaultPass
          ? 'AUTO_DOB_MOBILE'
          : 'PORTAL_FALLBACK';

      const primaryUsername = (
        s.username ||
        s.universityRegisterNumber ||
        s.admissionNumber ||
        ''
      ).trim();

      const aliases = Array.from(
        new Set(
          [
            s.username,
            s.universityRegisterNumber,
            s.admissionNumber,
            s.email
          ]
            .map(v => (v || '').trim())
            .filter(Boolean)
        )
      );

      const progCode = progMap.get(s.programmeId);
      const metaParts = [
        progCode ? progCode : null,
        `Sem ${s.currentSemester || 1}`,
        s.rollNumber ? `Roll ${s.rollNumber}` : null,
        s.universityRegisterNumber ? `Reg: ${s.universityRegisterNumber}` : `Adm: ${s.admissionNumber}`
      ].filter(Boolean);

      rows.push({
        rowKey: `student-${s.id}`,
        sourceType: 'STUDENT',
        sourceId: s.id,
        displayName: s.fullName,
        subtitle: metaParts.join(' · '),
        departmentId: s.homeDepartmentId,
        departmentLabel: deptMap.get(s.homeDepartmentId) || 'Unassigned Dept',
        roles: ['STUDENT'],
        primaryUsername: primaryUsername || '—',
        acceptedIdentifiers: aliases,
        passwordDisplay: effectivePassword,
        passwordSource,
        fallbackNote:
          passwordSource === 'SAVED'
            ? 'Also accepts Nss2026!'
            : passwordSource === 'AUTO_DOB_MOBILE'
              ? 'Auto-generated (DDMMYYYY + last 2 mobile digits) · Also accepts Nss2026!'
              : 'Default student fallback password',
        statusLabel: s.status || 'ACTIVE',
        editable: true,
        studentRef: s
      });
    });

    return rows;
  }, [activeRole, faculty, students, deptMap, progMap]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CredentialCategory, number> = {
      ALL: allRows.length,
      MASTER: 0,
      PRINCIPAL: 0,
      HOD: 0,
      TEACHER: 0,
      CLASS_TUTOR: 0,
      COORDINATORS: 0,
      OFFICE_STAFF: 0,
      STUDENT: 0
    };
    allRows.forEach(r => {
      if (r.sourceType === 'MASTER') counts.MASTER++;
      if (r.roles.includes('PRINCIPAL')) counts.PRINCIPAL++;
      if (r.roles.includes('HOD')) counts.HOD++;
      if (r.roles.includes('TEACHER')) counts.TEACHER++;
      if (r.roles.includes('CLASS_TUTOR')) counts.CLASS_TUTOR++;
      if (r.roles.includes('COURSE_COORDINATOR') || r.roles.includes('ATTENDANCE_COORDINATOR')) {
        counts.COORDINATORS++;
      }
      if (r.roles.includes('OFFICE_STAFF')) counts.OFFICE_STAFF++;
      if (r.sourceType === 'STUDENT') counts.STUDENT++;
    });
    return counts;
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRows.filter(row => {
      if (activeCategory === 'MASTER' && row.sourceType !== 'MASTER') return false;
      if (activeCategory === 'PRINCIPAL' && !row.roles.includes('PRINCIPAL')) return false;
      if (activeCategory === 'HOD' && !row.roles.includes('HOD')) return false;
      if (activeCategory === 'TEACHER' && !row.roles.includes('TEACHER')) return false;
      if (activeCategory === 'CLASS_TUTOR' && !row.roles.includes('CLASS_TUTOR')) return false;
      if (
        activeCategory === 'COORDINATORS' &&
        !row.roles.includes('COURSE_COORDINATOR') &&
        !row.roles.includes('ATTENDANCE_COORDINATOR')
      ) {
        return false;
      }
      if (activeCategory === 'OFFICE_STAFF' && !row.roles.includes('OFFICE_STAFF')) return false;
      if (activeCategory === 'STUDENT' && row.sourceType !== 'STUDENT') return false;

      if (deptFilter !== 'ALL' && row.departmentId !== deptFilter) {
        return false;
      }

      if (!q) return true;
      return (
        row.displayName.toLowerCase().includes(q) ||
        row.subtitle.toLowerCase().includes(q) ||
        row.departmentLabel.toLowerCase().includes(q) ||
        row.primaryUsername.toLowerCase().includes(q) ||
        row.acceptedIdentifiers.some(id => id.toLowerCase().includes(q)) ||
        row.roles.some(role => ROLE_LABELS[role].toLowerCase().includes(q))
      );
    });
  }, [allRows, activeCategory, deptFilter, searchQuery]);

  // Strict RBAC guard after hooks
  if (activeRole !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3 max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Super Administrator Access Only
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The User Credentials Directory displays login usernames and passwords across all institutional portals and is restricted exclusively to the Super Administrator account.
        </p>
      </div>
    );
  }

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey(prev => (prev === key ? null : prev));
      }, 1800);
    } catch {
      setPageBanner({ type: 'error', text: 'Clipboard access was blocked by the browser.' });
    }
  };

  const toggleRowReveal = (rowKey: string) => {
    setRevealedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };

  const openEditModal = (row: UnifiedCredentialRow) => {
    if (!row.editable) return;
    setEditingRow(row);
    setEditUsername(row.primaryUsername === '—' ? '' : row.primaryUsername);
    setEditPassword(row.passwordDisplay || '');
    setShowEditPassword(true);
    setEditError(null);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    const cleanUsername = editUsername.trim();
    const cleanPassword = editPassword.trim();
    setEditError(null);

    if (editingRow.sourceType === 'STAFF' && editingRow.facultyRef) {
      const uRules = checkStaffUsernameRules(cleanUsername);
      const pRules = checkStaffPasswordRules(cleanPassword);
      if (!uRules.isValid) {
        setEditError('Staff username must be at least 3 characters with no spaces (letters, numbers, dot, underscore, hyphen).');
        return;
      }
      if (!pRules.isValid) {
        setEditError('Staff password must be at least 4 characters long.');
        return;
      }

      setIsSavingEdit(true);
      const res = await updateFaculty(editingRow.facultyRef.id, {
        username: cleanUsername,
        password: cleanPassword
      });
      setIsSavingEdit(false);

      if (!res.success) {
        setEditError(res.error || 'Failed to update staff credentials.');
        return;
      }
      setPageBanner({
        type: 'success',
        text: `Updated login credentials for ${editingRow.displayName}.`
      });
      setEditingRow(null);
      setTimeout(() => setPageBanner(null), 3500);
      return;
    }

    if (editingRow.sourceType === 'STUDENT' && editingRow.studentRef) {
      const uCheck = validateUsername(cleanUsername);
      const pCheck = validatePassword(cleanPassword);
      if (!uCheck.isValid) {
        setEditError(uCheck.errors[0]);
        return;
      }
      if (!pCheck.isValid) {
        setEditError(pCheck.errors[0]);
        return;
      }

      setIsSavingEdit(true);
      const res = await updateStudent(editingRow.studentRef.id, {
        username: cleanUsername,
        password: cleanPassword
      });
      setIsSavingEdit(false);

      if (!res.success) {
        setEditError(res.error || 'Failed to update student credentials.');
        return;
      }
      setPageBanner({
        type: 'success',
        text: `Updated login credentials for ${editingRow.displayName}.`
      });
      setEditingRow(null);
      setTimeout(() => setPageBanner(null), 3500);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Category',
      'Full Name',
      'Roles',
      'Department',
      'Primary Username',
      'Accepted Login Identifiers',
      'Password',
      'Password Source',
      'Status'
    ];

    const csvRows = [
      headers.map(sanitizeCsvCell).join(','),
      ...filteredRows.map(row =>
        [
          row.sourceType,
          row.displayName,
          row.roles.map(r => ROLE_LABELS[r]).join(' / '),
          row.departmentLabel,
          row.primaryUsername,
          row.acceptedIdentifiers.join(' | '),
          row.passwordDisplay,
          row.passwordSource,
          row.statusLabel
        ]
          .map(sanitizeCsvCell)
          .join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nss-college-credentials-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setPageBanner({
      type: 'success',
      text: `Exported ${filteredRows.length} credential record(s) to CSV.`
    });
    setTimeout(() => setPageBanner(null), 3500);
  };

  const filterTabs: { id: CredentialCategory; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Users', count: categoryCounts.ALL },
    { id: 'MASTER', label: 'Master Accounts', count: categoryCounts.MASTER },
    { id: 'PRINCIPAL', label: 'Principal', count: categoryCounts.PRINCIPAL },
    { id: 'HOD', label: 'HOD', count: categoryCounts.HOD },
    { id: 'TEACHER', label: 'Teacher', count: categoryCounts.TEACHER },
    { id: 'CLASS_TUTOR', label: 'Class Tutor', count: categoryCounts.CLASS_TUTOR },
    { id: 'COORDINATORS', label: 'Coordinators', count: categoryCounts.COORDINATORS },
    { id: 'OFFICE_STAFF', label: 'Office Staff', count: categoryCounts.OFFICE_STAFF },
    { id: 'STUDENT', label: 'Students', count: categoryCounts.STUDENT }
  ];

  const isRowRevealed = (rowKey: string) => showAllPasswords || !!revealedRows[rowKey];

  const staffUsernameValidation = checkStaffUsernameRules(editUsername);
  const staffPasswordValidation = checkStaffPasswordRules(editPassword);
  const studentUsernameValidation = validateUsername(editUsername);
  const studentPasswordValidation = validatePassword(editPassword);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-900 text-amber-300 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                User Credentials Directory
              </h2>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                Super Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              View, copy, and update usernames and passwords across Master accounts, Faculty &amp; Staff roles, and Student portals.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAllPasswords(prev => !prev)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {showAllPasswords ? <EyeOff className="w-4 h-4 text-rose-600 dark:text-rose-400" /> : <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
            <span>{showAllPasswords ? 'Hide All Passwords' : 'Show All Passwords'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-rose-800 hover:bg-slate-800 dark:hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV ({filteredRows.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {pageBanner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            pageBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{pageBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setPageBanner(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Accounts
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {allRows.length}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Active credential profiles
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Master Keys
            </span>
            <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {categoryCounts.MASTER}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Super Admin · Principal
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Staff &amp; Faculty
            </span>
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {faculty.length}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            HOD · Tutor · Teacher · Office
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Students
            </span>
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {students.length}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Student portal logins
          </p>
        </div>
      </div>

      {/* Role Filter Tabs + Search & Dept Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {filterTabs.map(tab => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-rose-900 text-white border-rose-900'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Department Select */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, email, employee code, register number, or department..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800"
            />
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-800/30 focus:border-rose-800"
            >
              <option value="ALL">All Departments ({departments.length})</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.code} · {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Credentials Table / Responsive Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Lock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No matching user credentials found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {allRows.length <= 2
                ? 'Onboard Staff & Faculty or Students to see their portal login credentials here.'
                : 'Adjust your search query, role tab, or department filter.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">User &amp; Department</th>
                    <th className="py-3 px-4">Portal Role(s)</th>
                    <th className="py-3 px-4">Username &amp; Accepted IDs</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredRows.map(row => {
                    const revealed = isRowRevealed(row.rowKey);
                    const userCopyKey = `u-${row.rowKey}`;
                    const passCopyKey = `p-${row.rowKey}`;
                    const pairCopyKey = `both-${row.rowKey}`;

                    return (
                      <tr
                        key={row.rowKey}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors align-top"
                      >
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {row.displayName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                            {row.subtitle}
                          </div>
                          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1">
                            {row.departmentLabel} · <span className="uppercase">{row.statusLabel}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {row.roles.map(r => (
                              <span
                                key={r}
                                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${ROLE_TEXT_COLOR[r]}`}
                              >
                                {ROLE_LABELS[r]}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <code className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs font-semibold">
                              {row.primaryUsername}
                            </code>
                            {row.primaryUsername !== '—' && (
                              <button
                                type="button"
                                onClick={() => handleCopy(userCopyKey, row.primaryUsername)}
                                title="Copy username"
                                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                {copiedKey === userCopyKey ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                          {row.acceptedIdentifiers.length > 1 && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono break-all">
                              Also: {row.acceptedIdentifiers.filter(id => id !== row.primaryUsername).join(' · ')}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <code className="px-2 py-1 rounded bg-amber-50/70 dark:bg-slate-800 border border-amber-200/70 dark:border-slate-700 text-slate-900 dark:text-amber-300 font-mono text-xs font-semibold tabular-nums">
                              {revealed ? row.passwordDisplay : '••••••••••'}
                            </code>
                            <button
                              type="button"
                              onClick={() => toggleRowReveal(row.rowKey)}
                              title={revealed ? 'Hide password' : 'Show password'}
                              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(passCopyKey, row.passwordDisplay)}
                              title="Copy password"
                              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedKey === passCopyKey ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {row.fallbackNote && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
                              {row.fallbackNote}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  pairCopyKey,
                                  `${row.displayName}\nUsername: ${row.primaryUsername}\nPassword: ${row.passwordDisplay}`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === pairCopyKey ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Pair</span>
                                </>
                              )}
                            </button>

                            {row.editable ? (
                              <button
                                type="button"
                                onClick={() => openEditModal(row)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-rose-900 dark:hover:bg-rose-800 text-white text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            ) : (
                              <span className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                Fixed Key
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet List */}
            <div className="lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRows.map(row => {
                const revealed = isRowRevealed(row.rowKey);
                const userCopyKey = `mu-${row.rowKey}`;
                const passCopyKey = `mp-${row.rowKey}`;
                const pairCopyKey = `mboth-${row.rowKey}`;

                return (
                  <div key={row.rowKey} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {row.displayName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {row.subtitle}
                        </p>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                          {row.departmentLabel}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                        {row.roles.map(r => (
                          <span
                            key={r}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ROLE_TEXT_COLOR[r]}`}
                          >
                            {ROLE_LABELS[r]}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          Username
                        </span>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <code className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {row.primaryUsername}
                          </code>
                          {row.primaryUsername !== '—' && (
                            <button
                              type="button"
                              onClick={() => handleCopy(userCopyKey, row.primaryUsername)}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              {copiedKey === userCopyKey ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          Password
                        </span>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <code className="font-mono text-xs font-bold text-slate-900 dark:text-amber-300 tabular-nums truncate">
                            {revealed ? row.passwordDisplay : '••••••••••'}
                          </code>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleRowReveal(row.rowKey)}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(passCopyKey, row.passwordDisplay)}
                              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              {copiedKey === passCopyKey ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {row.fallbackNote && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {row.fallbackNote}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            pairCopyKey,
                            `${row.displayName}\nUsername: ${row.primaryUsername}\nPassword: ${row.passwordDisplay}`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === pairCopyKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === pairCopyKey ? 'Copied' : 'Copy Pair'}</span>
                      </button>

                      {row.editable && (
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-rose-800 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Edit Credentials Modal */}
      <Modal
        isOpen={!!editingRow}
        onClose={() => !isSavingEdit && setEditingRow(null)}
        title={editingRow ? `Edit Credentials · ${editingRow.displayName}` : 'Edit Credentials'}
        subtitle={
          editingRow
            ? `${editingRow.departmentLabel} · ${editingRow.roles.map(r => ROLE_LABELS[r]).join(', ')}`
            : undefined
        }
        maxWidth="max-w-lg"
      >
        {editingRow && (
          <form onSubmit={handleSaveCredentials} className="space-y-4">
            {editError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {editError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Login Username
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-800/30"
              />
              {editingRow.sourceType === 'STAFF' ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {staffUsernameValidation.isValid
                    ? 'Valid staff username (≥3 chars, no spaces).'
                    : 'Must be ≥3 characters (letters, numbers, ., _, - with no spaces).'}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {studentUsernameValidation.isValid
                    ? 'Valid student username (≥4 chars with at least 1 digit).'
                    : 'Student usernames require ≥4 characters and at least 1 number.'}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Portal Password
                </label>
                {editingRow.sourceType === 'STUDENT' && editingRow.studentRef && (
                  <button
                    type="button"
                    onClick={() => {
                      const s = editingRow.studentRef!;
                      const def = generateDefaultStudentPassword(
                        s.dateOfBirth,
                        s.mobileNumber || s.phone || s.phoneNumber
                      );
                      if (def) {
                        setEditPassword(def);
                      } else {
                        setEditError('Date of Birth or Mobile Number is missing on this student record.');
                      }
                    }}
                    className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Use DOB + Mobile Default</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  required
                  className="w-full pl-3 pr-10 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-800/30"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(prev => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {editingRow.sourceType === 'STAFF' ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {staffPasswordValidation.isValid
                    ? 'Meets staff minimum password length (≥4 chars).'
                    : 'Must be at least 4 characters long.'}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {studentPasswordValidation.isValid
                    ? 'Valid student password (≥4 chars with at least 1 digit).'
                    : 'Student passwords require ≥4 characters and at least 1 number.'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setEditingRow(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-4 py-2 rounded-lg bg-rose-900 hover:bg-rose-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isSavingEdit ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
