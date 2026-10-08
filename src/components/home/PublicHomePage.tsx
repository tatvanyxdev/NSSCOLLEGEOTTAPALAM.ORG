import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { CollegeLogo } from '../common/CollegeLogo';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { RoleLoginModal } from '../auth/RoleLoginModal';
import { CursorParallaxProvider } from './SmoothCursorFollower';
import { HeroSection } from './HeroSection';
import { CampusPhotoSection } from './CampusPhotoSection';
import { AcademicExcellenceShowcase } from './AcademicExcellenceShowcase';
import { StatutoryEthicsCharter } from './StatutoryEthicsCharter';
import { QuickAccess } from './QuickAccess';
import { CollegeStats } from './CollegeStats';
import { AboutSection } from './AboutSection';
import { AcademicsSection } from './AcademicsSection';
import { DepartmentsPreview } from './DepartmentsPreview';
import { CampusFacilities } from './CampusFacilities';
import { StudentLife } from './StudentLife';
import { PrincipalSection } from './PrincipalSection';
import { AnnouncementsPreview } from './AnnouncementsPreview';
import { ImportantLinks } from './ImportantLinks';
import { ContactSection } from './ContactSection';
import { PublicGrievanceView } from './PublicGrievanceView';
import { StudentFAQSection } from './StudentFAQSection';
import { ThemeToggleSwitch, ThemeToggleButton } from '../common/ThemeToggle';
import { registerBackHandler } from '../../lib/capacitorBridge';
import { COLLEGE_INFO, COLLEGE_PHOTO_URL } from '../../config/collegeInfo';
import {
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  Trees,
  BookOpen,
  Users,
  Megaphone,
  PhoneCall,
  Home,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Award,
  ShieldAlert
} from 'lucide-react';

export type PublicPageId =
  | 'home'
  | 'about'
  | 'academics'
  | 'departments'
  | 'facilities'
  | 'student-life'
  | 'complaints'
  | 'announcements'
  | 'contact';

interface PublicHomePageProps {
  onLoginClick?: () => void;
}

const NAV_ITEMS: { id: PublicPageId; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'about', label: 'About', icon: BookOpen },
  { id: 'academics', label: 'Academics', icon: GraduationCap },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'facilities', label: 'Campus & Library', icon: Trees },
  { id: 'student-life', label: 'Clubs & Cells', icon: Users },
  { id: 'complaints', label: 'Complaints / Vigilance', icon: ShieldAlert },
  { id: 'announcements', label: 'Notice Board', icon: Megaphone },
  { id: 'contact', label: 'Contact', icon: PhoneCall }
];

