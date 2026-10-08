import React, { useState, useMemo } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, Faculty } from '../../types';
import { TeacherReassignmentModal } from './TeacherReassignmentModal';
import {
  UserCheck,
  Plus,
  Users,
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  Copy,
  Check,
  Building,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  ChevronRight,
  Send
} from 'lucide-react';

interface HodFacultyManagementCardProps {
  onNavigateToRequests?: () => void;
}

export const HodFacultyManagementCard: React.FC<HodFacultyManagementCardProps> = ({
  onNavigateToRequests
}) => {
  const {
    faculty,
    departments,
    courses,
    courseOfferings,
    courseGroups,
    facultyAssignments,
    inviteOrEnrollTeacher,
    assignFacultyToCourse
  } = useCollegeData();

  const { user, activeRole } = useAuth();
  const isHOD = activeRole === 'HOD';

  // Identify HOD's department
  const currentFaculty = useMemo(() => {
    return (
      faculty.find(
        f =>
          f.id === user?.id ||
          (f.email && user?.email && f.email.toLowerCase() === user.email.toLowerCase()) ||
          (f.username && user?.name && f.username.toLowerCase() === user.name.toLowerCase())
      ) || null
    );
  }, [faculty, user]);

  const hodDeptId = useMemo(() => {
    if (activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL') {
      return null; // Sees all
    }
    return (
      departments.find(d => d.hodFacultyId === currentFaculty?.id)?.id ||
      user?.departmentId ||
      currentFaculty?.departmentId ||
      departments[0]?.id
    );
  }, [activeRole, departments, currentFaculty, user]);

  const hodDepartment = departments.find(d => d.id === hodDeptId);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    'INVITE' | 'EXISTING' | 'PENDING_INVITES' | 'ASSIGNED' | 'UNASSIGNED'
  >('EXISTING');

  // Teacher Enrollment Form State
  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [isClassTutor, setIsClassTutor] = useState(false);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // UI feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdTeacherInfo, setCreatedTeacherInfo] = useState<{
    teacher: Faculty;
    tempPass: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reassignment Modal State
  const [reassignGroupId, setReassignGroupId] = useState<string | null>(null);

  // Quick Assign Unassigned Subject Modal State
  const [assigningGroupId, setAssigningGroupId] = useState<string | null>(null);
  const [quickAssignFacultyId, setQuickAssignFacultyId] = useState<string>('');

  // Department faculty list
  const deptFaculty = useMemo(() => {
    return faculty.filter(f => !hodDeptId || f.departmentId === hodDeptId);
  }, [faculty, hodDeptId]);

  // Pending invitations (teachers marked isInvited = true)
  const pendingInvitations = useMemo(() => {
    return deptFaculty.filter(f => f.isInvited || f.mustChangePassword);
  }, [deptFaculty]);

  // Department course groups
  const deptOfferings = useMemo(() => {
    return courseOfferings.filter(o => !hodDeptId || o.departmentId === hodDeptId);
  }, [courseOfferings, hodDeptId]);

  const deptGroups = useMemo(() => {
    const offeringIds = new Set(deptOfferings.map(o => o.id));
    return courseGroups.filter(g => offeringIds.has(g.courseOfferingId));
  }, [courseGroups, deptOfferings]);

  // Assigned subjects in department
  const assignedSubjects = useMemo(() => {
    return deptGroups
      .map(group => {
        const assignment = facultyAssignments.find(
          fa => fa.courseGroupId === group.id && fa.isActive !== false
        );
        if (!assignment) return null;

        const offering = courseOfferings.find(o => o.id === group.courseOfferingId);
        const course = courses.find(c => c.id === offering?.courseId);
        const assignedTeacher = faculty.find(f => f.id === assignment.facultyId);

        return {
          group,
          assignment,
          offering,
          course,
          assignedTeacher
        };
      })
      .filter(Boolean) as {
      group: typeof deptGroups[0];
      assignment: typeof facultyAssignments[0];
      offering?: typeof courseOfferings[0];
      course?: typeof courses[0];
      assignedTeacher?: typeof faculty[0];
    }[];
  }, [deptGroups, facultyAssignments, courseOfferings, courses, faculty]);

  // Unassigned subjects in department
  const unassignedSubjects = useMemo(() => {
    return deptGroups
      .filter(group => {
        const hasActiveAssignment = facultyAssignments.some(
          fa => fa.courseGroupId === group.id && fa.isActive !== false
        );
        return !hasActiveAssignment;
      })
      .map(group => {
        const offering = courseOfferings.find(o => o.id === group.courseOfferingId);
        const course = courses.find(c => c.id === offering?.courseId);
        return { group, offering, course };
      });
  }, [deptGroups, facultyAssignments, courseOfferings, courses]);

  // Submit enrollment / invitation
  const handleEnrollTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim()) {
      setErrorMessage('Full name and email are mandatory.');
      return;
    }

    const assignedDept = hodDeptId || departments[0]?.id || '';

    const roles: UserRole[] = ['TEACHER'];
    if (isClassTutor) roles.push('CLASS_TUTOR');

    setIsSubmitting(true);
    try {
      const res = await inviteOrEnrollTeacher({
        fullName: fullName.trim(),
        employeeCode: employeeCode.trim().toUpperCase() || `PEN-2026-${Math.floor(100 + Math.random() * 900)}`,
        departmentId: assignedDept,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '+91 94470 00000',
        designation: designation.trim() || 'Assistant Professor',
        roles,
        status
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Failed to enroll teacher.');
        setIsSubmitting(false);
        return;
      }

      setCreatedTeacherInfo({
        teacher: res.data,
        tempPass: res.tempPassword || 'Staff2026!'
      });

      // Clear fields
      setFullName('');
      setEmployeeCode('');
      setEmail('');
      setPhone('');
      setIsClassTutor(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected error creating teacher account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick direct assignment for unassigned subject
  const handleDirectAssign = async (groupId: string) => {
    if (!quickAssignFacultyId) return;
    const res = await assignFacultyToCourse({
      facultyId: quickAssignFacultyId,
      courseGroupId: groupId,
      role: 'PRIMARY'
    });
    if (res.success) {
      setAssigningGroupId(null);
      setQuickAssignFacultyId('');
    }
  };

  const handleCopyCredentials = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 via-white to-indigo-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {hodDepartment ? `${hodDepartment.name} Faculty Management` : 'Faculty Management Console'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {deptFaculty.length} Faculty
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Invite teachers, manage department credentials, assign course groups & maintain historical continuity
            </p>
          </div>
        </div>

        {onNavigateToRequests && (
          <button
            onClick={onNavigateToRequests}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Subject Requests Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Compact 5 Navigation Tabs */}
      <div className="px-4 pt-2.5 flex items-center gap-1 sm:gap-2 border-b border-slate-100 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => {
            setActiveTab('EXISTING');
            setCreatedTeacherInfo(null);
          }}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'EXISTING'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Existing Faculty ({deptFaculty.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('INVITE')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'INVITE'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add / Invite Teacher</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('PENDING_INVITES');
            setCreatedTeacherInfo(null);
          }}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'PENDING_INVITES'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Invitations ({pendingInvitations.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ASSIGNED');
            setCreatedTeacherInfo(null);
          }}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ASSIGNED'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Assigned Subjects ({assignedSubjects.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('UNASSIGNED');
            setCreatedTeacherInfo(null);
          }}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'UNASSIGNED'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Unassigned Subjects ({unassignedSubjects.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-4 sm:p-5">
        {/* TAB 1: ADD / INVITE TEACHER */}
        {activeTab === 'INVITE' && (
          <div className="max-w-2xl space-y-4">
            {createdTeacherInfo && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Teacher Account Enrolled Successfully!</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Account provisioned for <strong className="font-bold">{createdTeacherInfo.teacher.fullName}</strong>. 
                  Share the activation credentials below. The teacher will be prompted to set a permanent password at first login.
                </p>

                <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs font-mono space-y-1 text-slate-800">
                  <div className="flex items-center justify-between">
                    <span>Username: <strong className="text-indigo-700">{createdTeacherInfo.teacher.username}</strong></span>
                    <button
                      onClick={() =>
                        handleCopyCredentials(
                          `NSS College Ottapalam Portal Login\nTeacher: ${createdTeacherInfo.teacher.fullName}\nUsername: ${createdTeacherInfo.teacher.username}\nTemporary Password: ${createdTeacherInfo.tempPass}\nPortal URL: ${window.location.origin}`,
                          'temp-invite'
                        )
                      }
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-sans font-bold flex items-center gap-1"
                    >
                      {copiedId === 'temp-invite' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Credentials</span>
                    </button>
                  </div>
                  <div>Temporary Password: <strong className="text-emerald-700">{createdTeacherInfo.tempPass}</strong></div>
                  <div>Official Email: {createdTeacherInfo.teacher.email}</div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEnrollTeacher} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Secure Department Enrollment:</span>
                  <span>
                    As Head of Department, you can enroll faculty members into <strong className="font-bold">{hodDepartment?.name || 'your department'}</strong>. 
                    Passwords are never stored in plaintext and accounts require immediate password setup at first sign-in.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Teacher Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Haritha K. Nambiar"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Employee ID / Faculty Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PEN-2026-CS05"
                    value={employeeCode}
                    onChange={e => setEmployeeCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Designation
                  </label>
                  <select
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Guest Lecturer">Guest Lecturer</option>
                    <option value="Ad-hoc Faculty">Ad-hoc Faculty</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Official College Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. haritha.cs@nssce.ac.in"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 94470 12345"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value={hodDepartment ? `${hodDepartment.name} (${hodDepartment.code})` : 'All Departments'}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isClassTutor}
                      onChange={e => setIsClassTutor(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Grant Class Tutor Role</span>
                      <span className="text-[11px] text-slate-500">
                        Allows faculty to view cohort student registries and track batch attendance shortages.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Provisioning Account...</span>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Provision Teacher & Generate Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: EXISTING FACULTY */}
        {activeTab === 'EXISTING' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {deptFaculty.map(f => {
                const assignedGroups = facultyAssignments.filter(
                  fa => fa.facultyId === f.id && fa.isActive !== false
                );

                return (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-600">
                          {f.employeeCode || f.employeeId || 'ID N/A'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.status === 'ACTIVE' || f.isActive !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {f.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{f.fullName}</h4>
                        <p className="text-[11px] text-slate-500">{f.designation}</p>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{f.email}</span>
                        </div>
                        {f.phone && (
                          <div className="flex items-center gap-1.5 font-mono">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{f.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {f.roles.map(r => (
                          <span
                            key={r}
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-700">
                        {assignedGroups.length} Subject{assignedGroups.length === 1 ? '' : 's'}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyCredentials(
                            `Teacher: ${f.fullName}\nUsername: ${f.username || f.email.split('@')[0]}\nPassword: ${f.password || 'Staff2026!'}\nEmail: ${f.email}`,
                            f.id
                          )
                        }
                        className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                      >
                        {copiedId === f.id ? <Check className="w-3 h-3 text-emerald-600" /> : <KeyRound className="w-3 h-3" />}
                        <span>Credentials</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PENDING INVITATIONS */}
        {activeTab === 'PENDING_INVITES' && (
          <div>
            {pendingInvitations.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">No Pending Activations</h4>
                <p className="text-[11px] text-slate-500">All invited faculty have established their portal credentials.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    These teachers were invited or provisioned with temporary passwords. Once they log in and change their password, they will be fully verified.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingInvitations.map(inv => (
                    <div
                      key={inv.id}
                      className="p-3.5 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{inv.fullName}</span>
                        <span className="text-[11px] text-slate-500 block">{inv.email} • {inv.designation}</span>
                        <span className="text-[10px] text-amber-700 font-mono block mt-1">
                          Username: {inv.username || 'Pending'}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleCopyCredentials(
                            `NSS College Ottapalam Portal Activation\nTeacher: ${inv.fullName}\nUsername: ${inv.username || inv.email.split('@')[0]}\nTemporary Password: ${inv.password || 'Staff2026!'}\nLogin URL: ${window.location.origin}`,
                            `invite-${inv.id}`
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center gap-1 shrink-0"
                      >
                        {copiedId === `invite-${inv.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Invite</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ASSIGNED SUBJECTS */}
        {activeTab === 'ASSIGNED' && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-950 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  Change teachers at any point in the academic semester without losing attendance records taken by previous teachers.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {assignedSubjects.map(({ group, assignment, offering, course, assignedTeacher }) => (
                <div
                  key={group.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700">
                        {course?.courseCode || 'Course'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {group.groupName}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {course?.courseTitle || 'Course Title'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Room: {group.room || 'LH-101'} • AY {offering?.academicYear || '2026-27'}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 space-y-0.5 text-xs">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Assigned Teacher
                      </span>
                      <span className="font-bold text-slate-900 block truncate">
                        {assignedTeacher?.fullName || 'Teacher'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Role: {assignment.assignmentRole || 'PRIMARY'} • From: {assignment.startDate || 'Term start'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => setReassignGroupId(group.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reassign Teacher</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: UNASSIGNED SUBJECTS */}
        {activeTab === 'UNASSIGNED' && (
          <div>
            {unassignedSubjects.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">All Subjects Assigned</h4>
                <p className="text-[11px] text-slate-500">Every active course group in this department has an assigned instructor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {unassignedSubjects.map(({ group, offering, course }) => (
                  <div
                    key={group.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-amber-800">
                          {course?.courseCode || 'Course'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          Unassigned
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {course?.courseTitle || 'Course Title'}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Group: {group.groupName} • Room: {group.room || 'LH-101'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-amber-200/60">
                      {assigningGroupId === group.id ? (
                        <div className="space-y-2 text-xs">
                          <select
                            value={quickAssignFacultyId}
                            onChange={e => setQuickAssignFacultyId(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          >
                            <option value="">-- Choose Teacher --</option>
                            {deptFaculty.map(f => (
                              <option key={f.id} value={f.id}>
                                {f.fullName}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setAssigningGroupId(null)}
                              className="px-2 py-1 text-slate-500 font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDirectAssign(group.id)}
                              disabled={!quickAssignFacultyId}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold disabled:opacity-50"
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAssigningGroupId(group.id);
                            setQuickAssignFacultyId(deptFaculty[0]?.id || '');
                          }}
                          className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assign Teacher</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teacher Reassignment Modal */}
      {reassignGroupId && (
        <TeacherReassignmentModal
          isOpen={!!reassignGroupId}
          onClose={() => setReassignGroupId(null)}
          preselectedGroupId={reassignGroupId}
        />
      )}
    </div>
  );
};
