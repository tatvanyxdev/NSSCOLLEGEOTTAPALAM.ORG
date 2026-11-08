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
import { ConfirmDialog } from '../common/ConfirmDialog';
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
  GraduationCap,
  ShieldCheck,
  Stamp,
  CornerDownRight,
  Database,
  Copy
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
    timetablePeriods,
    getStudentAttendanceSummary
  } = useCollegeData();

  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const { user, activeRole } = useAuth();
  const isAuthorized = canManageSpecialAttendance(activeRole);
  const isHOD = activeRole === 'HOD';
  const isPrincipal = activeRole === 'PRINCIPAL' || activeRole === 'SUPER_ADMIN';
  
  // Resolve HOD department safely from user profile or departments mapping
  const hodDeptId = isHOD
    ? user?.departmentId ||
      user?.facultyProfile?.departmentId ||
      (user as any)?.department_id ||
      departments.find(d => d.hodFacultyId === user?.id)?.id ||
      departments[0]?.id
    : undefined;
  const hodDept = departments.find(d => d.id === hodDeptId);

  // Department filter for Principal Queue
  const [filterApprovalDept, setFilterApprovalDept] = useState<string>('ALL');
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<string[]>([]);

  // Pending Principal approvals
  const allPendingEvents = useMemo(() => {
    return specialAttendanceEvents.filter(
      e => e.status === 'PENDING_PRINCIPAL' || e.status === 'FORWARDED_TO_PRINCIPAL'
    );
  }, [specialAttendanceEvents]);

  // Scoped pending events based on department filter or HOD own department
  const pendingPrincipalEvents = useMemo(() => {
    return allPendingEvents.filter(e => {
      if (isHOD && hodDeptId) {
        return e.departmentId === hodDeptId || e.forwardedByHodId === user?.id;
      }
      if (filterApprovalDept !== 'ALL') {
        return e.departmentId === filterApprovalDept;
      }
      return true;
    });
  }, [allPendingEvents, isHOD, hodDeptId, user?.id, filterApprovalDept]);

  // Active view tab: 'PRINCIPAL_APPROVALS' | 'EVENTS' | 'CREATE' | 'STUDENT_RECORDS'
  const [activeTab, setActiveTab] = useState<'PRINCIPAL_APPROVALS' | 'EVENTS' | 'CREATE' | 'STUDENT_RECORDS'>(() => {
    if (isPrincipal && allPendingEvents.length > 0) return 'PRINCIPAL_APPROVALS';
    return 'EVENTS';
  });

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

  // Principal Approval / Rejection Action States
  const [approvingEvent, setApprovingEvent] = useState<SpecialAttendanceEvent | null>(null);
  const [principalOrderNumber, setPrincipalOrderNumber] = useState('');
  const [principalOrderRemarks, setPrincipalOrderRemarks] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [rejectingEvent, setRejectingEvent] = useState<SpecialAttendanceEvent | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [eventToDelete, setEventToDelete] = useState<SpecialAttendanceEvent | null>(null);
  const [eventToCancel, setEventToCancel] = useState<SpecialAttendanceEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // Form State for creating special attendance
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEventType, setFormEventType] = useState<SpecialAttendanceEventType>('UNION_PROGRAMME');
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
  const [formDutyCertificateRef, setFormDutyCertificateRef] = useState('');
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
      label: 'College Union / Association',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: 'College Union Inaguration, Parliamentary Debates, Zonal Arts / Delegations'
    },
    POLITICAL_UNION: {
      label: 'Political Party / Union Programme',
      color: 'bg-teal-50 text-teal-800 border-teal-300',
      desc: 'Political party student wing, college union delegations, state youth convention'
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
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
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
      list = isHOD && hodDeptId
        ? students.filter(s => s.homeDepartmentId === hodDeptId)
        : students;
    } else if (formScopeType === 'DEPARTMENT') {
      const deptTarget = isHOD && hodDeptId ? hodDeptId : formDepartmentId;
      list = students.filter(s => s.homeDepartmentId === deptTarget);
    } else if (formScopeType === 'PROGRAMME') {
      list = students.filter(s => s.programmeId === formProgrammeId);
      if (isHOD && hodDeptId) {
        list = list.filter(s => s.homeDepartmentId === hodDeptId);
      }
    } else if (formScopeType === 'BATCH') {
      list = students.filter(s => s.admissionBatch === formBatchId || (s as any).admissionBatchId === formBatchId || (s as any).batchId === formBatchId);
      if (isHOD && hodDeptId) {
        list = list.filter(s => s.homeDepartmentId === hodDeptId);
      }
    } else if (formScopeType === 'COURSE_GROUP') {
      list = isHOD && hodDeptId
        ? students.filter(s => s.homeDepartmentId === hodDeptId)
        : students;
    } else if (formScopeType === 'SELECTED_STUDENTS') {
      list = students.filter(s => formSelectedStudentIds.includes(s.id));
      if (isHOD && hodDeptId) {
        list = list.filter(s => s.homeDepartmentId === hodDeptId);
      }
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
    students,
    isHOD,
    hodDeptId
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

  // Principal Approval & Rejection Handlers
  const handleApproveEvent = async (event: SpecialAttendanceEvent, orderRef?: string, remarks?: string) => {
    setIsProcessingApproval(true);
    try {
      const fullRemarks = orderRef
        ? `Order Ref: ${orderRef}. ${remarks || 'Sanctioned and consolidated.'}`
        : remarks;
      const res = await updateSpecialAttendanceStatus(event.id, 'APPROVED', fullRemarks);
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Special Attendance order "${event.title}" has been sanctioned and successfully consolidated into student attendance records!`
        });
        setApprovingEvent(null);
        setSelectedApprovalIds(prev => prev.filter(id => id !== event.id));
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to approve event.'
        });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Approval failed.' });
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Bulk Approval: Approve all pending requests in current filter or selected
  const handleApproveAllPending = async (eventsToApprove: SpecialAttendanceEvent[]) => {
    if (!isPrincipal || eventsToApprove.length === 0) return;
    setIsApprovingAll(true);
    setFeedbackMessage(null);
    let successCount = 0;
    const yr = new Date().getFullYear();

    for (let i = 0; i < eventsToApprove.length; i++) {
      const evt = eventsToApprove[i];
      const autoRef = `NSS/PRIN/ATT/${yr}/BATCH-${i + 1}`;
      const remarks = `Bulk sanctioned by Principal under Ordinance Rule 14. Ref: ${autoRef}.`;
      const res = await updateSpecialAttendanceStatus(evt.id, 'APPROVED', remarks);
      if (res.success) {
        successCount++;
      }
    }

    setIsApprovingAll(false);
    setSelectedApprovalIds([]);
    setFeedbackMessage({
      type: 'success',
      text: `Principal Action Complete: Successfully approved & consolidated ${successCount} of ${eventsToApprove.length} duty attendance requests into student registers!`
    });
  };

  const handleToggleSelectApproval = (id: string) => {
    setSelectedApprovalIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllApprovals = (visibleList: SpecialAttendanceEvent[]) => {
    const visibleIds = visibleList.map(e => e.id);
    const allSelected = visibleIds.every(id => selectedApprovalIds.includes(id));
    if (allSelected) {
      setSelectedApprovalIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedApprovalIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleRejectEvent = async (event: SpecialAttendanceEvent, reason: string) => {
    setIsProcessingApproval(true);
    try {
      const res = await updateSpecialAttendanceStatus(
        event.id,
        'REJECTED',
        reason || 'Returned by Principal for revision.'
      );
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Special Attendance order "${event.title}" returned to department HOD.`
        });
        setRejectingEvent(null);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Failed to return event.'
        });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Action failed.' });
    } finally {
      setIsProcessingApproval(false);
    }
  };

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
      const targetStatus: SpecialAttendanceStatus = isPrincipal ? 'APPROVED' : 'PENDING_PRINCIPAL';

      const res = await createSpecialAttendanceEvent({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        eventType: formEventType,
        eventDate: formDate,
        isFullDay: formIsFullDay,
        periodIds: formIsFullDay ? timetablePeriods.map(p => p.id) : formSelectedPeriodIds,
        scopeType: formScopeType,
        departmentId: isHOD && hodDeptId ? hodDeptId : (formScopeType === 'DEPARTMENT' ? formDepartmentId : null),
        programmeId: formScopeType === 'PROGRAMME' ? formProgrammeId : null,
        batchId: formScopeType === 'BATCH' ? formBatchId : null,
        courseGroupId: formScopeType === 'COURSE_GROUP' ? formCourseGroupId : null,
        studentCoverage: formStudentCoverage,
        selectedStudentIds: formStudentCoverage === 'SELECTED_ONLY' ? formSelectedStudentIds : [],
        dutyCertificateRef: formDutyCertificateRef.trim() || undefined,
        forwardedByHodId: isHOD ? user?.id : undefined,
        forwardedByHodName: isHOD ? user?.name : undefined,
        forwardedAt: isHOD ? new Date().toISOString() : undefined,
        reason: formReason.trim(),
        createdBy: user?.id || 'admin',
        createdByName: user?.name,
        createdByRole: activeRole,
        status: targetStatus
      });

      if (res.success) {
        if (!isPrincipal) {
          setFeedbackMessage({
            type: 'success',
            text: `Special Attendance order "${formTitle}" recorded and successfully forwarded to Principal for statutory approval.`
          });
        } else {
          setFeedbackMessage({
            type: 'success',
            text: `Special Attendance order "${formTitle}" sanctioned and consolidated into student attendance records for ${eligibleStudentsForForm.length} students across ${targetPeriodsCount} period(s).`
          });
        }
        // Reset form
        setFormTitle('');
        setFormDescription('');
        setFormReason('');
        setFormDutyCertificateRef('');
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
            <button
              onClick={() => setShowSqlModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
              title="View Supabase PostgreSQL Schema Code"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Database</span> SQL Code
            </button>
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
        <div className="flex border-b border-slate-200 mt-6 -mb-6 overflow-x-auto no-scrollbar">
          {/* Principal Approval Queue Tab */}
          {(isPrincipal || isHOD) && (
            <button
              onClick={() => setActiveTab('PRINCIPAL_APPROVALS')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'PRINCIPAL_APPROVALS'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              {isPrincipal ? 'Principal Approval Queue' : 'Forwarded Approvals'}
              {pendingPrincipalEvents.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white font-bold animate-pulse">
                  {pendingPrincipalEvents.length} Pending
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
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
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'CREATE'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              {isHOD ? 'Enter Duty Attendance (Forward to Principal)' : 'Sanction Attendance Order'}
            </button>
          )}

          <button
            onClick={() => setActiveTab('STUDENT_RECORDS')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'STUDENT_RECORDS'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Student Duty Log
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

      {/* TAB 0: PRINCIPAL APPROVAL QUEUE */}
      {activeTab === 'PRINCIPAL_APPROVALS' && (isPrincipal || isHOD) && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white rounded-2xl p-6 shadow-sm border border-amber-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                  <h2 className="text-lg font-bold">
                    {isPrincipal ? 'Principal Sanction & Consolidation Queue' : 'Forwarded Duty Attendance Submissions'}
                  </h2>
                </div>
                <p className="text-xs text-amber-200 max-w-2xl leading-relaxed">
                  Students attending College Union programmes, student political wing conventions, university youth festivals, or sports meets are marked Absent in regular periods. Head of Departments verify certificates and forward them here for statutory sanction and automatic consolidation into official student attendance registers.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[90px]">
                  <div className="text-xl font-bold text-amber-300">{pendingPrincipalEvents.length}</div>
                  <div className="text-[10px] text-amber-200 font-semibold uppercase">Pending Action</div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[90px]">
                  <div className="text-xl font-bold text-emerald-300">
                    {specialAttendanceEvents.filter(e => e.status === 'APPROVED' || e.status === 'APPLIED').length}
                  </div>
                  <div className="text-[10px] text-emerald-200 font-semibold uppercase">Sanctioned</div>
                </div>
              </div>
            </div>
          </div>

          {/* Principal Filter & Bulk Control Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {isPrincipal && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <label htmlFor="principal-dept-filter" className="text-xs font-bold text-slate-700">Filter Department:</label>
                  <select
                    id="principal-dept-filter"
                    value={filterApprovalDept}
                    onChange={e => {
                      setFilterApprovalDept(e.target.value);
                      setSelectedApprovalIds([]);
                    }}
                    className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="ALL">All Departments ({allPendingEvents.length} pending)</option>
                    {departments.map(d => {
                      const count = allPendingEvents.filter(e => e.departmentId === d.id).length;
                      return (
                        <option key={d.id} value={d.id}>
                          {d.name} ({count} pending)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {isHOD && hodDept && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>{hodDept.name} (HOD Scoped)</span>
                </div>
              )}

              {/* Status counter pill */}
              <div className="text-xs text-slate-500 font-semibold px-2.5 py-1 bg-slate-100 rounded-lg">
                Showing <strong className="text-slate-900">{pendingPrincipalEvents.length}</strong> submission(s)
              </div>
            </div>

            {/* Principal Bulk Action Buttons */}
            {isPrincipal && pendingPrincipalEvents.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Select All Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleSelectAllApprovals(pendingPrincipalEvents)}
                  className="px-3 py-2 text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  {pendingPrincipalEvents.length > 0 &&
                  pendingPrincipalEvents.every(e => selectedApprovalIds.includes(e.id))
                    ? 'Deselect All'
                    : `Select All (${pendingPrincipalEvents.length})`}
                </button>

                {/* Approve Selected */}
                {selectedApprovalIds.length > 0 && (
                  <button
                    type="button"
                    disabled={isApprovingAll}
                    onClick={() => {
                      const targets = pendingPrincipalEvents.filter(e => selectedApprovalIds.includes(e.id));
                      handleApproveAllPending(targets);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isApprovingAll ? 'Approving Selected...' : `Approve Selected (${selectedApprovalIds.length})`}
                  </button>
                )}

                {/* Approve All in Queue / Filter */}
                <button
                  type="button"
                  disabled={isApprovingAll}
                  onClick={() => handleApproveAllPending(pendingPrincipalEvents)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {isApprovingAll ? 'Processing All...' : `Approve All (${pendingPrincipalEvents.length})`}
                </button>
              </div>
            )}
          </div>

          {/* Pending Events List */}
          {pendingPrincipalEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">All Duty Attendance Submissions Processed</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {filterApprovalDept !== 'ALL'
                  ? 'There are no pending requests awaiting Principal sanction for this department.'
                  : 'There are currently no pending special attendance requests awaiting Principal action. New requests forwarded by HODs will appear here immediately for sanction.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPrincipalEvents.map(event => {
                const eventRecords = specialAttendanceRecords.filter(r => r.eventId === event.id);
                const dept = departments.find(d => d.id === event.departmentId);
                const affectedStudentIds = event.selectedStudentIds && event.selectedStudentIds.length > 0
                  ? event.selectedStudentIds
                  : Array.from(new Set(eventRecords.map(r => r.studentId)));
                const affectedStudents = students.filter(s => affectedStudentIds.includes(s.id));

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl border-2 border-amber-200 p-5 sm:p-6 shadow-xs hover:border-amber-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {isPrincipal && (
                            <input
                              type="checkbox"
                              checked={selectedApprovalIds.includes(event.id)}
                              onChange={() => handleToggleSelectApproval(event.id)}
                              className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer mr-1"
                              title="Select for batch approval"
                            />
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            Awaiting Principal Approval
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${categoryLabels[event.eventType]?.color || 'bg-slate-100 text-slate-700'}`}>
                            {categoryLabels[event.eventType]?.label || event.eventType}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {event.eventDate}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {event.isFullDay ? 'Full Day (All Periods)' : `${event.periodIds.length} Period(s)`}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {event.title}
                        </h3>

                        {event.description && (
                          <p className="text-xs text-slate-600">{event.description}</p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isPrincipal ? (
                          <>
                            <button
                              onClick={() => {
                                setApprovingEvent(event);
                                setPrincipalOrderNumber(`NSS/PRIN/ATT/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
                                setPrincipalOrderRemarks('Sanctioned under Calicut University Ordinance Rule 14. Duty attendance consolidated into student attendance register.');
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Approve & Consolidate
                            </button>
                            <button
                              onClick={() => {
                                setRejectingEvent(event);
                                setRejectReason('');
                              }}
                              className="px-3.5 py-2 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                              Return to HOD
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Forwarded to Principal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Duty Certificate and HOD Forwarding Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Forwarded By</span>
                        <span className="font-bold text-slate-900 mt-0.5 block">
                          {event.forwardedByHodName || event.createdByName || 'Head of Department'}
                        </span>
                        <span className="text-[11px] text-slate-500">{dept?.name || 'Department'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Duty Certificate Ref</span>
                        <span className="font-mono font-bold text-emerald-800 mt-0.5 block flex items-center gap-1">
                          <Stamp className="w-3.5 h-3.5 text-emerald-600" />
                          {event.dutyCertificateRef || 'Verified by Department HOD'}
                        </span>
                        <span className="text-[11px] text-slate-500">Official student duty submission</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Forwarded Date & Time</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">
                          {event.forwardedAt ? new Date(event.forwardedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </span>
                        <span className="text-[11px] text-slate-500">Submission Timestamp</span>
                      </div>
                    </div>

                    {/* Official Reason */}
                    <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900">Justification / Activity Details: </span>
                      {event.reason}
                    </div>

                    {/* Affected Students List with Teacher Absence status and Before/After Impact */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          Nominated Students ({affectedStudents.length})
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Teacher roll call recorded as ABSENT • Principal approval consolidates as authorized duty
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {affectedStudents.map(student => {
                          const summary = getStudentAttendanceSummary(student.id);
                          const prog = programmes.find(p => p.id === student.programmeId);
                          return (
                            <div
                              key={student.id}
                              className="p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-colors flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-900 truncate">
                                    {student.fullName}
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                                    Roll {student.rollNumber}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {student.universityRegisterNumber} • {prog?.title || 'Student'}
                                </div>
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    Teacher marked: ABSENT
                                  </span>
                                  <CornerDownRight className="w-3 h-3 text-slate-400" />
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Consolidates +{event.isFullDay ? timetablePeriods.length : event.periodIds.length} Periods
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase">Regular %</div>
                                <div className="text-xs font-bold text-slate-700">{summary.regularPercentage}%</div>
                                <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                                  Consolidated: {summary.consolidatedPercentage}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                            onClick={() => setEventToCancel(event)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        )}

                        {isAuthorized && (activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL') && (
                          <button
                            onClick={() => setEventToDelete(event)}
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
              {isHOD ? 'Enter Duty Attendance (Forward to Principal for Approval)' : 'Sanction Special / Institutional Attendance'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isHOD
                ? 'Enter student duty attendance for College Union programmes, political party union events, sports, or cultural activities where students were marked absent. Submitting will forward this request to the Principal for statutory sanction and automatic attendance consolidation.'
                : 'Create an official institutional attendance order. Once approved, student absences are consolidated into their semester attendance register.'}
            </p>
          </div>

          {/* Workflow Alert Box for HOD */}
          {isHOD && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Workflow Notice for Head of Department:</p>
                <p>
                  When a student goes to a College Union or political party union programme, regular subject teachers mark them as <strong>ABSENT</strong> during normal roll call.
                </p>
                <p>
                  Entering the student attendance and duty certificate number below will forward this request to the <strong>Principal Panel</strong>. When the Principal approves, it is <strong>consolidated into the student attendance register</strong> and also displayed separately as official institutional duty attendance.
                </p>
              </div>
            </div>
          )}

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
                  placeholder="e.g., Calicut University College Union Convention, Parliamentary Debate, State Youth Fest..."
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
                  <option value="UNION_PROGRAMME">College Union / University Association Programme</option>
                  <option value="POLITICAL_UNION">Political Party / Student Union Programme</option>
                  <option value="COLLEGE_PROGRAMME">Official College Event (Arts, Sports, Convocation)</option>
                  <option value="SPORTS">Sports Tournament Duty</option>
                  <option value="NSS">NSS Camp / Community Outreach Duty</option>
                  <option value="NCC">NCC Parade / Combined Camp Duty</option>
                  <option value="CULTURAL">Youth Festival / Cultural Competition</option>
                  <option value="SEMINAR">Academic Conference / Presentation</option>
                  <option value="OFFICIAL_EVENT">Institutional Order (Principal Sanction)</option>
                  <option value="STRIKE">Strike / Hartal / External Disruption</option>
                  <option value="DEPARTMENT_PROGRAMME">Department Programme / Workshop</option>
                  <option value="EXAM_DUTY">University Examination Duty</option>
                  <option value="OTHER">Other Exceptional Circumstance</option>
                </select>
                <p className="text-[11px] text-slate-500">{categoryLabels[formEventType]?.desc}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Brief Reference / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Union Circular Ref # NSS/CU/2026/042 or Event Memo"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Duty Certificate / Union Letter Ref No */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-emerald-700" />
                <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Duty Certificate / Union Letter Reference No.
                </label>
              </div>
              <input
                type="text"
                placeholder="e.g. Certificate No. NSS/CU/2026/042 / College Union Memo Ref"
                value={formDutyCertificateRef}
                onChange={e => setFormDutyCertificateRef(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-emerald-300 bg-white rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-mono"
              />
              <p className="text-[11px] text-emerald-800">
                Official duty certificate or College Union memo presented by the student to the HOD. This reference will be recorded in the Principal Sanction register and official student profile.
              </p>
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
                    Department Scope
                  </label>
                  {isHOD && hodDept ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs font-semibold text-blue-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>{hodDept.name} ({hodDept.code})</span>
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded-md">
                        HOD Locked
                      </span>
                    </div>
                  ) : (
                    <select
                      value={formDepartmentId}
                      onChange={e => setFormDepartmentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                    >
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {formScopeType === 'PROGRAMME' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Programme {isHOD && hodDept && `(${hodDept.code})`}
                  </label>
                  <select
                    value={formProgrammeId}
                    onChange={e => setFormProgrammeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                  >
                    {programmes
                      .filter(prog => !isHOD || !hodDeptId || prog.departmentId === hodDeptId)
                      .map(prog => (
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
                    {admissionBatches
                      .filter(batch => !isHOD || !hodDeptId || batch.departmentId === hodDeptId || !batch.departmentId)
                      .map(batch => (
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
                        if (isHOD && hodDeptId && s.homeDepartmentId !== hodDeptId && s.departmentId !== hodDeptId) {
                          return false;
                        }
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

      {/* SQL Migration Code Modal */}
      {showSqlModal && (
        <Modal
          isOpen={showSqlModal}
          onClose={() => setShowSqlModal(false)}
          title="Database SQL Code: Special & Union Duty Attendance"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">PostgreSQL / Supabase Migration</p>
                <p>
                  Execute this SQL in your Supabase SQL Editor to support HOD forwarding, duty certificates, Principal sanctions, and conflict overrides when students attend College Union or political party programmes.
                </p>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800">
                {`-- 1. Extend special_attendance_events with HOD forwarding & Principal sanction
ALTER TABLE special_attendance_events 
  ADD COLUMN IF NOT EXISTS duty_certificate_ref VARCHAR(255),
  ADD COLUMN IF NOT EXISTS forwarded_by_hod_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forwarded_by_hod_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS principal_remarks TEXT,
  ADD COLUMN IF NOT EXISTS principal_action_at TIMESTAMPTZ;

-- 2. Extend special_attendance_records to track teacher's initial absence
ALTER TABLE special_attendance_records 
  ADD COLUMN IF NOT EXISTS original_teacher_status VARCHAR(50) DEFAULT 'ABSENT',
  ADD COLUMN IF NOT EXISTS normal_session_conflict_status VARCHAR(100) DEFAULT 'OVERRIDDEN',
  ADD COLUMN IF NOT EXISTS attendance_source VARCHAR(50) DEFAULT 'SPECIAL',
  ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 3. High performance indexes for Principal Queue & Student Rollup
CREATE INDEX IF NOT EXISTS idx_spec_att_status ON special_attendance_events(status);
CREATE INDEX IF NOT EXISTS idx_spec_att_event_type ON special_attendance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_spec_rec_student_event ON special_attendance_records(student_id, event_id);

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';`}
              </pre>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`-- 1. Extend special_attendance_events with HOD forwarding & Principal sanction
ALTER TABLE special_attendance_events 
  ADD COLUMN IF NOT EXISTS duty_certificate_ref VARCHAR(255),
  ADD COLUMN IF NOT EXISTS forwarded_by_hod_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forwarded_by_hod_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS principal_remarks TEXT,
  ADD COLUMN IF NOT EXISTS principal_action_at TIMESTAMPTZ;

-- 2. Extend special_attendance_records to track teacher's initial absence
ALTER TABLE special_attendance_records 
  ADD COLUMN IF NOT EXISTS original_teacher_status VARCHAR(50) DEFAULT 'ABSENT',
  ADD COLUMN IF NOT EXISTS normal_session_conflict_status VARCHAR(100) DEFAULT 'OVERRIDDEN',
  ADD COLUMN IF NOT EXISTS attendance_source VARCHAR(50) DEFAULT 'SPECIAL',
  ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 3. High performance indexes for Principal Queue & Student Rollup
CREATE INDEX IF NOT EXISTS idx_spec_att_status ON special_attendance_events(status);
CREATE INDEX IF NOT EXISTS idx_spec_att_event_type ON special_attendance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_spec_rec_student_event ON special_attendance_records(student_id, event_id);

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';`);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" /> Copy SQL
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Event Modal */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={async () => {
          if (!eventToDelete) return;
          setIsDeletingEvent(true);
          try {
            await deleteSpecialAttendanceEvent(eventToDelete.id);
          } finally {
            setIsDeletingEvent(false);
            setEventToDelete(null);
          }
        }}
        isLoading={isDeletingEvent}
        title="Delete Special Attendance Event"
        message={
          <div>
            <p>
              Are you sure you want to permanently delete event{' '}
              <strong className="text-slate-900">{eventToDelete?.title}</strong>?
            </p>
            <p className="mt-2 text-rose-600 font-medium">
              This event and all its credited duty attendance student records will be removed from the system.
            </p>
          </div>
        }
        confirmLabel="Yes, Delete Event"
        variant="danger"
      />

      {/* Confirm Cancel Event Modal */}
      <ConfirmDialog
        isOpen={!!eventToCancel}
        onClose={() => setEventToCancel(null)}
        onConfirm={async () => {
          if (!eventToCancel) return;
          setIsDeletingEvent(true);
          try {
            await updateSpecialAttendanceStatus(eventToCancel.id, 'CANCELLED');
          } finally {
            setIsDeletingEvent(false);
            setEventToCancel(null);
          }
        }}
        isLoading={isDeletingEvent}
        title="Cancel Special Attendance"
        message={
          <p>
            Are you sure you want to cancel the special attendance request for{' '}
            <strong className="text-slate-900">{eventToCancel?.title}</strong>?
          </p>
        }
        confirmLabel="Yes, Cancel Event"
        variant="warning"
      />
    </div>
  );
};
