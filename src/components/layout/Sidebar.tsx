import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { UserRole } from '../../types';
import { canManageSpecialAttendance } from '../../config/permissions';
import { CollegeLogo } from '../common/CollegeLogo';
import { ThemeToggleSwitch } from '../common/ThemeToggle';
import {
  LayoutDashboard,
  CalendarCheck,
  Award,
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  FileSpreadsheet,
  Settings,
  Megaphone,
  CheckSquare,
  Building2,
  Layers,
  UserCheck,
  Bell,
  Calendar,
  FileText,
  FileCheck,
  Download,
  Bus,
  ShieldAlert,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  setActiveTab,
  isOpen = false,
  onClose
}) => {
  const { activeRole, user } = useAuth();
  const {
    getPendingAttendanceSessions,
    correctionRequests,
    specialAttendanceEvents
  } = useCollegeData();
  const { circulars, currentStudent, leaveRequests } = usePersonalizedCollege();

  const handleSelect = (tab: string) => {
    if (onSelectTab) onSelectTab(tab);
    else if (setActiveTab) setActiveTab(tab);
    if (onClose) onClose();
  };

  // Pending counts
  const pendingSessions = getPendingAttendanceSessions(
    activeRole === 'TEACHER' ? user?.id : undefined,
    activeRole === 'HOD' ? user?.departmentId : undefined
  );
  const pendingCorrections = correctionRequests.filter(c => c.status === 'PENDING');
  const pendingLeaveCount = leaveRequests.filter(r => r.status === 'SUBMITTED').length;
  const pendingAckCount = circulars.filter(
    c => c.requiresAcknowledgement && currentStudent && !c.acknowledgedStudentIds?.includes(currentStudent.id)
  ).length;

  const roleDisplayNames: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    PRINCIPAL: 'Principal',
    HOD: 'Head of Dept',
    TEACHER: 'Faculty / Teacher',
    CLASS_TUTOR: 'Class Tutor',
    COURSE_COORDINATOR: 'Course Coord',
    ATTENDANCE_COORDINATOR: 'Attendance Coord',
    OFFICE_STAFF: 'Office Staff',
    STUDENT: 'FYUGP Student'
  };

  // Navigation Items Configured by Role
  const navSections = [
    {
      title: 'Core Modules',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        {
          id: 'attendance',
          label: activeRole === 'STUDENT' ? 'My Attendance Radar' : 'Attendance Marking',
          icon: CalendarCheck,
          badge:
            activeRole !== 'STUDENT' && pendingSessions.length > 0
              ? `${pendingSessions.length}`
              : undefined,
          badgeColor: 'bg-rose-500'
        },
        ...(activeRole !== 'STUDENT'
          ? [
              {
                id: 'corrections',
                label: 'Corrections',
                icon: CheckSquare,
                badge: pendingCorrections.length > 0 ? `${pendingCorrections.length}` : undefined,
                badgeColor: 'bg-amber-500'
              }
            ]
          : []),
        ...(canManageSpecialAttendance(activeRole) || activeRole === 'TEACHER' || activeRole === 'STUDENT'
          ? [
              {
                id: 'special-attendance',
                label: 'Special Attendance',
                icon: Award,
                badge: specialAttendanceEvents.length > 0 ? `${specialAttendanceEvents.length}` : undefined,
                badgeColor: 'bg-indigo-500'
              }
            ]
          : []),
        {
          id: 'timetable',
          label: 'Timetable',
          icon: Clock
        }
      ]
    },

    // Academic Architecture (Admin, Principal, HOD, Coordinators, Staff)
    ...(activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL'
      ? [
          {
            title: 'Academic',
            items: [
              { id: 'departments', label: 'Departments', icon: Building2 },
              { id: 'programmes', label: 'Programmes', icon: GraduationCap },
              { id: 'course-categories', label: 'Categories', icon: Layers },
              { id: 'courses', label: 'Courses', icon: BookOpen }
            ]
          },
          {
            title: 'Directory',
            items: [
              { id: 'students', label: 'Students', icon: Users },
              { id: 'staff-enrollment', label: 'Staff & Faculty', icon: UserCheck },
              { id: 'registrations', label: 'Course Allocations', icon: BookOpen }
            ]
          }
        ]
      : activeRole === 'HOD'
      ? [
          {
            title: 'Academic',
            items: [
              { id: 'timetable', label: 'Timetable', icon: Clock },
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'programmes', label: 'Programmes', icon: GraduationCap },
              { id: 'departments', label: 'Department', icon: Building2 }
            ]
          },
          {
            title: 'Directory',
            items: [
              { id: 'students', label: 'Students', icon: Users },
              { id: 'staff-enrollment', label: 'Staff', icon: UserCheck },
              { id: 'registrations', label: 'Course Allocations', icon: BookOpen }
            ]
          }
        ]
      : activeRole !== 'STUDENT'
      ? [
          {
            title: 'Teaching',
            items: [
              { id: 'courses', label: 'Courses', icon: BookOpen }
            ]
          },
          {
            title: 'Students & Classes',
            items: [
              { id: 'students', label: 'Students', icon: Users },
              { id: 'registrations', label: 'Course Allocations', icon: BookOpen }
            ]
          }
        ]
      : [
          {
            title: 'Academics',
            items: [
              { id: 'students', label: 'My Profile', icon: Users },
              { id: 'registrations', label: 'My Subjects', icon: BookOpen }
            ]
          }
        ]),

    // Campus Life & Services
    {
      title: 'Services',
      items: [
        {
          id: 'notices',
          label: 'Notices',
          icon: Bell,
          badge: pendingAckCount > 0 ? `${pendingAckCount}` : undefined,
          badgeColor: 'bg-rose-500'
        },
        { id: 'events', label: 'Calendar', icon: Calendar },
        {
          id: 'leave-requests',
          label: 'OD & Leave',
          icon: FileText,
          badge: ['TEACHER', 'HOD', 'PRINCIPAL', 'SUPER_ADMIN'].includes(activeRole) && pendingLeaveCount > 0
            ? `${pendingLeaveCount}`
            : undefined,
          badgeColor: 'bg-amber-500'
        },
        { id: 'student-requests', label: 'Certificates', icon: FileCheck },
        {
          id: 'bus-concession',
          label: 'Bus Concession',
          icon: Bus,
          badge: (activeRole === 'HOD' || activeRole === 'PRINCIPAL') ? 'New' : undefined,
          badgeColor: 'bg-amber-500'
        },
        {
          id: 'complaints',
          label: 'Grievances',
          icon: ShieldAlert
        },
        { id: 'resources', label: 'Resources', icon: Download },
        { id: 'department-hub', label: 'Department Hub', icon: Building2 }
      ]
    },

    // Administration
    {
      title: 'Administration',
      items: [
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        ...(activeRole !== 'STUDENT'
          ? [
              { id: 'reports', label: 'Reports', icon: FileSpreadsheet }
            ]
          : []),
        ...(activeRole === 'SUPER_ADMIN'
          ? [
              { id: 'settings', label: 'Settings', icon: Settings }
            ]
          : [])
      ]
    }
  ];

  const userInitials = (user?.name || 'SA')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sidebarContent = (
    <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col h-full border-r border-slate-800 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <CollegeLogo size="sm" variant="dark" showSubtitle={true} />
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={section.title} className={sIdx > 0 ? 'mt-6' : ''}>
            <div className="text-slate-500 text-[10px] uppercase tracking-widest px-3 mb-2 font-bold">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-xs font-semibold ${
                      isActive
                        ? 'bg-rose-900 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                          item.badgeColor || 'bg-rose-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Theme Quick Switcher in Sidebar Footer */}
      <div className="px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold text-slate-400">Theme</span>
        <ThemeToggleSwitch size="sm" showLabels={true} />
      </div>

      {/* User Status in Sidebar Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase border border-slate-600 shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 overflow-hidden min-w-0">
            <div className="text-xs font-semibold text-white truncate uppercase">
              {roleDisplayNames[activeRole] || activeRole}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {user?.email || 'admin@nsscollege.edu'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0 h-full">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onClose}
          />
          <div className="relative z-10 flex h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

