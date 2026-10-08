-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - FYUGP COLLEGE ERP
-- Migration: 20260911_personalized_college_application_modules.sql
-- Description: Adds tables for Circulars with Read/Acknowledgement Tracking,
--              Student Leave & OD Requests, Student Certificate Requests,
--              Academic Calendar & Events, Academic Resources & Downloads,
--              Emergency & Institutional Alerts, and Timetable Change Alerts.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CIRCULARS WITH ACKNOWLEDGEMENT TRACKING
CREATE TABLE IF NOT EXISTS circulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  issuing_authority VARCHAR(150) NOT NULL,
  scope VARCHAR(50) NOT NULL DEFAULT 'COLLEGE',
  target_department_id UUID,
  target_programme_id UUID,
  target_batch_id UUID,
  target_semester INTEGER,
  target_roles TEXT[] DEFAULT '{"STUDENT", "TEACHER", "HOD"}',
  priority VARCHAR(20) DEFAULT 'NORMAL',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  attachment_name VARCHAR(255),
  attachment_url TEXT,
  requires_acknowledgement BOOLEAN DEFAULT false,
  acknowledged_student_ids TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. STUDENT LEAVE & OD REQUESTS
CREATE TABLE IF NOT EXISTS student_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'OD', -- OD, MEDICAL_LEAVE, AUTHORIZED_LEAVE
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  is_full_day BOOLEAN DEFAULT true,
  affected_period_ids TEXT[] DEFAULT '{}',
  reason TEXT NOT NULL,
  document_name VARCHAR(255),
  document_url TEXT,
  status VARCHAR(30) DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED
  reviewed_by_faculty_id UUID,
  reviewed_by_name VARCHAR(150),
  review_remarks TEXT,
  reviewed_at TIMESTAMPTZ,
  applied_to_attendance BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. STUDENT CERTIFICATE & SERVICE REQUESTS
CREATE TABLE IF NOT EXISTS student_certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  certificate_type VARCHAR(50) NOT NULL, -- BONAFIDE, CONDUCT, FEE_STRUCTURE, VERIFICATION
  purpose TEXT NOT NULL,
  number_of_copies INTEGER DEFAULT 1,
  status VARCHAR(30) DEFAULT 'SUBMITTED', -- SUBMITTED, PROCESSING, READY, COLLECTED, REJECTED
  processing_remarks TEXT,
  ready_date DATE,
  collected_date DATE,
  handled_by_staff_id UUID,
  handled_by_name VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. ACADEMIC CALENDAR & EVENTS
CREATE TABLE IF NOT EXISTS academic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL, -- INTERNAL_EXAM, UNIVERSITY_EXAM, HOLIDAY, SEMINAR, CULTURAL, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time VARCHAR(10),
  end_time VARCHAR(10),
  venue VARCHAR(150),
  scope VARCHAR(50) NOT NULL DEFAULT 'COLLEGE',
  department_id UUID,
  programme_id UUID,
  semester INTEGER,
  target_roles TEXT[] DEFAULT '{"STUDENT", "TEACHER", "HOD"}',
  is_holiday BOOLEAN DEFAULT false,
  color VARCHAR(20) DEFAULT '#2563eb',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. ACADEMIC RESOURCES & DOWNLOADS
CREATE TABLE IF NOT EXISTS academic_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- SYLLABUS, CALENDAR, REGULATIONS, FORMS, PREVIOUS_QP, etc.
  description TEXT,
  department_id UUID,
  programme_id UUID,
  semester INTEGER,
  course_id UUID,
  course_code VARCHAR(50),
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size VARCHAR(50) DEFAULT '1 MB',
  file_type VARCHAR(20) DEFAULT 'PDF',
  uploaded_by VARCHAR(100),
  uploaded_by_name VARCHAR(150),
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 6. EMERGENCY & IMPORTANT ALERTS
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- WEATHER_ALERT, CLASSES_SUSPENDED, EXAM_POSTPONED, etc.
  priority VARCHAR(20) DEFAULT 'HIGH',
  scope VARCHAR(50) DEFAULT 'COLLEGE',
  department_id UUID,
  start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expiry_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_by_name VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 7. TIMETABLE CHANGE ALERTS
CREATE TABLE IF NOT EXISTS timetable_change_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  period_id VARCHAR(50) NOT NULL,
  course_group_id UUID NOT NULL,
  change_type VARCHAR(50) NOT NULL, -- CANCELLED, SUBSTITUTE, ROOM_CHANGED, PERIOD_SWAP
  description TEXT NOT NULL,
  original_faculty_id UUID,
  original_faculty_name VARCHAR(150),
  substitute_faculty_id UUID,
  substitute_faculty_name VARCHAR(150),
  new_room VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 8. INDEXES FOR PERFORMANCE & AUDIENCE LOOKUPS
CREATE INDEX IF NOT EXISTS idx_circulars_scope ON circulars(scope, target_department_id);
CREATE INDEX IF NOT EXISTS idx_student_leave_student ON student_leave_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_student ON student_certificate_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_events_date ON academic_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_academic_resources_cat ON academic_resources(category, department_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_active ON emergency_alerts(is_active, expiry_time);

-- 9. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
