import ExcelJS from 'exceljs';
import { Department, CourseCategory } from '../types';

export interface ParsedStudentRow {
  rowIndex: number;
  fullName: string;
  universityRegisterNumber: string;
  rollNumber: string;
  admissionNumber: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  currentSemester: number;
  yearOfStudy: number;
  hasExplicitSemester: boolean;
  hasExplicitYear: boolean;
  admissionBatch: string;
  departmentCodeOrName: string;
  matchedDepartmentId?: string;
  matchedDepartmentName?: string;
  gender?: string;
  bloodGroup?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  isValid: boolean;
  errors: string[];
}

export interface ParsedCourseRow {
  rowIndex: number;
  courseCode: string;
  courseTitle: string;
  departmentCodeOrName: string;
  matchedDepartmentId?: string;
  matchedDepartmentName?: string;
  categoryCodeOrName: string;
  matchedCategoryId?: string;
  matchedCategoryName?: string;
  credits: number;
  semester: number;
  theoryHours: number;
  practicalHours: number;
  isValid: boolean;
  errors: string[];
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB guard against oversized uploads
const MAX_UPLOAD_ROWS = 5000;

const sanitizeSpreadsheetOutputCell = (value: unknown): string => {
  const str = String(value ?? '');
  const trimmedStart = str.replace(/^[\u0000-\u001F]+/, '');
  if (/^[=+\-@\t\r]/.test(trimmedStart)) {
    return `'${str}`;
  }
  return str;
};

/**
 * Extract plain display string from any ExcelJS cell value
 */
const extractExcelCellString = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    const d = String(value.getUTCDate()).padStart(2, '0');
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const y = value.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim();
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map(part => part.text || '').join('').trim();
    }
    if ('result' in value && value.result !== undefined) {
      return extractExcelCellString(value.result as ExcelJS.CellValue);
    }
    if ('hyperlink' in value && typeof value.hyperlink === 'string') {
      return String((value as any).text || value.hyperlink).trim();
    }
  }
  return String(value).trim();
};

/**
 * Parse CSV text cleanly handling quoted commas, escaped quotes, and CRLF
 */
const parseCsvTextToRows = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let currentField = '';
  let currentRow: string[] = [];
  let inQuotes = false;

  const cleanText = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    const next = cleanText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && next === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
      if (rows.length > MAX_UPLOAD_ROWS + 1) break;
    } else {
      currentField += ch;
    }
  }
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1, MAX_UPLOAD_ROWS + 1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (header) obj[header] = row[idx] ?? '';
    });
    return obj;
  });
};

/**
 * Read .xlsx (via ExcelJS) or .csv file into normalized row objects
 */
const readSpreadsheetRows = async (file: File): Promise<Record<string, string>[]> => {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Uploaded file exceeds the 10 MB safety limit.');
  }

  const fileName = (file.name || '').toLowerCase();
  if (fileName.endsWith('.csv') || file.type === 'text/csv') {
    const text = await file.text();
    return parseCsvTextToRows(text);
  }

  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('The Excel workbook contains no readable worksheets.');
  }

  const headers: Record<number, string> = {};
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const label = extractExcelCellString(cell.value);
    if (label) headers[colNumber] = label;
  });

  const rows: Record<string, string>[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    if (rows.length >= MAX_UPLOAD_ROWS) return;

    const record: Record<string, string> = {};
    let hasValue = false;
    Object.entries(headers).forEach(([colIdxStr, headerLabel]) => {
      const colIdx = Number(colIdxStr);
      const val = extractExcelCellString(row.getCell(colIdx).value);
      if (val) hasValue = true;
      record[headerLabel] = val;
    });

    if (hasValue) {
      rows.push(record);
    }
  });

  return rows;
};

