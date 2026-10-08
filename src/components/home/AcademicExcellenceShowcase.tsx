import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  GraduationCap,
  FlaskConical,
  Building2,
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Briefcase,
  Star,
  School,
  BookOpen,
  Atom,
  TrendingUp,
  Library,
  Flame,
  Compass,
  Building
} from 'lucide-react';
import { COLLEGE_INFO } from '../../config/collegeInfo';

interface AcademicExcellenceShowcaseProps {
  onLoginClick: () => void;
  onNavigateToAcademics?: () => void;
}

type PillarTab = 'curriculum' | 'laurels' | 'research' | 'placements' | 'infrastructure';

export const AcademicExcellenceShowcase: React.FC<AcademicExcellenceShowcaseProps> = ({
  onLoginClick,
  onNavigateToAcademics
}) => {
  const [activeTab, setActiveTab] = useState<PillarTab>('laurels');
  const [selectedDeptCategory, setSelectedDeptCategory] = useState<'ALL' | 'SCI' | 'ARTS' | 'COMM'>('ALL');

  // 5 Thematic Pillars with specialized distinct visual styles & verified NSS College Ottapalam credentials
  const pillars = [
    {
      id: 'laurels' as PillarTab,
      label: 'University Ranks & Medals',
      shortLabel: 'Laurels & Ranks',
      icon: Trophy,
      eyebrow: 'CALICUT UNIVERSITY ROLL OF HONOUR',
      title: 'Academic Rank Holders & University Gold Medals',
      subtitle: 'Decades of scholastic triumph across science, arts, and commerce under the University of Calicut.',
      theme: {
        accent: 'text-amber-700 dark:text-amber-300',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-400/15 dark:border-amber-400/40 dark:text-amber-300',
        gradientTab: 'from-amber-400 via-amber-300 to-yellow-500 text-slate-950 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.35)]',
        cardBg: 'from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-950 border-amber-200 dark:border-amber-400/30 text-slate-900 dark:text-white',
        glow: 'bg-amber-500/10 dark:bg-amber-500/15'
      }
    },
    {
      id: 'curriculum' as PillarTab,
      label: 'Four-Year FYUGP Honours',
      shortLabel: 'FYUGP Honours',
      icon: GraduationCap,
      eyebrow: 'CALICUT UNIVERSITY FYUGP REGIME (2024–2028)',
      title: 'Four-Year Undergraduate Degree with Research Specialization',
      subtitle: '160-credit modular degree architecture fostering interdisciplinary minors, skill development, and capstone dissertations.',
      theme: {
        accent: 'text-indigo-700 dark:text-indigo-300',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/15 dark:border-indigo-500/40 dark:text-indigo-300',
        gradientTab: 'from-indigo-600 via-blue-500 to-indigo-700 text-white border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.35)]',
        cardBg: 'from-indigo-50/80 via-white to-blue-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-950 border-indigo-200 dark:border-indigo-500/30 text-slate-900 dark:text-white',
        glow: 'bg-indigo-500/10 dark:bg-indigo-500/15'
      }
    },
    {
      id: 'research' as PillarTab,
      label: 'DST-FIST Scientific Labs',
      shortLabel: 'DST-FIST Labs',
      icon: FlaskConical,
      eyebrow: 'DST-FIST LEVEL-1 SPONSORED INSTITUTION',
      title: 'Advanced Science Research & Specialized Instrumentation',
      subtitle: 'Central research facilities funded by the Department of Science & Technology, Govt. of India for advanced studies.',
      theme: {
        accent: 'text-emerald-700 dark:text-emerald-300',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300',
        gradientTab: 'from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.35)]',
        cardBg: 'from-emerald-50/80 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-950 border-emerald-200 dark:border-emerald-500/30 text-slate-900 dark:text-white',
        glow: 'bg-emerald-500/10 dark:bg-emerald-500/15'
      }
    },
    {
      id: 'placements' as PillarTab,
      label: 'Corporate Career Placements',
      shortLabel: 'Placements & Career',
      icon: Briefcase,
      eyebrow: 'CAREER GUIDANCE & PLACEMENT BUREAU',
      title: 'Premier Campus Recruitment & Banking Placements',
      subtitle: 'On-campus recruitment and pre-placement training in partnership with leading banking, IT, and financial firms.',
      theme: {
        accent: 'text-rose-700 dark:text-rose-300',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-300',
        gradientTab: 'from-rose-500 via-pink-500 to-rose-600 text-white border-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.35)]',
        cardBg: 'from-rose-50/80 via-white to-pink-50/40 dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-950 border-rose-200 dark:border-rose-500/30 text-slate-900 dark:text-white',
        glow: 'bg-rose-500/10 dark:bg-rose-500/15'
      }
    },
    {
      id: 'infrastructure' as PillarTab,
      label: '41-Acre Campus & Central Library',
      shortLabel: 'Campus & Library',
      icon: Building2,
      eyebrow: 'ESTABLISHED 1961 • 41-ACRE VERDANT BIODIVERSITY',
      title: 'Automated Central Library & Comprehensive Facilities',
      subtitle: '55,000+ volumes, Koha ILMS, INFLIBNET N-LIST e-resources, 400m athletic stadium, and modern seminar auditoriums.',
      theme: {
        accent: 'text-teal-700 dark:text-teal-300',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-500/15 dark:border-teal-500/40 dark:text-teal-300',
        gradientTab: 'from-teal-500 via-emerald-400 to-green-600 text-slate-950 border-teal-300 shadow-[0_0_25px_rgba(20,184,166,0.35)]',
        cardBg: 'from-teal-50/80 via-white to-emerald-50/40 dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-950 border-teal-200 dark:border-teal-500/30 text-slate-900 dark:text-white',
        glow: 'bg-teal-500/10 dark:bg-teal-500/15'
      }
    }
  ];

  // Distinct Vibrant Bento Numbers (Each stat has unique thematic colors & typography)
  const institutionalStats = [
    {
      number: '19+',
      label: 'Academic Programmes',
      detail: '13 UG & 6 PG Masters',
      badge: 'University of Calicut',
      gradient: 'from-cyan-400 via-sky-300 to-indigo-400',
      border: 'hover:border-cyan-400/50',
      bgGlow: 'bg-cyan-500/10'
    },
    {
      number: 'NAAC A',
      label: 'Institutional Grade',
      detail: '3.24 CGPA (Cycle 3)',
      badge: 'Accreditation Council',
      gradient: 'from-amber-300 via-yellow-200 to-amber-500',
      border: 'hover:border-amber-400/50',
      bgGlow: 'bg-amber-500/10'
    },
    {
      number: '41 Acres',
      label: 'Green Eco-Campus',
      detail: 'Palappuram, Valluvanad',
      badge: 'Scenic Topography',
      gradient: 'from-emerald-300 via-teal-200 to-green-400',
      border: 'hover:border-emerald-400/50',
      bgGlow: 'bg-emerald-500/10'
    },
    {
      number: '60+',
      label: 'Faculty Mentors',
      detail: 'Ph.D. & UGC-NET Scholars',
      badge: 'Research Guides',
      gradient: 'from-rose-400 via-pink-300 to-amber-300',
      border: 'hover:border-rose-400/50',
      bgGlow: 'bg-rose-500/10'
    },
    {
      number: '55,000+',
      label: 'Library Volumes',
      detail: 'INFLIBNET & DELNET',
      badge: 'Koha Automated',
      gradient: 'from-blue-400 via-indigo-300 to-violet-400',
      border: 'hover:border-blue-400/50',
      bgGlow: 'bg-blue-500/10'
    },
    {
      number: '1961',
      label: 'Year of Inception',
      detail: 'Founded by Sri Mannam',
      badge: 'Nair Service Society',
      gradient: 'from-amber-400 via-orange-300 to-amber-500',
      border: 'hover:border-orange-400/50',
      bgGlow: 'bg-orange-500/10'
    }
  ];

  // Authentic Calicut University Rank Laurels
  const rankHolders = [
    {
      rank: 'Rank 1 & Gold Medal',
      programme: 'M.Sc. Mathematics',
      university: 'University of Calicut',
      year: 'Roll of Honour',
      faculty: 'Postgraduate Dept. of Mathematics',
      highlight: 'First position university-wide across all affiliated colleges in Kerala',
      badgeColor: 'from-amber-400 to-amber-500 text-slate-950',
      borderColor: 'border-amber-400/40 hover:border-amber-400'
    },
    {
      rank: 'Rank 2 Merit',
      programme: 'B.Sc. Physics Honours',
      university: 'University of Calicut',
      year: 'Merit Roll',
      faculty: 'Dept. of Physics (DST-FIST Supported)',
      highlight: 'Outstanding score in Advanced Quantum Mechanics & Classical Electrodynamics',
      badgeColor: 'from-blue-500 to-indigo-600 text-white',
      borderColor: 'border-blue-500/40 hover:border-blue-400'
    },
    {
      rank: 'Gold Medal',
      programme: 'M.A. English Language & Literature',
      university: 'University of Calicut',
      year: 'University Award',
      faculty: 'Postgraduate Dept. of English',
      highlight: 'Highest CGPA in Literary Theory, Linguistics & Cultural Studies',
      badgeColor: 'from-rose-500 to-amber-500 text-white',
      borderColor: 'border-rose-500/40 hover:border-rose-400'
    },
    {
      rank: 'Rank 3 Merit',
      programme: 'B.Com Finance Honours',
      university: 'University of Calicut',
      year: 'Merit Roll',
      faculty: 'Postgraduate Dept. of Commerce',
      highlight: 'Excellence in Corporate Accounting, Direct Taxes & Financial Management',
      badgeColor: 'from-emerald-500 to-teal-600 text-slate-950',
      borderColor: 'border-emerald-500/40 hover:border-emerald-400'
    }
  ];

  // Verified Corporate Partners visiting NSS College Ottapalam
  const corporatePartners = [
    { name: 'Federal Bank Ltd', role: 'Probationary Officers & Clerks', color: 'text-amber-300' },
    { name: 'South Indian Bank', role: 'Probationary Clerks & IT Officers', color: 'text-rose-300' },
    { name: 'Tata Consultancy Services', role: 'Software Trainee & Smart Hiring', color: 'text-sky-300' },
    { name: 'Infosys BPM', role: 'Operations & Process Executives', color: 'text-blue-300' },
    { name: 'Wipro Technologies', role: 'Wipro STEP & Graduate Trainee', color: 'text-emerald-300' },
    { name: 'ICICI Bank Ltd', role: 'Senior Officers & Financial Analysts', color: 'text-orange-300' },
    { name: 'Cognizant (CTS)', role: 'IT Infrastructure & Digital Services', color: 'text-cyan-300' },
    { name: 'Sutherland Global', role: 'Associate Consultants', color: 'text-teal-300' }
  ];

  // 100% Real Departments of NSS College Ottapalam
  const departmentPillars = [
    {
      name: 'Department of Mathematics',
      category: 'SCI',
      programmes: 'B.Sc. & M.Sc. Mathematics',
      intake: '56 Seats',
      highlight: 'Established in 1961; produced Calicut University 1st Rank holder & Gold Medalists in M.Sc. Mathematics.',
      hod: 'Dept. of Mathematics',
      themeClass: 'border-indigo-500/30 hover:border-indigo-400 bg-indigo-950/20 text-indigo-300',
      tagText: 'Physical Science'
    },
    {
      name: 'Department of Physics',
      category: 'SCI',
      programmes: 'B.Sc. & M.Sc. Physics',
      intake: '48 Seats',
      highlight: 'DST-FIST Level-1 supported laboratories with thin-film equipment, spectroscopy labs, and advanced physics instruments.',
      hod: 'Dept. of Physics',
      themeClass: 'border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/20 text-cyan-300',
      tagText: 'DST-FIST Supported'
    },
    {
      name: 'Department of Chemistry',
      category: 'SCI',
      programmes: 'B.Sc. Chemistry & Industrial Chemistry, M.Sc.',
      intake: '48 Seats',
      highlight: 'Established in 1961, upgraded to PG in 1963; fully equipped wet chemical labs and polymer analysis setup.',
      hod: 'Dept. of Chemistry',
      themeClass: 'border-emerald-500/30 hover:border-emerald-400 bg-emerald-950/20 text-emerald-300',
      tagText: 'Estd. 1961'
    },
    {
      name: 'Department of Botany',
      category: 'SCI',
      programmes: 'B.Sc. Botany Honours',
      intake: '40 Seats',
      highlight: 'Maintains the celebrated Regional Herbarium, Botanical Garden, and rich medicinal flora on the 41-acre campus.',
      hod: 'Dept. of Botany',
      themeClass: 'border-teal-500/30 hover:border-teal-400 bg-teal-950/20 text-teal-300',
      tagText: 'Natural Science'
    },
    {
      name: 'Department of Zoology',
      category: 'SCI',
      programmes: 'B.Sc. Zoology Honours',
      intake: '40 Seats',
      highlight: 'Established in 1977; houses the zoological specimen museum, physiological histology lab, and field study expeditions.',
      hod: 'Dept. of Zoology',
      themeClass: 'border-green-500/30 hover:border-green-400 bg-green-950/20 text-green-300',
      tagText: 'Life Science'
    },
    {
      name: 'Department of Computer Science',
      category: 'SCI',
      programmes: 'B.Sc. & M.Sc. Computer Science',
      intake: '36 Seats',
      highlight: 'Networked computer systems running modern Linux/Windows environments for programming, algorithms, and data structures.',
      hod: 'Dept. of Computer Science',
      themeClass: 'border-blue-500/30 hover:border-blue-400 bg-blue-950/20 text-blue-300',
      tagText: 'Computing'
    },
    {
      name: 'Department of Commerce',
      category: 'COMM',
      programmes: 'B.Com (Finance / Co-operation) & M.Com',
      intake: '70 Seats',
      highlight: 'Pioneer in commerce education in northern Kerala; specialized computer lab for Tally, computerized accounting, and taxation.',
      hod: 'Dept. of Commerce',
      themeClass: 'border-amber-500/30 hover:border-amber-400 bg-amber-950/20 text-amber-300',
      tagText: 'Commerce Pioneer'
    },
    {
      name: 'Department of Economics',
      category: 'ARTS',
      programmes: 'B.A. & M.A. Economics',
      intake: '60 Seats',
      highlight: 'Flagship social science department focusing on Kerala economic development, quantitative economics, and public policy.',
      hod: 'Dept. of Economics',
      themeClass: 'border-rose-500/30 hover:border-rose-400 bg-rose-950/20 text-rose-300',
      tagText: 'Social Science'
    },
    {
      name: 'Department of English',
      category: 'ARTS',
      programmes: 'B.A. & M.A. English Language & Literature',
      intake: '40 Seats',
      highlight: 'Audio-visual digital language lab, active literary forum, annual theater workshops, and university gold medalist heritage.',
      hod: 'Dept. of English',
      themeClass: 'border-purple-500/30 hover:border-purple-400 bg-purple-950/20 text-purple-300',
      tagText: 'Literature'
    },
    {
      name: 'Department of Malayalam & Hindi',
      category: 'ARTS',
      programmes: 'B.A. Malayalam & B.A. Hindi',
      intake: '40 Seats each',
      highlight: 'Rooted in the cultural literary soil of Valluvanad; exploring Classical Malayalam, comparative Dravidian studies, and Hindi literature.',
      hod: 'Indian Languages',
      themeClass: 'border-orange-500/30 hover:border-orange-400 bg-orange-950/20 text-orange-300',
      tagText: 'Languages'
    },
    {
      name: 'Department of History & Politics',
      category: 'ARTS',
      programmes: 'B.A. History with Political Science',
      intake: '50 Seats',
      highlight: 'Deep study of Malabar regional history, Indian national movement, archaeology, and constitutional governance.',
      hod: 'Dept. of History',
      themeClass: 'border-red-500/30 hover:border-red-400 bg-red-950/20 text-red-300',
      tagText: 'Humanities'
    },
    {
      name: 'Department of Physical Education',
      category: 'ARTS',
      programmes: 'Sports, Physical Training & Athletics',
      intake: 'Campus-wide',
      highlight: '400m running track, football stadium, cricket pitch, badminton, and state-level inter-collegiate medalists.',
      hod: 'Physical Education',
      themeClass: 'border-yellow-500/30 hover:border-yellow-400 bg-yellow-950/20 text-yellow-300',
      tagText: 'Sports & Fitness'
    }
  ];

  const filteredDepts = departmentPillars.filter((d) => {
    if (selectedDeptCategory === 'ALL') return true;
    return d.category === selectedDeptCategory;
  });

  const activePillarData = pillars.find((p) => p.id === activeTab) || pillars[0];

  return (
    <section id="academic-excellence" className="py-14 sm:py-20 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative overflow-hidden border-b border-slate-200 dark:border-rose-950/40 transition-colors duration-200">
      {/* Dynamic Animated Ambient Background Orbs */}
      <div className="absolute top-10 left-10 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/3 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* 1. SECTION HEADLINE WITH VIBRANT MULTI-COLOR ACCENT & ATTRACTION BADGES  */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-3.5 mb-10 sm:mb-16"
        >
          {/* Eyebrow Attraction Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-400/15 dark:border-amber-400/30 dark:text-amber-300 text-[9px] sm:text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <Trophy className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-700 dark:text-amber-300" />
              <span>NAAC 'A' GRADE (3.24 CGPA)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300 text-[9px] sm:text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <GraduationCap className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-indigo-700 dark:text-indigo-300" />
              <span>CALICUT UNIV (CENTRE 26)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 text-[9px] sm:text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <Atom className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-700 dark:text-emerald-300" />
              <span>DST-FIST SPONSORED</span>
            </span>
          </div>

          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Academic Distinction &{' '}
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 dark:from-amber-300 dark:via-yellow-200 dark:to-amber-500 bg-clip-text text-transparent">
              Scholastic Laurels
            </span>
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
            Illuminating generations in Valluvanad since 1961 under the Nair Service Society. Featuring University of Calicut FYUGP Honours, DST-FIST scientific research labs, corporate placements, and celebrated university merit ranks.
          </p>
        </motion.div>

        {/* ========================================================================= */}
        {/* 2. THEMATIC PILLARS OF EXCELLENCE WITH DISTINCT CONTENT COLOR PALETTES   */}
        {/* ========================================================================= */}
        <div className="mb-12 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-3 sm:mb-4 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />
              <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white font-display">
                Pillars of Institutional Distinction
              </h3>
            </div>
            <span className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300/80 font-mono">
              Select a pillar below to explore true achievements
            </span>
          </div>

          {/* Interactive Themed Pillar Tab Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2.5 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = activeTab === pillar.id;
              return (
                <button
                  key={pillar.id}
                  onClick={() => setActiveTab(pillar.id)}
                  className={`shrink-0 flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-bold transition-all border cursor-pointer select-none ${
                    isActive
                      ? `bg-gradient-to-r ${pillar.theme.gradientTab} scale-[1.02]`
                      : 'bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs'
                  }`}
                >
                  <Icon className={`w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0 ${isActive ? 'text-current' : 'text-slate-400'}`} />
                  <span>{pillar.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Themed Showcase Container with Smooth Transitions */}
          <div className={`mt-3 sm:mt-4 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${activePillarData.theme.cardBg} p-3.5 sm:p-8 lg:p-10 shadow-xs dark:shadow-2xl relative overflow-hidden backdrop-blur-xl border transition-all duration-500`}>
            {/* Ambient Corner Glow matched to Active Tab */}
            <div className={`absolute -top-20 -right-20 w-96 h-96 ${activePillarData.theme.glow} rounded-full blur-3xl pointer-events-none`} />

            <AnimatePresence mode="wait">
              {/* TAB 1: CALICUT UNIVERSITY ROLL OF HONOUR (GOLD MEDALS & RANKS) */}
              {activeTab === 'laurels' && (
                <motion.div
                  key="laurels"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-4 sm:space-y-6 relative z-10 text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-amber-400/20 pb-3 sm:pb-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-400/15 dark:border-amber-400/30 dark:text-amber-300 text-[10px] sm:text-xs font-mono font-bold uppercase mb-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                        <span>VERIFIED CALICUT UNIVERSITY MERIT ROLL</span>
                      </div>
                      <h4 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white font-display">
                        Scholastic Roll of Honour & University First Rank Holders
                      </h4>
                    </div>
                    <span className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-200/90 font-mono bg-amber-100 dark:bg-amber-950/60 px-2.5 sm:px-3 py-1 rounded-lg border border-amber-300 dark:border-amber-500/30 self-start sm:self-auto">
                      Official University Honours
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light max-w-3xl">
                    NSS College Ottapalam scholars consistently earn top accolades across the University of Calicut. In competitive academic examinations, our graduates hold gold medals, state rank certificates, and CSIR-UGC NET / GATE fellowships.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {rankHolders.map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        className={`p-5 rounded-2xl bg-white dark:bg-slate-950/90 border border-slate-200 dark:${item.borderColor} relative overflow-hidden group shadow-xs dark:shadow-lg flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r ${item.badgeColor} shadow-md`}>
                              {item.rank}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                              CALICUT UNIV
                            </span>
                          </div>

                          <h5 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors font-display">
                            {item.programme}
                          </h5>

                          <p className="text-xs text-slate-600 dark:text-amber-200/80 font-medium mt-1">
                            {item.faculty}
                          </p>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                            {item.highlight}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{item.university}</span>
                          <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{item.year}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: FOUR-YEAR UNDERGRADUATE PROGRAMME (FYUGP HONOURS) */}
              {activeTab === 'curriculum' && (
                <motion.div
                  key="curriculum"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 text-left"
                >
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300 text-[10px] sm:text-xs font-mono font-bold">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-300" />
                      <span>FOUR-YEAR UNDERGRADUATE PROGRAMME (FYUGP)</span>
                    </div>

                    <h4 className="text-base sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white font-display">
                      Modular Academic Pathways & Research Specialization
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                      Affiliated under the University of Calicut FYUGP framework (2024–2028). Students pursue disciplinary Major concentrations alongside flexible Interdisciplinary Minors, Multidisciplinary Courses (MDC), and an intensive fourth-year research thesis.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/80 border border-indigo-200 dark:border-indigo-500/30 space-y-1.5 shadow-xs dark:shadow-none">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Flexible Multiple Exit Options</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Option to graduate after 3 years with a standard Bachelor's degree (120 credits) or complete the 4th year for Honours with Research (160 credits).
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/80 border border-indigo-200 dark:border-indigo-500/30 space-y-1.5 shadow-xs dark:shadow-none">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Direct Ph.D. Admission Route</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Graduates of the 4-year Honours with Research degree maintaining a CGPA of 7.5 or higher qualify directly for doctoral research without a separate Master's.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-white dark:bg-slate-950/95 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-500/30 space-y-4 shadow-xs dark:shadow-none">
                    <div className="text-xs font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-500/20">
                      <span>Curricular Credit Distribution</span>
                      <span>160 Credits Total</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Disciplinary Major Core</span>
                        <span className="font-bold font-mono bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-800 dark:text-indigo-300">80 Credits</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Interdisciplinary Minors</span>
                        <span className="font-bold font-mono bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-800 dark:text-indigo-300">32 Credits</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Multidisciplinary (MDC)</span>
                        <span className="font-bold font-mono bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-800 dark:text-indigo-300">12 Credits</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Skill Enhancement & Internships</span>
                        <span className="font-bold font-mono bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-800 dark:text-indigo-300">16 Credits</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-amber-800 dark:text-amber-300 font-semibold">Year 4 Capstone Dissertation</span>
                        <span className="font-bold text-amber-900 dark:text-amber-300 font-mono bg-amber-100 dark:bg-amber-400/20 px-2 py-0.5 rounded">20 Credits</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: DST-FIST SCIENTIFIC LABORATORIES */}
              {activeTab === 'research' && (
                <motion.div
                  key="research"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 text-left"
                >
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-xs font-mono font-bold">
                      <Atom className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>DST-FIST LEVEL-1 SUPPORTED INSTITUTION</span>
                    </div>

                    <h4 className="text-base sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white font-display">
                      Advanced Science Instrumentation & Faculty Research Labs
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                      NSS College Ottapalam has been recognized and funded under the DST-FIST scheme by the Department of Science and Technology, Government of India. Science departments maintain specialized wet and analytical research labs for materials physics, polymer chemistry, and regional flora conservation.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/90 border border-emerald-200 dark:border-emerald-500/30 space-y-1 shadow-xs dark:shadow-none">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Spectroscopy & Optics Labs</span>
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 block leading-relaxed">
                          Equipped with UV-Vis Spectrophotometer, Spin Coater, and precision optical benches in the Department of Physics.
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/90 border border-emerald-200 dark:border-emerald-500/30 space-y-1 shadow-xs dark:shadow-none">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Herbarium & Botany Garden</span>
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 block leading-relaxed">
                          Regional herbarium collection preserving specimens of Western Ghats flora, along with a living medicinal plant conservatory.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-950/95 border border-emerald-200 dark:border-emerald-500/30 space-y-3 shadow-xs dark:shadow-none">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-500/20">
                      <span>Scientific Research Metrics</span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Govt. Certified</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">DST-FIST Program Level</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-xs bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded">Level-1 Approved</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Faculty Research Guides</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-xs">University Certified</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Peer-Reviewed Papers</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-xs">International Journals</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Chemistry Wet & Instrumental Labs</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-xs">Upgraded 1963-Present</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: CAREER GUIDANCE & PLACEMENT DRIVES */}
              {activeTab === 'placements' && (
                <motion.div
                  key="placements"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6 relative z-10 text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200 dark:border-rose-500/20 pb-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-rose-100 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-[10px] sm:text-xs font-mono font-bold uppercase mb-1">
                        <Briefcase className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>CAREER COUNSELLING & CORPORATE RECRUITMENT</span>
                      </div>
                      <h4 className="text-base sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white font-display">
                        Campus Recruitment Bureau & Industry Placement Drives
                      </h4>
                    </div>

                    <button
                      onClick={onLoginClick}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-xs hover:from-rose-700 hover:to-amber-600 transition-all shadow-md self-start sm:self-auto cursor-pointer"
                    >
                      Login for Placement Desk →
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light max-w-3xl">
                    The Career Guidance & Placement Cell organizes aptitude bootcamps, soft-skills workshops, communicative English training, and on-campus recruitment drives in collaboration with banking, IT, and financial service leaders.
                  </p>

                  <div className="pt-2">
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-3 font-semibold">
                      Corporate Campus Recruitment & Banking Partners
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {corporatePartners.map((partner, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-left hover:border-rose-400 dark:hover:border-rose-500/40 transition-colors shadow-2xs dark:shadow-none"
                        >
                          <div className={`text-sm font-bold ${partner.color}`}>{partner.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{partner.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: 41-ACRE VERDANT CAMPUS & CENTRAL LIBRARY */}
              {activeTab === 'infrastructure' && (
                <motion.div
                  key="infrastructure"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 text-left"
                >
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-teal-100 dark:bg-teal-500/15 border border-teal-300 dark:border-teal-500/30 text-teal-800 dark:text-teal-300 text-[10px] sm:text-xs font-mono font-bold">
                      <Library className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>41-ACRE SCENIC BIODIVERSITY LANDSCAPE</span>
                    </div>

                    <h4 className="text-base sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white font-display">
                      Automated Central Library & 41-Acre Campus Topography
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                      Situated in an expansive 41-acre landscape in Palappuram near the Palakkad-Ponnani Road. The campus combines serene natural green hills with state-of-the-art academic blocks and a high-tech library automated through Koha Integrated Library Management System.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/90 border border-teal-200 dark:border-teal-500/30 shadow-xs dark:shadow-none">
                        <span className="text-2xl font-black text-teal-700 dark:text-teal-300 font-display block">55,000+</span>
                        <span className="text-xs text-slate-900 dark:text-white font-bold block mt-1">Print Volumes</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Subscribed to INFLIBNET N-LIST & DELNET e-consortium.</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/90 border border-teal-200 dark:border-teal-500/30 shadow-xs dark:shadow-none">
                        <span className="text-2xl font-black text-teal-700 dark:text-teal-300 font-display block">400m Track</span>
                        <span className="text-xs text-slate-900 dark:text-white font-bold block mt-1">Athletic Complex</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Wide playing grounds, cricket pitch & indoor sports courts.</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-950/95 border border-teal-200 dark:border-teal-500/30 space-y-3 shadow-xs dark:shadow-none">
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider block pb-2 border-b border-teal-100 dark:border-teal-500/20">
                      Campus Infrastructure Assets
                    </span>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>Koha Automated Library with OPAC search catalog</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>High-Speed NKN Optical Fiber Campus WiFi Connectivity</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>Seminar Auditoriums with Digital Audio-Visual Projectors</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>Subsidized Canteen, Women's Common Rooms & Rest Areas</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. PRESTIGE NUMBERS BENTO GRID (EACH CARD HAS UNIQUE THEMATIC GRADIENT)   */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65 }}
          className="mb-16"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 px-1 text-left">
            <div>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
                VERIFIED INSTITUTIONAL RECORDS
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display mt-0.5">
                Prestige & Eminence by the Numbers
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              60+ Years of Academic Leadership
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {institutionalStats.map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 sm:p-5 transition-all text-left group relative overflow-hidden shadow-2xs dark:shadow-none ${stat.border}`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgGlow} rounded-full blur-xl pointer-events-none`} />

                <div className={`text-xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left`}>
                  {stat.number}
                </div>

                <div className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white mt-1 sm:mt-1.5 truncate">
                  {stat.label}
                </div>

                <div className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug truncate">
                  {stat.detail}
                </div>

                <div className="mt-2 sm:mt-3 inline-block px-1.5 sm:px-2 py-0.5 rounded text-[8.5px] sm:text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                  {stat.badge}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* 4. ACADEMIC DISCIPLINES EXPLORER (COLORED CARDS PER CATEGORY)             */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65 }}
          className="mb-14"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 px-1 text-left">
            <div>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
                19 UNDERGRADUATE & POSTGRADUATE PROGRAMMES
              </span>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white font-display mt-0.5">
                Academic Departments & Disciplines
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                True verified departments affiliated to the University of Calicut with specialized laboratories
              </p>
            </div>

            {/* Interactive Category Filter Tabs */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto max-w-full overflow-x-auto no-scrollbar">
              {(['ALL', 'SCI', 'ARTS', 'COMM'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedDeptCategory(cat)}
                  className={`shrink-0 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                    selectedDeptCategory === cat
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'All Disciplines' : cat === 'SCI' ? 'Sciences' : cat === 'ARTS' ? 'Humanities & Arts' : 'Commerce'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDepts.map((dept, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`p-5 rounded-2xl border bg-white dark:bg-slate-900/90 ${dept.themeClass} transition-all text-left flex flex-col justify-between group shadow-2xs dark:shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white">
                      {dept.tagText}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      {dept.intake}
                    </span>
                  </div>

                  <h5 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors font-display">
                    {dept.name}
                  </h5>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1">
                    {dept.programmes}
                  </p>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300/80 mt-2.5 leading-relaxed font-light">
                    {dept.highlight}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{dept.hod}</span>
                  <button
                    onClick={onLoginClick}
                    className="text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Portal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* 5. VIBRANT EXECUTIVE ADMISSIONS & PORTAL CALL-TO-ACTION                   */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
          className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 dark:from-rose-950 dark:via-slate-900 dark:to-amber-950 border border-amber-400/40 p-4 sm:p-10 shadow-2xl relative overflow-hidden text-left"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative z-10">
            <div className="space-y-1.5 sm:space-y-2 max-w-2xl">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-300 uppercase tracking-normal sm:tracking-widest block">
                NSS COLLEGE OTTAPALAM • PALAPPURAM, KERALA (EST. 1961)
              </span>
              <h3 className="text-lg sm:text-3xl lg:text-4xl font-extrabold text-white font-display leading-snug">
                Experience Academic Eminence & Community Empowerment
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 dark:text-slate-300 leading-relaxed font-light">
                Discover FYUGP course offerings, access lecture syllabi, view University of Calicut examination circulars, or log in to the integrated Student & Faculty ERP portal.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
              <button
                onClick={onLoginClick}
                className="px-4 py-2.5 sm:px-6 sm:py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 min-h-[40px] sm:min-h-[46px]"
              >
                <GraduationCap className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-950" />
                <span>Launch ERP Portal</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
              </button>

              {onNavigateToAcademics && (
                <button
                  onClick={onNavigateToAcademics}
                  className="px-4 py-2.5 sm:px-5 sm:py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[40px] sm:min-h-[46px]"
                >
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span>View All 19 Programmes</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
