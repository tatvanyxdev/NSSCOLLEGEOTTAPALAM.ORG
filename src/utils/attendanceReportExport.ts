import * as XLSX from 'xlsx';
import { AggregatedAttendanceReport } from './attendanceAggregation';

export type CsvExportTab = 'STUDENT_SUMMARY' | 'DATE_MATRIX' | 'CLASS_SUBJECT' | 'DAILY_REGISTER';

function sanitizeSpreadsheetCell(value: unknown): string {
  const str = String(value ?? '');
  const trimmedStart = str.replace(/^[\u0000-\u001F]+/, '');
  if (/^[=+\-@\t\r]/.test(trimmedStart)) {
    return `'${str}`;
  }
  return str;
}

function escapeCsvCell(value: unknown): string {
  const clean = sanitizeSpreadsheetCell(value);
  return `"${clean.replace(/"/g, '""')}"`;
}

function buildSafeFilename(prefix: string, scopeLabel: string, ext: 'xlsx' | 'csv'): string {
  const slug = scopeLabel
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  const today = new Date().toISOString().split('T')[0];
  return `${prefix}_${slug}_${today}.${ext}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports a clean multi-sheet Excel Workbook (.xlsx) compatible with Microsoft Excel and Google Sheets.
 */
export function exportAttendanceToExcelWorkbook(
  report: AggregatedAttendanceReport,
  meta: {
    collegeName: string;
    scopeSummary: string;
    minPercentage: number;
  }
): string {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewRows = [
    ['Institution', sanitizeSpreadsheetCell(meta.collegeName)],
    ['Report Period', sanitizeSpreadsheetCell(report.dateWindow.label)],
    ['Active Academic Scope', sanitizeSpreadsheetCell(meta.scopeSummary)],
    ['Minimum Required Attendance %', `${meta.minPercentage}%`],
    ['Generated On', new Date().toLocaleString('en-IN')],
    ['', ''],
    ['Summary Metric', 'Value'],
    ['Total Students in Scope', report.kpis.totalStudents],
    ['Sessions Conducted', report.kpis.sessionsConducted],
    ['Average Attendance %', `${report.kpis.averagePercentage}%`],
    ['Eligible Students (>= Target %)', report.kpis.eligibleCount],
    ['Warning Zone Students', report.kpis.warningCount],
    ['Shortage Students (< Target %)', report.kpis.shortageCount]
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 32 }, { wch: 52 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // Sheet 2: Student Summary
  const studentHeaders = [
    'Roll No',
    'Admission No',
    'University Reg No',
    'Student Name',
    'Department',
    'Programme',
    'Semester',
    'Calculation Policy',
    'Sessions Held',
    'Present',
    'Duty / OD / SP',
    'Medical Leave',
    'Absent',
    'Effective Attended (Hrs)',
    'Hour-Wise %',
    'Working Days',
    'Awarded Days',
    'Half-Days Lost',
    'Official Attendance %',
    'Eligibility Status'
  ];
  const studentData = report.scopedStudents.map(row => [
    sanitizeSpreadsheetCell(row.student.rollNumber),
    sanitizeSpreadsheetCell(row.student.admissionNumber),
    sanitizeSpreadsheetCell(row.student.universityRegisterNumber || 'Pending'),
    sanitizeSpreadsheetCell(row.student.fullName),
    sanitizeSpreadsheetCell(row.dept?.code || 'DEPT'),
    sanitizeSpreadsheetCell(row.prog?.name || 'Programme'),
    `S${row.student.currentSemester || 1}`,
    sanitizeSpreadsheetCell(row.policy === 'SESSION_STRICT' ? 'Session Half-Day Rule' : 'Hour-Wise'),
    row.conducted,
    row.present,
    row.od + row.specialDuty,
    row.medicalLeave,
    row.absent,
    row.effectiveAttended,
    row.conducted > 0 ? row.hourWisePercentage : 0,
    row.policy === 'SESSION_STRICT' ? row.totalWorkingDays : '-',
    row.policy === 'SESSION_STRICT' ? row.awardedDays : '-',
    row.policy === 'SESSION_STRICT' ? row.halfDaysLost : 0,
    row.conducted > 0 ? row.percentage : 0,
    row.status === 'SHORTAGE'
      ? 'SHORTAGE'
      : row.status === 'WARNING'
        ? 'WARNING'
        : row.status === 'ELIGIBLE'
          ? 'ELIGIBLE'
          : 'NO SESSIONS'
  ]);
  const wsStudents = XLSX.utils.aoa_to_sheet([studentHeaders, ...studentData]);
  wsStudents['!cols'] = [
    { wch: 10 },
    { wch: 14 },
    { wch: 18 },
    { wch: 26 },
    { wch: 12 },
    { wch: 24 },
    { wch: 10 },
    { wch: 22 },
    { wch: 13 },
    { wch: 10 },
    { wch: 14 },
    { wch: 13 },
    { wch: 10 },
    { wch: 20 },
    { wch: 13 },
    { wch: 13 },
    { wch: 13 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Student Summary');

  // Sheet 3: Date-Period Register Matrix (if columns exist)
  if (report.matrixColumns.length > 0 && report.matrixRows.length > 0) {
    const matrixHeaders = [
      'Roll No',
      'University Reg No',
      'Student Name',
      'Dept',
      ...report.matrixColumns.map(c => `${c.label} (${c.subLabel})`),
      'Attended',
      'Held',
      'Attendance %'
    ];
    const matrixData = report.matrixRows.map(r => [
      sanitizeSpreadsheetCell(r.student.rollNumber),
      sanitizeSpreadsheetCell(r.student.universityRegisterNumber || r.student.admissionNumber),
      sanitizeSpreadsheetCell(r.student.fullName),
      sanitizeSpreadsheetCell(r.deptCode),
      ...report.matrixColumns.map(c => r.cells[c.key] || '-'),
      r.attended,
      r.conducted,
      r.conducted > 0 ? `${r.percentage}%` : 'N/A'
    ]);
    const wsMatrix = XLSX.utils.aoa_to_sheet([matrixHeaders, ...matrixData]);
    wsMatrix['!cols'] = [
      { wch: 10 },
      { wch: 16 },
      { wch: 24 },
      { wch: 10 },
      ...report.matrixColumns.map(() => ({ wch: 14 })),
      { wch: 10 },
      { wch: 8 },
      { wch: 13 }
    ];
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'Date Register Matrix');
  }

  // Sheet 4: Class & Subject Breakdown
  const classHeaders = [
    'Course Code',
    'Course Title',
    'Category',
    'Class / Group',
    'Department',
    'Semester',
    'Faculty',
    'Enrolled Students',
    'Sessions Held',
    'Avg Attendance %',
    'Shortage Count',
    'Warning Count'
  ];
  const classData = report.scopedClasses.map(c => [
    sanitizeSpreadsheetCell(c.courseCode),
    sanitizeSpreadsheetCell(c.courseTitle),
    sanitizeSpreadsheetCell(c.categoryName),
    sanitizeSpreadsheetCell(c.groupName),
    sanitizeSpreadsheetCell(`${c.departmentCode} - ${c.departmentName}`),
    `S${c.semesterNumber}`,
    sanitizeSpreadsheetCell(c.facultyName),
    c.enrolledCount,
    c.sessionsConducted,
    c.avgPercentage,
    c.shortageCount,
    c.warningCount
  ]);
  const wsClasses = XLSX.utils.aoa_to_sheet([classHeaders, ...classData]);
  wsClasses['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 12 },
    { wch: 18 },
    { wch: 24 },
    { wch: 10 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsClasses, 'Class & Subject Summary');

  // Sheet 5: Detailed Session Logs
  const logHeaders = [
    'Date',
    'Period',
    'Department',
    'Programme',
    'Semester',
    'Course Code',
    'Course Title',
    'Class / Group',
    'Faculty',
    'Roll No',
    'Admission No',
    'University Reg No',
    'Student Name',
    'Status',
    'Topic Covered',
    'Remarks'
  ];
  const logData = report.registerEntries.map(e => [
    sanitizeSpreadsheetCell(e.date),
    sanitizeSpreadsheetCell(e.periodLabel),
    sanitizeSpreadsheetCell(e.departmentName),
    sanitizeSpreadsheetCell(e.programmeName),
    `S${e.semesterNumber}`,
    sanitizeSpreadsheetCell(e.courseCode),
    sanitizeSpreadsheetCell(e.courseTitle),
    sanitizeSpreadsheetCell(e.groupName),
    sanitizeSpreadsheetCell(e.facultyName),
    sanitizeSpreadsheetCell(e.rollNumber),
    sanitizeSpreadsheetCell(e.admissionNumber),
    sanitizeSpreadsheetCell(e.universityRegNo),
    sanitizeSpreadsheetCell(e.studentName),
    sanitizeSpreadsheetCell(e.status),
    sanitizeSpreadsheetCell(e.topicCovered),
    sanitizeSpreadsheetCell(e.remarks)
  ]);
  const wsLogs = XLSX.utils.aoa_to_sheet([logHeaders, ...logData]);
  wsLogs['!cols'] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 22 },
    { wch: 10 },
    { wch: 12 },
    { wch: 26 },
    { wch: 16 },
    { wch: 20 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
    { wch: 24 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsLogs, 'Session Logs');

  const filename = buildSafeFilename('NSS_Attendance_Sheets', report.dateWindow.label, 'xlsx');
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * Exports CSV for the currently viewed tab using formula-injection safe cells.
 */
export function exportAttendanceToCsv(
  report: AggregatedAttendanceReport,
  activeTab: CsvExportTab
): string {
  let headers: string[] = [];
  let rows: unknown[][] = [];

  if (activeTab === 'DATE_MATRIX' && report.matrixColumns.length > 0) {
    headers = [
      'Roll No',
      'Reg No',
      'Student Name',
      'Dept',
      ...report.matrixColumns.map(c => `${c.label} (${c.subLabel})`),
      'Attended',
      'Held',
      'Attendance %'
    ];
    rows = report.matrixRows.map(r => [
      r.student.rollNumber,
      r.student.universityRegisterNumber || r.student.admissionNumber,
      r.student.fullName,
      r.deptCode,
      ...report.matrixColumns.map(c => r.cells[c.key] || '-'),
      r.attended,
      r.conducted,
      r.conducted > 0 ? `${r.percentage}%` : 'N/A'
    ]);
  } else if (activeTab === 'CLASS_SUBJECT') {
    headers = [
      'Course Code',
      'Course Title',
      'Category',
      'Class / Group',
      'Department',
      'Semester',
      'Faculty',
      'Enrolled',
      'Sessions Held',
      'Avg Attendance %',
      'Shortage Count'
    ];
    rows = report.scopedClasses.map(c => [
      c.courseCode,
      c.courseTitle,
      c.categoryName,
      c.groupName,
      c.departmentName,
      `S${c.semesterNumber}`,
      c.facultyName,
      c.enrolledCount,
      c.sessionsConducted,
      `${c.avgPercentage}%`,
      c.shortageCount
    ]);
  } else if (activeTab === 'DAILY_REGISTER') {
    headers = [
      'Date',
      'Period',
      'Department',
      'Semester',
      'Course Code',
      'Course Title',
      'Group',
      'Faculty',
      'Roll No',
      'Reg No',
      'Student Name',
      'Status',
      'Topic Covered'
    ];
    rows = report.registerEntries.map(e => [
      e.date,
      e.periodLabel,
      e.departmentCode,
      `S${e.semesterNumber}`,
      e.courseCode,
      e.courseTitle,
      e.groupName,
      e.facultyName,
      e.rollNumber,
      e.universityRegNo,
      e.studentName,
      e.status,
      e.topicCovered
    ]);
  } else {
    headers = [
      'Roll No',
      'Admission No',
      'University Reg No',
      'Student Name',
      'Department',
      'Programme',
      'Semester',
      'Policy',
      'Sessions Held',
      'Present',
      'Duty / OD / SP',
      'Medical Leave',
      'Absent',
      'Effective Attended',
      'Hour-Wise %',
      'Working Days',
      'Awarded Days',
      'Half-Days Lost',
      'Official %',
      'Status'
    ];
    rows = report.scopedStudents.map(r => [
      r.student.rollNumber,
      r.student.admissionNumber,
      r.student.universityRegisterNumber || 'Pending',
      r.student.fullName,
      r.dept?.code || 'DEPT',
      r.prog?.name || 'Programme',
      `S${r.student.currentSemester || 1}`,
      r.policy === 'SESSION_STRICT' ? 'Session Half-Day Rule' : 'Hour-Wise',
      r.conducted,
      r.present,
      r.od + r.specialDuty,
      r.medicalLeave,
      r.absent,
      r.effectiveAttended,
      r.conducted > 0 ? `${r.hourWisePercentage}%` : '0%',
      r.policy === 'SESSION_STRICT' ? r.totalWorkingDays : '-',
      r.policy === 'SESSION_STRICT' ? r.awardedDays : '-',
      r.policy === 'SESSION_STRICT' ? r.halfDaysLost : 0,
      r.conducted > 0 ? `${r.percentage}%` : '0%',
      r.status
    ]);
  }

  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(r => r.map(escapeCsvCell).join(','))
  ].join('\r\n');

  const blob = new Blob([csvLines], { type: 'text/csv;charset=utf-8;' });
  const filename = buildSafeFilename(`NSS_Attendance_${activeTab}`, report.dateWindow.label, 'csv');
  downloadBlob(blob, filename);
  return filename;
}

/**
 * Generates clean tab-separated text so the user can paste directly into Google Sheets or Excel.
 */
export function buildGoogleSheetsTsv(
  report: AggregatedAttendanceReport,
  activeTab: CsvExportTab
): string {
  const cleanTab = (v: unknown) => sanitizeSpreadsheetCell(v).replace(/[\t\r\n]+/g, ' ');

  if (activeTab === 'DATE_MATRIX' && report.matrixColumns.length > 0) {
    const header = [
      'Roll No',
      'Reg No',
      'Student Name',
      'Dept',
      ...report.matrixColumns.map(c => `${c.label} (${c.subLabel})`),
      'Attended',
      'Held',
      '%'
    ]
      .map(cleanTab)
      .join('\t');
    const body = report.matrixRows.map(r =>
      [
        r.student.rollNumber,
        r.student.universityRegisterNumber || r.student.admissionNumber,
        r.student.fullName,
        r.deptCode,
        ...report.matrixColumns.map(c => r.cells[c.key] || '-'),
        r.attended,
        r.conducted,
        r.conducted > 0 ? `${r.percentage}%` : 'N/A'
      ]
        .map(cleanTab)
        .join('\t')
    );
    return [header, ...body].join('\n');
  }

  if (activeTab === 'CLASS_SUBJECT') {
    const header = [
      'Course Code',
      'Course Title',
      'Class / Group',
      'Department',
      'Semester',
      'Faculty',
      'Enrolled',
      'Sessions Held',
      'Avg %',
      'Shortage'
    ]
      .map(cleanTab)
      .join('\t');
    const body = report.scopedClasses.map(c =>
      [
        c.courseCode,
        c.courseTitle,
        c.groupName,
        c.departmentCode,
        `S${c.semesterNumber}`,
        c.facultyName,
        c.enrolledCount,
        c.sessionsConducted,
        `${c.avgPercentage}%`,
        c.shortageCount
      ]
        .map(cleanTab)
        .join('\t')
    );
    return [header, ...body].join('\n');
  }

  if (activeTab === 'DAILY_REGISTER') {
    const header = [
      'Date',
      'Period',
      'Course',
      'Group',
      'Roll No',
      'Student Name',
      'Status'
    ]
      .map(cleanTab)
      .join('\t');
    const body = report.registerEntries.map(e =>
      [e.date, e.periodLabel, `${e.courseCode} ${e.courseTitle}`, e.groupName, e.rollNumber, e.studentName, e.status]
        .map(cleanTab)
        .join('\t')
    );
    return [header, ...body].join('\n');
  }

  const header = [
    'Roll No',
    'University Reg No',
    'Student Name',
    'Dept',
    'Programme',
    'Sem',
    'Policy',
    'Held',
    'Present',
    'DL/OD/SP',
    'ML',
    'Absent',
    'Attended',
    'Hour-Wise %',
    'Working Days',
    'Awarded Days',
    'Official %',
    'Status'
  ]
    .map(cleanTab)
    .join('\t');
  const body = report.scopedStudents.map(r =>
    [
      r.student.rollNumber,
      r.student.universityRegisterNumber || r.student.admissionNumber,
      r.student.fullName,
      r.dept?.code || 'DEPT',
      r.prog?.name || 'Programme',
      `S${r.student.currentSemester || 1}`,
      r.policy === 'SESSION_STRICT' ? 'Session Half-Day Rule' : 'Hour-Wise',
      r.conducted,
      r.present,
      r.od + r.specialDuty,
      r.medicalLeave,
      r.absent,
      r.effectiveAttended,
      r.conducted > 0 ? `${r.hourWisePercentage}%` : '0%',
      r.policy === 'SESSION_STRICT' ? r.totalWorkingDays : '-',
      r.policy === 'SESSION_STRICT' ? r.awardedDays : '-',
      r.conducted > 0 ? `${r.percentage}%` : '0%',
      r.status
    ]
      .map(cleanTab)
      .join('\t')
  );
  return [header, ...body].join('\n');
}
