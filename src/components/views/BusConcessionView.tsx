import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { usePersonalizedCollege } from '../../contexts/PersonalizedCollegeContext';
import {
  BusConcessionApplication,
  BusConcessionSubject,
  BusConcessionDuration,
  BUS_CONCESSION_SUBJECTS,
  SUBJECT_METADATA
} from '../../types/busConcession';
import {
  busConcessionService,
  CURRENT_ACADEMIC_YEAR,
  GOOGLE_APPS_SCRIPT_SAMPLE_CODE
} from '../../services/busConcessionService';
import {
  Bus,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Printer,
  Download,
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  AlertCircle,
  Plus,
  RefreshCw,
  Send,
  X,
  UserCheck,
  Building2,
  Lock,
  Unlock,
  AlertTriangle,
  FileCheck
} from 'lucide-react';

const PROGRAMME_TO_BUS_SUBJECT: Record<string, BusConcessionSubject> = {
  'prog-ba-eco': 'B.A. Economics',
  'prog-ba-eng': 'B.A. English',
  'prog-ba-hin': 'B.A. Hindi',
  'prog-ba-his': 'B.A. History',
  'prog-ba-mal': 'B.A. Malayalam',
  'prog-bcom': 'B.Com',
  'prog-bsc-bot': 'B.Sc. Botany',
  'prog-bsc-che': 'B.Sc. Chemistry',
  'prog-bsc-cs': 'B.Sc. Computer Science',
  'prog-bsc-ic': 'B.Sc. Industrial Chemistry',
  'prog-bsc-mat': 'B.Sc. Maths',
  'prog-bsc-phy': 'B.Sc. Physics',
  'prog-bsc-zoo': 'B.Sc. Zoology',
  'prog-ma-eco': 'M.A. Economics',
  'prog-ma-eng': 'M.A. English',
  'prog-msc-cs': 'M.Sc. Computer Science',
  'prog-msc-mat': 'M.Sc. Maths',
  'prog-msc-phy': 'M.Sc. Physics',
  'prog-mcom': 'M.Com'
};

const DEPT_TO_DEFAULT_SUBJECT: Record<string, BusConcessionSubject> = {
  'dept-eco': 'B.A. Economics',
  'dept-eng': 'B.A. English',
  'dept-hin': 'B.A. Hindi',
  'dept-his': 'B.A. History',
  'dept-mal': 'B.A. Malayalam',
  'dept-com': 'B.Com',
  'dept-bot': 'B.Sc. Botany',
  'dept-che': 'B.Sc. Chemistry',
  'dept-cs': 'B.Sc. Computer Science',
  'dept-ic': 'B.Sc. Industrial Chemistry',
  'dept-mat': 'B.Sc. Maths',
  'dept-phy': 'B.Sc. Physics',
  'dept-zoo': 'B.Sc. Zoology'
};

