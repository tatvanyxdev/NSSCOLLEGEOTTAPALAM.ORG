import React, { useState, useMemo } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { canManageSpecialAttendance } from '../../config/permissions';
import {
  SpecialAttendanceEvent,
  SpecialAttendanceEventType,
  SpecialAttendanceScope,
  StudentCoverageType,
  SpecialAttendanceStatus,
  SpecialAttendanceRecord,
  Student
} from '../../types';
import { Badge, Modal } from '../common/UIComponents';
import {
  Award,
  PlusCircle,
  Calendar,
  Clock,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Check,
  X,
  Trash2,
  Sparkles,
  Download,
  Eye,
  Info,
  Layers,
  GraduationCap
} from 'lucide-react';

export const SpecialAttendanceView: React.FC = () => {
  const {
    specialAttendanceEvents,
    specialAttendanceRecords,
    createSpecialAttendanceEvent,
    updateSpecialAttendanceStatus,
    deleteSpecialAttendanceEvent,
    departments,
    programmes,
    admissionBatches,
    courseGroups,
    students,
    timetablePeriods
  } = useCollegeData();

  const { user, activeRole } = useAuth();
  const isAuthorized = canManageSpecialAttendance(activeRole);
  const isHOD = activeRole === 'HOD';
  const hodDeptId = isHOD ? user?.departmentId : undefined;

  // Active view tab: 'EVENTS' | 'CREATE' | 'STUDENT_RECORDS'
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'CREATE' | 'STUDENT_RECORDS'>('EVENTS');

  // Search & Filters for Events
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Search & Filters for Student Records Log
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [recordConflictFilter, setRecordConflictFilter] = useState<string>('ALL');

  // Event Details Modal
  const [viewingEvent, setViewingEvent] = useState<SpecialAttendanceEvent | null>(null);

  // Form State for creating special attendance
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEventType, setFormEventType] = useState<SpecialAttendanceEventType>('COLLEGE_PROGRAMME');
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formIsFullDay, setFormIsFullDay] = useState<boolean>(true);
  const [formSelectedPeriodIds, setFormSelectedPeriodIds] = useState<string[]>([]);
  const [formScopeType, setFormScopeType] = useState<SpecialAttendanceScope>(isHOD ? 'DEPARTMENT' : 'COLLEGE');
  const [formDepartmentId, setFormDepartmentId] = useState<string>(hodDeptId || (departments[0]?.id || ''));
  const [formProgrammeId, setFormProgrammeId] = useState<string>(programmes[0]?.id || '');
  const [formBatchId, setFormBatchId] = useState<string>(admissionBatches[0]?.id || '');
  const [formCourseGroupId, setFormCourseGroupId] = useState<string>(courseGroups[0]?.id || '');
  const [formStudentCoverage, setFormStudentCoverage] = useState<StudentCoverageType>('ALL_ELIGIBLE');
  const [formSelectedStudentIds, setFormSelectedStudentIds] = useState<string[]>([]);
  const [formReason, setFormReason] = useState('');
  const [studentPickerSearch, setStudentPickerSearch] = useState('');

  // Form Status feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Categories metadata
  const categoryLabels: Record<SpecialAttendanceEventType, { label: string; color: string; desc: string }> = {
    COLLEGE_PROGRAMME: {
      label: 'Official College Event',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'College Day, Arts Fest, Sports Meet, Convocation, Founders Day'
    },
    UNION_PROGRAMME: {
      label: 'Union / Association',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: 'College Union Inaguration, Department Association Activities'
    },
    STRIKE: {
      label: 'Strike / External Disruption',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      desc: 'General strike, Hartal, public transit disruption or localized holiday'
    },
    OFFICIAL_EVENT: {
      label: 'Institutional Order',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      desc: 'Principal or Academic Council written sanction order'
    },
    DEPARTMENT_PROGRAMME: {
      label: 'Department Event',
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      desc: 'Department workshop, seminar, guest lecture, association event'
    },
    SPORTS: {
      label: 'Sports Tournament Duty',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      desc: 'Inter-collegiate tournament, University trials, athletic team camp'
    },
    NSS: {
      label: 'NSS Camp / Activity',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      desc: 'National Service Scheme 7-day annual camp or community outreach'
    },
    NCC: {
      label: 'NCC Parade / Camp',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      desc: 'National Cadet Corps annual training camp, RDC selection or parade'
    },
    CULTURAL: {
      label: 'Youth Festival / Cultural',
      color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      desc: 'University Youth Festival participant, zonal competition, drama'
    },
    SEMINAR: {
      label: 'Academic Conference',
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      desc: 'Paper presentation, conference or academic workshop representation'
    },
    EXAM_DUTY: {
      label: 'University Exam Duty',
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      desc: 'Calicut University examination volunteer or hall invigilation duty'
    },
    OTHER: {
      label: 'Other Circumstance',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      desc: 'Special administrative concession with justified official remarks'
    }
  };

  // Scope labels
  const scopeLabels: Record<SpecialAttendanceScope, string> = {
    COLLEGE: 'College-Wide (All Students)',
    DEPARTMENT: 'Department Specific',
    PROGRAMME: 'Degree Programme',
    BATCH: 'Admission Batch',
    COURSE_GROUP: 'Course Cohort Group',
    SELECTED_STUDENTS: 'Selected Students Roster'
  };

  // Compute eligible students for form preview
  const eligibleStudentsForForm = useMemo(() => {
    let list: Student[] = [];
    if (formScopeType === 'COLLEGE') {
      list = students;
    } else if (formScopeType === 'DEPARTMENT') {
      list = students.filter(s => s.homeDepartmentId === formDepartmentId || s.departmentId === formDepartmentId);
    } else if (formScopeType === 'PROGRAMME') {
      list = students.filter(s => s.programmeId === formProgrammeId);
    } else if (formScopeType === 'BATCH') {
      list = students.filter(s => s.admissionBatchId === formBatchId || s.batchId === formBatchId);
    } else if (formScopeType === 'COURSE_GROUP') {
      list = students;
    } else if (formScopeType === 'SELECTED_STUDENTS') {
      list = students.filter(s => formSelectedStudentIds.includes(s.id));
    }

    if (formStudentCoverage === 'SELECTED_ONLY' && formScopeType !== 'SELECTED_STUDENTS') {
      list = list.filter(s => formSelectedStudentIds.includes(s.id));
    }
    return list;
  }, [
    formScopeType,
    formDepartmentId,
    formProgrammeId,
    formBatchId,
    formStudentCoverage,
    formSelectedStudentIds,
    students
  ]);

  // Target periods count
  const targetPeriodsCount = formIsFullDay ? timetablePeriods.length : formSelectedPeriodIds.length;

  // Filtered Events list
  const filteredEvents = useMemo(() => {
    return specialAttendanceEvents.filter(event => {
      // Role scope filter for HOD
      if (isHOD && hodDeptId && event.scopeType === 'DEPARTMENT' && event.departmentId && event.departmentId !== hodDeptId) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = event.title.toLowerCase().includes(q);
        const matchDesc = event.description?.toLowerCase().includes(q) || false;
        const matchReason = event.reason.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchReason) return false;
      }

      // Scope filter
      if (selectedScopeFilter !== 'ALL' && event.scopeType !== selectedScopeFilter) {
        return false;
      }

      // Category filter
      if (selectedCategoryFilter !== 'ALL' && event.eventType !== selectedCategoryFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL' && event.status !== selectedStatusFilter) {
        return false;
      }

      return true;
    });
  }, [specialAttendanceEvents, searchQuery, selectedScopeFilter, selectedCategoryFilter, selectedStatusFilter, isHOD, hodDeptId]);

  // Filtered Student Records
  const filteredRecords = useMemo(() => {
    return specialAttendanceRecords.filter(rec => {
      const student = students.find(s => s.id === rec.studentId);
      const event = specialAttendanceEvents.find(e => e.id === rec.eventId);

      if (recordConflictFilter !== 'ALL' && rec.normalSessionConflictStatus !== recordConflictFilter) {
        return false;
      }

      if (recordSearchQuery.trim()) {
        const q = recordSearchQuery.toLowerCase();
        const matchStudentName = student?.fullName.toLowerCase().includes(q) || false;
        const matchRoll = student?.rollNumber.toLowerCase().includes(q) || false;
        const matchAdm = student?.admissionNumber.toLowerCase().includes(q) || false;
        const matchEvent = event?.title.toLowerCase().includes(q) || false;
        if (!matchStudentName && !matchRoll && !matchAdm && !matchEvent) return false;
      }

      return true;
    });
  }, [specialAttendanceRecords, students, specialAttendanceEvents, recordConflictFilter, recordSearchQuery]);

  // Handle Form Submission
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);

    if (!formTitle.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please provide an event title or activity name.' });
      return;
    }
    if (!formReason.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please provide an official justification / reason.' });
      return;
    }
    if (!formIsFullDay && formSelectedPeriodIds.length === 0) {
      setFeedbackMessage({ type: 'error', text: 'Please select at least one period or choose Full Day.' });
      return;
    }
    if (formStudentCoverage === 'SELECTED_ONLY' && formSelectedStudentIds.length === 0) {
      setFeedbackMessage({ type: 'error', text: 'Please select at least one nominated student.' });
      return;
    }
    if (eligibleStudentsForForm.length === 0) {
      setFeedbackMessage({ type: 'error', text: 'No students found matching the selected scope criteria.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSpecialAttendanceEvent({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        eventType: formEventType,
        eventDate: formDate,
        isFullDay: formIsFullDay,
        periodIds: formIsFullDay ? timetablePeriods.map(p => p.id) : formSelectedPeriodIds,
        scopeType: formScopeType,
        departmentId: formScopeType === 'DEPARTMENT' ? formDepartmentId : null,
        programmeId: formScopeType === 'PROGRAMME' ? formProgrammeId : null,
        batchId: formScopeType === 'BATCH' ? formBatchId : null,
        courseGroupId: formScopeType === 'COURSE_GROUP' ? formCourseGroupId : null,
        studentCoverage: formStudentCoverage,
        selectedStudentIds: formStudentCoverage === 'SELECTED_ONLY' ? formSelectedStudentIds : [],
        reason: formReason.trim(),
        createdBy: user?.id || 'admin',
        createdByName: user?.name,
        createdByRole: activeRole,
        status: 'APPLIED'
      });

      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Special Attendance order "${formTitle}" recorded successfully for ${eligibleStudentsForForm.length} students across ${targetPeriodsCount} period(s).`
        });
        // Reset form
        setFormTitle('');
        setFormDescription('');
        setFormReason('');
        setFormSelectedStudentIds([]);
        setActiveTab('EVENTS');
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to record special attendance event.'
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Unexpected error occurred.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Period Selection
  const togglePeriod = (periodId: string) => {
    setFormSelectedPeriodIds(prev =>
      prev.includes(periodId) ? prev.filter(p => p !== periodId) : [...prev, periodId]
    );
  };

  // Toggle Student Selection
  const toggleStudent = (studentId: string) => {
    setFormSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(s => s !== studentId) : [...prev, studentId]
    );
  };

  // Export Records to CSV
  const handleExportRecordsCsv = () => {
    const headers = [
      'Record ID',
      'Event Title',
      'Event Type',
      'Date',
      'Period',
      'Student Roll No',
      'Student Admission No',
      'Student Name',
      'Department',
      'Attendance Source',
      'Conflict Status',
      'Reason'
    ];

    const rows = filteredRecords.map(rec => {
      const stu = students.find(s => s.id === rec.studentId);
      const ev = specialAttendanceEvents.find(e => e.id === rec.eventId);
      const dept = departments.find(d => d.id === stu?.homeDepartmentId);
      const period = timetablePeriods.find(p => p.id === rec.periodId);

      return [
        rec.id,
        `"${ev?.title || 'Special Attendance'}"`,
        ev?.eventType || 'SPECIAL',
        rec.date,
        period?.periodName || rec.periodId,
        stu?.rollNumber || '',
        stu?.admissionNumber || '',
        `"${stu?.fullName || ''}"`,
        `"${dept?.name || ''}"`,
        rec.attendanceSource,
        rec.normalSessionConflictStatus,
        `"${rec.remarks || ''}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NSS_Special_Attendance_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Special Attendance
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthorized && (
              <button
                onClick={() => setActiveTab(activeTab === 'CREATE' ? 'EVENTS' : 'CREATE')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-xs"
              >
                {activeTab === 'CREATE' ? (
                  <>
                    <FileText className="w-4 h-4" /> View Events
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-emerald-400" /> New Event
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Operational Scope Banner for HODs */}
        {isHOD && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-xs text-blue-800">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-600" />
            <span>
              <strong>HOD Operational Scope:</strong> You are authorized to grant special attendance for your department's programmes and students. College-wide institutional events require Principal or Super Admin approval.
            </span>
          </div>
        )}

        {/* View Tabs */}
        <div className="flex border-b border-slate-200 mt-6 -mb-6">
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'EVENTS'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Special Attendance Orders
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-bold">
              {specialAttendanceEvents.length}
            </span>
          </button>

          {isAuthorized && (
            <button
              onClick={() => setActiveTab('CREATE')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'CREATE'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Grant Attendance Order
            </button>
          )}

          <button
            onClick={() => setActiveTab('STUDENT_RECORDS')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'STUDENT_RECORDS'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Student Record Logs
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-bold">
              {specialAttendanceRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* Global Notification Feedback */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: EVENTS LIST */}
      {activeTab === 'EVENTS' && (
        <div className="space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Orders
                </span>
                <span className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {specialAttendanceEvents.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Official event sanction orders</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Grants
                </span>
                <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">
                {specialAttendanceEvents.filter(e => e.status === 'APPLIED').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Directly credited to student attendance</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Student-Period Grants
                </span>
                <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {specialAttendanceRecords.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Individual period records created</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Strikes & Disruptions
                </span>
                <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">
                {specialAttendanceEvents.filter(e => e.eventType === 'STRIKE').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Class disruption concessions</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by event title, reason, or details..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">All Event Types</option>
                <option value="COLLEGE_PROGRAMME">Official College Event</option>
                <option value="UNION_PROGRAMME">Union / Association</option>
                <option value="STRIKE">Strike / Hartal</option>
                <option value="OFFICIAL_EVENT">Institutional Order</option>
                <option value="DEPARTMENT_PROGRAMME">Department Programme</option>
                <option value="SPORTS">Sports Duty</option>
                <option value="NSS">NSS Camp / Activity</option>
                <option value="NCC">NCC Parade / Camp</option>
                <option value="CULTURAL">Youth Festival / Cultural</option>
                <option value="SEMINAR">Academic Conference</option>
                <option value="EXAM_DUTY">Exam Duty</option>
                <option value="OTHER">Other</option>
              </select>

              <select
                value={selectedScopeFilter}
                onChange={e => setSelectedScopeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">All Scopes</option>
                <option value="COLLEGE">College-Wide</option>
                <option value="DEPARTMENT">Department</option>
                <option value="PROGRAMME">Programme</option>
                <option value="BATCH">Batch</option>
                <option value="SELECTED_STUDENTS">Selected Students</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPLIED">Applied / Active</option>
                <option value="APPROVED">Approved</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {(searchQuery || selectedCategoryFilter !== 'ALL' || selectedScopeFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryFilter('ALL');
                    setSelectedScopeFilter('ALL');
                    setSelectedStatusFilter('ALL');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Events List Cards */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Special Attendance Orders Found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                No special attendance records match your current filters. Create an official order for college programmes, strikes, or duty attendance.
              </p>
              {isAuthorized && (
                <button
                  onClick={() => setActiveTab('CREATE')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" /> Grant Special Attendance Now
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map(event => {
                const catMeta = categoryLabels[event.eventType] || categoryLabels.OTHER;
                const eventRecords = specialAttendanceRecords.filter(r => r.eventId === event.id);
                const affectedStudentsCount = new Set(eventRecords.map(r => r.studentId)).size;
                const dept = departments.find(d => d.id === event.departmentId);
                const prog = programmes.find(p => p.id === event.programmeId);

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${catMeta.color}`}>
                            {catMeta.label}
                          </span>
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                            {scopeLabels[event.scopeType]}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                              event.status === 'APPLIED' || event.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {event.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">{event.title}</h3>

                        <p className="text-sm text-slate-600">{event.reason}</p>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-700">Date:</span> {event.eventDate}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-700">Coverage:</span>{' '}
                            {event.isFullDay ? 'Full Day (All Periods)' : `${event.periodIds?.length || 0} Period(s)`}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-700">Students Affected:</span>{' '}
                            <span className="font-bold text-slate-900">{affectedStudentsCount}</span>
                          </div>

                          {dept && (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span className="font-semibold text-slate-700">Dept:</span> {dept.name}
                            </div>
                          )}

                          {prog && (
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4 text-slate-400" />
                              <span className="font-semibold text-slate-700">Programme:</span> {prog.title}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span>Sanctioned by:</span>{' '}
                            <span className="text-slate-600 font-medium">
                              {event.createdByName || 'Authorized Administrator'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end lg:self-start flex-shrink-0">
                        <button
                          onClick={() => setViewingEvent(event)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Records ({eventRecords.length})
                        </button>

                        {isAuthorized && event.status === 'APPLIED' && (
                          <button
                            onClick={async () => {
                              if (confirm(`Cancel special attendance for "${event.title}"?`)) {
                                await updateSpecialAttendanceStatus(event.id, 'CANCELLED');
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        )}

                        {isAuthorized && (activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL') && (
                          <button
                            onClick={async () => {
                              if (confirm(`Permanently delete special attendance event "${event.title}" and its records?`)) {
                                await deleteSpecialAttendanceEvent(event.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRANT SPECIAL ATTENDANCE FORM */}
      {activeTab === 'CREATE' && isAuthorized && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              Grant Special / Institutional Attendance
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Create an auditable institutional order. Normal teacher attendance records remain intact and are merged seamlessly with this special concession.
            </p>
          </div>

          <form onSubmit={handleSubmitEvent} className="space-y-6">
            {/* Title and Event Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Event / Activity Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., University Youth Festival Duty, College Arts Day, District Hartal..."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Event Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Category and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Classification / Event Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formEventType}
                  onChange={e => setFormEventType(e.target.value as SpecialAttendanceEventType)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
                >
                  <option value="COLLEGE_PROGRAMME">Official College Event (Arts, Sports, Convocation)</option>
                  <option value="UNION_PROGRAMME">College Union / Association Programme</option>
                  <option value="STRIKE">Strike / Hartal / External Disruption</option>
                  <option value="OFFICIAL_EVENT">Institutional Order (Principal's Sanction)</option>
                  <option value="DEPARTMENT_PROGRAMME">Department Programme / Workshop</option>
                  <option value="SPORTS">Sports Tournament Representation Duty</option>
                  <option value="NSS">NSS Camp / Community Outreach Duty</option>
                  <option value="NCC">NCC Parade / Combined Camp Duty</option>
                  <option value="CULTURAL">Youth Festival / Cultural Competition</option>
                  <option value="SEMINAR">Academic Conference / Presentation</option>
                  <option value="EXAM_DUTY">University Examination Duty</option>
                  <option value="OTHER">Other Exceptional Circumstance</option>
                </select>
                <p className="text-[11px] text-slate-500">{categoryLabels[formEventType].desc}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Brief Reference / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Circular Ref # NSS/2026/SP-09 by Principal"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Period Selection */}
            <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Period Coverage
                  </h4>
                  <p className="text-xs text-slate-500">Specify whether full day or specific periods are affected</p>
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setFormIsFullDay(true)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      formIsFullDay ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Full Day (All Periods)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIsFullDay(false)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      !formIsFullDay ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Select Periods
                  </button>
                </div>
              </div>

              {!formIsFullDay && (
                <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {timetablePeriods.map(period => {
                    const isSelected = formSelectedPeriodIds.includes(period.id);
                    return (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => togglePeriod(period.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{period.periodName}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {period.startTime} - {period.endTime}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scope Selection */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Student Scope & Eligible Cohort
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* College Wide */}
                {(!isHOD || activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL') && (
                  <button
                    type="button"
                    onClick={() => setFormScopeType('COLLEGE')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formScopeType === 'COLLEGE'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5 mb-1.5" />
                    <div className="text-xs font-bold">College-Wide</div>
                    <div className={`text-[11px] ${formScopeType === 'COLLEGE' ? 'text-slate-300' : 'text-slate-500'}`}>
                      All enrolled college students
                    </div>
                  </button>
                )}

                {/* Department */}
                <button
                  type="button"
                  onClick={() => setFormScopeType('DEPARTMENT')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formScopeType === 'DEPARTMENT'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-1.5" />
                  <div className="text-xs font-bold">Department Scope</div>
                  <div className={`text-[11px] ${formScopeType === 'DEPARTMENT' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Students of a specific department
                  </div>
                </button>

                {/* Programme */}
                <button
                  type="button"
                  onClick={() => setFormScopeType('PROGRAMME')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formScopeType === 'PROGRAMME'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 mb-1.5" />
                  <div className="text-xs font-bold">Degree Programme</div>
                  <div className={`text-[11px] ${formScopeType === 'PROGRAMME' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Specific degree (e.g. B.Sc Physics)
                  </div>
                </button>

                {/* Admission Batch */}
                <button
                  type="button"
                  onClick={() => setFormScopeType('BATCH')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formScopeType === 'BATCH'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Layers className="w-5 h-5 mb-1.5" />
                  <div className="text-xs font-bold">Admission Batch</div>
                  <div className={`text-[11px] ${formScopeType === 'BATCH' ? 'text-slate-300' : 'text-slate-500'}`}>
                    E.g. 2024-2028 FYUGP Cohort
                  </div>
                </button>

                {/* Selected Students Only */}
                <button
                  type="button"
                  onClick={() => {
                    setFormScopeType('SELECTED_STUDENTS');
                    setFormStudentCoverage('SELECTED_ONLY');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formScopeType === 'SELECTED_STUDENTS'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Users className="w-5 h-5 mb-1.5" />
                  <div className="text-xs font-bold">Nominated Students</div>
                  <div className={`text-[11px] ${formScopeType === 'SELECTED_STUDENTS' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Specific students on duty/teams
                  </div>
                </button>
              </div>

              {/* Scope specific dropdowns */}
              {formScopeType === 'DEPARTMENT' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Department
                  </label>
                  <select
                    value={formDepartmentId}
                    onChange={e => setFormDepartmentId(e.target.value)}
                    disabled={isHOD && !!hodDeptId}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 disabled:bg-slate-100"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formScopeType === 'PROGRAMME' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Programme
                  </label>
                  <select
                    value={formProgrammeId}
                    onChange={e => setFormProgrammeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                  >
                    {programmes.map(prog => (
                      <option key={prog.id} value={prog.id}>
                        {prog.title} ({prog.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formScopeType === 'BATCH' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Admission Batch
                  </label>
                  <select
                    value={formBatchId}
                    onChange={e => setFormBatchId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                  >
                    {admissionBatches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batchName} ({batch.academicYearId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student Coverage Choice (All vs Selected) */}
              {formScopeType !== 'SELECTED_STUDENTS' && (
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="radio"
                      name="studentCoverage"
                      checked={formStudentCoverage === 'ALL_ELIGIBLE'}
                      onChange={() => setFormStudentCoverage('ALL_ELIGIBLE')}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    Grant to ALL students in selected scope ({eligibleStudentsForForm.length})
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="radio"
                      name="studentCoverage"
                      checked={formStudentCoverage === 'SELECTED_ONLY'}
                      onChange={() => setFormStudentCoverage('SELECTED_ONLY')}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    Pick specific nominated students only ({formSelectedStudentIds.length} chosen)
                  </label>
                </div>
              )}

              {/* Student Picker Table for Nominated Students */}
              {(formScopeType === 'SELECTED_STUDENTS' || formStudentCoverage === 'SELECTED_ONLY') && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Nominate Eligible Students
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {formSelectedStudentIds.length} student(s) selected
                      </p>
                    </div>

                    <div className="w-64">
                      <input
                        type="text"
                        placeholder="Search student by name / roll..."
                        value={studentPickerSearch}
                        onChange={e => setStudentPickerSearch(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                    {students
                      .filter(s => {
                        if (!studentPickerSearch.trim()) return true;
                        const q = studentPickerSearch.toLowerCase();
                        return (
                          s.fullName.toLowerCase().includes(q) ||
                          s.rollNumber.toLowerCase().includes(q) ||
                          s.admissionNumber.toLowerCase().includes(q)
                        );
                      })
                      .map(stu => {
                        const isSelected = formSelectedStudentIds.includes(stu.id);
                        const dept = departments.find(d => d.id === stu.homeDepartmentId);
                        return (
                          <div
                            key={stu.id}
                            onClick={() => toggleStudent(stu.id)}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                  isSelected
                                    ? 'bg-slate-900 border-slate-900 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{stu.fullName}</div>
                                <div className="text-[11px] text-slate-500">
                                  Roll: {stu.rollNumber} • Adm: {stu.admissionNumber} • {dept?.name || 'Department'}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Official Justification / Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Official Sanction Reason / Remarks <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Detail the sanction ground (e.g. As per Principal order ref #... for students participating in District Arts Festival)..."
                value={formReason}
                onChange={e => setFormReason(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Dual-Track Conflict Rules & Impact Summary Box */}
            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Dual-Track Resolution Preview
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {eligibleStudentsForForm.length} students × {targetPeriodsCount} period(s) ={' '}
                  <span className="text-emerald-400 font-bold">
                    {eligibleStudentsForForm.length * targetPeriodsCount} total records
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Absence Override:</strong> Students who were absent or where no normal session took place will receive full institutional attendance credit.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Preserve Regular Present:</strong> Students already marked PRESENT by a teacher in regular class retain their regular mark without duplication.
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('EVENTS')}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Processing Sanction...</>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Apply Special Attendance Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: STUDENT RECORDS LOG */}
      {activeTab === 'STUDENT_RECORDS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, roll number, admission number, or event title..."
                value={recordSearchQuery}
                onChange={e => setRecordSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={recordConflictFilter}
                onChange={e => setRecordConflictFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">All Conflict Resolutions</option>
                <option value="NO_SESSION">No Class Conducted (Direct Grant)</option>
                <option value="OVERRIDDEN">Overrode Absent Record</option>
                <option value="NORMAL_PRESENT">Merged (Already Present)</option>
                <option value="SESSION_CANCELLED">Class Session Cancelled</option>
              </select>

              <button
                onClick={handleExportRecordsCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                title="Export Student Special Attendance Log to CSV"
              >
                <Download className="w-4 h-4 text-slate-500" /> Export CSV
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Event Order</th>
                    <th className="px-4 py-3">Date & Period</th>
                    <th className="px-4 py-3">Attendance Source</th>
                    <th className="px-4 py-3">Resolution Impact</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        No special attendance records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.slice(0, 100).map(rec => {
                      const student = students.find(s => s.id === rec.studentId);
                      const event = specialAttendanceEvents.find(e => e.id === rec.eventId);
                      const period = timetablePeriods.find(p => p.id === rec.periodId);
                      const dept = departments.find(d => d.id === student?.homeDepartmentId);

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{student?.fullName || 'Student'}</div>
                            <div className="text-xs text-slate-500">
                              Roll: {student?.rollNumber} • {dept?.code}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800 text-xs">
                              {event?.title || 'Special Event'}
                            </div>
                            {event?.description && (
                              <div className="text-[11px] font-mono text-slate-400">
                                {event.description}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 text-xs">{rec.date}</div>
                            <div className="text-xs text-slate-500">{period?.periodName || 'Period'}</div>
                          </td>

                          <td className="px-4 py-3">
                            <Badge variant="purple" size="sm">SPECIAL</Badge>
                          </td>

                          <td className="px-4 py-3">
                            {rec.normalSessionConflictStatus === 'OVERRIDDEN' && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" /> Absent Overridden
                              </span>
                            )}
                            {rec.normalSessionConflictStatus === 'NORMAL_PRESENT' && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" /> Already Present
                              </span>
                            )}
                            {rec.normalSessionConflictStatus === 'NO_SESSION' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                Class Not Conducted
                              </span>
                            )}
                            {rec.normalSessionConflictStatus === 'SESSION_CANCELLED' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                Session Cancelled
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                            {rec.remarks || event?.reason || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredRecords.length > 100 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
                Showing first 100 records of {filteredRecords.length}. Export CSV to view the entire audit log.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: View Records For Single Event */}
      {viewingEvent && (
        <Modal
          isOpen={true}
          onClose={() => setViewingEvent(null)}
          title={`Order: ${viewingEvent.title}`}
          subtitle={`Date: ${viewingEvent.eventDate} • Scope: ${scopeLabels[viewingEvent.scopeType]}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Classification:</span>
                <span className="font-bold text-slate-800">
                  {categoryLabels[viewingEvent.eventType]?.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Official Reason:</span>
                <span className="text-slate-700">{viewingEvent.reason}</span>
              </div>
              {viewingEvent.description && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Reference Details:</span>
                  <span className="font-mono text-slate-800 font-bold">{viewingEvent.description}</span>
                </div>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {specialAttendanceRecords
                .filter(r => r.eventId === viewingEvent.id)
                .map(rec => {
                  const student = students.find(s => s.id === rec.studentId);
                  const period = timetablePeriods.find(p => p.id === rec.periodId);
                  return (
                    <div key={rec.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{student?.fullName}</div>
                        <div className="text-slate-500">
                          Roll: {student?.rollNumber} • Period: {period?.periodName || rec.periodId}
                        </div>
                      </div>

                      <div>
                        {rec.normalSessionConflictStatus === 'OVERRIDDEN' && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Absent Overridden
                          </span>
                        )}
                        {rec.normalSessionConflictStatus === 'NORMAL_PRESENT' && (
                          <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Already Present
                          </span>
                        )}
                        {rec.normalSessionConflictStatus === 'NO_SESSION' && (
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            Granted (No Session)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingEvent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
