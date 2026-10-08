import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Modal, Badge } from '../common/UIComponents';
import {
  Shield,
  GraduationCap,
  Users,
  Building,
  Briefcase,
  CheckCircle,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { user, activeRole, loginAsDemoUser, switchRole } = useAuth();

  // Strict RBAC Verification:
  // Students are NEVER allowed to access the role switcher.
  // Only SUPER_ADMIN (or users who possess SUPER_ADMIN role) can open and switch roles via this modal.
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || activeRole === 'SUPER_ADMIN';
  const isStudent = activeRole === 'STUDENT' || user?.roles?.includes('STUDENT');

  if (!isOpen) return null;

  // If a student or unauthorized user somehow triggers the modal, immediately render an access denied view
  if (!isSuperAdmin || isStudent) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Access Denied"
        subtitle="Restricted Administration Feature"
        maxWidth="max-w-md"
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Unauthorized Action</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Role switching is restricted strictly to Institutional Administrators (Super Admin). 
              Student and unauthorized accounts cannot escalate or switch portal roles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const demoRoles: {
    role: UserRole;
    title: string;
    userName: string;
    description: string;
    icon: any;
    badge: string;
  }[] = [
    {
      role: 'TEACHER',
      title: 'Teacher / Faculty',
      userName: 'Prof. Anitha Radhakrishnan (Economics)',
      description: "Mark attendance for assigned FYUGP multi-disciplinary course groups, enter topics, request corrections.",
      icon: Briefcase,
      badge: 'Core Flow'
    },
    {
      role: 'STUDENT',
      title: 'FYUGP Student Portal',
      userName: 'Aravind Venugopal (B.Com Sem 1)',
      description: "View subject-wise attendance, shortage indicators, interactive target calculator, and digital student ID.",
      icon: GraduationCap,
      badge: 'Student View'
    },
    {
      role: 'HOD',
      title: 'Head of Department (HOD)',
      userName: 'Dr. Suresh Kumar P. (Commerce & Management)',
      description: "Department attendance health, pending submissions, correction approval queue, substitute assignment.",
      icon: Building,
      badge: 'Dept Head'
    },
    {
      role: 'PRINCIPAL',
      title: 'Principal Portal',
      userName: 'Dr. Harikrishnan Nair (Principal)',
      description: "College-wide attendance metrics, cross-department comparison, shortage lists, institutional oversight.",
      icon: Shield,
      badge: 'Executive'
    },
    {
      role: 'SUPER_ADMIN',
      title: 'Super Administrator',
      userName: 'Smt. Padmaja K. (Admin Head)',
      description: "Full configuration: programmes, course categories, periods, thresholds, system settings, PostgreSQL schema export.",
      icon: Sparkles,
      badge: 'All Permissions'
    },
    {
      role: 'CLASS_TUTOR',
      title: 'Class Tutor',
      userName: 'Dr. Meera Menon (History Batch Tutor)',
      description: "Batch student attendance monitoring, shortage alerts, parent contact directory.",
      icon: Users,
      badge: 'Batch Mentor'
    },
    {
      role: 'COURSE_COORDINATOR',
      title: 'Course Coordinator',
      userName: 'Prof. Anitha Radhakrishnan (FYUGP Coordinator)',
      description: "Manage multi-programme course offerings, group allocations, cross-department enrollment stats.",
      icon: Briefcase,
      badge: 'Course Head'
    },
    {
      role: 'ATTENDANCE_COORDINATOR',
      title: 'Attendance Coordinator',
      userName: 'Dr. Rajesh Narayanan (College Committee)',
      description: "Supervise daily faculty submissions, institute-wide shortage reports, correction audits.",
      icon: Shield,
      badge: 'Oversight'
    },
    {
      role: 'OFFICE_STAFF',
      title: 'Office Staff / Admissions',
      userName: 'Smt. Padmaja K. (Administrative Office)',
      description: "Student master records, semester promotions, course registration batch operations.",
      icon: Users,
      badge: 'Administration'
    }
  ];

  const handleSelectRole = (role: UserRole) => {
    loginAsDemoUser(role);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Switch Portal Role"
      subtitle="Select any user role to experience the personalized dashboard and permissions"
      maxWidth="max-w-3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto p-1">
        {demoRoles.map(item => {
          const Icon = item.icon;
          const isCurrent = activeRole === item.role;

          return (
            <div
              key={item.role}
              onClick={() => handleSelectRole(item.role)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg ${
                      isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs font-semibold text-blue-600">{item.userName}</p>
                  </div>
                </div>

                <Badge variant={isCurrent ? 'info' : 'outline'} size="sm">
                  {item.badge}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{item.description}</p>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">{item.role}</span>
                {isCurrent ? (
                  <span className="font-bold text-blue-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Active Role
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium hover:text-blue-600">Switch →</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
