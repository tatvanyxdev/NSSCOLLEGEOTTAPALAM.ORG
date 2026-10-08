import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleSwitchProps {
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Accessible sliding toggle switch for Dark/Light theme
 */
export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  className = '',
  showLabels = true,
  size = 'md'
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const sizeClasses = {
    sm: {
      track: 'w-11 h-6',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5',
      icon: 'w-2.5 h-2.5'
    },
    md: {
      track: 'w-14 h-7.5',
      thumb: 'w-5.5 h-5.5',
      translate: 'translate-x-6.5',
      icon: 'w-3 h-3'
    },
    lg: {
      track: 'w-16 h-8.5',
      thumb: 'w-6.5 h-6.5',
      translate: 'translate-x-7.5',
      icon: 'w-3.5 h-3.5'
    }
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabels && (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 select-none flex items-center gap-1">
          {isDark ? (
            <>
              <Moon className="w-3.5 h-3.5 text-amber-300" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </>
          )}
        </span>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Currently in ${isDark ? 'Dark' : 'Light'} mode. Click to switch to ${isDark ? 'Light' : 'Dark'} mode.`}
        onClick={toggleTheme}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleTheme();
          }
        }}
        className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border ${
          sizeClasses.track
        } ${
          isDark
            ? 'bg-slate-900 border-amber-500/40 shadow-inner'
            : 'bg-amber-100/80 border-amber-300 shadow-inner'
        }`}
      >
        {/* Background icons inside track */}
        <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
          <Sun className={`${sizeClasses.icon} text-amber-600 transition-opacity duration-200 ${isDark ? 'opacity-30' : 'opacity-100'}`} />
          <Moon className={`${sizeClasses.icon} text-amber-300 transition-opacity duration-200 ${isDark ? 'opacity-100' : 'opacity-30'}`} />
        </div>

        {/* Sliding Thumb */}
        <span
          className={`pointer-events-none inline-flex items-center justify-center rounded-full shadow-md transform transition-transform duration-300 ease-spring ${
            sizeClasses.thumb
          } ${
            isDark
              ? `${sizeClasses.translate} bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950`
              : 'translate-x-0 bg-white text-amber-500'
          }`}
        >
          {isDark ? (
            <Moon className={`${sizeClasses.icon} text-slate-950`} />
          ) : (
            <Sun className={`${sizeClasses.icon} text-amber-500`} />
          )}
        </span>
      </button>
    </div>
  );
};

interface ThemeToggleButtonProps {
  className?: string;
  variant?: 'ghost' | 'outline' | 'pill';
  size?: 'sm' | 'md';
}

/**
 * Compact icon button for headers, drawers and toolbars
 */
export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  className = '',
  variant = 'outline',
  size = 'md'
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400';
  
  const sizeStyles = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';

  const variantStyles = {
    ghost: isDark
      ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-800'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    outline: isDark
      ? 'bg-slate-900/90 text-amber-300 border border-slate-700/80 hover:border-amber-400/50 hover:bg-slate-800 shadow-2xs'
      : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-400 hover:bg-slate-50 shadow-2xs',
    pill: isDark
      ? 'bg-slate-800 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-full font-bold gap-1.5'
      : 'bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full font-bold gap-1.5'
  }[variant];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Toggle theme: currently ${isDark ? 'Dark' : 'Light'}`}
      title={`Toggle Theme (Current: ${isDark ? 'Dark' : 'Light'})`}
      onClick={toggleTheme}
      className={`${baseStyles} ${variant === 'pill' ? '' : sizeStyles} ${variantStyles} ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 hover:text-amber-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
      {variant === 'pill' && (
        <span className="text-xs">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      )}
    </button>
  );
};

/**
 * Subtle floating quick toggle button fixed at bottom-right corner for effortless access everywhere
 */
export const FloatingThemeToggle: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <aside
      aria-label="Theme quick switcher"
      className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 select-none print:hidden pointer-events-auto"
    >
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch theme to ${isDark ? 'light' : 'dark'} mode`}
        title={`Theme Switcher: currently ${isDark ? 'Dark Mode' : 'Light Mode'}. Click to toggle.`}
        onClick={toggleTheme}
        className="group flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-lg hover:shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <span className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-400/20 text-amber-500 dark:text-amber-300 shrink-0">
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </span>
        <span className="hidden md:inline text-xs font-bold tracking-tight text-slate-700 dark:text-slate-200">
          {isDark ? 'Light' : 'Dark'}
        </span>
      </button>
    </aside>
  );
};
