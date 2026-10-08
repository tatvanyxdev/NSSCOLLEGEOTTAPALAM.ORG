import React, { useState } from 'react';
import { Landmark, Compass, Award, BookOpen, ChevronRight, X, Sparkles, HeartHandshake } from 'lucide-react';
import { COLLEGE_INFO } from '../../config/collegeInfo';

export const AboutSection: React.FC = () => {
  const [isReadMoreOpen, setIsReadMoreOpen] = useState(false);

  return (
    <section id="about" className="py-12 sm:py-16 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-rose-50 text-rose-900 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2 border border-rose-200">
            <Landmark className="w-3.5 h-3.5" />
            <span>Heritage & Vision</span>
          </div>
          <h2 className="text-lg sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display leading-tight">
            About {COLLEGE_INFO.collegeName}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-2.5 leading-relaxed">
            N.S.S. College, Ottapalam is an Arts and Science college under the management of the Nair Service Society (NSS) and affiliated to the University of Calicut. Established in 1961, the institution has nurtured an illustrious legacy of academic rigor, value-based character building, and community empowerment.
          </p>
        </div>

        {/* 3 Core Identity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Motto Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-slate-900 border border-amber-200/80 dark:border-amber-500/30 shadow-2xs dark:shadow-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 bg-white dark:bg-slate-800 rounded-xl text-amber-900 dark:text-amber-300 shadow-2xs border border-amber-200 dark:border-amber-500/30">
                  <Compass className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  College Motto
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
                "{COLLEGE_INFO.motto}"
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-amber-200/90 italic mt-1 font-medium">
                "{COLLEGE_INFO.mottoMeaning}"
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                The eternal beacon guiding ethical inquiry, personal integrity, and dedicated pursuit of wisdom across every field of study.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-slate-800 text-[11px] font-bold text-amber-900 dark:text-amber-300">
              Scriptural Latin Inscription
            </div>
          </div>

          {/* Vision Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/20 dark:to-slate-900 border border-rose-200/80 dark:border-rose-500/30 shadow-2xs dark:shadow-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 bg-white dark:bg-slate-800 rounded-xl text-rose-900 dark:text-rose-300 shadow-2xs border border-rose-200 dark:border-rose-500/30">
                  <Sparkles className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Institutional Vision
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
                "{COLLEGE_INFO.vision}"
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-rose-200/90 mt-1 font-medium">
                Tamaso ma jyotirgamaya
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                Transforming young minds from ignorance to illumination through modern scientific education, critical humanities, and ethical social responsibility.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-rose-200/60 dark:border-slate-800 text-[11px] font-bold text-rose-900 dark:text-rose-300">
              Egalitarian Enlightenment
            </div>
          </div>

          {/* Accreditation & Governance */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-slate-900 border border-blue-200/80 dark:border-blue-500/30 shadow-2xs dark:shadow-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 bg-white dark:bg-slate-800 rounded-xl text-blue-900 dark:text-blue-300 shadow-2xs border border-blue-200 dark:border-blue-500/30">
                  <Award className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  Accreditation & Heritage
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display">
                {COLLEGE_INFO.accreditationFull}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-blue-200/90 mt-1 font-medium">
                Affiliated to University of Calicut
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                Managed by the Nair Service Society, providing transparent governance and active community service on a serene 41-acre campus in Palappuram.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-slate-800 text-[11px] font-bold text-blue-900 dark:text-blue-300">
              NAAC Accredited Institution
            </div>
          </div>
        </div>

        {/* Founder Showcase & Read More Bar */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-slate-800">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="p-3 bg-white/10 rounded-xl text-amber-300 border border-white/10 shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  Founder & Visionary
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400">Nair Service Society</span>
              </div>
              <h3 className="text-base sm:text-xl font-extrabold text-white font-display">
                {COLLEGE_INFO.founder.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {COLLEGE_INFO.founder.summary} Formally inaugurated on <strong className="text-amber-300 font-bold">{COLLEGE_INFO.inaugurationDate}</strong> to extend higher learning opportunities to all sections of society.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReadMoreOpen(true)}
            className="w-full md:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95 min-h-[44px]"
          >
            <BookOpen className="w-4 h-4 text-slate-950" />
            <span>Read Institutional Profile</span>
            <ChevronRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>

      {/* Read More Modal */}
      {isReadMoreOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 rounded-lg">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                    {COLLEGE_INFO.collegeName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Palakkad – Ponnani Road, Palappuram P O, Kerala
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReadMoreOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close Profile Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-800" />
                  Historical Foundation (10 July 1961)
                </h4>
                <p>
                  N.S.S. College, Ottapalam was formally inaugurated on <strong>10 July 1961</strong>. Founded through the visionary initiative of <strong>Bharatha Kesari Sri. Mannath Padmanabhan</strong>, the institution was established under the stewardship of the <strong>Nair Service Society (NSS)</strong> with the noble mission of uplifting rural and semi-urban communities by democratizing access to quality higher education.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-800" />
                  College Motto: "Lucerna Pedibus Meis"
                </h4>
                <p>
                  The college motto, <em>"Lucerna Pedibus Meis"</em> (translating to <em>"Thy word is a lamp unto my feet"</em>), encapsulates the conviction that truth, disciplined learning, and ethical moral character form the indispensable guiding lamp on every scholar’s path through life.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-800" />
                  Institutional Vision: "Lead me from darkness to Light"
                </h4>
                <p>
                  Inspired by the timeless Upanishadic invocation <em>"Tamaso ma jyotirgamaya"</em>, the college envisions eradicating the darkness of ignorance, inequality, and complacency by fostering enlightened scholarship, modern critical thinking, and social benevolence.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-800" />
                  41-Acre Scenic Green Campus
                </h4>
                <p>
                  The college is blessed with an expansive 41-acre campus situated in the tranquil Palappuram area along the Palakkad-Ponnani Road. The campus combines natural botanical greenery, open athletic expanses, automated library resources, and specialized computational laboratories.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-800" />
                  NAAC Grade A & University Affiliation
                </h4>
                <p>
                  Affiliated to the University of Calicut and accredited with 'A' Grade by NAAC, the college presently offers 13 Undergraduate programmes and 6 Postgraduate programmes, serving as an active regional hub for Kerala's Four Year Undergraduate Programme (FYUGP).
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsReadMoreOpen(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold rounded-xl text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
