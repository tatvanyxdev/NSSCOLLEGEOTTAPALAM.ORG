import React, { useState, useMemo } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { TeacherAddSubjectModal } from './TeacherAddSubjectModal';
import { Badge } from '../common/UIComponents';
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Calendar,
  Users,
  CalendarCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface TeacherSubjectsCardProps {
  onNavigateToAttendance?: () => void;
}

export const TeacherSubjectsCard: React.FC<TeacherSubjectsCardProps> = ({
  onNavigateToAttendance
}) => {
  const {
    faculty,
    facultyAssignments,
    facultySubjectRequests,
    courses,
    courseOfferings,
    courseGroups,
    courseCategories,
    departments,
    studentCourseRegistrations
  } = useCollegeData();

  const { user } = useAuth();

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

  const teacherId = currentFaculty?.id || user?.id || '';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'APPROVED' | 'PENDING' | 'REJECTED'>('APPROVED');

  // 1. Approved teaching subjects (active assignments from facultyAssignments)
  const approvedAssignments = useMemo(() => {
    if (!teacherId) return [];
    const myAssignments = facultyAssignments.filter(
      fa => fa.facultyId === teacherId && fa.isActive !== false
    );

    return myAssignments.map(fa => {
      const group = courseGroups.find(g => g.id === fa.courseGroupId);
      const offering = courseOfferings.find(
        o => o.id === fa.courseOfferingId || o.id === group?.courseOfferingId
      );
      const course = courses.find(c => c.id === offering?.courseId);
      const category = courseCategories.find(cat => cat.id === course?.categoryId);
      const dept = departments.find(d => d.id === course?.departmentId);

      // Student count registered in this specific group
      const studentCount = studentCourseRegistrations.filter(
        r => r.courseGroupId === fa.courseGroupId && (r.status === 'APPROVED' || r.registrationStatus === 'APPROVED')
      ).length;

      return {
        assignment: fa,
        group,
        offering,
        course,
        category,
        dept,
        studentCount
      };
    });
  }, [teacherId, facultyAssignments, courseGroups, courseOfferings, courses, courseCategories, departments, studentCourseRegistrations]);

  // 2. Pending Requests
  const pendingRequests = useMemo(() => {
    if (!teacherId) return [];
    return facultySubjectRequests.filter(
      r => (r.requestedBy === teacherId || r.requestedByFacultyId === teacherId) && r.status === 'PENDING'
    );
  }, [teacherId, facultySubjectRequests]);

  // 3. Rejected or Needs Changes Requests
  const rejectedOrChangedRequests = useMemo(() => {
    if (!teacherId) return [];
    return facultySubjectRequests.filter(
      r =>
        (r.requestedBy === teacherId || r.requestedByFacultyId === teacherId) &&
        (r.status === 'REJECTED' || r.status === 'NEEDS_CHANGES' || r.status === 'RETURNED')
    );
  }, [teacherId, facultySubjectRequests]);

  const getCourseTypeColor = (type?: string) => {
    switch (type) {
      case 'MAJOR':
      case 'DSC':
        return 'bg-blue-600 text-white';
      case 'MINOR':
        return 'bg-indigo-600 text-white';
      case 'MDC':
        return 'bg-purple-600 text-white';
      case 'AEC':
        return 'bg-amber-600 text-white';
      case 'SEC':
        return 'bg-emerald-600 text-white';
      case 'VAC':
        return 'bg-teal-600 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 via-white to-blue-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                My Teaching Subjects
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {approvedAssignments.length} Allocated
              </span>
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                  {pendingRequests.length} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Registered FYUGP course offerings, approved attendance batches & HOD allocation queue
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all shrink-0 min-h-[38px]"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pt-3 flex items-center gap-2 border-b border-slate-100 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('APPROVED')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'APPROVED'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved Subjects ({approvedAssignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'PENDING'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Approval ({pendingRequests.length})</span>
        </button>

        {rejectedOrChangedRequests.length > 0 && (
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'REJECTED'
                ? 'border-rose-500 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Changes / Rejected ({rejectedOrChangedRequests.length})</span>
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5">
        {/* TAB 1: APPROVED SUBJECTS */}
        {activeTab === 'APPROVED' && (
          <div>
            {approvedAssignments.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Approved Subjects Assigned Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  You do not have any authorized subjects assigned for attendance marking. Request the subjects you teach by tapping the button below.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Request Teaching Subject
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {approvedAssignments.map(({ assignment, group, offering, course, category, dept, studentCount }) => {
                  const courseType = category?.code || 'MAJOR';
                  const isProvisional = course?.courseCode?.startsWith('TEMP-');

                  return (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-xl border border-slate-200/90 hover:border-blue-300 bg-white hover:shadow-xs transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getCourseTypeColor(
                              courseType
                            )}`}
                          >
                            {category?.name || courseType}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {course?.courseCode || 'N/A'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                            {course?.courseTitle || 'Course Title'}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-2">
                            <span>{group?.groupName || 'Batch A'}</span>
                            <span>• Room: {group?.room || 'LH-101'}</span>
                          </p>
                        </div>

                        {isProvisional && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                            <Sparkles className="w-3 h-3 text-amber-600" /> Provisional Subject
                          </div>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{studentCount} Students</span>
                        </div>

                        {onNavigateToAttendance && (
                          <button
                            onClick={onNavigateToAttendance}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 text-xs font-bold transition-colors"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span>Mark Attendance</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PENDING APPROVAL */}
        {activeTab === 'PENDING' && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No Pending Requests</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                  All your submitted subject requests have been reviewed by the Department Head.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    These subject requests are awaiting review by your Head of Department. 
                    They do <strong className="font-bold">not</strong> grant attendance access until authorized.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {pendingRequests.map(req => {
                    const dept = departments.find(d => d.id === req.departmentId);

                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl border border-amber-200/90 bg-amber-50/30 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getCourseTypeColor(
                                req.courseType
                              )}`}
                            >
                              {req.courseType}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending HOD Review
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{req.courseName}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                              Code: {req.proposedCourseCode || 'Provisional'} • Sem {req.semesterNumber} • AY {req.academicYear}
                            </p>
                            <p className="text-[11px] text-slate-600 font-medium mt-1">
                              Dept: {dept?.name || 'Department'} {req.proposedGroupName ? `• Proposed Group: ${req.proposedGroupName}` : ''}
                            </p>
                          </div>

                          {req.requestNotes && (
                            <p className="text-xs text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200/60 italic">
                              "{req.requestNotes}"
                            </p>
                          )}
                        </div>

                        <div className="pt-2.5 mt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                          <span className="font-bold text-amber-700">Awaiting Approval</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REJECTED OR RETURNED */}
        {activeTab === 'REJECTED' && (
          <div>
            {rejectedOrChangedRequests.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No Rejected or Returned Requests</h4>
                <p className="text-[11px] text-slate-500">Your requests are in good standing.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {rejectedOrChangedRequests.map(req => {
                  const isNeedsChanges = req.status === 'NEEDS_CHANGES' || req.status === 'RETURNED';

                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between ${
                        isNeedsChanges
                          ? 'border-orange-200 bg-orange-50/30'
                          : 'border-rose-200 bg-rose-50/30'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getCourseTypeColor(
                              req.courseType
                            )}`}
                          >
                            {req.courseType}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                              isNeedsChanges
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}
                          >
                            {isNeedsChanges ? (
                              <>
                                <AlertTriangle className="w-3 h-3" /> Needs Changes
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Rejected
                              </>
                            )}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{req.courseName}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Sem {req.semesterNumber} • AY {req.academicYear}
                          </p>
                        </div>

                        {req.reviewNotes && (
                          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                            <span className="font-bold text-slate-900 block flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                              HOD Review Notes:
                            </span>
                            <p className="text-slate-600">{req.reviewNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Reviewed: {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : 'Recently'}
                        </span>
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors"
                        >
                          Submit New Request
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal to add / request teaching subject */}
      {isAddModalOpen && (
        <TeacherAddSubjectModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};
