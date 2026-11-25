import ExcelJS from 'exceljs';
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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function addStyledSheet(
  wb: ExcelJS.Workbook,
  name: string,
  rows: (string | number)[][],
  colWidths: number[],
  styleFirstRowAsHeader = true
) {
  const ws = wb.addWorksheet(name.slice(0, 31));
  rows.forEach((row, rowIdx) => {
    const safeRow = row.map(cell =>
      typeof cell === 'number' ? cell : sanitizeSpreadsheetCell(cell)
    );
    const addedRow = ws.addRow(safeRow);
    if (styleFirstRowAsHeader && rowIdx === 0) {
      addedRow.font = { bold: true };
    }
  });
  ws.columns = colWidths.map(width => ({ width }));
  return ws;
}

/**
 * Exports a clean multi-sheet Excel Workbook (.xlsx) using ExcelJS.
 */
export async function exportAttendanceToExcelWorkbook(
  report: AggregatedAttendanceReport,
  meta: {
    collegeName: string;
    scopeSummary: string;
    minPercentage: number;
  }
): Promise<string> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'NSS College Ottapalam FYUGP ERP';
  wb.created = new Date();

  // Sheet 1: Overview
  const overviewRows: (string | number)[][] = [
    ['Institution', meta.collegeName],
    ['Report Period', report.dateWindow.label],
    ['Active Academic Scope', meta.scopeSummary],
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
  addStyledSheet(wb, 'Overview', overviewRows, [32, 52], false);

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
  const studentData: (string | number)[][] = report.scopedStudents.map(row => [
    row.student.rollNumber,
    row.student.admissionNumber,
    row.student.universityRegisterNumber || 'Pending',
    row.student.fullName,
    row.dept?.code || 'DEPT',
    row.prog?.name || 'Programme',
    `S${row.student.currentSemester || 1}`,
    row.policy === 'SESSION_STRICT' ? 'Session Half-Day Rule' : 'Hour-Wise',
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
  addStyledSheet(
    wb,
    'Student Summary',
    [studentHeaders, ...studentData],
    [10, 14, 18, 26, 12, 24, 10, 22, 13, 10, 14, 13, 10, 20, 13, 13, 13, 14, 18, 14]
  );

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
    const matrixData: (string | number)[][] = report.matrixRows.map(r => [
      r.student.rollNumber,
      r.student.universityRegisterNumber || r.student.admissionNumber,
      r.student.fullName,
      r.deptCode,
      ...report.matrixColumns.map(c => r.cells[c.key] || '-'),
      r.attended,
      r.conducted,
      r.conducted > 0 ? `${r.percentage}%` : 'N/A'
    ]);
    addStyledSheet(
      wb,
      'Date Register Matrix',
      [matrixHeaders, ...matrixData],
      [10, 16, 24, 10, ...report.matrixColumns.map(() => 14), 10, 8, 13]
    );
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
  const classData: (string | number)[][] = report.scopedClasses.map(c => [
    c.courseCode,
    c.courseTitle,
    c.categoryName,
    c.groupName,
    `${c.departmentCode} - ${c.departmentName}`,
    `S${c.semesterNumber}`,
    c.facultyName,
    c.enrolledCount,
    c.sessionsConducted,
    c.avgPercentage,
    c.shortageCount,
    c.warningCount
  ]);
  addStyledSheet(
    wb,
    'Class & Subject Summary',
    [classHeaders, ...classData],
    [14, 28, 12, 18, 24, 10, 22, 16, 14, 16, 14, 14]
  );

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
  const logData: (string | number)[][] = report.registerEntries.map(e => [
    e.date,
    e.periodLabel,
    e.departmentName,
    e.programmeName,
    `S${e.semesterNumber}`,
    e.courseCode,
    e.courseTitle,
    e.groupName,
    e.facultyName,
    e.rollNumber,
    e.admissionNumber,
    e.universityRegNo,
    e.studentName,
    e.status,
    e.topicCovered,
    e.remarks
  ]);
  addStyledSheet(
    wb,
    'Session Logs',
    [logHeaders, ...logData],
    [12, 20, 20, 22, 10, 12, 26, 16, 20, 10, 14, 16, 24, 14, 24, 20]
  );

  const filename = buildSafeFilename('NSS_Attendance_Sheets', report.dateWindow.label, 'xlsx');
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  downloadBlob(blob, filename);
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
