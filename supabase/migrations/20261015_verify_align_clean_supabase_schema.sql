-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - SUPABASE COMPREHENSIVE ALIGNMENT & VERIFICATION SCRIPT
-- Purpose:
--   1. Ensures all tables, columns, types, and constraints match the frontend app.
--   2. Ensures employee_id & employee_code in faculty are NULLABLE (optional for HOD).
--   3. Purges any legacy test / demo / seed rows to ensure a 100% clean production state.
--   4. Grants required permissions and reloads the PostgREST schema cache.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES (IF NOT ALREADY EXISTING)
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM (
    'SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER', 
    'CLASS_TUTOR', 'COURSE_COORDINATOR', 'ATTENDANCE_COORDINATOR', 
    'OFFICE_STAFF', 'STUDENT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE programme_type_enum AS ENUM ('UG', 'PG', 'DIPLOMA', 'CERTIFICATE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'ABSENT', 'OD', 'MEDICAL_LEAVE', 'APPROVED_LEAVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. ENSURE ALL TABLES EXIST WITH BASE SCHEMA
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name VARCHAR(255) NOT NULL DEFAULT 'NSS COLLEGE OTTAPALAM',
  college_code VARCHAR(50) NOT NULL DEFAULT 'NSS-OTP-1961',
  affiliation VARCHAR(255) DEFAULT 'Affiliated to University of Calicut',
  accreditation VARCHAR(255) DEFAULT 'Accredited with ''A'' Grade by NAAC',
  address TEXT DEFAULT 'NSS College, Ottapalam, Palakkad District, Kerala - 679103',
  contact_email VARCHAR(255) DEFAULT 'nsscollegeottapalam@gmail.com',
  contact_phone VARCHAR(50) DEFAULT '+91 466 2244382',
  active_academic_year VARCHAR(50) DEFAULT '2026-27',
  active_semester VARCHAR(50) DEFAULT 'Semester 1',
  min_attendance_percentage NUMERIC(5,2) DEFAULT 75.00,
  warning_attendance_percentage NUMERIC(5,2) DEFAULT 70.00,
  attendance_correction_window_hours INT DEFAULT 24,
  allow_teacher_direct_edit BOOLEAN DEFAULT false,
  require_hod_approval_for_correction BOOLEAN DEFAULT true,
  working_days TEXT[] DEFAULT ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  enable_student_portal BOOLEAN DEFAULT true,
  enable_faculty_portal BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'ACADEMIC',
  hod_faculty_id UUID,
  is_active BOOLEAN DEFAULT true,
  established_year INT DEFAULT 1961,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'UG',
  duration_years INT NOT NULL DEFAULT 4,
  total_semesters INT NOT NULL DEFAULT 8,
  expected_strength INT DEFAULT 50,
  max_strength INT DEFAULT 60,
  admitted_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color_hex VARCHAR(20) DEFAULT '#2563eb',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code VARCHAR(50) UNIQUE NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES course_categories(id) ON DELETE RESTRICT,
  credits INT NOT NULL DEFAULT 4,
  lecture_hours INT NOT NULL DEFAULT 3,
  practical_hours INT NOT NULL DEFAULT 0,
  total_contact_hours INT NOT NULL DEFAULT 60,
  default_semester INT NOT NULL DEFAULT 1,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS course_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  academic_year VARCHAR(50) NOT NULL,
  semester_number INT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  coordinator_faculty_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS course_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  group_name VARCHAR(100) NOT NULL DEFAULT 'Group A',
  capacity INT DEFAULT 60,
  expected_strength INT DEFAULT 50,
  room VARCHAR(100) DEFAULT 'Room 101',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- FACULTY: Ensure employee_id & employee_code are NULLABLE (optional for HOD)
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  employee_id VARCHAR(100),
  employee_code VARCHAR(100),
  full_name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  designation VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor',
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile_number VARCHAR(50),
  profile_image_url TEXT,
  roles TEXT[] NOT NULL DEFAULT ARRAY['TEACHER'],
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  qualification VARCHAR(255),
  username VARCHAR(100),
  password VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- CRITICAL FIX: Make sure employee_id and employee_code are NOT constrained by NOT NULL
ALTER TABLE faculty ALTER COLUMN employee_id DROP NOT NULL;
ALTER TABLE faculty ALTER COLUMN employee_code DROP NOT NULL;

-- Make sure additional columns exist on faculty table
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_code VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['TEACHER'];
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  admission_number VARCHAR(100) UNIQUE NOT NULL,
  university_register_number VARCHAR(100),
  roll_number VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  preferred_name VARCHAR(100),
  username VARCHAR(100),
  password VARCHAR(255),
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  home_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  admission_academic_year VARCHAR(50) NOT NULL DEFAULT '2026-27',
  admission_batch VARCHAR(50) NOT NULL DEFAULT '2026',
  current_semester INT NOT NULL DEFAULT 1,
  year_of_study INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  student_status VARCHAR(50) DEFAULT 'ACTIVE',
  email VARCHAR(255),
  mobile_number VARCHAR(50),
  phone VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(20) DEFAULT 'OTHER',
  blood_group VARCHAR(10),
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(50),
  address TEXT,
  profile_photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE students ADD COLUMN IF NOT EXISTS university_register_number VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS home_department_id UUID;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE students ALTER COLUMN programme_id DROP NOT NULL;
ALTER TABLE students ALTER COLUMN home_department_id DROP NOT NULL;
ALTER TABLE students ALTER COLUMN department_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS faculty_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  assignment_role VARCHAR(50) NOT NULL DEFAULT 'PRIMARY',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS student_course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  course_category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL,
  registration_status VARCHAR(50) DEFAULT 'REGISTERED',
  registration_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, course_offering_id)
);

