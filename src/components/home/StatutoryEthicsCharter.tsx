import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  FileText,
  Phone,
  Mail,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  ChevronRight,
  X,
  ExternalLink,
  Sparkles,
  Award
} from 'lucide-react';
import { COLLEGE_INFO } from '../../config/collegeInfo';

export const StatutoryEthicsCharter: React.FC = () => {
  const [isEthicsModalOpen, setIsEthicsModalOpen] = useState(false);
  const [activeEthicsTab, setActiveEthicsTab] = useState<'antiragging' | 'icc' | 'grievance' | 'academic'>('antiragging');

  return (
    <section id="statutory-ethics" className="py-12 sm:py-16 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-200 dark:border-rose-950/40 relative overflow-hidden transition-colors duration-200">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-rose-500/10 dark:bg-rose-950/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
        
        {/* Official Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4 mb-8 sm:mb-10 pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5 sm:space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-300 text-[9.5px] sm:text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>STATUTORY COMPLIANCE & CODE OF ETHICS</span>
            </div>
            <h2 className="text-lg sm:text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-snug">
              Institutional Ethics, Safety & Statutory Regulatory Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
              N.S.S. College, Ottapalam maintains rigorous institutional discipline, zero tolerance to ragging, gender justice, and academic integrity under the statutory mandates of the University Grants Commission (UGC), Government of Kerala, and the University of Calicut.
            </p>
          </div>

          <button
            onClick={() => setIsEthicsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-amber-300 hover:text-rose-900 dark:hover:text-white border border-slate-200 dark:border-amber-400/30 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 self-start lg:self-auto cursor-pointer shadow-xs dark:shadow-lg min-h-[40px] sm:min-h-[46px]"
          >
            <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>View Full Ethics & Conduct Manual</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Core Statutory Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Zero-Tolerance Anti-Ragging Mandate */}
          <div className="rounded-2xl bg-white dark:bg-gradient-to-br dark:from-rose-950/80 dark:to-slate-950 p-5 border border-rose-200 dark:border-rose-800/50 flex flex-col justify-between group hover:border-rose-400 dark:hover:border-rose-600/80 transition-all shadow-xs dark:shadow-none">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30">
                  ZERO TOLERANCE
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Anti-Ragging Cell & Flying Squad
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-light">
                Ragging is a cognizable criminal offense punishable under the Kerala Prohibition of Ragging Act, 1998 and UGC Regulations, 2009. Any act of physical, mental, or verbal harassment results in immediate police FIR and expulsion.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-100 dark:border-rose-900/60 space-y-1.5">
              <div className="text-[11px] font-mono text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-bold">
                <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>UGC 24x7 Helpline: 1800-180-5522</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Email: helpline@antiragging.in
              </p>
            </div>
          </div>

          {/* 2. Internal Complaints Committee (ICC) & Gender Justice */}
          <div className="rounded-2xl bg-white dark:bg-gradient-to-br dark:from-purple-950/70 dark:via-slate-900 dark:to-slate-950 p-5 border border-purple-200 dark:border-purple-800/50 flex flex-col justify-between group hover:border-purple-400 dark:hover:border-purple-500/80 transition-all hover:-translate-y-0.5 shadow-xs dark:shadow-lg">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50">
                  <HeartHandshake className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30">
                  ACT OF 2013
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                Internal Complaints Committee (ICC)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-light">
                Constituted under the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 to ensure a dignified, safe, and empowering academic atmosphere for all female scholars and staff.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-100 dark:border-purple-900/60 space-y-1">
              <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-200 block">
                Presiding Officer: Senior Faculty Head
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Strict confidentiality assured for all inquiries
              </span>
            </div>
          </div>

          {/* 3. Students' Grievance Redressal Committee (SGRC) */}
          <div className="rounded-2xl bg-white dark:bg-gradient-to-br dark:from-blue-950/70 dark:via-slate-900 dark:to-slate-950 p-5 border border-blue-200 dark:border-blue-800/50 flex flex-col justify-between group hover:border-blue-400 dark:hover:border-blue-500/80 transition-all hover:-translate-y-0.5 shadow-xs dark:shadow-lg">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                  <Scale className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200 border border-blue-200 dark:border-blue-500/30">
                  UGC 2023
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                Students' Grievance Redressal
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-light">
                Established as per UGC Regulations, 2023 to provide a fair, impartial, and transparent mechanism for the prompt redressal of academic evaluations, admissions, and campus welfare grievances.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-100 dark:border-blue-900/60 space-y-1">
              <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-200 block">
                College Ombudsman Mechanism
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Online submission via ERP Student Portal
              </span>
            </div>
          </div>

          {/* 4. University Academic Integrity & Examination Code */}
          <div className="rounded-2xl bg-white dark:bg-gradient-to-br dark:from-emerald-950/70 dark:via-slate-900 dark:to-slate-950 p-5 border border-emerald-200 dark:border-emerald-800/50 flex flex-col justify-between group hover:border-emerald-400 dark:hover:border-emerald-500/80 transition-all hover:-translate-y-0.5 shadow-xs dark:shadow-lg">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30">
                  EXAM CODE
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                Academic Integrity & Exam Ethics
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-light">
                Zero tolerance for examination malpractice or plagiarism in FYUGP research dissertations. Continuous Internal Evaluation (CIE) adheres to the University of Calicut statutory evaluation manual.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-900/60 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 block">
                University Examination Center: OTP (26)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                CCTV Monitored Examination Halls
              </span>
            </div>
          </div>

        </div>

        {/* Official Statutory Flash Ribbon */}
        <div className="mt-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-amber-400/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs dark:shadow-none">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-400 text-slate-950 dark:text-slate-950 shrink-0">
              <Sparkles className="w-4 h-4 text-slate-950 dark:text-slate-950" />
            </span>
            <span className="text-slate-700 dark:text-slate-200">
              Mandatory Anti-Ragging Affidavit: Every student and parent must submit their online undertaking at <strong className="text-amber-800 dark:text-amber-300 font-mono">www.antiragging.in</strong> at the start of each academic year.
            </span>
          </div>

          <a
            href="https://www.antiragging.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-amber-300 hover:text-rose-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>Open Anti-Ragging Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* Full Institutional Ethics & Code of Conduct Modal */}
      {isEthicsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto text-slate-900 dark:text-white">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-amber-400/30 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">
                    Institutional Code of Ethics & Statutory Regulations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    N.S.S. College, Ottapalam • Affiliated to the University of Calicut
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEthicsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Bar */}
            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 py-3 overflow-x-auto no-scrollbar">
              {[
                { id: 'antiragging' as const, label: 'Anti-Ragging Regulations' },
                { id: 'icc' as const, label: 'ICC & Gender Justice' },
                { id: 'grievance' as const, label: 'Grievance Redressal (SGRC)' },
                { id: 'academic' as const, label: 'Academic & Exam Ethics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEthicsTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    activeEthicsTab === tab.id
                      ? 'bg-amber-400 text-slate-950 dark:text-slate-950 shadow-md font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light pr-2">
              {activeEthicsTab === 'antiragging' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 text-xs">
                    <strong className="block font-bold mb-1 uppercase tracking-wider text-rose-800 dark:text-rose-300">
                      Statutory Warning as per Hon'ble Supreme Court of India
                    </strong>
                    Ragging in any form is totally prohibited in and outside the college campus. Strict disciplinary and criminal action will be taken against anyone indulging in or abetting ragging.
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">Anti-Ragging Committee Protocols:</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li>Immediate suspension and departmental inquiry following receipt of any complaint.</li>
                    <li>Lodging of First Information Report (FIR) with the local Police Station (Ottapalam PS).</li>
                    <li>Debarring from representing the college in any university youth festival, sports meet, or academic competition.</li>
                    <li>Withholding of scholarships, internal marks, or character and conduct certificates.</li>
                  </ul>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Anti-Ragging Squad Mobile:</span>
                    <span className="text-amber-800 dark:text-amber-300 font-mono font-bold">+91 94474 12345 / 0466-2244382</span>
                  </div>
                </div>
              )}

              {activeEthicsTab === 'icc' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    Internal Complaints Committee (ICC) & Women's Protection
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    The college has a functional Internal Complaints Committee constituted as per the provisions of Section 4 of the Sexual Harassment of Women at Workplace Act, 2013.
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li>Provides an accessible, non-judgmental, and secure forum for reporting gender discrimination or harassment.</li>
                    <li>Guarantees strict confidentiality to complainants, witnesses, and respondents during all proceedings.</li>
                    <li>Conducts regular gender sensitization and legal awareness workshops in coordination with the Women's Cell.</li>
                  </ul>
                </div>
              )}

              {activeEthicsTab === 'grievance' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    Student Grievance Redressal Committee (SGRC)
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Constituted under UGC (Redressal of Grievances of Students) Regulations, 2023, the SGRC handles complaints related to admissions, evaluation, fee concessions, and hostel facilities.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Level 1:</span>
                      <span className="font-bold text-slate-900 dark:text-white">Departmental Tutor / Head of Department</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Level 2:</span>
                      <span className="font-bold text-slate-900 dark:text-white">Institutional SGRC presided by Principal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Level 3:</span>
                      <span className="font-bold text-amber-800 dark:text-amber-300">University of Calicut Student Ombudsperson</span>
                    </div>
                  </div>
                </div>
              )}

              {activeEthicsTab === 'academic' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    University of Calicut Academic & Examination Ethics
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    All students must uphold the highest standards of academic integrity during semester end examinations and continuous internal assessments (CIE).
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li>Strict compliance with examination hall instructions: Unauthorized materials or mobile phones strictly forbidden.</li>
                    <li>Anti-Plagiarism verification for Four-Year Undergraduate Programme (FYUGP) dissertation projects.</li>
                    <li>Transparency in publishing attendance condonation lists and internal mark registers prior to university upload.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Palappuram P.O., Ottapalam • Affiliated to the University of Calicut</span>
              <button
                onClick={() => setIsEthicsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                Close Charter
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
