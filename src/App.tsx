import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CollegeDataProvider, useCollegeData } from './contexts/CollegeDataContext';
import { PersonalizedCollegeProvider } from './contexts/PersonalizedCollegeContext';
import { can } from './config/permissions';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { RoleSwitcherModal } from './components/layout/RoleSwitcherModal';
import { RoleLoginModal } from './components/auth/RoleLoginModal';
import { PublicHomePage } from './components/home/PublicHomePage';
import { EmergencyAlertBanner } from './components/common/EmergencyAlertBanner';
import { UniversalSearchModal } from './components/common/UniversalSearchModal';
import { SecurityQuarantineOverlay } from './components/security/SecurityQuarantineOverlay';
import { MaintenancePageView } from './components/maintenance/MaintenancePageView';
import { PushNotificationBanner } from './components/common/PushNotificationBanner';
import { FloatingThemeToggle } from './components/common/ThemeToggle';
import { isRoleUnderMaintenance, isAttendanceOnlyLockout, getAffectedRolesSummary } from './lib/maintenanceGuard';
import { initNativeAppBridge, registerBackHandler, updateNativeStatusBar } from './lib/capacitorBridge';
import { Wrench } from 'lucide-react';

// Views
import { DashboardView } from './components/views/DashboardView';
import { AttendanceHubView } from './components/views/AttendanceHubView';
import { AttendanceCorrectionsView } from './components/views/AttendanceCorrectionsView';
import { TimetableView } from './components/views/TimetableView';
import { DepartmentsView } from './components/views/DepartmentsView';
import { ProgrammesView } from './components/views/ProgrammesView';
import { CourseCategoriesView } from './components/views/CourseCategoriesView';
import { CoursesMasterView } from './components/views/CoursesMasterView';
import { StudentsManagerView } from './components/views/StudentsManagerView';
import { CourseRegistrationsView } from './components/views/CourseRegistrationsView';
import { FacultyManagerView } from './components/views/FacultyManagerView';
import { StaffEnrollmentView } from './components/views/StaffEnrollmentView';
import { ReportsCenterView } from './components/views/ReportsCenterView';
import { AnnouncementsView } from './components/views/AnnouncementsView';
import { SystemSettingsView } from './components/views/SystemSettingsView';
import { SpecialAttendanceView } from './components/views/SpecialAttendanceView';
import { NoticesAndCircularsView } from './components/views/NoticesAndCircularsView';
import { AcademicCalendarView } from './components/views/AcademicCalendarView';
import { LeaveRequestsView } from './components/views/LeaveRequestsView';
import { CertificateRequestsView } from './components/views/CertificateRequestsView';
import { AcademicResourcesView } from './components/views/AcademicResourcesView';
import { DepartmentHubView } from './components/views/DepartmentHubView';
import { BusConcessionView } from './components/views/BusConcessionView';
import { ComplaintsManagerView } from './components/views/ComplaintsManagerView';

const tabTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  attendance: 'Attendance',
  'special-attendance': 'Special Attendance',
  corrections: 'Correction Queue',
  timetable: 'Timetable',
  departments: 'Departments',
  programmes: 'Programmes',
  'course-categories': 'Course Categories',
  courses: 'Courses Master',
  students: '1. Student Enrollment',
  'staff-enrollment': '2. Staff & Faculty Enrollment',
  registrations: 'Course & Subject Allocations',
  faculty: 'Staff & Faculty Directory',
  reports: 'Reports & Export',
  announcements: 'Announcements',
  settings: 'Configuration & SQL DB',
  notices: 'Notices & Circulars',
  events: 'Academic Calendar & Events',
  'leave-requests': 'OD & Leave Desk',
  'student-requests': 'Certificate Requests',
  resources: 'Academic Downloads',
  'department-hub': 'Department Hub',
  'bus-concession': 'Bus Concession Desk',
  complaints: 'Grievance & Vigilance Cell'
};

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { user, activeRole, isAuthenticated } = useAuth();
  const { settings, correctionRequests } = useCollegeData();

  const isUnderMaintenance = isRoleUnderMaintenance(activeRole, settings);
  const isAttendanceOnly = isAttendanceOnlyLockout(settings);

  // Handle Android hardware back button for modals, drawers, and tabs
  useEffect(() => {
    return registerBackHandler(() => {
      if (isSearchOpen) {
        setIsSearchOpen(false);
        return true;
      }
      if (isNotificationOpen) {
        setIsNotificationOpen(false);
        return true;
      }
      if (isLoginModalOpen) {
        setIsLoginModalOpen(false);
        return true;
      }
      if (isRoleSwitcherOpen) {
        setIsRoleSwitcherOpen(false);
        return true;
      }
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return true;
      }
      return false;
    });
  }, [isSearchOpen, isNotificationOpen, isLoginModalOpen, isRoleSwitcherOpen, isSidebarOpen, activeTab]);

  // If user is not authenticated, show Public Homepage
  if (!isAuthenticated || !user) {
    return (
      <>
        <PublicHomePage onLoginClick={() => setIsLoginModalOpen(true)} />
        <RoleLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
        <div className="hidden md:block">
          <FloatingThemeToggle />
        </div>
      </>
    );
  }

  // If user's role is under full portal maintenance lockout, display the dedicated Under Maintenance page
  if (isUnderMaintenance && !isAttendanceOnly) {
    return (
      <>
        <MaintenancePageView onAdminLoginClick={() => setIsLoginModalOpen(true)} />
        <RoleLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
        <div className="hidden md:block">
          <FloatingThemeToggle />
        </div>
      </>
    );
  }

  const pendingCorrectionsCount = correctionRequests.filter(r => r.status === 'PENDING').length;

  const renderActiveView = () => {
    // If user's role has attendance locked under maintenance, block attendance-related views
    if (
      isUnderMaintenance &&
      isAttendanceOnly &&
      ['attendance', 'special-attendance', 'corrections', 'timetable'].includes(activeTab)
    ) {
      return (
        <MaintenancePageView
          isInlineBlock={true}
          onAdminLoginClick={() => setIsLoginModalOpen(true)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
      case 'notices':
        return <NoticesAndCircularsView />;
      case 'events':
        return <AcademicCalendarView />;
      case 'leave-requests':
        return <LeaveRequestsView />;
      case 'student-requests':
        return <CertificateRequestsView />;
      case 'bus-concession':
        return <BusConcessionView />;
      case 'complaints':
        return <ComplaintsManagerView />;
      case 'resources':
        return <AcademicResourcesView />;
      case 'department-hub':
        return <DepartmentHubView />;
      case 'attendance':
        return <AttendanceHubView />;
      case 'special-attendance':
        return <SpecialAttendanceView />;
      case 'corrections':
        if (!can(activeRole, 'attendance', 'request_correction') && !can(activeRole, 'attendance', 'approve_correction')) {
          return <DashboardView onNavigate={setActiveTab} />;
        }
        return <AttendanceCorrectionsView />;
      case 'timetable':
        return <TimetableView />;
      case 'departments':
        if (!can(activeRole, 'departments', 'read')) {
          return <DashboardView onNavigate={setActiveTab} />;
        }
        return <DepartmentsView />;
      case 'programmes':
        if (!can(activeRole, 'programmes', 'read')) {
          return <DashboardView onNavigate={setActiveTab} />;
        }
        return <ProgrammesView />;
      case 'course-categories':
        if (!can(activeRole, 'categories', 'read')) {
          return <DashboardView onNavigate={setActiveTab} />;
        }
        return <CourseCategoriesView />;
      case 'courses':
        return <CoursesMasterView />;
      case 'students':
        return (
          <StudentsManagerView
            onNavigateToCourseAllocation={() => setActiveTab('registrations')}
            onNavigateToStaffEnrollment={
              (activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL')
                ? () => setActiveTab('staff-enrollment')
                : undefined
            }
          />
        );
      case 'registrations':
        return <CourseRegistrationsView />;
      case 'staff-enrollment':
      case 'faculty':
        if (activeRole !== 'SUPER_ADMIN' && activeRole !== 'PRINCIPAL' && activeRole !== 'HOD') {
          return <DashboardView onNavigate={setActiveTab} />;
        }
        return (
          <StaffEnrollmentView
            onNavigateToStudents={() => setActiveTab('students')}
            onNavigateToCourseAllocation={() => setActiveTab('registrations')}
          />
        );
      case 'reports':
        if (
          !can(activeRole, 'reports', 'read_assigned') &&
          !can(activeRole, 'reports', 'read_department') &&
          !can(activeRole, 'reports', 'read_college')
        ) {
          return <DashboardView onNavigate={setActiveTab} />;
        }
        return <ReportsCenterView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'settings':
        if (!can(activeRole, 'settings', 'read')) {
          return <DashboardView onNavigate={setActiveTab} />;
        }
        return <SystemSettingsView />;
      default:
        return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-rose-900 selection:text-white">
      {/* Real-Time In-App & Browser Push Notification Banner */}
      <PushNotificationBanner onNavigate={setActiveTab} />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden w-full max-w-full">
        {/* Top Header */}
        <Header
          activeTabTitle={tabTitles[activeTab] || 'Dashboard'}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenMaintenance={() => setActiveTab('settings')}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-24 md:pb-8 w-full max-w-full bg-slate-50 dark:bg-slate-950">
          {/* Institutional Maintenance Active Alert Banner (Visible to exempt SuperAdmin & Staff) */}
          {(settings?.maintenanceMode || settings?.maintenanceConfig?.enabled) && (
            <div className="p-3.5 sm:p-4 bg-amber-500 text-slate-950 rounded-2xl shadow-xs border border-amber-600/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-950 text-white rounded-xl shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black uppercase tracking-wider text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded">
                      Maintenance Mode Active
                    </span>
                    <span className="font-bold text-slate-950">
                      Restricted Roles: {getAffectedRolesSummary(settings?.maintenanceConfig)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-900 mt-0.5 leading-relaxed">
                    {isAttendanceOnly
                      ? 'Attendance marking & timetable submissions are paused.'
                      : 'Students and targeted users see the Under Maintenance page and are locked out of normal portal operations.'}{' '}
                    You have administrative override access.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs self-start sm:self-auto"
              >
                Configure / Turn Off →
              </button>
            </div>
          )}

          {/* Emergency / Critical Institution Alert Banner */}
          <EmergencyAlertBanner />

          {/* Action Callout if Pending Corrections */}
          {pendingCorrectionsCount > 0 &&
            (activeRole === 'HOD' || activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL') &&
            activeTab !== 'corrections' && (
              <div className="p-3 sm:p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>
                    <strong>{pendingCorrectionsCount} attendance correction request(s)</strong> awaiting adjudication.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('corrections')}
                  className="px-3 py-1 bg-white text-amber-900 border border-amber-300 rounded-md text-xs font-bold hover:bg-amber-100/50 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
                >
                  Review Queue →
                </button>
              </div>
            )}

          <div className="max-w-7xl mx-auto w-full min-w-0">
            {renderActiveView()}
          </div>
        </main>

        {/* Institutional Status Footer */}
        <footer className="hidden md:flex h-10 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0 select-none">
          <div className="truncate">
            FYUGP Attendance Management System | NSS College Ottapalam
          </div>
          <div className="flex items-center space-x-4 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              System Status: Online
            </span>
            <span>Version 1.0.4-stable</span>
          </div>
        </footer>

        {/* Mobile Bottom Navigation for Touch Devices */}
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenMore={() => setIsSidebarOpen(true)}
        />
      </div>

      {/* Modals & Drawers */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigate={setActiveTab}
      />

      {/* Role Switcher Modal - Strictly mounted only for Super Administrators */}
      {(user.roles.includes('SUPER_ADMIN') || activeRole === 'SUPER_ADMIN') && (
        <RoleSwitcherModal
          isOpen={isRoleSwitcherOpen}
          onClose={() => setIsRoleSwitcherOpen(false)}
        />
      )}

      {/* Universal Institutional Search Modal */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveTab}
      />

      {/* Floating Theme Quick Switcher (Always accessible on desktop/tablet) */}
      <div className="hidden md:block">
        <FloatingThemeToggle />
      </div>
    </div>
  );
};

const NativeAppLifecycle: React.FC = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const cleanup = initNativeAppBridge({ isDark: resolvedTheme === 'dark' });
    return cleanup;
  }, []);

  useEffect(() => {
    updateNativeStatusBar(resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return null;
};

export default function App() {
  return (
    <ThemeProvider>
      <NativeAppLifecycle />
      <AuthProvider>
        <CollegeDataProvider>
          <PersonalizedCollegeProvider>
            <MainLayout />
            <SecurityQuarantineOverlay />
          </PersonalizedCollegeProvider>
        </CollegeDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
