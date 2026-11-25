import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Clock, X } from 'lucide-react';
import { UserRole, Faculty, Student } from '../types';
import { supabase, isSupabaseConfigured, setInMemoryErpSessionToken } from '../lib/supabase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth as firebaseAuth } from '../lib/firebase';
import { securityShieldService, getDeviceFingerprint } from '../services/securityShieldService';
import { SessionTimeoutModal } from '../components/auth/SessionTimeoutModal';

export const SESSION_INACTIVITY_WARNING_MS = 25 * 60 * 1000; // 25 minutes
export const SESSION_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'pointerdown',
  'click'
] as const;

/**
 * Production Zero-Trust Auth Flag.
 * Demo login and client-side role elevation are permanently disabled.
 */
export const DEV_AUTH_MODE = false;

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  name: string;
  avatarUrl?: string;
  roles: UserRole[];
  activeRole: UserRole;
  facultyProfile?: Faculty;
  studentProfile?: Student;
  departmentId?: string;
  isDemoRole?: boolean;
  googleEmail?: string;
  isGoogleLinked?: boolean;
  mustChangePassword?: boolean;
}

export interface GoogleAuthProfile {
  email: string;
  displayName: string;
  photoURL: string;
  uid: string;
}

export interface BootstrapStatus {
  adminClaimed: boolean;
  securityLevel: string;
}

