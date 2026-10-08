import React, { useState, useEffect, useRef } from 'react';
import {
  LogIn,
  ArrowRight,
  GraduationCap,
  Award,
  Trees,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { COLLEGE_PHOTO_URL } from '../../config/collegeInfo';

interface CampusPhotoSectionProps {
  onLoginClick: () => void;
}

export const CampusPhotoSection: React.FC<CampusPhotoSectionProps> = ({ onLoginClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Swipe support for mobile viewports
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const slides = [
    {
      id: 'main-heritage',
      image: COLLEGE_PHOTO_URL,
      caption: 'Main Academic Heritage Building • Central Administrative Portico',
      badge: 'Heritage Campus Building',
      objectPos: 'object-[center_28%]'
    },
    {
      id: 'library-wing',
      image: '/assets/library-facade.jpg',
      caption: 'Central Library & Learning Resource Center (55,000+ Volumes)',
      badge: 'Knowledge Hub',
      objectPos: 'object-[center_35%]'
    },
    {
      id: 'science-complex',
      image: '/assets/science-lab.jpg',
      caption: 'DST-FIST Supported Advanced Scientific Research Laboratories',
      badge: 'DST-FIST Research',
      objectPos: 'object-[center_40%]'
    },
    {
      id: 'campus-greens',
      image: '/assets/campus-trees.jpg',
      caption: '41-Acre Lush Green Biodiversity Campus in Palappuram, Valluvanad',
      badge: 'Eco-Green Campus',
      objectPos: 'object-[center_30%]'
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      handleNextSlide();
    } else if (distance < -50) {
      handlePrevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="relative bg-slate-950 text-white overflow-hidden border-y border-slate-200 dark:border-rose-950/40">
      {/* ========================================================================= */}
      {/* MAJESTIC SLIDING COLLEGE PHOTO CAROUSEL (Preserved As Like That Only)       */}
      {/* ========================================================================= */}
      <div
        className="relative w-full overflow-hidden bg-slate-950 group select-none min-h-[360px] xs:min-h-[420px] sm:min-h-[500px] md:min-h-[560px] lg:min-h-[620px] flex items-end"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Viewport */}
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* College Campus Photo - Vivid, Crisp and Completely Visible */}
              <img
                src={slide.image}
                alt={`NSS College Ottapalam - ${slide.caption}`}
                className={`w-full h-full object-cover ${slide.objectPos} filter contrast-[103%] brightness-[95%] transition-transform duration-7000 ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
                loading={index === 0 ? 'eager' : 'lazy'}
              />

              {/* Subtle Gradient Scrim at bottom to keep text legible without blocking the building */}
              <div className="absolute inset-x-0 bottom-0 h-44 sm:h-52 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/50 to-transparent pointer-events-none" />
            </div>
          );
        })}

        {/* Content Overlay Docked at bottom so the college building is clearly visible */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-3.5 sm:pb-6">
          <div className="max-w-2xl space-y-1.5 sm:space-y-2">
            
            {/* Main Institutional Heading: NSS COLLEGE OTTAPALAM */}
            <div>
              <h2 className="text-lg xs:text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-wide sm:tracking-normal text-white font-display uppercase leading-snug drop-shadow-md">
                NSS COLLEGE OTTAPALAM
              </h2>
            </div>

            {/* VERY SMALL UNDER COLLEGE NAME - Does not block college photo */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Tagline: ACCREDITED WITH 'A' GRADE BY NAAC (Very Small) */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 dark:text-slate-950 font-black text-[8px] xs:text-[9px] sm:text-[11px] tracking-wide uppercase shadow-sm">
                <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-950 dark:text-slate-950 shrink-0" />
                <span>ACCREDITED WITH 'A' GRADE BY NAAC</span>
              </div>

              {/* Affiliated to University of Calicut (Very Small) */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 border border-white/20 text-slate-200 text-[8px] xs:text-[9px] sm:text-[11px] font-medium backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>Affiliated to University of Calicut</span>
              </div>
            </div>

            {/* Action Buttons: Compact row on mobile */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
              <button
                type="button"
                onClick={onLoginClick}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 dark:text-slate-950 font-bold rounded-lg text-[11px] sm:text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer min-h-[32px] sm:min-h-[38px]"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-950 dark:text-slate-950" />
                <span>Login to ERP Portal</span>
                <ArrowRight className="w-3 h-3 text-slate-950 dark:text-slate-950" />
              </button>

              <a
                href="#academic-excellence"
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-slate-900/85 hover:bg-slate-800 text-white rounded-lg text-[11px] sm:text-xs font-medium border border-white/20 transition-all flex items-center justify-center gap-1.5 min-h-[32px] sm:min-h-[38px] backdrop-blur-sm"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>Academic Honours</span>
              </a>
            </div>

          </div>
        </div>

        {/* Carousel Slide Left / Right Navigation Arrows */}
        <button
          type="button"
          onClick={handlePrevSlide}
          aria-label="Previous Slide"
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-950/70 hover:bg-amber-400 text-white hover:text-slate-950 border border-white/20 hover:border-amber-400 flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-2xl cursor-pointer active:scale-90"
        >
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>

        <button
          type="button"
          onClick={handleNextSlide}
          aria-label="Next Slide"
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-950/70 hover:bg-amber-400 text-white hover:text-slate-950 border border-white/20 hover:border-amber-400 flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-2xl cursor-pointer active:scale-90"
        >
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>
      </div>
    </section>
  );
};
