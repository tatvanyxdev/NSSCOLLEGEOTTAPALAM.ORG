import React, { useEffect, useMemo, useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import {
  buildAggregatedAttendanceReport,
  formatLocalDateISO,
  ReportPeriodMode,
  shiftIsoDate,
  shiftMonthIso
} from '../../utils/attendanceAggregation';
import {
  buildGoogleSheetsTsv,
  CsvExportTab,
  exportAttendanceToCsv,
  exportAttendanceToExcelWorkbook
} from '../../utils/attendanceReportExport';
import { Course, CourseOffering } from '../../types';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCopy,
  Download,
  FileSpreadsheet,
  Filter,
  Grid3X3,
  History,
  ListChecks,
  RotateCcw,
  Search,
  Users
} from 'lucide-react';

type ReportViewTab = 'STUDENT_SUMMARY' | 'DATE_MATRIX' | 'CLASS_SUBJECT' | 'DAILY_REGISTER' | 'AUDIT';

export const ReportsCenterView: React.FC = () => {
  const {
    settings,
    departments,
    programmes,
    courses,
    courseCategories,
    courseOfferings,
    courseGroups,
    faculty,
    facultyAssignments,
    students,
    studentCourseRegistrations,
    timetablePeriods,
    timetableEntries,
    classSessions,
    attendanceRecords,
    specialAttendanceEvents,
    specialAttendanceRecords,
    auditLogs
  } = useCollegeData();

  const { user, activeRole } = useAuth();
  const canExport = can(activeRole, 'reports', 'export_csv') || activeRole !== 'STUDENT';
  const canViewAudit = can(activeRole, 'audit_logs', 'read');
  const canReadCollege = can(activeRole, 'reports', 'read_college');

  const currentFaculty = faculty.find(f => f.id === user?.id || f.email === user?.email);
  const hodDeptId = activeRole === 'HOD' ? (user?.departmentId || currentFaculty?.departmentId) : undefined;
  const teacherScopeId = activeRole === 'TEACHER' ? (currentFaculty?.id || user?.id) : undefined;

  const todayIso = formatLocalDateISO(new Date());
  const currentMonthIso = todayIso.slice(0, 7);

  // Period & Filtering States
  const [periodMode, setPeriodMode] = useState<ReportPeriodMode>('DAILY');
  const [anchorDate, setAnchorDate] = useState<string>(todayIso);
  const [monthStr, setMonthStr] = useState<string>(currentMonthIso);
  const [customStart, setCustomStart] = useState<string>(shiftIsoDate(todayIso, -6));
  const [customEnd, setCustomEnd] = useState<string>(todayIso);

  const [selectedDept, setSelectedDept] = useState<string>(hodDeptId || 'ALL');
  const [selectedProgramme, setSelectedProgramme] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');
  const [selectedCourseGroup, setSelectedCourseGroup] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SHORTAGE' | 'WARNING' | 'ELIGIBLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // View Tab & Interaction States
  const [activeTab, setActiveTab] = useState<ReportViewTab>('STUDENT_SUMMARY');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSheets, setCopiedSheets] = useState(false);

  useEffect(() => {
    if (!canViewAudit && activeTab === 'AUDIT') {
      setActiveTab('STUDENT_SUMMARY');
    }
  }, [canViewAudit, activeTab]);

  useEffect(() => {
    if (!canReadCollege && hodDeptId) {
      setSelectedDept(hodDeptId);
    }
  }, [canReadCollege, hodDeptId]);

  // Reset cascading sub-filters when department changes
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDept(deptId);
    setSelectedProgramme('ALL');
    setSelectedCourseGroup('ALL');
  };

  // Cascading options
  const availableProgrammes = useMemo(() => {
    if (selectedDept === 'ALL') return programmes;
    return programmes.filter(p => p.departmentId === selectedDept);
  }, [programmes, selectedDept]);

  const availableCourseGroups = useMemo(() => {
    const offeringMap = new Map<string, CourseOffering>(courseOfferings.map(o => [o.id, o]));
    const courseMap = new Map<string, Course>(courses.map(c => [c.id, c]));
    return courseGroups
      .filter(g => {
        const off = offeringMap.get(g.courseOfferingId);
        const crs = off ? courseMap.get(off.courseId) : undefined;
        const deptId = off?.departmentId || crs?.departmentId;
        if (selectedDept !== 'ALL' && deptId && deptId !== selectedDept) return false;
        if (selectedSemester !== 'ALL' && off?.semesterNumber && off.semesterNumber !== selectedSemester) return false;
        if (teacherScopeId) {
          const isAssigned = facultyAssignments.some(
            fa => fa.courseGroupId === g.id && fa.facultyId === teacherScopeId
          );
          const hasSession = classSessions.some(
            s => s.courseGroupId === g.id && (s.facultyId === teacherScopeId || s.substituteFacultyId === teacherScopeId)
          );
          if (!isAssigned && !hasSession) return false;
        }
        return true;
      })
      .map(g => {
        const off = offeringMap.get(g.courseOfferingId);
        const crs = off ? courseMap.get(off.courseId) : undefined;
        return {
          id: g.id,
          label: `${crs?.courseCode || 'CRS'} · ${crs?.courseTitle || g.groupName} (${g.groupName})`
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [courseGroups, courseOfferings, courses, selectedDept, selectedSemester, teacherScopeId, facultyAssignments, classSessions]);

  // Core aggregated dataset
  const report = useMemo(() => {
    return buildAggregatedAttendanceReport({
      mode: periodMode,
      anchorDate,
      monthStr,
      customStart,
      customEnd,
      departmentId: selectedDept,
      programmeId: selectedProgramme,
      semesterNumber: selectedSemester,
      courseGroupId: selectedCourseGroup,
      searchQuery,
      statusFilter,
      facultyScopeId: teacherScopeId,
      settings,
      departments,
      programmes,
      courses,
      courseCategories,
      courseOfferings,
      courseGroups,
      faculty,
      facultyAssignments,
      students,
      studentCourseRegistrations,
      timetablePeriods,
      timetableEntries,
      classSessions,
      attendanceRecords,
      specialAttendanceEvents,
      specialAttendanceRecords
    });
  }, [
    periodMode,
    anchorDate,
    monthStr,
    customStart,
    customEnd,
    selectedDept,
    selectedProgramme,
    selectedSemester,
    selectedCourseGroup,
    searchQuery,
    statusFilter,
    teacherScopeId,
    settings,
    departments,
    programmes,
    courses,
    courseCategories,
    courseOfferings,
    courseGroups,
    faculty,
    facultyAssignments,
    students,
    studentCourseRegistrations,
    timetablePeriods,
    timetableEntries,
    classSessions,
    attendanceRecords,
    specialAttendanceEvents,
    specialAttendanceRecords
  ]);

  const activeScopeSummary = useMemo(() => {
    const deptName =
      selectedDept === 'ALL'
        ? 'All Departments'
        : departments.find(d => d.id === selectedDept)?.code || 'Department';
    const progName =
      selectedProgramme === 'ALL'
        ? 'All Classes'
        : programmes.find(p => p.id === selectedProgramme)?.name || 'Class';
    const semLabel = selectedSemester === 'ALL' ? 'All Semesters' : `Semester ${selectedSemester}`;
    const grpLabel =
      selectedCourseGroup === 'ALL'
        ? 'All Courses'
        : availableCourseGroups.find(g => g.id === selectedCourseGroup)?.label || 'Course Group';
    return `${deptName} · ${progName} · ${semLabel} · ${grpLabel}`;
  }, [selectedDept, selectedProgramme, selectedSemester, selectedCourseGroup, departments, programmes, availableCourseGroups]);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedbackBanner({ type, text });
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const handleExportWorkbook = async () => {
    try {
      const filename = await exportAttendanceToExcelWorkbook(report, {
        collegeName: settings.collegeName || 'NSS College Ottapalam',
        scopeSummary: activeScopeSummary,
        minPercentage: settings.minAttendancePercentage
      });
      showNotice('success', `Downloaded multi-sheet Excel workbook (${filename}).`);
    } catch {
      showNotice('error', 'Failed to generate Excel workbook.');
    }
  };

  const handleExportCsv = () => {
    const csvTab: CsvExportTab = activeTab === 'AUDIT' ? 'STUDENT_SUMMARY' : activeTab;
    try {
      const filename = exportAttendanceToCsv(report, csvTab);
      showNotice('success', `Downloaded CSV sheet (${filename}).`);
    } catch {
      showNotice('error', 'Failed to export CSV sheet.');
    }
  };

  const handleCopyForGoogleSheets = async () => {
    const csvTab: CsvExportTab = activeTab === 'AUDIT' ? 'STUDENT_SUMMARY' : activeTab;
    const tsv = buildGoogleSheetsTsv(report, csvTab);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedSheets(true);
      showNotice('success', 'Copied formatted rows — open Google Sheets and press Ctrl+V / Cmd+V to paste directly.');
      setTimeout(() => setCopiedSheets(false), 2200);
    } catch {
      showNotice('error', 'Clipboard write was blocked by browser permissions.');
    }
  };

  const handleResetFilters = () => {
    setPeriodMode('DAILY');
    setAnchorDate(todayIso);
    setMonthStr(currentMonthIso);
    setSelectedDept(hodDeptId || 'ALL');
    setSelectedProgramme('ALL');
    setSelectedSemester('ALL');
    setSelectedCourseGroup('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  const periodModes: { id: ReportPeriodMode; label: string }[] = [
    { id: 'DAILY', label: 'Daily' },
    { id: 'WEEKLY', label: 'Weekly' },
    { id: 'MONTHLY', label: 'Monthly' },
    { id: 'SEMESTER', label: 'Semester' },
    { id: 'CUSTOM', label: 'Custom Dates' }
  ];

  const viewTabs: { id: ReportViewTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'STUDENT_SUMMARY',
      label: 'Student Summary',
      icon: <Users className="w-3.5 h-3.5" />,
      count: report.scopedStudents.length
    },
    {
      id: 'DATE_MATRIX',
      label: 'Attendance Grid',
      icon: <Grid3X3 className="w-3.5 h-3.5" />,
      count: report.matrixColumns.length
    },
    {
      id: 'CLASS_SUBJECT',
      label: 'Classes & Subjects',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      count: report.scopedClasses.length
    },
    {
      id: 'DAILY_REGISTER',
      label: 'Session Logs',
      icon: <ListChecks className="w-3.5 h-3.5" />,
      count: report.scopedSessions.length
    },
    ...(canViewAudit
      ? [
          {
            id: 'AUDIT' as const,
            label: 'Audit Trail',
            icon: <History className="w-3.5 h-3.5" />,
            count: auditLogs.length
          }
        ]
      : [])
  ];

  const statusBadgeClass = (status: string) => {
    if (status === 'ELIGIBLE') {
      return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
    }
    if (status === 'WARNING') {
      return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900';
    }
    if (status === 'SHORTAGE') {
      return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const matrixCellStyle = (code: string) => {
    if (code === 'P') return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300';
    if (code === 'A') return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold';
    if (code === 'OD' || code === 'SP' || code === 'DL') {
      return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold';
    }
    if (code === 'ML') return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold';
    if (code === 'CX') return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 line-through';
    return 'text-slate-400 dark:text-slate-600';
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header & Unified Sheets Export Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-900 text-amber-300 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Attendance Reports &amp; Sheets Export
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{report.dateWindow.label}</span>
              {' · '}
              <span>{activeScopeSummary}</span>
            </p>
          </div>
        </div>

        {canExport && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportWorkbook}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Sheets (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              onClick={handleCopyForGoogleSheets}
              title="Copy table to clipboard formatted for direct pasting into Google Sheets"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedSheets ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied for Sheets</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-4 h-4" />
                  <span>Copy for Google Sheets</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Simplified 2-Row Filter Console */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
        {/* Row 1: Period Mode & Contextual Date Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {periodModes.map(m => {
              const active = periodMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPeriodMode(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                    active
                      ? 'bg-rose-900 text-white border-rose-900'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(periodMode === 'DAILY' || periodMode === 'WEEKLY') && (
              <>
                <button
                  type="button"
                  onClick={() => setAnchorDate(prev => shiftIsoDate(prev, periodMode === 'DAILY' ? -1 : -7))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title={periodMode === 'DAILY' ? 'Previous Day' : 'Previous Week'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={anchorDate}
                  onChange={e => setAnchorDate(e.target.value || todayIso)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setAnchorDate(prev => shiftIsoDate(prev, periodMode === 'DAILY' ? 1 : 7))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title={periodMode === 'DAILY' ? 'Next Day' : 'Next Week'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAnchorDate(todayIso)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Today
                </button>
              </>
            )}

            {periodMode === 'MONTHLY' && (
              <>
                <button
                  type="button"
                  onClick={() => setMonthStr(prev => shiftMonthIso(prev, -1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="month"
                  value={monthStr}
                  onChange={e => setMonthStr(e.target.value || currentMonthIso)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setMonthStr(prev => shiftMonthIso(prev, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {periodMode === 'CUSTOM' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {periodMode === 'SEMESTER' && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Showing cumulative semester attendance
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Cascading Academic Hierarchy Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Department */}
          <select
            value={selectedDept}
            disabled={!canReadCollege && Boolean(hodDeptId)}
            onChange={e => handleDepartmentChange(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 disabled:opacity-60"
          >
            {canReadCollege && <option value="ALL">All Departments</option>}
            {departments
              .filter(d => canReadCollege || !hodDeptId || d.id === hodDeptId)
              .map(d => (
                <option key={d.id} value={d.id}>
                  {d.code} · {d.name}
                </option>
              ))}
          </select>

          {/* Programme / Class */}
          <select
            value={selectedProgramme}
            onChange={e => setSelectedProgramme(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Classes / Programmes</option>
            {availableProgrammes.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Semester */}
          <select
            value={selectedSemester === 'ALL' ? 'ALL' : String(selectedSemester)}
            onChange={e => setSelectedSemester(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={String(sem)}>
                Semester {sem} (S{sem})
              </option>
            ))}
          </select>

          {/* Course / Class Group */}
          <select
            value={selectedCourseGroup}
            onChange={e => setSelectedCourseGroup(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Courses / Groups</option>
            {availableCourseGroups.map(g => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>

          {/* Attendance Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">All Statuses</option>
            <option value="SHORTAGE">Shortage (&lt;{settings.minAttendancePercentage}%)</option>
            <option value="WARNING">Warning ({settings.minAttendancePercentage}–{settings.warningAttendancePercentage}%)</option>
            <option value="ELIGIBLE">Eligible (≥{settings.warningAttendancePercentage}%)</option>
          </select>

          {/* Search + Reset */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Student / Roll / Reg..."
                className="w-full pl-8 pr-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset all filters"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sessions Held
            </span>
            <CalendarCheck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {report.kpis.sessionsConducted}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            In selected period &amp; class
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Attendance
            </span>
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {report.kpis.averagePercentage}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Across {report.kpis.totalStudents} student(s)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Eligible Students
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {report.kpis.eligibleCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            ≥ {settings.warningAttendancePercentage}% attendance
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Shortage (&lt;{settings.minAttendancePercentage}%)
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-400 tabular-nums">
            {report.kpis.shortageCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {report.kpis.warningCount} in warning band
          </p>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {viewTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-2 transition-colors border cursor-pointer ${
                isActive
                  ? 'bg-slate-900 dark:bg-rose-900 text-white border-slate-900 dark:border-rose-900'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {activeTab === 'STUDENT_SUMMARY' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll / Reg No</th>
                  <th className="py-3 px-4">Class &amp; Sem</th>
                  <th className="py-3 px-4 text-center">Held</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">OD / SP</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.scopedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      No students match the selected period and class filters.
                    </td>
                  </tr>
                ) : (
                  report.scopedStudents.map(row => {
                    const isExpanded = expandedStudentId === row.student.id;
                    return (
                      <React.Fragment key={row.student.id}>
                        <tr
                          onClick={() =>
                            setExpandedStudentId(prev => (prev === row.student.id ? null : row.student.id))
                          }
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                  {row.student.fullName}
                                </span>
                                <span
                                  className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                    row.policy === 'SESSION_STRICT'
                                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                                  }`}
                                >
                                  {row.policyLabel}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                            {row.student.rollNumber} · {row.student.universityRegisterNumber || row.student.admissionNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {row.prog?.name || 'Programme'}
                            </span>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                              {row.dept?.code || 'DEPT'} · Sem {row.student.currentSemester || 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                            {row.conducted}
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                            {row.present}
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums text-indigo-700 dark:text-indigo-400">
                            {row.od + row.specialDuty}
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums text-rose-700 dark:text-rose-400">
                            {row.absent}
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                            {row.conducted > 0 ? (
                              <div>
                                <span>{row.percentage}%</span>
                                {row.policy === 'SESSION_STRICT' && row.totalWorkingDays > 0 && (
                                  <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                    {row.awardedDays}/{row.totalWorkingDays}d · HW {row.hourWisePercentage}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadgeClass(row.status)}`}
                            >
                              {row.status === 'NO_SESSIONS' ? 'No Sessions' : row.status}
                            </span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/90 dark:bg-slate-950/70">
                            <td colSpan={9} className="px-6 py-3 space-y-3">
                              {row.policy === 'SESSION_STRICT' && row.halfDayPenalties.length > 0 && (
                                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                      Half-Day Penalty Breakdown: {row.halfDaysLost} session(s) forfeited (-
                                      {(row.halfDaysLost * 0.5).toFixed(1)} working days)
                                    </span>
                                    <span className="text-[11px] font-mono text-amber-800 dark:text-amber-400">
                                      Session Rule: {row.percentage}% ({row.awardedDays}/{row.totalWorkingDays} days) · Hour-Wise:{' '}
                                      {row.hourWisePercentage}%
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {row.halfDayPenalties.map(pen => (
                                      <div
                                        key={`${pen.date}-${pen.session}`}
                                        className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between gap-2 text-[11px]"
                                      >
                                        <div className="min-w-0">
                                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                            {pen.date}
                                          </span>{' '}
                                          <span className="font-bold text-amber-900 dark:text-amber-300">
                                            · {pen.session === 'FN' ? 'FN' : 'AN'}
                                          </span>
                                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                            Absent: {pen.absentPeriodLabels.join(', ')} ({pen.coursesAffected.join(', ')})
                                          </p>
                                        </div>
                                        <span className="font-mono font-bold text-rose-700 dark:text-rose-400 shrink-0">
                                          -0.5d
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {row.courses.length === 0 ? (
                                <p className="text-[11px] text-slate-500">No course registrations in this filter scope.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Subject Breakdown ({report.dateWindow.label}) · Always Hour-Wise
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {row.courses.map(c => (
                                      <div
                                        key={c.courseGroupId}
                                        className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                                      >
                                        <div className="min-w-0">
                                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {c.courseCode} · {c.courseTitle}
                                          </p>
                                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                            {c.groupName} · {c.facultyName}
                                          </p>
                                        </div>
                                        <div className="text-right shrink-0 font-mono tabular-nums">
                                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                            {c.conducted > 0 ? `${c.percentage}%` : '—'}
                                          </span>
                                          <span className="text-[10px] text-slate-500">
                                            {c.effectiveAttended}/{c.conducted}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'DATE_MATRIX' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Period-by-Period Register Matrix ({report.matrixColumns.length} session column{report.matrixColumns.length === 1 ? '' : 's'})
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Codes: P = Present · A = Absent · DL = Duty Leave · OD = On Duty · ML = Medical · SP = Special · CX = Cancelled
            </span>
          </div>

          {report.matrixColumns.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              No conducted sessions found for the selected timeframe and filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3 sticky left-0 bg-slate-50 dark:bg-slate-950 z-10 min-w-[190px] border-r border-slate-200 dark:border-slate-800">
                      Student
                    </th>
                    {report.matrixColumns.map(col => (
                      <th key={col.key} className="py-2 px-2 text-center whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
                        <div>{col.label}</div>
                        <div className="text-[9px] font-mono text-slate-400">{col.subLabel}</div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-center">Att / Held</th>
                    <th className="py-2.5 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.matrixRows.map(row => (
                    <tr key={row.student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                          {row.student.fullName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {row.student.rollNumber} · {row.deptCode}
                        </div>
                      </td>
                      {report.matrixColumns.map(col => {
                        const val = row.cells[col.key] || '-';
                        return (
                          <td
                            key={col.key}
                            className={`py-2 px-2 text-center font-mono text-[11px] border-r border-slate-100 dark:border-slate-800 ${matrixCellStyle(val)}`}
                          >
                            {val}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {row.attended}/{row.conducted}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                        {row.conducted > 0 ? `${row.percentage}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'CLASS_SUBJECT' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Course &amp; Class Group</th>
                  <th className="py-3 px-4">Department &amp; Sem</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4 text-center">Enrolled</th>
                  <th className="py-3 px-4 text-center">Sessions Held</th>
                  <th className="py-3 px-4 text-center">Avg %</th>
                  <th className="py-3 px-4 text-right">Shortage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.scopedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      No classes or courses found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  report.scopedClasses.map(cls => (
                    <tr
                      key={cls.courseGroupId}
                      onClick={() => {
                        setSelectedCourseGroup(cls.courseGroupId);
                        setActiveTab('STUDENT_SUMMARY');
                      }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {cls.courseCode} · {cls.courseTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {cls.groupName} · {cls.categoryName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{cls.departmentCode}</span>
                        <span className="block text-[11px] text-slate-500">Semester {cls.semesterNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{cls.facultyName}</td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums">{cls.enrolledCount}</td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold">{cls.sessionsConducted}</td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                        {cls.sessionsConducted > 0 ? `${cls.avgPercentage}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {cls.shortageCount > 0 ? (
                          <span className="text-rose-700 dark:text-rose-400 font-bold">{cls.shortageCount} shortage</span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">0 shortage</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'DAILY_REGISTER' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Date &amp; Period</th>
                  <th className="py-3 px-4">Course &amp; Class</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Topic Covered</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">OD / ML</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-right">Marked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.scopedSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      No conducted sessions recorded in this timeframe.
                    </td>
                  </tr>
                ) : (
                  report.scopedSessions.map(s => (
                    <tr key={s.session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{s.date}</div>
                        <div className="text-[11px] text-slate-500">{s.periodLabel}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {s.courseCode} · {s.courseTitle}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {s.groupName} · {s.departmentCode} · S{s.semesterNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{s.facultyName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {s.session.topicCovered || 'Regular Lecture'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                        {s.presentCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-indigo-700 dark:text-indigo-400">
                        {s.odCount + s.medicalCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-rose-700 dark:text-rose-400">
                        {s.absentCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {s.totalMarked}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'AUDIT' && canViewAudit && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Immutable Audit Trail</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every attendance mark, correction approval, and configuration modification
            </p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">No audit entries recorded yet.</div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-400">{log.actorName}</span>
                      <span className="text-[10px] text-slate-400">({log.actorRole})</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      Target: <strong>{log.entityType}</strong> (ID: {log.entityId})
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
