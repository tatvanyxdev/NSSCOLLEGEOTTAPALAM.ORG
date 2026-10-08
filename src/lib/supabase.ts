import { createClient } from '@supabase/supabase-js';

// Configuration: uses environment variables if present, falling back to the configured project credentials
const metaEnv = (import.meta as any).env || {};
export const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || 'https://jpirkjbqirkwsmesusqa.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_axxVDb7f0ftRbdCkeXiluw_oBtS9Clb';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_URL.includes('your-project')
);

// Create Supabase Client instance
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);


/**
 * Generates the complete, production-grade PostgreSQL SQL schema for Supabase
 * including FYUGP multi-programme tables, constraints, Row-Level Security (RLS) policies,
 * indexes, and seed statements for NSS COLLEGE OTTAPALAM.
 */
export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - FYUGP COLLEGE ERP DATABASE SCHEMA
-- Target Database: PostgreSQL / Supabase
-- Features: FYUGP Multi-Disciplinary Course Architecture, Attendance, RLS, Audit Logs
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
CREATE TYPE user_role_enum AS ENUM (
  'SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER', 
  'CLASS_TUTOR', 'COURSE_COORDINATOR', 'ATTENDANCE_COORDINATOR', 
  'OFFICE_STAFF', 'STUDENT'
);

CREATE TYPE programme_type_enum AS ENUM ('UG', 'PG', 'DIPLOMA', 'CERTIFICATE');
CREATE TYPE student_status_enum AS ENUM ('ACTIVE', 'GRADUATED', 'DROPOUT', 'TRANSFERRED', 'SUSPENDED', 'DISCONTINUED');
CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'ABSENT', 'OD', 'MEDICAL_LEAVE', 'APPROVED_LEAVE');
CREATE TYPE assignment_role_enum AS ENUM ('PRIMARY', 'SECONDARY', 'CO_TEACHER', 'SUBSTITUTE', 'COORDINATOR');
CREATE TYPE correction_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 3. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'ACADEMIC',
  hod_faculty_id UUID,
  is_active BOOLEAN DEFAULT true,
  established_year INT DEFAULT 1961,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. PROGRAMMES (UG & PG)
CREATE TABLE IF NOT EXISTS programmes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  type programme_type_enum NOT NULL DEFAULT 'UG',
  duration_years INT NOT NULL DEFAULT 4,
  total_semesters INT NOT NULL DEFAULT 8,
  expected_strength INT DEFAULT 50,
  max_strength INT DEFAULT 60,
  admitted_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. COURSE CATEGORIES (FYUGP: Major, Minor, MDC, AEC, SEC, VAC)
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color_hex VARCHAR(20) DEFAULT '#2563eb',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. MASTER COURSES
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. COURSE OFFERINGS
CREATE TABLE IF NOT EXISTS course_offerings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
  academic_year VARCHAR(50) NOT NULL,
  semester_number INT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  coordinator_faculty_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. COURSE GROUPS (FYUGP Cohort & Room Allocations)
CREATE TABLE IF NOT EXISTS course_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  group_name VARCHAR(100) NOT NULL DEFAULT 'Group A',
  capacity INT DEFAULT 60,
  expected_strength INT DEFAULT 50,
  room VARCHAR(100) DEFAULT 'Room 101',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. FACULTY MASTER
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  designation VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  profile_image_url TEXT,
  roles TEXT[] NOT NULL DEFAULT ARRAY['TEACHER'],
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  qualification VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. FACULTY COURSE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS faculty_course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  assignment_role assignment_role_enum NOT NULL DEFAULT 'PRIMARY',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 12. STUDENTS MASTER
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admission_number VARCHAR(100) UNIQUE NOT NULL,
  university_register_number VARCHAR(100) UNIQUE,
  roll_number VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  preferred_name VARCHAR(100),
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  programme_id UUID REFERENCES programmes(id) ON DELETE RESTRICT,
  home_department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  admission_academic_year VARCHAR(50) NOT NULL DEFAULT '2026-27',
  admission_batch VARCHAR(50) NOT NULL DEFAULT '2026',
  current_semester INT NOT NULL DEFAULT 1,
  year_of_study INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(50) NOT NULL,
  phone VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(20) DEFAULT 'OTHER',
  blood_group VARCHAR(10),
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(50),
  address TEXT,
  profile_photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_student_username CHECK (char_length(username) >= 4 AND username ~ '[0-9]'),
  CONSTRAINT chk_student_password CHECK (char_length(password) >= 4 AND password ~ '[0-9]')
);

-- Migration helpers for existing databases (prevents ERROR 42703 if tables already exist)
ALTER TABLE students ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS university_register_number VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS year_of_study INT DEFAULT 1;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'OTHER';
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE students ADD COLUMN IF NOT EXISTS home_department_id UUID;
ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;

-- Student Default Credentials Trigger:
-- Username: University Register Number entered in registration form
-- Password: Date of Birth (DDMMYYYY) followed by last 2 digits of Mobile Number (e.g. 1404200590)
CREATE OR REPLACE FUNCTION generate_student_default_password(dob DATE, mob TEXT)
RETURNS TEXT AS $$
DECLARE
  clean_mob TEXT;
  dob_str TEXT;
  last2 TEXT;
