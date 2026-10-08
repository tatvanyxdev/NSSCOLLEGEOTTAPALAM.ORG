import React, { useState, useEffect } from 'react';
import { useCollegeData } from '../../contexts/CollegeDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { can } from '../../config/permissions';
import { Badge } from '../common/UIComponents';
import { CollegeLogo } from '../common/CollegeLogo';
import {
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Users,
  CalendarCheck,
  Building,
  Filter,
  CheckCircle,
  Clock,
  History
} from 'lucide-react';

export const ReportsCenterView: React.FC = () => {
  const {
    students,
    departments,
    programmes,
    getStudentAttendanceSummary,
    exportAttendanceReportToCsv,
    settings,
    auditLogs,
    faculty,
    classSessions,
    attendanceRecords,
    courses,
    courseOfferings,
    courseGroups,
    timetablePeriods
  } = useCollegeData();

  const { user, activeRole } = useAuth();
  const canExport = can(activeRole, 'reports', 'export_csv');
  const canViewAudit = can(activeRole, 'audit_logs', 'read');
  const canReadCollege = can(activeRole, 'reports', 'read_college');

  const currentFaculty = faculty.find(f => f.id === user?.id || f.email === user?.email);
  const hodDeptId = activeRole === 'HOD' ? currentFaculty?.departmentId : undefined;

  const [activeTab, setActiveTab] = useState<'SHORTAGE' | 'WARNING' | 'ALL' | 'AUDIT'>('SHORTAGE');
  const [selectedDept, setSelectedDept] = useState<string>(hodDeptId || 'ALL');
  const [exported, setExported] = useState<boolean>(false);

  useEffect(() => {
    if (!canViewAudit && activeTab === 'AUDIT') {
      setActiveTab('SHORTAGE');
    }
  }, [canViewAudit, activeTab]);

  useEffect(() => {
    if (!canReadCollege && hodDeptId) {
      setSelectedDept(hodDeptId);
    }
  }, [canReadCollege, hodDeptId]);

  // Compute student summaries
  const studentReports = students.map(s => {
    const dept = departments.find(d => d.id === s.homeDepartmentId);
    const prog = programmes.find(p => p.id === s.programmeId);
    const summary = getStudentAttendanceSummary(s.id);
    return {
      student: s,
      dept,
      prog,
      summary
    };
  });

  const filteredReports = studentReports.filter(r => {
    const matchesDept = selectedDept === 'ALL' || r.student.homeDepartmentId === selectedDept;
    if (!matchesDept) return false;

    if (activeTab === 'SHORTAGE') return r.summary.isShortage;
    if (activeTab === 'WARNING') return r.summary.isWarning;
    return true;
  });

  const shortageCount = studentReports.filter(r => r.summary.isShortage).length;
  const warningCount = studentReports.filter(r => r.summary.isWarning).length;

  // Export CSV download of current attendance logs for administrative review
  const exportCurrentAttendanceLogs = () => {
    const deptObj = departments.find(d => d.id === selectedDept);
    const deptSuffix = deptObj ? `_${deptObj.code}` : selectedDept === 'ALL' ? '_All_Depts' : '';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `NSS_College_Attendance_Logs_Admin_Review${deptSuffix}_${dateStr}.csv`;

    const headers = [
      'Log ID',
      'Date',
      'Time Period',
      'Department',
      'Programme',
      'Course Code',
      'Course Title',
      'Course Category',
      'Batch / Group',
      'Student Roll No',
      'Admission No',
      'University Reg No',
      'Student Full Name',
      'Attendance Status',
      'Faculty / Instructor',
      'Employee Code',
      'Topic Covered',
      'Session Type',
      'Remarks',
      'Marked At (UTC)'
    ];

    const sessionMap = new Map<string, (typeof classSessions)[number]>();
    classSessions.forEach(s => sessionMap.set(s.id, s));

    const studentMap = new Map<string, (typeof students)[number]>();
    students.forEach(s => studentMap.set(s.id, s));

    const facultyMap = new Map<string, (typeof faculty)[number]>();
    faculty.forEach(f => facultyMap.set(f.id, f));

    const offeringMap = new Map<string, (typeof courseOfferings)[number]>();
    courseOfferings.forEach(o => offeringMap.set(o.id, o));

    const courseMap = new Map<string, (typeof courses)[number]>();
    courses.forEach(c => courseMap.set(c.id, c));

    const groupMap = new Map<string, (typeof courseGroups)[number]>();
    courseGroups.forEach(g => groupMap.set(g.id, g));

    const deptMap = new Map<string, (typeof departments)[number]>();
    departments.forEach(d => deptMap.set(d.id, d));

    const progMap = new Map<string, (typeof programmes)[number]>();
    programmes.forEach(p => progMap.set(p.id, p));

    const periodMap = new Map<string, (typeof timetablePeriods)[number]>();
    timetablePeriods.forEach(tp => periodMap.set(tp.id, tp));

    const escape = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows: string[][] = [];

    // 1. Individual session attendance records
    if (attendanceRecords && attendanceRecords.length > 0) {
      attendanceRecords.forEach(rec => {
        const session = sessionMap.get(rec.classSessionId);
        const student = studentMap.get(rec.studentId);
        if (!student) return;

        const studentDept = student.homeDepartmentId ? deptMap.get(student.homeDepartmentId) : undefined;
        const offering = session?.courseOfferingId ? offeringMap.get(session.courseOfferingId) : undefined;
        const offeringDept = offering?.offeringDepartmentId ? deptMap.get(offering.offeringDepartmentId) : undefined;

        // Filter by selected department if not 'ALL'
        if (selectedDept !== 'ALL') {
          if (student.homeDepartmentId !== selectedDept && offering?.offeringDepartmentId !== selectedDept) {
            return;
          }
        }

        const course = offering?.courseId ? courseMap.get(offering.courseId) : undefined;
        const group = session?.courseGroupId ? groupMap.get(session.courseGroupId) : undefined;
        const marker = rec.markedByFacultyId ? facultyMap.get(rec.markedByFacultyId) : undefined;
        const sessionFaculty = session?.facultyId ? facultyMap.get(session.facultyId) : undefined;
        const effectiveFaculty = marker || sessionFaculty;
        const prog = student.programmeId ? progMap.get(student.programmeId) : undefined;
        const period = session?.periodId ? periodMap.get(session.periodId) : undefined;

        const periodLabel = period
          ? `${period.label} (${period.startTime || ''} - ${period.endTime || ''})`
          : session?.startTime
          ? `${session.startTime} - ${session.endTime}`
          : 'Regular Period';

        rows.push([
          escape(rec.id),
          escape(session?.date || dateStr),
          escape(periodLabel),
          escape(studentDept?.name || offeringDept?.name || 'Department'),
          escape(prog?.name || 'Undergraduate Programme'),
          escape(course?.courseCode || 'CORE'),
          escape(course?.courseTitle || 'FYUGP Course'),
          escape(course?.category || 'MAJOR'),
          escape(group?.name || 'Main Batch'),
          escape(student.rollNumber),
          escape(student.admissionNumber),
          escape(student.universityRegNo || 'Pending'),
          escape(student.fullName),
          escape(rec.status),
          escape(effectiveFaculty?.fullName || 'Assigned Faculty'),
          escape(effectiveFaculty?.employeeId || 'N/A'),
          escape(session?.topicCovered || 'Regular Syllabus Lecture'),
          escape(session?.sessionType || 'REGULAR'),
          escape(rec.remarks || ''),
          escape(rec.markedTimestamp ? new Date(rec.markedTimestamp).toISOString() : new Date().toISOString())
        ]);
      });
    }

    // 2. Fallback to student course summaries if no raw session records matched filter
    if (rows.length === 0) {
      students.forEach(stu => {
        if (selectedDept !== 'ALL' && stu.homeDepartmentId !== selectedDept) return;
        const dept = stu.homeDepartmentId ? deptMap.get(stu.homeDepartmentId) : undefined;
        const prog = stu.programmeId ? progMap.get(stu.programmeId) : undefined;
        const summary = getStudentAttendanceSummary(stu.id);

        summary.courses.forEach(crs => {
          rows.push([
            escape(`LOG-${stu.id}-${crs.courseCode}`),
            escape(dateStr),
            escape('Aggregate Semester Period'),
            escape(dept?.name || 'Department'),
            escape(prog?.name || 'Undergraduate Programme'),
            escape(crs.courseCode),
            escape(crs.courseTitle),
            escape(crs.courseCategory),
            escape('All Cohorts'),
            escape(stu.rollNumber),
            escape(stu.admissionNumber),
            escape(stu.universityRegNo || 'Pending'),
            escape(stu.fullName),
            escape(`${crs.percentage}% (${crs.presentCount + crs.odCount}/${crs.conductedCount} sessions)`),
            escape('Department Faculty Committee'),
            escape('N/A'),
            escape(`Classes Conducted: ${crs.conductedCount}, Attended: ${crs.presentCount + crs.odCount}`),
            escape('SEMESTER_AUDIT'),
            escape(crs.isShortage ? 'ATTENDANCE SHORTAGE (<75%) - Condonation Review' : crs.isWarning ? 'WARNING ZONE (75-80%)' : 'ELIGIBLE'),
            escape(new Date().toISOString())
          ]);
        });
      });
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => {
      setExported(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold font-display text-slate-900">Reports</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            Attendance & Audit
          </span>
        </div>

        {canExport && (
          <button
            onClick={() => exportAttendanceReportToCsv('NSS_College_Attendance_Condonation_Report.csv')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start md:self-auto"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('SHORTAGE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'SHORTAGE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Shortage (&lt;{settings.minAttendancePercentage}%) ({shortageCount})
          </button>

          <button
            onClick={() => setActiveTab('WARNING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'WARNING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Warning ({settings.minAttendancePercentage}-{settings.warningAttendancePercentage}%) ({warningCount})
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Students ({students.length})
          </button>

          {canViewAudit && (
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'AUDIT'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
              }`}
            >
              <History className="w-3.5 h-3.5" /> System Audit Logs ({auditLogs.length})
            </button>
          )}
        </div>

        {activeTab !== 'AUDIT' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDept}
              disabled={!canReadCollege && Boolean(hodDeptId)}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {canReadCollege && <option value="ALL">All Departments</option>}
              {departments
                .filter(d => canReadCollege || !hodDeptId || d.id === hodDeptId)
                .map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Content Body */}
      {activeTab === 'AUDIT' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70">
            <h4 className="text-sm font-bold text-slate-900">Immutable Audit Trail</h4>
            <p className="text-xs text-slate-500">Every attendance mark, correction approval, and system configuration modification</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="font-semibold text-blue-700">{log.actorName}</span>
                    <span className="text-[10px] text-slate-400">({log.actorRole})</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Target: <strong>{log.entityType}</strong> (ID: {log.entityId})
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Roll / Adm</th>
                  <th className="py-3.5 px-4">Programme & Dept</th>
                  <th className="py-3.5 px-4 text-center">Sessions Conducted</th>
                  <th className="py-3.5 px-4 text-center">Attended (P+OD)</th>
                  <th className="py-3.5 px-4 text-center">Attendance %</th>
                  <th className="py-3.5 px-4 text-right">Status / Condonation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No records found matching the active criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(({ student, dept, prog, summary }) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{student.fullName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {student.rollNumber} ({student.admissionNumber})
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{prog?.name}</span>
                        <span className="text-[10px] text-blue-700 font-bold block">{dept?.code}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{summary.totalConducted}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        {summary.totalPresent + summary.totalOd}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={summary.isShortage ? 'danger' : summary.isWarning ? 'warning' : 'success'}
                          size="md"
                        >
                          {summary.overallPercentage}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {summary.isShortage ? (
                          <span className="text-rose-600 font-bold text-[11px] bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                            Condonation Required
                          </span>
                        ) : summary.isWarning ? (
                          <span className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded">
                            At Risk
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                            Eligible
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating 'Export Data' Button for Administrative Review */}
      {(canExport || activeRole !== 'STUDENT') && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 print:hidden animate-in fade-in duration-300">
          <button
            id="floating-export-data-btn"
            onClick={exportCurrentAttendanceLogs}
            disabled={exported}
            title="Download CSV log of current attendance records for administrative review"
            className={`group flex items-center gap-2.5 px-5 py-3.5 rounded-full font-bold text-xs shadow-xl transition-all duration-200 border cursor-pointer ${
              exported
                ? 'bg-emerald-700 text-white border-emerald-600 shadow-emerald-900/30 scale-105'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 shadow-slate-900/30 hover:shadow-2xl hover:shadow-slate-900/40 hover:-translate-y-0.5 active:scale-95'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                exported
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white'
              }`}
            >
              {exported ? (
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="font-semibold tracking-wide">
              {exported ? 'Logs Exported!' : 'Export Data'}
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full border ${
                exported
                  ? 'bg-emerald-800 text-emerald-100 border-emerald-600'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              CSV
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
