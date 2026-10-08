export const BUS_CONCESSION_SUBJECTS = [
  'B.A. Economics',
  'B.A. English',
  'B.A. Hindi',
  'B.A. History',
  'B.A. Malayalam',
  'B.Com',
  'B.Sc. Botany',
  'B.Sc. Maths',
  'B.Sc. Zoology',
  'B.Sc. Chemistry',
  'B.Sc. Computer Science',
  'B.Sc. Industrial Chemistry',
  'B.Sc. Physics',
  'M.A. Economics',
  'M.A. English',
  'M.Sc. Computer Science',
  'M.Sc. Maths',
  'M.Sc. Physics',
  'M.Com'
] as const;

export type BusConcessionSubject = typeof BUS_CONCESSION_SUBJECTS[number];

export type BusConcessionDuration = 'UG Four Year' | 'PG Two Year';

export type BusConcessionStatus =
  | 'SUBMITTED'
  | 'VERIFIED_BY_HOD'
  | 'APPROVED_BY_PRINCIPAL'
  | 'REJECTED';

export interface BusConcessionApplication {
  id: string;
  studentName: string;
  admissionNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  guardianName: string;
  address: string;
  subject: BusConcessionSubject;
  departmentId: string;
  departmentName?: string;
  courseDuration: BusConcessionDuration;
  startingPoint: string;
  endingPoint: string;
  distanceKm: number;
  busOperatorType?: 'KSRTC' | 'PRIVATE' | 'BOTH';
  status: BusConcessionStatus;
  appliedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  hodRemarks?: string;
  rejectionReason?: string;
  academicYear: string;
  studentPhone?: string;
}

export interface SubjectDepartmentInfo {
  departmentId: string;
  departmentName: string;
  hodName: string;
  defaultDuration: BusConcessionDuration;
}

export const SUBJECT_METADATA: Record<BusConcessionSubject, SubjectDepartmentInfo> = {
  'B.A. Economics': {
    departmentId: 'dept-eco',
    departmentName: 'Department of Economics',
    hodName: 'Dr. S. Radhakrishnan',
    defaultDuration: 'UG Four Year'
  },
  'B.A. English': {
    departmentId: 'dept-eng',
    departmentName: 'Department of English',
    hodName: 'Prof. Anitha Menon',
    defaultDuration: 'UG Four Year'
  },
  'B.A. Hindi': {
    departmentId: 'dept-hin',
    departmentName: 'Department of Hindi',
    hodName: 'Dr. Manoj Kumar P',
    defaultDuration: 'UG Four Year'
  },
  'B.A. History': {
    departmentId: 'dept-his',
    departmentName: 'Department of History',
    hodName: 'Dr. Girija K',
    defaultDuration: 'UG Four Year'
  },
  'B.A. Malayalam': {
    departmentId: 'dept-mal',
    departmentName: 'Department of Malayalam',
    hodName: 'Dr. Unnikrishnan V',
    defaultDuration: 'UG Four Year'
  },
  'B.Com': {
    departmentId: 'dept-com',
    departmentName: 'Department of Commerce & Management',
    hodName: 'Dr. K. Jayasree',
    defaultDuration: 'UG Four Year'
  },
  'B.Sc. Botany': {
    departmentId: 'dept-bot',
    departmentName: 'Department of Botany',
    hodName: 'Dr. Bindu R',
    defaultDuration: 'UG Four Year'
  },
  'B.Sc. Maths': {
    departmentId: 'dept-mat',
    departmentName: 'Department of Mathematics',
    hodName: 'Dr. Vinod P. R',
    defaultDuration: 'UG Four Year'
  },
  'B.Sc. Zoology': {
    departmentId: 'dept-zoo',
    departmentName: 'Department of Zoology',
    hodName: 'Dr. Deepa S',
    defaultDuration: 'UG Four Year'
  },
  'B.Sc. Chemistry': {
    departmentId: 'dept-che',
    departmentName: 'Department of Chemistry',
    hodName: 'Dr. Pradeep Kumar',
    defaultDuration: 'UG Four Year'
  },
  'B.Sc. Computer Science': {
    departmentId: 'dept-cs',
    departmentName: 'Department of Computer Science',
    hodName: 'Dr. Sunitha Balan',
    defaultDuration: 'UG Four Year'
  },
  'B.Sc. Industrial Chemistry': {
    departmentId: 'dept-ic',
    departmentName: 'Department of Industrial Chemistry',
    hodName: 'Dr. Rekha C. Nair',
    defaultDuration: 'UG Four Year'
  },
  'B.Sc. Physics': {
    departmentId: 'dept-phy',
    departmentName: 'Department of Physics',
    hodName: 'Dr. Suresh Babu T',
    defaultDuration: 'UG Four Year'
  },
  'M.A. Economics': {
    departmentId: 'dept-eco',
    departmentName: 'Department of Economics',
    hodName: 'Dr. S. Radhakrishnan',
    defaultDuration: 'PG Two Year'
  },
  'M.A. English': {
    departmentId: 'dept-eng',
    departmentName: 'Department of English',
    hodName: 'Prof. Anitha Menon',
    defaultDuration: 'PG Two Year'
  },
  'M.Sc. Computer Science': {
    departmentId: 'dept-cs',
    departmentName: 'Department of Computer Science',
    hodName: 'Dr. Sunitha Balan',
    defaultDuration: 'PG Two Year'
  },
  'M.Sc. Maths': {
    departmentId: 'dept-mat',
    departmentName: 'Department of Mathematics',
    hodName: 'Dr. Vinod P. R',
    defaultDuration: 'PG Two Year'
  },
  'M.Sc. Physics': {
    departmentId: 'dept-phy',
    departmentName: 'Department of Physics',
    hodName: 'Dr. Suresh Babu T',
    defaultDuration: 'PG Two Year'
  },
  'M.Com': {
    departmentId: 'dept-com',
    departmentName: 'Department of Commerce & Management',
    hodName: 'Dr. K. Jayasree',
    defaultDuration: 'PG Two Year'
  }
};