BEGIN
  IF dob IS NULL OR mob IS NULL THEN
    RETURN 'Nss2026!';
  END IF;
  dob_str := to_char(dob, 'DDMMYYYY');
  clean_mob := regexp_replace(mob, '\D', '', 'g');
  IF length(clean_mob) >= 2 THEN
    last2 := right(clean_mob, 2);
  ELSE
    last2 := '00';
  END IF;
  RETURN dob_str || last2;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION trg_set_student_default_credentials()
RETURNS TRIGGER AS $$
BEGIN
  -- Default username to University Register Number if provided
  IF NEW.university_register_number IS NOT NULL AND TRIM(NEW.university_register_number) <> '' THEN
    IF NEW.username IS NULL OR TRIM(NEW.username) = '' OR NEW.username LIKE 'stu%' THEN
      NEW.username := UPPER(TRIM(NEW.university_register_number));
    END IF;
  END IF;

  -- Default password to DDMMYYYY + last 2 digits of mobile number
  IF (NEW.password IS NULL OR TRIM(NEW.password) = '' OR NEW.password = 'Nss2026!') AND NEW.date_of_birth IS NOT NULL AND NEW.mobile_number IS NOT NULL THEN
    NEW.password := generate_student_default_password(NEW.date_of_birth, NEW.mobile_number);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_student_default_credentials_trigger ON students;
CREATE TRIGGER set_student_default_credentials_trigger
BEFORE INSERT OR UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION trg_set_student_default_credentials();


ALTER TABLE faculty ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_code VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 13. STUDENT COURSE REGISTRATIONS (Cross-Major FYUGP Registrations)
CREATE TABLE IF NOT EXISTS student_course_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  course_category_id UUID REFERENCES course_categories(id) ON DELETE RESTRICT,
  registration_status VARCHAR(50) DEFAULT 'REGISTERED',
  registration_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, course_offering_id)
);

-- 14. CLASS SESSIONS
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_id VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  topic_covered TEXT,
  session_type VARCHAR(50) DEFAULT 'REGULAR',
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  attendance_submitted BOOLEAN DEFAULT false,
  submitted_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 15. ATTENDANCE RECORDS (Single Source of Truth per Student-Session)
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status attendance_status_enum NOT NULL DEFAULT 'PRESENT',
  marked_by_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  marked_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  remarks TEXT,
  UNIQUE(class_session_id, student_id)
);

-- 16. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_course_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS faculty_read_directory ON faculty;
CREATE POLICY faculty_read_directory ON faculty
  FOR SELECT USING (true);

DROP POLICY IF EXISTS admin_manage_faculty ON faculty;
CREATE POLICY admin_manage_faculty ON faculty
  FOR ALL USING (true);

DROP POLICY IF EXISTS student_view_own_data ON students;
CREATE POLICY student_view_own_data ON students
  FOR SELECT USING (auth.uid() = auth_user_id OR auth_user_id IS NULL);

DROP POLICY IF EXISTS student_view_own_attendance ON attendance_records;
CREATE POLICY student_view_own_attendance ON attendance_records
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS faculty_manage_assigned_attendance ON attendance_records;
CREATE POLICY faculty_manage_assigned_attendance ON attendance_records
  FOR ALL USING (
    marked_by_faculty_id IN (SELECT id FROM faculty WHERE auth_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM faculty WHERE auth_user_id = auth.uid() AND 'SUPER_ADMIN' = ANY(roles)
    )
    OR true
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_att_records_session ON attendance_records(class_session_id);
CREATE INDEX IF NOT EXISTS idx_att_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reg_student ON student_course_registrations(student_id);

-- 17. SPECIAL ATTENDANCE SYSTEM
CREATE TABLE IF NOT EXISTS special_attendance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100) NOT NULL,
  event_date DATE NOT NULL,
  period_ids TEXT[] DEFAULT '{}',
  is_full_day BOOLEAN DEFAULT false,
  start_time VARCHAR(20),
  end_time VARCHAR(20),
  scope_type VARCHAR(50) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  batch_id UUID,
  semester_id UUID,
  course_group_id UUID,
  student_coverage VARCHAR(50) DEFAULT 'ALL_ELIGIBLE',
  selected_student_ids TEXT[] DEFAULT '{}',
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'APPLIED',
  created_by UUID,
  created_by_name VARCHAR(150),
  created_by_role VARCHAR(50),
  approved_by UUID,
  approved_by_name VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS special_attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES special_attendance_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period_id UUID,
  attendance_status VARCHAR(50) DEFAULT 'SPECIAL',
  attendance_source VARCHAR(50) DEFAULT 'SPECIAL',
  normal_session_conflict_status VARCHAR(50) DEFAULT 'NO_SESSION',
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE special_attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_read_special_events ON special_attendance_events;
CREATE POLICY allow_read_special_events ON special_attendance_events FOR SELECT USING (true);
DROP POLICY IF EXISTS allow_manage_special_events ON special_attendance_events;
CREATE POLICY allow_manage_special_events ON special_attendance_events FOR ALL USING (true);
DROP POLICY IF EXISTS allow_read_special_records ON special_attendance_records;
CREATE POLICY allow_read_special_records ON special_attendance_records FOR SELECT USING (true);
DROP POLICY IF EXISTS allow_manage_special_records ON special_attendance_records;
CREATE POLICY allow_manage_special_records ON special_attendance_records FOR ALL USING (true);
`;

export function generateSupabaseSqlSchema(): string {
  return SUPABASE_SCHEMA_SQL;
}
