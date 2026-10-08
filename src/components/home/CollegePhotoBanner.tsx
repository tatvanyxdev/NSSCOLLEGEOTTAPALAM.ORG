import React from 'react';
import {
  Trees,
  Maximize2,
  MapPin,
  Award,
  Building2,
  ShieldCheck,
  GraduationCap,
  Calendar,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { COLLEGE_INFO, COLLEGE_PHOTO_URL } from '../../config/collegeInfo';

interface CollegePhotoBannerProps {
  onOpenLightbox?: () => void;
}

export const CollegePhotoBanner: React.FC<CollegePhotoBannerProps> = ({ onOpenLightbox }) => {
  return (
    <section className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-rose-950/40 relative overflow-hidden py-8 sm:py-12 text-slate-900 dark:text-white transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Banner Section Header with Official Institutional Framing */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5 text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-400/10 dark:border-amber-400/30 dark:text-amber-300 text-[9px] sm:text-xs font-mono font-bold tracking-wider uppercase mb-1.5 border">
              <Trees className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-700 dark:text-amber-300" />
              <span>41-ACRE VERDANT BIODIVERSITY CAMPUS</span>
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-snug">
              The Heritage Campus of N.S.S. College, Ottapalam
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 font-light mt-1">
              Established on 10 July 1961 • Affiliated to the University of Calicut • Accredited with 'A' Grade by NAAC
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-amber-800 dark:text-amber-300 font-mono text-[11px] sm:text-xs shadow-2xs dark:shadow-none">
              <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Palappuram P.O., Ottapalam</span>
            </span>
          </div>
        </div>

        {/* High-Resolution Heritage Campus Panorama Card */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-slate-950 border border-amber-400/30 group">
          <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] min-h-[250px] sm:min-h-[300px] max-h-[520px]">
            <img
              src={COLLEGE_PHOTO_URL}
              alt="N.S.S. College Ottapalam Main Campus Heritage Building Panorama"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[center_32%] group-hover:scale-101 transition-transform duration-700 select-none filter contrast-105"
              loading="eager"
            />

            {/* Subtle atmospheric vignette gradient (keeps building clearly visible while ensuring text contrast) */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/40 pointer-events-none" />

            {/* Top Left Statutory Ribbon */}
            <div className="absolute top-2.5 left-2.5 sm:top-6 sm:left-6 flex flex-wrap items-center gap-1.5 sm:gap-2 pointer-events-none">
              <span className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-slate-950/90 backdrop-blur-md rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-amber-300 border border-amber-400/40 flex items-center gap-1 sm:gap-1.5 shadow-lg">
                <Award className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-300" />
                <span>NAAC Re-accredited Grade 'A' (Cycle 3 • 3.24 CGPA)</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-xl text-xs font-semibold text-slate-200 border border-slate-800">
                UGC 2(f) & 12(B) Recognized
              </span>
              <span className="hidden md:inline-flex items-center px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-xl text-xs font-semibold text-slate-200 border border-slate-800">
                Affiliated to the University of Calicut
              </span>
            </div>

            {/* Bottom Caption Overlay & Full-Resolution Lightbox Action */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4">
              <div className="bg-slate-950/90 backdrop-blur-md p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-amber-400/30 max-w-2xl text-left shadow-2xl">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[8.5px] sm:text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest">
                  <Building2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  <span>CENTRAL HERITAGE ACADEMIC BLOCK</span>
                </div>
                <h3 className="text-xs sm:text-lg md:text-xl font-bold text-white font-display mt-0.5 sm:mt-1">
                  N.S.S. College, Ottapalam
                </h3>
                <p className="text-[10.5px] sm:text-xs text-slate-300 mt-0.5 sm:mt-1 leading-relaxed font-light line-clamp-2 sm:line-clamp-none">
                  Spanning 41 serene acres in Palappuram, offering 19 Four-Year Undergraduate Honours and Postgraduate Masters degrees under the University of Calicut, with advanced DST-FIST research laboratories and automated Central Library.
                </p>
                <div className="mt-1.5 pt-1.5 sm:mt-2.5 sm:pt-2 border-t border-slate-800 flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-1 text-[9.5px] sm:text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-amber-300" />
                    <span>Inaugurated 10 July 1961</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-amber-300" />
                    <span>Nair Service Society</span>
                  </span>
                  <span className="hidden xs:flex items-center gap-1">
                    <GraduationCap className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-amber-300" />
                    <span>Calicut Centre 26</span>
                  </span>
                </div>
              </div>

              {onOpenLightbox && (
                <button
                  type="button"
                  onClick={onOpenLightbox}
                  className="px-3 py-2 sm:px-5 sm:py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 dark:text-slate-950 font-black rounded-xl text-[11px] sm:text-sm shadow-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 shrink-0 cursor-pointer min-h-[36px] sm:min-h-[48px]"
                  title="Expand high-resolution full-screen campus panorama"
                >
                  <Maximize2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-950 dark:text-slate-950" />
                  <span>View Campus Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Verified Statutory Institutional Pillars Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-left">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex items-start gap-3 shadow-2xs dark:shadow-none">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 shrink-0">
              <Trees className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">Eco Campus</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">41-Acre Biodiversity</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Palappuram, Valluvanad</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex items-start gap-3 shadow-2xs dark:shadow-none">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-400/10 text-rose-700 dark:text-rose-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">Central Library</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">55,000+ Print Volumes</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">DELNET & N-LIST Digital</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex items-start gap-3 shadow-2xs dark:shadow-none">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">Statutory Status</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">UGC 2(f) & 12(B)</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Govt.-Aided Institution</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex items-start gap-3 shadow-2xs dark:shadow-none">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-400/10 text-blue-700 dark:text-blue-400 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">Affiliation</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">University of Calicut</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">FYUGP Honours 2024-28</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
