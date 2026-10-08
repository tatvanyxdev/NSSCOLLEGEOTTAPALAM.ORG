import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Badge Component
export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'outline';
  className?: string;
  size?: 'sm' | 'md';
}> = ({ children, variant = 'default', className, size = 'md' }) => {
  const variantStyles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
    info: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
    outline: 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
  };

  const sizeStyles = {
    sm: 'text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide',
    md: 'text-xs font-bold px-2.5 py-1'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border whitespace-nowrap transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

// Modal Wrapper Component
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className={cn(
          'w-full max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 overflow-hidden transform transition-all',
          maxWidth
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight truncate">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto text-slate-900 dark:text-slate-100">{children}</div>
      </div>
    </div>
  );
};

// Stat Card
export const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: string; isPositive: boolean };
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';
  onClick?: () => void;
}> = ({ title, value, subtitle, icon, trend, color = 'blue', onClick }) => {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
    rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200',
        onClick && 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-500'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 truncate">{subtitle}</p>}
          {trend && (
            <p className={cn('text-[11px] font-semibold mt-1 flex items-center gap-1', trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg border shrink-0', colorMap[color])}>{icon}</div>
      </div>
    </div>
  );
};

