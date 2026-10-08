import React from 'react';
import {
  LogIn,
  Megaphone,
  Calendar,
  Building2,
  GraduationCap,
  Trees,
  PhoneCall,
  FileText,
  ShieldAlert
} from 'lucide-react';

interface QuickAccessProps {
  onLoginClick: () => void;
  onNavigate?: (page: string) => void;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({ onLoginClick, onNavigate }) => {
  const actions = [
    {
      id: 'qa-portal',
      title: 'College Portal',
      description: 'Attendance & Student ERP',
      icon: LogIn,
      actionType: 'login',
      badge: 'ERP Access',
      badgeColor: 'bg-rose-100 text-rose-800'
    },
    {
      id: 'qa-announcements',
      title: 'Notice Board',
      description: 'Official Circulars & Alerts',
      icon: Megaphone,
      page: 'announcements',
      href: '#announcements',
      badge: 'Live',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'qa-academics',
      title: 'FYUGP Academics',
      description: '13 UG & 6 PG Programmes',
      icon: GraduationCap,
      page: 'academics',
      href: '#academics',
      badge: 'University of Calicut',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'qa-departments',
      title: 'Departments',
      description: 'Academic Faculties Directory',
      icon: Building2,
      page: 'departments',
      href: '#departments',
      badge: 'Explore',
      badgeColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: 'qa-facilities',
      title: 'Campus & Library',
      description: '41 Acres, Automated Library',
      icon: Trees,
      page: 'facilities',
      href: '#facilities',
      badge: 'Facilities',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'qa-student-portal',
      title: 'Student Services',
      description: 'Student Portal, Leave & ID',
      icon: GraduationCap,
      actionType: 'login',
      badge: 'Portal Login',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'qa-complaints',
      title: 'Complaints & Vigilance',
      description: 'Anti-Ragging, Anti-Drug & Grievances',
      icon: ShieldAlert,
      page: 'complaints',
      href: '#complaints',
      badge: 'Redressal',
      badgeColor: 'bg-rose-100 text-rose-900'
    },
    {
      id: 'qa-contact',
      title: 'Contact Office',
      description: 'Phone, Email & Directions',
      icon: PhoneCall,
      page: 'contact',
      href: '#contact',
      badge: 'Palappuram',
      badgeColor: 'bg-amber-100 text-amber-800'
    }
  ];

  return (
    <section id="quick-access" className="py-6 sm:py-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-800 dark:bg-amber-400 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Quick Institutional Navigation
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Direct Jump</span>
        </div>

        {/* Responsive Grid: 2 columns on phones, 4 on tablet, 8 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5">
          {actions.map((item) => {
            const Icon = item.icon;
            if (item.actionType === 'login') {
              return (
                <button
                  key={item.id}
                  onClick={onLoginClick}
                  className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-amber-400/50 hover:shadow-sm transition-all duration-150 text-left flex flex-col justify-between group active:scale-97 min-h-[84px] sm:min-h-[90px] cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-1 sm:p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 group-hover:bg-rose-900 group-hover:text-white dark:group-hover:bg-amber-400 dark:group-hover:text-slate-950 transition-colors">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className={`text-[8.5px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded ${item.badgeColor} dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-700`}>
                      {item.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-900 dark:group-hover:text-amber-300 transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            }

            if (item.page && onNavigate) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.page!)}
                  className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-amber-400/50 hover:shadow-sm transition-all duration-150 text-left flex flex-col justify-between group active:scale-97 min-h-[84px] sm:min-h-[90px] cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-1 sm:p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-rose-900 group-hover:text-white dark:group-hover:bg-amber-400 dark:group-hover:text-slate-950 transition-colors">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className={`text-[8.5px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded ${item.badgeColor} dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-700`}>
                      {item.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-900 dark:group-hover:text-amber-300 transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            }

            return (
              <a
                key={item.id}
                href={item.href}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-amber-400/50 hover:shadow-sm transition-all duration-150 text-left flex flex-col justify-between group active:scale-97 min-h-[90px]"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-rose-900 group-hover:text-white dark:group-hover:bg-amber-400 dark:group-hover:text-slate-950 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.badgeColor} dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-700`}>
                    {item.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-900 dark:group-hover:text-amber-300 transition-colors leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