const normalizeKey = (key: string): string => {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const pickNormalizedValue = (
  normalized: Record<string, string>,
  exactKeys: string[],
  fallbackPredicate?: (normalizedKey: string) => boolean
): string => {
  for (const key of exactKeys) {
    if (normalized[key]) return normalized[key];
  }
  if (fallbackPredicate) {
    for (const [k, v] of Object.entries(normalized)) {
      if (v && fallbackPredicate(k)) return v;
    }
  }
  return '';
};

const ROMAN_NUMERAL_MAP: Record<string, number> = {
  viii: 8,
  vii: 7,
  vi: 6,
  iv: 4,
  v: 5,
  iii: 3,
  ii: 2,
  i: 1
};

const WORD_NUMBER_MAP: Record<string, number> = {
  first: 1,
  one: 1,
  second: 2,
  two: 2,
  third: 3,
  three: 3,
  fourth: 4,
  four: 4,
  fifth: 5,
  five: 5,
  sixth: 6,
  six: 6,
  seventh: 7,
  seven: 7,
  eighth: 8,
  eight: 8
};

export const parseAcademicNumber = (raw: string, max: number): number | null => {
  const cleaned = String(raw || '').trim();
  if (!cleaned) return null;

  const explicitMatch =
    cleaned.match(/\b(\d+)\b/) ||
    cleaned.match(/^[sSyY](\d+)$/) ||
    cleaned.match(/(\d+)/);
  if (explicitMatch) {
    const parsed = parseInt(explicitMatch[1], 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= max) {
      return parsed;
    }
  }

  const romanMatch = cleaned.toLowerCase().match(/\b(viii|vii|vi|iv|v|iii|ii|i)\b/);
  if (romanMatch) {
    const val = ROMAN_NUMERAL_MAP[romanMatch[1]];
    if (val && val >= 1 && val <= max) {
      return val;
    }
  }

  const lower = cleaned.toLowerCase();
  for (const [word, val] of Object.entries(WORD_NUMBER_MAP)) {
    if (new RegExp(`\\b${word}\\b`).test(lower) && val <= max) {
      return val;
    }
  }

  return null;
};

export const findDepartment = (
  query: string,
  departments: Department[]
): Department | undefined => {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  return departments.find(
    d =>
      d.id.toLowerCase() === q ||
      d.code.toLowerCase() === q ||
      d.name.toLowerCase() === q ||
      d.name.toLowerCase().includes(q) ||
      q.includes(d.code.toLowerCase())
  );
};

export const findCategory = (
  query: string,
  categories: CourseCategory[]
): CourseCategory | undefined => {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  return categories.find(
    c =>
      c.id.toLowerCase() === q ||
      c.code.toLowerCase() === q ||
      c.name.toLowerCase() === q ||
      c.name.toLowerCase().includes(q) ||
      q.includes(c.code.toLowerCase())
  );
};

/**
 * Parse uploaded Student Excel (.xlsx) or CSV file
 */
export const parseStudentExcelFile = async (
  file: File,
  departments: Department[],
  defaultDepartmentId?: string,
  defaultYearOfStudy?: number
): Promise<{ rows: ParsedStudentRow[]; totalRows: number; validCount: number; errorCount: number }> => {
  const rawRows = await readSpreadsheetRows(file);

  const rows: ParsedStudentRow[] = rawRows.map((raw, idx) => {
    const rowNum = idx + 2;
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      normalized[normalizeKey(k)] = String(v ?? '').trim();
    }

    const fullName = pickNormalizedValue(
      normalized,
      ['fullname', 'studentname', 'name', 'candidatename', 'nameofstudent', 'nameofthestudent']
    );

    const universityRegisterNumber = pickNormalizedValue(
      normalized,
      [
        'universityregisternumber',
        'universityregno',
        'registernumber',
        'registerno',
        'regno',
        'uokregno',
        'kturegno'
      ]
    );

    const rollNumber = pickNormalizedValue(
      normalized,
      ['rollnumber', 'rollno', 'classrollno', 'classrollnumber']
    );

    const admissionNumber = pickNormalizedValue(
      normalized,
      ['admissionnumber', 'admissionno', 'admno']
    );

    const email = pickNormalizedValue(
      normalized,
      ['email', 'emailaddress', 'studentemail', 'mailid']
    );

    const mobileNumber = pickNormalizedValue(
      normalized,
      ['mobilenumber', 'mobile', 'phone', 'phonenumber', 'contactnumber', 'mobileno', 'phoneno']
    );

    const dateOfBirth = pickNormalizedValue(
      normalized,
      ['dateofbirth', 'dateofbirthddmmyyyy', 'dateofbirthyyyymmdd', 'dob', 'birthdate'],
      key => key.startsWith('dateofbirth') || key === 'dob'
    );

    const semesterRaw = pickNormalizedValue(
      normalized,
      [
        'currentsemester',
        'currentsemester18',
        'semester18',
        'semester',
        'semesterno',
        'semesternumber',
        'currentsem',
        'semno',
        'sem18',
        'sem',
        'presentsemester',
        'presentsem',
        'academicsemester'
      ],
      key => key === 'sem' || key.includes('semester') || /^sem\d*$/.test(key)
    );

    const yearRaw = pickNormalizedValue(
      normalized,
      [
        'yearofstudy',
        'studyyear',
        'classyear',
        'currentyear',
        'academicyearofstudy',
        'year',
        'yr'
      ],
      key => key.includes('yearofstudy') || key.includes('classyear') || key.includes('studyyear')
    );

    const parsedSem = parseAcademicNumber(semesterRaw, 8);
    const parsedYear = parseAcademicNumber(yearRaw, 4);
    const hasExplicitSemester = parsedSem !== null;
    const hasExplicitYear = parsedYear !== null;

    let currentSemester = parsedSem ?? (parsedYear ? (parsedYear - 1) * 2 + 1 : 1);
    let yearOfStudy = parsedYear ?? Math.ceil(currentSemester / 2);

    if (defaultYearOfStudy && defaultYearOfStudy >= 1 && defaultYearOfStudy <= 4) {
      yearOfStudy = defaultYearOfStudy;
      if (!hasExplicitSemester || Math.ceil(currentSemester / 2) !== defaultYearOfStudy) {
        currentSemester = (defaultYearOfStudy - 1) * 2 + 1;
      }
    }

    const admissionBatch = pickNormalizedValue(
      normalized,
      ['admissionbatch', 'batch', 'academicbatch', 'academicsession']
    ) || '2026-2030';

    const deptQuery = pickNormalizedValue(
      normalized,
      [
        'department',
        'departmentnameorcode',
        'departmentcodeorname',
        'departmentname',
        'departmentcode',
        'dept',
        'deptname',
        'deptcode',
        'branch',
        'programme',
        'program'
      ]
    );

    const gender = pickNormalizedValue(normalized, ['gender', 'sex']);
    const bloodGroup = pickNormalizedValue(normalized, ['bloodgroup', 'blood']);
    const guardianName = pickNormalizedValue(
      normalized,
      ['guardianname', 'parentname', 'fathername', 'mothername']
    );
    const guardianPhone = pickNormalizedValue(
      normalized,
      ['guardianphone', 'parentphone', 'emergencynumber', 'guardianmobile', 'parentmobile']
    );
    const address = pickNormalizedValue(normalized, ['address', 'residentialaddress']);

    let matchedDept = defaultDepartmentId
      ? departments.find(d => d.id === defaultDepartmentId)
      : undefined;

    if (deptQuery) {
      const found = findDepartment(deptQuery, departments);
      if (found) matchedDept = found;
    }

    const errors: string[] = [];
    if (!fullName) errors.push('Missing Full Name');
    if (!email && !mobileNumber) errors.push('Either Email or Mobile is required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
    if (!matchedDept) errors.push(`Unknown department "${deptQuery || 'None'}"`);

    return {
      rowIndex: rowNum,
      fullName,
      universityRegisterNumber: universityRegisterNumber.toUpperCase(),
      rollNumber,
      admissionNumber,
      email: email.toLowerCase(),
      mobileNumber: mobileNumber.replace(/\D/g, ''),
      dateOfBirth,
      currentSemester,
      yearOfStudy,
      hasExplicitSemester,
      hasExplicitYear,
      admissionBatch,
      departmentCodeOrName: deptQuery,
      matchedDepartmentId: matchedDept?.id,
      matchedDepartmentName: matchedDept?.name,
      gender,
      bloodGroup,
      guardianName,
      guardianPhone,
      address,
      isValid: errors.length === 0,
      errors
    };
  });

  const validCount = rows.filter(r => r.isValid).length;
  const errorCount = rows.filter(r => !r.isValid).length;

  return { rows, totalRows: rows.length, validCount, errorCount };
};

/**
 * Parse uploaded Course Excel (.xlsx) or CSV file
 */
export const parseCourseExcelFile = async (
  file: File,
  departments: Department[],
  categories: CourseCategory[],
  defaultDepartmentId?: string
): Promise<{ rows: ParsedCourseRow[]; totalRows: number; validCount: number; errorCount: number }> => {
  const rawRows = await readSpreadsheetRows(file);

  const rows: ParsedCourseRow[] = rawRows.map((raw, idx) => {
    const rowNum = idx + 2;
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      normalized[normalizeKey(k)] = String(v ?? '').trim();
    }

    const courseCode =
      normalized['coursecode'] ||
      normalized['code'] ||
      normalized['subjectcode'] ||
      normalized['papercode'] ||
      '';

    const courseTitle =
      normalized['coursetitle'] ||
      normalized['title'] ||
      normalized['subjectname'] ||
      normalized['coursename'] ||
      '';

    const deptQuery =
      normalized['department'] ||
      normalized['departmentcode'] ||
      normalized['dept'] ||
      normalized['deptcode'] ||
      '';

    const catQuery =
      normalized['category'] ||
      normalized['coursecategory'] ||
      normalized['type'] ||
      normalized['cat'] ||
      '';

    const credits = Math.max(1, parseInt(normalized['credits'] || normalized['credit'] || '4', 10) || 4);
    const semester = Math.max(1, Math.min(8, parseInt(normalized['semester'] || normalized['sem'] || '1', 10) || 1));
    const theoryHours = Math.max(0, parseInt(normalized['theoryhours'] || normalized['theory'] || normalized['lecturehours'] || '3', 10) || 0);
    const practicalHours = Math.max(0, parseInt(normalized['practicalhours'] || normalized['practical'] || normalized['labhours'] || '0', 10) || 0);

    let matchedDept = defaultDepartmentId
      ? departments.find(d => d.id === defaultDepartmentId)
      : undefined;

    if (deptQuery) {
      const found = findDepartment(deptQuery, departments);
      if (found) matchedDept = found;
    }

    let matchedCat = categories[0];
    if (catQuery) {
      const found = findCategory(catQuery, categories);
      if (found) matchedCat = found;
    }

    const errors: string[] = [];
    if (!courseCode) errors.push('Missing Course Code');
    if (!courseTitle) errors.push('Missing Course Title');
    if (!matchedDept) errors.push(`Unknown department "${deptQuery || 'None'}"`);

    return {
      rowIndex: rowNum,
      courseCode: courseCode.toUpperCase(),
      courseTitle,
      departmentCodeOrName: deptQuery,
      matchedDepartmentId: matchedDept?.id,
      matchedDepartmentName: matchedDept?.name,
      categoryCodeOrName: catQuery,
      matchedCategoryId: matchedCat?.id,
      matchedCategoryName: matchedCat?.name || 'Discipline Specific Core',
      credits,
      semester,
      theoryHours,
      practicalHours,
      isValid: errors.length === 0,
      errors
    };
  });

  const validCount = rows.filter(r => r.isValid).length;
  const errorCount = rows.filter(r => !r.isValid).length;

  return { rows, totalRows: rows.length, validCount, errorCount };
};

