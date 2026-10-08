import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  ChevronDown,
  Search,
  BookOpen,
  CalendarCheck,
  Bus,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'ATTENDANCE' | 'PORTAL' | 'SERVICES' | 'ACADEMICS';
  question: string;
  answer: string;
  highlight?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'ATTENDANCE',
    question: 'What is the minimum attendance required for semester examination eligibility?',
    answer:
      'Under University of Calicut FYUGP regulations, students must secure a minimum of 75% attendance in each course. Students with 65% to 74% attendance may apply for institutional condonation on genuine medical or approved institutional duty grounds. Attendance below 65% is not eligible for condonation and requires re-enrollment.',
    highlight: '75% Minimum Required'
  },
  {
    id: 'faq-2',
    category: 'PORTAL',
    question: 'How do I log in to the student ERP portal for the first time?',
    answer:
      'Click the "Portal Login" button on the top right. Select "Student" and enter your University Register Number (e.g. UCOTFCS001) or College Admission Number as your username. Your default password is provided by your Class Tutor or Department Office. Once logged in, you can update your password from your Profile page.',
    highlight: 'Register Number as Username'
  },
  {
    id: 'faq-3',
    category: 'SERVICES',
    question: 'How do I apply for On-Duty (OD) or Medical Leave attendance credits?',
    answer:
      'Log in to the student portal and navigate to "OD & Leave". Fill out the date, affected periods, and upload/provide the event or medical certificate details. Once your Class Tutor and Head of Department endorse the request, your attendance calculations update automatically with duty sanction hours.',
    highlight: 'Online Tutor Verification'
  },
  {
    id: 'faq-4',
    category: 'SERVICES',
    question: 'How do I apply for Kerala RTC & Private Route Bus Concession?',
    answer:
      'Bus concession applications are submitted directly through the portal under the "Bus Concession" section. Enter your starting bus stop and route distance. Following HOD verification, the application is endorsed in the college register and your physical concession slip will be stamped at the administrative counter.',
    highlight: 'KSRTC & Private Passes'
  },
  {
    id: 'faq-5',
    category: 'SERVICES',
    question: 'How can I obtain Bonafide, Conduct, or Fee Certificates?',
    answer:
      'Submit a request via the "Certificates" tab in your student dashboard. Specify the purpose (scholarship, passport, educational loan, or concession). You can monitor processing progress in real time and collect the sealed hard copy from Counter 2 of the College Office.',
    highlight: 'Track Online • Counter Collection'
  },
  {
    id: 'faq-6',
    category: 'ACADEMICS',
    question: 'How do Major, Minor, and Multi-Disciplinary (MDC) courses work in FYUGP?',
    answer:
      'Under the FYUGP 4-year honours framework, your Major is your core specialization, while Minors provide complementary skill sets. MDC, AEC (Ability Enhancement), and SEC (Skill Enhancement) courses allow interdisciplinary learning across departments. Your registered course basket and period schedule can be reviewed under "My Subjects" and "Timetable".',
    highlight: 'FYUGP Credit Framework'
  },
  {
    id: 'faq-7',
    category: 'ATTENDANCE',
    question: 'Where can I report complaints or grievances with complete confidentiality?',
    answer:
      'N.S.S. College, Ottapalam operates a zero-tolerance policy against ragging, substance abuse, and harassment. Use the public "Grievance Portal" on this website to submit an encrypted report anonymously or with identification. National anti-ragging toll-free helpline 1800-180-5522 is also available 24/7.',
    highlight: '100% Confidential Redressal'
  }
];

const CATEGORIES = [
  { id: 'ALL', label: 'All FAQs', icon: HelpCircle },
  { id: 'ATTENDANCE', label: 'Attendance & Exams', icon: CalendarCheck },
  { id: 'PORTAL', label: 'Login & Portal', icon: BookOpen },
  { id: 'SERVICES', label: 'Bus & Certificates', icon: Bus },
  { id: 'ACADEMICS', label: 'FYUGP Academics', icon: FileCheck }
];

export const StudentFAQSection: React.FC<{
  onLoginClick?: () => void;
  onNavigateToGrievances?: () => void;
}> = ({ onLoginClick, onNavigateToGrievances }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>(['faq-1']);

  const toggleItem = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setExpandedIds(filteredFAQs.map(f => f.id));
  };

  const collapseAll = () => {
    setExpandedIds([]);
  };

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter(item => {
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.highlight && item.highlight.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section className="py-12 sm:py-16 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 transition-colors duration-200" id="student-faqs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-rose-700 dark:text-amber-300" />
              <span>Student Help Desk</span>
            </div>
            <h2 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-light">
              Quick answers to common questions about attendance, portal access, bus concessions, and examinations.
            </p>
          </div>

          {/* Quick Action Toggle */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 self-start sm:self-auto">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Filter Controls: Search & Category Pills */}
        <div className="space-y-3">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by topic (e.g. attendance percentage, bus pass, login password)..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 dark:focus:border-amber-400 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-rose-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-2.5">
          {filteredFAQs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No matching questions found. Try a different search term or browse by category.
            </div>
          ) : (
            filteredFAQs.map(item => {
              const isExpanded = expandedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'bg-white dark:bg-slate-900 border-rose-900/30 dark:border-amber-400/40 shadow-xs'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 select-none cursor-pointer"
                    aria-expanded={isExpanded}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.highlight && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                            {item.highlight}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {item.question}
                      </h3>
                    </div>

                    <div
                      className={`p-1.5 rounded-lg shrink-0 transition-transform duration-200 ${
                        isExpanded
                          ? 'bg-rose-50 dark:bg-amber-400/10 text-rose-950 dark:text-amber-300 rotate-180'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 mt-1">
                          <p className="pt-2">{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Helpful Footnote / Direct Action Callout */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 rounded-xl shrink-0 border border-rose-200 dark:border-rose-800/40">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Still have a question or facing an issue?</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Sign in to your student dashboard or submit an official inquiry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {onNavigateToGrievances && (
              <button
                onClick={onNavigateToGrievances}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
              >
                Grievance Desk
              </button>
            )}
            {onLoginClick && (
              <button
                onClick={onLoginClick}
                className="px-3.5 py-1.5 bg-rose-900 hover:bg-rose-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
              >
                <span>Student Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
