import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { DigitalIdModal } from '../student/DigitalIdModal';
import { validatePassword, checkCredentialRules } from '../../utils/credentialValidation';
import {
  GraduationCap,
  IdCard,
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Building2,
  Copy,
  Check,
  Award,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Sparkles,
  Loader2
} from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth as firebaseAuth } from '../../lib/firebase';
import { firebaseSyncService } from '../../services/firebaseSyncService';

export const StudentIndividualProfileView: React.FC = () => {
  const { user } = useAuth();
  const {
    students,
    departments,
    programmes,
    courses,
    courseOfferings,
    studentCourseRegistrations,
    updateStudent,
    getStudentAttendanceSummary
  } = useCollegeData();

  // Strictly isolate to this logged in student only - NEVER leak other students
  const currentStudent =
    user?.studentProfile ||
    students.find(
      s =>
        s.id === user?.id ||
        (s.username && user?.name && s.username.toLowerCase() === user.name.toLowerCase()) ||
        (s.universityRegisterNumber && user?.name && s.universityRegisterNumber.toLowerCase() === user.name.toLowerCase()) ||
        (user?.email && s.email.toLowerCase() === user.email.toLowerCase())
    ) ||
    null;

  const [isDigitalIdOpen, setIsDigitalIdOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Password change state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [googleLinkSuccess, setGoogleLinkSuccess] = useState<string | null>(null);
  const [googleLinkError, setGoogleLinkError] = useState<string | null>(null);

  const handleLinkGoogle = async () => {
    if (!currentStudent) return;
    setIsLinkingGoogle(true);
    setGoogleLinkError(null);
    setGoogleLinkSuccess(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(firebaseAuth, provider);
      const gUser = cred.user;
      const cleanEmail = (gUser.email || '').trim().toLowerCase();

      if (!cleanEmail) {
        setGoogleLinkError('No email returned from Google.');
        setIsLinkingGoogle(false);
        return;
      }

      await firebaseSyncService.syncGoogleAccountLink({
        id: cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_'),
        email: cleanEmail,
        userType: 'STUDENT',
        profileId: currentStudent.id,
        name: currentStudent.fullName,
        identifier: currentStudent.universityRegisterNumber || currentStudent.admissionNumber,
        linkedAt: new Date().toISOString()
      });

      await updateStudent(currentStudent.id, {
        email: cleanEmail,
        profilePhotoUrl: currentStudent.profilePhotoUrl || gUser.photoURL || undefined
      });

      setGoogleLinkSuccess(`Connected Google Account (${cleanEmail})! 1-Tap sign-in is active.`);
      setIsLinkingGoogle(false);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setGoogleLinkError(err?.message || 'Failed to link Google account.');
      }
      setIsLinkingGoogle(false);
    }
  };

  if (!currentStudent) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-xs">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Student Profile Linked</h3>
        <p className="text-xs text-slate-500 mt-2">
          Your account is currently in preview mode without an active student record. Please sign in using your Student Portal credentials.
        </p>
      </div>
    );
  }

  const dept = departments.find(d => d.id === currentStudent.homeDepartmentId);
  const prog = programmes.find(p => p.id === currentStudent.programmeId);

  // Get student's enrolled courses
  const myRegistrations = studentCourseRegistrations.filter(r => r.studentId === currentStudent.id);
  const attendanceSummary = currentStudent ? getStudentAttendanceSummary(currentStudent.id) : null;

  const getCourseForReg = (offeringId: string) => {
    const off = courseOfferings.find(o => o.id === offeringId);
    if (!off) return null;
    return courses.find(c => c.id === off.courseId);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setPasswordError(validation.errors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsSavingPassword(true);

    // Save updated password with confirmed write
    const res = await updateStudent(currentStudent.id, {
      password: newPassword
    });

    setIsSavingPassword(false);

    if (!res.success) {
      setPasswordError(res.error || 'Failed to update password in database. Please try again.');
      return;
    }

    setPasswordSuccess('Password updated successfully! You can use this password for your next login.');
    setTimeout(() => {
      setIsChangePasswordOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(null);
    }, 2000);
  };

  const rules = checkCredentialRules(newPassword);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner: Student Identity */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-rose-900/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <img
              src={
                currentStudent.profilePhotoUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentStudent.fullName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
            />
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold tracking-wider uppercase border border-slate-900">
              {currentStudent.status}
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider font-mono">
                {currentStudent.admissionBatch} Batch
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
                Year {currentStudent.yearOfStudy || Math.ceil(currentStudent.currentSemester / 2)} • Semester {currentStudent.currentSemester}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold uppercase tracking-wider">
                FYUGP 4-Year Honours
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-bold font-display tracking-tight text-white break-words">
              {currentStudent.fullName}
            </h1>

            <p className="text-xs text-slate-300 mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span>
                Roll No: <strong className="text-white font-mono">{currentStudent.rollNumber}</strong>
              </span>
              <span className="hidden sm:inline">•</span>
              <span>
                Adm No: <strong className="text-white font-mono">{currentStudent.admissionNumber}</strong>
              </span>
              <span className="hidden sm:inline">•</span>
              <span>
                Univ Reg No:{' '}
                <strong className="text-amber-300 font-mono">
                  {currentStudent.universityRegisterNumber || 'Pending University Allotment'}
                </strong>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto self-stretch sm:self-start md:self-center">
          <button
            onClick={() => setIsDigitalIdOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-rose-800 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all border border-rose-600/50"
          >
            <IdCard className="w-4 h-4" /> View Digital ID Card
          </button>
        </div>
      </div>

      {/* Grid: Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Academic Affiliation & University Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card 1: Academic Credentials */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Academic & University Information</h3>
                  <p className="text-xs text-slate-500">Official records under University of Calicut</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                FYUGP 2024 Regs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">University Register Number</p>
                  <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {currentStudent.universityRegisterNumber || 'N/A'}
                  </p>
                </div>
                {currentStudent.universityRegisterNumber && (
                  <button
                    onClick={() => copyToClipboard(currentStudent.universityRegisterNumber!, 'regNo')}
                    className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Copy Register Number"
                  >
                    {copiedField === 'regNo' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Admission Number</p>
                <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">{currentStudent.admissionNumber}</p>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Home Department</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{dept?.name || 'Department of Computer Science'}</p>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Degree Programme</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{prog?.name || 'B.Sc. Computer Science (Honours)'}</p>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Year of Study</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  Year {currentStudent.yearOfStudy || Math.ceil(currentStudent.currentSemester / 2)} (Semester {currentStudent.currentSemester})
                </p>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Admission Batch</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{currentStudent.admissionBatch}</p>
              </div>
            </div>
          </div>

          {/* Card: Official Attendance & Duty Sanction Register */}
          {attendanceSummary && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Official Attendance & Special Duty Register</h3>
                    <p className="text-xs text-slate-500">Regular classes vs. Principal-sanctioned Union / Political duty</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      attendanceSummary.consolidatedPercentage >= 75
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : attendanceSummary.consolidatedPercentage >= 70
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {attendanceSummary.consolidatedPercentage >= 75
                      ? 'Exam Eligible (Compliant)'
                      : attendanceSummary.consolidatedPercentage >= 70
                      ? 'Attendance Shortage (Warning)'
                      : 'Critical Shortage (Condonation)'}
                  </span>
                </div>
              </div>

              {/* Attendance Triple Metrics Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Regular Academic Attendance */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Regular Academic Attendance
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-800 font-mono">
                      {attendanceSummary.regularPercentage}%
                    </span>
                    <span className="text-xs text-slate-500">
                      ({attendanceSummary.totalPresent} hrs)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Marked directly by course faculty in lecture periods.
                  </p>
                </div>

                {/* 2. Special Duty Attendance */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                      Special / Union Duty
                    </span>
                    {attendanceSummary.specialDutyPendingCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                        {attendanceSummary.specialDutyPendingCount} Pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-900 font-mono">
                      +{attendanceSummary.specialDutyApprovedCount} hrs
                    </span>
                    <span className="text-xs text-amber-700">sanctioned</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    College Union, student delegation & official representation.
                  </p>
                </div>

                {/* 3. Consolidated Official Total */}
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 block">
                    Consolidated Total Attendance
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-indigo-900 font-mono">
                      {attendanceSummary.consolidatedPercentage}%
                    </span>
                    <span className="text-xs text-indigo-700">
                      ({attendanceSummary.consolidatedTotalAttended}/{attendanceSummary.totalConducted} hrs)
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-900 font-semibold leading-tight">
                    Official percentage for university exam hall tickets.
                  </p>
                </div>
              </div>

              {/* Special Duty Submissions & Approvals List for this Student */}
              {attendanceSummary.studentSpecialEvents && attendanceSummary.studentSpecialEvents.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      Special Attendance Sanctions & Orders
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {attendanceSummary.studentSpecialEvents.length} Record(s) Found
                    </span>
                  </div>

                  <div className="space-y-2">
                    {attendanceSummary.studentSpecialEvents.map(evt => {
                      const isApproved = evt.status === 'APPROVED' || evt.status === 'APPLIED';
                      const isPending = evt.status === 'PENDING_PRINCIPAL' || evt.status === 'FORWARDED_TO_PRINCIPAL';

                      return (
                        <div
                          key={evt.id}
                          className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                            isApproved
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isPending
                              ? 'bg-amber-50/50 border-amber-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              {evt.title}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {isApproved
                                ? 'Principal Sanctioned & Consolidated'
                                : isPending
                                ? 'Forwarded by HOD • Awaiting Principal'
                                : 'Returned by Principal'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                            <span>
                              <strong>Date:</strong> {evt.eventDate}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Periods:</strong> {evt.isFullDay ? 'Full Day' : `${evt.periodsCount} Period(s)`}
                            </span>
                            {evt.dutyCertificateRef && (
                              <>
                                <span>•</span>
                                <span>
                                  <strong>Certificate Ref:</strong>{' '}
                                  <span className="font-mono text-slate-800 font-semibold">{evt.dutyCertificateRef}</span>
                                </span>
                              </>
                            )}
                            {evt.forwardedByHodName && (
                              <>
                                <span>•</span>
                                <span>
                                  <strong>Forwarded by HOD:</strong> {evt.forwardedByHodName}
                                </span>
                              </>
                            )}
                          </div>

                          {evt.principalRemarks && (
                            <div className="text-[11px] bg-white/80 p-2 rounded-lg border border-slate-200/60 text-slate-700">
                              <span className="font-semibold text-slate-900">Principal Remarks:</span> {evt.principalRemarks}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card 2: Allocated Courses (Major, Minor, MDC, AEC, SEC) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Enrolled Subjects & Courses</h3>
                  <p className="text-xs text-slate-500">Allocated by Head of Department & Academic Coordinator</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {myRegistrations.length} Allocated
              </span>
            </div>

            <div className="space-y-3">
              {myRegistrations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No courses currently allocated for this semester. Contact your Class Tutor or HOD.
                </div>
              ) : (
                myRegistrations.map(reg => {
                  const course = getCourseForReg(reg.courseOfferingId);
                  const isMajor = reg.courseCategoryId === 'cat-major';
                  const isMinor = reg.courseCategoryId === 'cat-minor';
                  const isMDC = reg.courseCategoryId === 'cat-mdc';

                  const badgeClass = isMajor
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : isMinor
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : isMDC
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  const badgeLabel = isMajor
                    ? 'Major Core'
                    : isMinor
                    ? 'Minor'
                    : isMDC
                    ? 'Multidisciplinary (MDC)'
                    : 'Ability / Skill (AEC/SEC)';

                  return (
                    <div
                      key={reg.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {course?.courseCode || 'CR-001'}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">• {course?.credits || 3} Credits</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {course?.courseTitle || 'Subject Title'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">
                          {course?.defaultSemester ? `Semester ${course.defaultSemester}` : 'Semester 1'}
                        </span>
                        <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                          Enrolled
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Contact, Parent & Security */}
        <div className="space-y-6">
          {/* Personal & Contact Info */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Personal & Contact</h3>
                <p className="text-xs text-slate-500">Contact data on official records</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Mobile Number
                </span>
                <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {currentStudent.mobileNumber || currentStudent.phoneNumber || currentStudent.phone || 'Not Recorded'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Official Email
                </span>
                <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{currentStudent.email}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Gender
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">{currentStudent.gender || 'Not Specified'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Blood Group
                  </span>
                  <p className="font-bold text-rose-700 mt-0.5">{currentStudent.bloodGroup || 'O+ve'}</p>
                </div>
              </div>

              {currentStudent.address && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Permanent Address
                  </span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{currentStudent.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Parent / Guardian Info */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Guardian Information</h3>
                <p className="text-xs text-slate-500">Emergency contact recorded at admission</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Guardian Name
                </span>
                <p className="font-bold text-slate-900 mt-0.5">{currentStudent.guardianName || 'Parent / Guardian'}</p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Guardian Mobile
                </span>
                <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {currentStudent.guardianPhone || '+91 94471 00000'}
                </p>
              </div>
            </div>
          </div>

          {/* Portal Credentials & Password Rules */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Portal Credentials & Security</h3>
                <p className="text-xs text-slate-500">Individual student login rules</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Portal Username
                </span>
                <p className="font-bold font-mono text-slate-900 mt-0.5 text-sm">
                  {currentStudent.username || currentStudent.admissionNumber.toLowerCase()}
                </p>
              </div>

              {/* Google 1-Tap Authentication Card */}
              <div className="p-3.5 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-xl border border-blue-100 text-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="font-bold text-xs text-slate-900">Google Sign-In</span>
                  </div>
                  {currentStudent.email ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Linked
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Not Linked
                    </span>
                  )}
                </div>

                {currentStudent.email ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-600">
                      Registered email: <span className="font-mono font-semibold text-slate-800">{currentStudent.email}</span>
                    </p>
                    <button
                      onClick={handleLinkGoogle}
                      disabled={isLinkingGoogle}
                      className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {isLinkingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                      <span>Switch / Re-link Google Account</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-600">
                      Connect your Google Account to sign in with 1 tap on your mobile device.
                    </p>
                    <button
                      onClick={handleLinkGoogle}
                      disabled={isLinkingGoogle}
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {isLinkingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Connect Google Account</span>
                    </button>
                  </div>
                )}

                {googleLinkSuccess && (
                  <p className="text-[11px] text-emerald-700 font-medium">{googleLinkSuccess}</p>
                )}
                {googleLinkError && (
                  <p className="text-[11px] text-rose-700 font-medium">{googleLinkError}</p>
                )}
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Credential Policy Enforced
                </p>
                <p className="text-[11px] text-emerald-700">
                  Username and password contain at least 4 characters and a number as required.
                </p>
              </div>

              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4" /> Change Portal Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Digital ID Modal */}
      <DigitalIdModal
        isOpen={isDigitalIdOpen}
        onClose={() => setIsDigitalIdOpen(false)}
        student={currentStudent}
      />

      {/* Password Change Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Update Student Password</h3>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                  required
                />
              </div>

              {/* Real-time rules indicator */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
                <p className="font-bold text-slate-700">Password Requirements:</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      rules.hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    ✓
                  </span>
                  <span className={rules.hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                    At least 4 characters long
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      rules.hasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    ✓
                  </span>
                  <span className={rules.hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                    Must include at least one number (0-9)
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                  required
                />
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSavingPassword}
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rules.isValid || isSavingPassword}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-2"
                >
                  {isSavingPassword ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Updating in Supabase...</span>
                    </>
                  ) : (
                    <span>Save Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
