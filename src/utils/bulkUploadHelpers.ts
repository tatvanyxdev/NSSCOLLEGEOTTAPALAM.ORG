import * as XLSX from 'xlsx';
import { Department, CourseCategory, Student, Course } from '../types';

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

/**
 * Standardize key strings for flexible Excel header matching
 */
const normalizeKey = (key: string): string => {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Find matching department by ID, code, or name (case-insensitive, trimmed)
 */
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

/**
 * Find matching course category by ID, code, or name
 */
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
 * Parse uploaded Student Excel/CSV file
 */
export const parseStudentExcelFile = async (
  file: File,
  departments: Department[],
  defaultDepartmentId?: string
): Promise<{ rows: ParsedStudentRow[]; totalRows: number; validCount: number; errorCount: number }> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const rows: ParsedStudentRow[] = rawRows.map((raw, idx) => {
    const rowNum = idx + 2; // account for header row
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      normalized[normalizeKey(k)] = String(v ?? '').trim();
    }

    // Extract values with various possible column header aliases
    const fullName =
      normalized['fullname'] ||
      normalized['studentname'] ||
      normalized['name'] ||
      normalized['candidatename'] ||
      '';

    const universityRegisterNumber =
      normalized['universityregisternumber'] ||
      normalized['universityregno'] ||
      normalized['registernumber'] ||
      normalized['regno'] ||
      normalized['uokregno'] ||
      normalized['kturegno'] ||
      '';

    const rollNumber =
      normalized['rollnumber'] ||
      normalized['rollno'] ||
      normalized['classrollno'] ||
      '';

    const admissionNumber =
      normalized['admissionnumber'] ||
      normalized['admissionno'] ||
      normalized['admno'] ||
      '';

    const email =
      normalized['email'] ||
      normalized['emailaddress'] ||
      normalized['studentemail'] ||
      '';

    const mobileNumber =
      normalized['mobilenumber'] ||
      normalized['mobile'] ||
      normalized['phone'] ||
      normalized['phonenumber'] ||
      normalized['contactnumber'] ||
      '';

    const dateOfBirth =
      normalized['dateofbirth'] ||
      normalized['dob'] ||
      normalized['birthdate'] ||
      '';

    const semesterRaw =
      normalized['currentsemester'] ||
      normalized['semester'] ||
      normalized['sem'] ||
      '1';
    const currentSemester = Math.max(1, Math.min(8, parseInt(semesterRaw, 10) || 1));

    const admissionBatch =
      normalized['admissionbatch'] ||
      normalized['batch'] ||
      normalized['academicbatch'] ||
      '2026-2030';

    const deptQuery =
      normalized['department'] ||
      normalized['departmentcode'] ||
      normalized['dept'] ||
      normalized['deptcode'] ||
      normalized['branch'] ||
      '';

    const gender =
      normalized['gender'] ||
      normalized['sex'] ||
      '';

    const bloodGroup =
      normalized['bloodgroup'] ||
      normalized['blood'] ||
      '';

    const guardianName =
      normalized['guardianname'] ||
      normalized['parentname'] ||
      normalized['fathername'] ||
      '';

    const guardianPhone =
      normalized['guardianphone'] ||
      normalized['parentphone'] ||
      normalized['emergencynumber'] ||
      '';

    const address =
      normalized['address'] ||
      normalized['residentialaddress'] ||
      '';

    // Resolve Department
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
 * Parse uploaded Course Excel/CSV file (SuperAdmin only)
 */
export const parseCourseExcelFile = async (
  file: File,
  departments: Department[],
  categories: CourseCategory[],
  defaultDepartmentId?: string
): Promise<{ rows: ParsedCourseRow[]; totalRows: number; validCount: number; errorCount: number }> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

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

    // Resolve Department
    let matchedDept = defaultDepartmentId
      ? departments.find(d => d.id === defaultDepartmentId)
      : undefined;

    if (deptQuery) {
      const found = findDepartment(deptQuery, departments);
      if (found) matchedDept = found;
    }

    // Resolve Category
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

/**
 * Download Student Enrollment Excel Template (.xlsx)
 */
export const downloadStudentExcelTemplate = (
  departments: Department[],
  prefilledDeptName?: string
) => {
  const sampleDept = prefilledDeptName || departments[0]?.name || 'Computer Science';
  const sampleDeptCode = departments[0]?.code || 'CS';

  // Sheet 1: Students Data Template
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

  const sampleRows = [
    [
      'Aarav Menon',
      'UOK26CS001',
      'CS-01',
      'ADM202601',
      'aarav.menon@college.edu',
      '9876543210',
      '15/05/2005',
      1,
      '2026-2030',
      sampleDeptCode,
      'Male',
      'O+',
      'Rajesh Menon',
      '9876500001'
    ],
    [
      'Ananya Nair',
      'UOK26CS002',
      'CS-02',
      'ADM202602',
      'ananya.nair@college.edu',
      '9876543211',
      '22/08/2005',
      1,
      '2026-2030',
      sampleDeptCode,
      'Female',
      'A+',
      'Gopal Nair',
      '9876500002'
    ],
    [
      'Mohammed Fasil',
      'UOK26CS003',
      'CS-03',
      'ADM202603',
      'm.fasil@college.edu',
      '9876543212',
      '10/01/2005',
      1,
      '2026-2030',
      sampleDeptCode,
      'Male',
      'B+',
      'Kassim Fasil',
      '9876500003'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 22 }, // Full Name
    { wch: 26 }, // University Reg
    { wch: 14 }, // Roll No
    { wch: 16 }, // Adm No
    { wch: 28 }, // Email
    { wch: 16 }, // Mobile
    { wch: 24 }, // DOB
    { wch: 20 }, // Semester
    { wch: 16 }, // Batch
    { wch: 24 }, // Dept
    { wch: 12 }, // Gender
    { wch: 12 }, // Blood
    { wch: 20 }, // Guardian
    { wch: 16 }  // Guardian Phone
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Student_Enrollment_Template');

  // Sheet 2: Department Reference List
  const deptRefHeaders = ['Department Code', 'Department Full Name', 'Department ID'];
  const deptRefRows = departments.map(d => [d.code, d.name, d.id]);
  const wsDept = XLSX.utils.aoa_to_sheet([deptRefHeaders, ...deptRefRows]);
  wsDept['!cols'] = [{ wch: 18 }, { wch: 35 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsDept, 'Valid_Departments_List');

  // Sheet 3: Field Guidelines
  const instructions = [
    ['Field Name', 'Required?', 'Description & Allowed Values'],
    ['Full Name', 'YES', 'Full official name of student as per 10th/12th certificate'],
    ['University Register Number', 'RECOMMENDED', 'Official University Register Number (e.g. UOK26CS001). If left blank, one will be generated.'],
    ['Roll Number', 'OPTIONAL', 'Class roll number (e.g. CS-01)'],
    ['Admission Number', 'OPTIONAL', 'College admission register number (e.g. ADM202601)'],
    ['Email Address', 'YES', 'Valid email for student portal access and communications'],
    ['Mobile Number', 'YES', '10-digit primary student contact number'],
    ['Date of Birth', 'RECOMMENDED', 'Format: DD/MM/YYYY or YYYY-MM-DD. Used for student default password formula!'],
    ['Current Semester', 'YES', 'Integer from 1 to 8 (e.g. 1 for newly admitted FYUGP students)'],
    ['Admission Batch', 'YES', 'Academic batch year string, e.g. 2026-2030'],
    ['Department Name or Code', 'YES', 'Department code (e.g. CS, ENG, COMMERCE) or Full Name from the Valid_Departments_List tab.'],
    ['Gender', 'OPTIONAL', 'Male / Female / Other'],
    ['Blood Group', 'OPTIONAL', 'A+, A-, B+, B-, O+, O-, AB+, AB-'],
    ['Guardian Name', 'OPTIONAL', 'Parent or guardian full name'],
    ['Guardian Phone', 'OPTIONAL', 'Parent or guardian emergency contact phone number']
  ];
  const wsInst = XLSX.utils.aoa_to_sheet(instructions);
  wsInst['!cols'] = [{ wch: 28 }, { wch: 15 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions_Read_First');

  XLSX.writeFile(wb, 'NSS_Student_Enrollment_Bulk_Template.xlsx');
};

/**
 * Download Course / Subject Excel Template (.xlsx) (SuperAdmin)
 */
export const downloadCourseExcelTemplate = (
  departments: Department[],
  categories: CourseCategory[]
) => {
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

  const sampleDeptCode = departments[0]?.code || 'CS';
  const sampleCatCode = categories[0]?.code || 'DSC';

  const sampleRows = [
    [
      'CS101',
      'Foundations of Programming in Python',
      sampleDeptCode,
      'Discipline Specific Core (Major)',
      1,
      4,
      3,
      2
    ],
    [
      'CS102',
      'Computer Systems Architecture',
      sampleDeptCode,
      'Discipline Specific Core (Major)',
      1,
      4,
      3,
      0
    ],
    [
      'MAT103',
      'Discrete Mathematical Foundations',
      'MATH',
      'Discipline Specific Minor',
      1,
      3,
      3,
      0
    ],
    [
      'ENG104',
      'Professional Communication & Academic Writing',
      'ENG',
      'Ability Enhancement Course (AEC)',
      1,
      3,
      3,
      0
    ],
    [
      'CS105',
      'Web Development Fundamentals Lab',
      sampleDeptCode,
      'Skill Enhancement Course (SEC)',
      1,
      2,
      0,
      4
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 16 }, // Course Code
    { wch: 40 }, // Course Title
    { wch: 25 }, // Dept Code/Name
    { wch: 32 }, // Course Category
    { wch: 16 }, // Semester
    { wch: 12 }, // Credits
    { wch: 20 }, // Theory Hours
    { wch: 22 }  // Practical Hours
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Course_Add_Template');

  // Sheet 2: Department List
  const deptHeaders = ['Department Code', 'Department Full Name'];
  const deptRows = departments.map(d => [d.code, d.name]);
  const wsDept = XLSX.utils.aoa_to_sheet([deptHeaders, ...deptRows]);
  wsDept['!cols'] = [{ wch: 18 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsDept, 'Valid_Departments');

  // Sheet 3: Category List
  const catHeaders = ['Category Code', 'Category Full Name', 'Description'];
  const catRows = categories.map(c => [c.code, c.name, c.description || '']);
  const wsCat = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
  wsCat['!cols'] = [{ wch: 16 }, { wch: 35 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsCat, 'Valid_Course_Categories');

  XLSX.writeFile(wb, 'NSS_Course_Addition_Bulk_Template.xlsx');
};