export const BusConcessionView: React.FC = () => {
  const { user, activeRole } = useAuth();
  const { students, departments, programmes } = useCollegeData();
  const { currentStudent } = usePersonalizedCollege();

  const [applications, setApplications] = useState<BusConcessionApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<BusConcessionApplication | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Google Sheets state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Role determinations
  const isStudent = activeRole === 'STUDENT';
  const isHod = activeRole === 'HOD';
  const isSuperOrPrincipal = ['SUPER_ADMIN', 'PRINCIPAL', 'OFFICE_STAFF'].includes(activeRole);

  // Determine HOD's active department (defaults to HOD profile's department or dept-phy)
  const defaultHodDeptId = user?.departmentId || 'dept-phy';
  const [selectedHodDeptId, setSelectedHodDeptId] = useState<string>(defaultHodDeptId);

  // Window status trigger
  const [windowToggleTick, setWindowToggleTick] = useState(0);

  // 1. Resolve student record directly from the institutional onboarding database (onboarded by Super Admin / HOD)
  const onboardedStudent = useMemo(() => {
    if (!students || students.length === 0) return null;

    if (user?.studentProfile?.id) {
      const match = students.find((s) => s.id === user.studentProfile?.id);
      if (match) return match;
    }

    if (currentStudent?.id) {
      const match = students.find(
        (s) =>
          s.id === currentStudent.id ||
          (s.admissionNumber &&
            currentStudent.admissionNumber &&
            s.admissionNumber.toUpperCase() === currentStudent.admissionNumber.toUpperCase())
      );
      if (match) return match;
    }

    if (user?.id) {
      const match = students.find(
        (s) =>
          s.id === user.id ||
          (s as any).auth_user_id === user.id ||
          (s.admissionNumber && user.name && s.admissionNumber.toLowerCase() === user.name.toLowerCase()) ||
          (s.username && user.name && s.username.toLowerCase() === user.name.toLowerCase()) ||
          (s.universityRegisterNumber &&
            user.name &&
            s.universityRegisterNumber.toLowerCase() === user.name.toLowerCase()) ||
          (user.email && s.email && s.email.toLowerCase() === user.email.toLowerCase())
      );
      if (match) return match;
    }

    if (isStudent && students.length > 0) {
      return students[0];
    }

    return null;
  }, [students, user, currentStudent, isStudent]);

  // 2. Fetch Department directly from the student onboarding record
  const studentOnboardedDepartment = useMemo(() => {
    if (!onboardedStudent?.homeDepartmentId) return null;
    return departments.find((d) => d.id === onboardedStudent.homeDepartmentId) || null;
  }, [onboardedStudent, departments]);

  const studentDeptId =
    studentOnboardedDepartment?.id || onboardedStudent?.homeDepartmentId || 'dept-phy';
  const studentDeptName =
    studentOnboardedDepartment?.name || 'Department of Physics';

  // 3. Subjects filtered strictly to the student's onboarded department
  const availableDeptSubjects = useMemo<BusConcessionSubject[]>(() => {
    const list = BUS_CONCESSION_SUBJECTS.filter((sub) => {
      const meta = SUBJECT_METADATA[sub];
      return meta && meta.departmentId === studentDeptId;
    });
    return list.length > 0 ? list : ['B.Sc. Physics'];
  }, [studentDeptId]);

  // 4. Default / allocated subject based on student's programme from onboarding data
  const studentAllocatedSubject = useMemo<BusConcessionSubject>(() => {
    if (onboardedStudent?.programmeId) {
      if (PROGRAMME_TO_BUS_SUBJECT[onboardedStudent.programmeId]) {
        return PROGRAMME_TO_BUS_SUBJECT[onboardedStudent.programmeId];
      }
      const prog = programmes.find((p) => p.id === onboardedStudent.programmeId);
      if (prog) {
        const found = availableDeptSubjects.find(
          (s) =>
            s.toLowerCase().includes(prog.code.toLowerCase()) ||
            prog.name.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(prog.name.toLowerCase())
        );
        if (found) return found;
      }
    }
    // Match based on UG / PG from onboarding
    const isPg =
      (onboardedStudent?.currentSemester || 1) > 8 ||
      onboardedStudent?.programmeId?.includes('-m');
    const pgMatch = availableDeptSubjects.find((s) => s.startsWith('M.'));
    const ugMatch = availableDeptSubjects.find((s) => s.startsWith('B.'));
    if (isPg && pgMatch) return pgMatch;
    if (ugMatch) return ugMatch;
    return availableDeptSubjects[0];
  }, [onboardedStudent, programmes, availableDeptSubjects]);

  const studentMetadata = SUBJECT_METADATA[studentAllocatedSubject];

  // Load real applications & webhook URL
  const reloadData = () => {
    const list = busConcessionService.getAllApplications();
    setApplications(list);
    setWebhookUrl(busConcessionService.getSheetsWebhookUrl());
  };

  useEffect(() => {
    reloadData();
  }, [windowToggleTick]);

  // Student's own application for current year (Strictly one per year)
  const studentAdmissionNumber = (
    onboardedStudent?.admissionNumber ||
    currentStudent?.admissionNumber ||
    user?.name ||
    ''
  )
    .trim()
    .toUpperCase();

  const studentExistingApplication = useMemo(() => {
    if (!studentAdmissionNumber) return undefined;
    return applications.find(
      (a) =>
        a.admissionNumber.trim().toUpperCase() === studentAdmissionNumber &&
        (a.academicYear || CURRENT_ACADEMIC_YEAR) === CURRENT_ACADEMIC_YEAR
    );
  }, [applications, studentAdmissionNumber]);

  // Window Open/Close status for student's department or HOD's department
  const isStudentDeptWindowOpen = useMemo(() => {
    return busConcessionService.isDepartmentWindowOpen(studentDeptId);
  }, [studentDeptId, windowToggleTick]);

  const isHodDeptWindowOpen = useMemo(() => {
    return busConcessionService.isDepartmentWindowOpen(selectedHodDeptId);
  }, [selectedHodDeptId, windowToggleTick]);

  // Form State for Student
  const [formData, setFormData] = useState({
    studentName: onboardedStudent?.fullName || currentStudent?.fullName || user?.name || '',
    admissionNumber: studentAdmissionNumber,
    dateOfBirth: onboardedStudent?.dateOfBirth || currentStudent?.dateOfBirth || '',
    guardianName: onboardedStudent?.guardianName || currentStudent?.guardianName || '',
    address: onboardedStudent?.address || currentStudent?.address || '',
    subject: studentAllocatedSubject,
    courseDuration: (studentAllocatedSubject.startsWith('M.')
      ? 'PG Two Year'
      : 'UG Four Year') as BusConcessionDuration,
    startingPoint: '',
    endingPoint: 'NSS College Ottapalam (Palappuram)',
    distanceKm: 12,
    studentPhone:
      onboardedStudent?.mobileNumber ||
      onboardedStudent?.phone ||
      currentStudent?.phone ||
      currentStudent?.mobileNumber ||
      ''
  });

  // Keep form in sync when onboardedStudent or subject updates
  useEffect(() => {
    if (onboardedStudent) {
      setFormData((prev) => ({
        ...prev,
        studentName: onboardedStudent.fullName || prev.studentName,
        admissionNumber: onboardedStudent.admissionNumber || prev.admissionNumber,
        dateOfBirth: onboardedStudent.dateOfBirth || prev.dateOfBirth,
        guardianName: onboardedStudent.guardianName || prev.guardianName,
        address: onboardedStudent.address || prev.address,
        studentPhone:
          onboardedStudent.mobileNumber || onboardedStudent.phone || prev.studentPhone,
        subject: studentAllocatedSubject,
        courseDuration: studentAllocatedSubject.startsWith('M.')
          ? 'PG Two Year'
          : 'UG Four Year'
      }));
    }
  }, [onboardedStudent, studentAllocatedSubject]);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessNotice, setSubmitSuccessNotice] = useState<string | null>(null);

  // Departments for HOD & Admin filters
  const academicDepartments = departments.filter((d) => d.type === 'ACADEMIC');
  const currentHodDepartment = useMemo(() => {
    return (
      academicDepartments.find((d) => d.id === selectedHodDeptId) || {
        id: selectedHodDeptId,
        name: 'Department of Physics',
        code: 'PHY'
      }
    );
  }, [academicDepartments, selectedHodDeptId]);

  // Applications filtered STRICTLY by Role:
  // - HOD: ONLY their department!
  // - Student: Their own application!
  // - Principal / SuperAdmin / OfficeStaff: All college departments with sorting/filter!
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    if (isHod) {
      result = result.filter((app) => app.departmentId === selectedHodDeptId);
    } else if (isSuperOrPrincipal) {
      if (selectedHodDeptId !== 'ALL') {
        result = result.filter((app) => app.departmentId === selectedHodDeptId);
      }
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((app) => app.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.studentName.toLowerCase().includes(q) ||
          app.admissionNumber.toLowerCase().includes(q) ||
          app.subject.toLowerCase().includes(q) ||
          app.startingPoint.toLowerCase().includes(q)
      );
    }

    return result;
  }, [applications, isHod, isSuperOrPrincipal, selectedHodDeptId, statusFilter, searchQuery]);

  // Statistics strictly for the current view
  const stats = useMemo(() => {
    const list = isHod
      ? applications.filter((a) => a.departmentId === selectedHodDeptId)
      : applications;

    return {
      total: list.length,
      pending: list.filter((a) => a.status === 'SUBMITTED').length,
      verified: list.filter((a) => a.status === 'VERIFIED_BY_HOD').length,
      approved: list.filter((a) => a.status === 'APPROVED_BY_PRINCIPAL').length,
      rejected: list.filter((a) => a.status === 'REJECTED').length
    };
  }, [applications, isHod, selectedHodDeptId]);

  // Student Form Submit
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.studentName || !formData.admissionNumber || !formData.dateOfBirth || !formData.startingPoint) {
      setSubmitError('Please complete all mandatory fields.');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await busConcessionService.submitApplication({
        studentName: formData.studentName,
        admissionNumber: formData.admissionNumber,
        dateOfBirth: formData.dateOfBirth,
        guardianName: formData.guardianName,
        address: formData.address,
        subject: formData.subject,
        departmentId: studentDeptId,
        departmentName: studentDeptName,
        courseDuration: formData.courseDuration,
        startingPoint: formData.startingPoint,
        endingPoint: formData.endingPoint,
        distanceKm: Number(formData.distanceKm),
        studentPhone: formData.studentPhone
      } as any);

      reloadData();
      setSubmitSuccessNotice(
        `Application successfully submitted for ${formData.studentName} (${formData.admissionNumber})! ${
          res.googleSheetsSynced
            ? '✓ Synced in real-time to Office Google Sheets.'
            : '✓ Recorded in institutional register.'
        }`
      );
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting application.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // HOD / Principal Status Actions
  const handleUpdateStatus = (appId: string, newStatus: any, remarks?: string) => {
    const verifierTitle = isHod
      ? `${currentHodDepartment.name} HOD`
      : 'Principal / Administrative Office';

    busConcessionService.updateApplicationStatus(appId, newStatus, verifierTitle, remarks);
    reloadData();
  };

  // Toggle Window Open/Close
  const handleToggleWindow = () => {
    const nextState = !isHodDeptWindowOpen;
    busConcessionService.setDepartmentWindowOpen(selectedHodDeptId, nextState);
    setWindowToggleTick((t) => t + 1);
  };

  // Google Sheets Webhook Test
  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    const res = await busConcessionService.testSheetsWebhook(webhookUrl);
    setWebhookTestResult(res);
    setIsTestingWebhook(false);
    if (res.success) {
      busConcessionService.setSheetsWebhookUrl(webhookUrl);
    }
  };

  const handleSaveWebhook = () => {
    busConcessionService.setSheetsWebhookUrl(webhookUrl);
    setIsSheetsModalOpen(false);
    alert('Google Sheets Webhook URL saved successfully!');
  };

  const quickStops = [
    'Shoranur Junction',
    'Pattambi Bus Stand',
    'Cherpulassery',
    'Mannarkkad',
    'Kulappully',
    'Vallapuzha',
    'Vaniyamkulam 22nd Mile',
    'Lakkidi Perur',
    'Mankara',
    'Kalladikode',
    'Ottapalam Bus Stand'
  ];

  // =========================================================================
  // VIEW 1: STUDENT VIEW (Exclusive to Student Role)
  // =========================================================================
  if (isStudent) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Student Portal Header Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                Student Travel Concession Desk
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30 text-[10px] font-bold">
                Academic Year {CURRENT_ACADEMIC_YEAR}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight flex items-center gap-3">
              <Bus className="w-7 h-7 text-amber-400 shrink-0" />
              Bus Concession
            </h1>
          </div>
        </div>

        {/* CASE A: STUDENT HAS ALREADY SUBMITTED FOR THIS YEAR (One-time per year rule) */}
        {studentExistingApplication ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 font-display">
                    Your Bus Concession Application ({CURRENT_ACADEMIC_YEAR})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Application Reference: <span className="font-mono font-bold text-rose-900">{studentExistingApplication.id}</span>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {studentExistingApplication.status === 'SUBMITTED' && (
                  <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs inline-flex items-center gap-1.5 border border-amber-300">
                    <Clock className="w-4 h-4 text-amber-700" />
                    Submitted • Awaiting HOD Verification
                  </span>
                )}
                {studentExistingApplication.status === 'VERIFIED_BY_HOD' && (
                  <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-900 font-bold text-xs inline-flex items-center gap-1.5 border border-blue-300">
                    <UserCheck className="w-4 h-4 text-blue-700" />
                    Verified by Subject HOD • Forwarded to Principal
                  </span>
                )}
                {studentExistingApplication.status === 'APPROVED_BY_PRINCIPAL' && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs inline-flex items-center gap-1.5 border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Approved by Principal • Card Ready for Collection (Office Counter 12)
                  </span>
                )}
                {studentExistingApplication.status === 'REJECTED' && (
                  <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-900 font-bold text-xs inline-flex items-center gap-1.5 border border-rose-300">
                    <X className="w-4 h-4 text-rose-700" />
                    Rejected
                  </span>
                )}
              </div>
            </div>

            {/* Application Details Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Student Information</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <strong className="text-slate-900">{studentExistingApplication.studentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admission No:</span>
                  <strong className="font-mono text-rose-900">{studentExistingApplication.admissionNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allocated Subject:</span>
                  <strong>{studentExistingApplication.subject}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Course Duration:</span>
                  <span>{studentExistingApplication.courseDuration}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Route & Distance Details</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Boarding Point:</span>
                  <strong className="text-slate-900">{studentExistingApplication.startingPoint}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span>{studentExistingApplication.endingPoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Distance (KM):</span>
                  <strong className="font-mono text-emerald-700">{studentExistingApplication.distanceKm} KM</strong>
                </div>
              </div>
            </div>

            {/* HOD Remarks if available */}
            {studentExistingApplication.hodRemarks && (
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-0.5">
                <span className="font-bold block text-[11px]">HOD Verification Remark:</span>
                <p>{studentExistingApplication.hodRemarks}</p>
                {studentExistingApplication.verifiedBy && (
                  <span className="text-[10px] text-blue-700 block mt-1 italic">
                    Endorsed by: {studentExistingApplication.verifiedBy}
                  </span>
                )}
              </div>
            )}

            {studentExistingApplication.rejectionReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-0.5">
                <span className="font-bold block text-[11px]">Reason for Rejection:</span>
                <p>{studentExistingApplication.rejectionReason}</p>
              </div>
            )}

            {/* Important One-Time Submission Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">One-Time Submission Completed for {CURRENT_ACADEMIC_YEAR}</strong>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  As per University transport policy, each student can only submit one bus concession application per academic year. For any changes to your permanent address or route, please contact your Subject HOD directly.
                </p>
              </div>
            </div>

            {/* Print Slip Action */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setSelectedApp(studentExistingApplication);
                  setIsPrintModalOpen(true);
                }}
                className="px-5 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Download / Print Concession Slip</span>
              </button>
            </div>
          </div>
        ) : !isStudentDeptWindowOpen ? (
          /* CASE B: APPLICATION WINDOW CLOSED BY HOD */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-display">
                Bus Concession Window Currently Closed
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                The application window for <strong>{studentAllocatedSubject}</strong> ({studentMetadata?.departmentName}) is currently closed for Academic Year {CURRENT_ACADEMIC_YEAR}.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 max-w-md mx-auto">
              The application form will become available on this page once the <strong>Head of Department (HOD)</strong> opens the concession submission window.
            </div>
          </div>
        ) : (
          /* CASE C: APPLICATION WINDOW OPEN & NOT YET SUBMITTED -> APPLY FORM */
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 bg-rose-50 px-2 py-0.5 rounded">
                Annual Student Application
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1 font-display">
                Apply for Bus Concession Card ({CURRENT_ACADEMIC_YEAR})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Note: You can only submit this application once per academic year. Your department and subject are locked to your enrolled discipline.
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold">
                {submitError}
              </div>
            )}

            <form onSubmit={handleStudentSubmit} className="space-y-5">
              {/* Pre-filled and Locked Institutional Identification from Onboarding Record */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Department & Profile Fetched from Student Onboarding Database</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    Onboarded by Super Admin / HOD
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Student Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={formData.studentName}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-800 font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Admission Number</label>
                    <input
                      type="text"
                      disabled
                      value={formData.admissionNumber}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-rose-900 font-bold cursor-not-allowed"
                    />
                  </div>

                  {/* DEPARTMENT FETCHED FROM ONBOARDING DATA */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Allocated Department <span className="text-[10px] text-emerald-600 font-semibold">(Verified Onboarding Record)</span>
                    </label>
                    <div className="w-full px-3 py-2 bg-emerald-50/70 border border-emerald-300 rounded-xl text-emerald-950 font-bold flex items-center justify-between">
                      <span className="truncate">{studentDeptName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-mono uppercase tracking-wider ml-1 shrink-0">
                        Locked
                      </span>
                    </div>
                  </div>

                  {/* SUBJECT / PROGRAMME (Filtered strictly to student's department!) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Subject / Degree Programme
                      {availableDeptSubjects.length > 1 && (
                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                          ({availableDeptSubjects.length} programmes in your department)
                        </span>
                      )}
                    </label>
                    {availableDeptSubjects.length === 1 ? (
                      <input
                        type="text"
                        disabled
                        value={availableDeptSubjects[0]}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-900 cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={formData.subject}
                        onChange={(e) => {
                          const newSub = e.target.value as BusConcessionSubject;
                          setFormData({
                            ...formData,
                            subject: newSub,
                            courseDuration: newSub.startsWith('M.') ? 'PG Two Year' : 'UG Four Year'
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
                      >
                        {availableDeptSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub} ({sub.startsWith('M.') ? 'PG Two Year' : 'UG Four Year'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Course Duration</label>
                    <input
                      type="text"
                      disabled
                      value={formData.courseDuration}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Name of Guardian <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Father / Mother / Guardian"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
                  />
                </div>
              </div>

              {/* Permanent Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Permanent Residential Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="House name, street/post, locality, PIN Code..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
                />
              </div>

              {/* Route & Distance */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Travel Route & Boarding Stop
                </span>

                {/* Quick Stops */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Quick select boarding point:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickStops.map((stop) => (
                      <button
                        type="button"
                        key={stop}
                        onClick={() => setFormData({ ...formData, startingPoint: stop })}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:border-rose-900/50 hover:bg-rose-50/50 rounded-lg text-[11px] font-medium text-slate-700 transition-colors"
                      >
                        {stop}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Starting Point (Boarding Stop) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shoranur, Pattambi..."
                      value={formData.startingPoint}
                      onChange={(e) => setFormData({ ...formData, startingPoint: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ending Point (Destination)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.endingPoint}
                      className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-100 border border-slate-300 rounded-xl font-medium text-slate-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Distance in KM <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 max-w-xs">
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="120"
                        required
                        value={formData.distanceKm}
                        onChange={(e) => setFormData({ ...formData, distanceKm: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-mono font-bold"
                      />
                      <span className="text-xs font-bold text-slate-500">KM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-3 bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-slate-900 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {formSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Printable Slip Modal */}
        {isPrintModalOpen && selectedApp && (
          <PrintSlipModal app={selectedApp} onClose={() => setIsPrintModalOpen(false)} />
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: HOD & PRINCIPAL / SUPER-ADMIN / STAFF PANELS
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                {isHod ? 'HOD Desk' : 'Bus Concession'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30 text-[10px] font-bold">
                AY {CURRENT_ACADEMIC_YEAR}
              </span>
              {webhookUrl && isSuperOrPrincipal && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Google Sheet Connected
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight flex items-center gap-3">
              <Bus className="w-7 h-7 text-amber-400 shrink-0" />
              {isHod
                ? `Bus Concession — ${currentHodDepartment.name}`
                : 'Bus Concession Management'}
            </h1>
          </div>

          {/* Action CTAs for HOD / Admin */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Window Open / Close Toggle Button (Crucial HOD feature requested by user) */}
            <button
              onClick={handleToggleWindow}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-all active:scale-95 ${
                isHodDeptWindowOpen
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-700 hover:bg-rose-800 text-white'
              }`}
              title={
                isHodDeptWindowOpen
                  ? 'Click to Close application window for this department'
                  : 'Click to Open application window for this department'
              }
            >
              {isHodDeptWindowOpen ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Window: OPEN (Click to Close)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Window: CLOSED (Click to Open)</span>
                </>
              )}
            </button>

            {/* Export CSV (Only exports the desired HOD's department) */}
            <button
              onClick={() =>
                busConcessionService.exportToCsv(
                  filteredApplications,
                  isHod ? `NSS_${currentHodDepartment.code}_Bus_Concessions` : 'NSS_All_Bus_Concessions'
                )
              }
              className="px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 font-medium rounded-xl text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-all"
              title="Export Current Table as CSV"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Export CSV</span>
            </button>

            {/* Google Sheets Link (Only for Principal / Admin / HOD) */}
            {isSuperOrPrincipal && (
              <button
                onClick={() => setIsSheetsModalOpen(true)}
                className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold rounded-xl text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Google Sheets Config</span>
              </button>
            )}
          </div>
        </div>

        {/* Department Switcher & Scope Filter */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                {isHod ? 'Your Subject Department Scope' : 'Filter by Academic Department'}
              </span>
              <span className="text-sm font-bold text-white">
                {selectedHodDeptId === 'ALL' ? 'All College Departments' : currentHodDepartment.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-300 whitespace-nowrap">Department:</span>
            <select
              value={selectedHodDeptId}
              onChange={(e) => setSelectedHodDeptId(e.target.value)}
              className="bg-slate-950/90 text-amber-300 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400 w-full sm:w-auto"
            >
              {isSuperOrPrincipal && <option value="ALL">All Departments (College-Wide)</option>}
              {academicDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Bento Statistics (Reflects ONLY current department for HOD) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider block">Total Applications</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-slate-600 mt-0.5 block">
            {isHod ? currentHodDepartment.code : 'All Departments'}
          </span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Verification
          </span>
          <span className="text-2xl font-black text-amber-900 mt-1 block">{stats.pending}</span>
          <span className="text-[11px] text-amber-700 mt-0.5 block">Requires HOD Sign</span>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-xs">
          <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-blue-600" />
            Verified by HOD
          </span>
          <span className="text-2xl font-black text-blue-900 mt-1 block">{stats.verified}</span>
          <span className="text-[11px] text-blue-700 mt-0.5 block">Forwarded to Office</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Principal Approved
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">{stats.approved}</span>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">Card Ready at Counter</span>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block flex items-center gap-1">
            <X className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
          <span className="text-2xl font-black text-rose-900 mt-1 block">{stats.rejected}</span>
          <span className="text-[11px] text-rose-700 mt-0.5 block">Invalid Distance</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3.5">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, admission no, or stop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            {['ALL', 'SUBMITTED', 'VERIFIED_BY_HOD', 'APPROVED_BY_PRINCIPAL', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL'
                  ? 'All'
                  : st === 'SUBMITTED'
                  ? 'Pending'
                  : st === 'VERIFIED_BY_HOD'
                  ? 'Verified'
                  : st === 'APPROVED_BY_PRINCIPAL'
                  ? 'Approved'
                  : 'Rejected'}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student & Admission</th>
                <th className="py-3 px-4">Subject & Duration</th>
                <th className="py-3 px-4">Bus Route (Stops)</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Guardian & Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Bus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">No applications submitted yet for this department.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      As students submit their bus concession forms, their verified records will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{app.studentName}</div>
                      <div className="text-[11px] font-mono font-semibold text-rose-900 mt-0.5">
                        Adm: {app.admissionNumber}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        DOB: {new Date(app.dateOfBirth).toLocaleDateString('en-IN')}
                      </div>
                    </td>

                    {/* Subject & Duration */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{app.subject}</div>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.courseDuration.includes('UG')
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        {app.courseDuration}
                      </span>
                    </td>

                    {/* Route */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{app.startingPoint}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 pl-4 mt-0.5">
                        <span>→ {app.endingPoint}</span>
                      </div>
                    </td>

                    {/* Distance */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-black text-slate-900 text-sm">
                        {app.distanceKm} KM
                      </div>
                    </td>

                    {/* Guardian & Address */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-medium text-slate-900 truncate">
                        Gdn: {app.guardianName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={app.address}>
                        {app.address}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {app.status === 'SUBMITTED' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending HOD
                        </span>
                      )}
                      {app.status === 'VERIFIED_BY_HOD' && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] inline-flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          HOD Verified
                        </span>
                      )}
                      {app.status === 'APPROVED_BY_PRINCIPAL' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      )}
                      {app.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] inline-flex items-center gap-1">
                          <X className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* HOD Verify Action Button */}
                        {app.status === 'SUBMITTED' && (isHod || isSuperOrPrincipal) && (
                          <button
                            onClick={() => {
                              const remarks = prompt(
                                `Confirm HOD verification for ${app.studentName} (${app.subject})? Enter remarks:`,
                                'Verified admission and residential distance.'
                              );
                              if (remarks !== null) {
                                handleUpdateStatus(app.id, 'VERIFIED_BY_HOD', remarks);
                              }
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                            title="Verify and Recommend to Principal"
                          >
                            <Check className="w-3 h-3" />
                            <span>Verify</span>
                          </button>
                        )}

                        {/* Principal Approve Action Button */}
                        {app.status === 'VERIFIED_BY_HOD' && isSuperOrPrincipal && (
                          <button
                            onClick={() => {
                              handleUpdateStatus(app.id, 'APPROVED_BY_PRINCIPAL', 'Approved for bus concession card issue.');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                            title="Principal Final Approval"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Printable Application Card */}
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setIsPrintModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="View / Print Official Concession Application Card"
                        >
                          <Printer className="w-4 h-4 text-slate-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Sheets Config Modal (Only accessible to Principal / Office Staff / HOD) */}
      {isSheetsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-display">
                    Google Sheets Webhook Configuration
                  </h2>
                  <p className="text-xs text-slate-500">
                    Deployment ID: <span className="font-mono font-bold text-slate-800">AKfycbwUsYbi-kx4riUvslgfxf9TWcUitMqRZVdtKcTxx65mrn7cBBaR3AbLWhRJ5HP3B6Pf</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSheetsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs sm:text-sm">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Google Apps Script Web App URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                  <button
                    onClick={handleTestWebhook}
                    disabled={!webhookUrl || isTestingWebhook}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-1.5"
                  >
                    {isTestingWebhook ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Test Ping</span>
                  </button>
                </div>

                {webhookTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium ${
                      webhookTestResult.success
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-50 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {webhookTestResult.message}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSheetsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveWebhook}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all"
                >
                  Save URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Application Card */}
      {isPrintModalOpen && selectedApp && (
        <PrintSlipModal app={selectedApp} onClose={() => setIsPrintModalOpen(false)} />
      )}
    </div>
  );
};

// =========================================================================
// REUSABLE PRINTABLE SLIP MODAL
// =========================================================================
const PrintSlipModal: React.FC<{ app: BusConcessionApplication; onClose: () => void }> = ({ app, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
          <span className="text-xs font-bold text-slate-600">Printable Concession Application Card</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-rose-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-rose-800 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Slip */}
        <div className="mt-4 p-6 border-2 border-slate-900 rounded-2xl space-y-4 font-serif text-slate-900 bg-white">
          <div className="text-center border-b-2 border-slate-900 pb-3">
            <h3 className="text-lg font-black tracking-wide uppercase">N.S.S. COLLEGE, OTTAPALAM</h3>
            <p className="text-[11px] font-sans font-semibold text-slate-700">
              Affiliated to the University of Calicut • Accredited 'A' Grade by NAAC
            </p>
            <p className="text-[10px] font-sans text-slate-600">
              Palappuram P.O., Palakkad District, Kerala - 679103 • Ph: 0466-2244382
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white font-sans font-bold text-xs uppercase tracking-wider rounded">
              Student Bus Concession Application & Certificate ({CURRENT_ACADEMIC_YEAR})
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-sans">
            <div className="col-span-2 space-y-2">
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Student Name:</span>
                <strong className="text-sm font-bold">{app.studentName}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Admission Number:</span>
                  <strong className="font-mono">{app.admissionNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Date of Birth:</span>
                  <strong>{new Date(app.dateOfBirth).toLocaleDateString('en-IN')}</strong>
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Guardian's Name:</span>
                <strong>{app.guardianName}</strong>
              </div>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center border border-dashed border-slate-400 rounded-xl p-3 bg-slate-50 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Affix Recent Passport Photo</div>
              <div className="text-[9px] text-slate-400 mt-1">(Attested by Principal)</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl font-sans text-xs border border-slate-200">
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Subject / Discipline:</span>
              <strong className="text-rose-900">{app.subject}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Course Duration:</span>
              <strong>{app.courseDuration}</strong>
            </div>
          </div>

          <div className="font-sans text-xs space-y-1.5 border border-slate-200 p-3 rounded-xl">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">From (Boarding Stop):</span>
                <strong>{app.startingPoint}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">To (Destination):</span>
                <strong>{app.endingPoint}</strong>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">One-Way Distance:</span>
                <strong>{app.distanceKm} KM</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold">Home Department:</span>
                <strong className="text-emerald-900">{app.departmentName || SUBJECT_METADATA[app.subject]?.departmentName || 'NSS College Ottapalam'}</strong>
              </div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold">Permanent Residential Address:</span>
              <p className="text-[11px] text-slate-800">{app.address}</p>
            </div>
          </div>

          <div className="pt-6 font-sans text-xs flex items-end justify-between border-t border-slate-300">
            <div className="text-center">
              <div className="w-32 border-b border-slate-900 mb-1" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">Student's Signature</span>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-blue-900">
                {app.verifiedBy || 'Subject HOD Signature'}
              </div>
              <div className="w-32 border-b border-slate-900 mb-1" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">HOD Signature & Seal</span>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-rose-950">Dr. Rajesh R</div>
              <div className="w-32 border-b border-slate-900 mb-1" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">Principal Signature & Seal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
