import React, { useState, useEffect } from 'react';
import { useAuth, GoogleAuthProfile } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { UserRole, Student, Faculty } from '../../types';
import { CollegeLogo } from '../common/CollegeLogo';
import {
  GraduationCap,
  Briefcase,
  X,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Loader2,
  Phone,
  Mail,
  Building,
  Check,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRole?: UserRole;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole
}) => {
  const {
    loginWithStudentCredentials,
    loginWithStaffCredentials,
    signInWithGoogle,
    linkGoogleAccountToStudent,
    linkGoogleAccountToStaff,
    isLoading: isAuthLoading
  } = useAuth();
  const { students, faculty, departments } = useCollegeData();

  // Primary Segmented Tab: 'student' | 'staff'
  const [activeTab, setActiveTab] = useState<'student' | 'staff'>(
    initialRole && initialRole !== 'STUDENT' ? 'staff' : 'student'
  );

  // Student credentials
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Staff credentials
  const [staffId, setStaffId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Google Sign-In & Onboarding Link states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [unlinkedGoogleUser, setUnlinkedGoogleUser] = useState<GoogleAuthProfile | null>(null);

  // Onboarding linking inputs
  const [linkUserType, setLinkUserType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [linkIdentifier, setLinkIdentifier] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccessMessage, setLinkSuccessMessage] = useState<string | null>(null);

  // Loading & Helper Dialog states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstTimeSheetOpen, setIsFirstTimeSheetOpen] = useState(false);
  const [isOfficeHelpOpen, setIsOfficeHelpOpen] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFirstTimeSheetOpen) {
          setIsFirstTimeSheetOpen(false);
        } else if (isOfficeHelpOpen) {
          setIsOfficeHelpOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFirstTimeSheetOpen, isOfficeHelpOpen, onClose]);

  // Reset errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStudentError(null);
      setStaffError(null);
      setGoogleError(null);
      setLinkError(null);
      setLinkSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Track CapsLock state for accessibility
  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  // Google 1-Tap Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    setStudentError(null);
    setStaffError(null);
    setLinkError(null);

    try {
      const res = await signInWithGoogle(students, faculty);
      if (res.success) {
        setIsGoogleLoading(false);
        if (onSuccess) onSuccess();
        onClose();
        return;
      }

      if (res.needsOnboardingLink && res.googleUser) {
        setIsGoogleLoading(false);
        setUnlinkedGoogleUser(res.googleUser);
        setLinkUserType(activeTab === 'student' ? 'STUDENT' : 'STAFF');
        setLinkIdentifier('');
        setLinkPassword('');
        return;
      }

      if (res.error) {
        setGoogleError(res.error);
      }
      setIsGoogleLoading(false);
    } catch (err: any) {
      setGoogleError(err.message || 'Google sign-in encountered an issue. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  // Onboarding Link Submission Handler
  const handleOnboardingLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlinkedGoogleUser) return;

    const cleanId = linkIdentifier.trim();
    if (!cleanId) {
      setLinkError(
        linkUserType === 'STUDENT'
          ? 'Enter your University Register Number.'
          : 'Enter your Official Username or Employee ID.'
      );
      return;
    }
    if (!linkPassword) {
      setLinkError('Enter your portal password.');
      return;
    }

    setIsSubmitting(true);
    setLinkError(null);

    try {
      if (linkUserType === 'STUDENT') {
        const res = await linkGoogleAccountToStudent(
          unlinkedGoogleUser.email,
          cleanId,
          linkPassword,
          students,
          unlinkedGoogleUser
        );
        if (!res.success) {
          setLinkError(res.error || 'Failed to verify student credentials.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await linkGoogleAccountToStaff(
          unlinkedGoogleUser.email,
          cleanId,
          linkPassword,
          faculty,
          unlinkedGoogleUser
        );
        if (!res.success) {
          setLinkError(res.error || 'Failed to verify staff credentials.');
          setIsSubmitting(false);
          return;
        }
      }

      setLinkSuccessMessage('Google account connected! Entering your portal...');
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setLinkError(err?.message || 'Linking failed. Please check credentials.');
      setIsSubmitting(false);
    }
  };

  // Student Login Handler
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentId.trim();
    if (!cleanId) {
      setStudentError('Enter your University Register Number.');
      return;
    }
    if (!studentPassword) {
      setStudentError('Enter your password.');
      return;
    }

    setIsSubmitting(true);
    setStudentError(null);

    try {
      const result = loginWithStudentCredentials(cleanId, studentPassword, students);
      if (!result.success) {
        setStudentError(result.error || 'Incorrect register number or password.');
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setStudentError(err.message || 'Login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Staff Login Handler
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = staffId.trim();
    if (!cleanId) {
      setStaffError('Enter your Username or Employee ID.');
      return;
    }
    if (!staffPassword) {
      setStaffError('Enter your password.');
      return;
    }

    setIsSubmitting(true);
    setStaffError(null);

    try {
      const result = loginWithStaffCredentials(cleanId, staffPassword, faculty);
      if (!result.success) {
        setStaffError(result.error || 'Incorrect username or password.');
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setStaffError(err.message || 'Login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isAuthLoading || isGoogleLoading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs min-h-[100dvh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-dialog-title"
    >
      {/* Background Click to Dismiss */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isBusy) onClose();
        }}
        aria-hidden="true"
      />

      {/* Main Login Card */}
      <div className="relative w-full max-w-[410px] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-150 z-10 text-slate-900 dark:text-slate-100">
        {/* Card Header: College Identity & Dismiss Button */}
        <div className="pt-4 px-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <CollegeLogo size="sm" variant="icon" />
            <div className="min-w-0">
              <h1 id="login-dialog-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                NSS College Ottapalam
              </h1>
              <p className="text-[11px] font-semibold text-rose-900 dark:text-amber-300 uppercase tracking-wide">
                College ERP & Academic Portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1.5 disabled:opacity-50 cursor-pointer"
            aria-label="Close login dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* ================================================================= */}
          {/* CASE A: UNLINKED GOOGLE ACCOUNT ONBOARDING LINK SCREEN */}
          {/* ================================================================= */}
          {unlinkedGoogleUser ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Google Verified Account Card */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl border border-blue-200/70 dark:border-blue-900/60 flex items-center gap-3">
                {unlinkedGoogleUser.photoURL ? (
                  <img
                    src={unlinkedGoogleUser.photoURL}
                    alt={unlinkedGoogleUser.displayName}
                    className="w-10 h-10 rounded-full border border-blue-300 object-cover shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-sm">
                    {unlinkedGoogleUser.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {unlinkedGoogleUser.displayName}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      <Check className="w-2.5 h-2.5" />
                      Google Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-mono">
                    {unlinkedGoogleUser.email}
                  </p>
                </div>
              </div>

              {/* Onboarding Directive */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Connect to Your College Record</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  This Google email is not yet linked to an NSS College profile. Enter your institutional credentials once to permanently enable 1-tap Google sign-in.
                </p>
              </div>

              {/* User Type Toggle */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setLinkUserType('STUDENT');
                    setLinkError(null);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer ${
                    linkUserType === 'STUDENT'
                      ? 'bg-rose-950 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>I am a Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLinkUserType('STAFF');
                    setLinkError(null);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer ${
                    linkUserType === 'STAFF'
                      ? 'bg-rose-950 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>I am Faculty / Staff</span>
                </button>
              </div>

              {/* Linking Error / Success Alert */}
              {linkError && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{linkError}</span>
                </div>
              )}
              {linkSuccessMessage && (
                <div
                  role="alert"
                  className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-medium">{linkSuccessMessage}</span>
                </div>
              )}

              {/* Onboarding Linking Form */}
              <form onSubmit={handleOnboardingLinkSubmit} className="space-y-3">
                {linkUserType === 'STUDENT' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      University Register Number
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={linkIdentifier}
                        onChange={e => {
                          setLinkIdentifier(e.target.value);
                          if (linkError) setLinkError(null);
                        }}
                        placeholder="e.g. UCOTFCS001 or Admission No"
                        autoCapitalize="characters"
                        disabled={isBusy}
                        className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Staff Username / Employee Code
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={linkIdentifier}
                        onChange={e => {
                          setLinkIdentifier(e.target.value);
                          if (linkError) setLinkError(null);
                        }}
                        placeholder="e.g. EMP001 or staff username"
                        disabled={isBusy}
                        className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    {linkUserType === 'STUDENT' && (
                      <button
                        type="button"
                        onClick={() => setIsFirstTimeSheetOpen(true)}
                        className="text-[11px] text-rose-900 dark:text-amber-300 font-semibold hover:underline"
                      >
                        DOB + Phone format?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showLinkPassword ? 'text' : 'password'}
                      required
                      value={linkPassword}
                      onChange={e => {
                        setLinkPassword(e.target.value);
                        if (linkError) setLinkError(null);
                      }}
                      placeholder={
                        linkUserType === 'STUDENT'
                          ? 'DOB (DDMMYYYY) + last 2 digits of phone'
                          : 'Enter staff password'
                      }
                      disabled={isBusy}
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLinkPassword(!showLinkPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 rounded-lg"
                      aria-label={showLinkPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLinkPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full h-11 bg-rose-950 hover:bg-rose-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Linking Account...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Link Google Account & Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Alternative Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isBusy}
                  className="text-rose-900 dark:text-amber-300 hover:underline font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose different account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUnlinkedGoogleUser(null)}
                  className="hover:underline text-slate-600 dark:text-slate-400"
                >
                  Back to standard sign-in
                </button>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* CASE B: PRIMARY STANDARD & GOOGLE SIGN-IN VIEW */
            /* ================================================================= */
            <>
              {/* 1. PRIMARY PROMINENT GOOGLE SIGN-IN BUTTON */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isBusy}
                  className="w-full relative flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-sm shadow-xs transition-all hover:shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer group"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-rose-900 dark:text-amber-300" />
                  ) : (
                    <GoogleIcon className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
                  )}
                  <span>Continue with Google</span>
                </button>
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-1.5">
                  Selects any Google account on your device • Instant 1-tap entry
                </p>
              </div>

              {/* Google Error Alert */}
              {googleError && (
                <div
                  role="alert"
                  className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded-xl text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span className="font-medium">{googleError}</span>
                </div>
              )}

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
                  or sign in with credentials
                </span>
              </div>

              {/* Segmented Selector: [ Student ] [ Staff ] */}
              <div className="grid grid-cols-2 p-1 bg-slate-100/90 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('student');
                    setStudentError(null);
                    setStaffError(null);
                  }}
                  className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[40px] select-none cursor-pointer ${
                    activeTab === 'student'
                      ? 'bg-rose-950 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('staff');
                    setStudentError(null);
                    setStaffError(null);
                  }}
                  className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[40px] select-none cursor-pointer ${
                    activeTab === 'staff'
                      ? 'bg-rose-950 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <span>Staff</span>
                </button>
              </div>

              {/* Inline Error Alert */}
              {(activeTab === 'student' ? studentError : staffError) && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{activeTab === 'student' ? studentError : staffError}</span>
                </div>
              )}

              {/* TAB 1: STUDENT LOGIN FORM */}
              {activeTab === 'student' && (
                <form onSubmit={handleStudentSubmit} className="space-y-3.5">
                  {/* Field 1: University Register Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      University Register Number
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={studentId}
                        onChange={e => {
                          setStudentId(e.target.value);
                          if (studentError) setStudentError(null);
                        }}
                        placeholder="Enter register number"
                        autoCapitalize="characters"
                        autoComplete="username"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={isBusy}
                        className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Field 2: Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsOfficeHelpOpen(true)}
                        className="text-xs text-rose-900 dark:text-amber-300 hover:text-rose-950 font-semibold hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showStudentPassword ? 'text' : 'password'}
                        required
                        value={studentPassword}
                        onChange={e => {
                          setStudentPassword(e.target.value);
                          if (studentError) setStudentError(null);
                        }}
                        onKeyDown={checkCapsLock}
                        onKeyUp={checkCapsLock}
                        placeholder="Enter password"
                        autoComplete="current-password"
                        disabled={isBusy}
                        className="w-full h-12 pl-10 pr-11 rounded-xl border border-slate-300 dark:border-slate-700 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2.5 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                        aria-label={showStudentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {isCapsLockOn && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-1">
                        Caps Lock is on
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full h-12 bg-rose-950 hover:bg-rose-900 text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-rose-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-1 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In with Register No</span>
                    )}
                  </button>

                  {/* First-time login helper link */}
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsFirstTimeSheetOpen(true)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-950 dark:hover:text-amber-300 font-medium hover:underline inline-flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>First time signing in? (Initial password rules)</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: STAFF LOGIN FORM */}
              {activeTab === 'staff' && (
                <form onSubmit={handleStaffSubmit} className="space-y-3.5">
                  {/* Field 1: Username / Employee ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Username / Employee ID
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={staffId}
                        onChange={e => {
                          setStaffId(e.target.value);
                          if (staffError) setStaffError(null);
                        }}
                        placeholder="Enter email, username or employee ID"
                        autoCapitalize="none"
                        autoComplete="username"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={isBusy}
                        className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Field 2: Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsOfficeHelpOpen(true)}
                        className="text-xs text-rose-900 dark:text-amber-300 hover:text-rose-950 font-semibold hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showStaffPassword ? 'text' : 'password'}
                        required
                        value={staffPassword}
                        onChange={e => {
                          setStaffPassword(e.target.value);
                          if (staffError) setStaffError(null);
                        }}
                        onKeyDown={checkCapsLock}
                        onKeyUp={checkCapsLock}
                        placeholder="Enter password"
                        autoComplete="current-password"
                        disabled={isBusy}
                        className="w-full h-12 pl-10 pr-11 rounded-xl border border-slate-300 dark:border-slate-700 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword(!showStaffPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2.5 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                        aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                      >
                        {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {isCapsLockOn && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-1">
                        Caps Lock is on
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full h-12 bg-rose-950 hover:bg-rose-900 text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-rose-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-1 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In with Staff ID</span>
                    )}
                  </button>

                  {/* Quick office support text */}
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsOfficeHelpOpen(true)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-950 dark:hover:text-amber-300 font-medium hover:underline inline-flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Need help signing in? Contact College Office</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Minimal Card Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>NSS College Ottapalam ERP</span>
                <button
                  type="button"
                  onClick={() => setIsOfficeHelpOpen(true)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer"
                >
                  Help • Support
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM SHEET / MODAL: FIRST-TIME STUDENT LOGIN GUIDELINES */}
      {isFirstTimeSheetOpen && (
        <div
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-labelledby="first-time-title"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsFirstTimeSheetOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 id="first-time-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-rose-900 dark:text-amber-400" />
                <span>First-Time Student Login</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFirstTimeSheetOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close first-time login instructions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">Username</p>
                <p className="text-slate-600 dark:text-slate-300">Your University Register Number (e.g. UCOTFCS001)</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-slate-100">Initial Password Format</p>
                <p className="text-slate-600 dark:text-slate-300">
                  Date of Birth (DDMMYYYY) + last 2 digits of registered mobile number
                </p>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 space-y-0.5 font-mono">
                  <p><span className="text-slate-500 font-sans">Example:</span></p>
                  <p>DOB: 14/04/2005</p>
                  <p>Mobile ending: 90</p>
                  <p className="text-rose-900 dark:text-amber-400 font-bold pt-0.5">Initial password: 1404200590</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tip: Google 1-Tap Login</span>
                </p>
                <p>
                  You can also click "Continue with Google" directly! If your Gmail matches your college record, you sign in immediately with zero passwords required.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFirstTimeSheetOpen(false)}
                className="w-full py-2.5 bg-rose-950 text-white rounded-xl font-bold text-xs hover:bg-rose-900 transition-colors cursor-pointer"
              >
                Understood, Return to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICE HELP DIALOG */}
      {isOfficeHelpOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-labelledby="office-help-title"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsOfficeHelpOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 id="office-help-title" className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-rose-900 dark:text-amber-400" />
                <span>College Office Support</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOfficeHelpOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>For credential reset or institutional profile lookup, contact:</p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200/80 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-slate-100">Administrative Office</p>
                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> 0466 2244206</p>
                <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> principal@nssce.ac.in</p>
                <p className="text-[11px] text-slate-500 pt-1">Timing: Mon – Fri (9:30 AM – 4:30 PM)</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOfficeHelpOpen(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
