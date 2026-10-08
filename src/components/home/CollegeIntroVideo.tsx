import React, { useRef, useEffect, useState, useCallback } from 'react';
import { COLLEGE_PHOTO_URL, COLLEGE_INFO } from '../../config/collegeInfo';

interface CollegeIntroVideoProps {
  className?: string;
}

export const CollegeIntroVideo: React.FC<CollegeIntroVideoProps> = ({ className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Playback & Buffering State (Completely Automated - No User Controls)
  const [showFallbackBanner, setShowFallbackBanner] = useState<boolean>(false);

  const bufferTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearBufferingTimer = useCallback(() => {
    if (bufferTimerRef.current) {
      clearTimeout(bufferTimerRef.current);
      bufferTimerRef.current = null;
    }
  }, []);

  // Buffer countdown: if playback does not start/resume within 3.5s, show college banner
  const startBufferingCountdown = useCallback((thresholdMs: number = 3500) => {
    clearBufferingTimer();
    bufferTimerRef.current = setTimeout(() => {
      setShowFallbackBanner(true);
    }, thresholdMs);
  }, [clearBufferingTimer]);

  const attemptPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Enforce strictly muted forever
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;

    startBufferingCountdown(3500);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          clearBufferingTimer();
          setShowFallbackBanner(false);
        })
        .catch((err) => {
          console.debug('[CollegeIntroVideo] Autoplay note:', err);
        });
    }
  }, [startBufferingCountdown, clearBufferingTimer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Always give first priority to video playback (strictly muted forever)
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    attemptPlay();

    // Event: Video is actively playing frames
    const handlePlaying = () => {
      clearBufferingTimer();
      setShowFallbackBanner(false);
    };

    // Event: Video playback is progressing
    const handleTimeUpdate = () => {
      if (video.currentTime > 0.1 && !video.paused) {
        clearBufferingTimer();
        setShowFallbackBanner(false);
      }
    };

    // Event: Video stalled or waiting for data buffer
    const handleWaiting = () => {
      startBufferingCountdown(3500);
    };

    const handleStalled = () => {
      startBufferingCountdown(3500);
    };

    // Event: Enough data has arrived to play through
    const handleCanPlayThrough = () => {
      video.muted = true;
      video.volume = 0;
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    // Event: Video stream error
    const handleError = () => {
      clearBufferingTimer();
      setShowFallbackBanner(true);
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('error', handleError);

    return () => {
      clearBufferingTimer();
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('error', handleError);
    };
  }, [attemptPlay, clearBufferingTimer, startBufferingCountdown]);

  return (
    <div
      id="college-intro-video-section"
      className={`relative w-full bg-slate-50 dark:bg-slate-950 overflow-hidden select-none pointer-events-none transition-colors duration-200 ${className}`}
    >
      <div className="relative w-full max-w-7xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-0 sm:py-2">
        <div className="relative w-full aspect-video overflow-hidden sm:rounded-3xl bg-slate-950 shadow-2xl">
          
          {/* ========================================================================= */}
          {/* 1. ACTUAL HOSTED COLLEGE VIDEO (FIRST PRIORITY, STRICTLY MUTED FOREVER)   */}
          {/* ========================================================================= */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover select-none pointer-events-none"
            onError={() => setShowFallbackBanner(true)}
          >
            <source
              src="https://college-erp3748.web.app/lv_0_20260918230325.mp4"
              type="video/mp4"
            />
          </video>

          {/* ========================================================================= */}
          {/* 2. COLLEGE BANNER / PHOTO OVERLAY (AUTOMATICALLY REPLACES WHEN BUFFERING) */}
          {/* ========================================================================= */}
          <div
            className={`absolute inset-0 z-20 transition-opacity duration-700 ease-in-out pointer-events-none ${
              showFallbackBanner ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* High-Resolution Heritage College Photo Banner */}
            <img
              src={COLLEGE_PHOTO_URL}
              alt="N.S.S. College Ottapalam Heritage Campus Panorama"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[center_32%] select-none filter contrast-105"
            />

            {/* Subtle Gradient Scrim on Photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/30 pointer-events-none" />

            {/* Quiet Institutional Overlay on Banner (No User Controls) */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-8 z-10 text-left pointer-events-none">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full bg-slate-950/80 border border-amber-400/40 text-amber-300 text-[8.5px] xs:text-[9.5px] sm:text-xs font-mono font-bold backdrop-blur-md shadow-lg">
                  N.S.S. COLLEGE OTTAPALAM
                </span>

                <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 text-xs font-mono backdrop-blur-md">
                  EST. 1961 • PALAPPURAM, KERALA
                </span>
              </div>

              <div className="max-w-xl space-y-0.5 sm:space-y-1">
                <h3 className="text-xs xs:text-sm sm:text-2xl lg:text-3xl font-black text-white font-display">
                  {COLLEGE_INFO.collegeName}
                </h3>
                <p className="text-[9.5px] xs:text-[10px] sm:text-sm text-slate-200 font-light leading-snug line-clamp-1 sm:line-clamp-none">
                  Affiliated to the University of Calicut • Accredited with 'A' Grade by NAAC (Cycle 3, 3.24 CGPA)
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. DEEP OPTICAL VIGNETTES: ORGANIC BLEND INTO APP'S SLATE-950 CANVAS       */}
          {/* ========================================================================= */}
          <div className="absolute inset-x-0 top-0 h-16 sm:h-28 md:h-36 bg-gradient-to-b from-slate-950 via-slate-950/60 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-20 sm:h-32 md:h-44 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 left-0 w-8 sm:w-20 md:w-32 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-8 sm:w-20 md:w-32 bg-gradient-to-l from-slate-950 via-slate-950/40 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,6,23,0.7)_100%)] pointer-events-none z-10" />
        </div>
      </div>
    </div>
  );
};

export default CollegeIntroVideo;
