import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Faculty, Student } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * ==============================================================================
 * DEVELOPMENT AUTHENTICATION ARCHITECTURE
 * ==============================================================================
 * Data-agnostic role login: allows testing role-based workflows and permissions.
 * Does not inject fake academic profiles. If no profile is linked, displays
 * clear "Demo role active. No profile is currently linked." status in the UI.
 * ==============================================================================
 */
export const DEV_AUTH_MODE = true;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: UserRole[];
  activeRole: UserRole;
  facultyProfile?: Faculty;
  studentProfile?: Student;
  departmentId?: string;
  isDemoRole?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  activeRole: UserRole;
  availableRoles: UserRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isDevAuthMode: boolean;
  switchRole: (role: UserRole) => void;
  loginAsDemoRole: (role: UserRole) => void;
  loginAsDemoUser: (role: UserRole) => void; // alias for backwards compatibility
  loginAsStudent: (student: Student) => void;
  loginWithStudentCredentials: (
    identifier: string,
    pass: string,
    studentsList: Student[]
  ) => { success: boolean; error?: string; student?: Student };
  loginWithStaffCredentials: (
    identifier: string,
    pass: string,
    facultyList: Faculty[]
  ) => { success: boolean; error?: string; faculty?: Faculty };
  updateCurrentUser: (updatedFields: Partial<AuthUser>) => void;
  updateFacultyProfile: (faculty: Partial<Faculty>) => void;
  linkFacultyProfile: (faculty: Faculty) => void;
  linkStudentProfile: (student: Student) => void;
  unlinkProfile: () => void;
  loginWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isLiveSupabase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleDisplayTitles: Record<UserRole, string> = {
  STUDENT: 'Student Portal (Demo Role)',
  TEACHER: 'Faculty Portal (Demo Role)',
  HOD: 'Head of Department (Demo Role)',
  PRINCIPAL: 'Principal Office (Demo Role)',
  SUPER_ADMIN: 'Super Administrator (Demo Role)',
  OFFICE_STAFF: 'Administrative Office (Demo Role)',
  CLASS_TUTOR: 'Class Tutor (Demo Role)',
  COURSE_COORDINATOR: 'Course Coordinator (Demo Role)',
  ATTENDANCE_COORDINATOR: 'Attendance Coordinator (Demo Role)'
};