interface AuthContextType {
  user: AuthUser | null;
  activeRole: UserRole;
  availableRoles: UserRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isDevAuthMode: boolean;
  googleAuthUser: GoogleAuthProfile | null;
  getBootstrapStatus: () => Promise<BootstrapStatus>;
  claimInitialAdmin: (params: {
    username: string;
    email: string;
    fullName: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithStudentCredentials: (
    identifier: string,
    pass: string,
    studentsList?: Student[]
  ) => Promise<{ success: boolean; error?: string; student?: Student }>;
  loginWithStaffCredentials: (
    identifier: string,
    pass: string,
    facultyList?: Faculty[]
  ) => Promise<{ success: boolean; error?: string; faculty?: Faculty }>;
  signInWithGoogle: (
    studentsList?: Student[],
    facultyList?: Faculty[]
  ) => Promise<{
    success: boolean;
    needsOnboardingLink?: boolean;
    googleUser?: GoogleAuthProfile;
    matchedRole?: UserRole;
    error?: string;
  }>;
  linkGoogleAccountToStudent: (
    googleEmail: string,
    registerNumberOrUsername: string,
    password: string,
    studentsList?: Student[],
    googleProfile?: { displayName?: string; photoURL?: string; uid?: string }
  ) => Promise<{ success: boolean; error?: string; student?: Student }>;
  linkGoogleAccountToStaff: (
    googleEmail: string,
    identifier: string,
    password: string,
    facultyList?: Faculty[],
    googleProfile?: { displayName?: string; photoURL?: string; uid?: string }
  ) => Promise<{ success: boolean; error?: string; faculty?: Faculty }>;
  unlinkGoogleAccount: (email: string) => Promise<{ success: boolean; error?: string }>;
  changeOwnCredentials: (
    currentPassword: string,
    newUsername?: string,
    newPassword?: string
  ) => Promise<{ success: boolean; error?: string }>;
  adminResetUserPassword: (
    userType: 'STUDENT' | 'FACULTY' | 'ADMIN',
    profileId: string,
    newPassword: string,
    forceChange?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  updateCurrentUser: (updatedFields: Partial<AuthUser>) => void;
  updateFacultyProfile: (faculty: Partial<Faculty>) => void;
  linkFacultyProfile: (faculty: Faculty) => void;
  linkStudentProfile: (student: Student) => void;
  unlinkProfile: () => void;
  loginWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isLiveSupabase: boolean;
  sessionTimeoutWarning: boolean;
  sessionTimeoutRemainingSeconds: number;
  sessionTimedOut: boolean;
  extendSession: () => void;
  dismissSessionTimedOutNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LEGACY_AUTH_STORAGE_KEYS = [
  'nss_auth_user',
  'college_dev_logged_in',
  'college_dev_role',
  'nss_erp_faculty_credentials',
  'nss_active_student_id',
  'nss_google_account_links'
];

function hydrateAuthUserFromRpc(payload: any, photoUrl?: string): AuthUser {
  const u = payload?.user || {};
  const rolesRaw: string[] = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.activeRole || 'TEACHER'];
  const roles = rolesRaw as UserRole[];
  const activeRole = (u.activeRole || roles[0] || 'TEACHER') as UserRole;

  let facultyProfile: Faculty | undefined;
  if (u.facultyProfile) {
    const fp = u.facultyProfile;
    facultyProfile = {
      id: fp.id || u.id,
      fullName: fp.fullName || u.name,
      email: fp.email || u.email,
      username: u.username || fp.email || '',
      password: '',
      phoneNumber: fp.phone || '',
      mobileNumber: fp.phone || '',
      departmentId: fp.departmentId || u.departmentId || '',
      designation: fp.designation || 'Faculty',
      employeeId: fp.employeeId || '',
      employeeCode: fp.employeeId || '',
      roles: (fp.roles || roles) as UserRole[],
      status: fp.status || 'ACTIVE',
      isActive: true
    } as Faculty;
  }

  let studentProfile: Student | undefined;
  if (u.studentProfile) {
    const sp = u.studentProfile;
    studentProfile = {
      id: sp.id || u.id,
      fullName: sp.fullName || u.name,
      rollNumber: sp.rollNumber || '',
      admissionNumber: sp.admissionNumber || '',
      universityRegisterNumber: sp.universityRegisterNumber || '',
      username: u.username || sp.universityRegisterNumber || sp.admissionNumber || '',
      password: '',
      email: sp.email || u.email || '',
      mobileNumber: sp.mobileNumber || '',
      programmeId: sp.programmeId || '',
      homeDepartmentId: sp.homeDepartmentId || u.departmentId || '',
      currentSemester: sp.currentSemester || 'S1',
      yearOfStudy: sp.yearOfStudy || 1,
      admissionBatch: sp.admissionBatch || '',
      status: sp.status || 'ACTIVE',
      studentStatus: sp.status || 'ACTIVE'
    } as Student;
  }

  return {
    id: String(u.id || ''),
    email: String(u.email || ''),
    username: u.username ? String(u.username) : undefined,
    name: String(u.name || u.email || 'Campus User'),
    avatarUrl: photoUrl || undefined,
    roles,
    activeRole,
    departmentId: u.departmentId ? String(u.departmentId) : undefined,
    facultyProfile,
    studentProfile,
    isDemoRole: false,
    googleEmail: u.email || undefined,
    isGoogleLinked: Boolean(photoUrl),
    mustChangePassword: Boolean(payload?.must_change_password)
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Strictly in-memory authenticated user (never hydrated from mutable localStorage)
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleAuthUser, setGoogleAuthUser] = useState<GoogleAuthProfile | null>(null);

  // Automatic inactivity timeout state (25-min warning, 30-min forced logout)
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);
  const [sessionTimeoutRemainingSeconds, setSessionTimeoutRemainingSeconds] = useState(
    Math.ceil((SESSION_INACTIVITY_TIMEOUT_MS - SESSION_INACTIVITY_WARNING_MS) / 1000)
  );
  const [sessionTimedOut, setSessionTimedOut] = useState(false);

  const lastActivityAtRef = useRef<number>(Date.now());
  const lastRecordedActivityAtRef = useRef<number>(0);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isWarningOpenRef = useRef<boolean>(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const logoutRef = useRef<() => Promise<void>>(async () => {});

  // Purge any legacy insecure auth/credential keys on boot and sync server security state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        LEGACY_AUTH_STORAGE_KEYS.forEach(k => window.localStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
    securityShieldService.syncFromServer(getDeviceFingerprint());
  }, []);

  // Re-sync security shield when user identity or role changes
  useEffect(() => {
    securityShieldService.syncFromServer(getDeviceFingerprint());
  }, [user?.id, user?.activeRole]);

  // Listen for session invalidation events (e.g., server session expired or explicitly updated)
  useEffect(() => {
    const handleAuthUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AuthUser | null>;
      if (customEvent.detail !== undefined) {
        setUser(customEvent.detail);
      }
    };
    window.addEventListener('nss-auth-update', handleAuthUpdate);
    return () => window.removeEventListener('nss-auth-update', handleAuthUpdate);
  }, []);