const PublicHomePageInner: React.FC<PublicHomePageProps> = ({ onLoginClick }) => {
  const [activePage, setActivePage] = useState<PublicPageId>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'bus-concession') {
        setTimeout(() => setIsLoginModalOpen(true), 200);
        return 'home';
      }
      const valid = NAV_ITEMS.some((item) => item.id === hash);
      if (valid) return hash as PublicPageId;
    }
    return 'home';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { settings } = useCollegeData();

  // Scroll Progress Dynamics
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 450);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for browser back / forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'bus-concession') {
        setIsLoginModalOpen(true);
        setActivePage('home');
        return;
      }
      const valid = NAV_ITEMS.some((item) => item.id === hash);
      if (valid) {
        setActivePage(hash as PublicPageId);
      } else if (!hash) {
        setActivePage('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Native Android hardware back button handler for modals, drawers and sub-pages
  useEffect(() => {
    return registerBackHandler(() => {
      if (isPhotoLightboxOpen) {
        setIsPhotoLightboxOpen(false);
        return true;
      }
      if (isLoginModalOpen) {
        setIsLoginModalOpen(false);
        return true;
      }
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        return true;
      }
      if (activePage !== 'home') {
        setActivePage('home');
        if (typeof window !== 'undefined') {
          window.location.hash = '';
        }
        return true;
      }
      return false;
    });
  }, [isPhotoLightboxOpen, isLoginModalOpen, isMobileMenuOpen, activePage]);

  const navigateTo = (page: PublicPageId) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.location.hash = page === 'home' ? '' : page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenLogin = () => {
    setIsMobileMenuOpen(false);
    if (onLoginClick) {
      onLoginClick();
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-rose-900 selection:text-white w-full overflow-x-hidden">
      {/* Scroll Progress Bar at the top of the viewport */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300 z-50 origin-left shadow-[0_0_10px_rgba(251,191,36,0.5)]"
        style={{ scaleX }}
      />

      {/* 1. Top Notice Bar */}
      <div className="bg-rose-950 text-amber-200 px-3 sm:px-4 py-1 sm:py-2 text-[9.5px] sm:text-xs font-medium border-b border-rose-900/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-300 rounded text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider border border-amber-400/30 shrink-0">
              NAAC 'A' GRADE
            </span>
            <span className="text-[9.5px] sm:text-xs font-semibold truncate">
              {COLLEGE_INFO.collegeName} • Affiliated to University of Calicut • Est. {COLLEGE_INFO.establishedYear}
            </span>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-300 hidden md:flex items-center gap-3 shrink-0">
            <span>Management: {COLLEGE_INFO.management}</span>
            <span>•</span>
            <span>Palakkad, Kerala</span>
          </div>
        </div>
      </div>

      {/* 2. Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-15 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-slate-700 dark:text-slate-200 hover:text-rose-900 dark:hover:text-amber-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-900 dark:text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* College Logo / Brand */}
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="flex items-center text-left focus:outline-none min-w-0"
            >
              <CollegeLogo size="sm" variant="full" className="min-w-0" />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-sm font-semibold">
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`px-3 py-2 rounded-xl transition-all duration-150 text-xs xl:text-sm font-bold cursor-pointer ${
                    isActive
                      ? 'bg-rose-900 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:text-rose-900 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Theme Toggle & Login CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-1">
            {/* Mobile: compact icon button. Desktop: sliding switch */}
            <div className="sm:hidden">
              <ThemeToggleButton variant="outline" size="sm" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0" />
            </div>
            <div className="hidden sm:inline-flex">
              <ThemeToggleSwitch size="sm" showLabels={false} />
            </div>

            <button
              onClick={handleOpenLogin}
              className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-rose-900 via-rose-950 to-slate-950 text-white rounded-xl text-[11px] sm:text-sm font-bold shadow-md hover:shadow-lg hover:from-rose-800 hover:to-slate-900 transition-all flex items-center gap-1 sm:gap-2 border border-amber-500/20 active:scale-95 min-h-[36px] sm:min-h-[42px] shrink-0 cursor-pointer"
            >
              <span className="hidden xs:inline">LOGIN TO PORTAL</span>
              <span className="xs:hidden">LOGIN</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-950 text-white border-b border-rose-950/60 px-4 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
            {/* Mobile Header Institutional Credential Card */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-400/30 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest">
                  NAAC GRADE 'A' (3.24 CGPA)
                </div>
                <div className="text-sm font-black text-white font-display">
                  N.S.S. College, Ottapalam
                </div>
                <div className="text-[11px] text-slate-400">
                  Affiliated to University of Calicut • Est. 1961
                </div>
              </div>
              <span className="px-2 py-1 bg-amber-400 text-slate-950 dark:text-slate-950 font-black text-[10px] rounded uppercase shadow-xs">
                FYUGP
              </span>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Navigation & Academics
            </div>

            <nav className="flex flex-col space-y-1">
              {/* Quick Jump to Academic Excellence */}
              <button
                type="button"
                onClick={() => {
                  navigateTo('home');
                  setTimeout(() => {
                    const el = document.getElementById('academic-excellence');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold bg-amber-400/10 border border-amber-400/30 text-amber-200 hover:bg-amber-400/20 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Academic Excellence & Ranks</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-amber-400/20 text-amber-300 rounded font-bold">
                  Top Laurels
                </span>
              </button>

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors text-left ${
                      isActive
                        ? 'bg-rose-900 text-white shadow-sm border border-rose-700'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between px-2 py-1 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-300">Theme</span>
                <ThemeToggleSwitch size="sm" showLabels={true} />
              </div>

              <button
                onClick={handleOpenLogin}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 dark:text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg min-h-[44px] cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-slate-950 dark:text-slate-950" />
                <span>Student / Staff Portal Login</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                <span>Direct Office Desk:</span>
                <a href={`tel:${COLLEGE_INFO.contact.phone.replace(/[^0-9+]/g, '')}`} className="text-amber-300 font-mono font-semibold">
                  {COLLEGE_INFO.contact.phone}
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT ROUTING */}
      <main className="flex-1">
        {activePage === 'home' && (
          <>
            {/* Hero Section with Seamless Gradient College Photo Background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <HeroSection
                onLoginClick={handleOpenLogin}
                onOpenPhotoLightbox={() => setIsPhotoLightboxOpen(true)}
              />
            </motion.div>

            {/* Academic Excellence & Institutional Distinction Showcase */}
            <motion.div
              id="academic-excellence"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <AcademicExcellenceShowcase
                onLoginClick={handleOpenLogin}
                onNavigateToAcademics={() => navigateTo('academics')}
              />
            </motion.div>

            {/* Existing College Photo Carousel (Relocated: preserved as like that only) */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <CampusPhotoSection
                onLoginClick={handleOpenLogin}
              />
            </motion.div>

            {/* Principal's Message with Official Photo */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <PrincipalSection />
            </motion.div>

            {/* Official Statutory Ethics, Safety & Regulatory Governance Charter */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <StatutoryEthicsCharter />
            </motion.div>

            {/* Quick Access Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <QuickAccess
                onLoginClick={handleOpenLogin}
                onNavigate={(page) => navigateTo(page as PublicPageId)}
              />
            </motion.div>

            {/* Latest Announcements & Notice Preview */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <AnnouncementsPreview
                onLoginClick={handleOpenLogin}
                onViewAllClick={() => navigateTo('announcements')}
              />
            </motion.div>

            {/* Compact Collapsible Student FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <StudentFAQSection
                onLoginClick={handleOpenLogin}
                onNavigateToGrievances={() => navigateTo('complaints')}
              />
            </motion.div>
          </>
        )}

        {/* DEDICATED SUB-PAGE: ABOUT */}
        {activePage === 'about' && (
          <div>
            <SubPageHeader
              title="About N.S.S. College, Ottapalam"
              subtitle="Heritage, Vision, Mission & Founder Bharatha Kesari Sri. Mannath Padmanabhan"
              onBack={() => navigateTo('home')}
              onLoginClick={handleOpenLogin}
            />
            <AboutSection />
            <CollegeStats />
            <SubPageBottomNav onBack={() => navigateTo('home')} onLoginClick={handleOpenLogin} />
          </div>
        )}

        {/* DEDICATED SUB-PAGE: ACADEMICS */}
        {activePage === 'academics' && (
          <div>
            <SubPageHeader
              title="Academic Programmes (FYUGP)"
              subtitle="13 Undergraduate & 6 Postgraduate Programmes affiliated to University of Calicut"
              onBack={() => navigateTo('home')}
              onLoginClick={handleOpenLogin}
            />
            <AcademicsSection />
            <SubPageBottomNav onBack={() => navigateTo('home')} onLoginClick={handleOpenLogin} />
          </div>
        )}

        {/* DEDICATED SUB-PAGE: DEPARTMENTS */}
        {activePage === 'departments' && (
          <div>
            <SubPageHeader
              title="Academic Departments"
              subtitle="Explore teaching faculties, laboratories, research and course offerings"
              onBack={() => navigateTo('home')}
              onLoginClick={handleOpenLogin}
            />
            <DepartmentsPreview />
            <SubPageBottomNav onBack={() => navigateTo('home')} onLoginClick={handleOpenLogin} />
          </div>
        )}

        {/* DEDICATED SUB-PAGE: CAMPUS & FACILITIES */}
        {activePage === 'facilities' && (
          <div>
            <SubPageHeader
              title="Campus & Facilities"
              subtitle="41-Acre scenic campus, automated library, modern science labs and sports infrastructure"
              onBack={() => navigateTo('home')}
              onLoginClick={handleOpenLogin}
            />
            <CampusFacilities />
            <SubPageBottomNav onBack={() => navigateTo('home')} onLoginClick={handleOpenLogin} />
          </div>
        )}

        {/* DEDICATED SUB-PAGE: CLUBS & STUDENT LIFE */}
        {activePage === 'student-life' && (
          <div>
            <SubPageHeader
              title="Student Life, Clubs & Cells"
              subtitle="NSS, NCC, Entrepreneurship Development, Arts, Sports and Student Welfare"
              onBack={() => navigateTo('home')}
              onLoginClick={handleOpenLogin}
            />
            <StudentLife />
            <SubPageBottomNav onBack={() => navigateTo('home')} onLoginClick={handleOpenLogin} />
          </div>
        )}

        {/* DEDICATED SUB-PAGE: ANNOUNCEMENTS & CIRCULARS */}
        {activePage === 'announcements' && (
          <div>
            <SubPageHeader
              title="Notice Board & Circulars"
              subtitle="Official college notifications, university examination schedules & regulatory links"
              onBack={() => navigateTo('home')}
              onLoginClick={handleOpenLogin}
            />
            <AnnouncementsPreview onLoginClick={handleOpenLogin} showAll={true} />
            <ImportantLinks />
            <SubPageBottomNav onBack={() => navigateTo('home')} onLoginClick={handleOpenLogin} />
          </div>
        )}

        {/* DEDICATED SUB-PAGE: COMPLAINTS & GRIEVANCE REDRESSAL CELL */}
        {activePage === 'complaints' && (
          <div>
            <SubPageHeader
              title="Statutory Grievance & Whistleblower Redressal Cell"
              subtitle="Confidential Anti-Ragging, Anti-Drug Reporting, Infrastructure & Department Grievances"
              onBack={() => navigateTo('home')}
              onLoginClick={handleOpenLogin}
            />
            <PublicGrievanceView onLoginClick={handleOpenLogin} />
            <SubPageBottomNav onBack={() => navigateTo('home')} onLoginClick={handleOpenLogin} />
          </div>
        )}

        {/* DEDICATED SUB-PAGE: CONTACT & LOCATION */}
        {activePage === 'contact' && (
          <div>
            <SubPageHeader
              title="Contact & Location"
              subtitle="Administrative office directory, telephone contacts, postal address and route map"
              onBack={() => navigateTo('home')}
              onLoginClick={handleOpenLogin}
            />
            <ContactSection />
            <SubPageBottomNav onBack={() => navigateTo('home')} onLoginClick={handleOpenLogin} />
          </div>
        )}
      </main>

      {/* Streamlined Institutional Footer */}
      <footer className="bg-slate-950 text-white pt-10 sm:pt-14 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pb-8 border-b border-slate-800 text-sm">
            {/* Col 1: Identity */}
            <div className="space-y-3">
              <CollegeLogo size="md" variant="dark" />
              <p className="text-xs text-slate-400 leading-relaxed">
                N.S.S. College, Ottapalam is a premier institution of higher learning in Palakkad District, Kerala, managed by the Nair Service Society (NSS).
              </p>
              <div className="text-xs text-amber-300 font-semibold">
                Affiliated to University of Calicut | NAAC 'A' Grade
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Institutional Pages
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button onClick={() => navigateTo('about')} className="hover:text-white transition-colors">
                    About Institution & Founder
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('academics')} className="hover:text-white transition-colors">
                    FYUGP Academics (13 UG & 6 PG)
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('departments')} className="hover:text-white transition-colors">
                    Departments Directory
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('facilities')} className="hover:text-white transition-colors">
                    Campus & Automated Library
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('announcements')} className="hover:text-white transition-colors">
                    Notice Board & Circulars
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (activePage !== 'home') {
                        navigateTo('home');
                        setTimeout(() => {
                          document.getElementById('student-faqs')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } else {
                        document.getElementById('student-faqs')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Student FAQs & Help Desk
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('complaints')} className="hover:text-amber-300 text-rose-300 font-semibold transition-colors flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Complaints & Grievance Cell</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Portal Access */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                ERP Portal Access
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button onClick={handleOpenLogin} className="hover:text-white transition-colors">
                    Student Attendance & Profile
                  </button>
                </li>
                <li>
                  <button onClick={handleOpenLogin} className="hover:text-white transition-colors">
                    Faculty Academic Marking Hub
                  </button>
                </li>
                <li>
                  <button onClick={handleOpenLogin} className="hover:text-white transition-colors">
                    HOD Department Adjudication
                  </button>
                </li>
                <li>
                  <button onClick={handleOpenLogin} className="hover:text-white transition-colors">
                    Principal & Admin Oversight
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact Summary */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                College Office
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{COLLEGE_INFO.contact.formattedAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{COLLEGE_INFO.contact.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{COLLEGE_INFO.contact.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
            <div>
              © {new Date().getFullYear()} {COLLEGE_INFO.collegeName}. Managed by {COLLEGE_INFO.management}.
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleOpenLogin}
                className="text-amber-300 hover:underline font-semibold min-h-[36px] flex items-center"
              >
                Staff & Student ERP Login →
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Role Login Modal (Unbroken ERP Access) */}
      <RoleLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Global Campus Photo Lightbox Modal */}
      {isPhotoLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="relative max-w-6xl w-full flex flex-col items-center">
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

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-slate-900/90 text-amber-300 border border-amber-400/40 shadow-2xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition-all cursor-pointer group hover:scale-110 active:scale-95"
            aria-label="Back to Top"
            title="Back to Top"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable Sub-Page Header Component
interface SubPageHeaderProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  onLoginClick: () => void;
}

const SubPageHeader: React.FC<SubPageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onLoginClick
}) => {
  return (
    <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white py-6 sm:py-8 border-b border-rose-900/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-amber-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium">NSS College Ottapalam</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white font-display tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-light">
              {subtitle}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onLoginClick}
              className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 dark:text-slate-950 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 min-h-[38px] sm:min-h-[44px]"
            >
              <GraduationCap className="w-4 h-4 text-slate-950 dark:text-slate-950" />
              <span>ERP Portal Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Sub-Page Bottom Navigation
interface SubPageBottomNavProps {
  onBack: () => void;
  onLoginClick: () => void;
}

const SubPageBottomNav: React.FC<SubPageBottomNavProps> = ({ onBack, onLoginClick }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold transition-colors min-h-[44px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-rose-900 dark:text-amber-400" />
          <span>Return to College Homepage</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Have questions or need ERP access?
          </span>
          <button
            type="button"
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors min-h-[44px] cursor-pointer"
          >
            <span>Staff & Student Login</span>
            <ChevronRight className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const PublicHomePage: React.FC<PublicHomePageProps> = (props) => {
  return (
    <CursorParallaxProvider>
      <PublicHomePageInner {...props} />
    </CursorParallaxProvider>
  );
};
