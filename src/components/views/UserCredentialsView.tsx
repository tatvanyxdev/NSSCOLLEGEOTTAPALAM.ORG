import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
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
  securityStatus: string;
  googleLinked: boolean;
  authNote?: string;
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

function generateSecureTempPassword(length = 10): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return 'Nss#' + Array.from(bytes, b => charset[b % charset.length]).join('');
}

export const UserCredentialsView: React.FC = () => {
  const { activeRole, user, adminResetUserPassword } = useAuth();
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pageBanner, setPageBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit / Reset Modal State
  const [editingRow, setEditingRow] = useState<UnifiedCredentialRow | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [forceChangeOnLogin, setForceChangeOnLogin] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(false);
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

  // Build unified directory strictly when Super Admin is active (never displays plaintext passwords)
  const allRows = useMemo<UnifiedCredentialRow[]>(() => {
    if (activeRole !== 'SUPER_ADMIN') return [];

    const rows: UnifiedCredentialRow[] = [];

    // 1. Authenticated Super Administrator Profile (DB-backed)
    if (user) {
      rows.push({
        rowKey: `master-${user.id}`,
        sourceType: 'MASTER',
        sourceId: user.id,
        displayName: user.name || 'System Super Administrator',
        subtitle: `Verified Super Admin · ${user.email || 'Institutional Account'}`,
        departmentLabel: 'System Master Console',
        roles: user.roles?.length ? user.roles : ['SUPER_ADMIN'],
        primaryUsername: user.username || user.email || 'admin',
        acceptedIdentifiers: Array.from(new Set([user.username, user.email].filter(Boolean) as string[])),
        securityStatus: 'Bcrypt + Session Protected',
        googleLinked: Boolean(user.email),
        authNote: 'Managed via cryptographic session and self-service password rotation',
        statusLabel: 'ACTIVE',
        editable: false
      });
    }

    // 2. Faculty & Staff Accounts
    const sortedFaculty = [...faculty].sort((a, b) =>
      (a.fullName || '').localeCompare(b.fullName || '')
    );

    sortedFaculty.forEach(f => {
      const resolvedUsername = (f.username || '').trim();
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
      const googleLinked = Boolean((f as any).googleEmail || (f as any).google_email);

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
        securityStatus: f.mustChangePassword ? 'Temp Password · Reset Required' : 'Bcrypt Hash Protected',
        googleLinked,
        authNote: googleLinked
          ? 'Google Sign-In verified · Password stored as bcrypt hash'
          : 'Password stored as server-side bcrypt hash (resettable below)',
        statusLabel: f.status || (f.isActive === false ? 'INACTIVE' : 'ACTIVE'),
        editable: true,
        facultyRef: f
      });
    });

    // 3. Student Accounts
    const sortedStudents = [...students].sort((a, b) =>
      (a.fullName || '').localeCompare(b.fullName || '')
    );

    sortedStudents.forEach(s => {
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
      const googleLinked = Boolean((s as any).googleEmail || (s as any).google_email);

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
        securityStatus: s.mustChangePassword ? 'Temp Password · Reset Required' : 'Bcrypt Hash Protected',
        googleLinked,
        authNote: 'Initial onboarding default uses DOB (DDMMYYYY) + mobile last 2 digits until changed',
        statusLabel: s.status || 'ACTIVE',
        editable: true,
        studentRef: s
      });
    });

    return rows;
  }, [activeRole, user, faculty, students, deptMap, progMap]);

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

  const openEditModal = (row: UnifiedCredentialRow) => {
    if (!row.editable) return;
    setEditingRow(row);
    setEditUsername(row.primaryUsername === '—' ? '' : row.primaryUsername);
    setEditPassword('');
    setForceChangeOnLogin(true);
    setShowEditPassword(false);
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
      if (!uRules.isValid) {
        setEditError('Staff username must be at least 3 characters with no spaces (letters, numbers, dot, underscore, hyphen).');
        return;
      }
      if (cleanPassword && cleanPassword.length < 6) {
        setEditError('New staff password must be at least 6 characters long.');
        return;
      }

      setIsSavingEdit(true);
      if (cleanUsername !== (editingRow.facultyRef.username || '').trim()) {
        const res = await updateFaculty(editingRow.facultyRef.id, {
          username: cleanUsername
        });
        if (!res.success) {
          setIsSavingEdit(false);
          setEditError(res.error || 'Failed to update staff username.');
          return;
        }
      }

      if (cleanPassword) {
        const resetRes = await adminResetUserPassword(
          'FACULTY',
          editingRow.facultyRef.id,
          cleanPassword,
          forceChangeOnLogin
        );
        if (!resetRes.success) {
          setIsSavingEdit(false);
          setEditError(resetRes.error || 'Failed to reset staff password.');
          return;
        }
      }

      setIsSavingEdit(false);
      setPageBanner({
        type: 'success',
        text: cleanPassword
          ? `Updated username and issued bcrypt password reset for ${editingRow.displayName}.`
          : `Updated login username for ${editingRow.displayName}.`
      });
      setEditingRow(null);
      setTimeout(() => setPageBanner(null), 4000);
      return;
    }

    if (editingRow.sourceType === 'STUDENT' && editingRow.studentRef) {
      const uCheck = validateUsername(cleanUsername);
      if (!uCheck.isValid) {
        setEditError(uCheck.errors[0]);
        return;
      }
      if (cleanPassword) {
        const pCheck = validatePassword(cleanPassword);
        if (!pCheck.isValid) {
          setEditError(pCheck.errors[0]);
          return;
        }
        if (cleanPassword.length < 6) {
          setEditError('New student password must be at least 6 characters long.');
          return;
        }
      }

      setIsSavingEdit(true);
      if (cleanUsername !== (editingRow.studentRef.username || '').trim()) {
        const res = await updateStudent(editingRow.studentRef.id, {
          username: cleanUsername
        });
        if (!res.success) {
          setIsSavingEdit(false);
          setEditError(res.error || 'Failed to update student username.');
          return;
        }
      }

      if (cleanPassword) {
        const resetRes = await adminResetUserPassword(
          'STUDENT',
          editingRow.studentRef.id,
          cleanPassword,
          forceChangeOnLogin
        );
        if (!resetRes.success) {
          setIsSavingEdit(false);
          setEditError(resetRes.error || 'Failed to reset student password.');
          return;
        }
      }

      setIsSavingEdit(false);
      setPageBanner({
        type: 'success',
        text: cleanPassword
          ? `Updated username and issued bcrypt password reset for ${editingRow.displayName}.`
          : `Updated login username for ${editingRow.displayName}.`
      });
      setEditingRow(null);
      setTimeout(() => setPageBanner(null), 4000);
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
      'Security Status',
      'Google Linked',
      'Account Status'
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
          row.securityStatus,
          row.googleLinked ? 'YES' : 'NO',
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
    link.download = `nss-college-accounts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setPageBanner({
      type: 'success',
      text: `Exported ${filteredRows.length} account directory record(s) (passwords omitted for security).`
    });
    setTimeout(() => setPageBanner(null), 3500);
  };

  const filterTabs: { id: CredentialCategory; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Users', count: categoryCounts.ALL },
    { id: 'MASTER', label: 'Super Admin', count: categoryCounts.MASTER },
    { id: 'PRINCIPAL', label: 'Principal', count: categoryCounts.PRINCIPAL },
    { id: 'HOD', label: 'HOD', count: categoryCounts.HOD },
    { id: 'TEACHER', label: 'Teacher', count: categoryCounts.TEACHER },
    { id: 'CLASS_TUTOR', label: 'Class Tutor', count: categoryCounts.CLASS_TUTOR },
    { id: 'COORDINATORS', label: 'Coordinators', count: categoryCounts.COORDINATORS },
    { id: 'OFFICE_STAFF', label: 'Office Staff', count: categoryCounts.OFFICE_STAFF },
    { id: 'STUDENT', label: 'Students', count: categoryCounts.STUDENT }
  ];

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
                User Credentials &amp; Security Directory
              </h2>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                Super Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Manage usernames and issue server-verified password resets across Staff &amp; Faculty and Student portals. Passwords are encrypted server-side and never displayed or exported.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
                    <th className="py-3 px-4">Credential Security</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredRows.map(row => {
                    const userCopyKey = `u-${row.rowKey}`;
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                              <ShieldCheck className="w-3 h-3" />
                              {row.securityStatus}
                            </span>
                            {row.googleLinked && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-[10px]">
                                Google Linked
                              </span>
                            )}
                          </div>
                          {row.authNote && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
                              {row.authNote}
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
                                  `${row.displayName}\nUsername: ${row.primaryUsername}\nPortal URL: ${window.location.origin}`
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
                                  <span>Copy ID</span>
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
                                <span>Update / Reset</span>
                              </button>
                            ) : (
                              <span className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                Protected
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
                const userCopyKey = `mu-${row.rowKey}`;
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
                          Credential Security
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {row.securityStatus}
                          </span>
                          {row.googleLinked && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                              Google Linked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {row.authNote && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {row.authNote}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            pairCopyKey,
                            `${row.displayName}\nUsername: ${row.primaryUsername}\nPortal URL: ${window.location.origin}`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === pairCopyKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === pairCopyKey ? 'Copied' : 'Copy ID'}</span>
                      </button>

                      {row.editable && (
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-rose-800 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Update / Reset</span>
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

      {/* Update Username / Reset Password Modal */}
      <Modal
        isOpen={!!editingRow}
        onClose={() => !isSavingEdit && setEditingRow(null)}
        title={editingRow ? `Update Account · ${editingRow.displayName}` : 'Update Account'}
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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reset Password (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditPassword(generateSecureTempPassword());
                      setShowEditPassword(true);
                    }}
                    className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Secure Temp</span>
                  </button>
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
                          setShowEditPassword(true);
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
              </div>

              <div className="relative">
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password (min 6 chars to reset)"
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

              {editPassword.trim() ? (
                editingRow.sourceType === 'STAFF' ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {staffPasswordValidation.isValid && editPassword.trim().length >= 6
                      ? 'Valid reset password (≥6 chars, encrypted server-side).'
                      : 'Password reset requires at least 6 characters.'}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {studentPasswordValidation.isValid && editPassword.trim().length >= 6
                      ? 'Valid student reset password (≥6 chars with at least 1 digit).'
                      : 'Student password reset requires ≥6 characters and at least 1 number.'}
                  </p>
                )
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Leave empty if only updating username; existing bcrypt password hash remains unchanged.
                </p>
              )}
            </div>

            {editPassword.trim() && (
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceChangeOnLogin}
                  onChange={e => setForceChangeOnLogin(e.target.checked)}
                  className="rounded text-rose-800"
                />
                <span>Require user to change this temporary password on next login</span>
              </label>
            )}

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
                {isSavingEdit ? 'Applying...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
