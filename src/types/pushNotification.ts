export type PushSenderRole = 'PRINCIPAL' | 'HOD' | 'SUPER_ADMIN';

export type PushTargetAudience = 
  | 'ALL_CAMPUS'           // All students, faculty, staff
  | 'ALL_STUDENTS'         // All enrolled students
  | 'ALL_FACULTY'          // All teaching faculty & staff
  | 'ALL_HODS'             // All department heads
  | 'MY_DEPARTMENT'        // All students & faculty in sender's department
  | 'DEPARTMENT_STUDENTS'  // Students only in specified department
  | 'DEPARTMENT_FACULTY'   // Faculty only in specified department
  | 'SPECIFIC_DEPARTMENT'; // Target a chosen department

export type PushPriority = 'NORMAL' | 'HIGH' | 'EMERGENCY';

export type PushCategory = 
  | 'GENERAL'              // General circular or notice
  | 'ACADEMIC'             // Curriculum, timetable, syllabus
  | 'EXAM'                 // Internal marks, university exam schedule
  | 'EMERGENCY'            // Weather, campus closure, security, urgent alert
  | 'EVENT'                // College day, seminar, arts festival, sports
  | 'MAINTENANCE';         // System maintenance, infrastructure repair

export interface PushNotificationMessage {
  id: string;
  title: string;
  body: string;
  senderRole: PushSenderRole;
  senderName: string;
  senderDepartmentId?: string;
  senderDepartmentName?: string;
  targetAudience: PushTargetAudience;
  targetDepartmentId?: string;
  targetDepartmentName?: string;
  targetBatch?: string; // e.g. 'ALL', 'UG_S1_S2', 'UG_S3_S4', 'PG'
  priority: PushPriority;
  category: PushCategory;
  actionUrl?: string;
  createdAt: string;       // ISO string
  deliveredCount?: number;
}

export interface SendPushNotificationPayload {
  title: string;
  body: string;
  senderRole: PushSenderRole;
  senderName: string;
  senderDepartmentId?: string;
  senderDepartmentName?: string;
  targetAudience: PushTargetAudience;
  targetDepartmentId?: string;
  targetDepartmentName?: string;
  targetBatch?: string;
  priority: PushPriority;
  category: PushCategory;
  actionUrl?: string;
}