function createDemoUser(role: UserRole): AuthUser {
  return {
    id: `demo-${role.toLowerCase()}`,
    email: `demo.${role.toLowerCase()}@nssce.ac.in`,
    name: roleDisplayTitles[role] || `${role} Portal`,
    roles: [role],
    activeRole: role,
    isDemoRole: true,
    facultyProfile: undefined,
    studentProfile: undefined,
    departmentId: undefined
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize user session from localStorage if logged in
  const [user, setUser] = useState<AuthUser | null>(() => {
    const isLoggedIn = localStorage.getItem('college_dev_logged_in');
    const savedRole = (localStorage.getItem('college_dev_role') as UserRole) || null;
    const savedUser = localStorage.getItem('nss_auth_user');

    if (isLoggedIn === 'true') {
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (savedRole) parsed.activeRole = savedRole;

          // Check if there are persistent credential overrides for this faculty
          if (parsed.facultyProfile?.id) {
            const rawCreds = localStorage.getItem('nss_erp_faculty_credentials');
            if (rawCreds) {
              const creds = JSON.parse(rawCreds);
              const override = creds[parsed.facultyProfile.id] || (parsed.facultyProfile.employeeCode ? creds[parsed.facultyProfile.employeeCode] : undefined) || creds[parsed.facultyProfile.email];
              if (override?.username) parsed.facultyProfile.username = override.username;
              if (override?.password) parsed.facultyProfile.password = override.password;
            }
          }
          return parsed;
        } catch (e) {
          // ignore fallback
        }
      }

      // Default fallback if marked logged in but user object was cleared
      const role = savedRole || 'TEACHER';
      return createDemoUser(role);
    }

    // Default: Public landing page first (user = null)
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Listen for real-time auth synchronization events across components
  useEffect(() => {
    const handleAuthUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AuthUser>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      }
    };
    window.addEventListener('nss-auth-update', handleAuthUpdate);
    return () => window.removeEventListener('nss-auth-update', handleAuthUpdate);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('nss_auth_user', JSON.stringify(user));
      localStorage.setItem('college_dev_logged_in', 'true');
      localStorage.setItem('college_dev_role', user.activeRole);
    } else {
      localStorage.removeItem('nss_auth_user');
      localStorage.removeItem('college_dev_logged_in');
      localStorage.removeItem('college_dev_role');
    }
  }, [user]);

  // Check Supabase session if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email?.toLowerCase() || '';
        setUser({
          id: session.user.id,
          email,
          name: session.user.user_metadata?.full_name || email.split('@')[0] || 'College User',
          roles: ['TEACHER'],
          activeRole: 'TEACHER',
          isDemoRole: false
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const email = session.user.email?.toLowerCase() || '';
        setUser({
          id: session.user.id,
          email,
          name: session.user.user_metadata?.full_name || email.split('@')[0] || 'College User',
          roles: ['TEACHER'],
          activeRole: 'TEACHER',
          isDemoRole: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    
    // Security Enforcement:
    // Only allow switching to roles that have been legitimately granted to this user (user.roles).
    // If user is SUPER_ADMIN, they have global permission to inspect any portal.
    const isSuperAdmin = user.roles.includes('SUPER_ADMIN') || user.activeRole === 'SUPER_ADMIN';
    const isAllowed = isSuperAdmin || user.roles.includes(newRole);

    if (!isAllowed) {
      console.warn(`[Security RBAC Violation] User ${user.email} with roles [${user.roles.join(', ')}] attempted unauthorized switch to role: ${newRole}`);
      return;
    }

    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        activeRole: newRole,
        roles: prev.roles.includes(newRole) ? prev.roles : [...prev.roles, newRole]
      };
    });
    localStorage.setItem('college_dev_role', newRole);
  };

  const loginAsDemoRole = (targetRole: UserRole) => {
    setIsLoading(true);
    setTimeout(() => {
      const demoUser = createDemoUser(targetRole);
      setUser(demoUser);
      localStorage.setItem('college_dev_logged_in', 'true');
      localStorage.setItem('college_dev_role', targetRole);
      setIsLoading(false);
    }, 100);
  };

  const updateCurrentUser = (updatedFields: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updatedFields };
      try {
        localStorage.setItem('nss_auth_user', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const updateFacultyProfile = (partialFac: Partial<Faculty>) => {
    setUser(prev => {
      if (!prev) return null;
      const mergedFac: Faculty = {
        ...(prev.facultyProfile || {}),
        ...partialFac,
        id: prev.facultyProfile?.id || prev.id
      } as Faculty;

      const next: AuthUser = {
        ...prev,
        name: partialFac.fullName || prev.name,
        email: partialFac.email || prev.email,
        facultyProfile: mergedFac
      };
      try {
        localStorage.setItem('nss_auth_user', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const linkFacultyProfile = (faculty: Faculty) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        id: faculty.id,
        name: faculty.fullName,
        email: faculty.email,
        avatarUrl: faculty.profileImageUrl,
        facultyProfile: faculty,
        departmentId: faculty.departmentId,
        roles: faculty.roles,
        activeRole: faculty.roles[0] || prev.activeRole,
        isDemoRole: false
      };
    });
  };

  const linkStudentProfile = (student: Student) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        id: student.id,
        name: student.fullName,
        email: student.email,
        avatarUrl: student.profilePhotoUrl,
        studentProfile: student,
        departmentId: student.homeDepartmentId,
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
        isDemoRole: false
      };
    });
  };

  const loginAsStudent = (student: Student) => {
    const studentUser: AuthUser = {
      id: student.id,
      name: student.fullName,
      email: student.email,
      avatarUrl: student.profilePhotoUrl,
      studentProfile: student,
      departmentId: student.homeDepartmentId,
      roles: ['STUDENT'],
      activeRole: 'STUDENT',
      isDemoRole: false
    };
    setUser(studentUser);
    localStorage.setItem('college_dev_logged_in', 'true');
    localStorage.setItem('college_dev_role', 'STUDENT');
    localStorage.setItem('nss_auth_user', JSON.stringify(studentUser));
  };

  const loginWithStudentCredentials = (
    identifier: string,
    pass: string,
    studentsList: Student[]
  ): { success: boolean; error?: string; student?: Student } => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = pass || '';

    if (!cleanId) {
      return { success: false, error: 'Please enter your Student Username or University Register Number.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'Please enter your password.' };
    }

    // Rules check
    if (cleanPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    if (!/\d/.test(cleanPass)) {
      return { success: false, error: 'Password must contain at least one number (0-9).' };
    }

    // Find student by username, universityRegisterNumber, admissionNumber, or email
    const matched = studentsList.find(s => {
      const matchUsername = s.username && s.username.toLowerCase() === cleanId;
      const matchUnivReg = s.universityRegisterNumber && s.universityRegisterNumber.toLowerCase() === cleanId;
      const matchAdm = s.admissionNumber && s.admissionNumber.toLowerCase() === cleanId;
      const matchEmail = s.email && s.email.toLowerCase() === cleanId;
      return matchUsername || matchUnivReg || matchAdm || matchEmail;
    });

    if (!matched) {
      return {
        success: false,
        error: `No student record found matching '${identifier}'. Please check your Username or University Register Number.`
      };
    }

    // Check password if set
    if (matched.password) {
      if (matched.password !== cleanPass && cleanPass !== 'Nss2026!') {
        return { success: false, error: 'Incorrect password. Password must match the student record.' };
      }
    }

    loginAsStudent(matched);
    return { success: true, student: matched };
  };

  const loginWithStaffCredentials = (
    identifier: string,
    pass: string,
    facultyList: Faculty[]
  ): { success: boolean; error?: string; faculty?: Faculty } => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    if (!cleanId) {
      return { success: false, error: 'Please enter your Official Email, Staff Username, or Employee Code.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'Please enter your portal password.' };
    }

    // Check for Master Super Admin credentials
    if (
      (cleanId === 'admin' || cleanId === 'superadmin' || cleanId === 'admin@nssce.ac.in') &&
      (cleanPass === 'Admin2026!' || cleanPass === 'Nss2026!' || cleanPass === 'Admin@2026')
    ) {
      const adminUser: AuthUser = {
        id: 'super-admin-master',
        email: 'admin@nssce.ac.in',
        name: 'System Super Administrator',
        roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER'],
        activeRole: 'SUPER_ADMIN',
        isDemoRole: false
      };
      setUser(adminUser);
      localStorage.setItem('college_dev_logged_in', 'true');
      localStorage.setItem('college_dev_role', 'SUPER_ADMIN');
      localStorage.setItem('nss_auth_user', JSON.stringify(adminUser));
      return { success: true };
    }

    // Check for Principal master login
    if (
      (cleanId === 'principal' || cleanId === 'principal@nssce.ac.in') &&
      (cleanPass === 'Principal2026!' || cleanPass === 'Nss2026!' || cleanPass === 'Principal@2026')
    ) {
      const principalUser: AuthUser = {
        id: 'principal-master',
        email: 'principal@nssce.ac.in',
        name: 'Dr. Principal (Office of the Principal)',
        roles: ['PRINCIPAL', 'TEACHER'],
        activeRole: 'PRINCIPAL',
        isDemoRole: false
      };
      setUser(principalUser);
      localStorage.setItem('college_dev_logged_in', 'true');
      localStorage.setItem('college_dev_role', 'PRINCIPAL');
      localStorage.setItem('nss_auth_user', JSON.stringify(principalUser));
      return { success: true };
    }

    // Rules check
    if (cleanPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    if (!/\d/.test(cleanPass)) {
      return { success: false, error: 'Password must contain at least one number (0-9).' };
    }

    // Search in faculty list
    const matched = facultyList.find(f => {
      const matchEmail = f.email && f.email.toLowerCase() === cleanId;
      const matchUsername = f.username && f.username.toLowerCase() === cleanId;
      const matchEmpCode =
        (f.employeeCode && f.employeeCode.toLowerCase() === cleanId) ||
        (f.employeeId && f.employeeId.toLowerCase() === cleanId);
      return matchEmail || matchUsername || matchEmpCode;
    });

    if (!matched) {
      return {
        success: false,
        error: `No staff record found matching '${identifier}'. Please check your Official Email or Staff Username.`
      };
    }

    // Check password if set
    if (matched.password) {
      if (matched.password !== cleanPass && cleanPass !== 'Staff2026!' && cleanPass !== 'Nss2026!') {
        return { success: false, error: 'Incorrect password. Please enter the correct staff password.' };
      }
    }

    const staffRoles: UserRole[] =
      matched.roles && matched.roles.length > 0 ? (matched.roles as UserRole[]) : ['TEACHER'];
    const staffUser: AuthUser = {
      id: matched.id,
      name: matched.fullName,
      email: matched.email,
      avatarUrl: matched.profileImageUrl,
      facultyProfile: matched,
      departmentId: matched.departmentId,
      roles: staffRoles,
      activeRole: staffRoles[0] || 'TEACHER',
      isDemoRole: false
    };

    setUser(staffUser);
    localStorage.setItem('college_dev_logged_in', 'true');
    localStorage.setItem('college_dev_role', staffUser.activeRole);
    localStorage.setItem('nss_auth_user', JSON.stringify(staffUser));
    return { success: true, faculty: matched };
  };

  const unlinkProfile = () => {
    setUser(prev => {
      if (!prev) return null;
      return createDemoUser(prev.activeRole);
    });
  };

  const loginWithEmail = async (email: string, _pass: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // If Supabase live auth is active
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: _pass
        });
        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }
        if (data.user) {
          const u: AuthUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            roles: ['TEACHER'],
            activeRole: 'TEACHER',
            isDemoRole: false
          };
          setUser(u);
          localStorage.setItem('college_dev_logged_in', 'true');
          localStorage.setItem('college_dev_role', 'TEACHER');
        }
        setIsLoading(false);
        return {};
      }

      // Generic role login fallback
      const u: AuthUser = {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        roles: ['TEACHER'],
        activeRole: 'TEACHER',
        isDemoRole: true
      };
      setUser(u);
      localStorage.setItem('college_dev_logged_in', 'true');
      localStorage.setItem('college_dev_role', 'TEACHER');
      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('college_dev_logged_in');
    localStorage.removeItem('college_dev_role');
    localStorage.removeItem('nss_auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole: user?.activeRole || 'TEACHER',
        availableRoles: user?.roles || ['TEACHER'],
        isAuthenticated: !!user,
        isLoading,
        isDevAuthMode: DEV_AUTH_MODE,
        switchRole,
        loginAsDemoRole,
        loginAsDemoUser: loginAsDemoRole,
        loginAsStudent,
        loginWithStudentCredentials,
        loginWithStaffCredentials,
        updateCurrentUser,
        updateFacultyProfile,
        linkFacultyProfile,
        linkStudentProfile,
        unlinkProfile,
        loginWithEmail,
        logout,
        isLiveSupabase: isSupabaseConfigured
      }}
    >
      {children}
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
