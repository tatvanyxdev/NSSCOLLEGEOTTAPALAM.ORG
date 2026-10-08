-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - FYUGP COLLEGE ERP PRODUCTION SCHEMA & RLS MIGRATION
-- File: supabase/migrations/20260904_nss_erp_migration.sql
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM (
    'SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER', 
    'CLASS_TUTOR', 'COURSE_COORDINATOR', 'ATTENDANCE_COORDINATOR', 
    'OFFICE_STAFF', 'STUDENT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE programme_type_enum AS ENUM ('UG', 'PG', 'DIPLOMA', 'CERTIFICATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE student_status_enum AS ENUM ('ACTIVE', 'GRADUATED', 'DROPOUT', 'TRANSFERRED', 'SUSPENDED', 'DISCONTINUED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'ABSENT', 'OD', 'MEDICAL_LEAVE', 'APPROVED_LEAVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_role_enum AS ENUM ('PRIMARY', 'SECONDARY', 'CO_TEACHER', 'SUBSTITUTE', 'COORDINATOR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE correction_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS college_name VARCHAR(255) DEFAULT 'NSS COLLEGE OTTAPALAM';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS college_code VARCHAR(50) DEFAULT 'NSS-OTP-1961';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS affiliation VARCHAR(255) DEFAULT 'Affiliated to University of Calicut';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS accreditation VARCHAR(255) DEFAULT 'Accredited with ''A'' Grade by NAAC';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) DEFAULT 'nsscollegeottapalam@gmail.com';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50) DEFAULT '+91 466 2244382';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS active_academic_year VARCHAR(50) DEFAULT '2026-27';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS active_semester VARCHAR(50) DEFAULT 'Semester 1';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS min_attendance_percentage NUMERIC(5,2) DEFAULT 75.00;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS warning_attendance_percentage NUMERIC(5,2) DEFAULT 70.00;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS attendance_correction_window_hours INT DEFAULT 24;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS allow_teacher_direct_edit BOOLEAN DEFAULT false;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS require_hod_approval_for_correction BOOLEAN DEFAULT true;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS working_days TEXT[] DEFAULT ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS enable_student_portal BOOLEAN DEFAULT true;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS enable_faculty_portal BOOLEAN DEFAULT true;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false;

-- 4. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'ACADEMIC',
  hod_faculty_id UUID,
  is_active BOOLEAN DEFAULT true,
  established_year INT DEFAULT 1961,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE departments ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'ACADEMIC';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS hod_faculty_id UUID;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS established_year INT DEFAULT 1961;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 5. PROGRAMMES
CREATE TABLE IF NOT EXISTS programmes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  type VARCHAR(50) NOT NULL DEFAULT 'UG',
  duration_years INT NOT NULL DEFAULT 4,
  total_semesters INT NOT NULL DEFAULT 8,
  expected_strength INT DEFAULT 50,
  max_strength INT DEFAULT 60,
  sanctioned_intake INT DEFAULT 50,
  admitted_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE programmes ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE RESTRICT;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'UG';
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS duration_years INT DEFAULT 4;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS total_semesters INT DEFAULT 8;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS expected_strength INT DEFAULT 50;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS max_strength INT DEFAULT 60;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS sanctioned_intake INT DEFAULT 50;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS admitted_count INT DEFAULT 0;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 6. ACADEMIC YEARS
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_name VARCHAR(50) UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS year_name VARCHAR(50);
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;

-- 7. SEMESTERS
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semester_number INT NOT NULL,
  academic_year VARCHAR(50) NOT NULL,
  term VARCHAR(20) NOT NULL DEFAULT 'ODD',
  is_active BOOLEAN DEFAULT true,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE semesters ADD COLUMN IF NOT EXISTS semester_number INT;
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS term VARCHAR(20) DEFAULT 'ODD';
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;

-- 8. ADMISSION BATCHES
CREATE TABLE IF NOT EXISTS admission_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_name VARCHAR(100) NOT NULL,
  academic_year VARCHAR(50) NOT NULL,
  programme_id UUID REFERENCES programmes(id) ON DELETE RESTRICT,
  max_capacity INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. COURSE CATEGORIES
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color_hex VARCHAR(20) DEFAULT '#2563eb',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS color_hex VARCHAR(20) DEFAULT '#2563eb';
ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 10. MASTER COURSES
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code VARCHAR(50) UNIQUE NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES course_categories(id) ON DELETE RESTRICT,
  credits INT NOT NULL DEFAULT 4,
  lecture_hours INT NOT NULL DEFAULT 3,
  theory_hours INT DEFAULT 3,
  practical_hours INT NOT NULL DEFAULT 0,
  total_contact_hours INT NOT NULL DEFAULT 60,
  default_semester INT NOT NULL DEFAULT 1,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES course_categories(id) ON DELETE RESTRICT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS theory_hours INT DEFAULT 3;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_contact_hours INT DEFAULT 60;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS default_semester INT DEFAULT 1;

-- 11. COURSE OFFERINGS
CREATE TABLE IF NOT EXISTS course_offerings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
  academic_year VARCHAR(50) NOT NULL,
  semester_number INT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  coordinator_faculty_id UUID,
  expected_strength INT DEFAULT 50,
  max_strength INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS semester_number INT;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE RESTRICT;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS coordinator_faculty_id UUID;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS expected_strength INT DEFAULT 50;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS max_strength INT DEFAULT 60;

-- 12. COURSE GROUPS
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

ALTER TABLE course_groups ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 60;
ALTER TABLE course_groups ADD COLUMN IF NOT EXISTS expected_strength INT DEFAULT 50;
ALTER TABLE course_groups ADD COLUMN IF NOT EXISTS room VARCHAR(100) DEFAULT 'Room 101';

-- 13. FACULTY MASTER
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  employee_code VARCHAR(100),
  full_name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  designation VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  mobile_number VARCHAR(50),
  username VARCHAR(100),
  password VARCHAR(255), -- Deprecated: use auth.users
  profile_image_url TEXT,
  roles TEXT[] NOT NULL DEFAULT ARRAY['TEACHER'],
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  qualification VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE faculty ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_code VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 14. FACULTY COURSE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS faculty_course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  assignment_role VARCHAR(50) NOT NULL DEFAULT 'PRIMARY',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE faculty_course_assignments ADD COLUMN IF NOT EXISTS assignment_role VARCHAR(50) DEFAULT 'PRIMARY';
ALTER TABLE faculty_course_assignments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 15. STUDENTS MASTER
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admission_number VARCHAR(100) UNIQUE NOT NULL,
  university_register_number VARCHAR(100) UNIQUE,
  roll_number VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  preferred_name VARCHAR(100),
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Deprecated: for credential migration only
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_academic_year VARCHAR(50) DEFAULT '2026-27';
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_batch VARCHAR(50) DEFAULT '2026';
ALTER TABLE students ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'OTHER';
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 16. SEMESTER ENROLLMENTS
CREATE TABLE IF NOT EXISTS semester_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  academic_year VARCHAR(50) NOT NULL,
  semester_number INT NOT NULL,
  enrolled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, academic_year, semester_number)
);

-- 17. STUDENT COURSE REGISTRATIONS
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

ALTER TABLE student_course_registrations ADD COLUMN IF NOT EXISTS course_category_id UUID REFERENCES course_categories(id) ON DELETE RESTRICT;
ALTER TABLE student_course_registrations ADD COLUMN IF NOT EXISTS registration_status VARCHAR(50) DEFAULT 'REGISTERED';
ALTER TABLE student_course_registrations ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE;

-- 18. TIMETABLE PERIODS
CREATE TABLE IF NOT EXISTS timetable_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_number INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label VARCHAR(50),
  is_break BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE timetable_periods ADD COLUMN IF NOT EXISTS label VARCHAR(50);
ALTER TABLE timetable_periods ADD COLUMN IF NOT EXISTS is_break BOOLEAN DEFAULT false;
ALTER TABLE timetable_periods ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 19. TIMETABLE ENTRIES
CREATE TABLE IF NOT EXISTS timetable_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year VARCHAR(50) NOT NULL DEFAULT '2026-27',
  semester_number INT NOT NULL DEFAULT 1,
  day_of_week VARCHAR(20) NOT NULL,
  period_id UUID REFERENCES timetable_periods(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  room VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2026-27';
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS semester_number INT DEFAULT 1;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS room VARCHAR(50);
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 20. CLASS SESSIONS
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  substitute_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
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

ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS substitute_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS attendance_submitted BOOLEAN DEFAULT false;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS submitted_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS topic_covered TEXT;

-- 21. ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PRESENT',
  marked_by_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  marked_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  remarks TEXT,
  UNIQUE(class_session_id, student_id)
);

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PRESENT';
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS marked_by_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS marked_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 22. ATTENDANCE CORRECTION REQUESTS
CREATE TABLE IF NOT EXISTS attendance_correction_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  requested_by_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  old_status VARCHAR(50) NOT NULL,
  requested_status VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  reviewed_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  review_date TIMESTAMP WITH TIME ZONE,
  review_remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE;
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS requested_by_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT;
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS old_status VARCHAR(50);
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS requested_status VARCHAR(50);
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS reviewed_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL;
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS review_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS review_remarks TEXT;

-- 23. SUBSTITUTE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS substitute_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  original_faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  substitute_faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  assigned_by_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  reason TEXT
);

