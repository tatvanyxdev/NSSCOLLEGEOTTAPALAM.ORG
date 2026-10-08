import {
  Circular,
  StudentLeaveRequest,
  StudentCertificateRequest,
  AcademicCalendarEvent,
  AcademicResource,
  EmergencyAlert,
  TimetableChangeAlert
} from '../types';

// The application starts with real data only. Empty states are displayed when no data exists.
export const initialCirculars: Circular[] = [];

export const initialLeaveRequests: StudentLeaveRequest[] = [];

export const initialCertificateRequests: StudentCertificateRequest[] = [];

export const initialAcademicEvents: AcademicCalendarEvent[] = [];

export const initialAcademicResources: AcademicResource[] = [];

export const initialEmergencyAlerts: EmergencyAlert[] = [];

export const initialTimetableChangeAlerts: TimetableChangeAlert[] = [];
