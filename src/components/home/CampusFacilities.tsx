import React, { useState } from 'react';
import {
  Trees,
  BookOpen,
  Activity,
  Wifi,
  HeartHandshake,
  Maximize2,
  X,
  Sparkles,
  ChevronRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { COLLEGE_INFO, COLLEGE_PHOTO_URL } from '../../config/collegeInfo';

export const CampusFacilities: React.FC = () => {
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  const facilityDetails = {
    library: {
      title: 'Automated Central Library',
      subtitle: 'Learning • Research • Digital Access',
      description: 'The automated central library of NSS College Ottapalam serves as a comprehensive intellectual center for faculty and students. It features automated cataloging, an extensive collection of textbooks and reference works, national academic journals, and high-speed internet terminals for digital database searching.',
      features: [
        'Automated book cataloging & circulation',
        'Quiet reference reading halls',
        'National and regional academic journals & periodicals',
        'Digital access terminals for research dissertations',
        'Career guidance and competitive examination repository'
      ]
    },
    sports: {
      title: 'Department of Physical Education & Sports',
      subtitle: 'Athletic Excellence • Wellness • Team Spirit',
      description: 'The college features expansive physical education facilities and dedicated outdoor grounds, actively training athletes for University of Calicut intercollegiate championships, state sports meets, and national sporting events.',
      features: [
        'Full-size multi-sport outdoor athletic grounds',
        'Track and field training facilities',
        'University championship participation coaching',
        'Indoor fitness and wellness infrastructure',
        'Active sports club and annual sports meet'
      ]
    },
    ict: {
      title: 'ICT & Computational Infrastructure',
      subtitle: 'High-Speed Connectivity • Modern Computer Labs',
      description: 'The campus is equipped with modern computer laboratories and networked terminals supporting BSc/MSc Computer Science, FYUGP computational skill courses, and digital office management.',
      features: [
        'High-speed campus network connectivity',
        'Air-conditioned computer laboratories',
        'Multimedia presentation and seminar classrooms',
        'Secure campus ERP server framework'
      ]
    },
    campus: {
      title: '41-Acre Scenic Green Campus',
      subtitle: 'Eco-Friendly Heritage • Palappuram Area',
      description: 'Situated along the Palakkad-Ponnani Road in Palappuram, the 41-acre campus boasts lush tree canopies, medicinal botanical gardens, and calm walkways offering an ideal academic retreat.',
      features: [
        'Sprawling 41-acre campus topography',
        'Rich botanical foliage and shade trees',
        'Eco-friendly campus initiatives and rainwater harvesting',
        'Peaceful academic ambience shielded from highway congestion'
      ]
    }
  };

  const activeFac = selectedFacility ? facilityDetails[selectedFacility as keyof typeof facilityDetails] : null;

  return (
    <section id="facilities" className="py-12 sm:py-16 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2 border border-emerald-200">
            <Trees className="w-3.5 h-3.5" />
            <span>Infrastructure & Ecosystem</span>
          </div>
          <h2 className="text-lg sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display leading-tight">
            Campus & Facilities
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Spanning approximately 41 acres in Palappuram near the Palakkad-Ponnani Road, NSS College Ottapalam blends pristine natural serenity with automated library infrastructure, sports grounds, and advanced computing hubs.
          </p>
        </div>

        {/* High-Resolution Campus Photo Panorama Card */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-slate-950 mb-8 border border-slate-200 dark:border-slate-800 group">
          <div className="relative w-full aspect-[4/3] xs:aspect-[16/10] sm:aspect-[16/9] max-h-[500px]">
            <img
              src={COLLEGE_PHOTO_URL}
              alt="NSS College Ottapalam Main Campus Heritage View"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[center_30%] sm:object-[center_35%] group-hover:scale-102 transition-transform duration-700 select-none"
              loading="lazy"
            />
            {/* Subtle Vignette Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/20 pointer-events-none" />

            {/* Top Badge */}
            <div className="absolute top-3 left-3 sm:top-5 sm:left-5 flex items-center gap-2 pointer-events-none">
              <span className="px-3 py-1 bg-slate-950/85 backdrop-blur-md rounded-xl text-xs font-bold text-amber-300 border border-amber-400/30 flex items-center gap-1.5 shadow-sm">
                <Trees className="w-3.5 h-3.5" />
                <span>41-Acre Scenic Green Campus</span>
              </span>
            </div>

            {/* Bottom Caption & High-Res Action */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 max-w-xl">
                <h3 className="text-sm sm:text-lg font-black text-white">
                  NSS College Ottapalam Main Campus
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-200/90 mt-0.5">
                  Palakkad – Ponnani Road, Palappuram P O, Palakkad – 679103, Kerala
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPhotoLightboxOpen(true)}
                className="px-4 py-2 sm:py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 min-h-[44px]"
              >
                <Maximize2 className="w-4 h-4 text-slate-950" />
                <span>Full-Screen Photo</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Automated Central Library */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Knowledge Hub
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                Automated Library
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Automated central repository with extensive subject volumes, research periodicals, and digital browsing stations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Digital Catalog</span>
              <button
                onClick={() => setSelectedFacility('library')}
                className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 min-h-[36px]"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Sports & Athletics */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 flex items-center justify-center mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Athletics & Wellness
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                Sports Facilities
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Extensive physical education grounds and track training active university and state championship athletes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">University Meets</span>
              <button
                onClick={() => setSelectedFacility('sports')}
                className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1 min-h-[36px]"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: ICT & Computing */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 flex items-center justify-center mb-3">
                <Wifi className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Technology
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                ICT & Computer Labs
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                High-speed networked laboratories supporting BSc/MSc Computer Science, data practicals, and FYUGP courses.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Campus LAN</span>
              <button
                onClick={() => setSelectedFacility('ict')}
                className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 min-h-[36px]"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: 41-Acre Ecosystem */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 flex items-center justify-center mb-3">
                <Trees className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Green Habitat
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                41-Acre Campus
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Lush natural environment in Palappuram featuring diverse flora, serene student plazas, and eco-friendly practices.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Eco-Conscious</span>
              <button
                onClick={() => setSelectedFacility('campus')}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 min-h-[36px]"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Facility Details Modal */}
      {activeFac && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  {activeFac.subtitle}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                  {activeFac.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFacility(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close Facility Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <p className="leading-relaxed">{activeFac.description}</p>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">Key Highlights:</h4>
                <ul className="space-y-1">
                  {activeFac.features.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-700 dark:bg-rose-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedFacility(null)}
                className="px-4 py-1.5 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Campus Photo Lightbox Modal */}
      {isPhotoLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="relative max-w-6xl w-full flex flex-col items-center">
            {/* Top Bar with Close Button */}
            <div className="w-full flex items-center justify-between pb-3 text-white px-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                  NAAC 'A'
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-200">
                  NSS College Ottapalam Campus Panorama (Palappuram, Kerala)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoLightboxOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close Lightbox"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lightbox Image Container */}
            <div className="relative w-full max-h-[80vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center">
              <img
                src={COLLEGE_PHOTO_URL}
                alt="NSS College Ottapalam Campus Panorama High Resolution"
                referrerPolicy="no-referrer"
                className="w-full max-h-[80vh] object-contain select-none"
              />
            </div>

            <div className="w-full pt-3 px-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-1">
              <span>Established 1961 • Affiliated to University of Calicut • 41 Acres</span>
              <span className="text-amber-300 font-medium">Palakkad – Ponnani Road, Palappuram P O</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
