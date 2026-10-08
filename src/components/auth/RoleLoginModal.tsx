import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
  ArrowRight
} from 'lucide-react';

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRole?: UserRole;
}

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole
}) => {
  const {
    loginWithStudentCredentials,
    loginWithStaffCredentials,
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

  if (!isOpen) return null;

  // Track CapsLock state for accessibility
  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
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

  const isBusy = isSubmitting || isAuthLoading;

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
      <div className="relative w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-150 z-10 text-slate-900 dark:text-slate-100">
        {/* Card Header: College Identity & Dismiss Button */}
        <div className="pt-4 px-5 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <CollegeLogo size="sm" variant="icon" />
            <div className="min-w-0">
              <h1 id="login-dialog-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                NSS College Ottapalam
              </h1>
              <p className="text-[11px] font-semibold text-rose-900 dark:text-amber-300 uppercase tracking-wide">
                College ERP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1.5 disabled:opacity-50"
            aria-label="Close login dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Segmented Selector: [ Student ] [ Staff ] */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setStudentError(null);
                setStaffError(null);
              }}
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[40px] select-none ${
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
              className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[40px] select-none ${
                activeTab === 'staff'
                  ? 'bg-rose-950 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>Staff</span>
            </button>
          </div>

          {/* Welcome Text */}
          <div className="text-center pt-0.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {activeTab === 'student' ? 'Student Login' : 'Staff Login'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome back • Sign in to continue
            </p>
          </div>

          {/* Inline Error Alert */}
          {(activeTab === 'student' ? studentError : staffError) && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200/80 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-300 text-base text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950 focus:border-rose-950 transition-colors"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsOfficeHelpOpen(true)}
                    className="text-xs text-rose-900 hover:text-rose-950 font-semibold hover:underline"
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
                    className="w-full h-12 pl-10 pr-11 rounded-xl border border-slate-300 text-base text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950 focus:border-rose-950 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2.5 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={showStudentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isCapsLockOn && (
                  <p className="text-[11px] text-amber-700 font-medium mt-1">
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
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              {/* First-time login helper link */}
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsFirstTimeSheetOpen(true)}
                  className="text-xs text-slate-500 hover:text-rose-950 font-medium hover:underline inline-flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>First time signing in?</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: STAFF LOGIN FORM */}
          {activeTab === 'staff' && (
            <form onSubmit={handleStaffSubmit} className="space-y-3.5">
              {/* Field 1: Username / Employee ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    className="w-full h-12 pl-10 pr-3 rounded-xl border border-slate-300 text-base text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950 focus:border-rose-950 transition-colors"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsOfficeHelpOpen(true)}
                    className="text-xs text-rose-900 hover:text-rose-950 font-semibold hover:underline"
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
                    className="w-full h-12 pl-10 pr-11 rounded-xl border border-slate-300 text-base text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-950 focus:border-rose-950 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2.5 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isCapsLockOn && (
                  <p className="text-[11px] text-amber-700 font-medium mt-1">
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
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              {/* Quick office support text */}
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsOfficeHelpOpen(true)}
                  className="text-xs text-slate-500 hover:text-rose-950 font-medium hover:underline inline-flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors"
                >
                  <span>Need help signing in? Contact College Office</span>
                </button>
              </div>
            </form>
          )}

          {/* Minimal Card Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>NSS College Ottapalam</span>
            <button
              type="button"
              onClick={() => setIsOfficeHelpOpen(true)}
              className="text-slate-500 hover:text-slate-800 hover:underline"
            >
              Help • Support
            </button>
          </div>
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
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 z-10 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 id="first-time-title" className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-rose-900" />
                <span>First-Time Login</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFirstTimeSheetOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                aria-label="Close first-time login instructions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <p className="font-bold text-slate-900 mb-0.5">Username</p>
                <p className="text-slate-600">Your University Register Number (e.g. UCOTFCS001)</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <p className="font-bold text-slate-900">Initial Password</p>
                <p className="text-slate-600">
                  Date of Birth (DDMMYYYY) + last 2 digits of registered mobile number
                </p>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-0.5 font-mono">
                  <p><span className="text-slate-500 font-sans">Example:</span></p>
                  <p>DOB: 14/04/2005</p>
                  <p>Mobile ending: 90</p>
                  <p className="text-rose-900 font-bold pt-0.5">Initial password: 1404200590</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-normal">
                For security, you may be asked to change your initial password after signing in.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsFirstTimeSheetOpen(false)}
              className="w-full h-11 bg-rose-950 hover:bg-rose-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Got it</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL / SHEET: COLLEGE OFFICE & FORGOT PASSWORD SUPPORT */}
      {isOfficeHelpOpen && (
        <div
          className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-labelledby="office-help-title"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsOfficeHelpOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 z-10 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 id="office-help-title" className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-rose-900" />
                <span>College Office Support</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOfficeHelpOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                aria-label="Close help modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <p className="text-slate-600 leading-relaxed">
                For account verification, password resets, or enrollment credential assistance, please contact the College Administrative Office or your Department Tutor:
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800">
                  <Building className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-semibold">Administrative Office, NSS College Ottapalam</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <a href="mailto:office@nssce.ac.in" className="text-rose-900 hover:underline">
                    office@nssce.ac.in
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>+91 466 224 4206 (Mon – Fri, 9:30 AM – 4:30 PM)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Palakkad – Ponnani Road, Palappuram P.O., Ottapalam, Kerala 679103.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOfficeHelpOpen(false)}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