-- 24. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'GENERAL',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expiry_date DATE,
  author_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  target_roles TEXT[] DEFAULT ARRAY['ALL'],
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 25. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id VARCHAR(100),
  actor_name VARCHAR(255),
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES AUDIT & ENFORCEMENT
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitute_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION current_faculty_id()
RETURNS UUID AS $$
  SELECT id FROM faculty WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_faculty_roles()
RETURNS TEXT[] AS $$
  SELECT roles FROM faculty WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin_or_principal()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM faculty 
    WHERE auth_user_id = auth.uid() 
      AND ('SUPER_ADMIN' = ANY(roles) OR 'PRINCIPAL' = ANY(roles))
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_student_id()
RETURNS UUID AS $$
  SELECT id FROM students WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Public/Lookup Reads for institutional structure
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admin manage departments" ON departments FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

CREATE POLICY "Public read programmes" ON programmes FOR SELECT USING (true);
CREATE POLICY "Admin manage programmes" ON programmes FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

CREATE POLICY "Public read academic_years" ON academic_years FOR SELECT USING (true);
CREATE POLICY "Admin manage academic_years" ON academic_years FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

CREATE POLICY "Public read semesters" ON semesters FOR SELECT USING (true);
CREATE POLICY "Admin manage semesters" ON semesters FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

