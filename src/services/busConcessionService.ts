import {
  BusConcessionApplication,
  BusConcessionSubject,
  BusConcessionStatus,
  SUBJECT_METADATA
} from '../types/busConcession';

const STORAGE_KEY = 'nss_bus_concession_real_records_v2';
const WEBHOOK_STORAGE_KEY = 'nss_bus_concession_sheets_webhook_url';
const WINDOW_STORAGE_KEY = 'nss_bus_concession_dept_window_status_v1';

export const CURRENT_ACADEMIC_YEAR = '2026-27';

export const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbwUsYbi-kx4riUvslgfxf9TWcUitMqRZVdtKcTxx65mrn7cBBaR3AbLWhRJ5HP3B6Pf/exec';
export const DEFAULT_DEPLOYMENT_ID =
  'AKfycbwUsYbi-kx4riUvslgfxf9TWcUitMqRZVdtKcTxx65mrn7cBBaR3AbLWhRJ5HP3B6Pf';

const ALLOWED_WEBHOOK_HOSTS = ['script.google.com', 'script.googleusercontent.com'];

export function validateAppsScriptWebhookUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL((rawUrl || '').trim());
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_WEBHOOK_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`))) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function sanitizeCsvField(val: unknown): string {
  let str = String(val ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

if (typeof window !== 'undefined') {
  window.addEventListener('nss-auth-logout', () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  });
}

export const GOOGLE_APPS_SCRIPT_SAMPLE_CODE = `// ====================================================================
// NSS COLLEGE OTTAPALAM - BUS CONCESSION GOOGLE SHEETS WEBHOOK
// Free Google Apps Script to auto-append student bus concession cards
// ====================================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Auto-create styled header row if empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Submission Time",
        "Admission No",
        "Student Name",
        "Date of Birth",
        "Guardian Name",
        "Permanent Address",
        "Department",
        "Subject / Programme",
        "Course Duration",
        "Starting Point (Origin)",
        "Ending Point (Destination)",
        "Distance (KM)",
        "Status",
        "HOD Remarks"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#991b1b"); // College Maroon
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
    
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.appliedAt || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.admissionNumber || "",
      data.studentName || "",
      data.dateOfBirth || "",
      data.guardianName || "",
      data.address || "",
      data.departmentName || "",
      data.subject || "",
      data.courseDuration || "",
      data.startingPoint || "",
      data.endingPoint || "",
      data.distanceKm || "",
      data.status || "SUBMITTED",
      data.hodRemarks || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Bus concession details saved successfully"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export const busConcessionService = {
  // Clean real records storage (starts empty with NO fake data)
  getAllApplications(): BusConcessionApplication[] {
    // Purge old fake data if present
    localStorage.removeItem('nss_bus_concession_records_v1');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getApplicationsByDepartment(departmentId: string): BusConcessionApplication[] {
    const all = this.getAllApplications();
    return all.filter((app) => app.departmentId === departmentId);
  },

  getApplicationsBySubject(subject: BusConcessionSubject): BusConcessionApplication[] {
    const all = this.getAllApplications();
    return all.filter((app) => app.subject === subject);
  },

  getStudentApplicationByAdmissionNo(
    admissionNumber: string,
    academicYear = CURRENT_ACADEMIC_YEAR
  ): BusConcessionApplication | undefined {
    if (!admissionNumber) return undefined;
    const all = this.getAllApplications();
    const cleanAdm = admissionNumber.trim().toUpperCase();
    return all.find(
      (app) =>
        app.admissionNumber.trim().toUpperCase() === cleanAdm &&
        (app.academicYear || CURRENT_ACADEMIC_YEAR) === academicYear
    );
  },

  hasStudentSubmittedThisYear(
    admissionNumber: string,
    academicYear = CURRENT_ACADEMIC_YEAR
  ): boolean {
    return !!this.getStudentApplicationByAdmissionNo(admissionNumber, academicYear);
  },

  // =========================================================================
  // APPLICATION WINDOW OPEN / CLOSE MANAGEMENT (Controlled by HOD / Admin)
  // =========================================================================
  getDepartmentWindowStatusMap(): Record<string, boolean> {
    const raw = localStorage.getItem(WINDOW_STORAGE_KEY);
    if (!raw) {
      // Default: window is open for academic departments so testing is available, but HOD can toggle anytime
      return {
        'dept-eco': true,
        'dept-eng': true,
        'dept-hin': true,
        'dept-his': true,
        'dept-mal': true,
        'dept-com': true,
        'dept-bot': true,
        'dept-che': true,
        'dept-cs': true,
        'dept-ic': true,
        'dept-mat': true,
        'dept-phy': true,
        'dept-zoo': true
      };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  isDepartmentWindowOpen(departmentId: string): boolean {
    const map = this.getDepartmentWindowStatusMap();
    if (map[departmentId] !== undefined) {
      return map[departmentId];
    }
    return true; // Default open unless explicitly closed by HOD
  },

  setDepartmentWindowOpen(departmentId: string, isOpen: boolean): void {
    const map = this.getDepartmentWindowStatusMap();
    map[departmentId] = isOpen;
    localStorage.setItem(WINDOW_STORAGE_KEY, JSON.stringify(map));
  },

  setAllDepartmentWindows(isOpen: boolean): void {
    const map = this.getDepartmentWindowStatusMap();
    Object.keys(map).forEach((k) => {
      map[k] = isOpen;
    });
    localStorage.setItem(WINDOW_STORAGE_KEY, JSON.stringify(map));
  },

  // =========================================================================
  // SUBMISSION (STRICT ONE TIME PER USER A YEAR + WINDOW CHECK)
  // =========================================================================
  async submitApplication(
    data: Omit<
      BusConcessionApplication,
      'id' | 'departmentId' | 'status' | 'appliedAt' | 'academicYear'
    >
  ): Promise<{
    success: boolean;
    application: BusConcessionApplication;
    googleSheetsSynced: boolean;
  }> {
    const cleanAdmission = data.admissionNumber.trim().toUpperCase();
    if (!cleanAdmission) {
      throw new Error('Admission number is required.');
    }

    // 1. Check if application window is open for this department
    const metadata = SUBJECT_METADATA[data.subject];
    const deptId = metadata ? metadata.departmentId : 'dept-gen';
    const isOpen = this.isDepartmentWindowOpen(deptId);
    if (!isOpen) {
      throw new Error(
        `Bus Concession applications for ${data.subject} are currently closed by the Head of Department.`
      );
    }

    // 2. Strict One-Time Per Year check
    const existingForYear = this.getStudentApplicationByAdmissionNo(
      cleanAdmission,
      CURRENT_ACADEMIC_YEAR
    );
    if (existingForYear) {
      throw new Error(
        `An application has already been submitted for Admission Number ${cleanAdmission} for the Academic Year ${CURRENT_ACADEMIC_YEAR}. Only one submission per student is allowed per year.`
      );
    }

    const randomSuffix = typeof crypto !== 'undefined' && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(16).padStart(2, '0')).join('')
      : Date.now().toString(36);

    const newApp: BusConcessionApplication = {
      ...data,
      admissionNumber: cleanAdmission,
      id: `concession-${Date.now()}-${randomSuffix}`,
      departmentId: (data as any).departmentId || deptId,
      departmentName: (data as any).departmentName || metadata?.departmentName || 'Department of Physics',
      status: 'SUBMITTED',
      appliedAt: new Date().toISOString(),
      academicYear: CURRENT_ACADEMIC_YEAR
    };

    const existing = this.getAllApplications();
    const updated = [newApp, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 3. Sync to verified HTTPS Google Apps Script Webhook
    let googleSheetsSynced = false;
    const webhookUrl = validateAppsScriptWebhookUrl(this.getSheetsWebhookUrl());
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(newApp)
        });
        googleSheetsSynced = true;
      } catch (err) {
        console.warn('Google Sheets Webhook Push Error (non-blocking):', err);
      }
    }

    return { success: true, application: newApp, googleSheetsSynced };
  },

  updateApplicationStatus(
    id: string,
    status: BusConcessionStatus,
    verifierName?: string,
    remarks?: string
  ): BusConcessionApplication | null {
    const existing = this.getAllApplications();
    const index = existing.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const item = existing[index];
    item.status = status;
    if (status === 'VERIFIED_BY_HOD' || status === 'APPROVED_BY_PRINCIPAL') {
      item.verifiedAt = new Date().toISOString();
      if (verifierName) item.verifiedBy = verifierName;
      if (remarks) item.hodRemarks = remarks;
    } else if (status === 'REJECTED') {
      if (remarks) item.rejectionReason = remarks;
    }

    existing[index] = item;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return item;
  },

  getSheetsWebhookUrl(): string {
    const stored = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    const validated = stored ? validateAppsScriptWebhookUrl(stored) : null;
    return validated || DEFAULT_WEBHOOK_URL;
  },

  getDeploymentId(): string {
    return DEFAULT_DEPLOYMENT_ID;
  },

  setSheetsWebhookUrl(url: string): void {
    const validated = validateAppsScriptWebhookUrl(url);
    if (!validated) {
      throw new Error('Only verified HTTPS Google Apps Script (script.google.com) webhook URLs are permitted.');
    }
    localStorage.setItem(WEBHOOK_STORAGE_KEY, validated);
  },

  clearLocalCache(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  async testSheetsWebhook(url: string): Promise<{ success: boolean; message: string }> {
    const validated = validateAppsScriptWebhookUrl(url);
    if (!validated) {
      return {
        success: false,
        message: 'Invalid webhook URL: Only verified HTTPS script.google.com endpoints are allowed.'
      };
    }

    try {
      const testPayload = {
        appliedAt: new Date().toISOString(),
        admissionNumber: 'PING-TEST',
        studentName: 'NSS Ottapalam Test Verification',
        dateOfBirth: '2005-01-01',
        guardianName: 'Verification System',
        address: 'Palappuram P.O, Ottapalam, Kerala',
        subject: 'B.Sc. Computer Science',
        courseDuration: 'UG Four Year',
        startingPoint: 'Ottapalam Bus Stand',
        endingPoint: 'NSS College Ottapalam',
        distanceKm: 4.5,
        departmentName: 'Department of Computer Science',
        status: 'TEST_PING',
        hodRemarks: 'Live Google Sheets webhook connection confirmed'
      };

      await fetch(validated, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(testPayload)
      });

      return {
        success: true,
        message:
          'Ping signal successfully transmitted to your Google Sheet! Check your Google Sheet for the test row.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection failed: ${err.message || 'Network error'}`
      };
    }
  },

  exportToCsv(
    applications: BusConcessionApplication[],
    filenamePrefix = 'NSS_College_Ottapalam_Bus_Concessions'
  ): void {
    const list = applications;
    const headers = [
      'Sl No',
      'Admission Number',
      'Student Name',
      'Date of Birth',
      'Guardian Name',
      'Address',
      'Department',
      'Subject / Programme',
      'Course Duration',
      'Starting Point',
      'Ending Point',
      'Distance (KM)',
      'Application Status',
      'Applied Date',
      'Verified By',
      'HOD Remarks'
    ];

    const rows = list.map((app, idx) => [
      idx + 1,
      sanitizeCsvField(app.admissionNumber),
      sanitizeCsvField(app.studentName),
      sanitizeCsvField(app.dateOfBirth),
      sanitizeCsvField(app.guardianName),
      sanitizeCsvField(app.address),
      sanitizeCsvField(app.departmentName || SUBJECT_METADATA[app.subject]?.departmentName || ''),
      sanitizeCsvField(app.subject),
      sanitizeCsvField(app.courseDuration),
      sanitizeCsvField(app.startingPoint),
      sanitizeCsvField(app.endingPoint),
      app.distanceKm,
      sanitizeCsvField(app.status),
      sanitizeCsvField(new Date(app.appliedAt).toLocaleDateString('en-IN')),
      sanitizeCsvField(app.verifiedBy || ''),
      sanitizeCsvField(app.hodRemarks || app.rejectionReason || '')
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
