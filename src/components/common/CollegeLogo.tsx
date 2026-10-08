import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const COLLEGE_LOGO_WHITE = 'https://i.postimg.cc/9zqN2gWg/image.png';
export const COLLEGE_LOGO_DARK = 'https://i.postimg.cc/0rJHvX8W/1000350739-removebg-preview.png';

interface CollegeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge' | 'light' | 'dark' | 'header' | 'white' | 'dark-outline';
  className?: string;
  showSubtitle?: boolean;
  subtitle?: string;
  logoTheme?: 'white' | 'dark' | 'auto';
}

export const CollegeLogo: React.FC<CollegeLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showSubtitle = true,
  subtitle = "ACCREDITED WITH 'A' GRADE BY NAAC",
  logoTheme = 'auto'
}) => {
  let isContextDark = false;
  try {
    const themeContext = useTheme();
    isContextDark = themeContext.resolvedTheme === 'dark';
  } catch {
    // If rendered outside ThemeProvider
    isContextDark = false;
  }

  const sizeMap = {
    xs: { img: 'w-6 h-6', text: 'text-xs', sub: 'text-[9px]' },
    sm: { img: 'w-7 h-7 sm:w-8 sm:h-8', text: 'text-xs sm:text-sm', sub: 'text-[9px] sm:text-[10px]' },
    md: { img: 'w-9 h-9 sm:w-10 sm:h-10', text: 'text-sm sm:text-base', sub: 'text-[10px] sm:text-xs' },
    lg: { img: 'w-12 h-12 sm:w-14 sm:h-14', text: 'text-lg sm:text-xl', sub: 'text-xs' },
    xl: { img: 'w-16 h-16 sm:w-20 sm:h-20', text: 'text-xl sm:text-2xl', sub: 'text-sm' }
  };

  const dim = sizeMap[size];

  // Determine if it's placed on a dark background or light background
  const isDarkTheme =
    logoTheme === 'white' ||
    variant === 'dark' ||
    variant === 'header' ||
    variant === 'white' ||
    (logoTheme === 'auto' && isContextDark);

  const logoSrc = isDarkTheme ? COLLEGE_LOGO_WHITE : COLLEGE_LOGO_DARK;

  const LogoImage = (
    <img
      src={logoSrc}
      alt="NSS College Ottapalam Logo"
      referrerPolicy="no-referrer"
      className={`${dim.img} object-contain shrink-0 select-none drop-shadow-xs transition-transform duration-200`}
    />
  );

  const hasDisplayOverride = className && /\b(hidden|block|inline-block|flex|inline-flex|grid)\b/.test(className);
  const displayClass = hasDisplayOverride ? '' : 'inline-flex';

  if (variant === 'icon') {
    return <div className={`${displayClass} items-center justify-center shrink-0 ${className}`.trim()}>{LogoImage}</div>;
  }

  return (
    <div className={`${displayClass} items-center gap-1.5 sm:gap-2.5 min-w-0 ${className}`.trim()}>
      {LogoImage}
      <div className="flex flex-col justify-center leading-tight min-w-0">
        <div className="flex items-baseline gap-1 sm:gap-1.5 min-w-0">
          <span
            className={`font-black tracking-normal sm:tracking-tight uppercase font-display ${dim.text} ${
              isDarkTheme ? 'text-white' : 'text-slate-900'
            } truncate`}
          >
            NSS College
          </span>
          <span
            className={`font-bold sm:font-extrabold uppercase tracking-wide sm:tracking-wider text-[9.5px] sm:text-xs ${
              isDarkTheme ? 'text-amber-300' : 'text-rose-900'
            } shrink-0`}
          >
            Ottapalam
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`hidden sm:block font-semibold tracking-wider uppercase text-[9px] sm:text-[10px] truncate ${
              isDarkTheme ? 'text-amber-300/80' : 'text-rose-900/80'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