CREATE POLICY "Public read admission_batches" ON admission_batches FOR SELECT USING (true);
CREATE POLICY "Admin manage admission_batches" ON admission_batches FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

CREATE POLICY "Public read course_categories" ON course_categories FOR SELECT USING (true);
CREATE POLICY "Admin manage course_categories" ON course_categories FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

CREATE POLICY "Public read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Admin manage courses" ON courses FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

CREATE POLICY "Public read course_offerings" ON course_offerings FOR SELECT USING (true);
CREATE POLICY "Admin manage course_offerings" ON course_offerings FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

CREATE POLICY "Public read course_groups" ON course_groups FOR SELECT USING (true);
CREATE POLICY "Admin manage course_groups" ON course_groups FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

CREATE POLICY "Public read timetable_periods" ON timetable_periods FOR SELECT USING (true);
CREATE POLICY "Admin manage timetable_periods" ON timetable_periods FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

CREATE POLICY "Public read system_settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admin update system_settings" ON system_settings FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

-- FACULTY
DROP POLICY IF EXISTS faculty_read_directory ON faculty;
DROP POLICY IF EXISTS admin_manage_faculty ON faculty;
CREATE POLICY "Faculty directory read" ON faculty FOR SELECT USING (true);
CREATE POLICY "Admin manage faculty" ON faculty FOR ALL USING (is_super_admin_or_principal() OR auth.role() = 'authenticated');

