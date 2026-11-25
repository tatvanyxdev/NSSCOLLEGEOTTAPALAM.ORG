import React, { useEffect, useMemo, useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Badge } from '../common/UIComponents';
import { Student } from '../../types';
import {
  BookOpen,
  Users,
  Layers,
  Search,
  CheckCircle2,
  Trash2,
  GraduationCap,
  AlertCircle,
  Building2,
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronRight,
  Sparkles,
  Plus,
  X
} from 'lucide-react';

interface AllocatableCourseItem {
  key: string; // offeringId if exists, else `course:${courseId}`
  courseId: string;
  offeringId?: string;
  courseCode: string;
  courseTitle: string;
  credits: number;
  departmentId: string;
  defaultCategoryId: string;
  semesterNumber: number;
  groups: { id: string; groupName: string; room: string; capacity?: number }[];
}

export const CourseRegistrationsView: React.FC = () => {
  const {
    studentCourseRegistrations,
    students,
    courseOfferings,
    courses,
    courseCategories,
    courseGroups,
    departments,
    settings,
    addCourseOffering,
    addCourseGroup,
    registerStudentForCourse,
    bulkRegisterStudents,
    removeStudentCourseRegistration
  } = useCollegeData();

  const { user, activeRole } = useAuth();
  const isStudent = activeRole === 'STUDENT';

  // Specific student for student role - strictly isolated to logged-in student
  const currentStudent =
    user?.studentProfile ||
    students.find(
      s =>
        s.id === user?.id ||
        (s.username && user?.name && s.username.toLowerCase() === user.name.toLowerCase()) ||
        (s.universityRegisterNumber &&
          user?.name &&
          s.universityRegisterNumber.toLowerCase() === user.name.toLowerCase()) ||
        (user?.email && s.email.toLowerCase() === user.email.toLowerCase())
    ) ||
    null;

  const canAllocate =
    can(activeRole, 'course_registrations', 'register') ||
    ['SUPER_ADMIN', 'HOD', 'CLASS_TUTOR', 'OFFICE_STAFF'].includes(activeRole);

  // Active View Tab: 'allocator' (Structured Dashboard) or 'all' (Master Registrations Table)
  const [activeTab, setActiveTab] = useState<'allocator' | 'all'>(isStudent ? 'all' : 'allocator');

  // HOD department resolution
  const isHOD = activeRole === 'HOD';
  const hodDeptId = isHOD
    ? user?.departmentId ||
      user?.facultyProfile?.departmentId ||
      (user as any)?.department_id ||
      departments.find(d => d.hodFacultyId === user?.id)?.id ||
      departments[0]?.id
    : undefined;
  const hodDept = departments.find(d => d.id === hodDeptId);

  const defaultUserDeptId = useMemo(() => {
    if (isHOD && hodDeptId) return hodDeptId;
    if (user?.departmentId && departments.some(d => d.id === user.departmentId)) {
      return user.departmentId;
    }
    return departments[0]?.id || 'ALL';
  }, [isHOD, hodDeptId, user?.departmentId, departments]);

  // --- Structured Dashboard State (Dept -> Class/Year -> Semester -> Students -> Courses) ---
  const [selectedDeptId, setSelectedDeptId] = useState<string>(defaultUserDeptId);
  const [selectedClassYear, setSelectedClassYear] = useState<'ALL' | '1' | '2' | '3' | '4'>('1');
  const [selectedSemester, setSelectedSemester] = useState<'ALL' | number>(1);

  // Step 4: Student Selection & Inspection
  const [studentSearch, setStudentSearch] = useState('');
  const [studentAllocFilter, setStudentAllocFilter] = useState<'ALL' | 'UNALLOCATED' | 'ALLOCATED'>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [inspectedStudentId, setInspectedStudentId] = useState<string | null>(null);

  // Step 5: Course Selection & Category/Group Overrides
  const [courseSearch, setCourseSearch] = useState('');
  const [courseCatFilter, setCourseCatFilter] = useState<string>('ALL');
  const [includeCrossDeptCourses, setIncludeCrossDeptCourses] = useState<boolean>(false);
  const [selectedCourseKeys, setSelectedCourseKeys] = useState<string[]>([]);
  const [courseCategoryOverrides, setCourseCategoryOverrides] = useState<Record<string, string>>({});
  const [courseGroupOverrides, setCourseGroupOverrides] = useState<Record<string, string>>({});

  // Feedback & Busy States
  const [allocMessage, setAllocMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [deletingRegId, setDeletingRegId] = useState<string | null>(null);

  // --- Master Table State ---
  const [filterCourse, setFilterCourse] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>(isHOD && hodDeptId ? hodDeptId : 'ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Keep HOD locked if role/profile resolves asynchronously
  useEffect(() => {
    if (isHOD && hodDeptId) {
      setSelectedDeptId(hodDeptId);
      setFilterDept(hodDeptId);
    }
  }, [isHOD, hodDeptId]);

  const getStudentYear = (s: Student): number => {
    return s.yearOfStudy && s.yearOfStudy >= 1 && s.yearOfStudy <= 4
      ? s.yearOfStudy
      : Math.ceil((Number(s.currentSemester) || 1) / 2);
  };

  // Logical coupling: Changing Department resets student & course selections
  const handleSelectDepartment = (deptId: string) => {
    setSelectedDeptId(deptId);
    setSelectedStudentIds([]);
    setInspectedStudentId(null);
    setSelectedCourseKeys([]);
    setAllocMessage(null);
  };

  // Logical coupling: Changing Class Year syncs Semester into that Year's semesters (preferring where students exist)
  const handleSelectClassYear = (yr: 'ALL' | '1' | '2' | '3' | '4') => {
    setSelectedClassYear(yr);
    setSelectedStudentIds([]);
    setInspectedStudentId(null);
    setSelectedCourseKeys([]);

    if (yr !== 'ALL') {
      const yrNum = Number(yr);
      const oddSem = (yrNum - 1) * 2 + 1;
      const evenSem = yrNum * 2;
      if (selectedSemester !== oddSem && selectedSemester !== evenSem) {
        const deptStudentsInYr = students.filter(
          s =>
            (selectedDeptId === 'ALL' || s.homeDepartmentId === selectedDeptId) &&
            getStudentYear(s) === yrNum
        );
        const hasEven = deptStudentsInYr.some(s => Number(s.currentSemester) === evenSem);
        const hasOdd = deptStudentsInYr.some(s => Number(s.currentSemester) === oddSem);
        setSelectedSemester(hasEven && !hasOdd ? evenSem : oddSem);
      }
    }
  };

  // Logical coupling: Clicking a Semester syncs Class Year if not 'ALL'
  const handleSelectSemester = (sem: 'ALL' | number) => {
    setSelectedSemester(sem);
    setSelectedCourseKeys([]);
    if (sem !== 'ALL' && selectedClassYear !== 'ALL') {
      const targetYear = String(Math.ceil(sem / 2)) as '1' | '2' | '3' | '4';
      if (targetYear !== selectedClassYear) {
        setSelectedClassYear(targetYear);
        setSelectedStudentIds([]);
        setInspectedStudentId(null);
      }
    }
  };

  // Students matching Steps 1 -> 2 -> 3
  const scopedStudents = useMemo(() => {
    return students
      .filter(s => {
        if (s.status && s.status !== 'ACTIVE') return false;
        if (selectedDeptId !== 'ALL' && s.homeDepartmentId !== selectedDeptId) return false;
        if (selectedClassYear !== 'ALL') {
          if (getStudentYear(s) !== Number(selectedClassYear)) return false;
        } else if (selectedSemester !== 'ALL') {
          const semYear = Math.ceil(selectedSemester / 2);
          if (Number(s.currentSemester) !== selectedSemester && getStudentYear(s) !== semYear) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, { numeric: true }));
  }, [students, selectedDeptId, selectedClassYear, selectedSemester]);

  // Helper to get registrations for a student (optionally filtered to selectedSemester)
  const getStudentRegs = (studentId: string, semOnly = false) => {
    return studentCourseRegistrations.filter(r => {
      if (r.studentId !== studentId) return false;
      if (!semOnly || selectedSemester === 'ALL') return true;
      const off = courseOfferings.find(o => o.id === r.courseOfferingId);
      const crs = courses.find(c => c.id === off?.courseId);
      const sem = off?.semesterNumber || crs?.defaultSemester || crs?.semester;
      return sem === selectedSemester;
    });
  };

  // Filtered students list in Step 4
  const visibleStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return scopedStudents.filter(s => {
      const semRegs = getStudentRegs(s.id, true);
      if (studentAllocFilter === 'UNALLOCATED' && semRegs.length > 0) return false;
      if (studentAllocFilter === 'ALLOCATED' && semRegs.length === 0) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.universityRegisterNumber && s.universityRegisterNumber.toLowerCase().includes(q)) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q))
      );
    });
  }, [scopedStudents, studentSearch, studentAllocFilter, studentCourseRegistrations, selectedSemester]);

  // Clean up selectedStudentIds if scope shrinks
  useEffect(() => {
    const validIds = new Set(scopedStudents.map(s => s.id));
    setSelectedStudentIds(prev => prev.filter(id => validIds.has(id)));
  }, [scopedStudents]);

  // Determine the single student to inspect in the Assigned Subjects drawer
  const activeInspectedStudent = useMemo(() => {
    if (inspectedStudentId) {
      return scopedStudents.find(s => s.id === inspectedStudentId) || null;
    }
    if (selectedStudentIds.length === 1) {
      return scopedStudents.find(s => s.id === selectedStudentIds[0]) || null;
    }
    return null;
  }, [inspectedStudentId, selectedStudentIds, scopedStudents]);

  const inspectedStudentRegs = useMemo(() => {
    if (!activeInspectedStudent) return [];
    return getStudentRegs(activeInspectedStudent.id, false);
  }, [activeInspectedStudent, studentCourseRegistrations]);

  // Step 5: Build list of allocatable courses (combining existing offerings + courses without offerings yet)
  const availableCourses = useMemo<AllocatableCourseItem[]>(() => {
    const items: AllocatableCourseItem[] = [];
    const coveredCourseIds = new Set<string>();

    courseOfferings.forEach(off => {
      const crs = courses.find(c => c.id === off.courseId);
      if (!crs || crs.isActive === false) return;
      const sem = off.semesterNumber || crs.defaultSemester || crs.semester || 1;
      if (selectedSemester !== 'ALL' && sem !== selectedSemester) return;

      const deptId = off.departmentId || crs.departmentId;
      if (selectedDeptId !== 'ALL' && !includeCrossDeptCourses && deptId !== selectedDeptId) {
        return;
      }

      coveredCourseIds.add(crs.id);
      const groups = courseGroups.filter(g => g.courseOfferingId === off.id);
      items.push({
        key: off.id,
        courseId: crs.id,
        offeringId: off.id,
        courseCode: crs.courseCode,
        courseTitle: crs.courseTitle,
        credits: crs.credits || 4,
        departmentId: deptId,
        defaultCategoryId: crs.categoryId || courseCategories[0]?.id || 'cat-major',
        semesterNumber: sem,
        groups: groups.map(g => ({
          id: g.id,
          groupName: g.groupName,
          room: g.room,
          capacity: g.capacity
        }))
      });
    });

    // Also surface courses from Courses Master that don't have an offering yet
    courses.forEach(crs => {
      if (crs.isActive === false || coveredCourseIds.has(crs.id)) return;
      const sem = crs.defaultSemester || crs.semester || 1;
      if (selectedSemester !== 'ALL' && sem !== selectedSemester) return;
      if (selectedDeptId !== 'ALL' && !includeCrossDeptCourses && crs.departmentId !== selectedDeptId) {
        return;
      }

      items.push({
        key: `course:${crs.id}`,
        courseId: crs.id,
        offeringId: undefined,
        courseCode: crs.courseCode,
        courseTitle: crs.courseTitle,
        credits: crs.credits || 4,
        departmentId: crs.departmentId,
        defaultCategoryId: crs.categoryId || courseCategories[0]?.id || 'cat-major',
        semesterNumber: sem,
        groups: []
      });
    });

    return items.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  }, [
    courseOfferings,
    courses,
    courseGroups,
    courseCategories,
    selectedDeptId,
    selectedSemester,
    includeCrossDeptCourses
  ]);

  const filteredAvailableCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    return availableCourses.filter(item => {
      const effectiveCat = courseCategoryOverrides[item.key] || item.defaultCategoryId;
      if (courseCatFilter !== 'ALL' && effectiveCat !== courseCatFilter) return false;
      if (!q) return true;
      return (
        item.courseCode.toLowerCase().includes(q) ||
        item.courseTitle.toLowerCase().includes(q)
      );
    });
  }, [availableCourses, courseSearch, courseCatFilter, courseCategoryOverrides]);

  // Dashboard Summary Metrics for current Department / Class / Semester
  const scopedAllocatedCount = useMemo(() => {
    return scopedStudents.filter(s => getStudentRegs(s.id, true).length > 0).length;
  }, [scopedStudents, studentCourseRegistrations, selectedSemester]);

  const scopedTotalEnrollments = useMemo(() => {
    const studentIdSet = new Set(scopedStudents.map(s => s.id));
    return studentCourseRegistrations.filter(r => {
      if (!studentIdSet.has(r.studentId)) return false;
      if (selectedSemester === 'ALL') return true;
      const off = courseOfferings.find(o => o.id === r.courseOfferingId);
      const crs = courses.find(c => c.id === off?.courseId);
      const sem = off?.semesterNumber || crs?.defaultSemester || crs?.semester;
      return sem === selectedSemester;
    }).length;
  }, [scopedStudents, studentCourseRegistrations, courseOfferings, courses, selectedSemester]);

  // Selection toggles
  const allVisibleStudentsSelected =
    visibleStudents.length > 0 && visibleStudents.every(s => selectedStudentIds.includes(s.id));

  const toggleSelectAllVisibleStudents = () => {
    if (allVisibleStudentsSelected) {
      const visibleSet = new Set(visibleStudents.map(s => s.id));
      setSelectedStudentIds(prev => prev.filter(id => !visibleSet.has(id)));
    } else {
      const merged = new Set([...selectedStudentIds, ...visibleStudents.map(s => s.id)]);
      setSelectedStudentIds(Array.from(merged));
    }
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleCourseSelection = (key: string) => {
    setSelectedCourseKeys(prev =>
      prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
    );
  };

  const handleSelectCoreCourses = () => {
    const coreKeys = filteredAvailableCourses
      .filter(c => {
        const isOwnDept = selectedDeptId === 'ALL' || c.departmentId === selectedDeptId;
        return isOwnDept;
      })
      .map(c => c.key);

    if (coreKeys.length === 0) {
      setAllocMessage({
        type: 'error',
        text: 'No department courses found for the selected semester.'
      });
      return;
    }
    setSelectedCourseKeys(coreKeys);
    setAllocMessage(null);
  };

  // Count pending new enrollments (skipping duplicates)
  const pendingAssignmentSummary = useMemo(() => {
    let newPairs = 0;
    let skippedExisting = 0;

    selectedStudentIds.forEach(stuId => {
      selectedCourseKeys.forEach(courseKey => {
        const courseItem = availableCourses.find(c => c.key === courseKey);
        if (!courseItem) return;
        const already =
          courseItem.offeringId &&
          studentCourseRegistrations.some(
            r => r.studentId === stuId && r.courseOfferingId === courseItem.offeringId
          );
        if (already) {
          skippedExisting++;
        } else {
          newPairs++;
        }
      });
    });

    return { newPairs, skippedExisting };
  }, [selectedStudentIds, selectedCourseKeys, availableCourses, studentCourseRegistrations]);

  // Execute Bulk / Individual Course Assignment
  const handleAssignSelectedCourses = async () => {
    setAllocMessage(null);

    if (!canAllocate) {
      setAllocMessage({
        type: 'error',
        text: 'Your active role has read-only access for course allocations.'
      });
      return;
    }
    if (selectedStudentIds.length === 0) {
      setAllocMessage({
        type: 'error',
        text: 'Select at least one student in Step 4 before assigning courses.'
      });
      return;
    }
    if (selectedCourseKeys.length === 0) {
      setAllocMessage({
        type: 'error',
        text: 'Select at least one course in Step 5 to assign.'
      });
      return;
    }

    setIsAssigning(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const regsToCreate: Omit<typeof studentCourseRegistrations[0], 'id'>[] = [];

      for (const courseKey of selectedCourseKeys) {
        const item = availableCourses.find(c => c.key === courseKey);
        if (!item) continue;

        // 1. Ensure CourseOffering exists
        let offeringId = item.offeringId;
        if (!offeringId) {
          const existingOff = courseOfferings.find(
            o => o.courseId === item.courseId && o.semesterNumber === item.semesterNumber
          );
          if (existingOff) {
            offeringId = existingOff.id;
          } else {
            const offRes = await addCourseOffering({
              courseId: item.courseId,
              academicYear: settings.activeAcademicYear || '2026-2027',
              semesterNumber: item.semesterNumber,
              departmentId: item.departmentId,
              expectedStrength: Math.max(30, selectedStudentIds.length),
              maxStrength: 60,
              isActive: true
            });
            if (!offRes.success || !offRes.data) {
              setAllocMessage({
                type: 'error',
                text: offRes.error || `Could not create course offering for ${item.courseCode}.`
              });
              setIsAssigning(false);
              return;
            }
            offeringId = offRes.data.id;
          }
        }

        // 2. Ensure CourseGroup exists
        let groupId = courseGroupOverrides[item.key] || item.groups[0]?.id;
        if (!groupId) {
          const existingGroup = courseGroups.find(g => g.courseOfferingId === offeringId);
          if (existingGroup) {
            groupId = existingGroup.id;
          } else {
            const grpRes = await addCourseGroup({
              courseOfferingId: offeringId,
              groupName: 'Batch A',
              room: 'Main Block',
              capacity: 60,
              isActive: true
            });
            if (grpRes.success && grpRes.data) {
              groupId = grpRes.data.id;
            } else {
              groupId = courseGroups[0]?.id || '';
            }
          }
        }

        const categoryId =
          courseCategoryOverrides[item.key] ||
          item.defaultCategoryId ||
          courseCategories[0]?.id ||
          'cat-major';

        // 3. Build non-duplicate student registrations
        for (const studentId of selectedStudentIds) {
          const exists = studentCourseRegistrations.some(
            r => r.studentId === studentId && r.courseOfferingId === offeringId
          );
          if (!exists) {
            regsToCreate.push({
              studentId,
              courseOfferingId: offeringId,
              courseGroupId: groupId,
              courseCategoryId: categoryId,
              registrationDate: today,
              status: 'APPROVED'
            });
          }
        }
      }

      if (regsToCreate.length === 0) {
        setAllocMessage({
          type: 'error',
          text: 'All selected students are already assigned to the chosen courses.'
        });
        setIsAssigning(false);
        return;
      }

      if (regsToCreate.length === 1) {
        const res = await registerStudentForCourse(regsToCreate[0]);
        if (!res.success) {
          setAllocMessage({
            type: 'error',
            text: res.error || 'Failed to save course allocation.'
          });
          setIsAssigning(false);
          return;
        }
      } else {
        const res = await bulkRegisterStudents(regsToCreate);
        if (!res.success) {
          setAllocMessage({
            type: 'error',
            text: res.error || 'Failed to save course allocations.'
          });
          setIsAssigning(false);
          return;
        }
      }

      setAllocMessage({
        type: 'success',
        text: `Assigned ${regsToCreate.length} course enrollment${regsToCreate.length === 1 ? '' : 's'} across ${selectedStudentIds.length} student${selectedStudentIds.length === 1 ? '' : 's'}.`
      });
      setSelectedCourseKeys([]);
      setTimeout(() => setAllocMessage(null), 5000);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRegistration = async (id: string) => {
    setDeletingRegId(id);
    const res = await removeStudentCourseRegistration(id);
    setDeletingRegId(null);
    if (!res.success) {
      setAllocMessage({
        type: 'error',
        text: res.error || 'Failed to remove course allocation.'
      });
      setTimeout(() => setAllocMessage(null), 5000);
    }
  };

  // Master Directory Filter
  const filteredRegistrations = studentCourseRegistrations.filter(reg => {
    if (isStudent) {
      if (!currentStudent || reg.studentId !== currentStudent.id) return false;
    }

    const student = students.find(s => s.id === reg.studentId);
    const offering = courseOfferings.find(o => o.id === reg.courseOfferingId);
    const course = courses.find(c => c.id === offering?.courseId);

    const matchesCourse = filterCourse === 'ALL' || offering?.id === filterCourse;
    const matchesCat = filterCategory === 'ALL' || reg.courseCategoryId === filterCategory;
    const matchesDept = filterDept === 'ALL' || student?.homeDepartmentId === filterDept;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (student?.fullName && student.fullName.toLowerCase().includes(q)) ||
      (student?.rollNumber && student.rollNumber.toLowerCase().includes(q)) ||
      (student?.universityRegisterNumber &&
        student.universityRegisterNumber.toLowerCase().includes(q)) ||
      (course?.courseTitle && course.courseTitle.toLowerCase().includes(q)) ||
      (course?.courseCode && course.courseCode.toLowerCase().includes(q));

    return matchesCourse && matchesCat && matchesDept && matchesSearch;
  });

  if (isStudent && !currentStudent) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-xs">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Student Profile Linked</h3>
        <p className="text-xs text-slate-500 mt-2">
          No matching student profile was found for your account. Please log in with your valid
          University Register Number and password.
        </p>
      </div>
    );
  }

  const activeDeptObj = departments.find(d => d.id === selectedDeptId);
  const classYearOptions: { value: 'ALL' | '1' | '2' | '3' | '4'; label: string }[] = [
    { value: 'ALL', label: 'All Years' },
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' }
  ];

  const availableSemesterPills: ('ALL' | number)[] =
    selectedClassYear === 'ALL'
      ? ['ALL', 1, 2, 3, 4, 5, 6, 7, 8]
      : ['ALL', (Number(selectedClassYear) - 1) * 2 + 1, Number(selectedClassYear) * 2];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-900 text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900">
              {isStudent ? 'My Course Allocations' : 'Course Allocation Dashboard'}
            </h2>
            {!isStudent && (
              <p className="text-xs text-slate-500 mt-0.5">
                Department · Class Year · Semester · Select Students · Assign Courses
              </p>
            )}
          </div>
        </div>

        {/* View Switchers for Staff/Admin/HOD */}
        {!isStudent && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('allocator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'allocator'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-800" />
              Allocation Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Allocations ({studentCourseRegistrations.length})
            </button>
          </div>
        )}
      </div>

      {/* STRUCTURED COURSE ALLOCATION DASHBOARD */}
      {!isStudent && activeTab === 'allocator' && (
        <div className="space-y-5">
          {/* Status Message Notification */}
          {allocMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 border ${
                allocMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {allocMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{allocMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setAllocMessage(null)}
                className="text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEPS 1, 2, 3: GUIDED CONTEXT SELECTOR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Step 1: Department */}
              <div className="lg:col-span-4 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <span className="text-rose-900 font-bold tabular-nums">01.</span>
                  Select Department
                </label>
                {isHOD && hodDept ? (
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{hodDept.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">Locked</span>
                  </div>
                ) : (
                  <select
                    value={selectedDeptId}
                    onChange={e => handleSelectDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-rose-900 outline-hidden"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Step 2: Class / Year of Study */}
              <div className="lg:col-span-4 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <span className="text-rose-900 font-bold tabular-nums">02.</span>
                  Select Class / Year
                </label>
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {classYearOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectClassYear(opt.value)}
                      className={`flex-1 min-w-[60px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        selectedClassYear === opt.value
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Semester */}
              <div className="lg:col-span-4 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <span className="text-rose-900 font-bold tabular-nums">03.</span>
                  Select Semester
                </label>
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {availableSemesterPills.map(sem => (
                    <button
                      key={String(sem)}
                      type="button"
                      onClick={() => handleSelectSemester(sem)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors tabular-nums ${
                        selectedSemester === sem
                          ? 'bg-white text-rose-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sem === 'ALL' ? 'All Sem' : `Sem ${sem}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scope Summary Metrics Strip */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Active Scope</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                  {activeDeptObj ? activeDeptObj.code : 'All Depts'} ·{' '}
                  {selectedClassYear === 'ALL' ? 'All Years' : `Year ${selectedClassYear}`} ·{' '}
                  {selectedSemester === 'ALL' ? 'All Sem' : `Sem ${selectedSemester}`}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Students in Class</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                  {scopedStudents.length} Students
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Allocated Students</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5 tabular-nums">
                  {scopedAllocatedCount} / {scopedStudents.length} Enrolled
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">Available Courses</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                  {availableCourses.length} Courses ({scopedTotalEnrollments} assignments)
                </p>
              </div>
            </div>
          </div>

          {/* STEPS 4 & 5: SPLIT WORKSPACE (SELECT STUDENTS -> ASSIGN COURSES) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* STEP 4: SELECT STUDENTS */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      04. Select Students
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Check one or multiple students to assign courses together.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-rose-900 tabular-nums">
                    {selectedStudentIds.length} selected
                  </span>
                </div>

                {/* Search + Status Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, roll or reg no..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-rose-900 outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                    {(
                      [
                        { id: 'ALL', label: `All (${scopedStudents.length})` },
                        {
                          id: 'UNALLOCATED',
                          label: `Pending (${scopedStudents.length - scopedAllocatedCount})`
                        },
                        { id: 'ALLOCATED', label: `Done (${scopedAllocatedCount})` }
                      ] as const
                    ).map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStudentAllocFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                          studentAllocFilter === tab.id
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {visibleStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAllVisibleStudents}
                      className="text-[11px] font-semibold text-rose-900 hover:underline flex items-center gap-1"
                    >
                      {allVisibleStudentsSelected ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" /> Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" /> Select All ({visibleStudents.length})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Student Checklist */}
              <div className="divide-y divide-slate-100 max-h-[430px] overflow-y-auto">
                {visibleStudents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    <Users className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No students match this filter</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Adjust the department, class year, or search filter above.
                    </p>
                  </div>
                ) : (
                  visibleStudents.map(stu => {
                    const isChecked = selectedStudentIds.includes(stu.id);
                    const isInspected = activeInspectedStudent?.id === stu.id;
                    const semRegs = getStudentRegs(stu.id, true);
                    const totalRegs = getStudentRegs(stu.id, false);
                    const dept = departments.find(d => d.id === stu.homeDepartmentId);
                    const yr = getStudentYear(stu);

                    return (
                      <div
                        key={stu.id}
                        className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                          isChecked ? 'bg-rose-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <label className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudentSelection(stu.id)}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-rose-900 focus:ring-rose-900 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {stu.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {stu.rollNumber || 'No Roll'} · {stu.universityRegisterNumber || stu.admissionNumber || 'Reg Pending'}
                              {selectedDeptId === 'ALL' && dept ? ` · ${dept.code}` : ''}
                              {` · Year ${yr}, Sem ${stu.currentSemester}`}
                            </p>
                          </div>
                        </label>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[11px] font-semibold tabular-nums ${
                              semRegs.length > 0 ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {selectedSemester === 'ALL'
                              ? `${totalRegs.length} courses`
                              : `${semRegs.length} in S${selectedSemester}`}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setInspectedStudentId(prev => (prev === stu.id ? null : stu.id))
                            }
                            title="Inspect allocated courses"
                            className={`p-1.5 rounded-lg text-xs transition-colors ${
                              isInspected
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inspected Student's Existing Courses Panel */}
              {activeInspectedStudent && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        Assigned to {activeInspectedStudent.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {inspectedStudentRegs.length} total course allocation
                        {inspectedStudentRegs.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    {inspectedStudentId && (
                      <button
                        type="button"
                        onClick={() => setInspectedStudentId(null)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Close
                      </button>
                    )}
                  </div>

                  {inspectedStudentRegs.length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-2">
                      No courses assigned to this student yet.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {inspectedStudentRegs.map(reg => {
                        const off = courseOfferings.find(o => o.id === reg.courseOfferingId);
                        const crs = courses.find(c => c.id === off?.courseId);
                        const cat = courseCategories.find(c => c.id === reg.courseCategoryId);
                        return (
                          <div
                            key={reg.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                <span className="font-mono text-rose-900 mr-1.5">
                                  {crs?.courseCode}
                                </span>
                                {crs?.courseTitle || 'Course'}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Sem {off?.semesterNumber || crs?.defaultSemester || 1} ·{' '}
                                {cat?.name || 'Course'}
                              </p>
                            </div>
                            {canAllocate && (
                              <button
                                type="button"
                                disabled={deletingRegId === reg.id}
                                onClick={() => handleRemoveRegistration(reg.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors shrink-0 disabled:opacity-50"
                                title="Remove Course"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 5: ASSIGN COURSES */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      05. Assign Courses
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pick subjects for{' '}
                      {selectedSemester === 'ALL' ? 'all semesters' : `Semester ${selectedSemester}`}{' '}
                      and click Assign.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectCoreCourses}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition-colors"
                    >
                      Select Dept Courses
                    </button>
                    {selectedCourseKeys.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCourseKeys([])}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2"
                      >
                        Clear ({selectedCourseKeys.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Course Search & Cross-Dept Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search course code or title..."
                      value={courseSearch}
                      onChange={e => setCourseSearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-rose-900 outline-hidden"
                    />
                  </div>

                  <select
                    value={courseCatFilter}
                    onChange={e => setCourseCatFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                  >
                    <option value="ALL">All Categories</option>
                    {courseCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} · {c.name}
                      </option>
                    ))}
                  </select>

                  {selectedDeptId !== 'ALL' && (
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={includeCrossDeptCourses}
                        onChange={e => setIncludeCrossDeptCourses(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-rose-900 focus:ring-rose-900"
                      />
                      Other Dept (MDC / Minor)
                    </label>
                  )}
                </div>
              </div>

              {/* Course Checklist */}
              <div className="divide-y divide-slate-100 max-h-[430px] overflow-y-auto">
                {filteredAvailableCourses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">
                      No courses found for{' '}
                      {selectedSemester === 'ALL'
                        ? 'this department'
                        : `Semester ${selectedSemester}`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Add courses in Course Master or enable "Other Dept (MDC / Minor)" to view
                      electives from other departments.
                    </p>
                  </div>
                ) : (
                  filteredAvailableCourses.map(item => {
                    const isChecked = selectedCourseKeys.includes(item.key);
                    const dept = departments.find(d => d.id === item.departmentId);
                    const selectedCatId =
                      courseCategoryOverrides[item.key] || item.defaultCategoryId;
                    const cat = courseCategories.find(c => c.id === selectedCatId);

                    // Count how many selected students already have this offering
                    const alreadyAssignedCount =
                      selectedStudentIds.length > 0 && item.offeringId
                        ? selectedStudentIds.filter(sid =>
                            studentCourseRegistrations.some(
                              r => r.studentId === sid && r.courseOfferingId === item.offeringId
                            )
                          ).length
                        : 0;
                    const allAlreadyHave =
                      selectedStudentIds.length > 0 &&
                      alreadyAssignedCount === selectedStudentIds.length;

                    return (
                      <div
                        key={item.key}
                        className={`p-3.5 transition-colors ${
                          isChecked ? 'bg-rose-50/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <label className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCourseSelection(item.key)}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-rose-900 focus:ring-rose-900 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="font-mono font-bold text-rose-900">
                                  {item.courseCode}
                                </span>
                                <span className="font-bold text-slate-900">{item.courseTitle}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <span>{cat?.name || 'Course'}</span>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{item.credits} Credits</span>
                                <span aria-hidden="true">·</span>
                                <span>Sem {item.semesterNumber}</span>
                                {dept && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{dept.code}</span>
                                  </>
                                )}
                                {selectedStudentIds.length > 0 && alreadyAssignedCount > 0 && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span
                                      className={
                                        allAlreadyHave
                                          ? 'text-emerald-700 font-semibold'
                                          : 'text-amber-700 font-semibold'
                                      }
                                    >
                                      {allAlreadyHave
                                        ? 'Already assigned to all selected'
                                        : `Assigned to ${alreadyAssignedCount}/${selectedStudentIds.length}`}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </label>

                          {/* Optional Category Role & Cohort Batch Overrides when checked */}
                          {isChecked && (
                            <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0 shrink-0">
                              <select
                                value={selectedCatId}
                                onChange={e =>
                                  setCourseCategoryOverrides(prev => ({
                                    ...prev,
                                    [item.key]: e.target.value
                                  }))
                                }
                                title="Curricular Role"
                                className="text-[11px] px-2 py-1 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                              >
                                {courseCategories.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.code}
                                  </option>
                                ))}
                              </select>

                              {item.groups.length > 1 && (
                                <select
                                  value={courseGroupOverrides[item.key] || item.groups[0].id}
                                  onChange={e =>
                                    setCourseGroupOverrides(prev => ({
                                      ...prev,
                                      [item.key]: e.target.value
                                    }))
                                  }
                                  title="Batch / Group"
                                  className="text-[11px] px-2 py-1 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                                >
                                  {item.groups.map(g => (
                                    <option key={g.id} value={g.id}>
                                      {g.groupName} ({g.room})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  {selectedStudentIds.length === 0 || selectedCourseKeys.length === 0 ? (
                    <span>
                      Select students on the left and courses above to assign.
                    </span>
                  ) : (
                    <span>
                      Ready to create{' '}
                      <strong className="text-slate-900 tabular-nums">
                        {pendingAssignmentSummary.newPairs}
                      </strong>{' '}
                      new enrollment{pendingAssignmentSummary.newPairs === 1 ? '' : 's'}
                      {pendingAssignmentSummary.skippedExisting > 0 && (
                        <span className="text-slate-500">
                          {' '}
                          ({pendingAssignmentSummary.skippedExisting} already assigned)
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    !canAllocate ||
                    isAssigning ||
                    selectedStudentIds.length === 0 ||
                    selectedCourseKeys.length === 0 ||
                    pendingAssignmentSummary.newPairs === 0
                  }
                  onClick={handleAssignSelectedCourses}
                  className="px-5 py-2.5 bg-rose-900 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                  {isAssigning ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Assigning Courses...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>
                        Assign {selectedCourseKeys.length || ''} Course
                        {selectedCourseKeys.length === 1 ? '' : 's'} to{' '}
                        {selectedStudentIds.length || ''} Student
                        {selectedStudentIds.length === 1 ? '' : 's'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MASTER COURSE REGISTRATIONS DIRECTORY (STAFF AUDIT + STUDENT OWN VIEW) */}
      {(isStudent || activeTab === 'all') && (
        <div className="space-y-4">
          {!isStudent && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Categories</option>
                  {courseCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>

                {!isHOD && (
                  <select
                    value={filterDept}
                    onChange={e => setFilterDept(e.target.value)}
                    className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={filterCourse}
                  onChange={e => setFilterCourse(e.target.value)}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 max-w-xs truncate"
                >
                  <option value="ALL">All Course Offerings</option>
                  {courseOfferings.map(o => {
                    const crs = courses.find(c => c.id === o.courseId);
                    return (
                      <option key={o.id} value={o.id}>
                        {crs?.courseCode} - {crs?.courseTitle}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Student, Reg No, or Course..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 bg-white w-64"
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Univ Register Number</th>
                    <th className="py-3.5 px-4">Allocated Course / Subject</th>
                    <th className="py-3.5 px-4">Curricular Role</th>
                    <th className="py-3.5 px-4">Cohort / Room</th>
                    <th className="py-3.5 px-4">Status</th>
                    {!isStudent && canAllocate && <th className="py-3.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No subject allocations found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map(reg => {
                      const student = students.find(s => s.id === reg.studentId);
                      const homeDept = departments.find(d => d.id === student?.homeDepartmentId);
                      const offering = courseOfferings.find(o => o.id === reg.courseOfferingId);
                      const course = courses.find(c => c.id === offering?.courseId);
                      const category = courseCategories.find(cat => cat.id === reg.courseCategoryId);
                      const group = courseGroups.find(g => g.id === reg.courseGroupId);

                      return (
                        <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{student?.fullName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Roll: {student?.rollNumber} · {homeDept?.code} · Sem{' '}
                              {offering?.semesterNumber || student?.currentSemester || 1}
                            </p>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {student?.universityRegisterNumber || student?.admissionNumber || 'N/A'}
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{course?.courseTitle}</p>
                            <p className="text-[11px] text-rose-900 font-mono font-semibold">
                              {course?.courseCode} ({course?.credits} Credits)
                            </p>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-xs font-semibold text-slate-700">
                              {category?.name || 'Course'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-700">
                            {group ? `${group.groupName} (${group.room})` : 'Batch A'}
                          </td>

                          <td className="py-3 px-4">
                            <Badge variant="success" size="sm">
                              {reg.status || 'APPROVED'}
                            </Badge>
                          </td>

                          {!isStudent && canAllocate && (
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                disabled={deletingRegId === reg.id}
                                onClick={() => handleRemoveRegistration(reg.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                title="Remove Allocation"
                              >
                                {deletingRegId === reg.id ? (
                                  <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin inline-block" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
