import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Navigation,
  ExternalLink,
  Clock,
  Landmark,
  Compass
} from 'lucide-react';
import { COLLEGE_INFO } from '../../config/collegeInfo';

export const ContactSection: React.FC = () => {
  const { contact } = COLLEGE_INFO;

  return (
    <section id="contact" className="py-12 sm:py-16 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-900 dark:text-rose-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2 border border-rose-200 dark:border-rose-500/30">
            <MapPin className="w-3.5 h-3.5" />
            <span>Campus Location & Support</span>
          </div>
          <h2 className="text-lg sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display leading-tight">
            Contact & Directions
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Reach out to the administrative office or visit our 41-acre campus situated in Palappuram along the Palakkad-Ponnani Road.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Official Contact Card */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950 text-white border border-slate-800 shadow-xl space-y-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Official Administrative Address
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white font-display mt-1">
                  {contact.institutionName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {contact.road}, {contact.postOffice}, {contact.district} – {contact.pincode}, {contact.state}, {contact.country}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs sm:text-sm">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="p-2 rounded-lg bg-white/10 text-amber-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Office Telephone</span>
                    <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="font-bold text-white hover:text-amber-300 transition-colors">
                      {contact.phone} ({contact.phoneFormatted})
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <div className="p-2 rounded-lg bg-white/10 text-amber-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Official Support Email</span>
                    <a href={`mailto:${contact.email}`} className="font-bold text-white hover:text-amber-300 transition-colors">
                      {contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <div className="p-2 rounded-lg bg-white/10 text-amber-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Office Working Hours</span>
                    <span className="font-semibold text-slate-200">Monday – Friday: 09:30 AM – 04:30 PM</span>
                  </div>
                </div>
              </div>

              {/* 4 Touch-friendly Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md min-h-[44px]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-white/10 min-h-[44px]"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-300" />
                  <span>Email</span>
                </a>
                <a
                  href={contact.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-white/10 min-h-[44px]"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-300" />
                  <span>Directions</span>
                </a>
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-white/10 min-h-[44px]"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-300" />
                  <span>Website</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Find Us / Location Map Card */}
          <div className="lg:col-span-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-900 dark:text-rose-400 uppercase tracking-wider">
                    Campus Geography
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                    Find NSS College Ottapalam
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-rose-900 dark:text-amber-400" />
                  <span>Palappuram</span>
                </span>
              </div>

              {/* Scenic Location Card Visual */}
              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-750 flex items-center justify-center group shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-950/95 flex flex-col items-center justify-center p-4 text-center text-white">
                  <div className="w-12 h-12 rounded-full bg-rose-900/80 border border-amber-400/40 flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 text-amber-300" />
                  </div>
                  <h4 className="text-sm font-bold text-white">NSS College Ottapalam Campus</h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm">
                    Situated alongside Palakkad – Ponnani Road in Palappuram, Ottapalam, Palakkad - 679103, Kerala.
                  </p>
                  <a
                    href={contact.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                  </a>
                </div>
              </div>

              {/* Location Highlights */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block text-[11px]">Highway Access</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">Palakkad-Ponnani Road route</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block text-[11px]">Railway & Bus</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">Ottapalam Railway Station vicinity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