CREATE TABLE IF NOT EXISTS timetable_periods (
  id VARCHAR(50) PRIMARY KEY,
  period_number INT NOT NULL,
  label VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_break BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  day_of_week VARCHAR(20) NOT NULL,
  period_id VARCHAR(50) NOT NULL,
  room VARCHAR(100),
  effective_start_date DATE DEFAULT CURRENT_DATE,
  effective_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_id VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  topic_covered TEXT,
  session_type VARCHAR(50) DEFAULT 'REGULAR',
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  attendance_submitted BOOLEAN DEFAULT false,
  submitted_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PRESENT',
  marked_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  marked_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  remarks TEXT,
  UNIQUE(class_session_id, student_id)
);

CREATE TABLE IF NOT EXISTS attendance_correction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  requested_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  previous_status VARCHAR(50) NOT NULL,
  requested_status VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  reviewed_by_hod_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  hod_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS special_attendance_events (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL,
  event_date DATE NOT NULL,
  period_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_full_day BOOLEAN DEFAULT false,
  scope_type VARCHAR(50) NOT NULL DEFAULT 'DEPARTMENT',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  student_coverage VARCHAR(50) DEFAULT 'ALL_ELIGIBLE',
  selected_student_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  reason TEXT NOT NULL,
  duty_certificate_ref TEXT,
  forwarded_by_hod_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  forwarded_by_hod_name VARCHAR(255),
  forwarded_at TIMESTAMPTZ,
  approved_by UUID,
  approved_by_name VARCHAR(255),
  principal_remarks TEXT,
  principal_action_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PRINCIPAL_APPROVAL',
  created_by UUID,
  created_by_name VARCHAR(255),
  created_by_role VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS special_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(100) REFERENCES special_attendance_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period_id VARCHAR(50),
  status VARCHAR(50) DEFAULT 'OD',
  marked_by UUID,
  marked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  message TEXT,
  author_name VARCHAR(255) DEFAULT 'College Administration',
  target_audience VARCHAR(100) DEFAULT 'ALL',
  priority VARCHAR(50) DEFAULT 'NORMAL',
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_name VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS daily_schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  override_type VARCHAR(50) NOT NULL,
  day_template VARCHAR(20),
  affected_scope VARCHAR(50) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  period_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  reason TEXT NOT NULL,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS class_tutor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  programme_id UUID REFERENCES programmes(id) ON DELETE CASCADE,
  admission_batch VARCHAR(50) NOT NULL,
  semester_number INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS circulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  issuing_authority VARCHAR(255) DEFAULT 'Office of Principal',
  scope VARCHAR(50) DEFAULT 'COLLEGE',
  target_department_id UUID,
  target_programme_id UUID,
  target_batch_id VARCHAR(50),
  target_semester INT,
  target_roles TEXT[] DEFAULT ARRAY['STUDENT', 'TEACHER', 'HOD'],
  priority VARCHAR(50) DEFAULT 'NORMAL',
  effective_from DATE,
  effective_until DATE,
  attachment_name VARCHAR(255),
  attachment_url TEXT,
  requires_acknowledgement BOOLEAN DEFAULT false,
  acknowledged_student_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS student_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING_TUTOR',
  applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS student_certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  certificate_type VARCHAR(100) NOT NULL,
  purpose TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING_OFFICE',
  applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. CLEAN UP ALL DEMO / TEST DATA FROM SUPABASE (cast id to text to support both UUID and VARCHAR types)
DELETE FROM announcements WHERE id::text LIKE 'demo%' OR id::text LIKE 'push-seed%' OR title ILIKE '%demo%' OR title ILIKE '%test%';
DELETE FROM special_attendance_events WHERE id::text LIKE 'spec-event-union-%' OR id::text LIKE '%demo%' OR id::text LIKE '%test%';
DELETE FROM faculty WHERE (employee_id IS NOT NULL AND employee_id LIKE 'DEMO%') OR full_name ILIKE '%Demo%' OR full_name ILIKE '%Test Faculty%';
DELETE FROM students WHERE admission_number LIKE 'DEMO%' OR roll_number LIKE 'DEMO%' OR full_name ILIKE '%Demo Student%';

-- 5. ROW LEVEL SECURITY & OPEN PERMISSIVE GRANTS FOR DEV/SERVICE CLIENT
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'system_settings', 'departments', 'programmes', 'course_categories',
    'courses', 'course_offerings', 'course_groups', 'faculty',
    'students', 'faculty_course_assignments', 'student_course_registrations',
    'timetable_periods', 'timetable_entries', 'class_sessions',
    'attendance_records', 'attendance_correction_requests',
    'special_attendance_events', 'special_attendance_records',
    'announcements', 'audit_logs', 'daily_schedule_overrides',
    'class_tutor_assignments', 'circulars', 'student_leave_requests',
    'student_certificate_requests'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_anon_all_access', tbl);
      EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO public USING (true) WITH CHECK (true)', tbl || '_anon_all_access', tbl);
      EXECUTE format('GRANT ALL ON TABLE %I TO anon, authenticated, service_role', tbl);
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- 6. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- 7. AUDIT & VERIFICATION QUERY (Run this SELECT to verify all tables)
-- ==============================================================================
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
  has_table_privilege('anon', 'public.' || table_name, 'SELECT') as anon_can_select,
  has_table_privilege('anon', 'public.' || table_name, 'INSERT') as anon_can_insert
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
