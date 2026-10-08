import React, { useState } from 'react';
import { Quote, Award, ChevronRight, X, UserCheck, ZoomIn, School, Sparkles } from 'lucide-react';
import { COLLEGE_INFO, PRINCIPAL_PHOTO_FALLBACKS } from '../../config/collegeInfo';

export const PrincipalSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhotoZoomOpen, setIsPhotoZoomOpen] = useState(false);
  const { principal } = COLLEGE_INFO;

  // Multi-source fallback list
  const photoSources = [
    principal.photoUrl || '/principal.jpg',
    ...(PRINCIPAL_PHOTO_FALLBACKS || []),
    'https://i.postimg.cc/tYsdMCgr/principal15012025-scaled-(2).jpg',
    'https://i.postimg.cc/Yq3XjvBw/principal15012025-scaled-(2).jpg',
    'https://i.postimg.cc/NBhZJXNL/principal15012025-scaled-(2).jpg'
  ].filter((src, idx, arr) => src && arr.indexOf(src) === idx);

  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [imageHasFailedCompletely, setImageHasFailedCompletely] = useState(false);

  const handleImageError = () => {
    if (currentSourceIndex + 1 < photoSources.length) {
      setCurrentSourceIndex((prev) => prev + 1);
    } else {
      setImageHasFailedCompletely(true);
    }
  };

  const currentPhotoSrc = photoSources[currentSourceIndex];

  return (
    <section className="py-12 sm:py-16 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-rose-950/40 relative overflow-hidden transition-colors duration-200">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 -left-32 w-96 h-96 bg-rose-500/10 dark:bg-rose-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-rose-950 border border-slate-200 dark:border-amber-400/30 p-6 sm:p-10 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Principal Photo & Identity Card */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div
                onClick={() => !imageHasFailedCompletely && setIsPhotoZoomOpen(true)}
                className="w-32 h-40 sm:w-44 sm:h-52 rounded-2xl bg-slate-100 dark:bg-slate-900 p-1.5 shadow-md dark:shadow-2xl mb-3 sm:mb-4 relative flex items-center justify-center border border-slate-200 dark:border-amber-400/40 group cursor-pointer ring-4 ring-amber-400/10"
                title="Click to expand official portrait"
              >
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative">
                  {!imageHasFailedCompletely ? (
                    <>
                      <img
                        key={currentPhotoSrc}
                        src={currentPhotoSrc}
                        alt={`Official Portrait of ${principal.name}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        onError={handleImageError}
                      />
                      <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-1.5 rounded-full bg-slate-900 text-amber-300 shadow-md border border-amber-400/30">
                          <ZoomIn className="w-4 h-4" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-slate-500 dark:text-slate-400 text-center">
                      <UserCheck className="w-12 h-12 mb-1 text-amber-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        {principal.name}
                      </span>
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-2.5 px-2.5 sm:px-3 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md">
                  Principal Desk
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">
                {principal.name}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-rose-900 dark:text-amber-300 mt-0.5">
                {principal.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                N.S.S. College, Ottapalam
              </p>
              <div className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-900/90 rounded-lg text-[10.5px] sm:text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Head of the Institution</span>
              </div>
            </div>

            {/* Principal Quote & Official Statement */}
            <div className="lg:col-span-8 space-y-3.5 sm:space-y-4 text-left">
              <div className="p-1.5 sm:p-2 w-fit bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-400/20">
                <Quote className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <div>
                <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-rose-900 dark:text-amber-300 block mb-0.5 sm:mb-1">
                  Institutional Leadership Message
                </span>
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white font-display">
                  From the Principal's Desk
                </h2>
              </div>

              <p className="text-xs sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed italic border-l-2 border-amber-500 pl-3 sm:pl-4 py-0.5 sm:py-1 font-light">
                "{principal.briefMessage}"
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-md hover:from-amber-300 hover:to-amber-400 flex items-center justify-center gap-2 cursor-pointer active:scale-95 min-h-[40px] sm:min-h-[46px]"
                >
                  <span>Read Full Institutional Directive</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </button>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Four Year Undergraduate Programme (FYUGP) & National Education Framework
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Official Letterhead Modal (Modern Executive Theme) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto text-slate-900 dark:text-white">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 dark:border-amber-400/30 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800 relative z-10 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 text-left min-w-0">
                {!imageHasFailedCompletely && (
                  <div className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-amber-500/40 shrink-0">
                    <img
                      src={currentPhotoSrc}
                      alt={principal.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white font-display truncate">
                    Principal's Academic Address
                  </h3>
                  <p className="text-[10px] sm:text-xs text-amber-800 dark:text-amber-300 font-medium font-mono truncate">
                    {principal.name} • {principal.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 sm:py-4 space-y-3 sm:space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed overflow-y-auto pr-1 sm:pr-2 text-left font-normal relative z-10">
              {principal.fullMessage && principal.fullMessage.length > 0 ? (
                principal.fullMessage.map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))
              ) : (
                <p>{principal.briefMessage}</p>
              )}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-950/80 border border-amber-300/40 dark:border-amber-400/20 space-y-2 text-xs">
                <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Strategic Academic Mandates for AY 2026-27</span>
                </div>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
                  <li>Active implementation of Calicut University FYUGP semester credits and outcomes-based evaluation (OBE).</li>
                  <li>Interdisciplinary research encouragement through DST-FIST instrumentation facilities.</li>
                  <li>Campus placement enhancement through industry-aligned vocational certificates and skill development.</li>
                  <li>Upholding secular, inclusive and value-oriented education established by the Nair Service Society.</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 relative z-10">
              <span>Palappuram, Ottapalam • PIN: 679103</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                Close Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Official Portrait Zoom */}
      {isPhotoZoomOpen && !imageHasFailedCompletely && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsPhotoZoomOpen(false)}
        >
          <div className="relative max-w-md w-full bg-slate-900 border border-amber-400/30 rounded-3xl overflow-hidden p-3 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsPhotoZoomOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/80 text-white hover:bg-slate-950 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full aspect-3/4 rounded-2xl overflow-hidden bg-slate-950">
              <img
                src={currentPhotoSrc}
                alt={`Official Portrait of ${principal.name}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="p-3 text-center">
              <h4 className="text-base font-bold text-white">{principal.name}</h4>
              <p className="text-xs text-amber-300 font-mono mt-0.5">{principal.title}</p>
              <p className="text-[11px] text-slate-400">N.S.S. College, Ottapalam</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
