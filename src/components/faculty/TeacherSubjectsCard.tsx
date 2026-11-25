import React, { useState, useMemo } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { TeacherAddSubjectModal } from './TeacherAddSubjectModal';
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  CalendarCheck,
  MessageSquare
} from 'lucide-react';

interface TeacherSubjectsCardProps {
  onNavigateToAttendance?: () => void;
  onMarkSubject?: (courseOfferingId: string, courseGroupId: string) => void;
}

export const TeacherSubjectsCard: React.FC<TeacherSubjectsCardProps> = ({
  onNavigateToAttendance,
  onMarkSubject
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

  const pendingRequests = useMemo(() => {
    if (!teacherId) return [];
    return facultySubjectRequests.filter(
      r => (r.requestedBy === teacherId || r.requestedByFacultyId === teacherId) && r.status === 'PENDING'
    );
  }, [teacherId, facultySubjectRequests]);

  const rejectedOrChangedRequests = useMemo(() => {
    if (!teacherId) return [];
    return facultySubjectRequests.filter(
      r =>
        (r.requestedBy === teacherId || r.requestedByFacultyId === teacherId) &&
        (r.status === 'REJECTED' || r.status === 'NEEDS_CHANGES' || r.status === 'RETURNED')
    );
  }, [teacherId, facultySubjectRequests]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Compact Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <BookOpen className="w-4 h-4 text-slate-600 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">My Teaching Subjects</h3>
            <p className="text-xs text-slate-500">
              <span className="tabular-nums">{approvedAssignments.length} assigned</span>
              {pendingRequests.length > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="text-amber-700 font-medium tabular-nums">
                    {pendingRequests.length} pending review
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Filter Tabs */}
      {(pendingRequests.length > 0 || rejectedOrChangedRequests.length > 0) && (
        <div className="px-4 pt-2 flex items-center gap-2 border-b border-slate-100 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('APPROVED')}
            className={`pb-2 px-2 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'APPROVED'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved ({approvedAssignments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`pb-2 px-2 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'PENDING'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingRequests.length})</span>
          </button>

          {rejectedOrChangedRequests.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('REJECTED')}
              className={`pb-2 px-2 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'REJECTED'
                  ? 'border-rose-600 text-rose-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Returned ({rejectedOrChangedRequests.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Content Section */}
      <div>
        {activeTab === 'APPROVED' && (
          <div>
            {approvedAssignments.length === 0 ? (
              <div className="text-center py-6 px-4">
                <p className="text-xs font-semibold text-slate-700">No subjects assigned yet.</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">
                  Request your teaching courses so you can take attendance directly from the dashboard.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Request Subject</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {approvedAssignments.map(({ assignment, group, offering, course, category, studentCount }) => {
                  const courseType = category?.code || 'MAJOR';

                  return (
                    <div
                      key={assignment.id}
                      className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {course?.courseCode || 'N/A'}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                            {course?.courseTitle || 'Course Title'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>{category?.name || courseType}</span>
                          <span aria-hidden="true">·</span>
                          <span>{group?.groupName || 'Batch A'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{group?.room || 'LH-101'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Users className="w-3 h-3" />
                            {studentCount} students
                          </span>
                        </p>
                      </div>

                      {(onMarkSubject || onNavigateToAttendance) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onMarkSubject && offering?.id && group?.id) {
                              onMarkSubject(offering.id, group.id);
                            } else if (onNavigateToAttendance) {
                              onNavigateToAttendance();
                            }
                          }}
                          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>Mark</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'PENDING' && (
          <div className="divide-y divide-slate-100">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-6 px-4 text-xs text-slate-500">
                No pending subject requests.
              </div>
            ) : (
              pendingRequests.map(req => {
                const dept = departments.find(d => d.id === req.departmentId);
                return (
                  <div key={req.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">{req.courseName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {req.courseType} · Sem {req.semesterNumber} · {dept?.name || 'Department'}
                        {req.proposedGroupName ? ` · ${req.proposedGroupName}` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 whitespace-nowrap shrink-0">
                      Pending HOD
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'REJECTED' && (
          <div className="divide-y divide-slate-100">
            {rejectedOrChangedRequests.length === 0 ? (
              <div className="text-center py-6 px-4 text-xs text-slate-500">
                No returned requests.
              </div>
            ) : (
              rejectedOrChangedRequests.map(req => {
                const isNeedsChanges = req.status === 'NEEDS_CHANGES' || req.status === 'RETURNED';
                return (
                  <div key={req.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">{req.courseName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {req.courseType} · Sem {req.semesterNumber} · AY {req.academicYear}
                      </p>
                      {req.reviewNotes && (
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 shrink-0" />
                          <span>{req.reviewNotes}</span>
                        </p>
                      )}
                    </div>
                    <span className={`text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 ${isNeedsChanges ? 'text-amber-700' : 'text-rose-700'}`}>
                      {isNeedsChanges ? <AlertTriangle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {isNeedsChanges ? 'Needs Changes' : 'Rejected'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <TeacherAddSubjectModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};
