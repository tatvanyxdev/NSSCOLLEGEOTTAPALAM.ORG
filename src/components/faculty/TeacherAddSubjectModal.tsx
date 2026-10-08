import React, { useState, useMemo } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { CourseType, Course } from '../../types';
import { Modal, Badge } from '../common/UIComponents';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface TeacherAddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TeacherAddSubjectModal: React.FC<TeacherAddSubjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    courses,
    courseCategories,
    departments,
    programmes,
    courseOfferings,
    courseGroups,
    faculty,
    settings,
    submitFacultySubjectRequest,
    facultySubjectRequests
  } = useCollegeData();

  const { user, activeRole } = useAuth();

  // Find logged in faculty member
  const currentFaculty = useMemo(() => {
    return (
      faculty.find(
        f =>
          f.id === user?.id ||
          (f.email && user?.email && f.email.toLowerCase() === user.email.toLowerCase()) ||
          (f.username && user?.name && f.username.toLowerCase() === user.name.toLowerCase())
      ) || null
    );
  }, [faculty, user]);

  const teacherDeptId = currentFaculty?.departmentId || user?.departmentId || departments[0]?.id || '';

  // Form states
  const [courseSelectionMode, setCourseSelectionMode] = useState<'EXISTING' | 'PROVISIONAL'>('EXISTING');
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Course Details
  const [courseName, setCourseName] = useState('');
  const [proposedCourseCode, setProposedCourseCode] = useState('');
  const [courseType, setCourseType] = useState<CourseType>('MAJOR');
  const [departmentId, setDepartmentId] = useState<string>(teacherDeptId);
  const [programmeId, setProgrammeId] = useState<string>('');
  const [semesterNumber, setSemesterNumber] = useState<number>(1);
  const [academicYear, setAcademicYear] = useState<string>(settings.activeAcademicYear || '2026-27');
  const [proposedGroupName, setProposedGroupName] = useState('');
  const [requestNotes, setRequestNotes] = useState('');

  // UI status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSubmitted, setSuccessSubmitted] = useState(false);

  // Filter existing courses matching search
  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) {
      return courses.filter(c => c.departmentId === departmentId || !departmentId).slice(0, 10);
    }
    const q = courseSearch.toLowerCase();
    return courses.filter(
      c =>
        c.courseTitle.toLowerCase().includes(q) ||
        c.courseCode.toLowerCase().includes(q)
    );
  }, [courses, courseSearch, departmentId]);

  // Handle choosing an existing course
  const handleSelectExistingCourse = (course: Course) => {
    setSelectedCourseId(course.id);
    setCourseName(course.courseTitle);
    setProposedCourseCode(course.courseCode);
    setDepartmentId(course.departmentId);
    if (course.defaultSemester) setSemesterNumber(course.defaultSemester);

    // Map category to CourseType
    const cat = courseCategories.find(c => c.id === course.categoryId);
    if (cat) {
      const catCode = cat.code.toUpperCase();
      if (['MAJOR', 'MINOR', 'MDC', 'AEC', 'SEC', 'VAC', 'DSC'].includes(catCode)) {
        setCourseType(catCode as CourseType);
      }
    }
  };

  // Auto-generate preview temporary code if provisional
  const generatedTempCode = useMemo(() => {
    if (courseSelectionMode === 'PROVISIONAL' && !proposedCourseCode) {
      return `TEMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return proposedCourseCode;
  }, [courseSelectionMode, proposedCourseCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCourseName = courseName.trim();
    if (!cleanCourseName) {
      setErrorMessage('Please enter or select the subject name.');
      return;
    }

    if (!departmentId) {
      setErrorMessage('Please select the offering department.');
      return;
    }

    const teacherId = currentFaculty?.id || user?.id || 'demo-teacher';

    // Duplicate check in existing requests
    const isDuplicate = facultySubjectRequests.some(r => {
      const isMe = r.requestedBy === teacherId || r.requestedByFacultyId === teacherId;
      const isPending = r.status === 'PENDING';
      const sameName = r.courseName.trim().toLowerCase() === cleanCourseName.toLowerCase();
      const sameCode =
        proposedCourseCode &&
        r.proposedCourseCode &&
        r.proposedCourseCode.trim().toLowerCase() === proposedCourseCode.trim().toLowerCase();
      return isMe && isPending && (sameName || sameCode);
    });

    if (isDuplicate) {
      setErrorMessage('You already have a pending registration request for this subject awaiting HOD approval.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitFacultySubjectRequest({
        requestedBy: teacherId,
        requestedByFacultyId: teacherId,
        departmentId,
        courseName: cleanCourseName,
        proposedCourseCode: proposedCourseCode.trim() || (courseSelectionMode === 'PROVISIONAL' ? generatedTempCode : undefined),
        courseType,
        programmeId: programmeId || undefined,
        semesterNumber,
        academicYear,
        existingCourseId: courseSelectionMode === 'EXISTING' && selectedCourseId ? selectedCourseId : undefined,
        proposedGroupName: proposedGroupName.trim() || undefined,
        requestNotes: requestNotes.trim() || undefined,
        isProvisional: courseSelectionMode === 'PROVISIONAL'
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to submit subject request.');
        setIsSubmitting(false);
        return;
      }

      setSuccessSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccessSubmitted(false);
    setErrorMessage(null);
    setCourseName('');
    setProposedCourseCode('');
    setSelectedCourseId('');
    setProposedGroupName('');
    setRequestNotes('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Request Teaching Subject Assignment"
      subtitle="Select the subjects you teach for FYUGP HOD review and attendance authorization"
      maxWidth="max-w-2xl"
    >
      {successSubmitted ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Submitted for HOD Approval!</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              Your request for <span className="font-bold text-slate-900">"{courseName}"</span> has been transmitted to the Head of Department. 
              Once reviewed and approved, it will appear in your teaching dashboard and attendance roster.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono">
            Status: <span className="font-bold text-amber-600">PENDING APPROVAL</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode Switcher: Existing vs Provisional */}
          <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCourseSelectionMode('EXISTING');
                setSelectedCourseId('');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                courseSelectionMode === 'EXISTING'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Search Existing Courses
            </button>
            <button
              type="button"
              onClick={() => {
                setCourseSelectionMode('PROVISIONAL');
                setSelectedCourseId('');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                courseSelectionMode === 'PROVISIONAL'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Provisional / New Subject Request
            </button>
          </div>

          {/* Existing Course Selection */}
          {courseSelectionMode === 'EXISTING' && (
            <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700">
                Search College Course Catalog
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by course code or title (e.g. C Programming, MDC, SEC)..."
                  value={courseSearch}
                  onChange={e => setCourseSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {filteredCourses.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {filteredCourses.map(c => {
                    const isSelected = selectedCourseId === c.id;
                    const cat = courseCategories.find(cat => cat.id === c.categoryId);
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectExistingCourse(c)}
                        className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold'
                            : 'hover:bg-white text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[11px] text-blue-700">{c.courseCode}</span>
                            <span className="truncate">{c.courseTitle}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {departments.find(d => d.id === c.departmentId)?.name || 'Department'} • {cat?.name || 'Category'}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">
                  No courses found matching "{courseSearch}". Switch to "Provisional / New Subject Request" to propose a new subject.
                </p>
              )}
            </div>
          )}

          {/* Provisional Info Alert */}
          {courseSelectionMode === 'PROVISIONAL' && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Provisional University Subject:</span> The official University of Calicut course code list is actively being finalized. You can request provisional allocation with a temporary identifier (<span className="font-mono font-bold">{generatedTempCode}</span>). The HOD can map this to the official University code later without losing attendance data.
              </div>
            </div>
          )}

          {/* Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject / Course Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Programming in Python, Principles of Management..."
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Course Code {courseSelectionMode === 'PROVISIONAL' ? '(Optional / Provisional)' : ''}
              </label>
              <input
                type="text"
                placeholder={courseSelectionMode === 'PROVISIONAL' ? generatedTempCode : 'e.g. CS101, MDC101'}
                value={proposedCourseCode}
                onChange={e => setProposedCourseCode(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500/20"
              />
              {courseSelectionMode === 'PROVISIONAL' && !proposedCourseCode && (
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Auto-assigned: <span className="font-mono font-bold text-indigo-700">{generatedTempCode}</span>
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Course Type *
              </label>
              <select
                value={courseType}
                onChange={e => setCourseType(e.target.value as CourseType)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="MAJOR">Major / Core (Discipline Specific)</option>
                <option value="MINOR">Minor Course</option>
                <option value="MDC">MDC (Multidisciplinary Course)</option>
                <option value="AEC">AEC (Ability Enhancement Course)</option>
                <option value="SEC">SEC (Skill Enhancement Course)</option>
                <option value="VAC">VAC (Value Addition Course)</option>
                <option value="DSC">DSC (Discipline Specific Core)</option>
                <option value="OTHER">Other Elective / Foundation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department Offering Subject *
              </label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Programme / Cohort (Optional)
              </label>
              <select
                value={programmeId}
                onChange={e => setProgrammeId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Multi-programme / Open Cohort</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Semester Number *
              </label>
              <select
                value={semesterNumber}
                onChange={e => setSemesterNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Year *
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proposed Course Group / Section Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Batch A, Batch B, Theory 1, Practical Lab 2..."
                value={proposedGroupName}
                onChange={e => setProposedGroupName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Leave blank if this is the entire batch or if HOD will allocate the group.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remarks / Workload Notes for HOD (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Handling 4 hours/week, laboratory sessions, or co-teaching with another faculty member..."
                value={requestNotes}
                onChange={e => setRequestNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit for HOD Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