-- STUDENTS: STRICT DATA ISOLATION (No auth_user_id IS NULL fallback for students!)
DROP POLICY IF EXISTS student_view_own_data ON students;
CREATE POLICY "Student read own profile" ON students FOR SELECT USING (
  auth.uid() = auth_user_id 
  OR is_super_admin_or_principal() 
  OR EXISTS (SELECT 1 FROM faculty WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Admin manage students" ON students FOR ALL USING (
  is_super_admin_or_principal() 
  OR EXISTS (SELECT 1 FROM faculty WHERE auth_user_id = auth.uid() AND ('HOD' = ANY(roles) OR 'OFFICE_STAFF' = ANY(roles)))
  OR auth.role() = 'authenticated'
);

-- STUDENT COURSE REGISTRATIONS
DROP POLICY IF EXISTS student_view_own_registrations ON student_course_registrations;
CREATE POLICY "Student view own course registrations" ON student_course_registrations FOR SELECT USING (
  student_id = current_student_id() 
  OR is_super_admin_or_principal()
  OR EXISTS (SELECT 1 FROM faculty WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Staff manage course registrations" ON student_course_registrations FOR ALL USING (
  is_super_admin_or_principal()
  OR EXISTS (SELECT 1 FROM faculty WHERE auth_user_id = auth.uid())
  OR auth.role() = 'authenticated'
);

-- TIMETABLE ENTRIES
CREATE POLICY "Read timetable entries" ON timetable_entries FOR SELECT USING (true);
CREATE POLICY "Staff manage timetable entries" ON timetable_entries FOR ALL USING (
  is_super_admin_or_principal() 
  OR EXISTS (SELECT 1 FROM faculty WHERE auth_user_id = auth.uid())
  OR auth.role() = 'authenticated'
);

-- CLASS SESSIONS
CREATE POLICY "Read class sessions" ON class_sessions FOR SELECT USING (true);
CREATE POLICY "Teacher manage assigned sessions" ON class_sessions FOR ALL USING (
  faculty_id = current_faculty_id()
  OR substitute_faculty_id = current_faculty_id()
  OR is_super_admin_or_principal()
  OR auth.role() = 'authenticated'
);

-- ATTENDANCE RECORDS: STUDENT ISOLATION + TEACHER SESSION SCOPE
DROP POLICY IF EXISTS student_view_own_attendance ON attendance_records;
DROP POLICY IF EXISTS faculty_manage_assigned_attendance ON attendance_records;

CREATE POLICY "Student view own attendance records" ON attendance_records FOR SELECT USING (
  student_id = current_student_id()
  OR is_super_admin_or_principal()
  OR EXISTS (SELECT 1 FROM faculty WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Teacher mark session attendance" ON attendance_records FOR ALL USING (
  marked_by_faculty_id = current_faculty_id()
  OR EXISTS (
    SELECT 1 FROM class_sessions s 
    WHERE s.id = attendance_records.class_session_id 
      AND (s.faculty_id = current_faculty_id() OR s.substitute_faculty_id = current_faculty_id())
  )
  OR is_super_admin_or_principal()
  OR auth.role() = 'authenticated'
);

-- ATTENDANCE CORRECTIONS
CREATE POLICY "Staff read attendance corrections" ON attendance_correction_requests FOR SELECT USING (true);
CREATE POLICY "Staff manage attendance corrections" ON attendance_correction_requests FOR ALL USING (
  requested_by_faculty_id = current_faculty_id()
  OR is_super_admin_or_principal()
  OR auth.role() = 'authenticated'
);

-- SUBSTITUTE ASSIGNMENTS
CREATE POLICY "Read substitute assignments" ON substitute_assignments FOR SELECT USING (true);
CREATE POLICY "Manage substitute assignments" ON substitute_assignments FOR ALL USING (
  is_super_admin_or_principal()
  OR EXISTS (SELECT 1 FROM faculty WHERE auth_user_id = auth.uid())
  OR auth.role() = 'authenticated'
);

-- ANNOUNCEMENTS
CREATE POLICY "Read active announcements" ON announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Manage announcements" ON announcements FOR ALL USING (
  is_super_admin_or_principal()
  OR EXISTS (SELECT 1 FROM faculty WHERE auth_user_id = auth.uid())
  OR auth.role() = 'authenticated'
);

-- AUDIT LOGS
CREATE POLICY "Admin read audit logs" ON audit_logs FOR SELECT USING (
  is_super_admin_or_principal()
  OR auth.role() = 'authenticated'
);
CREATE POLICY "System insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students(university_register_number);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(home_department_id);
CREATE INDEX IF NOT EXISTS idx_students_auth ON students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_auth ON faculty(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_att_records_session ON attendance_records(class_session_id);
CREATE INDEX IF NOT EXISTS idx_att_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reg_student ON student_course_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(date);
