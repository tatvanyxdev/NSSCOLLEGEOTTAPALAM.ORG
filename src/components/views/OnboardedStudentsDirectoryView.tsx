import React, { useMemo, useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Student } from '../../types';
import { StudentIndividualProfileView } from './StudentIndividualProfileView';
import { DigitalIdModal } from '../student/DigitalIdModal';
import { AttendanceCalculatorModal } from '../student/AttendanceCalculatorModal';
import {
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  Calculator,
  Download,
  IdCard,
  RotateCcw,
  Search
} from 'lucide-react';

export type OnboardedSortField =
  | 'department'
  | 'classYear'
  | 'semester'
  | 'programme'
  | 'batch'
  | 'name'
  | 'rollNumber'
  | 'regNumber'
  | 'attendance'
  | 'enrollmentDate';

export type OnboardedGroupBy =
  | 'NONE'
  | 'DEPARTMENT'
  | 'CLASS_YEAR'
  | 'SEMESTER'
  | 'PROGRAMME'
  | 'BATCH';

interface OnboardedStudentsDirectoryViewProps {
  embedded?: boolean;
}

const getClassYearLabel = (year: number): string => {
  if (year === 1) return '1st Year';
  if (year === 2) return '2nd Year';
  if (year === 3) return '3rd Year';
  if (year === 4) return '4th Year (Honours)';
  return `Year ${year}`;
};

