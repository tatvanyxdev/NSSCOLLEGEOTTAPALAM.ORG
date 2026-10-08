import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import { can } from '../../config/permissions';
import { QuickSubmitLeaveModal } from './QuickSubmitLeaveModal';
import { QuickNewAnnouncementModal } from './QuickNewAnnouncementModal';
import { QuickMarkAttendanceModal } from './QuickMarkAttendanceModal';
import { AttendanceCalculatorModal } from '../student/AttendanceCalculatorModal';
import { DigitalIdModal } from '../student/DigitalIdModal';
import { SubstituteTeacherModal } from '../attendance/SubstituteTeacherModal';
import { SendPushNotificationModal } from '../modals/SendPushNotificationModal';
import {
  Zap,
  Sparkles,
  Plus,
  X,
  CalendarCheck,
  FileText,
  Megaphone,
  Users,
  TrendingUp,
  IdCard,
  AlertTriangle,
  Download,
  Building,
  Clock,
  Settings,
  ChevronRight,
  Calendar,
  FileCheck,
  BookOpen,
  BellRing
} from 'lucide-react';

interface QuickActionsFloatingButtonProps {
  onNavigate: (tab: string) => void;
  scheduledClasses?: any[];
  onOpenSessionForClass?: (item: any) => Promise<void>;
  onOpenSubstituteModal?: () => void;
  onExportCsv?: () => void;
}