  // Restore cryptographically verified Supabase GoTrue session on mount ONLY (never hardcodes roles)
  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (active) setIsLoading(false);
        return;
      }
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          const { data } = await supabase.rpc('complete_supabase_jwt_login', {
            p_device_fingerprint: getDeviceFingerprint()
          });
          if (active && data?.success && data.session_token) {
            setInMemoryErpSessionToken(data.session_token);
            setUser(hydrateAuthUserFromRpc(data, session.user?.user_metadata?.avatar_url));
          }
        }
      } catch {
        // Leave user unauthenticated until explicit verified login
      } finally {
        if (active) setIsLoading(false);
      }
    };
    init();

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        active = false;
      };
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        return;
      }
      if (event === 'SIGNED_IN' && session?.access_token) {
        try {
          const { data } = await supabase.rpc('complete_supabase_jwt_login', {
            p_device_fingerprint: getDeviceFingerprint()
          });
          if (active && data?.success && data.session_token) {
            setInMemoryErpSessionToken(data.session_token);
            setUser(hydrateAuthUserFromRpc(data, session.user?.user_metadata?.avatar_url));
          }
        } catch {
          // ignore if waiting for explicit onboarding link
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const getBootstrapStatus = async (): Promise<BootstrapStatus> => {
    if (!isSupabaseConfigured || !supabase) {
      return { adminClaimed: true, securityLevel: 'HIGH_SHIELD' };
    }
    try {
      const { data, error } = await supabase.rpc('get_bootstrap_status');
      if (error || !data) {
        return { adminClaimed: true, securityLevel: 'HIGH_SHIELD' };
      }
      return {
        adminClaimed: Boolean(data.admin_claimed),
        securityLevel: String(data.security_level || 'HIGH_SHIELD')
      };
    } catch {
      return { adminClaimed: true, securityLevel: 'HIGH_SHIELD' };
    }
  };

  const claimInitialAdmin = async (params: {
    username: string;
    email: string;
    fullName: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Database connection is unavailable.' };
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_initial_admin', {
        p_username: params.username.trim(),
        p_email: params.email.trim().toLowerCase(),
        p_full_name: params.fullName.trim(),
        p_password: params.password,
        p_device_fingerprint: getDeviceFingerprint()
      });
      if (error || !data?.success || !data.session_token) {
        return {
          success: false,
          error: data?.error || error?.message || 'Unable to claim initial Super Administrator access.'
        };
      }
      setInMemoryErpSessionToken(data.session_token);
      setUser(hydrateAuthUserFromRpc(data));
      await securityShieldService.syncFromServer(getDeviceFingerprint());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Bootstrap request failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (newRole: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Authentication required.' };
    const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
    if (!isSuperAdmin && !user.roles.includes(newRole)) {
      await securityShieldService.reportIncident({
        severity: 'CRITICAL',
        vector: 'UNAUTHORIZED_ROLE_SWITCH_ATTEMPT',
        description: `User ${user.email || user.id} attempted unauthorized role elevation to ${newRole}.`,
        targetResource: 'switch_erp_role',
        actionTaken: 'BLOCKED_BY_RBAC'
      });
      return { success: false, error: 'Access Denied: Requested role is not assigned to your account.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Database session verification unavailable.' };
    }

    const { data, error } = await supabase.rpc('switch_erp_role', { p_new_role: newRole });
    if (error || !data?.success) {
      return { success: false, error: data?.error || error?.message || 'Role switch rejected by server.' };
    }

    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        activeRole: newRole
      };
    });
    return { success: true };
  };

  const loginWithStudentCredentials = async (
    identifier: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; student?: Student }> => {
    const cleanId = (identifier || '').trim();
    const cleanPass = pass || '';

    if (!cleanId) {
      return { success: false, error: 'Please enter your University Register Number or Username.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'Please enter your password.' };
    }
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Database connection unavailable.' };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_institutional_login', {
        p_role_mode: 'STUDENT',
        p_identifier: cleanId,
        p_password: cleanPass,
        p_device_fingerprint: getDeviceFingerprint()
      });

      if (error || !data?.success || !data.session_token) {
        await securityShieldService.syncFromServer(getDeviceFingerprint());
        return {
          success: false,
          error: data?.error || error?.message || 'Invalid credentials. Please check your register number and password.'
        };
      }

      setInMemoryErpSessionToken(data.session_token);
      const authed = hydrateAuthUserFromRpc(data);
      setUser(authed);
      await securityShieldService.syncFromServer(getDeviceFingerprint());
      return { success: true, student: authed.studentProfile };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithStaffCredentials = async (
    identifier: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; faculty?: Faculty }> => {
    const cleanId = (identifier || '').trim();
    const cleanPass = (pass || '').trim();

    if (!cleanId) {
      return { success: false, error: 'Please enter your Official Email, Staff Username, or Employee Code.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'Please enter your portal password.' };
    }
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Database connection unavailable.' };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_institutional_login', {
        p_role_mode: 'STAFF',
        p_identifier: cleanId,
        p_password: cleanPass,
        p_device_fingerprint: getDeviceFingerprint()
      });

      if (error || !data?.success || !data.session_token) {
        await securityShieldService.syncFromServer(getDeviceFingerprint());
        return {
          success: false,
          error: data?.error || error?.message || 'Invalid credentials. Please verify your username and password.'
        };
      }

      setInMemoryErpSessionToken(data.session_token);
      const authed = hydrateAuthUserFromRpc(data);
      setUser(authed);
      await securityShieldService.syncFromServer(getDeviceFingerprint());
      return { success: true, faculty: authed.facultyProfile };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cryptographically Verified Google Sign-In
   * 1. Prompts Google OAuth popup via Firebase Auth (`emailVerified` required).
   * 2. Exchanges the Firebase OIDC ID token with Supabase GoTrue (`signInWithIdToken`) and calls `complete_supabase_jwt_login`.
   * 3. Never trusts plain email matching client-side without verified JWT verification or institutional password proof.
   */
  const signInWithGoogle = async (): Promise<{
    success: boolean;
    needsOnboardingLink?: boolean;
    googleUser?: GoogleAuthProfile;
    matchedRole?: UserRole;
    error?: string;
  }> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const cred = await signInWithPopup(firebaseAuth, provider);
      const gUser = cred.user;
      const cleanEmail = (gUser.email || '').trim().toLowerCase();

      if (!cleanEmail || !gUser.emailVerified) {
        setIsLoading(false);
        return { success: false, error: 'A verified Google account email is required.' };
      }

      const parsedGoogleUser: GoogleAuthProfile = {
        email: cleanEmail,
        displayName: gUser.displayName || cleanEmail.split('@')[0],
        photoURL: gUser.photoURL || '',
        uid: gUser.uid
      };
      setGoogleAuthUser(parsedGoogleUser);

      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return { success: false, error: 'Database authentication service unavailable.' };
      }

      const credentialResult = GoogleAuthProvider.credentialFromResult(cred);
      const oauthIdToken = credentialResult?.idToken;
      const firebaseIdToken = await gUser.getIdToken();
      const tokenToExchange = oauthIdToken || firebaseIdToken;

      if (tokenToExchange) {
        const { error: jwtErr } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: tokenToExchange
        });

        if (!jwtErr) {
          const { data: jwtLogin } = await supabase.rpc('complete_supabase_jwt_login', {
            p_device_fingerprint: getDeviceFingerprint()
          });

          if (jwtLogin?.success && jwtLogin.session_token) {
            setInMemoryErpSessionToken(jwtLogin.session_token);
            const authed = hydrateAuthUserFromRpc(jwtLogin, parsedGoogleUser.photoURL);
            setUser(authed);
            await securityShieldService.syncFromServer(getDeviceFingerprint());
            setIsLoading(false);
            return { success: true, matchedRole: authed.activeRole };
          }
        }
      }

      // Google identity is verified, require institutional credential verification to mint an ERP session or link record
      setIsLoading(false);
      return {
        success: false,
        needsOnboardingLink: true,
        googleUser: parsedGoogleUser
      };
    } catch (err: any) {
      setIsLoading(false);
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in window was closed. Please try again.' };
      }
      if (err?.code === 'auth/popup-blocked') {
        return { success: false, error: 'Google Sign-In popup was blocked by your browser. Please allow popups for this site.' };
      }
      if (err?.code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Another sign-in request was already in progress.' };
      }
      return { success: false, error: err?.message || 'Google Sign-In failed. Please try again.' };
    }
  };

  const linkGoogleAccountToStudent = async (
    googleEmail: string,
    registerNumberOrUsername: string,
    password: string,
    _studentsList?: Student[],
    googleProfile?: { displayName?: string; photoURL?: string; uid?: string }
  ): Promise<{ success: boolean; error?: string; student?: Student }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Database connection unavailable.' };
    }
    setIsLoading(true);
    try {
      const cleanEmail = (googleEmail || '').trim().toLowerCase();
      const { data, error } = await supabase.rpc('verify_and_link_google_account', {
        p_google_email: cleanEmail,
        p_google_uid: googleProfile?.uid || firebaseAuth.currentUser?.uid || '',
        p_role_mode: 'STUDENT',
        p_identifier: registerNumberOrUsername.trim(),
        p_password: password,
        p_device_fingerprint: getDeviceFingerprint()
      });

      if (error || !data?.success || !data.session_token) {
        return { success: false, error: data?.error || error?.message || 'Invalid student credentials.' };
      }

      setInMemoryErpSessionToken(data.session_token);
      const authed = hydrateAuthUserFromRpc(data, googleProfile?.photoURL);
      setUser(authed);
      await securityShieldService.syncFromServer(getDeviceFingerprint());
      return { success: true, student: authed.studentProfile };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google linking failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const linkGoogleAccountToStaff = async (
    googleEmail: string,
    identifier: string,
    password: string,
    _facultyList?: Faculty[],
    googleProfile?: { displayName?: string; photoURL?: string; uid?: string }
  ): Promise<{ success: boolean; error?: string; faculty?: Faculty }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Database connection unavailable.' };
    }
    setIsLoading(true);
    try {
      const cleanEmail = (googleEmail || '').trim().toLowerCase();
      const { data, error } = await supabase.rpc('verify_and_link_google_account', {
        p_google_email: cleanEmail,
        p_google_uid: googleProfile?.uid || firebaseAuth.currentUser?.uid || '',
        p_role_mode: 'STAFF',
        p_identifier: identifier.trim(),
        p_password: password,
        p_device_fingerprint: getDeviceFingerprint()
      });

      if (error || !data?.success || !data.session_token) {
        return { success: false, error: data?.error || error?.message || 'Invalid staff credentials.' };
      }

      setInMemoryErpSessionToken(data.session_token);
      const authed = hydrateAuthUserFromRpc(data, googleProfile?.photoURL);
      setUser(authed);
      await securityShieldService.syncFromServer(getDeviceFingerprint());
      return { success: true, faculty: authed.facultyProfile };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google linking failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const changeOwnCredentials = async (
    currentPassword: string,
    newUsername?: string,
    newPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase || !user) {
      return { success: false, error: 'Active authenticated session required.' };
    }
    const { data, error } = await supabase.rpc('change_own_credentials', {
      p_current_password: currentPassword,
      p_new_username: newUsername ? newUsername.trim() : null,
      p_new_password: newPassword ? newPassword.trim() : null
    });
    if (error || !data?.success) {
      return { success: false, error: data?.error || error?.message || 'Failed to update credentials.' };
    }
    if (newUsername) {
      const cleanU = newUsername.trim();
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          username: cleanU,
          mustChangePassword: false,
          facultyProfile: prev.facultyProfile ? { ...prev.facultyProfile, username: cleanU } : undefined,
          studentProfile: prev.studentProfile ? { ...prev.studentProfile, username: cleanU.toUpperCase() } : undefined
        };
      });
    }
    return { success: true };
  };

  const adminResetUserPassword = async (
    userType: 'STUDENT' | 'FACULTY' | 'ADMIN',
    profileId: string,
    newPassword: string,
    forceChange = true
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase || !user) {
      return { success: false, error: 'Administrator session required.' };
    }
    const { data, error } = await supabase.rpc('admin_reset_user_password', {
      p_user_type: userType,
      p_profile_id: profileId,
      p_new_password: newPassword,
      p_force_change: forceChange
    });
    if (error || !data?.success) {
      return { success: false, error: data?.error || error?.message || 'Failed to reset user password.' };
    }
    return { success: true };
  };

  const unlinkGoogleAccount = async (_email: string): Promise<{ success: boolean; error?: string }> => {
    if (user) {
      setUser(prev => (prev ? { ...prev, googleEmail: undefined, isGoogleLinked: false } : null));
    }
    return { success: true };
  };

  const updateCurrentUser = (updatedFields: Partial<AuthUser>) => {
    setUser(prev => (prev ? { ...prev, ...updatedFields } : null));
  };

  const updateFacultyProfile = (partialFac: Partial<Faculty>) => {
    setUser(prev => {
      if (!prev) return null;
      const mergedFac: Faculty = {
        ...(prev.facultyProfile || {}),
        ...partialFac,
        id: prev.facultyProfile?.id || prev.id
      } as Faculty;
      return {
        ...prev,
        name: partialFac.fullName || prev.name,
        email: partialFac.email || prev.email,
        facultyProfile: mergedFac
      };
    });
  };

  const linkFacultyProfile = (faculty: Faculty) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        facultyProfile: faculty,
        departmentId: faculty.departmentId
      };
    });
  };

  const linkStudentProfile = (student: Student) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        studentProfile: student,
        departmentId: student.homeDepartmentId
      };
    });
  };

  const unlinkProfile = () => {
    logout();
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Database authentication unavailable.' };
    }
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass
      });
      if (error) {
        return { error: error.message };
      }
      const { data } = await supabase.rpc('complete_supabase_jwt_login', {
        p_device_fingerprint: getDeviceFingerprint()
      });
      if (!data?.success || !data.session_token) {
        return { error: data?.error || 'Account is not linked to an active institutional profile.' };
      }
      setInMemoryErpSessionToken(data.session_token);
      setUser(hydrateAuthUserFromRpc(data));
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Login failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const clearInactivityTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const performLogout = useCallback(async (timedOut = false, broadcast = true) => {
    clearInactivityTimers();
    isWarningOpenRef.current = false;
    setSessionTimeoutWarning(false);
    setSessionTimedOut(timedOut);

    if (broadcast && broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'LOGOUT', timedOut });
      } catch {
        // ignore closed channel
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.rpc('logout_erp_session');
      } catch {
        // ignore network errors during sign-out cleanup
      }
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    try {
      await firebaseSignOut(firebaseAuth);
    } catch {
      // ignore
    }

    setInMemoryErpSessionToken(null);
    setGoogleAuthUser(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      try {
        LEGACY_AUTH_STORAGE_KEYS.forEach(k => window.localStorage.removeItem(k));
      } catch {
        // ignore
      }
      window.dispatchEvent(new CustomEvent('nss-auth-logout'));
    }
  }, [clearInactivityTimers]);

  const logout = useCallback(async () => {
    await performLogout(false);
  }, [performLogout]);

  useEffect(() => {
    logoutRef.current = () => performLogout(true);
  }, [performLogout]);

  const scheduleInactivityTimers = useCallback(
    (baseTimestamp: number) => {
      clearInactivityTimers();

      const now = Date.now();
      const elapsed = Math.max(0, now - baseTimestamp);
      const remainingToLogout = SESSION_INACTIVITY_TIMEOUT_MS - elapsed;

      if (remainingToLogout <= 0) {
        void logoutRef.current();
        return;
      }

      const startCountdownTicker = () => {
        const updateRemaining = () => {
          const msLeft = SESSION_INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivityAtRef.current);
          if (msLeft <= 0) {
            setSessionTimeoutRemainingSeconds(0);
            void logoutRef.current();
            return;
          }
          setSessionTimeoutRemainingSeconds(Math.ceil(msLeft / 1000));
        };

        updateRemaining();
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        countdownIntervalRef.current = setInterval(updateRemaining, 1000);
      };

      const remainingToWarning = SESSION_INACTIVITY_WARNING_MS - elapsed;
      if (remainingToWarning <= 0) {
        isWarningOpenRef.current = true;
        setSessionTimeoutWarning(true);
        startCountdownTicker();
      } else {
        isWarningOpenRef.current = false;
        setSessionTimeoutWarning(false);
        warningTimerRef.current = setTimeout(() => {
          isWarningOpenRef.current = true;
          setSessionTimeoutWarning(true);
          startCountdownTicker();
        }, remainingToWarning);
      }

      logoutTimerRef.current = setTimeout(() => {
        void logoutRef.current();
      }, remainingToLogout);
    },
    [clearInactivityTimers]
  );

  const extendSession = useCallback(() => {
    const now = Date.now();
    lastActivityAtRef.current = now;
    lastRecordedActivityAtRef.current = now;
    isWarningOpenRef.current = false;
    setSessionTimeoutWarning(false);
    setSessionTimeoutRemainingSeconds(
      Math.ceil((SESSION_INACTIVITY_TIMEOUT_MS - SESSION_INACTIVITY_WARNING_MS) / 1000)
    );

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'ACTIVITY', at: now });
      } catch {
        // ignore
      }
    }

    scheduleInactivityTimers(now);
  }, [scheduleInactivityTimers]);

  const dismissSessionTimedOutNotice = useCallback(() => {
    setSessionTimedOut(false);
  }, []);

  const activeUserId = user?.id || null;

  // Enforce automatic 30-minute inactivity timeout with 25-minute warning modal
  useEffect(() => {
    if (!activeUserId) {
      clearInactivityTimers();
      isWarningOpenRef.current = false;
      setSessionTimeoutWarning(false);
      return;
    }

    setSessionTimedOut(false);
    const initialTime = Date.now();
    lastActivityAtRef.current = initialTime;
    lastRecordedActivityAtRef.current = initialTime;
    scheduleInactivityTimers(initialTime);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('nss_erp_session_activity');
        broadcastChannelRef.current = channel;
        channel.onmessage = (event: MessageEvent) => {
          const msg = event.data;
          if (!msg || typeof msg !== 'object') return;
          if (msg.type === 'ACTIVITY' && typeof msg.at === 'number') {
            if (msg.at > lastActivityAtRef.current) {
              lastActivityAtRef.current = msg.at;
              lastRecordedActivityAtRef.current = msg.at;
              isWarningOpenRef.current = false;
              setSessionTimeoutWarning(false);
              scheduleInactivityTimers(msg.at);
            }
          } else if (msg.type === 'LOGOUT') {
            void performLogout(Boolean(msg.timedOut), false);
          }
        };
      } catch {
        channel = null;
      }
    }

    const handleUserActivity = () => {
      // Once the 25-minute warning modal is displayed, require explicit action to extend the session
      if (isWarningOpenRef.current) return;

      const now = Date.now();
      if (now - lastRecordedActivityAtRef.current < 1000) return;

      lastActivityAtRef.current = now;
      lastRecordedActivityAtRef.current = now;

      if (channel) {
        try {
          channel.postMessage({ type: 'ACTIVITY', at: now });
        } catch {
          // ignore
        }
      }

      scheduleInactivityTimers(now);
    };

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      scheduleInactivityTimers(lastActivityAtRef.current);
    };

    if (typeof window !== 'undefined') {
      ACTIVITY_EVENTS.forEach(evt => {
        window.addEventListener(evt, handleUserActivity, { passive: true });
      });
      window.addEventListener('focus', handleVisibilityOrFocus);
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    }

    return () => {
      clearInactivityTimers();
      if (typeof window !== 'undefined') {
        ACTIVITY_EVENTS.forEach(evt => {
          window.removeEventListener(evt, handleUserActivity);
        });
        window.removeEventListener('focus', handleVisibilityOrFocus);
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
      if (channel) {
        try {
          channel.close();
        } catch {
          // ignore
        }
        if (broadcastChannelRef.current === channel) {
          broadcastChannelRef.current = null;
        }
      }
    };
  }, [activeUserId, clearInactivityTimers, performLogout, scheduleInactivityTimers]);

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole: user?.activeRole || 'TEACHER',
        availableRoles: user?.roles || [],
        isAuthenticated: Boolean(user),
        isLoading,
        isDevAuthMode: DEV_AUTH_MODE,
        googleAuthUser,
        getBootstrapStatus,
        claimInitialAdmin,
        switchRole,
        loginWithStudentCredentials,
        loginWithStaffCredentials,
        signInWithGoogle,
        linkGoogleAccountToStudent,
        linkGoogleAccountToStaff,
        unlinkGoogleAccount,
        changeOwnCredentials,
        adminResetUserPassword,
        updateCurrentUser,
        updateFacultyProfile,
        linkFacultyProfile,
        linkStudentProfile,
        unlinkProfile,
        loginWithEmail,
        logout,
        isLiveSupabase: isSupabaseConfigured,
        sessionTimeoutWarning,
        sessionTimeoutRemainingSeconds,
        sessionTimedOut,
        extendSession,
        dismissSessionTimedOutNotice
      }}
    >
      {children}

      <SessionTimeoutModal
        isOpen={Boolean(user) && sessionTimeoutWarning}
        remainingSeconds={sessionTimeoutRemainingSeconds}
        onStaySignedIn={extendSession}
        onLogoutNow={() => {
          void logout();
        }}
      />

      {!user && sessionTimedOut && (
        <div
          className="fixed bottom-4 right-4 z-90 max-w-sm bg-slate-900 text-white border border-amber-500/50 rounded-2xl shadow-2xl p-4 flex items-start gap-3"
          role="status"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Session Expired</p>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              You were automatically logged out after 30 minutes of inactivity. Please sign in again to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissSessionTimedOutNotice}
            aria-label="Dismiss session timeout notice"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