const downloadExcelWorkbook = async (wb: ExcelJS.Workbook, filename: string) => {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Download Student Enrollment Excel Template (.xlsx)
 */
export const downloadStudentExcelTemplate = async (
  departments: Department[],
  prefilledDeptName?: string
): Promise<void> => {
  const sampleDeptCode = prefilledDeptName
    ? (findDepartment(prefilledDeptName, departments)?.code || departments[0]?.code || 'CS')
    : (departments[0]?.code || 'CS');

  const wb = new ExcelJS.Workbook();

  const headers = [
    'Full Name',
    'University Register Number',
    'Roll Number',
    'Admission Number',
    'Email Address',
    'Mobile Number',
    'Date of Birth (DD/MM/YYYY)',
    'Current Semester (1-8)',
    'Admission Batch',
    'Department Name or Code',
    'Gender',
    'Blood Group',
    'Guardian Name',
    'Guardian Phone'
  ];

  const sampleRows: (string | number)[][] = [
    ['Aarav Menon', 'UOK26CS001', 'CS-01', 'ADM202601', 'aarav.menon@college.edu', '9876543210', '15/05/2005', 1, '2026-2030', sampleDeptCode, 'Male', 'O+', 'Rajesh Menon', '9876500001'],
    ['Ananya Nair', 'UOK26CS002', 'CS-02', 'ADM202602', 'ananya.nair@college.edu', '9876543211', '22/08/2005', 1, '2026-2030', sampleDeptCode, 'Female', 'A+', 'Gopal Nair', '9876500002'],
    ['Mohammed Fasil', 'UOK26CS003', 'CS-03', 'ADM202603', 'm.fasil@college.edu', '9876543212', '10/01/2005', 1, '2026-2030', sampleDeptCode, 'Male', 'B+', 'Kassim Fasil', '9876500003']
  ];

  const ws = wb.addWorksheet('Student_Enrollment_Template');
  ws.addRow(headers).font = { bold: true };
  sampleRows.forEach(r => ws.addRow(r.map(v => (typeof v === 'number' ? v : sanitizeSpreadsheetOutputCell(v)))));
  ws.columns = [22, 26, 14, 16, 28, 16, 24, 20, 16, 24, 12, 12, 20, 16].map(width => ({ width }));

  const wsDept = wb.addWorksheet('Valid_Departments_List');
  wsDept.addRow(['Department Code', 'Department Full Name', 'Department ID']).font = { bold: true };
  departments.forEach(d => wsDept.addRow([sanitizeSpreadsheetOutputCell(d.code), sanitizeSpreadsheetOutputCell(d.name), sanitizeSpreadsheetOutputCell(d.id)]));
  wsDept.columns = [18, 35, 30].map(width => ({ width }));

  const wsInst = wb.addWorksheet('Instructions_Read_First');
  wsInst.addRow(['Field Name', 'Required?', 'Description & Allowed Values']).font = { bold: true };
  const instructions = [
    ['Full Name', 'YES', 'Full official name of student as per 10th/12th certificate'],
    ['University Register Number', 'RECOMMENDED', 'Official University Register Number (e.g. UOK26CS001). If left blank, one will be generated.'],
    ['Roll Number', 'OPTIONAL', 'Class roll number (e.g. CS-01)'],
    ['Admission Number', 'OPTIONAL', 'College admission register number (e.g. ADM202601)'],
    ['Email Address', 'YES', 'Valid email for student portal access and communications'],
    ['Mobile Number', 'YES', '10-digit primary student contact number'],
    ['Date of Birth', 'RECOMMENDED', 'Format: DD/MM/YYYY or YYYY-MM-DD. Used for initial onboarding verification.'],
    ['Current Semester', 'YES', 'Integer from 1 to 8 (e.g. 1 for newly admitted FYUGP students)'],
    ['Admission Batch', 'YES', 'Academic batch year string, e.g. 2026-2030'],
    ['Department Name or Code', 'YES', 'Department code (e.g. CS, ENG, COMMERCE) or Full Name from the Valid_Departments_List tab.'],
    ['Gender', 'OPTIONAL', 'Male / Female / Other'],
    ['Blood Group', 'OPTIONAL', 'A+, A-, B+, B-, O+, O-, AB+, AB-'],
    ['Guardian Name', 'OPTIONAL', 'Parent or guardian full name'],
    ['Guardian Phone', 'OPTIONAL', 'Parent or guardian emergency contact phone number']
  ];
  instructions.forEach(r => wsInst.addRow(r));
  wsInst.columns = [28, 15, 70].map(width => ({ width }));

  await downloadExcelWorkbook(wb, 'NSS_Student_Enrollment_Bulk_Template.xlsx');
};

/**
 * Download Course / Subject Excel Template (.xlsx)
 */
export const downloadCourseExcelTemplate = async (
  departments: Department[],
  categories: CourseCategory[]
): Promise<void> => {
  const sampleDeptCode = departments[0]?.code || 'CS';
  const wb = new ExcelJS.Workbook();

  const headers = [
    'Course Code',
    'Course Title',
    'Department Code or Name',
    'Course Category',
    'Semester (1-8)',
    'Credits',
    'Theory Hours / Week',
    'Practical Hours / Week'
  ];

  const sampleRows: (string | number)[][] = [
    ['CS101', 'Foundations of Programming in Python', sampleDeptCode, 'Discipline Specific Core (Major)', 1, 4, 3, 2],
    ['CS102', 'Computer Systems Architecture', sampleDeptCode, 'Discipline Specific Core (Major)', 1, 4, 3, 0],
    ['MAT103', 'Discrete Mathematical Foundations', 'MATH', 'Discipline Specific Minor', 1, 3, 3, 0],
    ['ENG104', 'Professional Communication & Academic Writing', 'ENG', 'Ability Enhancement Course (AEC)', 1, 3, 3, 0],
    ['CS105', 'Web Development Fundamentals Lab', sampleDeptCode, 'Skill Enhancement Course (SEC)', 1, 2, 0, 4]
  ];

  const ws = wb.addWorksheet('Course_Add_Template');
  ws.addRow(headers).font = { bold: true };
  sampleRows.forEach(r => ws.addRow(r.map(v => (typeof v === 'number' ? v : sanitizeSpreadsheetOutputCell(v)))));
  ws.columns = [16, 40, 25, 32, 16, 12, 20, 22].map(width => ({ width }));

  const wsDept = wb.addWorksheet('Valid_Departments');
  wsDept.addRow(['Department Code', 'Department Full Name']).font = { bold: true };
  departments.forEach(d => wsDept.addRow([sanitizeSpreadsheetOutputCell(d.code), sanitizeSpreadsheetOutputCell(d.name)]));
  wsDept.columns = [18, 35].map(width => ({ width }));

  const wsCat = wb.addWorksheet('Valid_Course_Categories');
  wsCat.addRow(['Category Code', 'Category Full Name', 'Description']).font = { bold: true };
  categories.forEach(c =>
    wsCat.addRow([
      sanitizeSpreadsheetOutputCell(c.code),
      sanitizeSpreadsheetOutputCell(c.name),
      sanitizeSpreadsheetOutputCell(c.description || '')
    ])
  );
  wsCat.columns = [16, 35, 50].map(width => ({ width }));

  await downloadExcelWorkbook(wb, 'NSS_Course_Addition_Bulk_Template.xlsx');
};