export const QuickActionsFloatingButton: React.FC<QuickActionsFloatingButtonProps> = ({
  onNavigate,
  scheduledClasses = [],
  onOpenSessionForClass,
  onOpenSubstituteModal,
  onExportCsv
}) => {
  const { user, activeRole } = useAuth();
  const {
    students,
    classSessions,
    correctionRequests,
    exportAttendanceReportToCsv
  } = useCollegeData();
  const { currentStudent, leaveRequests } = usePersonalizedCollege();

  // Floating menu open state
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isSubmitLeaveOpen, setIsSubmitLeaveOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isDigitalIdOpen, setIsDigitalIdOpen] = useState(false);
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  // Close floating menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close floating menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Derived role context
  const isStudent = activeRole === 'STUDENT';
  const isTeacher =
    activeRole === 'TEACHER' ||
    activeRole === 'CLASS_TUTOR' ||
    activeRole === 'COURSE_COORDINATOR';
  const isHod = activeRole === 'HOD';
  const isAdminOrPrincipal =
    activeRole === 'SUPER_ADMIN' ||
    activeRole === 'PRINCIPAL' ||
    activeRole === 'ATTENDANCE_COORDINATOR' ||
    activeRole === 'OFFICE_STAFF';

  // Action permissions
  const canMarkAttendance =
    can(activeRole, 'attendance', 'mark_assigned') ||
    can(activeRole, 'attendance', 'mark_department') ||
    can(activeRole, 'attendance', 'mark_all');

  const canCreateAnnouncement = can(activeRole, 'announcements', 'create');
  const canAssignSubstitute = can(activeRole, 'attendance', 'assign_substitute');
  const canExportReports = can(activeRole, 'reports', 'export_csv');

  // Pending counts for badges
  const pendingClassesCount = scheduledClasses.filter(c => c.isPending && !c.isCancelled).length;
  const pendingLeavesCount = leaveRequests.filter(
    r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
  ).length;
  const pendingCorrectionsCount = correctionRequests.filter(c => c.status === 'PENDING').length;

  const totalBadgeCount = isStudent
    ? 0
    : isTeacher
    ? pendingClassesCount
    : isHod
    ? pendingLeavesCount + pendingCorrectionsCount
    : pendingCorrectionsCount;

  // Student profile resolution
  const resolvedStudent =
    currentStudent ||
    students.find(s => s.id === user?.id) ||
    students[0];

  // Role Badge Label
  const getRoleHeaderInfo = () => {
    switch (activeRole) {
      case 'STUDENT':
        return { label: 'Student Desk', desc: 'Fast tools & academic services' };
      case 'TEACHER':
        return { label: 'Faculty Actions', desc: 'Classroom & attendance triggers' };
      case 'CLASS_TUTOR':
        return { label: 'Class Tutor Desk', desc: 'Batch attendance & student care' };
      case 'COURSE_COORDINATOR':
        return { label: 'Course Coordinator', desc: 'Subject allocation & sessions' };
      case 'HOD':
        return { label: 'HOD Executive Desk', desc: 'Department oversight & fast tasks' };
      case 'PRINCIPAL':
        return { label: 'Principal Console', desc: 'Campus-wide administrative actions' };
      case 'SUPER_ADMIN':
        return { label: 'Super Admin Suite', desc: 'Universal control & triggers' };
      case 'ATTENDANCE_COORDINATOR':
        return { label: 'Attendance Coordinator', desc: 'Central attendance management' };
      default:
        return { label: 'Quick Desk', desc: 'Institutional shortcuts' };
    }
  };

  const roleInfo = getRoleHeaderInfo();

  return (
    <>
      {/* Floating Action Button Container */}
      <div
        ref={menuRef}
        className="fixed bottom-20 md:bottom-8 right-3 sm:right-6 md:right-8 z-40 flex flex-col items-end"
      >
        {/* Quick Actions Menu Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="mb-3 w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-[380px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden ring-1 ring-black/5"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-xs">
                    <Zap className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black tracking-tight uppercase">Quick Actions</h3>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-extrabold uppercase">
                        {roleInfo.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{roleInfo.desc}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Actions List */}
              <div className="p-3 space-y-1.5 max-h-[380px] overflow-y-auto">
                {/* 1. MARK ATTENDANCE (Teacher / Tutor / Coordinator / HOD / Admin) */}
                {canMarkAttendance && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsMarkAttendanceOpen(true);
                    }}
                    className="w-full p-2.5 rounded-xl border border-blue-100 hover:border-blue-300 bg-blue-50/50 hover:bg-blue-50/90 transition-all text-left flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">Mark Attendance</span>
                          {pendingClassesCount > 0 && (
                            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md">
                              {pendingClassesCount} Pending
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {scheduledClasses.length > 0
                            ? "Conduct today's scheduled period"
                            : 'Open Central Attendance Hub'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* 2. SUBMIT LEAVE (Students & Staff) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (isStudent) {
                      setIsSubmitLeaveOpen(true);
                    } else {
                      // For faculty/tutors: option to review or apply
                      setIsSubmitLeaveOpen(true);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-amber-100 hover:border-amber-300 bg-amber-50/50 hover:bg-amber-50/90 transition-all text-left flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {isStudent ? 'Submit Leave / OD' : 'Submit Leave Application'}
                        </span>
                        {isStudent && (
                          <span className="px-1.5 py-0.2 bg-amber-200/70 text-amber-900 text-[9px] font-bold rounded-md">
                            OD / Medical
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {isStudent
                          ? 'Apply for on-duty, medical, or casual leave'
                          : 'Submit student or staff leave request'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 3. NEW ANNOUNCEMENT (Teacher, HOD, Principal, Super Admin) */}
                {canCreateAnnouncement && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsAnnouncementOpen(true);
                    }}
                    className="w-full p-2.5 rounded-xl border border-rose-100 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-50/90 transition-all text-left flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-900 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">New Announcement</span>
                          <span className="px-1.5 py-0.2 bg-rose-200/70 text-rose-900 text-[9px] font-bold rounded-md">
                            Broadcast
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Publish notice to students, faculty, or all
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-800 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* PUSH NOTIFICATION BROADCAST (Principal, HOD, Super Admin) */}
                {['PRINCIPAL', 'HOD', 'SUPER_ADMIN'].includes(activeRole) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsPushModalOpen(true);
                    }}
                    className="w-full p-2.5 rounded-xl border border-blue-200 hover:border-blue-400 bg-blue-50/80 hover:bg-blue-100/90 transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        <BellRing className="w-4 h-4 text-amber-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            {activeRole === 'PRINCIPAL'
                              ? 'Campus Push Broadcast'
                              : activeRole === 'HOD'
                              ? 'Department Push Alert'
                              : 'System Push Dispatcher'}
                          </span>
                          <span className="px-1.5 py-0.2 bg-blue-200 text-blue-900 text-[9px] font-bold rounded-md uppercase font-mono">
                            Live Push
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Instant broadcast to desktop, mobile & portal
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-800 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* 4. ROLE SPECIFIC SECONDARY ACTIONS */}
                {/* Student specific: Target Calculator & Digital ID */}
                {isStudent && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setIsCalculatorOpen(true);
                      }}
                      className="w-full p-2.5 rounded-xl border border-emerald-100 hover:border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50/90 transition-all text-left flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Target Calculator</div>
                          <p className="text-[10px] text-slate-500">
                            Simulate classes required for 75% threshold
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setIsDigitalIdOpen(true);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <IdCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Digital Student ID</div>
                          <p className="text-[10px] text-slate-500">Official card with live QR code</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </>
                )}

                {/* Teacher / HOD / Admin: Assign Substitute */}
                {canAssignSubstitute && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (onOpenSubstituteModal) {
                        onOpenSubstituteModal();
                      } else {
                        setIsSubstituteModalOpen(true);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-purple-100 hover:border-purple-300 bg-purple-50/50 hover:bg-purple-50/90 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Assign Substitute</div>
                        <p className="text-[10px] text-slate-500">
                          Coverage for faculty leave or official duty
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* HOD / Admin: Set Timetable */}
                {can(activeRole, 'timetable', 'create') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigate('timetable');
                    }}
                    className="w-full p-2.5 rounded-xl border border-blue-100 hover:border-blue-300 bg-blue-50/50 hover:bg-blue-50/90 transition-all text-left flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Set Department Timetable</div>
                        <p className="text-[10px] text-slate-500">
                          Schedule periods, rooms, and faculty slots
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* HOD / Admin: Add New Course */}
                {can(activeRole, 'courses', 'create') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigate('courses');
                    }}
                    className="w-full p-2.5 rounded-xl border border-indigo-100 hover:border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50/90 transition-all text-left flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Add New Course</div>
                        <p className="text-[10px] text-slate-500">
                          Configure syllabus, credits & categories
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Export CSV (Tutor, HOD, Coordinator, Principal, Admin) */}
                {canExportReports && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (onExportCsv) {
                        onExportCsv();
                      } else {
                        exportAttendanceReportToCsv();
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/40 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Export Attendance CSV</div>
                        <p className="text-[10px] text-slate-500">
                          Instant spreadsheet of attendance records
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              {/* Navigation Quick Shortcuts Bar */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Shortcuts:
                </span>

                {isStudent ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate('leave-requests');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-semibold transition-colors"
                    >
                      OD Status
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate('corrections');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-semibold transition-colors"
                    >
                      Corrections
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate('events');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-semibold transition-colors"
                    >
                      Calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate('resources');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-semibold transition-colors"
                    >
                      Downloads
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate('attendance');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-semibold transition-colors"
                    >
                      Attendance Hub
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate('leave-requests');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Leave Desk</span>
                      {pendingLeavesCount > 0 && (
                        <span className="px-1 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black">
                          {pendingLeavesCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigate('corrections');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Corrections</span>
                      {pendingCorrectionsCount > 0 && (
                        <span className="px-1 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-black">
                          {pendingCorrectionsCount}
                        </span>
                      )}
                    </button>
                    {isHod && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onNavigate('department-hub');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-semibold transition-colors"
                      >
                        Dept Hub
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Floating Action Button (FAB) */}
        <button
          id="quick-actions-floating-button"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle Quick Actions"
          className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-rose-900 to-rose-950 text-white shadow-xl hover:shadow-2xl border border-rose-700/60 hover:from-rose-800 hover:to-rose-900 transition-all duration-200 active:scale-95 select-none focus:outline-none focus:ring-4 focus:ring-rose-500/30"
        >
          {/* Pulsing notification ring if pending action exists */}
          {totalBadgeCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-slate-950 text-[9px] font-black items-center justify-center">
                {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
              </span>
            </span>
          )}

          {/* Animated Icon */}
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 flex items-center justify-center shrink-0"
          >
            {isOpen ? (
              <Plus className="w-5 h-5 text-white" />
            ) : (
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            )}
          </motion.div>

          {/* Text Label */}
          <span className="text-xs font-black tracking-wide uppercase">
            {isOpen ? 'Close' : 'Quick Actions'}
          </span>
        </button>
      </div>

      {/* Modals Hosted by Floating Quick Actions */}

      {/* 1. Quick Submit Leave Modal */}
      <QuickSubmitLeaveModal
        isOpen={isSubmitLeaveOpen}
        onClose={() => setIsSubmitLeaveOpen(false)}
      />

      {/* 2. Quick New Announcement Modal */}
      <QuickNewAnnouncementModal
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
      />

      {/* 3. Quick Mark Attendance Modal */}
      <QuickMarkAttendanceModal
        isOpen={isMarkAttendanceOpen}
        onClose={() => setIsMarkAttendanceOpen(false)}
        scheduledClasses={scheduledClasses}
        onOpenSessionForClass={async item => {
          if (onOpenSessionForClass) {
            await onOpenSessionForClass(item);
          }
        }}
        onNavigateToHub={() => onNavigate('attendance')}
        onNavigateToSpecial={() => onNavigate('special-attendance')}
        userRole={activeRole}
      />

      {/* 4. Target Calculator Modal (Student) */}
      {resolvedStudent && (
        <AttendanceCalculatorModal
          isOpen={isCalculatorOpen}
          onClose={() => setIsCalculatorOpen(false)}
          studentId={resolvedStudent.id}
        />
      )}

      {/* 5. Digital ID Modal (Student) */}
      {resolvedStudent && (
        <DigitalIdModal
          isOpen={isDigitalIdOpen}
          onClose={() => setIsDigitalIdOpen(false)}
          student={resolvedStudent}
        />
      )}

      {/* 6. Substitute Teacher Modal */}
      <SubstituteTeacherModal
        isOpen={isSubstituteModalOpen}
        onClose={() => setIsSubstituteModalOpen(false)}
      />

      {/* 7. Push Notification Broadcast Modal */}
      <SendPushNotificationModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
      />
    </>
  );
};