const escapeCsvCell = (value: unknown): string => {
  const str = value === null || value === undefined ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const OnboardedStudentsDirectoryView: React.FC<OnboardedStudentsDirectoryViewProps> = ({
  embedded = false
}) => {
  const {
    students,
    departments,
    programmes,
    getStudentAttendanceSummary
  } = useCollegeData();
  const { activeRole } = useAuth();

  // Strictly block Student role from accessing the institutional onboarded roster
  if (activeRole === 'STUDENT') {
    return <StudentIndividualProfileView />;
  }

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterSem, setFilterSem] = useState<string>('ALL');
  const [filterProgramme, setFilterProgramme] = useState<string>('ALL');
  const [filterBatch, setFilterBatch] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Sort & Grouping
  const [sortBy, setSortBy] = useState<OnboardedSortField>('department');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<OnboardedGroupBy>('NONE');

  // Modals
  const [viewingIdStudent, setViewingIdStudent] = useState<Student | null>(null);
  const [calcStudentId, setCalcStudentId] = useState<string | null>(null);

  const deptMap = useMemo(() => {
    const map = new Map<string, (typeof departments)[number]>();
    departments.forEach(d => map.set(d.id, d));
    return map;
  }, [departments]);

  const progMap = useMemo(() => {
    const map = new Map<string, (typeof programmes)[number]>();
    programmes.forEach(p => map.set(p.id, p));
    return map;
  }, [programmes]);

  // Distinct available batches & years from onboarded students
  const distinctBatches = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.admissionBatch && s.admissionBatch.trim()) {
        set.add(s.admissionBatch.trim());
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [students]);

  const distinctYears = useMemo(() => {
    const set = new Set<number>([1, 2, 3, 4]);
    students.forEach(s => {
      const yr = s.yearOfStudy || Math.ceil((s.currentSemester || 1) / 2);
      if (yr > 0) set.add(yr);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [students]);

  // Precompute summaries per student once per dataset change
  const attendanceMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getStudentAttendanceSummary>>();
    students.forEach(s => {
      map.set(s.id, getStudentAttendanceSummary(s.id));
    });
    return map;
  }, [students, getStudentAttendanceSummary]);

  const filteredAndSortedStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = students.filter(s => {
      const year = s.yearOfStudy || Math.ceil((s.currentSemester || 1) / 2);
      const dept = deptMap.get(s.homeDepartmentId);
      const prog = progMap.get(s.programmeId);

      if (filterDept !== 'ALL' && s.homeDepartmentId !== filterDept) return false;
      if (filterYear !== 'ALL' && String(year) !== filterYear) return false;
      if (filterSem !== 'ALL' && String(s.currentSemester || 1) !== filterSem) return false;
      if (filterProgramme !== 'ALL' && s.programmeId !== filterProgramme) return false;
      if (filterBatch !== 'ALL' && (s.admissionBatch || '') !== filterBatch) return false;
      if (filterStatus !== 'ALL' && (s.status || 'ACTIVE') !== filterStatus) return false;

      if (q) {
        const haystack = [
          s.fullName,
          s.rollNumber,
          s.admissionNumber,
          s.universityRegisterNumber,
          s.email,
          s.mobileNumber,
          s.phoneNumber,
          s.phone,
          s.admissionBatch,
          dept?.name,
          dept?.code,
          prog?.name,
          prog?.code
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    const factor = sortDir === 'asc' ? 1 : -1;

    const getDeptName = (s: Student) => deptMap.get(s.homeDepartmentId)?.name || 'Unassigned';
    const getProgName = (s: Student) => progMap.get(s.programmeId)?.name || 'Unassigned';
    const getYear = (s: Student) => s.yearOfStudy || Math.ceil((s.currentSemester || 1) / 2);
    const getSem = (s: Student) => s.currentSemester || 1;
    const getReg = (s: Student) => (s.universityRegisterNumber || s.admissionNumber || '').trim();
    const getRoll = (s: Student) => (s.rollNumber || '').trim();

    return [...filtered].sort((a, b) => {
      let cmp = 0;

      switch (sortBy) {
        case 'department': {
          cmp = getDeptName(a).localeCompare(getDeptName(b), undefined, { sensitivity: 'base' });
          if (cmp === 0) cmp = getYear(a) - getYear(b);
          if (cmp === 0) cmp = getSem(a) - getSem(b);
          if (cmp === 0) cmp = getRoll(a).localeCompare(getRoll(b), undefined, { numeric: true });
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        }
        case 'classYear': {
          cmp = getYear(a) - getYear(b);
          if (cmp === 0) cmp = getSem(a) - getSem(b);
          if (cmp === 0) cmp = getDeptName(a).localeCompare(getDeptName(b), undefined, { sensitivity: 'base' });
          if (cmp === 0) cmp = getRoll(a).localeCompare(getRoll(b), undefined, { numeric: true });
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        }
        case 'semester': {
          cmp = getSem(a) - getSem(b);
          if (cmp === 0) cmp = getDeptName(a).localeCompare(getDeptName(b), undefined, { sensitivity: 'base' });
          if (cmp === 0) cmp = getRoll(a).localeCompare(getRoll(b), undefined, { numeric: true });
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        }
        case 'programme': {
          cmp = getProgName(a).localeCompare(getProgName(b), undefined, { sensitivity: 'base' });
          if (cmp === 0) cmp = getYear(a) - getYear(b);
          if (cmp === 0) cmp = getSem(a) - getSem(b);
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        }
        case 'batch': {
          cmp = (a.admissionBatch || '').localeCompare(b.admissionBatch || '', undefined, { numeric: true });
          if (cmp === 0) cmp = getDeptName(a).localeCompare(getDeptName(b), undefined, { sensitivity: 'base' });
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        }
        case 'rollNumber': {
          cmp = getRoll(a).localeCompare(getRoll(b), undefined, { numeric: true, sensitivity: 'base' });
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        }
        case 'regNumber': {
          cmp = getReg(a).localeCompare(getReg(b), undefined, { numeric: true, sensitivity: 'base' });
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        }
        case 'attendance': {
          const pctA = attendanceMap.get(a.id)?.overallPercentage ?? -1;
          const pctB = attendanceMap.get(b.id)?.overallPercentage ?? -1;
          cmp = pctA - pctB;
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        }
        case 'enrollmentDate': {
          const dateA = new Date(a.enrollmentDate || a.createdAt || 0).getTime();
          const dateB = new Date(b.enrollmentDate || b.createdAt || 0).getTime();
          cmp = dateA - dateB;
          if (cmp === 0) cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        }
        case 'name':
        default: {
          cmp = a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
          break;
        }
      }

      return cmp * factor;
    });
  }, [
    students,
    searchQuery,
    filterDept,
    filterYear,
    filterSem,
    filterProgramme,
    filterBatch,
    filterStatus,
    sortBy,
    sortDir,
    deptMap,
    progMap,
    attendanceMap
  ]);

  // Group rows into sections when Group By is active
  const groupedSections = useMemo(() => {
    if (groupBy === 'NONE') {
      return [{ key: 'ALL', title: 'All Onboarded Students', items: filteredAndSortedStudents }];
    }

    const groups = new Map<string, { title: string; sortKey: string | number; items: Student[] }>();

    filteredAndSortedStudents.forEach(s => {
      const year = s.yearOfStudy || Math.ceil((s.currentSemester || 1) / 2);
      const sem = s.currentSemester || 1;
      const dept = deptMap.get(s.homeDepartmentId);
      const prog = progMap.get(s.programmeId);

      let key = '';
      let title = '';
      let sortKey: string | number = '';

      switch (groupBy) {
        case 'DEPARTMENT':
          key = s.homeDepartmentId || 'UNASSIGNED';
          title = dept ? `${dept.name} (${dept.code})` : 'Unassigned Department';
          sortKey = title;
          break;
        case 'CLASS_YEAR':
          key = `Y${year}`;
          title = getClassYearLabel(year);
          sortKey = year;
          break;
        case 'SEMESTER':
          key = `S${sem}`;
          title = `Semester ${sem} — ${getClassYearLabel(Math.ceil(sem / 2))}`;
          sortKey = sem;
          break;
        case 'PROGRAMME':
          key = s.programmeId || 'UNASSIGNED';
          title = prog ? `${prog.name} (${prog.code})` : 'Unassigned Programme';
          sortKey = title;
          break;
        case 'BATCH':
          key = s.admissionBatch || 'UNSPECIFIED';
          title = s.admissionBatch ? `Batch ${s.admissionBatch}` : 'Unspecified Batch';
          sortKey = key;
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, { title, sortKey, items: [] });
      }
      groups.get(key)!.items.push(s);
    });

    const entries = Array.from(groups.entries()).map(([key, val]) => ({
      key,
      title: val.title,
      sortKey: val.sortKey,
      items: val.items
    }));

    entries.sort((a, b) => {
      if (typeof a.sortKey === 'number' && typeof b.sortKey === 'number') {
        return sortDir === 'asc' ? a.sortKey - b.sortKey : b.sortKey - a.sortKey;
      }
      const res = String(a.sortKey).localeCompare(String(b.sortKey), undefined, { numeric: true });
      return sortDir === 'asc' ? res : -res;
    });

    return entries;
  }, [groupBy, filteredAndSortedStudents, deptMap, progMap, sortDir]);

  const activeStudentsCount = useMemo(
    () => students.filter(s => (s.status || 'ACTIVE') === 'ACTIVE').length,
    [students]
  );

  const coveredDeptCount = useMemo(() => {
    const ids = new Set(filteredAndSortedStudents.map(s => s.homeDepartmentId).filter(Boolean));
    return ids.size;
  }, [filteredAndSortedStudents]);

  const handleSortHeaderClick = (field: OnboardedSortField) => {
    if (sortBy === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'attendance' || field === 'enrollmentDate' ? 'desc' : 'asc');
    }
  };

  const handleQuickPreset = (presetSort: OnboardedSortField, presetGroup: OnboardedGroupBy) => {
    if (sortBy === presetSort && groupBy === presetGroup) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(presetSort);
      setGroupBy(presetGroup);
      setSortDir(presetSort === 'attendance' || presetSort === 'enrollmentDate' ? 'desc' : 'asc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterDept('ALL');
    setFilterYear('ALL');
    setFilterSem('ALL');
    setFilterProgramme('ALL');
    setFilterBatch('ALL');
    setFilterStatus('ALL');
    setSortBy('department');
    setSortDir('asc');
    setGroupBy('NONE');
  };

  const handleExportCsv = () => {
    const headers = [
      'Sl No',
      'Full Name',
      'University Register No',
      'Roll Number',
      'Admission Number',
      'Department',
      'Department Code',
      'Programme',
      'Class Year',
      'Semester',
      'Admission Batch',
      'Status',
      'Email',
      'Mobile',
      'Attendance %',
      'Onboarded Date'
    ];

    const rows = filteredAndSortedStudents.map((s, idx) => {
      const dept = deptMap.get(s.homeDepartmentId);
      const prog = progMap.get(s.programmeId);
      const year = s.yearOfStudy || Math.ceil((s.currentSemester || 1) / 2);
      const sum = attendanceMap.get(s.id);
      const onboardedDate = s.enrollmentDate || s.createdAt || '';
      return [
        idx + 1,
        s.fullName,
        s.universityRegisterNumber || '',
        s.rollNumber || '',
        s.admissionNumber || '',
        dept?.name || '',
        dept?.code || '',
        prog?.name || '',
        getClassYearLabel(year),
        `Semester ${s.currentSemester || 1}`,
        s.admissionBatch || '',
        s.status || 'ACTIVE',
        s.email || '',
        s.mobileNumber || s.phoneNumber || s.phone || '',
        sum && sum.totalConducted > 0 ? `${sum.overallPercentage}%` : 'No Sessions',
        onboardedDate ? String(onboardedDate).split('T')[0] : ''
      ]
        .map(escapeCsvCell)
        .join(',');
    });

    const csv = [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `Onboarded_Students_${sortBy}_${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderSortIcon = (field: OnboardedSortField) => {
    if (sortBy !== field) {
      return <ArrowDownUp className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-rose-800 dark:text-amber-300" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-rose-800 dark:text-amber-300" />
    );
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterDept !== 'ALL' ||
    filterYear !== 'ALL' ||
    filterSem !== 'ALL' ||
    filterProgramme !== 'ALL' ||
    filterBatch !== 'ALL' ||
    filterStatus !== 'ALL';

  return (
    <div className="space-y-5">
      {/* Header & Summary Strip */}
      {!embedded && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Full Onboarded Students Directory
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">{students.length}</strong> Total Onboarded
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">{activeStudentsCount}</strong> Active
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">{coveredDeptCount}</strong> Departments Shown
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Showing <strong className="text-rose-900 dark:text-amber-300 font-semibold">{filteredAndSortedStudents.length}</strong> Records
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredAndSortedStudents.length === 0}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-rose-900 dark:hover:bg-rose-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-rose-800"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV ({filteredAndSortedStudents.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Sort & View Mode Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          {/* Quick Presets (Segmented Control) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1.5">
              Quick Organize:
            </span>
            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {[
                { label: 'Department-Wise', sort: 'department' as OnboardedSortField, group: 'DEPARTMENT' as OnboardedGroupBy },
                { label: 'Class Year-Wise', sort: 'classYear' as OnboardedSortField, group: 'CLASS_YEAR' as OnboardedGroupBy },
                { label: 'Semester-Wise', sort: 'semester' as OnboardedSortField, group: 'SEMESTER' as OnboardedGroupBy },
                { label: 'Programme-Wise', sort: 'programme' as OnboardedSortField, group: 'PROGRAMME' as OnboardedGroupBy },
                { label: 'Batch-Wise', sort: 'batch' as OnboardedSortField, group: 'BATCH' as OnboardedGroupBy },
                { label: 'Flat A–Z', sort: 'name' as OnboardedSortField, group: 'NONE' as OnboardedGroupBy }
              ].map(preset => {
                const isActive = sortBy === preset.sort && groupBy === preset.group;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleQuickPreset(preset.sort, preset.group)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-rose-800 ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Sort & Group Dropdowns + Embedded Export */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="onboarded-sort-select">Sort by</label>
            <select
              id="onboarded-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as OnboardedSortField)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-900"
            >
              <option value="department">Sort: Department-Wise</option>
              <option value="classYear">Sort: Class Year-Wise</option>
              <option value="semester">Sort: Semester-Wise</option>
              <option value="programme">Sort: Programme-Wise</option>
              <option value="batch">Sort: Admission Batch</option>
              <option value="name">Sort: Student Name</option>
              <option value="rollNumber">Sort: Roll Number</option>
              <option value="regNumber">Sort: Univ Register No</option>
              <option value="attendance">Sort: Attendance %</option>
              <option value="enrollmentDate">Sort: Onboarded Date</option>
            </select>

            <button
              type="button"
              onClick={() => setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              title="Toggle Sort Direction"
            >
              {sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              <span>{sortDir === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>

            <label className="sr-only" htmlFor="onboarded-group-select">Group sections</label>
            <select
              id="onboarded-group-select"
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as OnboardedGroupBy)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-900"
            >
              <option value="NONE">View: Continuous Table</option>
              <option value="DEPARTMENT">Group by Department</option>
              <option value="CLASS_YEAR">Group by Class Year</option>
              <option value="SEMESTER">Group by Semester</option>
              <option value="PROGRAMME">Group by Programme</option>
              <option value="BATCH">Group by Batch</option>
            </select>

            {embedded && (
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredAndSortedStudents.length === 0}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-rose-900 dark:hover:bg-rose-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV ({filteredAndSortedStudents.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Facet Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, reg no, roll no, email, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-900"
            />
          </div>

          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-900"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-900"
          >
            <option value="ALL">All Class Years</option>
            {distinctYears.map(yr => (
              <option key={yr} value={String(yr)}>
                {getClassYearLabel(yr)}
              </option>
            ))}
          </select>

          <select
            value={filterSem}
            onChange={e => setFilterSem(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-900"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={String(s)}>
                Semester {s}
              </option>
            ))}
          </select>

          <select
            value={filterProgramme}
            onChange={e => setFilterProgramme(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-900"
          >
            <option value="ALL">All Programmes</option>
            {programmes.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <select
              value={filterBatch !== 'ALL' ? `B:${filterBatch}` : filterStatus !== 'ALL' ? `S:${filterStatus}` : 'ALL'}
              onChange={e => {
                const v = e.target.value;
                if (v === 'ALL') {
                  setFilterBatch('ALL');
                  setFilterStatus('ALL');
                } else if (v.startsWith('B:')) {
                  setFilterBatch(v.slice(2));
                  setFilterStatus('ALL');
                } else if (v.startsWith('S:')) {
                  setFilterStatus(v.slice(2));
                  setFilterBatch('ALL');
                }
              }}
              className="flex-1 text-xs px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-900"
            >
              <option value="ALL">All Batches & Status</option>
              {distinctBatches.length > 0 && (
                <optgroup label="Admission Batch">
                  {distinctBatches.map(b => (
                    <option key={b} value={`B:${b}`}>
                      Batch: {b}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Enrollment Status">
                {['ACTIVE', 'GRADUATED', 'DROPOUT', 'TRANSFERRED', 'SUSPENDED', 'DISCONTINUED'].map(st => (
                  <option key={st} value={`S:${st}`}>
                    Status: {st}
                  </option>
                ))}
              </optgroup>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Reset Filters & Sorting"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Area (Flat or Grouped) */}
      {filteredAndSortedStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No onboarded students match the current filters.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {students.length === 0
              ? 'No students have been onboarded yet.'
              : 'Try clearing search terms or switching department, year, or semester filters.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {groupedSections.map(section => (
            <div
              key={section.key}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {groupBy !== 'NONE' && (
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {section.title}
                  </h3>
                  <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {section.items.length} {section.items.length === 1 ? 'student' : 'students'}
                  </span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-12 font-mono tabular-nums">#</th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleSortHeaderClick('name')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>Student</span>
                          {renderSortIcon('name')}
                        </button>
                      </th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleSortHeaderClick('regNumber')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>Register / Roll No</span>
                          {renderSortIcon('regNumber')}
                        </button>
                      </th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleSortHeaderClick('department')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>Department & Programme</span>
                          {renderSortIcon('department')}
                        </button>
                      </th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleSortHeaderClick('classYear')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>Class Year / Sem</span>
                          {renderSortIcon('classYear')}
                        </button>
                      </th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleSortHeaderClick('enrollmentDate')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>Contact & Status</span>
                          {renderSortIcon('enrollmentDate')}
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSortHeaderClick('attendance')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors ml-auto"
                        >
                          <span>Attendance</span>
                          {renderSortIcon('attendance')}
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">Tools</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {section.items.map((student, idx) => {
                      const dept = deptMap.get(student.homeDepartmentId);
                      const prog = progMap.get(student.programmeId);
                      const year = student.yearOfStudy || Math.ceil((student.currentSemester || 1) / 2);
                      const summary = attendanceMap.get(student.id);
                      const phone = student.mobileNumber || student.phoneNumber || student.phone;
                      const onboardDate = student.enrollmentDate || student.createdAt;
                      const formattedOnboardDate = onboardDate
                        ? new Date(onboardDate).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                        : null;

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono tabular-nums text-slate-400">
                            {idx + 1}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={
                                  student.profilePhotoUrl ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={student.fullName}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {student.fullName}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {student.email || 'No email'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono tabular-nums">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {student.universityRegisterNumber || 'Pending Reg No'}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Roll {student.rollNumber || '—'}
                              <span aria-hidden="true"> · </span>
                              {student.admissionNumber || '—'}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[230px]">
                              {dept?.name || 'Unassigned Department'}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[230px] mt-0.5">
                              {dept?.code ? `${dept.code} · ` : ''}
                              {prog?.name || 'Programme'}
                            </div>
                          </td>

                          <td className="py-3 px-4 tabular-nums">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {getClassYearLabel(year)}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Sem {student.currentSemester || 1}
                              {student.admissionBatch ? (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span>{student.admissionBatch}</span>
                                </>
                              ) : null}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                              {phone || 'No mobile'}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>{student.status || 'ACTIVE'}</span>
                              {formattedOnboardDate ? (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span>Onboarded {formattedOnboardDate}</span>
                                </>
                              ) : null}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            {!summary || summary.totalConducted === 0 ? (
                              <span className="text-slate-400">No sessions</span>
                            ) : (
                              <div>
                                <span
                                  className={`font-semibold ${
                                    summary.isShortage
                                      ? 'text-rose-700 dark:text-rose-400'
                                      : summary.isWarning
                                      ? 'text-amber-700 dark:text-amber-400'
                                      : 'text-emerald-700 dark:text-emerald-400'
                                  }`}
                                >
                                  {summary.overallPercentage}%
                                </span>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {summary.policy === 'SESSION_STRICT'
                                    ? `${summary.awardedDays}/${summary.totalWorkingDays}d`
                                    : `${summary.consolidatedTotalAttended}/${summary.totalConducted}h`}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setCalcStudentId(student.id)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                                title="Attendance Calculator"
                              >
                                <Calculator className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setViewingIdStudent(student)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                                title="Digital Student ID"
                              >
                                <IdCard className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Digital ID Modal */}
      <DigitalIdModal
        isOpen={!!viewingIdStudent}
        onClose={() => setViewingIdStudent(null)}
        student={viewingIdStudent}
      />

      {/* Target Calculator Modal */}
      {calcStudentId && (
        <AttendanceCalculatorModal
          isOpen={!!calcStudentId}
          onClose={() => setCalcStudentId(null)}
          studentId={calcStudentId}
        />
      )}
    </div>
  );
};
