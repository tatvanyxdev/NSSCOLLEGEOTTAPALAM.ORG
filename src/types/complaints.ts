export type ComplaintScope = 'CAMPUS_WIDE' | 'DEPARTMENT_WISE';

export type StatutoryCategory =
  | 'ANTI_RAGGING'
  | 'ANTI_DRUG'
  | 'INFRASTRUCTURE'
  | 'WOMEN_ICC'
  | 'CAMPUS_ADMINISTRATION';

export type DepartmentCategory =
  | 'DEPT_ACADEMICS'
  | 'DEPT_LAB_EQUIPMENT'
  | 'DEPT_INTERNAL_MARKS'
  | 'DEPT_FACILITY_OTHER';

export type ComplaintCategory = StatutoryCategory | DepartmentCategory;

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_INVESTIGATION'
  | 'ACTION_TAKEN'
  | 'RESOLVED'
  | 'DISMISSED';

export type ComplaintUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface ActionNote {
  id: string;
  timestamp: string;
  author: string;
  role: string;
  note: string;
  isInternalOnly?: boolean;
}

export interface ComplaintRecord {
  id: string;
  ticketNumber: string; // e.g. GRV-2026-7842
  title: string;
  description: string;
  category: ComplaintCategory;
  scope: ComplaintScope;
  departmentId?: string; // Set when scope === 'DEPARTMENT_WISE'
  departmentName?: string;
  locationOnCampus?: string;
  incidentDate?: string;
  urgency: ComplaintUrgency;
  isAnonymous: boolean;
  complainantName?: string;
  complainantRole?: 'STUDENT' | 'FACULTY' | 'PARENT' | 'VISITOR' | 'ANONYMOUS';
  complainantAdmissionNo?: string;
  complainantPhone?: string;
  complainantEmail?: string;
  status: ComplaintStatus;
  actionNotes: ActionNote[];
  resolutionSummary?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  assignedOfficer?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface CategoryMetadata {
  id: ComplaintCategory;
  label: string;
  scope: ComplaintScope;
  description: string;
  authorityBadge: string;
  isConfidential: boolean;
  accessibleRoles: ('SUPER_ADMIN' | 'PRINCIPAL' | 'HOD')[];
}

export const CATEGORY_CONFIG: Record<ComplaintCategory, CategoryMetadata> = {
  ANTI_RAGGING: {
    id: 'ANTI_RAGGING',
    label: 'Anti-Ragging Cell (Statutory Whistleblower)',
    scope: 'CAMPUS_WIDE',
    description: 'Zero tolerance reporting for harassment, intimidation, or ragging on campus or hostels.',
    authorityBadge: 'Anti-Ragging Redressal Squad',
    isConfidential: true,
    accessibleRoles: ['SUPER_ADMIN', 'PRINCIPAL']
  },
  ANTI_DRUG: {
    id: 'ANTI_DRUG',
    label: 'Anti-Drug & Substance Abuse (Vimukthi / Nasha Mukt)',
    scope: 'CAMPUS_WIDE',
    description: 'Strictly confidential intelligence on drugs, illicit substances, or alcohol use.',
    authorityBadge: 'Vimukthi Anti-Drug Vigilance Cell',
    isConfidential: true,
    accessibleRoles: ['SUPER_ADMIN', 'PRINCIPAL']
  },
  INFRASTRUCTURE: {
    id: 'INFRASTRUCTURE',
    label: 'Campus Infrastructure & Maintenance',
    scope: 'CAMPUS_WIDE',
    description: 'Classrooms, benches, water coolers, sanitation/restrooms, Wi-Fi, electricity, canteen, sports grounds.',
    authorityBadge: 'Campus Infrastructure & Works Cell',
    isConfidential: false,
    accessibleRoles: ['SUPER_ADMIN', 'PRINCIPAL']
  },
  WOMEN_ICC: {
    id: 'WOMEN_ICC',
    label: 'Internal Complaints Committee (ICC / POSH)',
    scope: 'CAMPUS_WIDE',
    description: 'Gender sensitization, safety of female students and staff, POSH statutory grievance desk.',
    authorityBadge: 'Internal Complaints Committee (ICC)',
    isConfidential: true,
    accessibleRoles: ['SUPER_ADMIN', 'PRINCIPAL']
  },
  CAMPUS_ADMINISTRATION: {
    id: 'CAMPUS_ADMINISTRATION',
    label: 'General Administration & Student Services',
    scope: 'CAMPUS_WIDE',
    description: 'Office counter delays, scholarship certificate issuance, campus security, vehicle parking.',
    authorityBadge: 'Administrative Redressal Cell',
    isConfidential: false,
    accessibleRoles: ['SUPER_ADMIN', 'PRINCIPAL']
  },
  DEPT_ACADEMICS: {
    id: 'DEPT_ACADEMICS',
    label: 'Department Teaching & Academic Delivery',
    scope: 'DEPARTMENT_WISE',
    description: 'Curriculum coverage, timetable clash, lecture schedules, tutorial guidance.',
    authorityBadge: 'Academic Department Council',
    isConfidential: false,
    accessibleRoles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD']
  },
  DEPT_LAB_EQUIPMENT: {
    id: 'DEPT_LAB_EQUIPMENT',
    label: 'Department Laboratory & Practical Apparatus',
    scope: 'DEPARTMENT_WISE',
    description: 'Computer systems, lab chemicals, microscopes, darkroom, hardware malfunction.',
    authorityBadge: 'Department Laboratory Committee',
    isConfidential: false,
    accessibleRoles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD']
  },
  DEPT_INTERNAL_MARKS: {
    id: 'DEPT_INTERNAL_MARKS',
    label: 'Continuous Evaluation (CE) & Internal Assessment',
    scope: 'DEPARTMENT_WISE',
    description: 'Internal test mark totaling, assignment submission records, attendance calculation dispute.',
    authorityBadge: 'Continuous Evaluation Redressal',
    isConfidential: false,
    accessibleRoles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD']
  },
  DEPT_FACILITY_OTHER: {
    id: 'DEPT_FACILITY_OTHER',
    label: 'Department Seminar Hall & Departmental Affairs',
    scope: 'DEPARTMENT_WISE',
    description: 'Department seminar library, department notice board, department event coordination.',
    authorityBadge: 'Department Student Services',
    isConfidential: false,
    accessibleRoles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD']
  }
};
