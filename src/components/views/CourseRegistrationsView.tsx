import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Modal, Badge } from '../common/UIComponents';
import {
  BookOpen,
  Plus,
  Users,
  Layers,
  Filter,
  Search,
  CheckCircle2,
  Trash2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FolderPlus,
  Phone,
  Check,
  Building2,
  Download,
  AlertTriangle
} from 'lucide-react';

export const CourseRegistrationsView: React.FC = () => {
  const {
    studentCourseRegistrations,
    students,
    courseOfferings,
    courses,
    courseCategories,
    courseGroups,
    departments,
    registerStudentForCourse,
    removeStudentCourseRegistration,
    bulkRegisterStudents
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
        (s.universityRegisterNumber && user?.name && s.universityRegisterNumber.toLowerCase() === user.name.toLowerCase()) ||
        (user?.email && s.email.toLowerCase() === user.email.toLowerCase())
    ) ||
    null;

  // Allocation permissions: Super Admin, HOD, and Class Tutor
  const canAllocate =
    can(activeRole, 'course_registrations', 'register') ||
    ['SUPER_ADMIN', 'HOD', 'CLASS_TUTOR', 'OFFICE_STAFF'].includes(activeRole);

  // Active View Tab: 'allocator' (Subject Allocator Workflow) or 'all' (Master Registrations Table)
  const [activeTab, setActiveTab] = useState<'allocator' | 'all'>(
    isStudent ? 'all' : 'allocator'
  );

  // --- Allocator State ---
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [allocatorDeptFilter, setAllocatorDeptFilter] = useState<string>(
    activeRole === 'HOD' && user?.departmentId ? user.departmentId : 'ALL'
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    courseCategories[0]?.id || 'cat-major'
  );
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>(
    courseOfferings[0]?.id || ''
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    courseGroups[0]?.id || ''
  );
  const [allocMessage, setAllocMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isAllocating, setIsAllocating] = useState(false);
  const [isAutoAllocating, setIsAutoAllocating] = useState(false);
  const [deletingRegId, setDeletingRegId] = useState<string | null>(null);

  // --- Master Table State ---
  const [filterCourse, setFilterCourse] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get active selected student object
  const activeStudent = isStudent
    ? currentStudent
    : students.find(s => s.id === selectedStudentId) || students[0];

  // Current registrations for the active student
  const activeStudentRegistrations = studentCourseRegistrations.filter(
    r => r.studentId === activeStudent?.id
  );

  // Available students for the dropdown (filtered by department if selected)
  const selectableStudents = students.filter(s => {
    if (allocatorDeptFilter === 'ALL') return true;
    return s.homeDepartmentId === allocatorDeptFilter;
  });

  // Offerings matching selected category
  const relevantOfferings = courseOfferings.filter(offering => {
    if (!selectedCategoryId) return true;
    // Show all offerings or prioritize category
    return true;
  });

  // Groups matching selected offering
  const relevantGroups = courseGroups.filter(
    g => g.courseOfferingId === selectedOfferingId
  );

  // Master filtered list
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
      (student?.universityRegisterNumber && student.universityRegisterNumber.toLowerCase() === q || student?.universityRegisterNumber?.toLowerCase().includes(q)) ||
      (course?.courseTitle && course.courseTitle.toLowerCase().includes(q)) ||
      (course?.courseCode && course.courseCode.toLowerCase().includes(q));

    return matchesCourse && matchesCat && matchesDept && matchesSearch;
  });

  // Allocate Subject Handler - CONFIRMED WRITE
  const handleAllocateSubject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAllocMessage(null);

    if (!activeStudent) {
      setAllocMessage({ type: 'error', text: 'Please select a student first.' });
      return;
    }
    if (!selectedOfferingId) {
      setAllocMessage({ type: 'error', text: 'Please select a course offering.' });
      return;
    }

    // Default to first group if not selected
    const groupId = selectedGroupId || relevantGroups[0]?.id || courseGroups[0]?.id;
    if (!groupId) {
      setAllocMessage({ type: 'error', text: 'No course group available for this offering.' });
      return;
    }

    // Check if already registered
    const exists = studentCourseRegistrations.some(
      r => r.studentId === activeStudent.id && r.courseOfferingId === selectedOfferingId
    );

    if (exists) {
      setAllocMessage({
        type: 'error',
        text: 'This student is already registered for this course offering.'
      });
      return;
    }

    setIsAllocating(true);
    const chosenOffering = courseOfferings.find(o => o.id === selectedOfferingId);
    const chosenCourse = courses.find(c => c.id === chosenOffering?.courseId);

    const res = await registerStudentForCourse({
      studentId: activeStudent.id,
      courseOfferingId: selectedOfferingId,
      courseGroupId: groupId,
      courseCategoryId: selectedCategoryId,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'APPROVED'
    });

    setIsAllocating(false);

    if (!res.success) {
      setAllocMessage({
        type: 'error',
        text: res.error || 'Database transaction failed. Allocation was not saved to Supabase.'
      });
      return;
    }

    setAllocMessage({
      type: 'success',
      text: `Supabase confirmed: Successfully allocated '${chosenCourse?.courseTitle || 'Course'}' to ${activeStudent.fullName}!`
    });

    setTimeout(() => setAllocMessage(null), 5000);
  };

  // Auto-allocate Semester 1 Basket - CONFIRMED WRITE
  const handleAutoAllocateBasket = async () => {
    if (!activeStudent) return;
    setAllocMessage(null);

    // Filter available offerings for Semester 1
    const available = courseOfferings.slice(0, 4);
    const newRegs: Omit<typeof studentCourseRegistrations[0], 'id'>[] = [];

    available.forEach((off, idx) => {
      const already = studentCourseRegistrations.some(
        r => r.studentId === activeStudent.id && r.courseOfferingId === off.id
      );
      if (!already) {
        const cat =
          idx === 0
            ? 'cat-major'
            : idx === 1
            ? 'cat-minor'
            : idx === 2
            ? 'cat-mdc'
            : 'cat-aec';
        const grp = courseGroups.find(g => g.courseOfferingId === off.id) || courseGroups[0];
        if (grp) {
          newRegs.push({
            studentId: activeStudent.id,
            courseOfferingId: off.id,
            courseGroupId: grp.id,
            courseCategoryId: cat,
            registrationDate: new Date().toISOString().split('T')[0],
            status: 'APPROVED'
          });
        }
      }
    });

    if (newRegs.length === 0) {
      setAllocMessage({
        type: 'error',
        text: 'Student already has all recommended Semester 1 courses allocated.'
      });
      return;
    }

    setIsAutoAllocating(true);
    const res = await bulkRegisterStudents(newRegs);
    setIsAutoAllocating(false);

    if (!res.success) {
      setAllocMessage({
        type: 'error',
        text: res.error || 'Failed to persist bulk course allocations to Supabase.'
      });
      return;
    }

    setAllocMessage({
      type: 'success',
      text: `Supabase confirmed: Auto-allocated ${newRegs.length} FYUGP subjects (Major, Minor, MDC, AEC) to ${activeStudent.fullName}!`
    });
    setTimeout(() => setAllocMessage(null), 5000);
  };

  const handleRemoveRegistration = async (id: string) => {
    setDeletingRegId(id);
    const res = await removeStudentCourseRegistration(id);
    setDeletingRegId(null);
    if (!res.success) {
      setAllocMessage({
        type: 'error',
        text: res.error || 'Failed to remove registration from Supabase database.'
      });
      setTimeout(() => setAllocMessage(null), 5000);
    }
  };

  const handleOfferingChange = (offId: string) => {
    setSelectedOfferingId(offId);
    const groups = courseGroups.filter(g => g.courseOfferingId === offId);
    if (groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  };

  if (isStudent && !currentStudent) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-xs">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Student Profile Linked</h3>
        <p className="text-xs text-slate-500 mt-2">
          No matching student profile was found for your account. Please log in with your valid University Register Number and password.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-900 text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900">
              {isStudent ? 'My Course Allocations' : 'Course Allocations'}
            </h2>
          </div>
        </div>

        {/* View Switchers for Staff/Admin/HOD */}
        {!isStudent && (
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('allocator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'allocator'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Subject Allocator
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> All Allocations ({studentCourseRegistrations.length})
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1: INTERACTIVE SUBJECT ALLOCATOR */}
      {!isStudent && activeTab === 'allocator' && (
        <div className="space-y-6">
          {/* Status Message Notification */}
          {allocMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                allocMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              {allocMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{allocMessage.text}</span>
            </div>
          )}

          {/* Student Selector Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Step 1: Select Enrolled Student for Course Allocation
                </h3>
              </div>

              {/* Department filter for student selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Filter Dept:</span>
                <select
                  value={allocatorDeptFilter}
                  onChange={e => setAllocatorDeptFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Dropdown Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Choose Student from Enrolled Master List
                </label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-rose-900"
                >
                  {selectableStudents.map(s => {
                    const d = departments.find(dept => dept.id === s.homeDepartmentId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.fullName} — [Univ Reg: {s.universityRegisterNumber || s.admissionNumber}] — Roll: {s.rollNumber} ({d?.code || 'DEPT'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2 md:pt-6">
                <button
                  type="button"
                  disabled={isAutoAllocating}
                  onClick={handleAutoAllocateBasket}
                  className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isAutoAllocating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Auto-Allocate Sem 1 Basket
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Selected Student Information Card */}
            {activeStudent && (
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-3.5">
                  <img
                    src={
                      activeStudent.profilePhotoUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={activeStudent.fullName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{activeStudent.fullName}</h4>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        Year {activeStudent.yearOfStudy || Math.ceil(activeStudent.currentSemester / 2)} • Sem {activeStudent.currentSemester}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Univ Reg No:{' '}
                      <strong className="text-slate-800">
                        {activeStudent.universityRegisterNumber || 'Pending'}
                      </strong>{' '}
                      • Roll: {activeStudent.rollNumber} • Mobile:{' '}
                      {activeStudent.mobileNumber || activeStudent.phoneNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                    Allocated Subjects: <strong className="text-rose-900">{activeStudentRegistrations.length}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Current Allocations vs Allocate Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Current Allocated Subjects for this Student */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-rose-900" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Allocated Subjects for {activeStudent?.fullName || 'Student'}
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {activeStudentRegistrations.length} Courses
                </span>
              </div>

              {activeStudentRegistrations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No courses allocated yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Use the allocation panel on the right or click "Auto-Allocate Sem 1 Basket" to assign Major & Minor courses.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeStudentRegistrations.map(reg => {
                    const offering = courseOfferings.find(o => o.id === reg.courseOfferingId);
                    const course = courses.find(c => c.id === offering?.courseId);
                    const category = courseCategories.find(c => c.id === reg.courseCategoryId);
                    const group = courseGroups.find(g => g.id === reg.courseGroupId);

                    const isMajor = reg.courseCategoryId === 'cat-major';
                    const isMinor = reg.courseCategoryId === 'cat-minor';
                    const isMdc = reg.courseCategoryId === 'cat-mdc';

                    const badgeClass = isMajor
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : isMinor
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : isMdc
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                    return (
                      <div
                        key={reg.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-3 bg-white shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}
                            >
                              {category?.name || 'Curricular Course'}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {course?.courseCode}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">• {course?.credits || 3} Credits</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {course?.courseTitle || 'Subject Title'}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Cohort: <strong className="text-slate-700">{group?.groupName || 'Batch A'}</strong> ({group?.room || 'Lecture Hall'})
                          </p>
                        </div>

                        {canAllocate && (
                          <button
                            disabled={deletingRegId === reg.id}
                            onClick={() => handleRemoveRegistration(reg.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                            title="Remove Course Allocation"
                          >
                            {deletingRegId === reg.id ? (
                              <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Allocate Subject via Dropdowns */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FolderPlus className="w-5 h-5 text-rose-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Step 2: Allocate Subject by Dropdown
                </h3>
              </div>

              <form onSubmit={handleAllocateSubject} className="space-y-4 text-xs">
                {/* Dropdown 1: Course Category (Major, Minor, MDC, AEC, SEC) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    1. Course Role / Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={e => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-rose-900"
                  >
                    {courseCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown 2: Subject / Course Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    2. Choose Subject / Course <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedOfferingId}
                    onChange={e => handleOfferingChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-rose-900"
                  >
                    {courseOfferings.map(o => {
                      const crs = courses.find(c => c.id === o.courseId);
                      const dept = departments.find(d => d.id === o.departmentId);
                      return (
                        <option key={o.id} value={o.id}>
                          {crs?.courseCode} — {crs?.courseTitle} ({crs?.credits} cr • {dept?.code})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Dropdown 3: Group / Cohort Batch */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    3. Cohort Group / Classroom <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={e => setSelectedGroupId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-rose-900"
                  >
                    {relevantGroups.length > 0 ? (
                      relevantGroups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.groupName} — Room: {g.room} (Capacity: {g.capacity})
                        </option>
                      ))
                    ) : (
                      <option value={courseGroups[0]?.id}>
                        {courseGroups[0]?.groupName} (Room: {courseGroups[0]?.room})
                      </option>
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!canAllocate || isAllocating}
                  className="w-full py-3 px-4 bg-rose-900 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-900/20 transition-all mt-2"
                >
                  {isAllocating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Allocate Subject to {activeStudent?.fullName.split(' ')[0] || 'Student'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MASTER COURSE REGISTRATIONS DIRECTORY */}
      {(isStudent || activeTab === 'all') && (
        <div className="space-y-4">
          {/* Master Filter Toolbar */}
          {!isStudent && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
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

          {/* Master Allocations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
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
                          {/* Student */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{student?.fullName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Roll: {student?.rollNumber} • {homeDept?.code}
                            </p>
                          </td>

                          {/* University Register Number */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                              {student?.universityRegisterNumber || student?.admissionNumber || 'N/A'}
                            </span>
                          </td>

                          {/* Course Title & Code */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{course?.courseTitle}</p>
                            <p className="text-[11px] text-rose-900 font-mono font-semibold">
                              {course?.courseCode} ({course?.credits} Credits)
                            </p>
                          </td>

                          {/* Curricular Role */}
                          <td className="py-3 px-4">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase font-mono"
                              style={{ backgroundColor: category?.colorHex || '#9f1239' }}
                            >
                              {category?.name}
                            </span>
                          </td>

                          {/* Group / Room */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                              {group?.groupName} ({group?.room})
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <Badge variant="success" size="sm">
                              {reg.status}
                            </Badge>
                          </td>

                          {/* Actions */}
                          {!isStudent && canAllocate && (
                            <td className="py-3 px-4 text-right">
                              <button
                                disabled={deletingRegId === reg.id}
                                onClick={() => handleRemoveRegistration(reg.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                title="Remove Allocation"
                              >
                                {deletingRegId === reg.id ? (
                                  <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin inline-block"></span>
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
