import React, { useState, useEffect } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Modal } from '../common/UIComponents';
import { DayOfWeek, TimetableEntry, TimetablePeriod } from '../../types';
import {
  Clock,
  Filter,
  Calendar,
  MapPin,
  UserCheck,
  Layers,
  User,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Grid3X3,
  List,
  Building,
  GraduationCap,
  Users,
  ShieldCheck
} from 'lucide-react';

const STANDARD_ROOMS = [
  'Room 101',
  'Room 102',
  'Room 103',
  'Room 201',
  'Room 202',
  'Smart Classroom 1',
  'Smart Classroom 2',
  'Seminar Hall A',
  'Seminar Hall B',
  'Computer Lab 1',
  'Computer Lab 2',
  'Hardware Lab',
  'Electronics Lab',
  'Physics Lab',
  'Chemistry Lab',
  'Language Lab'
];

export const TimetableView: React.FC = () => {
  const {
    timetablePeriods,
    timetableEntries,
    courseOfferings,
    courses,
    courseCategories,
    courseGroups,
    departments,
    faculty,
    students,
    studentCourseRegistrations,
    facultyAssignments,
    settings,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    addCourseOffering,
    addCourseGroup
  } = useCollegeData();

  const { user, activeRole } = useAuth();
  const isStudent = activeRole === 'STUDENT';
  const isFacultyRole = ['TEACHER', 'HOD', 'CLASS_TUTOR', 'COURSE_COORDINATOR'].includes(activeRole);
  const isHOD = activeRole === 'HOD';

  const canCreate = can(activeRole, 'timetable', 'create');
  const canUpdate = can(activeRole, 'timetable', 'update');
  const canDelete = can(activeRole, 'timetable', 'delete');

  // Identify current student or current faculty
  const currentStudent =
    user?.studentProfile ||
    students.find(
      s =>
        s.id === user?.id ||
        (s.username && user?.name && s.username.toLowerCase() === user.name.toLowerCase()) ||
        (s.universityRegisterNumber && user?.name && s.universityRegisterNumber.toLowerCase() === user.name.toLowerCase()) ||
        (user?.email && s.email.toLowerCase() === user.email.toLowerCase())
    ) ||
    null;

  const currentFaculty =
    faculty.find(
      f =>
        f.id === user?.id ||
        (f.username && user?.name && f.username.toLowerCase() === user.name.toLowerCase()) ||
        (user?.email && f.email.toLowerCase() === user.email.toLowerCase())
    ) ||
    null;

  // HOD's Department Resolution
  const hodDeptId = isHOD
    ? departments.find(d => d.hodFacultyId === currentFaculty?.id)?.id ||
      currentFaculty?.departmentId ||
      user?.departmentId ||
      user?.facultyProfile?.departmentId ||
      (user as any)?.departmentId ||
      departments[0]?.id
    : undefined;
  const hodDept = departments.find(d => d.id === hodDeptId);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [selectedDept, setSelectedDept] = useState<string>(isHOD && hodDeptId ? hodDeptId : 'ALL');
  const [onlyMySchedule, setOnlyMySchedule] = useState<boolean>(isStudent || (isFacultyRole && !isHOD));
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'matrix' | 'daily'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'daily';
    }
    return isHOD || activeRole === 'SUPER_ADMIN' || activeRole === 'PRINCIPAL' ? 'matrix' : 'daily';
  });

  // Automatically enforce department lock for HOD
  useEffect(() => {
    if (isHOD && hodDeptId && selectedDept !== hodDeptId) {
      setSelectedDept(hodDeptId);
    }
  }, [isHOD, hodDeptId, selectedDept]);

  const studentEnrolledGroupIds = new Set(
    currentStudent
      ? studentCourseRegistrations
          .filter(r => r.studentId === currentStudent.id)
          .map(r => r.courseGroupId)
      : []
  );

  const facultyAssignedGroupIds = new Set(
    currentFaculty
      ? facultyAssignments
          .filter(fa => fa.facultyId === currentFaculty.id)
          .map(fa => fa.courseGroupId)
      : []
  );

  const days: { key: DayOfWeek; label: string }[] = [
    { key: 'MONDAY', label: 'Monday' },
    { key: 'TUESDAY', label: 'Tuesday' },
    { key: 'WEDNESDAY', label: 'Wednesday' },
    { key: 'THURSDAY', label: 'Thursday' },
    { key: 'FRIDAY', label: 'Friday' }
  ];

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formDeptId, setFormDeptId] = useState<string>('ALL');
  const [formDay, setFormDay] = useState<DayOfWeek>('MONDAY');
  const [formPeriodId, setFormPeriodId] = useState<string>('');
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formOfferingId, setFormOfferingId] = useState<string>('');
  const [formGroupId, setFormGroupId] = useState<string>('');
  const [formFacultyId, setFormFacultyId] = useState<string>('');
  const [formRoom, setFormRoom] = useState<string>('Room 101');
  const [isCustomRoom, setIsCustomRoom] = useState<boolean>(false);
  const [showNewBatchInput, setShowNewBatchInput] = useState<boolean>(false);
  const [newBatchName, setNewBatchName] = useState<string>('');
  const [formSemester, setFormSemester] = useState<number>(1);
  const [formAcademicYear, setFormAcademicYear] = useState<string>('2026-27');

  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper function to match period IDs whether using friendly IDs or UUIDs
  const isMatchingPeriod = (entryPeriodId: string, p: TimetablePeriod) => {
    if (!entryPeriodId || !p) return false;
    if (entryPeriodId === p.id) return true;
    if (p.periodNumber === 1 && (entryPeriodId === 'period-1' || entryPeriodId === '00000000-0000-0000-0000-000000000001')) return true;
    if (p.periodNumber === 2 && (entryPeriodId === 'period-2' || entryPeriodId === '00000000-0000-0000-0000-000000000002')) return true;
    if (p.periodNumber === 3 && (entryPeriodId === 'period-3' || entryPeriodId === '00000000-0000-0000-0000-000000000003')) return true;
    if (p.periodNumber === 4 && (entryPeriodId === 'period-4' || entryPeriodId === '00000000-0000-0000-0000-000000000004')) return true;
    if (p.periodNumber === 5 && (entryPeriodId === 'period-5' || entryPeriodId === '00000000-0000-0000-0000-000000000005')) return true;
    if (p.isBreak && (entryPeriodId === 'period-lunch' || entryPeriodId === '00000000-0000-0000-0000-000000000000')) return true;
    return false;
  };

  // Check whether current user can modify a specific timetable entry
  const canModifyEntry = (entry: TimetableEntry) => {
    if (activeRole === 'SUPER_ADMIN') return true;
    if (!canUpdate && !canDelete) return false;
    if (isHOD) {
      if (!hodDeptId) return true;
      const offering = courseOfferings.find(o => o.id === entry.courseOfferingId);
      const course = courses.find(c => c.id === offering?.courseId);
      if (offering?.departmentId === hodDeptId || course?.departmentId === hodDeptId) return true;
      const fac = faculty.find(f => f.id === entry.facultyId);
      if (fac?.departmentId === hodDeptId) return true;
      return false;
    }
    return false;
  };

  // Check if a timetable entry should be visible given current filters
  const isEntryVisible = (t: TimetableEntry) => {
    if (onlyMySchedule) {
      if (isStudent) {
        if (!studentEnrolledGroupIds.has(t.courseGroupId)) return false;
      } else if (isFacultyRole) {
        if (!facultyAssignedGroupIds.has(t.courseGroupId) && t.facultyId !== currentFaculty?.id) return false;
      }
    }

    if (selectedDept !== 'ALL') {
      const off = courseOfferings.find(o => o.id === t.courseOfferingId);
      const course = courses.find(c => c.id === off?.courseId);
      if (off?.departmentId !== selectedDept && course?.departmentId !== selectedDept) return false;
    }

    if (selectedSemester !== 'ALL') {
      const off = courseOfferings.find(o => o.id === t.courseOfferingId);
      const sem = t.semesterNumber || off?.semesterNumber;
      if (sem && sem !== selectedSemester) return false;
    }

    return true;
  };

  // Open Add Modal
  const handleOpenAdd = (defaultPeriodId?: string, defaultDay?: DayOfWeek) => {
    if (!canCreate) return;
    setEditingEntry(null);
    setFormDay(defaultDay || selectedDay);

    const nonBreakPeriods = timetablePeriods.filter(p => !p.isBreak);
    const periodId = defaultPeriodId || nonBreakPeriods[0]?.id || '';
    setFormPeriodId(periodId);

    // Initial Department: if HOD, their department; if Super Admin, selectedDept or first dept or ALL
    const initialDeptId = isHOD && hodDeptId
      ? hodDeptId
      : (selectedDept !== 'ALL' ? selectedDept : (departments[0]?.id || 'ALL'));
    setFormDeptId(initialDeptId);

    // Filter courses for initialDeptId
    const availableCourses = initialDeptId !== 'ALL'
      ? courses.filter(c => c.departmentId === initialDeptId && c.isActive !== false)
      : courses.filter(c => c.isActive !== false);

    const initialCourse = availableCourses[0] || courses[0];
    const initialCourseId = initialCourse?.id || '';
    setFormCourseId(initialCourseId);

    // Match or link offering
    const matchingOffering = courseOfferings.find(
      o => o.courseId === initialCourseId && (initialDeptId === 'ALL' || o.departmentId === initialDeptId)
    );
    const initialOfferingId = matchingOffering?.id || 'NEW_OFFERING';
    setFormOfferingId(initialOfferingId);

    // Match groups
    const matchingGroups = matchingOffering
      ? courseGroups.filter(g => g.courseOfferingId === matchingOffering.id)
      : [];
    const initialGroup = matchingGroups[0];
    setFormGroupId(initialGroup?.id || (matchingGroups.length > 0 ? matchingGroups[0].id : 'DEFAULT_GROUP'));

    // Default faculty
    const defaultAssignment = facultyAssignments.find(fa => fa.courseGroupId === initialGroup?.id);
    const deptFac = initialDeptId !== 'ALL' ? faculty.filter(f => f.departmentId === initialDeptId) : faculty;
    const defaultFacId = defaultAssignment?.facultyId || deptFac[0]?.id || currentFaculty?.id || faculty[0]?.id || '';
    setFormFacultyId(defaultFacId);

    const roomVal = initialGroup?.room || 'Room 101';
    setFormRoom(roomVal);
    setIsCustomRoom(!STANDARD_ROOMS.includes(roomVal));
    setShowNewBatchInput(false);
    setNewBatchName('');

    setFormSemester(
      selectedSemester !== 'ALL'
        ? Number(selectedSemester)
        : (initialCourse?.defaultSemester || initialCourse?.semester || matchingOffering?.semesterNumber || 1)
    );
    setFormAcademicYear(matchingOffering?.academicYear || settings.activeAcademicYear || '2026-27');

    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (entry: TimetableEntry) => {
    if (!canUpdate) return;
    if (!canModifyEntry(entry)) {
      setPageMessage({
        type: 'error',
        text: 'Permission restricted: HOD can only edit timetable slots for their own department.'
      });
      return;
    }

    setEditingEntry(entry);
    setFormDay(entry.dayOfWeek || entry.weekday || selectedDay);
    setFormPeriodId(entry.periodId);

    const off = courseOfferings.find(o => o.id === entry.courseOfferingId);
    const course = courses.find(c => c.id === off?.courseId);

    const resolvedDeptId = off?.departmentId || course?.departmentId || (isHOD && hodDeptId ? hodDeptId : 'ALL');
    setFormDeptId(resolvedDeptId);

    setFormCourseId(course?.id || '');
    setFormOfferingId(entry.courseOfferingId || off?.id || '');
    setFormGroupId(entry.courseGroupId);
    setFormFacultyId(entry.facultyId);

    const roomVal = entry.room || entry.roomNumber || '';
    setFormRoom(roomVal || 'Room 101');
    setIsCustomRoom(!STANDARD_ROOMS.includes(roomVal) && roomVal !== '');
    setShowNewBatchInput(false);
    setNewBatchName('');

    setFormSemester(entry.semesterNumber || off?.semesterNumber || course?.defaultSemester || 1);
    setFormAcademicYear(entry.academicYear || off?.academicYear || settings.activeAcademicYear || '2026-27');

    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle course/subject selection in modal
  const handleCourseSelect = (courseId: string) => {
    setFormCourseId(courseId);
    const selectedCourse = courses.find(c => c.id === courseId);
    if (!selectedCourse) return;

    if (selectedCourse.defaultSemester || selectedCourse.semester) {
      setFormSemester(selectedCourse.defaultSemester || selectedCourse.semester || 1);
    }

    const matchingOffering = courseOfferings.find(
      o => o.courseId === courseId && (formDeptId === 'ALL' || o.departmentId === formDeptId)
    );

    if (matchingOffering) {
      setFormOfferingId(matchingOffering.id);
      if (matchingOffering.semesterNumber) setFormSemester(matchingOffering.semesterNumber);
      if (matchingOffering.academicYear) setFormAcademicYear(matchingOffering.academicYear);

      const groups = courseGroups.filter(g => g.courseOfferingId === matchingOffering.id);
      if (groups.length > 0) {
        setFormGroupId(groups[0].id);
        if (groups[0].room) {
          setFormRoom(groups[0].room);
          setIsCustomRoom(!STANDARD_ROOMS.includes(groups[0].room));
        }
        const assign = facultyAssignments.find(fa => fa.courseGroupId === groups[0].id);
        if (assign?.facultyId) {
          setFormFacultyId(assign.facultyId);
        }
      } else {
        setFormGroupId('DEFAULT_GROUP');
      }
    } else {
      setFormOfferingId('NEW_OFFERING');
      setFormGroupId('DEFAULT_GROUP');
    }
  };

  // Department selection handler in modal
  const handleDeptChange = (deptId: string) => {
    setFormDeptId(deptId);
    const availableCourses = deptId === 'ALL'
      ? courses.filter(c => c.isActive !== false)
      : courses.filter(c => c.departmentId === deptId && c.isActive !== false);

    const nextCourse = availableCourses[0] || courses[0];
    if (nextCourse) {
      handleCourseSelect(nextCourse.id);
    } else {
      setFormCourseId('');
      setFormOfferingId('');
      setFormGroupId('');
    }

    const deptFaculty = deptId !== 'ALL' ? faculty.filter(f => f.departmentId === deptId) : faculty;
    if (deptFaculty[0]) {
      setFormFacultyId(deptFaculty[0].id);
    }
  };

  // Group selection handler in modal
  const handleGroupChange = (groupId: string) => {
    setFormGroupId(groupId);
    const grp = courseGroups.find(g => g.id === groupId);
    if (grp?.room) {
      setFormRoom(grp.room);
      setIsCustomRoom(!STANDARD_ROOMS.includes(grp.room));
    }
    const assign = facultyAssignments.find(fa => fa.courseGroupId === groupId);
    if (assign?.facultyId) {
      setFormFacultyId(assign.facultyId);
    }
  };

  // Check potential slot conflicts
  const getSlotConflicts = () => {
    const activePeriod = timetablePeriods.find(p => p.id === formPeriodId);
    const existingSameSlot = timetableEntries.filter(
      t =>
        (!editingEntry || t.id !== editingEntry.id) &&
        (t.dayOfWeek === formDay || t.weekday === formDay) &&
        (t.periodId === formPeriodId || (activePeriod ? isMatchingPeriod(t.periodId, activePeriod) : false))
    );

    const facultyConflict = existingSameSlot.find(t => t.facultyId === formFacultyId);
    const roomConflict = formRoom.trim()
      ? existingSameSlot.find(
          t => (t.room || t.roomNumber)?.toLowerCase().trim() === formRoom.toLowerCase().trim()
        )
      : null;

    return { facultyConflict, roomConflict };
  };

  const { facultyConflict, roomConflict } = getSlotConflicts();

  // Save timetable entry to Supabase
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCourseId) {
      setModalError('Please select a Course / Subject from the dropdown list.');
      return;
    }

    if (!formFacultyId || !formPeriodId) {
      setModalError('Please select Period, Course / Subject, and Faculty member.');
      return;
    }

    if (isHOD && hodDeptId && formDeptId !== hodDeptId) {
      setModalError(`Unauthorized: HOD can only manage timetable slots for their assigned department (${hodDept?.name || 'Department'}).`);
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const selectedCourse = courses.find(c => c.id === formCourseId);
      const targetDeptId = formDeptId !== 'ALL'
        ? formDeptId
        : (selectedCourse?.departmentId || departments[0]?.id);

      // 1. Resolve or create Course Offering
      let resolvedOfferingId = formOfferingId;
      if (!resolvedOfferingId || resolvedOfferingId === 'NEW_OFFERING') {
        const offRes = await addCourseOffering({
          courseId: formCourseId,
          departmentId: targetDeptId,
          academicYear: formAcademicYear,
          semesterNumber: formSemester,
          isActive: true
        });
        if (offRes.success && offRes.data) {
          resolvedOfferingId = offRes.data.id;
        } else {
          const fallbackOff = courseOfferings.find(o => o.courseId === formCourseId);
          if (fallbackOff) {
            resolvedOfferingId = fallbackOff.id;
          } else {
            setModalError(offRes.error || 'Failed to initialize course offering.');
            setIsSaving(false);
            return;
          }
        }
      }

      // 2. Resolve Course Group (Batch/Section)
      let resolvedGroupId = formGroupId;
      if (showNewBatchInput && newBatchName.trim()) {
        const grpRes = await addCourseGroup({
          courseOfferingId: resolvedOfferingId,
          groupName: newBatchName.trim(),
          room: formRoom.trim() || 'Room 101',
          capacity: 60,
          isActive: true
        });
        if (grpRes.success && grpRes.data) {
          resolvedGroupId = grpRes.data.id;
        }
      } else if (!resolvedGroupId || resolvedGroupId === 'DEFAULT_GROUP') {
        const existingGroup = courseGroups.find(g => g.courseOfferingId === resolvedOfferingId);
        if (existingGroup) {
          resolvedGroupId = existingGroup.id;
        } else {
          const grpRes = await addCourseGroup({
            courseOfferingId: resolvedOfferingId,
            groupName: 'Batch A (Lecture)',
            room: formRoom.trim() || 'Room 101',
            capacity: 60,
            isActive: true
          });
          if (grpRes.success && grpRes.data) {
            resolvedGroupId = grpRes.data.id;
          } else {
            resolvedGroupId = courseGroups[0]?.id || 'group-1';
          }
        }
      }

      // 3. Save Timetable Slot
      let res: { success: boolean; error?: string };
      if (editingEntry) {
        res = await updateTimetableEntry(editingEntry.id, {
          dayOfWeek: formDay,
          weekday: formDay,
          periodId: formPeriodId,
          courseOfferingId: resolvedOfferingId,
          courseGroupId: resolvedGroupId,
          facultyId: formFacultyId,
          room: formRoom.trim(),
          roomNumber: formRoom.trim(),
          academicYear: formAcademicYear,
          semesterNumber: formSemester,
          isActive: true
        });
      } else {
        res = await addTimetableEntry({
          dayOfWeek: formDay,
          weekday: formDay,
          periodId: formPeriodId,
          courseOfferingId: resolvedOfferingId,
          courseGroupId: resolvedGroupId,
          facultyId: formFacultyId,
          room: formRoom.trim(),
          roomNumber: formRoom.trim(),
          academicYear: formAcademicYear,
          semesterNumber: formSemester,
          isActive: true
        });
      }

      setIsSaving(false);

      if (!res.success) {
        setModalError(res.error || 'Failed to save timetable slot to database.');
        return;
      }

      setPageMessage({
        type: 'success',
        text: `Timetable slot ${editingEntry ? 'updated' : 'created'} successfully. Attendance rosters are synced.`
      });
      setTimeout(() => setPageMessage(null), 4000);
      setIsModalOpen(false);
    } catch (err: any) {
      setIsSaving(false);
      setModalError(err.message || 'An unexpected error occurred while saving timetable slot.');
    }
  };

  // Delete timetable entry
  const handleDeleteSlot = async (entry: TimetableEntry) => {
    if (!canDelete) return;
    const offering = courseOfferings.find(o => o.id === entry.courseOfferingId);
    const course = courses.find(c => c.id === offering?.courseId);
    const period = timetablePeriods.find(p => isMatchingPeriod(entry.periodId, p));

    if (
      confirm(
        `Are you sure you want to remove the scheduled slot for "${course?.courseCode || 'this class'}" on ${entry.dayOfWeek || entry.weekday} (${period?.label || 'Period'})?`
      )
    ) {
      setDeletingId(entry.id);
      setPageMessage(null);
      const res = await deleteTimetableEntry(entry.id);
      setDeletingId(null);
      if (!res.success) {
        setPageMessage({
          type: 'error',
          text: res.error || 'Failed to remove timetable slot from database.'
        });
      } else {
        setPageMessage({
          type: 'success',
          text: 'Timetable slot removed successfully.'
        });
        setTimeout(() => setPageMessage(null), 4000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Message */}
      {pageMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
            pageMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {pageMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{pageMessage.text}</span>
          </div>
          <button
            onClick={() => setPageMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* HOD Timetable Management Console Banner */}
      {isHOD && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xs border border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wider">
              HOD Timetable
            </span>
            {hodDept && (
              <span className="text-xs font-bold text-blue-200">
                {hodDept.name} ({hodDept.code})
              </span>
            )}
          </div>
          {canCreate && (
            <button
              onClick={() => handleOpenAdd()}
              className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {isStudent && onlyMySchedule
                ? 'My Timetable'
                : isHOD && hodDept
                ? `${hodDept.code} Timetable`
                : 'Timetable'}
            </h2>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* View Mode Toggle: Matrix vs Daily */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'matrix' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View full Monday-Friday schedule matrix"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Weekly Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'daily' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View day-by-day detailed cards"
            >
              <List className="w-3.5 h-3.5" />
              <span>Daily View</span>
            </button>
          </div>

          {/* Add Timetable Slot Button */}
          {canCreate && (
            <button
              id="add-timetable-slot-btn"
              onClick={() => handleOpenAdd()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 shrink-0"
              title="Add a new class slot to the timetable"
            >
              <Plus className="w-4 h-4" />
              <span>Add Slot</span>
            </button>
          )}

          {/* Semester Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {(isStudent || isFacultyRole) && (
            <button
              onClick={() => setOnlyMySchedule(!onlyMySchedule)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                onlyMySchedule
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              {isStudent
                ? (onlyMySchedule ? 'Showing My Courses' : 'Show My Courses')
                : (onlyMySchedule ? 'Showing My Classes' : 'Show All Department Classes')}
            </button>
          )}

          {/* Department Filter / Scope */}
          {isHOD ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{hodDept?.name || 'Department'} ({hodDept?.code || 'DEPT'}) — HOD Locked</span>
            </div>
          ) : (
            (!onlyMySchedule || !isStudent) && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Departments (Master View)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            )
          )}
        </div>
      </div>

      {/* MATRIX VIEW OR DAILY VIEW */}
      {viewMode === 'matrix' ? (
        /* Weekly Matrix 5-Day Grid View */
        <div className="w-full max-w-full min-w-0 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-blue-600" />
                <span>Weekly Department Class Schedule (Monday — Friday)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {canCreate
                  ? 'Click "+ Assign Class" on any empty period & day slot to schedule classes.'
                  : 'Weekly schedule overview across all 5 working periods.'}
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => handleOpenAdd()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all self-start sm:self-auto shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slot</span>
              </button>
            )}
          </div>

          <div className="md:hidden px-3.5 py-2 bg-blue-50/90 border-b border-blue-100 flex items-center justify-between gap-2 text-[11px] text-blue-800 font-medium">
            <span>Scroll horizontally across days ➔</span>
            <button
              onClick={() => setViewMode('daily')}
              className="text-blue-700 font-bold underline hover:text-blue-900 shrink-0"
            >
              Switch to Daily View
            </button>
          </div>

          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-xs font-bold text-slate-700">
                  <th className="p-3.5 w-36 border-r border-slate-200 font-bold">Period / Time</th>
                  {days.map(d => (
                    <th key={d.key} className="p-3.5 border-r border-slate-200 last:border-r-0 text-center font-bold">
                      <div className="text-slate-900">{d.label}</div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Working Day</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {timetablePeriods.map(period => {
                  if (period.isBreak) {
                    return (
                      <tr key={period.id} className="bg-amber-50/80 border-y border-amber-200/80">
                        <td className="p-3 font-mono text-xs font-bold text-amber-900 border-r border-amber-200/80">
                          {period.startTime} - {period.endTime}
                        </td>
                        <td colSpan={5} className="p-3 text-center text-xs font-bold text-amber-800">
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>{period.label} ({period.startTime} — {period.endTime}) • Inter-session Refreshment Break</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={period.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 border-r border-slate-200 bg-slate-50/40 align-top">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                            {period.periodNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{period.label}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {period.startTime} — {period.endTime}
                        </div>
                      </td>

                      {days.map(d => {
                        const slotEntries = timetableEntries.filter(
                          t =>
                            (t.dayOfWeek === d.key || t.weekday === d.key) &&
                            isMatchingPeriod(t.periodId, period) &&
                            isEntryVisible(t)
                        );

                        return (
                          <td key={d.key} className="p-2.5 border-r border-slate-200 last:border-r-0 align-top min-w-[160px]">
                            {slotEntries.length === 0 ? (
                              canCreate ? (
                                <button
                                  onClick={() => handleOpenAdd(period.id, d.key)}
                                  className="w-full h-full min-h-[90px] rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/70 p-2 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-blue-700 transition-all group cursor-pointer"
                                  title={`Assign class to ${d.label} (${period.label})`}
                                >
                                  <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                    <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-blue-700">Assign Class</span>
                                  <span className="text-[9px] text-slate-400">Empty Slot</span>
                                </button>
                              ) : (
                                <div className="w-full h-full min-h-[90px] rounded-xl border border-dashed border-slate-100 bg-slate-50/30 flex items-center justify-center text-xs text-slate-300">
                                  —
                                </div>
                              )
                            ) : (
                              <div className="space-y-2">
                                {slotEntries.map(entry => {
                                  const offering = courseOfferings.find(o => o.id === entry.courseOfferingId);
                                  const course = courses.find(c => c.id === offering?.courseId);
                                  const category = courseCategories.find(cat => cat.id === course?.categoryId);
                                  const group = courseGroups.find(g => g.id === entry.courseGroupId);
                                  const fac = faculty.find(f => f.id === entry.facultyId);

                                  return (
                                    <div
                                      key={entry.id}
                                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-1.5 text-left group relative"
                                    >
                                      <div className="flex items-start justify-between gap-1">
                                        <span
                                          className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider line-clamp-1"
                                          style={{ backgroundColor: category?.colorHex || '#2563eb' }}
                                        >
                                          {category?.name || 'COURSE'}
                                        </span>
                                        {canModifyEntry(entry) && (
                                          <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                                            {canUpdate && (
                                              <button
                                                onClick={() => handleOpenEdit(entry)}
                                                className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                title="Edit Slot"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                            )}
                                            {canDelete && (
                                              <button
                                                onClick={() => handleDeleteSlot(entry)}
                                                disabled={deletingId === entry.id}
                                                className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                                                title="Delete Slot"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <div className="text-xs font-bold text-slate-900 line-clamp-1" title={course?.courseTitle}>
                                          {course?.courseCode || 'COURSE'}
                                        </div>
                                        <div className="text-[10px] text-slate-500 line-clamp-1" title={course?.courseTitle}>
                                          {course?.courseTitle || 'Untitled Course'}
                                        </div>
                                      </div>

                                      <div className="pt-1.5 border-t border-slate-200/60 space-y-0.5 text-[10px] text-slate-600">
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-semibold text-slate-800 line-clamp-1" title={fac?.fullName}>
                                            {fac?.fullName?.split(' ')[0] || 'Unassigned'}
                                          </span>
                                          <span className="text-slate-500 bg-white px-1 py-0.5 rounded border border-slate-200/80 font-mono text-[9px]">
                                            {entry.room || entry.roomNumber || group?.room || 'TBD'}
                                          </span>
                                        </div>
                                        {group && (
                                          <div className="text-[9px] text-slate-400 flex items-center justify-between">
                                            <span>{group.name}</span>
                                            <span>Sem {entry.semesterNumber || offering?.semesterNumber || 1}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {canCreate && (
                                  <button
                                    onClick={() => handleOpenAdd(period.id, d.key)}
                                    className="w-full py-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 rounded-lg border border-dashed border-blue-200 transition-all flex items-center justify-center gap-1"
                                    title="Add parallel batch or lab slot"
                                  >
                                    <Plus className="w-2.5 h-2.5" /> Parallel Slot
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Daily View */
        <>
          {/* Day Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {days.map(d => (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.key)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedDay === d.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Timetable Period Schedule Grid */}
          <div className="space-y-4">
            {timetablePeriods.map(period => {
              if (period.isBreak) {
                return (
                  <div
                    key={period.id}
                    className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>
                      {period.label} ({period.startTime} - {period.endTime}) — Inter-session Refreshment Break
                    </span>
                  </div>
                );
              }

              // Find entries for this period and day
              const filteredEntries = timetableEntries.filter(
                t =>
                  (t.dayOfWeek === selectedDay || t.weekday === selectedDay) &&
                  isMatchingPeriod(t.periodId, period) &&
                  isEntryVisible(t)
              );

              return (
                <div
                  key={period.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs flex items-center justify-center border border-blue-100 shrink-0">
                        {period.periodNumber}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{period.label}</h4>
                        <p className="text-xs text-slate-500 font-mono">
                          {period.startTime} — {period.endTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {filteredEntries.length} Active Classes
                      </span>
                      {/* Quick Add Slot to this Period */}
                      {canCreate && (
                        <button
                          onClick={() => handleOpenAdd(period.id, selectedDay)}
                          className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                          title={`Add a class slot to ${period.label}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Slot</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Parallel Classes Grid */}
                  {filteredEntries.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <p className="font-medium text-slate-500">No scheduled classes for {selectedDay} in {period.label}.</p>
                      {canCreate && (
                        <button
                          onClick={() => handleOpenAdd(period.id, selectedDay)}
                          className="mt-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs inline-flex items-center gap-1 border border-blue-200 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Assign Class to {period.label}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredEntries.map(entry => {
                        const offering = courseOfferings.find(o => o.id === entry.courseOfferingId);
                        const course = courses.find(c => c.id === offering?.courseId);
                        const category = courseCategories.find(cat => cat.id === course?.categoryId);
                        const group = courseGroups.find(g => g.id === entry.courseGroupId);
                        const fac = faculty.find(f => f.id === entry.facultyId);
                        const dept = departments.find(d => d.id === offering?.departmentId);

                        return (
                          <div
                            key={entry.id}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all space-y-2 relative group"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                                  style={{ backgroundColor: category?.colorHex || '#2563eb' }}
                                >
                                  {category?.name || 'COURSE'}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                  {dept?.code || 'GEN'}
                                </span>
                                {group && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                                    {group.name}
                                  </span>
                                )}
                              </div>

                              {/* Edit / Delete Slot Controls */}
                              {canModifyEntry(entry) && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {canUpdate && (
                                    <button
                                      onClick={() => handleOpenEdit(entry)}
                                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      title="Edit Slot"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteSlot(entry)}
                                      disabled={deletingId === entry.id}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                      title="Delete Slot"
                                    >
                                      {deletingId === entry.id ? (
                                        <span className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            <div>
                              <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{course?.courseTitle || 'Untitled Course'}</h5>
                              <p className="text-[11px] text-slate-500 font-mono">{course?.courseCode || 'N/A'}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {entry.room || entry.roomNumber || group?.room || 'TBD'}
                              </span>
                              <span className="font-semibold text-slate-800 line-clamp-1" title={fac?.fullName}>
                                {fac?.fullName || 'Unassigned'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit Timetable Slot Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEntry ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
          subtitle="Configure day, period, course group, room, and faculty assignment"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveSlot} className="space-y-4">
            {/* Day and Period Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Day of Week <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formDay}
                  onChange={e => setFormDay(e.target.value as DayOfWeek)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-800"
                  required
                >
                  {days.map(d => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Class Period <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formPeriodId}
                  onChange={e => setFormPeriodId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-800"
                  required
                >
                  {timetablePeriods
                    .filter(p => !p.isBreak)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.label} ({p.startTime} - {p.endTime})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Department Selection (HOD department-locked vs Super Admin selector) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Target Department</span>
                  <span className="text-rose-500">*</span>
                </label>
                {isHOD ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    HOD Department Scoped (Locked)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                    Super Admin Master Selector
                  </span>
                )}
              </div>
              {isHOD ? (
                <div className="w-full text-xs p-2.5 rounded-xl border border-emerald-200 bg-white font-bold text-slate-800 flex items-center justify-between">
                  <span>{hodDept ? `${hodDept.name} (${hodDept.code})` : 'Your Department'}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Your Respective Department
                  </span>
                </div>
              ) : (
                <select
                  value={formDeptId}
                  onChange={e => handleDeptChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-800"
                >
                  <option value="ALL">All Departments (Master Curriculum Catalog)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                {isHOD
                  ? 'As HOD, timetable slots and subjects are strictly managed within your respective department.'
                  : 'Super Admin can assign classes across any department or multi-disciplinary academic offering.'}
              </p>
            </div>

            {/* Course / Subject Dropdown List */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Course / Subject <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-blue-600 font-medium">
                  {(() => {
                    const count = formDeptId === 'ALL'
                      ? courses.filter(c => c.isActive !== false).length
                      : courses.filter(c => c.departmentId === formDeptId && c.isActive !== false).length;
                    return `${count} subjects available`;
                  })()}
                </span>
              </div>
              <select
                id="timetable-course-dropdown"
                value={formCourseId}
                onChange={e => handleCourseSelect(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
                required
              >
                <option value="">-- Select Course / Subject from Catalog --</option>
                {(() => {
                  const filteredCourses = formDeptId === 'ALL'
                    ? courses.filter(c => c.isActive !== false)
                    : courses.filter(c => c.departmentId === formDeptId && c.isActive !== false);

                  // Group courses by category or department
                  const grouped: { [key: string]: typeof courses } = {};
                  filteredCourses.forEach(c => {
                    const cat = courseCategories.find(cat => cat.id === c.categoryId);
                    const groupKey = cat?.name || (c.type === 'THEORY' ? 'Theory Courses' : 'Practical / Lab Courses');
                    if (!grouped[groupKey]) grouped[groupKey] = [];
                    grouped[groupKey].push(c);
                  });

                  return Object.entries(grouped).map(([groupTitle, courseList]) => (
                    <optgroup key={groupTitle} label={`📚 ${groupTitle} (${courseList.length})`}>
                      {courseList.map(c => {
                        const dept = departments.find(d => d.id === c.departmentId);
                        return (
                          <option key={c.id} value={c.id}>
                            {c.courseCode}: {c.courseTitle} — Sem {c.defaultSemester || c.semester || 1} • {c.credits} Cr ({dept?.code || 'Dept'})
                          </option>
                        );
                      })}
                    </optgroup>
                  ));
                })()}
              </select>
              {formDeptId !== 'ALL' && courses.filter(c => c.departmentId === formDeptId && c.isActive !== false).length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  No subjects listed for this department yet. Please add subjects in Curriculum/Courses view.
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                Selecting a subject auto-configures the semester and connects with attendance rosters.
              </p>
            </div>

            {/* Course Group / Batch / Section & Faculty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Course Group / Batch <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewBatchInput(!showNewBatchInput)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                  >
                    {showNewBatchInput ? 'Select Existing' : '+ New Batch'}
                  </button>
                </div>

                {showNewBatchInput ? (
                  <input
                    type="text"
                    value={newBatchName}
                    onChange={e => setNewBatchName(e.target.value)}
                    placeholder="e.g. Batch A, Lab Group 1, Honours"
                    className="w-full text-xs p-2.5 rounded-xl border border-blue-400 focus:ring-2 focus:ring-blue-500 bg-blue-50/40 text-slate-900 font-semibold"
                    required
                  />
                ) : (
                  <select
                    value={formGroupId}
                    onChange={e => {
                      if (e.target.value === 'ADD_NEW') {
                        setShowNewBatchInput(true);
                      } else {
                        handleGroupChange(e.target.value);
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
                    required
                  >
                    <option value="">-- Select Group / Section --</option>
                    {(formOfferingId && formOfferingId !== 'NEW_OFFERING'
                      ? courseGroups.filter(g => g.courseOfferingId === formOfferingId)
                      : courseGroups
                    ).map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.type}) {g.room ? `[${g.room}]` : ''}
                      </option>
                    ))}
                    <option value="DEFAULT_GROUP">Batch A (Main Lecture Class)</option>
                    <option value="ADD_NEW">+ Create Custom Batch Name...</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Faculty <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formFacultyId}
                  onChange={e => setFormFacultyId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
                  required
                >
                  <option value="">-- Select Faculty Member --</option>
                  {formDeptId !== 'ALL' ? (
                    <>
                      <optgroup label="Department Faculty">
                        {faculty
                          .filter(f => f.departmentId === formDeptId)
                          .map(f => (
                            <option key={f.id} value={f.id}>
                              {f.fullName} — {f.designation} {f.id === currentFaculty?.id ? '(You)' : ''}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Other Departments (Cross-teaching / MDC)">
                        {faculty
                          .filter(f => f.departmentId !== formDeptId)
                          .map(f => {
                            const dept = departments.find(d => d.id === f.departmentId);
                            return (
                              <option key={f.id} value={f.id}>
                                {f.fullName} ({dept?.code || 'Faculty'}) — {f.designation}
                              </option>
                            );
                          })}
                      </optgroup>
                    </>
                  ) : (
                    faculty.map(f => {
                      const dept = departments.find(d => d.id === f.departmentId);
                      return (
                        <option key={f.id} value={f.id}>
                          {f.fullName} ({dept?.code || 'Faculty'}) — {f.designation}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            </div>

            {/* Room, Semester, Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Room / Lab <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomRoom(!isCustomRoom)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                  >
                    {isCustomRoom ? 'Pick Standard' : 'Custom Room'}
                  </button>
                </div>
                {isCustomRoom ? (
                  <input
                    type="text"
                    value={formRoom}
                    onChange={e => setFormRoom(e.target.value)}
                    placeholder="e.g. Smart Room 304, CAD Lab"
                    className="w-full text-xs p-2.5 rounded-xl border border-blue-400 focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                ) : (
                  <select
                    value={formRoom}
                    onChange={e => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomRoom(true);
                      } else {
                        setFormRoom(e.target.value);
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
                    required
                  >
                    {STANDARD_ROOMS.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Enter Custom Room / Lab...</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Semester Number
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={formSemester}
                  onChange={e => setFormSemester(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={formAcademicYear}
                  onChange={e => setFormAcademicYear(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Conflict Warnings */}
            {(facultyConflict || roomConflict) && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Potential Schedule Conflict Detected</span>
                </div>
                {facultyConflict && (
                  <p className="text-[11px] text-amber-800">
                    • <strong>{faculty.find(f => f.id === formFacultyId)?.fullName || 'Selected faculty'}</strong> is already scheduled for another class during {timetablePeriods.find(p => p.id === formPeriodId)?.label} on {formDay}.
                  </p>
                )}
                {roomConflict && (
                  <p className="text-[11px] text-amber-800">
                    • <strong>{formRoom}</strong> is already allocated to another class during {timetablePeriods.find(p => p.id === formPeriodId)?.label} on {formDay}.
                  </p>
                )}
                <p className="text-[10px] text-amber-700 italic pt-0.5">
                  You may still proceed if this is an intentional co-teaching session or shared lab.
                </p>
              </div>
            )}

            {/* Modal Error */}
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Error:</span> {modalError}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <span>{editingEntry ? 'Update Timetable Slot' : 'Add Timetable Slot'}</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
