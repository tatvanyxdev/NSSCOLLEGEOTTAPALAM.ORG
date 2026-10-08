import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Menu
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMore: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMore
}) => {
  const { activeRole } = useAuth();
  const isStudent = activeRole === 'student';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'attendance',
      label: isStudent ? 'Radar' : 'Attendance',
      icon: CalendarCheck,
      badge: null
    },
    {
      id: 'timetable',
      label: 'Timetable',
      icon: Clock,
      badge: null
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
      action: onOpenMore,
      badge: null
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/92 backdrop-blur-xl border-t border-slate-800/80 safe-area-bottom shadow-[0_-8px_30px_rgba(0,0,0,0.35)]">
      <div className="grid grid-cols-4 h-16 text-[10px] font-bold px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const handleClick = item.action ? item.action : () => onSelectTab(item.id);

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all py-1 min-h-[48px] cursor-pointer ${
                isActive
                  ? 'text-amber-300 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Pill Glow Indicator */}
              {isActive && (
                <span className="absolute top-1 w-8 h-1 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              )}
              
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-amber-400/15 text-amber-300' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-300 scale-110' : 'text-slate-400'}`} />
              </div>
              <span className="tracking-tight text-[10.5px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
