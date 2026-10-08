import React from 'react';
import {
  Trophy,
  Award,
  FlaskConical,
  Briefcase,
  Building,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Clock,
  Bus,
  FileText,
  ArrowRight
} from 'lucide-react';
import { CollegeIntroVideo } from './CollegeIntroVideo';

interface HeroSectionProps {
  onLoginClick: () => void;
  onOpenPhotoLightbox?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLoginClick
}) => {
  const officialNotices = [
    {
      date: '18 SEP',
      year: '2026',
      tag: 'EXAMINATION',
      title: 'Calicut University FYUGP S1 & S3 Semester Exam Registration Schedule & Fee Notice',
      isNew: true
    },
    {
      date: '14 SEP',
      year: '2026',
      tag: 'SCHOLARSHIPS',
      title: 'Govt. of Kerala Post-Matric & E-Grants 3.0 Fee Concession Renewal for SC/ST/OEC/OBC',
      isNew: true
    },
    {
      date: '11 SEP',
      year: '2026',
      tag: 'ACADEMIC',
      title: 'Internal Quality Assurance Cell (IQAC): Departmental OBE Curriculum Audit 2026-27',
      isNew: false
    },
    {
      date: '06 SEP',
      year: '2026',
      tag: 'CAREER',
      title: 'Career Guidance & Placement Cell: On-Campus Drive by Federal Bank Ltd for Final Years',
      isNew: false
    },
    {
      date: '01 SEP',
      year: '2026',
      tag: 'LIBRARY',
      title: 'Central Library: DELNET & INFLIBNET N-LIST E-Journals User ID Activation Drive',
      isNew: false
    }
  ];

  const marqueeItems = [
    {
      icon: Award,
      label: "National Assessment & Accreditation Council (NAAC): Re-accredited Grade 'A' (Cycle 3 • CGPA 3.24)"
    },
    {
      icon: Trophy,
      label: "University of Calicut Merit: 1st Rank & Gold Medal in M.Sc. Mathematics (Official Roll of Honour)"
    },
    {
      icon: GraduationCap,
      label: "Four-Year Undergraduate Programme (FYUGP Honours 2024–2028): Affiliated to the University of Calicut"
    },
    {
      icon: FlaskConical,
      label: "Scientific Research: DST-FIST Supported Advanced Laboratories (Dept. of Science & Technology, Govt. of India)"
    },
    {
      icon: Briefcase,
      label: "Career Guidance Bureau: Recruitment Drives by Federal Bank, TCS, Infosys, Wipro, and ICICI Bank"
    },
    {
      icon: ShieldCheck,
      label: "Statutory UGC Recognition: Recognized under Sections 2(f) and 12(B) of the UGC Act, 1956"
    }
  ];

  return (
    <section className="relative bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-rose-950/40 overflow-hidden transition-colors duration-200">
      {/* Official Accreditations & Statutory Honours Ticker */}
      <div className="relative z-20 w-full bg-slate-100/90 dark:bg-slate-950 border-b border-slate-200 dark:border-amber-500/20 py-1 sm:py-2.5 overflow-hidden transition-colors">
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="animate-marquee flex items-center gap-5 sm:gap-8 text-[10px] sm:text-xs text-slate-600 dark:text-slate-300">
            {[...marqueeItems, ...marqueeItems].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="inline-flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-rose-800 dark:text-amber-300 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                  <span className="text-rose-400 dark:text-amber-500/60 ml-2.5 sm:ml-4 font-mono">•</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BUILT-IN COLLEGE INTRODUCTION VIDEO (16:9 Landscape, Static Bundled)     */}
      {/* ========================================================================= */}
      <CollegeIntroVideo />

      {/* ========================================================================= */}
      {/* INSTITUTIONAL BENTO STATS & NOTICE BULLETIN DESK                         */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
          
          {/* Left Column: Quick Bento Credentials & Overview */}
          <div className="lg:col-span-6 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-gradient-to-br dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-blue-500/30 backdrop-blur-md shadow-xs hover:border-blue-400/60 transition-all hover:-translate-y-0.5 group">
                <span className="text-[8.5px] sm:text-[10px] text-blue-600 dark:text-blue-300 font-bold uppercase tracking-wider block">Affiliation</span>
                <span className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors leading-snug">University of Calicut</span>
                <span className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">Govt.-Aided Institution</span>
              </div>
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-emerald-500/30 backdrop-blur-md shadow-xs hover:border-emerald-400/60 transition-all hover:-translate-y-0.5 group">
                <span className="text-[8.5px] sm:text-[10px] text-emerald-600 dark:text-emerald-300 font-bold uppercase tracking-wider block">Programmes</span>
                <span className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors leading-snug">19 UG & PG Honours</span>
                <span className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">Arts, Science, Commerce</span>
              </div>
              {/* NSS Units 36 & 94 with Official NSS Wheel Logo */}
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-gradient-to-br dark:from-blue-950/50 dark:via-slate-900 dark:to-rose-950/40 border border-slate-200 dark:border-amber-500/30 backdrop-blur-md shadow-xs hover:border-amber-400/60 transition-all hover:-translate-y-0.5 group relative overflow-hidden">
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[8.5px] sm:text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider block">NSS Wing</span>
                    <span className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors leading-snug truncate">NSS Units 36 & 94</span>
                    <span className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-300 block mt-0.5 truncate">Calicut Univ.</span>
                  </div>
                  <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-white/95 p-0.5 sm:p-1 border border-amber-500/40 shadow-xs shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/4/4b/National_Service_Scheme_logo.svg"
                      alt="NSS Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/nss-logo.svg';
                      }}
                      loading="eager"
                    />
                  </div>
                </div>
              </div>
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-gradient-to-br dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-rose-500/30 backdrop-blur-md shadow-xs hover:border-rose-400/60 transition-all hover:-translate-y-0.5 group">
                <span className="text-[8.5px] sm:text-[10px] text-rose-600 dark:text-rose-300 font-bold uppercase tracking-wider block">Management</span>
                <span className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white block mt-0.5 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors leading-snug">Nair Service Society</span>
                <span className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">Founded 1961 by Mannam</span>
              </div>
            </div>

            {/* Campus Fast-Track & Digital Services Hub */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900/95 dark:via-slate-900/85 dark:to-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-400/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 transition-all duration-200 shadow-xs dark:shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="text-[10.5px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wide">
                      Campus Fast-Track & Services
                    </h4>
                    <p className="text-[8.5px] sm:text-[10px] text-slate-500 dark:text-slate-400">
                      Essential portals for students & parents
                    </p>
                  </div>
                </div>
                <span className="text-[8px] sm:text-[9px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Active 24/7
                </span>
              </div>

              {/* 3 Quick Action Service Tiles */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 text-left">
                {/* 1. Attendance & Timetable */}
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/70 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400/40 text-left transition-all group flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                      <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    </span>
                    <ArrowRight className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-900 dark:text-white block group-hover:text-amber-700 dark:group-hover:text-amber-200 transition-colors">
                      Attendance
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                      Hours & timetable
                    </span>
                  </div>
                </button>

                {/* 2. Bus Concession */}
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/70 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-400/40 text-left transition-all group flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      <Bus className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    </span>
                    <ArrowRight className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-900 dark:text-white block group-hover:text-emerald-700 dark:group-hover:text-emerald-200 transition-colors">
                      Bus Pass
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                      Route concession
                    </span>
                  </div>
                </button>

                {/* 3. University Exams & Results */}
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/70 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-rose-400/40 text-left transition-all group flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                      <FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    </span>
                    <ArrowRight className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-900 dark:text-white block group-hover:text-rose-700 dark:group-hover:text-rose-200 transition-colors">
                      Exams & TC
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                      FYUGP & certs
                    </span>
                  </div>
                </button>
              </div>

              {/* Bottom Quick Helpdesk Strip */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span className="truncate">FYUGP Honours (2024–28)</span>
                </div>
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="text-rose-900 hover:text-rose-700 dark:text-amber-300 dark:hover:text-amber-200 font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <span>Portal Login</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Official Notice Board Widget */}
          <div className="lg:col-span-6 w-full">
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-amber-400/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs dark:shadow-2xl backdrop-blur-xl transition-colors">
              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <h3 className="text-[10.5px] sm:text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 truncate">
                    Official College Notices & Circulars
                  </h3>
                </div>
                <span className="text-[8.5px] sm:text-[10px] font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30 shrink-0">
                  AY 2026-27
                </span>
              </div>

              {/* Notice List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-1.5 max-h-[220px] overflow-y-auto pr-1">
                {officialNotices.map((notice, idx) => (
                  <div key={idx} className="py-2 first:pt-1 last:pb-1 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl px-1.5 sm:px-2 transition-colors">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      {/* Date Badge */}
                      <div className="text-center shrink-0 w-10 sm:w-11 bg-rose-50/80 dark:bg-slate-950 border border-rose-200/80 dark:border-slate-800 rounded-lg p-0.5 sm:p-1">
                        <span className="text-[10px] sm:text-[11px] font-black text-rose-700 dark:text-rose-400 leading-none block">
                          {notice.date}
                        </span>
                        <span className="text-[8.5px] sm:text-[9px] text-slate-500 font-mono block">
                          {notice.year}
                        </span>
                      </div>

                      {/* Notice Title & Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8.5px] sm:text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                            {notice.tag}
                          </span>
                          {notice.isNew && (
                            <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[8px] font-bold">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-rose-900 dark:group-hover:text-amber-200 transition-colors line-clamp-2 leading-snug mt-0.5">
                          {notice.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Administrative Desk Footer */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 truncate">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Office: 0466-2244382</span>
                </div>
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="text-rose-900 hover:text-rose-700 dark:text-amber-300 dark:hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer shrink-0 ml-1"
                >
                  <span>Student Portal</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Official Flash Banner */}
      <div className="relative z-10 w-full bg-gradient-to-r from-rose-950 via-slate-950 to-rose-950 text-amber-100 border-t border-rose-900/60 py-2 sm:py-2.5 px-3 sm:px-4 text-[10.5px] sm:text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="px-1.5 sm:px-2 py-0.5 bg-rose-900/90 text-amber-300 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-rose-700/50 shrink-0">
              OFFICIAL FLASH
            </span>
            <span className="text-[10.5px] sm:text-xs font-medium text-slate-200 truncate">
              FYUGP Semester 1 & 3 Attendance condonation and internal evaluation grades uploaded to University of Calicut Examination Portal.
            </span>
          </div>
          <div className="text-[10.5px] sm:text-[11px] text-amber-200/90 shrink-0 hidden md:block">
            UGC Anti-Ragging Toll Free: 1800-180-5522
          </div>
        </div>
      </div>
    </section>
  );
};

