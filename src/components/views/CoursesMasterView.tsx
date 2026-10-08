import React, { useState } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Modal, Badge } from '../common/UIComponents';
import { Course, CourseGroup } from '../../types';
import { BookOpen, Plus, Edit2, Layers, Search, Filter, Users, Building, FileSpreadsheet } from 'lucide-react';
import { BulkCourseUploadModal } from '../modals/BulkCourseUploadModal';

export const CoursesMasterView: React.FC = () => {
  const {
    courses,
    courseCategories,
    departments,
    faculty,
    courseOfferings,
    courseGroups,
    addCourse,
    updateCourse,
    addCourseGroup
  } = useCollegeData();

  const { user, activeRole } = useAuth();
  const isHOD = activeRole === 'HOD';
  const currentFaculty = faculty.find(
    f => f.id === user?.id || (user?.email && f.email?.toLowerCase() === user.email.toLowerCase())
  );
  const hodDeptId = isHOD ? (currentFaculty?.departmentId || user?.facultyProfile?.departmentId || (user as any)?.departmentId) : undefined;
  const hodDept = departments.find(d => d.id === hodDeptId);

  const canCreate = can(activeRole, 'courses', 'create');
  const canEdit = can(activeRole, 'courses', 'update');
  const canManageGroups = can(activeRole, 'courses', 'create') || can(activeRole, 'courses', 'update');
  const isStudent = activeRole === 'STUDENT';

  const [filterDept, setFilterDept] = useState<string>(isHOD && hodDeptId ? hodDeptId : 'ALL');
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isBulkCourseUploadOpen, setIsBulkCourseUploadOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);

  // Group creation modal
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [selectedCourseForGroup, setSelectedCourseForGroup] = useState<Course | null>(null);
  const [groupName, setGroupName] = useState('Group A');
  const [groupRoom, setGroupRoom] = useState('Room 101');
  const [groupMaxCapacity, setGroupMaxCapacity] = useState(60);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Course Form
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [categoryId, setCategoryId] = useState(courseCategories[0]?.id || '');
  const [credits, setCredits] = useState(4);
  const [theoryHours, setTheoryHours] = useState(3);
  const [practicalHours, setPracticalHours] = useState(1);
  const [semester, setSemester] = useState(1);

  const filteredCourses = courses.filter(c => {
    const matchesDept = filterDept === 'ALL' || c.departmentId === filterDept;
    const matchesCat = filterCat === 'ALL' || c.categoryId === filterCat;
    const matchesSearch =
      c.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesCat && matchesSearch;
  });

  const handleOpenAddCourse = () => {
    if (!canCreate) return;
    setEditingCourse(null);
    setCourseError(null);
    setCourseCode('');
    setCourseTitle('');
    setDepartmentId(hodDeptId || departments[0]?.id || '');
    setCategoryId(courseCategories[0]?.id || '');
    setCredits(4);
    setTheoryHours(3);
    setPracticalHours(0);
    setSemester(1);
    setIsAddCourseOpen(true);
  };

  const handleOpenEditCourse = (c: Course) => {
    if (!canEdit) return;
    setEditingCourse(c);
    setCourseError(null);
    setCourseCode(c.courseCode);
    setCourseTitle(c.courseTitle);
    setDepartmentId(c.departmentId);
    setCategoryId(c.categoryId);
    setCredits(c.credits);
    setTheoryHours(c.theoryHours);
    setPracticalHours(c.practicalHours);
    setSemester(c.semester);
    setIsAddCourseOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseTitle.trim()) return;
    setCourseError(null);
    setIsSavingCourse(true);

    let res: { success: boolean; error?: string };

    if (editingCourse) {
      if (!canEdit) {
        setIsSavingCourse(false);
        return;
      }
      res = await updateCourse(editingCourse.id, {
        courseCode: courseCode.toUpperCase(),
        courseTitle,
        departmentId,
        categoryId,
        credits: Number(credits),
        theoryHours: Number(theoryHours),
        practicalHours: Number(practicalHours),
        semester: Number(semester)
      });
    } else {
      if (!canCreate) {
        setIsSavingCourse(false);
        return;
      }
      res = await addCourse({
        courseCode: courseCode.toUpperCase(),
        courseTitle,
        departmentId,
        categoryId,
        credits: Number(credits),
        theoryHours: Number(theoryHours),
        practicalHours: Number(practicalHours),
        semester: Number(semester),
        isActive: true
      });
    }

    setIsSavingCourse(false);

    if (!res.success) {
      setCourseError(res.error || 'Failed to save course to Supabase database.');
      return;
    }

    setIsAddCourseOpen(false);
  };

  const handleOpenAddGroup = (c: Course) => {
    if (!canManageGroups) return;
    setSelectedCourseForGroup(c);
    setGroupError(null);
    setGroupName('Group A');
    setGroupRoom('Room 204');
    setGroupMaxCapacity(60);
    setIsAddGroupOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForGroup || !canManageGroups) return;
    setGroupError(null);
    setIsSavingGroup(true);

    // Find or link offering
    const offering = courseOfferings.find(o => o.courseId === selectedCourseForGroup.id);
    const offeringId = offering ? offering.id : `off-${selectedCourseForGroup.id}`;

    const res = await addCourseGroup({
      courseOfferingId: offeringId,
      groupName,
      room: groupRoom,
      maxCapacity: Number(groupMaxCapacity),
      isCrossDepartmental: true
    });

    setIsSavingGroup(false);

    if (!res.success) {
      setGroupError(res.error || 'Failed to save course group to Supabase database.');
      return;
    }

    setIsAddGroupOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* HOD Department Management Banner */}
      {isHOD && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blue-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wider">
              HOD Courses
            </span>
            {hodDept && (
              <span className="text-xs font-bold text-blue-200">
                {hodDept.name} ({hodDept.code})
              </span>
            )}
          </div>
          {canCreate && (
            <button
              onClick={handleOpenAddCourse}
              className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Course
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            Courses
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            {courses.length} Courses
          </span>
          {isHOD && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Department Scope
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
          {activeRole === 'SUPER_ADMIN' && (
            <button
              id="bulk-import-courses-btn"
              onClick={() => setIsBulkCourseUploadOpen(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
          )}

          {canCreate && (
            <button
              id="add-master-course-btn"
              onClick={handleOpenAddCourse}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Department */}
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code}) {hodDeptId && d.id === hodDeptId ? '★ Your Dept' : ''}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All FYUGP Categories</option>
            {courseCategories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search course title / code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 bg-white w-56"
          />
        </div>
      </div>

      {/* Courses Grid / Empty State */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No Courses Found</h3>
            <p className="text-xs text-slate-500 max-w-md">
              {filterDept !== 'ALL'
                ? 'There are no courses listed under this department filter. As an HOD or Administrator, you can add new courses to the curriculum.'
                : 'No courses match your active search or category filters.'}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={handleOpenAddCourse}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add New Course Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map(course => {
          const dept = departments.find(d => d.id === course.departmentId);
          const cat = courseCategories.find(c => c.id === course.categoryId);
          const offering = courseOfferings.find(o => o.courseId === course.id);
          const groups = courseGroups.filter(g => g.courseOfferingId === offering?.id);

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase font-mono"
                    style={{ backgroundColor: cat?.colorHex || '#2563eb' }}
                  >
                    {cat?.code} • {cat?.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Sem {course.semester}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 mt-2.5">{course.courseTitle}</h4>
                <p className="text-xs text-blue-700 font-mono font-bold mt-0.5">{course.courseCode}</p>
                <p className="text-xs text-slate-500 mt-0.5">{dept?.name}</p>

                {/* Credits Pill */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Credits</span>
                    <strong className="text-slate-900">{course.credits}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Theory</span>
                    <strong className="text-slate-900">{course.theoryHours}h/wk</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Lab</span>
                    <strong className="text-slate-900">{course.practicalHours}h/wk</strong>
                  </div>
                </div>

                {/* Groups */}
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Course Groups ({groups.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {groups.map(g => (
                      <span key={g.id} className="bg-blue-50 text-blue-800 border border-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {g.groupName} ({g.room})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {(canManageGroups || canEdit) && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {canManageGroups ? (
                    <button
                      onClick={() => handleOpenAddGroup(course)}
                      className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Group
                    </button>
                  ) : <div />}

                  {canEdit && (
                    <button
                      onClick={() => handleOpenEditCourse(course)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Add / Edit Course Modal */}
      {(canCreate || canEdit) && (
        <Modal
          isOpen={isAddCourseOpen}
          onClose={() => setIsAddCourseOpen(false)}
          title={editingCourse ? 'Edit Course' : 'Create New Course'}
        >
        <form onSubmit={handleSaveCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Course Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
                placeholder="e.g. ECO1MN101"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Parent Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Course Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={courseTitle}
              onChange={e => setCourseTitle(e.target.value)}
              placeholder="e.g. Introductory Microeconomic Analysis"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                FYUGP Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {courseCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Semester</label>
              <select
                value={semester}
                onChange={e => setSemester(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Credits</label>
              <input
                type="number"
                value={credits}
                onChange={e => setCredits(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Theory (h/wk)</label>
              <input
                type="number"
                value={theoryHours}
                onChange={e => setTheoryHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lab/Prac (h/wk)</label>
              <input
                type="number"
                value={practicalHours}
                onChange={e => setPracticalHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          {courseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              <span className="font-bold">Database Error:</span> {courseError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isSavingCourse}
              onClick={() => setIsAddCourseOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingCourse}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-xs flex items-center gap-2"
            >
              {isSavingCourse ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <span>{editingCourse ? 'Update Course' : 'Create Course'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
      )}

      {/* Add Group Modal */}
      {canManageGroups && (
        <Modal
          isOpen={isAddGroupOpen}
          onClose={() => setIsAddGroupOpen(false)}
          title="Add Course Group / Cohort"
          subtitle={`Course: ${selectedCourseForGroup?.courseCode} - ${selectedCourseForGroup?.courseTitle}`}
        >
          <form onSubmit={handleSaveGroup} className="space-y-4">
            {groupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                <span className="font-bold">Database Error:</span> {groupError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Group Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. Group B (Cross-Disciplinary)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Room / Lecture Hall <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={groupRoom}
                  onChange={e => setGroupRoom(e.target.value)}
                  placeholder="e.g. Room 204"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Max Capacity
                </label>
                <input
                  type="number"
                  value={groupMaxCapacity}
                  onChange={e => setGroupMaxCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isSavingGroup}
                onClick={() => setIsAddGroupOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingGroup}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-xs flex items-center gap-2"
              >
                {isSavingGroup ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Creating in Supabase...</span>
                  </>
                ) : (
                  <span>Create Group</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk Course Upload Modal (SuperAdmin only) */}
      <BulkCourseUploadModal
        isOpen={isBulkCourseUploadOpen}
        onClose={() => setIsBulkCourseUploadOpen(false)}
        departments={departments}
        categories={courseCategories}
        isSuperAdmin={activeRole === 'SUPER_ADMIN'}
        onSuccess={() => {
          // Courses list updates via CollegeDataContext automatically
        }}
      />
    </div>
  );
};
