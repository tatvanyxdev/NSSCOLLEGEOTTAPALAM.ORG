-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - FYUGP ERP COMPLETE SECURITY HARDENING MIGRATION
-- Target Database: PostgreSQL / Supabase
-- Properties: Safe, Non-Destructive, Fully Idempotent, Zero Plaintext Credentials
-- ==============================================================================
-- INSTRUCTIONS FOR SUPABASE SQL EDITOR:
-- Paste this entire script into Supabase -> SQL Editor -> Run.
-- It creates missing security/operational tables, migrates & hashes all existing
-- passwords into an isolated credential vault, removes plaintext passwords,
-- installs anti-escalation triggers, RPC auth endpoints, and tight RLS policies.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SAFE ENUM CREATION (IDEMPOTENT)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM (
      'SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'TEACHER',
      'CLASS_TUTOR', 'COURSE_COORDINATOR', 'ATTENDANCE_COORDINATOR',
      'OFFICE_STAFF', 'STUDENT'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'programme_type_enum') THEN
    CREATE TYPE programme_type_enum AS ENUM ('UG', 'PG', 'DIPLOMA', 'CERTIFICATE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status_enum') THEN
    CREATE TYPE student_status_enum AS ENUM ('ACTIVE', 'GRADUATED', 'DROPOUT', 'TRANSFERRED', 'SUSPENDED', 'DISCONTINUED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status_enum') THEN
    CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'ABSENT', 'OD', 'MEDICAL_LEAVE', 'APPROVED_LEAVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_role_enum') THEN
    CREATE TYPE assignment_role_enum AS ENUM ('PRIMARY', 'SECONDARY', 'CO_TEACHER', 'SUBSTITUTE', 'COORDINATOR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'correction_status_enum') THEN
    CREATE TYPE correction_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

-- 3. ENSURE CORE & OPERATIONAL TABLES EXIST (IDEMPOTENT)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_name VARCHAR(255) NOT NULL DEFAULT 'NSS COLLEGE OTTAPALAM',
  institution_name VARCHAR(255) DEFAULT 'NSS COLLEGE OTTAPALAM',
  institution_logo_text VARCHAR(255) DEFAULT 'NSS COLLEGE OTTAPALAM',
  college_code VARCHAR(50) NOT NULL DEFAULT 'NSS-OTP-1961',
  affiliation VARCHAR(255) DEFAULT 'Affiliated to University of Calicut',
  accreditation VARCHAR(255) DEFAULT 'Accredited with ''A'' Grade by NAAC',
  address TEXT DEFAULT 'NSS College, Ottapalam, Palakkad District, Kerala - 679103',
  contact_email VARCHAR(255) DEFAULT 'nsscollegeottapalam@gmail.com',
  contact_phone VARCHAR(50) DEFAULT '+91 466 2244382',
  active_academic_year VARCHAR(50) DEFAULT '2026-2027',
  active_semester VARCHAR(50) DEFAULT 'S1',
  min_attendance_percentage NUMERIC(5,2) DEFAULT 75.00,
  warning_attendance_percentage NUMERIC(5,2) DEFAULT 70.00,
  attendance_correction_window_hours INT DEFAULT 24,
  allow_teacher_direct_edit BOOLEAN DEFAULT false,
  require_hod_approval_for_correction BOOLEAN DEFAULT true,
  enable_od_automation BOOLEAN DEFAULT true,
  enable_push_notifications BOOLEAN DEFAULT true,
  working_days TEXT[] DEFAULT ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  enable_student_portal BOOLEAN DEFAULT true,
  enable_faculty_portal BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255);
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS institution_logo_text VARCHAR(255);
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS college_name VARCHAR(255) DEFAULT 'NSS COLLEGE OTTAPALAM';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS college_code VARCHAR(50) DEFAULT 'NSS-OTP-1961';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS enable_od_automation BOOLEAN DEFAULT true;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS enable_push_notifications BOOLEAN DEFAULT true;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS enable_student_portal BOOLEAN DEFAULT true;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS enable_faculty_portal BOOLEAN DEFAULT true;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS maintenance_config JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'ACADEMIC',
  hod_faculty_id UUID,
  attendance_policy VARCHAR(50) DEFAULT 'HOUR_WISE',
  is_active BOOLEAN DEFAULT true,
  established_year INT DEFAULT 1961,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS attendance_policy VARCHAR(50) DEFAULT 'HOUR_WISE';

CREATE TABLE IF NOT EXISTS public.programmes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
  type VARCHAR(50) NOT NULL DEFAULT 'UG',
  duration_years INT NOT NULL DEFAULT 4,
  total_semesters INT NOT NULL DEFAULT 8,
  expected_strength INT DEFAULT 50,
  max_strength INT DEFAULT 60,
  sanctioned_intake INT DEFAULT 60,
  admitted_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.programmes ADD COLUMN IF NOT EXISTS sanctioned_intake INT DEFAULT 60;

CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_code VARCHAR(50) UNIQUE NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.admission_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_name VARCHAR(100) NOT NULL,
  academic_year_id UUID,
  expected_strength INT DEFAULT 60,
  max_strength INT DEFAULT 72,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semester_number INT NOT NULL,
  label VARCHAR(50),
  academic_year_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.course_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color_hex VARCHAR(20) DEFAULT '#2563eb',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code VARCHAR(50) UNIQUE NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES public.course_categories(id) ON DELETE RESTRICT,
  credits INT NOT NULL DEFAULT 4,
  lecture_hours INT NOT NULL DEFAULT 3,
  tutorial_hours INT DEFAULT 0,
  practical_hours INT NOT NULL DEFAULT 0,
  total_contact_hours INT NOT NULL DEFAULT 60,
  default_semester INT NOT NULL DEFAULT 1,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tutorial_hours INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.course_offerings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  academic_year VARCHAR(50) DEFAULT '2026-2027',
  semester_number INT NOT NULL DEFAULT 1,
  department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
  coordinator_faculty_id UUID,
  expected_strength INT DEFAULT 60,
  max_strength INT DEFAULT 72,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.course_offerings ADD COLUMN IF NOT EXISTS expected_strength INT DEFAULT 60;
ALTER TABLE public.course_offerings ADD COLUMN IF NOT EXISTS max_strength INT DEFAULT 72;

CREATE TABLE IF NOT EXISTS public.course_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_offering_id UUID REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  group_name VARCHAR(100) NOT NULL DEFAULT 'Group A',
  capacity INT DEFAULT 60,
  expected_strength INT DEFAULT 50,
  max_strength INT DEFAULT 72,
  max_capacity INT DEFAULT 72,
  room VARCHAR(100) DEFAULT 'Room 101',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.course_groups ADD COLUMN IF NOT EXISTS max_strength INT DEFAULT 72;
ALTER TABLE public.course_groups ADD COLUMN IF NOT EXISTS max_capacity INT DEFAULT 72;

CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id VARCHAR(100) UNIQUE,
  employee_code VARCHAR(100),
  full_name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
  designation VARCHAR(100) NOT NULL DEFAULT 'Assistant Professor',
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  mobile_number VARCHAR(50),
  phone_number VARCHAR(50),
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  profile_image_url TEXT,
  roles TEXT[] NOT NULL DEFAULT ARRAY['TEACHER'],
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  qualification VARCHAR(255),
  google_email VARCHAR(255),
  google_uid VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100);
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS employee_code VARCHAR(100);
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS google_email VARCHAR(255);
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS google_uid VARCHAR(255);
ALTER TABLE public.faculty ALTER COLUMN employee_id DROP NOT NULL;
ALTER TABLE public.faculty ALTER COLUMN employee_code DROP NOT NULL;
ALTER TABLE public.faculty ALTER COLUMN password DROP NOT NULL;
ALTER TABLE public.faculty ALTER COLUMN phone DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admission_number VARCHAR(100) UNIQUE NOT NULL,
  university_register_number VARCHAR(100) UNIQUE,
  roll_number VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  preferred_name VARCHAR(100),
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  programme_id UUID REFERENCES public.programmes(id) ON DELETE RESTRICT,
  home_department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
  department_id UUID,
  admission_academic_year VARCHAR(50) NOT NULL DEFAULT '2026-27',
  admission_batch VARCHAR(50) NOT NULL DEFAULT '2026-2030',
  current_semester INT NOT NULL DEFAULT 1,
  year_of_study INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  student_status VARCHAR(50) DEFAULT 'ACTIVE',
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(50),
  phone VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(20) DEFAULT 'OTHER',
  blood_group VARCHAR(10),
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(50),
  address TEXT,
  profile_photo_url TEXT,
  google_email VARCHAR(255),
  google_uid VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS university_register_number VARCHAR(100);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS year_of_study INT DEFAULT 1;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admission_academic_year VARCHAR(50) DEFAULT '2026-27';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admission_batch VARCHAR(50) DEFAULT '2026-2030';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'OTHER';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(50);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS home_department_id UUID;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS google_email VARCHAR(255);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS google_uid VARCHAR(255);
ALTER TABLE public.students ALTER COLUMN password DROP NOT NULL;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS chk_student_password;

CREATE TABLE IF NOT EXISTS public.faculty_course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES public.course_groups(id) ON DELETE CASCADE,
  assignment_role VARCHAR(50) NOT NULL DEFAULT 'PRIMARY',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.student_course_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES public.course_groups(id) ON DELETE CASCADE,
  course_category_id UUID REFERENCES public.course_categories(id) ON DELETE RESTRICT,
  registration_status VARCHAR(50) DEFAULT 'REGISTERED',
  registration_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, course_offering_id)
);

CREATE TABLE IF NOT EXISTS public.semester_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  programme_id UUID REFERENCES public.programmes(id) ON DELETE SET NULL,
  academic_year VARCHAR(50),
  semester_number INT NOT NULL DEFAULT 1,
  status VARCHAR(50) DEFAULT 'ENROLLED',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.timetable_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_number INT NOT NULL,
  label VARCHAR(100) NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20) NOT NULL,
  is_break BOOLEAN DEFAULT false,
  session VARCHAR(10) DEFAULT 'FN',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.timetable_periods ADD COLUMN IF NOT EXISTS session VARCHAR(10) DEFAULT 'FN';

CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year VARCHAR(50) DEFAULT '2026-2027',
  semester_number INT NOT NULL DEFAULT 1,
  day_of_week VARCHAR(20) NOT NULL,
  weekday VARCHAR(20),
  period_id VARCHAR(50) NOT NULL,
  course_offering_id UUID REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES public.course_groups(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  room VARCHAR(100),
  room_number VARCHAR(100),
  department_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.class_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_offering_id UUID REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES public.course_groups(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  substitute_faculty_id UUID,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_date DATE,
  period_id VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:30:00',
  end_time TIME NOT NULL DEFAULT '10:30:00',
  topic_covered TEXT,
  session_type VARCHAR(50) DEFAULT 'REGULAR',
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  attendance_submitted BOOLEAN DEFAULT false,
  submitted_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS substitute_faculty_id UUID;
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS session_date DATE;

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PRESENT',
  marked_by_faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  marked_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  remarks TEXT,
  UNIQUE(class_session_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.attendance_correction_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  requested_by_faculty_id UUID,
  current_status VARCHAR(50),
  requested_status VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  reviewed_by_faculty_id UUID,
  review_remarks TEXT,
  reviewed_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.attendance_correction_requests ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.attendance_correction_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';

CREATE TABLE IF NOT EXISTS public.substitute_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  original_faculty_id UUID,
  substitute_faculty_id UUID,
  assigned_by_faculty_id UUID,
  reason TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.class_tutor_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  programme_id UUID REFERENCES public.programmes(id) ON DELETE SET NULL,
  semester_number INT,
  academic_year VARCHAR(50) DEFAULT '2026-2027',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.daily_schedule_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  department_id UUID,
  course_offering_id UUID,
  course_group_id UUID,
  period_id VARCHAR(50),
  override_type VARCHAR(50) NOT NULL,
  original_faculty_id UUID,
  new_faculty_id UUID,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.faculty_subject_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  course_offering_id UUID,
  provisional_course_title VARCHAR(255),
  provisional_course_code VARCHAR(50),
  semester_number INT,
  status VARCHAR(50) DEFAULT 'PENDING',
  remarks TEXT,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.faculty_assignment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID,
  course_offering_id UUID,
  action VARCHAR(100),
  performed_by UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.faculty_subject_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID,
  course_id UUID,
  action VARCHAR(100) NOT NULL,
  performed_by VARCHAR(255),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.special_attendance_events (
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
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  programme_id UUID REFERENCES public.programmes(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.special_attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.special_attendance_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period_id UUID,
  attendance_status VARCHAR(50) DEFAULT 'SPECIAL',
  attendance_source VARCHAR(50) DEFAULT 'SPECIAL',
  normal_session_conflict_status VARCHAR(50) DEFAULT 'NO_SESSION',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  content TEXT,
  message TEXT,
  priority VARCHAR(50) DEFAULT 'NORMAL',
  target_audience VARCHAR(100) DEFAULT 'ALL',
  target_roles TEXT[],
  author_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_roles TEXT[];

CREATE TABLE IF NOT EXISTS public.circulars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number VARCHAR(100),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  issuing_authority VARCHAR(255),
  scope VARCHAR(50) DEFAULT 'COLLEGE',
  target_department_id UUID,
  target_programme_id UUID,
  target_batch_id UUID,
  target_semester INT,
  target_roles TEXT[],
  priority VARCHAR(50) DEFAULT 'NORMAL',
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  attachment_name TEXT,
  attachment_url TEXT,
  requires_acknowledgement BOOLEAN DEFAULT false,
  acknowledged_student_ids TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.student_leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'OD',
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  is_full_day BOOLEAN DEFAULT true,
  affected_period_ids TEXT[] DEFAULT '{}',
  reason TEXT NOT NULL,
  document_name TEXT,
  document_url TEXT,
  status VARCHAR(50) DEFAULT 'SUBMITTED',
  reviewed_by_faculty_id UUID,
  reviewed_by_name VARCHAR(255),
  review_remarks TEXT,
  reviewed_at TIMESTAMPTZ,
  applied_to_attendance BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.student_certificate_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  certificate_type VARCHAR(100) NOT NULL DEFAULT 'BONAFIDE',
  purpose TEXT NOT NULL,
  number_of_copies INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'SUBMITTED',
  processing_remarks TEXT,
  ready_date DATE,
  collected_date DATE,
  handled_by_staff_id UUID,
  handled_by_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.academic_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  event_type VARCHAR(100) DEFAULT 'COLLEGE_EVENT',
  start_date DATE NOT NULL,
  end_date DATE,
  start_time VARCHAR(20),
  end_time VARCHAR(20),
  venue VARCHAR(255),
  scope VARCHAR(50) DEFAULT 'COLLEGE',
  department_id UUID,
  programme_id UUID,
  semester INT,
  target_roles TEXT[],
  is_holiday BOOLEAN DEFAULT false,
  color VARCHAR(30) DEFAULT '#2563eb',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.academic_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  department_id UUID,
  programme_id UUID,
  semester INT,
  course_id UUID,
  course_code VARCHAR(50),
  file_url TEXT,
  file_name TEXT,
  file_size VARCHAR(50),
  file_type VARCHAR(50),
  uploaded_by VARCHAR(255),
  uploaded_by_name VARCHAR(255),
  uploaded_at DATE DEFAULT CURRENT_DATE,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(100) DEFAULT 'IMPORTANT_ACADEMIC',
  priority VARCHAR(50) DEFAULT 'HIGH',
  scope VARCHAR(50) DEFAULT 'COLLEGE',
  department_id UUID,
  start_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  expiry_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_by_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id VARCHAR(255),
  actor_name VARCHAR(255),
  actor_role VARCHAR(100),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_id VARCHAR(255);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(100);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(255);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
DO $$
BEGIN
  BEGIN ALTER TABLE public.audit_logs ALTER COLUMN actor_id TYPE VARCHAR(255) USING actor_id::text; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'actor_id notice: %', SQLERRM; END;
  BEGIN ALTER TABLE public.audit_logs ALTER COLUMN actor_name TYPE VARCHAR(255) USING actor_name::text; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'actor_name notice: %', SQLERRM; END;
  BEGIN ALTER TABLE public.audit_logs ALTER COLUMN actor_role TYPE VARCHAR(100) USING actor_role::text; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'actor_role notice: %', SQLERRM; END;
  BEGIN ALTER TABLE public.audit_logs ALTER COLUMN action TYPE VARCHAR(255) USING action::text; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'action notice: %', SQLERRM; END;
  BEGIN ALTER TABLE public.audit_logs ALTER COLUMN entity_type TYPE VARCHAR(100) USING entity_type::text; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'entity_type notice: %', SQLERRM; END;
  BEGIN ALTER TABLE public.audit_logs ALTER COLUMN entity_id TYPE VARCHAR(255) USING entity_id::text; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'entity_id notice: %', SQLERRM; END;
END $$;
ALTER TABLE public.audit_logs ALTER COLUMN actor_name DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN actor_role DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN entity_type DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN entity_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  granted_by UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(auth_user_id, role)
);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ==============================================================================
-- 4. NEW SERVER-SIDE SECURITY & CREDENTIAL VAULT TABLES (ISOLATED FROM CLIENT)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.system_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  roles TEXT[] NOT NULL DEFAULT ARRAY['SUPER_ADMIN'],
  google_email VARCHAR(255),
  google_uid VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('STUDENT', 'FACULTY', 'ADMIN')),
  profile_id UUID NOT NULL,
  password_hash TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_type, profile_id)
);

CREATE TABLE IF NOT EXISTS public.erp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash TEXT UNIQUE NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('STUDENT', 'FACULTY', 'ADMIN')),
  profile_id UUID NOT NULL,
  roles TEXT[] NOT NULL,
  active_role VARCHAR(50) NOT NULL,
  department_id UUID,
  device_fingerprint VARCHAR(128),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  key TEXT PRIMARY KEY,
  failed_attempts INT NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_security_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_paused BOOLEAN NOT NULL DEFAULT false,
  security_level VARCHAR(50) NOT NULL DEFAULT 'HIGH_SHIELD',
  pause_reason TEXT,
  paused_by_name VARCHAR(255),
  paused_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
INSERT INTO public.system_security_state (id, is_paused, security_level)
VALUES (1, false, 'HIGH_SHIELD')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.security_quarantined_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_fingerprint VARCHAR(128) UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  quarantined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  unquarantined_at TIMESTAMPTZ,
  unquarantined_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(30) NOT NULL DEFAULT 'HIGH',
  description TEXT NOT NULL,
  actor_profile_id UUID,
  actor_name VARCHAR(255),
  actor_role VARCHAR(100),
  device_fingerprint VARCHAR(128),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON public.students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_auth_user_id ON public.faculty(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_erp_sessions_token_hash ON public.erp_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_credentials_lookup ON public.user_credentials(user_type, profile_id);
CREATE INDEX IF NOT EXISTS idx_att_records_session ON public.attendance_records(class_session_id);
CREATE INDEX IF NOT EXISTS idx_att_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reg_student ON public.student_course_registrations(student_id);

-- Pre-authorize verified institutional Super Admin Google identity cleanly WITHOUT any default password
INSERT INTO public.system_admins (username, full_name, email, roles, google_email, is_active)
VALUES ('tatvanyx_admin', 'System Super Administrator', 'tatvanyxdev@gmail.com', ARRAY['SUPER_ADMIN', 'PRINCIPAL'], 'tatvanyxdev@gmail.com', true)
ON CONFLICT (email) DO NOTHING;

-- ==============================================================================
-- 5. PASSWORD MIGRATION & AUTO-HASH / PLAINTEXT SCRUBBING TRIGGERS
-- ==============================================================================

DROP TRIGGER IF EXISTS set_student_default_credentials_trigger ON public.students;
DROP FUNCTION IF EXISTS public.trg_set_student_default_credentials();
DROP FUNCTION IF EXISTS public.generate_student_default_password(DATE, TEXT);

-- Helper to hash with bcrypt only if not already a valid bcrypt modular crypt string
CREATE OR REPLACE FUNCTION public.hash_erp_secret(raw_secret TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF raw_secret IS NULL OR length(TRIM(raw_secret)) = 0 THEN
    RETURN NULL;
  END IF;
  IF raw_secret ~ '^\$2[aby]\$\d{2}\$' THEN
    RETURN raw_secret;
  END IF;
  RETURN crypt(raw_secret, gen_salt('bf', 10));
END;
$$;

-- Migrate existing student passwords (or DOB+last2 initial password) to user_credentials & wipe plaintext
DO $$
DECLARE
  rec RECORD;
  v_raw TEXT;
  v_clean_mob TEXT;
BEGIN
  FOR rec IN SELECT id, password, date_of_birth, mobile_number FROM public.students LOOP
    v_raw := NULLIF(TRIM(rec.password), '');
    IF v_raw IS NULL AND rec.date_of_birth IS NOT NULL AND rec.mobile_number IS NOT NULL THEN
      v_clean_mob := regexp_replace(rec.mobile_number, '\D', '', 'g');
      IF length(v_clean_mob) >= 2 THEN
        v_raw := to_char(rec.date_of_birth, 'DDMMYYYY') || right(v_clean_mob, 2);
      END IF;
    END IF;

    IF v_raw IS NOT NULL THEN
      INSERT INTO public.user_credentials (user_type, profile_id, password_hash, must_change_password)
      VALUES (
        'STUDENT',
        rec.id,
        public.hash_erp_secret(v_raw),
        (rec.password IS NULL OR TRIM(rec.password) = '')
      )
      ON CONFLICT (user_type, profile_id) DO UPDATE
      SET password_hash = COALESCE(public.user_credentials.password_hash, EXCLUDED.password_hash);
    ELSE
      INSERT INTO public.user_credentials (user_type, profile_id, password_hash, must_change_password)
      VALUES ('STUDENT', rec.id, NULL, true)
      ON CONFLICT (user_type, profile_id) DO NOTHING;
    END IF;
  END LOOP;

  UPDATE public.students SET password = NULL WHERE password IS NOT NULL;
END $$;

-- Migrate existing faculty passwords to user_credentials & wipe plaintext
DO $$
DECLARE
  rec RECORD;
  v_raw TEXT;
BEGIN
  FOR rec IN SELECT id, password FROM public.faculty LOOP
    v_raw := NULLIF(TRIM(rec.password), '');
    INSERT INTO public.user_credentials (user_type, profile_id, password_hash, must_change_password)
    VALUES (
      'FACULTY',
      rec.id,
      CASE WHEN v_raw IS NOT NULL THEN public.hash_erp_secret(v_raw) ELSE NULL END,
      (v_raw IS NULL)
    )
    ON CONFLICT (user_type, profile_id) DO UPDATE
    SET password_hash = COALESCE(public.user_credentials.password_hash, EXCLUDED.password_hash);
  END LOOP;

  UPDATE public.faculty SET password = NULL WHERE password IS NOT NULL;
END $$;

-- Trigger for students: hashes incoming NEW.password (or computes DOB+mob last2 if absent on INSERT) and nulls NEW.password
CREATE OR REPLACE FUNCTION public.trg_secure_student_credentials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret TEXT;
  v_clean_mob TEXT;
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := uuid_generate_v4();
  END IF;

  IF NEW.university_register_number IS NOT NULL AND TRIM(NEW.university_register_number) <> '' THEN
    IF NEW.username IS NULL OR TRIM(NEW.username) = '' OR NEW.username LIKE 'stu%' THEN
      NEW.username := UPPER(TRIM(NEW.university_register_number));
    END IF;
  END IF;

  IF NEW.password IS NOT NULL AND TRIM(NEW.password) <> '' THEN
    v_secret := NEW.password;
    INSERT INTO public.user_credentials (user_type, profile_id, password_hash, must_change_password, password_updated_at)
    VALUES ('STUDENT', NEW.id, public.hash_erp_secret(v_secret), false, timezone('utc'::text, now()))
    ON CONFLICT (user_type, profile_id) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        must_change_password = false,
        failed_login_attempts = 0,
        locked_until = NULL,
        password_updated_at = timezone('utc'::text, now());
  ELSIF TG_OP = 'INSERT' AND NEW.date_of_birth IS NOT NULL AND COALESCE(NEW.mobile_number, NEW.phone) IS NOT NULL THEN
    v_clean_mob := regexp_replace(COALESCE(NEW.mobile_number, NEW.phone), '\D', '', 'g');
    IF length(v_clean_mob) >= 2 THEN
      v_secret := to_char(NEW.date_of_birth, 'DDMMYYYY') || right(v_clean_mob, 2);
      INSERT INTO public.user_credentials (user_type, profile_id, password_hash, must_change_password)
      VALUES ('STUDENT', NEW.id, public.hash_erp_secret(v_secret), true)
      ON CONFLICT (user_type, profile_id) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_credentials (user_type, profile_id, password_hash, must_change_password)
    VALUES ('STUDENT', NEW.id, NULL, true)
    ON CONFLICT (user_type, profile_id) DO NOTHING;
  END IF;

  NEW.password := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_secure_student_credentials_trigger ON public.students;
CREATE TRIGGER trg_secure_student_credentials_trigger
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.trg_secure_student_credentials();

-- Trigger for faculty: hashes incoming NEW.password into user_credentials and nulls NEW.password
CREATE OR REPLACE FUNCTION public.trg_secure_faculty_credentials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := uuid_generate_v4();
  END IF;

  IF NEW.password IS NOT NULL AND TRIM(NEW.password) <> '' THEN
    INSERT INTO public.user_credentials (user_type, profile_id, password_hash, must_change_password, password_updated_at)
    VALUES ('FACULTY', NEW.id, public.hash_erp_secret(NEW.password), false, timezone('utc'::text, now()))
    ON CONFLICT (user_type, profile_id) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        must_change_password = false,
        failed_login_attempts = 0,
        locked_until = NULL,
        password_updated_at = timezone('utc'::text, now());
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_credentials (user_type, profile_id, password_hash, must_change_password)
    VALUES ('FACULTY', NEW.id, NULL, true)
    ON CONFLICT (user_type, profile_id) DO NOTHING;
  END IF;

  NEW.password := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_secure_faculty_credentials_trigger ON public.faculty;
CREATE TRIGGER trg_secure_faculty_credentials_trigger
BEFORE INSERT OR UPDATE ON public.faculty
FOR EACH ROW
EXECUTE FUNCTION public.trg_secure_faculty_credentials();

-- Cleanup triggers on deletion
CREATE OR REPLACE FUNCTION public.trg_cleanup_credentials_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_credentials WHERE profile_id = OLD.id;
  DELETE FROM public.erp_sessions WHERE profile_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_student_creds ON public.students;
CREATE TRIGGER trg_cleanup_student_creds
AFTER DELETE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.trg_cleanup_credentials_on_delete();

DROP TRIGGER IF EXISTS trg_cleanup_faculty_creds ON public.faculty;
CREATE TRIGGER trg_cleanup_faculty_creds
AFTER DELETE ON public.faculty
FOR EACH ROW
EXECUTE FUNCTION public.trg_cleanup_credentials_on_delete();

-- ==============================================================================
-- 6. SERVER-SIDE SESSION & ROLE RESOLUTION HELPERS (POSTGREST + AUTH.UID)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_erp_request_header(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(TRIM(COALESCE(
    (current_setting('request.headers', true)::jsonb ->> LOWER(p_name)),
    (current_setting('request.headers', true)::jsonb ->> p_name)
  )), '');
$$;

CREATE OR REPLACE FUNCTION public.get_active_erp_session()
RETURNS TABLE (
  session_id UUID,
  user_type TEXT,
  profile_id UUID,
  active_role TEXT,
  roles TEXT[],
  department_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_token TEXT;
  v_token_hash TEXT;
  v_auth_uid UUID;
  v_email TEXT;
  v_email_verified BOOLEAN;
  v_sess RECORD;
BEGIN
  -- 1. Check in-memory session token transmitted via x-erp-session header
  v_token := public.get_erp_request_header('x-erp-session');
  IF v_token IS NOT NULL THEN
    v_token_hash := encode(digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');
    SELECT s.* INTO v_sess
    FROM public.erp_sessions s
    WHERE s.token_hash = v_token_hash
      AND s.revoked = false
      AND s.expires_at > timezone('utc'::text, now())
    LIMIT 1;

    IF FOUND THEN
      -- Reject session if device is actively quarantined
      IF v_sess.device_fingerprint IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.security_quarantined_devices q
        WHERE q.device_fingerprint = v_sess.device_fingerprint AND q.is_active = true
      ) THEN
        RETURN;
      END IF;

      -- If global security pause is enabled, allow only SUPER_ADMIN / PRINCIPAL
      IF EXISTS (SELECT 1 FROM public.system_security_state st WHERE st.id = 1 AND st.is_paused = true)
         AND NOT (v_sess.active_role IN ('SUPER_ADMIN', 'PRINCIPAL') OR 'SUPER_ADMIN' = ANY(v_sess.roles)) THEN
        RETURN;
      END IF;

      session_id := v_sess.id;
      user_type := v_sess.user_type;
      profile_id := v_sess.profile_id;
      active_role := v_sess.active_role;
      roles := v_sess.roles;
      department_id := v_sess.department_id;
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  -- 2. Fallback: Verified Supabase Auth JWT session (auth.uid())
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NOT NULL THEN
    v_email := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
    v_email_verified := LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'email_verified', auth.jwt() ->> 'email_verified', 'false')) = 'true';

    -- Check system_admins
    IF EXISTS (SELECT 1 FROM public.system_admins sa WHERE sa.auth_user_id = v_auth_uid AND sa.is_active = true)
       OR (v_email_verified AND v_email <> '' AND EXISTS (SELECT 1 FROM public.system_admins sa WHERE (LOWER(sa.email) = v_email OR LOWER(sa.google_email) = v_email) AND sa.is_active = true)) THEN
      SELECT NULL::UUID, 'ADMIN'::TEXT, sa.id, COALESCE(sa.roles[1], 'SUPER_ADMIN'), sa.roles, NULL::UUID
      INTO session_id, user_type, profile_id, active_role, roles, department_id
      FROM public.system_admins sa
      WHERE sa.auth_user_id = v_auth_uid OR (v_email_verified AND (LOWER(sa.email) = v_email OR LOWER(sa.google_email) = v_email))
      LIMIT 1;
      RETURN NEXT;
      RETURN;
    END IF;

    -- Check faculty
    IF EXISTS (SELECT 1 FROM public.faculty f WHERE f.auth_user_id = v_auth_uid AND COALESCE(f.is_active, true) = true) THEN
      SELECT NULL::UUID, 'FACULTY'::TEXT, f.id, COALESCE(f.roles[1], 'TEACHER'), f.roles, f.department_id
      INTO session_id, user_type, profile_id, active_role, roles, department_id
      FROM public.faculty f
      WHERE f.auth_user_id = v_auth_uid
      LIMIT 1;
      RETURN NEXT;
      RETURN;
    END IF;

    -- Check students
    IF EXISTS (SELECT 1 FROM public.students st WHERE st.auth_user_id = v_auth_uid AND COALESCE(st.is_active, true) = true) THEN
      SELECT NULL::UUID, 'STUDENT'::TEXT, st.id, 'STUDENT'::TEXT, ARRAY['STUDENT']::TEXT[], COALESCE(st.home_department_id, st.department_id)
      INTO session_id, user_type, profile_id, active_role, roles, department_id
      FROM public.students st
      WHERE st.auth_user_id = v_auth_uid
      LIMIT 1;
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_erp_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.get_active_erp_session());
$$;

CREATE OR REPLACE FUNCTION public.current_erp_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT profile_id FROM public.get_active_erp_session() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_erp_user_type()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type FROM public.get_active_erp_session() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_erp_active_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT active_role FROM public.get_active_erp_session() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_erp_department_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM public.get_active_erp_session() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_erp_role(p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_active_erp_session() s
    WHERE s.active_role = p_role OR p_role = ANY(s.roles) OR s.active_role = 'SUPER_ADMIN' OR 'SUPER_ADMIN' = ANY(s.roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_erp_executive()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_erp_role('SUPER_ADMIN') OR public.has_erp_role('PRINCIPAL');
$$;

CREATE OR REPLACE FUNCTION public.is_erp_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_erp_role('SUPER_ADMIN')
      OR public.has_erp_role('PRINCIPAL')
      OR public.has_erp_role('HOD')
      OR public.has_erp_role('OFFICE_STAFF');
$$;

CREATE OR REPLACE FUNCTION public.is_erp_faculty()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_active_erp_session() s
    WHERE s.user_type IN ('FACULTY', 'ADMIN')
      AND s.active_role <> 'STUDENT'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_erp_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_active_erp_session() s
    WHERE s.user_type = 'STUDENT' AND s.active_role = 'STUDENT'
  );
$$;

-- Compatibility wrappers for any legacy helper callers
CREATE OR REPLACE FUNCTION public.get_current_faculty_id() RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.current_erp_user_type() IN ('FACULTY', 'ADMIN') THEN public.current_erp_profile_id() ELSE NULL END;
$$;
CREATE OR REPLACE FUNCTION public.get_current_student_id() RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.current_erp_user_type() = 'STUDENT' THEN public.current_erp_profile_id() ELSE NULL END;
$$;
CREATE OR REPLACE FUNCTION public.is_faculty() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_erp_faculty();
$$;
CREATE OR REPLACE FUNCTION public.is_student() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_erp_student();
$$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_erp_admin();
$$;
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_erp_role(required_role);
$$;
CREATE OR REPLACE FUNCTION public.get_current_department_id() RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_erp_department_id();
$$;

-- ==============================================================================
-- 7. SERVER-SIDE AUTHENTICATION, BOOTSTRAP CLAIM, & CREDENTIAL RPCS
-- ==============================================================================

-- Internal helper to mint a cryptographic session token (raw token returned ONCE; SHA-256 stored)
CREATE OR REPLACE FUNCTION public._issue_erp_session(
  p_user_type TEXT,
  p_profile_id UUID,
  p_roles TEXT[],
  p_active_role TEXT,
  p_department_id UUID,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_raw_token TEXT;
  v_token_hash TEXT;
BEGIN
  v_raw_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(convert_to(v_raw_token, 'UTF8'), 'sha256'), 'hex');

  INSERT INTO public.erp_sessions (
    token_hash, user_type, profile_id, roles, active_role, department_id,
    device_fingerprint, expires_at, revoked
  )
  VALUES (
    v_token_hash,
    p_user_type,
    p_profile_id,
    COALESCE(NULLIF(p_roles, '{}'), ARRAY[p_active_role]),
    p_active_role,
    p_department_id,
    p_device_fingerprint,
    timezone('utc'::text, now()) + interval '12 hours',
    false
  );

  RETURN v_raw_token;
END;
$$;

-- 7.1 Check if initial Super Admin password has been claimed yet (never leaks credentials)
CREATE OR REPLACE FUNCTION public.get_bootstrap_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claimed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_credentials
    WHERE user_type = 'ADMIN' AND password_hash IS NOT NULL
  ) INTO v_claimed;

  RETURN jsonb_build_object(
    'admin_claimed', v_claimed,
    'security_level', COALESCE((SELECT security_level FROM public.system_security_state WHERE id = 1), 'HIGH_SHIELD')
  );
END;
$$;

-- 7.2 First-Run One-Time Super Admin Setup Claim (Locks permanently once password hash exists)
CREATE OR REPLACE FUNCTION public.claim_initial_admin(
  p_username TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_password TEXT,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_username TEXT := LOWER(TRIM(COALESCE(p_username, '')));
  v_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
  v_full_name TEXT := TRIM(COALESCE(p_full_name, 'System Super Administrator'));
  v_admin_id UUID;
  v_token TEXT;
BEGIN
  -- Serialize concurrent bootstrap attempts cleanly
  LOCK TABLE public.system_admins IN EXCLUSIVE MODE;

  IF EXISTS (
    SELECT 1 FROM public.user_credentials
    WHERE user_type = 'ADMIN' AND password_hash IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Initial Super Admin setup has already been claimed. Please sign in normally.');
  END IF;

  IF length(v_username) < 4 OR v_username ~ '\s' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username must be at least 4 characters without spaces.');
  END IF;

  IF v_email = '' OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'A valid administrator email address is required.');
  END IF;

  IF p_password IS NULL OR length(p_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Administrator password must be at least 8 characters long.');
  END IF;

  SELECT id INTO v_admin_id FROM public.system_admins WHERE LOWER(email) = v_email LIMIT 1;

  IF v_admin_id IS NULL THEN
    INSERT INTO public.system_admins (username, full_name, email, roles, google_email, is_active)
    VALUES (v_username, v_full_name, v_email, ARRAY['SUPER_ADMIN', 'PRINCIPAL'], v_email, true)
    RETURNING id INTO v_admin_id;
  ELSE
    UPDATE public.system_admins
    SET username = v_username,
        full_name = v_full_name,
        is_active = true
    WHERE id = v_admin_id;
  END IF;

  INSERT INTO public.user_credentials (user_type, profile_id, password_hash, must_change_password)
  VALUES ('ADMIN', v_admin_id, public.hash_erp_secret(p_password), false)
  ON CONFLICT (user_type, profile_id) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      must_change_password = false,
      failed_login_attempts = 0,
      locked_until = NULL,
      password_updated_at = timezone('utc'::text, now());

  v_token := public._issue_erp_session(
    'ADMIN', v_admin_id, ARRAY['SUPER_ADMIN', 'PRINCIPAL'], 'SUPER_ADMIN', NULL, p_device_fingerprint
  );

  INSERT INTO public.audit_logs (actor_id, actor_name, actor_role, action, entity_type, entity_id, details)
  VALUES (v_admin_id::text, v_full_name, 'SUPER_ADMIN', 'INITIAL_ADMIN_CLAIMED', 'system_admins', v_admin_id::text, jsonb_build_object('email', v_email));

  RETURN jsonb_build_object(
    'success', true,
    'session_token', v_token,
    'user_type', 'ADMIN',
    'must_change_password', false,
    'user', jsonb_build_object(
      'id', v_admin_id,
      'name', v_full_name,
      'username', v_username,
      'email', v_email,
      'roles', ARRAY['SUPER_ADMIN', 'PRINCIPAL'],
      'activeRole', 'SUPER_ADMIN'
    )
  );
END;
$$;

-- 7.3 Institutional Login (Server-side bcrypt verification + brute-force lockout + session minting)
CREATE OR REPLACE FUNCTION public.verify_institutional_login(
  p_role_mode TEXT,
  p_identifier TEXT,
  p_password TEXT,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_mode TEXT := UPPER(TRIM(COALESCE(p_role_mode, 'STAFF')));
  v_ident TEXT := TRIM(COALESCE(p_identifier, ''));
  v_ident_lower TEXT := LOWER(v_ident);
  v_rate_key TEXT := v_mode || ':' || v_ident_lower;
  v_locked_until TIMESTAMPTZ := NULL;
  v_new_attempts INT := 0;
  v_cred_hash TEXT := NULL;
  v_must_change BOOLEAN := false;
  v_admin RECORD;
  v_fac RECORD;
  v_stu RECORD;
  v_token TEXT;
  v_active_role TEXT;
  v_roles TEXT[];
  v_maint BOOLEAN := false;
BEGIN
  -- 1. Reject actively quarantined devices
  IF p_device_fingerprint IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.security_quarantined_devices
    WHERE device_fingerprint = p_device_fingerprint AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This device is quarantined due to security policy violations. Contact Super Administrator.');
  END IF;

  IF v_ident = '' OR p_password IS NULL OR p_password = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Identifier and password are required.');
  END IF;

  -- 2. Rate limiting & progressive lockout check (5 failed attempts -> 15 min lock)
  SELECT locked_until INTO v_locked_until FROM public.security_rate_limits WHERE key = v_rate_key;
  IF v_locked_until IS NOT NULL AND v_locked_until > timezone('utc'::text, now()) THEN
    RETURN jsonb_build_object('success', false, 'locked', true, 'error', 'Too many failed login attempts. Account temporarily locked for security.');
  END IF;

  -- 3. Resolve target profile by portal mode
  IF v_mode = 'ADMIN' THEN
    SELECT * INTO v_admin FROM public.system_admins
    WHERE is_active = true
      AND (LOWER(username) = v_ident_lower OR LOWER(email) = v_ident_lower)
    LIMIT 1;

    IF FOUND THEN
      v_cred_hash := NULL;
      v_must_change := false;
      SELECT password_hash, COALESCE(must_change_password, false)
      INTO v_cred_hash, v_must_change
      FROM public.user_credentials
      WHERE user_type = 'ADMIN' AND profile_id = v_admin.id;

      IF FOUND AND v_cred_hash IS NOT NULL AND crypt(p_password, v_cred_hash) = v_cred_hash THEN
        DELETE FROM public.security_rate_limits WHERE key = v_rate_key;
        v_roles := COALESCE(NULLIF(v_admin.roles, '{}'), ARRAY['SUPER_ADMIN']);
        v_active_role := v_roles[1];
        v_token := public._issue_erp_session('ADMIN', v_admin.id, v_roles, v_active_role, NULL, p_device_fingerprint);

        RETURN jsonb_build_object(
          'success', true,
          'session_token', v_token,
          'user_type', 'ADMIN',
          'must_change_password', v_must_change,
          'user', jsonb_build_object(
            'id', v_admin.id,
            'name', v_admin.full_name,
            'username', v_admin.username,
            'email', v_admin.email,
            'roles', v_roles,
            'activeRole', v_active_role
          )
        );
      END IF;
    END IF;

    -- Also allow faculty holding SUPER_ADMIN or PRINCIPAL roles to log in via Admin portal
    SELECT * INTO v_fac FROM public.faculty
    WHERE COALESCE(is_active, true) = true
      AND (LOWER(username) = v_ident_lower OR LOWER(email) = v_ident_lower OR LOWER(employee_id) = v_ident_lower)
      AND ('SUPER_ADMIN' = ANY(roles) OR 'PRINCIPAL' = ANY(roles))
    LIMIT 1;

    IF FOUND THEN
      v_cred_hash := NULL;
      v_must_change := false;
      SELECT password_hash, COALESCE(must_change_password, false)
      INTO v_cred_hash, v_must_change
      FROM public.user_credentials
      WHERE user_type = 'FACULTY' AND profile_id = v_fac.id;

      IF FOUND AND v_cred_hash IS NOT NULL AND crypt(p_password, v_cred_hash) = v_cred_hash THEN
        DELETE FROM public.security_rate_limits WHERE key = v_rate_key;
        v_roles := COALESCE(NULLIF(v_fac.roles, '{}'), ARRAY['PRINCIPAL']);
        v_active_role := CASE WHEN 'SUPER_ADMIN' = ANY(v_roles) THEN 'SUPER_ADMIN' ELSE v_roles[1] END;
        v_token := public._issue_erp_session('FACULTY', v_fac.id, v_roles, v_active_role, v_fac.department_id, p_device_fingerprint);

        RETURN jsonb_build_object(
          'success', true,
          'session_token', v_token,
          'user_type', 'FACULTY',
          'must_change_password', v_must_change,
          'user', jsonb_build_object(
            'id', v_fac.id,
            'name', v_fac.full_name,
            'username', COALESCE(v_fac.username, v_fac.email),
            'email', v_fac.email,
            'departmentId', v_fac.department_id,
            'roles', v_roles,
            'activeRole', v_active_role,
            'facultyProfile', jsonb_build_object(
              'id', v_fac.id,
              'fullName', v_fac.full_name,
              'email', v_fac.email,
              'phone', COALESCE(v_fac.phone, v_fac.mobile_number),
              'departmentId', v_fac.department_id,
              'designation', v_fac.designation,
              'employeeId', v_fac.employee_id,
              'roles', v_roles,
              'status', v_fac.status
            )
          )
        );
      END IF;
    END IF;

  ELSIF v_mode = 'STUDENT' THEN
    SELECT COALESCE(maintenance_mode, false) OR NOT COALESCE(enable_student_portal, true) INTO v_maint
    FROM public.system_settings LIMIT 1;

    SELECT * INTO v_stu FROM public.students
    WHERE COALESCE(is_active, true) = true
      AND (
        LOWER(COALESCE(username, '')) = v_ident_lower
        OR LOWER(COALESCE(university_register_number, '')) = v_ident_lower
        OR LOWER(COALESCE(admission_number, '')) = v_ident_lower
        OR LOWER(COALESCE(email, '')) = v_ident_lower
      )
    LIMIT 1;

    IF FOUND THEN
      v_cred_hash := NULL;
      v_must_change := false;
      SELECT password_hash, COALESCE(must_change_password, false)
      INTO v_cred_hash, v_must_change
      FROM public.user_credentials
      WHERE user_type = 'STUDENT' AND profile_id = v_stu.id;

      IF FOUND AND v_cred_hash IS NOT NULL AND crypt(p_password, v_cred_hash) = v_cred_hash THEN
        DELETE FROM public.security_rate_limits WHERE key = v_rate_key;
        v_token := public._issue_erp_session(
          'STUDENT', v_stu.id, ARRAY['STUDENT'], 'STUDENT', COALESCE(v_stu.home_department_id, v_stu.department_id), p_device_fingerprint
        );

        RETURN jsonb_build_object(
          'success', true,
          'session_token', v_token,
          'user_type', 'STUDENT',
          'must_change_password', v_must_change,
          'user', jsonb_build_object(
            'id', v_stu.id,
            'name', v_stu.full_name,
            'username', COALESCE(v_stu.username, v_stu.university_register_number, v_stu.admission_number),
            'email', v_stu.email,
            'departmentId', COALESCE(v_stu.home_department_id, v_stu.department_id),
            'roles', ARRAY['STUDENT'],
            'activeRole', 'STUDENT',
            'studentProfile', jsonb_build_object(
              'id', v_stu.id,
              'fullName', v_stu.full_name,
              'rollNumber', v_stu.roll_number,
              'admissionNumber', v_stu.admission_number,
              'universityRegisterNumber', v_stu.university_register_number,
              'email', v_stu.email,
              'mobileNumber', COALESCE(v_stu.mobile_number, v_stu.phone),
              'programmeId', v_stu.programme_id,
              'homeDepartmentId', COALESCE(v_stu.home_department_id, v_stu.department_id),
              'currentSemester', v_stu.current_semester,
              'yearOfStudy', v_stu.year_of_study,
              'admissionBatch', v_stu.admission_batch,
              'status', COALESCE(v_stu.student_status, v_stu.status)
            )
          )
        );
      END IF;
    END IF;

  ELSE
    -- STAFF / FACULTY portal
    SELECT * INTO v_fac FROM public.faculty
    WHERE COALESCE(is_active, true) = true
      AND (
        LOWER(COALESCE(username, '')) = v_ident_lower
        OR LOWER(COALESCE(email, '')) = v_ident_lower
        OR LOWER(COALESCE(employee_id, '')) = v_ident_lower
        OR LOWER(COALESCE(employee_code, '')) = v_ident_lower
      )
    LIMIT 1;

    IF FOUND THEN
      v_cred_hash := NULL;
      v_must_change := false;
      SELECT password_hash, COALESCE(must_change_password, false)
      INTO v_cred_hash, v_must_change
      FROM public.user_credentials
      WHERE user_type = 'FACULTY' AND profile_id = v_fac.id;

      IF FOUND AND v_cred_hash IS NOT NULL AND crypt(p_password, v_cred_hash) = v_cred_hash THEN
        DELETE FROM public.security_rate_limits WHERE key = v_rate_key;
        v_roles := COALESCE(NULLIF(v_fac.roles, '{}'), ARRAY['TEACHER']);
        v_active_role := CASE
          WHEN 'HOD' = ANY(v_roles) THEN 'HOD'
          WHEN 'PRINCIPAL' = ANY(v_roles) THEN 'PRINCIPAL'
          WHEN 'SUPER_ADMIN' = ANY(v_roles) THEN 'SUPER_ADMIN'
          ELSE v_roles[1]
        END;
        v_token := public._issue_erp_session('FACULTY', v_fac.id, v_roles, v_active_role, v_fac.department_id, p_device_fingerprint);

        RETURN jsonb_build_object(
          'success', true,
          'session_token', v_token,
          'user_type', 'FACULTY',
          'must_change_password', v_must_change,
          'user', jsonb_build_object(
            'id', v_fac.id,
            'name', v_fac.full_name,
            'username', COALESCE(v_fac.username, v_fac.email),
            'email', v_fac.email,
            'departmentId', v_fac.department_id,
            'roles', v_roles,
            'activeRole', v_active_role,
            'facultyProfile', jsonb_build_object(
              'id', v_fac.id,
              'fullName', v_fac.full_name,
              'email', v_fac.email,
              'phone', COALESCE(v_fac.phone, v_fac.mobile_number),
              'departmentId', v_fac.department_id,
              'designation', v_fac.designation,
              'employeeId', v_fac.employee_id,
              'roles', v_roles,
              'status', v_fac.status
            )
          )
        );
      END IF;
    END IF;

    -- Also allow Super Admins from system_admins to authenticate via the unified Staff portal tab
    SELECT * INTO v_admin FROM public.system_admins
    WHERE is_active = true
      AND (LOWER(username) = v_ident_lower OR LOWER(email) = v_ident_lower)
    LIMIT 1;

    IF FOUND THEN
      v_cred_hash := NULL;
      v_must_change := false;
      SELECT password_hash, COALESCE(must_change_password, false)
      INTO v_cred_hash, v_must_change
      FROM public.user_credentials
      WHERE user_type = 'ADMIN' AND profile_id = v_admin.id;

      IF FOUND AND v_cred_hash IS NOT NULL AND crypt(p_password, v_cred_hash) = v_cred_hash THEN
        DELETE FROM public.security_rate_limits WHERE key = v_rate_key;
        v_roles := COALESCE(NULLIF(v_admin.roles, '{}'), ARRAY['SUPER_ADMIN']);
        v_active_role := v_roles[1];
        v_token := public._issue_erp_session('ADMIN', v_admin.id, v_roles, v_active_role, NULL, p_device_fingerprint);

        RETURN jsonb_build_object(
          'success', true,
          'session_token', v_token,
          'user_type', 'ADMIN',
          'must_change_password', v_must_change,
          'user', jsonb_build_object(
            'id', v_admin.id,
            'name', v_admin.full_name,
            'username', v_admin.username,
            'email', v_admin.email,
            'roles', v_roles,
            'activeRole', v_active_role
          )
        );
      END IF;
    END IF;
  END IF;

  -- Record failed login attempt in rate limiter
  INSERT INTO public.security_rate_limits (key, failed_attempts, window_started_at, locked_until, updated_at)
  VALUES (
    v_rate_key,
    1,
    timezone('utc'::text, now()),
    NULL,
    timezone('utc'::text, now())
  )
  ON CONFLICT (key) DO UPDATE
  SET failed_attempts = CASE
        WHEN public.security_rate_limits.window_started_at < timezone('utc'::text, now()) - interval '15 minutes'
          THEN 1
        ELSE public.security_rate_limits.failed_attempts + 1
      END,
      window_started_at = CASE
        WHEN public.security_rate_limits.window_started_at < timezone('utc'::text, now()) - interval '15 minutes'
          THEN timezone('utc'::text, now())
        ELSE public.security_rate_limits.window_started_at
      END,
      locked_until = CASE
        WHEN (
          CASE
            WHEN public.security_rate_limits.window_started_at < timezone('utc'::text, now()) - interval '15 minutes'
              THEN 1
            ELSE public.security_rate_limits.failed_attempts + 1
          END
        ) >= 5 THEN timezone('utc'::text, now()) + interval '15 minutes'
        ELSE NULL
      END,
      updated_at = timezone('utc'::text, now())
  RETURNING failed_attempts INTO v_new_attempts;

  IF COALESCE(v_new_attempts, 0) >= 5 THEN
    INSERT INTO public.security_incidents (event_type, severity, description, actor_name, device_fingerprint)
    VALUES ('BRUTE_FORCE_AUTH_LOCKOUT', 'HIGH', '5+ consecutive invalid login attempts triggered automatic 15-minute lockout.', v_ident_lower, p_device_fingerprint);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials. Please verify your identifier and password.');
END;
$$;

-- 7.4 Verify & Link Google Account (Requires verified password challenge for institutional accounts)
CREATE OR REPLACE FUNCTION public.verify_and_link_google_account(
  p_google_email TEXT,
  p_google_uid TEXT,
  p_role_mode TEXT,
  p_identifier TEXT,
  p_password TEXT,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_login_res JSONB;
  v_email TEXT := LOWER(TRIM(COALESCE(p_google_email, '')));
  v_uid TEXT := TRIM(COALESCE(p_google_uid, ''));
  v_user_id UUID;
  v_user_type TEXT;
BEGIN
  IF v_email = '' OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'A verified Google email address is required.');
  END IF;

  v_login_res := public.verify_institutional_login(p_role_mode, p_identifier, p_password, p_device_fingerprint);
  IF NOT COALESCE((v_login_res ->> 'success')::BOOLEAN, false) THEN
    RETURN v_login_res;
  END IF;

  v_user_id := (v_login_res -> 'user' ->> 'id')::UUID;
  v_user_type := v_login_res ->> 'user_type';

  IF v_user_type = 'ADMIN' THEN
    UPDATE public.system_admins SET google_email = v_email, google_uid = NULLIF(v_uid, '') WHERE id = v_user_id;
  ELSIF v_user_type = 'FACULTY' THEN
    UPDATE public.faculty SET google_email = v_email, google_uid = NULLIF(v_uid, '') WHERE id = v_user_id;
  ELSIF v_user_type = 'STUDENT' THEN
    UPDATE public.students SET google_email = v_email, google_uid = NULLIF(v_uid, '') WHERE id = v_user_id;
  END IF;

  RETURN v_login_res;
END;
$$;

-- 7.5 Complete Login Using Cryptographically Verified Supabase Auth JWT (auth.jwt())
CREATE OR REPLACE FUNCTION public.complete_supabase_jwt_login(
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_verified BOOLEAN;
  v_admin RECORD;
  v_fac RECORD;
  v_stu RECORD;
  v_roles TEXT[];
  v_active_role TEXT;
  v_token TEXT;
  v_must_change BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No verified Supabase authentication session found.');
  END IF;

  v_email := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
  v_verified := LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'email_verified', auth.jwt() ->> 'email_verified', 'false')) = 'true';

  IF NOT v_verified OR v_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Google email verification is required before signing in.');
  END IF;

  IF p_device_fingerprint IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.security_quarantined_devices WHERE device_fingerprint = p_device_fingerprint AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Device is currently quarantined.');
  END IF;

  -- 1. Check system_admins
  SELECT * INTO v_admin FROM public.system_admins
  WHERE is_active = true AND (auth_user_id = v_uid OR LOWER(email) = v_email OR LOWER(COALESCE(google_email, '')) = v_email)
  LIMIT 1;
  IF FOUND THEN
    UPDATE public.system_admins SET auth_user_id = COALESCE(auth_user_id, v_uid), google_email = COALESCE(google_email, v_email) WHERE id = v_admin.id;
    v_roles := COALESCE(NULLIF(v_admin.roles, '{}'), ARRAY['SUPER_ADMIN']);
    v_active_role := v_roles[1];
    v_token := public._issue_erp_session('ADMIN', v_admin.id, v_roles, v_active_role, NULL, p_device_fingerprint);
    RETURN jsonb_build_object(
      'success', true,
      'session_token', v_token,
      'user_type', 'ADMIN',
      'must_change_password', false,
      'user', jsonb_build_object(
        'id', v_admin.id,
        'name', v_admin.full_name,
        'username', v_admin.username,
        'email', v_admin.email,
        'roles', v_roles,
        'activeRole', v_active_role
      )
    );
  END IF;

  -- 2. Check faculty
  SELECT * INTO v_fac FROM public.faculty
  WHERE COALESCE(is_active, true) = true AND (auth_user_id = v_uid OR LOWER(email) = v_email OR LOWER(COALESCE(google_email, '')) = v_email)
  LIMIT 1;
  IF FOUND THEN
    UPDATE public.faculty SET auth_user_id = COALESCE(auth_user_id, v_uid), google_email = COALESCE(google_email, v_email) WHERE id = v_fac.id;
    v_roles := COALESCE(NULLIF(v_fac.roles, '{}'), ARRAY['TEACHER']);
    v_active_role := v_roles[1];
    v_token := public._issue_erp_session('FACULTY', v_fac.id, v_roles, v_active_role, v_fac.department_id, p_device_fingerprint);
    RETURN jsonb_build_object(
      'success', true,
      'session_token', v_token,
      'user_type', 'FACULTY',
      'must_change_password', false,
      'user', jsonb_build_object(
        'id', v_fac.id,
        'name', v_fac.full_name,
        'username', COALESCE(v_fac.username, v_fac.email),
        'email', v_fac.email,
        'departmentId', v_fac.department_id,
        'roles', v_roles,
        'activeRole', v_active_role
      )
    );
  END IF;

  -- 3. Check students
  SELECT * INTO v_stu FROM public.students
  WHERE COALESCE(is_active, true) = true AND (auth_user_id = v_uid OR LOWER(email) = v_email OR LOWER(COALESCE(google_email, '')) = v_email)
  LIMIT 1;
  IF FOUND THEN
    UPDATE public.students SET auth_user_id = COALESCE(auth_user_id, v_uid), google_email = COALESCE(google_email, v_email) WHERE id = v_stu.id;
    v_token := public._issue_erp_session('STUDENT', v_stu.id, ARRAY['STUDENT'], 'STUDENT', COALESCE(v_stu.home_department_id, v_stu.department_id), p_device_fingerprint);
    RETURN jsonb_build_object(
      'success', true,
      'session_token', v_token,
      'user_type', 'STUDENT',
      'must_change_password', false,
      'user', jsonb_build_object(
        'id', v_stu.id,
        'name', v_stu.full_name,
        'username', COALESCE(v_stu.username, v_stu.university_register_number, v_stu.admission_number),
        'email', v_stu.email,
        'departmentId', COALESCE(v_stu.home_department_id, v_stu.department_id),
        'roles', ARRAY['STUDENT'],
        'activeRole', 'STUDENT'
      )
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'needs_linking', true, 'email', v_email, 'error', 'Google account verified, but not yet linked to any campus profile.');
END;
$$;

-- 7.6 Server-verified role switch (blocks arbitrary role elevation)
CREATE OR REPLACE FUNCTION public.switch_erp_role(p_new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token TEXT := public.get_erp_request_header('x-erp-session');
  v_token_hash TEXT;
  v_sess RECORD;
BEGIN
  IF v_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Active session required.');
  END IF;

  v_token_hash := encode(digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');
  SELECT * INTO v_sess FROM public.erp_sessions
  WHERE token_hash = v_token_hash AND revoked = false AND expires_at > timezone('utc'::text, now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session expired or invalid.');
  END IF;

  IF NOT (p_new_role = ANY(v_sess.roles) OR 'SUPER_ADMIN' = ANY(v_sess.roles)) THEN
    INSERT INTO public.security_incidents (event_type, severity, description, actor_profile_id, actor_role)
    VALUES ('UNAUTHORIZED_ROLE_SWITCH_ATTEMPT', 'CRITICAL', 'Attempted unauthorized switch to role: ' || COALESCE(p_new_role, 'NULL'), v_sess.profile_id, v_sess.active_role);
    RETURN jsonb_build_object('success', false, 'error', 'Access Denied: Target role is not assigned to your account.');
  END IF;

  UPDATE public.erp_sessions SET active_role = p_new_role, last_seen_at = timezone('utc'::text, now()) WHERE id = v_sess.id;
  RETURN jsonb_build_object('success', true, 'activeRole', p_new_role);
END;
$$;

-- 7.7 Logout (server-side session revocation)
CREATE OR REPLACE FUNCTION public.logout_erp_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token TEXT := public.get_erp_request_header('x-erp-session');
  v_token_hash TEXT;
BEGIN
  IF v_token IS NULL THEN RETURN TRUE; END IF;
  v_token_hash := encode(digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');
  UPDATE public.erp_sessions SET revoked = true WHERE token_hash = v_token_hash;
  RETURN TRUE;
END;
$$;

-- 7.8 Self-service password / username update (verifies current bcrypt hash server-side)
CREATE OR REPLACE FUNCTION public.change_own_credentials(
  p_current_password TEXT,
  p_new_username TEXT DEFAULT NULL,
  p_new_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sess RECORD;
  v_cred_id UUID := NULL;
  v_cred_hash TEXT := NULL;
  v_clean_username TEXT := NULLIF(TRIM(COALESCE(p_new_username, '')), '');
BEGIN
  SELECT * INTO v_sess FROM public.get_active_erp_session() LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;

  SELECT id, password_hash INTO v_cred_id, v_cred_hash FROM public.user_credentials
  WHERE user_type = v_sess.user_type AND profile_id = v_sess.profile_id;

  IF NOT FOUND OR v_cred_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credential record not initialized. Contact administrator.');
  END IF;

  IF p_current_password IS NULL OR crypt(p_current_password, v_cred_hash) <> v_cred_hash THEN
    RETURN jsonb_build_object('success', false, 'error', 'Current password is incorrect.');
  END IF;

  IF p_new_password IS NOT NULL AND TRIM(p_new_password) <> '' THEN
    IF length(p_new_password) < 4 THEN
      RETURN jsonb_build_object('success', false, 'error', 'New password must be at least 4 characters long.');
    END IF;
    UPDATE public.user_credentials
    SET password_hash = public.hash_erp_secret(p_new_password),
        must_change_password = false,
        password_updated_at = timezone('utc'::text, now())
    WHERE id = v_cred_id;
  END IF;

  IF v_clean_username IS NOT NULL THEN
    IF length(v_clean_username) < 3 OR v_clean_username ~ '\s' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Username must be at least 3 characters with no spaces.');
    END IF;

    IF v_sess.user_type = 'STUDENT' THEN
      UPDATE public.students SET username = UPPER(v_clean_username) WHERE id = v_sess.profile_id;
    ELSIF v_sess.user_type = 'FACULTY' THEN
      UPDATE public.faculty SET username = v_clean_username WHERE id = v_sess.profile_id;
    ELSIF v_sess.user_type = 'ADMIN' THEN
      UPDATE public.system_admins SET username = v_clean_username WHERE id = v_sess.profile_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 7.9 Admin Credential Reset RPC (Hashes reset password server-side, never exposes hashes)
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  p_user_type TEXT,
  p_profile_id UUID,
  p_new_password TEXT,
  p_force_change BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sess RECORD;
  v_target_dept UUID;
  v_type TEXT := UPPER(TRIM(COALESCE(p_user_type, '')));
BEGIN
  SELECT * INTO v_sess FROM public.get_active_erp_session() LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
  END IF;

  IF NOT (public.has_erp_role('SUPER_ADMIN') OR public.has_erp_role('PRINCIPAL') OR (public.has_erp_role('HOD') AND v_type IN ('STUDENT', 'FACULTY'))) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access Denied: Insufficient privileges to reset user credentials.');
  END IF;

  IF v_type = 'ADMIN' AND NOT public.has_erp_role('SUPER_ADMIN') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access Denied: Only Super Admin can reset administrator credentials.');
  END IF;

  -- Scope HOD to their own department
  IF public.has_erp_role('HOD') AND NOT public.is_erp_executive() THEN
    IF v_type = 'STUDENT' THEN
      SELECT COALESCE(home_department_id, department_id) INTO v_target_dept FROM public.students WHERE id = p_profile_id;
    ELSE
      SELECT department_id INTO v_target_dept FROM public.faculty WHERE id = p_profile_id;
    END IF;
    IF v_target_dept IS DISTINCT FROM v_sess.department_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Access Denied: HOD can only reset passwords within their own department.');
    END IF;
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Temporary password must be at least 6 characters long.');
  END IF;

  INSERT INTO public.user_credentials (user_type, profile_id, password_hash, must_change_password, failed_login_attempts, locked_until, password_updated_at)
  VALUES (v_type, p_profile_id, public.hash_erp_secret(p_new_password), p_force_change, 0, NULL, timezone('utc'::text, now()))
  ON CONFLICT (user_type, profile_id) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      must_change_password = EXCLUDED.must_change_password,
      failed_login_attempts = 0,
      locked_until = NULL,
      password_updated_at = timezone('utc'::text, now());

  -- Revoke existing active sessions for the reset account
  UPDATE public.erp_sessions SET revoked = true WHERE user_type = v_type AND profile_id = p_profile_id;

  INSERT INTO public.audit_logs (actor_id, actor_name, actor_role, action, entity_type, entity_id, details)
  VALUES (v_sess.profile_id::text, COALESCE(v_sess.active_role, 'ADMIN'), v_sess.active_role, 'ADMIN_PASSWORD_RESET', v_type, p_profile_id::text, jsonb_build_object('force_change', p_force_change));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ==============================================================================
-- 8. SERVER-SIDE ANTI-HACK SHIELD RPCS (REPLACES CLIENT LOCALSTORAGE SECURITY)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_security_dashboard_state(
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_paused BOOLEAN := false;
  v_security_level TEXT := 'HIGH_SHIELD';
  v_pause_reason TEXT := NULL;
  v_paused_by_name TEXT := NULL;
  v_paused_at TIMESTAMPTZ := NULL;
  v_quarantined BOOLEAN := false;
  v_can_read_logs BOOLEAN := public.is_erp_executive();
BEGIN
  SELECT is_paused, security_level, pause_reason, paused_by_name, paused_at
  INTO v_is_paused, v_security_level, v_pause_reason, v_paused_by_name, v_paused_at
  FROM public.system_security_state WHERE id = 1;

  IF p_device_fingerprint IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.security_quarantined_devices
      WHERE device_fingerprint = p_device_fingerprint AND is_active = true
    ) INTO v_quarantined;
  END IF;

  RETURN jsonb_build_object(
    'is_paused', COALESCE(v_is_paused, false),
    'security_level', COALESCE(v_security_level, 'HIGH_SHIELD'),
    'pause_reason', v_pause_reason,
    'paused_by_name', v_paused_by_name,
    'paused_at', v_paused_at,
    'device_quarantined', v_quarantined,
    'incidents', CASE WHEN v_can_read_logs THEN COALESCE((SELECT jsonb_agg(row_to_json(i) ORDER BY i.created_at DESC) FROM (SELECT * FROM public.security_incidents ORDER BY created_at DESC LIMIT 50) i), '[]'::jsonb) ELSE '[]'::jsonb END,
    'quarantined_devices', CASE WHEN v_can_read_logs THEN COALESCE((SELECT jsonb_agg(row_to_json(q) ORDER BY q.quarantined_at DESC) FROM public.security_quarantined_devices q WHERE q.is_active = true), '[]'::jsonb) ELSE '[]'::jsonb END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.report_security_incident(
  p_event_type TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_device_fingerprint TEXT DEFAULT NULL,
  p_auto_quarantine BOOLEAN DEFAULT false,
  p_auto_pause BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID := NULL;
  v_actor_profile_id UUID := NULL;
  v_actor_role TEXT := NULL;
  v_sess_device_fp TEXT := NULL;
  v_incident_id UUID;
BEGIN
  SELECT session_id, profile_id, active_role
  INTO v_session_id, v_actor_profile_id, v_actor_role
  FROM public.get_active_erp_session() LIMIT 1;

  IF v_session_id IS NOT NULL THEN
    SELECT device_fingerprint INTO v_sess_device_fp
    FROM public.erp_sessions WHERE id = v_session_id;
  END IF;

  INSERT INTO public.security_incidents (
    event_type, severity, description, actor_profile_id, actor_role, device_fingerprint
  )
  VALUES (
    LEFT(COALESCE(p_event_type, 'ANOMALY'), 100),
    LEFT(COALESCE(p_severity, 'HIGH'), 30),
    LEFT(COALESCE(p_description, ''), 2000),
    v_actor_profile_id,
    v_actor_role,
    LEFT(p_device_fingerprint, 128)
  )
  RETURNING id INTO v_incident_id;

  -- Restrict auto-quarantine strictly to authenticated executive admins OR matching caller session device
  IF p_auto_quarantine AND p_device_fingerprint IS NOT NULL AND p_device_fingerprint <> '' THEN
    IF public.is_erp_executive() OR (v_actor_profile_id IS NOT NULL AND v_sess_device_fp = p_device_fingerprint) THEN
      INSERT INTO public.security_quarantined_devices (device_fingerprint, reason, is_active)
      VALUES (LEFT(p_device_fingerprint, 128), LEFT(COALESCE(p_description, 'Quarantined by security shield'), 500), true)
      ON CONFLICT (device_fingerprint) DO UPDATE
      SET is_active = true, reason = EXCLUDED.reason, quarantined_at = timezone('utc'::text, now()), unquarantined_at = NULL;
    END IF;
  END IF;

  -- Only executive-verified security pauses or critical intrusion alerts can toggle pause
  IF p_auto_pause AND public.is_erp_executive() THEN
    UPDATE public.system_security_state
    SET is_paused = true,
        pause_reason = LEFT(COALESCE(p_description, 'Emergency security pause triggered'), 500),
        paused_by_name = COALESCE(v_actor_role, 'SUPER_ADMIN'),
        paused_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = 1;
  END IF;

  RETURN jsonb_build_object('success', true, 'incident_id', v_incident_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_system_pause(
  p_paused BOOLEAN,
  p_reason TEXT DEFAULT NULL,
  p_security_level TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
BEGIN
  IF NOT public.is_erp_executive() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access Denied: Only Super Admin or Principal can alter system security lockdown state.');
  END IF;

  SELECT * INTO v_sess FROM public.get_active_erp_session() LIMIT 1;

  UPDATE public.system_security_state
  SET is_paused = p_paused,
      security_level = COALESCE(NULLIF(p_security_level, ''), security_level),
      pause_reason = CASE WHEN p_paused THEN LEFT(COALESCE(p_reason, 'Paused by executive administrator'), 500) ELSE NULL END,
      paused_by_name = CASE WHEN p_paused THEN v_sess.active_role ELSE NULL END,
      paused_at = CASE WHEN p_paused THEN timezone('utc'::text, now()) ELSE NULL END,
      updated_at = timezone('utc'::text, now())
  WHERE id = 1;

  INSERT INTO public.audit_logs (actor_id, actor_name, actor_role, action, entity_type, entity_id, details)
  VALUES (v_sess.profile_id::text, COALESCE(v_sess.active_role, 'ADMIN'), v_sess.active_role, CASE WHEN p_paused THEN 'SYSTEM_SECURITY_PAUSED' ELSE 'SYSTEM_SECURITY_RESUMED' END, 'system_security_state', '1', jsonb_build_object('reason', p_reason));

  RETURN jsonb_build_object('success', true, 'is_paused', p_paused);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unquarantine_device(
  p_device_fingerprint TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
BEGIN
  IF NOT public.is_erp_executive() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access Denied: Only Super Admin or Principal can release quarantined devices.');
  END IF;

  SELECT * INTO v_sess FROM public.get_active_erp_session() LIMIT 1;

  UPDATE public.security_quarantined_devices
  SET is_active = false,
      unquarantined_at = timezone('utc'::text, now()),
      unquarantined_by = v_sess.active_role
  WHERE device_fingerprint = p_device_fingerprint;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ==============================================================================
-- 9. ATOMIC BUSINESS LOGIC TRIGGERS (PRIVILEGE ESCALATION & APPROVAL GUARDS)
-- ==============================================================================

-- 9.1 Prevent students from modifying protected academic/status fields on students table
CREATE OR REPLACE FUNCTION public.trg_protect_student_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_erp_student() AND NOT public.is_erp_admin() THEN
    NEW.id := OLD.id;
    NEW.auth_user_id := OLD.auth_user_id;
    NEW.admission_number := OLD.admission_number;
    NEW.university_register_number := OLD.university_register_number;
    NEW.roll_number := OLD.roll_number;
    NEW.programme_id := OLD.programme_id;
    NEW.home_department_id := OLD.home_department_id;
    NEW.department_id := OLD.department_id;
    NEW.current_semester := OLD.current_semester;
    NEW.year_of_study := OLD.year_of_study;
    NEW.admission_academic_year := OLD.admission_academic_year;
    NEW.admission_batch := OLD.admission_batch;
    NEW.status := OLD.status;
    NEW.student_status := OLD.student_status;
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_student_fields_trigger ON public.students;
CREATE TRIGGER trg_protect_student_fields_trigger
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.trg_protect_student_privileged_fields();

-- 9.2 Prevent self role-elevation or HOD cross-department/executive elevation on faculty
CREATE OR REPLACE FUNCTION public.trg_protect_faculty_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If not SUPER_ADMIN or PRINCIPAL, block changing roles, status, or promoting to SUPER_ADMIN / PRINCIPAL
  IF NOT public.is_erp_executive() THEN
    IF public.has_erp_role('HOD') THEN
      IF 'SUPER_ADMIN' = ANY(COALESCE(NEW.roles, '{}')) OR 'PRINCIPAL' = ANY(COALESCE(NEW.roles, '{}')) THEN
        RAISE EXCEPTION 'Access Denied: Only Super Admin or Principal can assign executive roles.';
      END IF;
      IF TG_OP = 'INSERT' AND NEW.department_id IS DISTINCT FROM public.current_erp_department_id() THEN
        RAISE EXCEPTION 'Access Denied: HOD can only enroll faculty within their own department.';
      END IF;
    ELSE
      -- Regular faculty updating their own profile cannot alter roles, department, or activation status
      IF TG_OP = 'UPDATE' THEN
        NEW.roles := OLD.roles;
        NEW.department_id := OLD.department_id;
        NEW.status := OLD.status;
        NEW.is_active := OLD.is_active;
        NEW.auth_user_id := OLD.auth_user_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_faculty_roles_trigger ON public.faculty;
CREATE TRIGGER trg_protect_faculty_roles_trigger
BEFORE INSERT OR UPDATE ON public.faculty
FOR EACH ROW
EXECUTE FUNCTION public.trg_protect_faculty_roles();

-- 9.3 Enforce role authority on Special Attendance approval & Correction approval
CREATE OR REPLACE FUNCTION public.trg_guard_special_attendance_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.status IN ('APPROVED', 'REJECTED')) AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NOT public.is_erp_executive() THEN
      RAISE EXCEPTION 'Access Denied: Only Principal or Super Admin may sanction or reject special duty orders.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_special_attendance_approval_trigger ON public.special_attendance_events;
CREATE TRIGGER trg_guard_special_attendance_approval_trigger
BEFORE UPDATE ON public.special_attendance_events
FOR EACH ROW
EXECUTE FUNCTION public.trg_guard_special_attendance_approval();

CREATE OR REPLACE FUNCTION public.trg_guard_correction_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.status IN ('APPROVED', 'REJECTED')) AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NOT (public.is_erp_executive() OR public.has_erp_role('HOD')) THEN
      RAISE EXCEPTION 'Access Denied: Only HOD, Principal, or Super Admin can approve or reject attendance corrections.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_correction_review_trigger ON public.attendance_correction_requests;
CREATE TRIGGER trg_guard_correction_review_trigger
BEFORE UPDATE ON public.attendance_correction_requests
FOR EACH ROW
EXECUTE FUNCTION public.trg_guard_correction_review();

-- 9.4 Guard circulars so students can ONLY acknowledge (append their own ID), never alter circular content
CREATE OR REPLACE FUNCTION public.trg_guard_circular_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_erp_faculty() THEN
    NEW.reference_number := OLD.reference_number;
    NEW.title := OLD.title;
    NEW.description := OLD.description;
    NEW.issuing_authority := OLD.issuing_authority;
    NEW.scope := OLD.scope;
    NEW.target_department_id := OLD.target_department_id;
    NEW.target_programme_id := OLD.target_programme_id;
    NEW.target_batch_id := OLD.target_batch_id;
    NEW.target_semester := OLD.target_semester;
    NEW.target_roles := OLD.target_roles;
    NEW.priority := OLD.priority;
    NEW.effective_from := OLD.effective_from;
    NEW.effective_until := OLD.effective_until;
    NEW.attachment_name := OLD.attachment_name;
    NEW.attachment_url := OLD.attachment_url;
    NEW.requires_acknowledgement := OLD.requires_acknowledgement;
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_circular_update_trigger ON public.circulars;
CREATE TRIGGER trg_guard_circular_update_trigger
BEFORE UPDATE ON public.circulars
FOR EACH ROW
EXECUTE FUNCTION public.trg_guard_circular_update();

-- ==============================================================================
-- 10. DROP ALL LEGACY PERMISSIVE POLICIES & ENABLE/FORCE RLS EVERYWHERE
-- ==============================================================================
DO $$
DECLARE
  pol RECORD;
  tbl RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;

  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tbl.tablename);
  END LOOP;
END $$;

-- ==============================================================================
-- 11. PRIVATE / LOCKED-DOWN TABLES (ZERO DIRECT POSTGREST ACCESS)
-- ==============================================================================
DO $$
DECLARE
  private_tables TEXT[] := ARRAY[
    'system_admins', 'user_credentials', 'erp_sessions', 'security_rate_limits'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY private_tables LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated;', t);
    EXECUTE format('CREATE POLICY "%s_deny_all" ON public.%I FOR ALL USING (false) WITH CHECK (false);', t, t);
  END LOOP;
END $$;

-- System security state & quarantine & security_incidents
REVOKE ALL ON TABLE public.system_security_state FROM PUBLIC, anon, authenticated;
CREATE POLICY "system_security_state_deny_direct" ON public.system_security_state FOR ALL USING (false) WITH CHECK (false);

REVOKE ALL ON TABLE public.security_quarantined_devices FROM PUBLIC, anon, authenticated;
CREATE POLICY "security_quarantine_deny_direct" ON public.security_quarantined_devices FOR ALL USING (false) WITH CHECK (false);

REVOKE ALL ON TABLE public.security_incidents FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.security_incidents TO anon, authenticated;
CREATE POLICY "security_incidents_admin_read" ON public.security_incidents FOR SELECT USING (public.is_erp_executive());
CREATE POLICY "security_incidents_no_update" ON public.security_incidents FOR UPDATE USING (false);
CREATE POLICY "security_incidents_no_delete" ON public.security_incidents FOR DELETE USING (false);

-- ==============================================================================
-- 12. TABLE PRIVILEGES & STRICT LEAST-PRIVILEGE RLS POLICIES
-- ==============================================================================
-- Grant schema usage and controlled CRUD (relying strictly on FORCE ROW LEVEL SECURITY + policies;
-- NO TRUNCATE anywhere; audit logs append-only).
REVOKE ALL ON SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

DO $$
DECLARE
  app_tables TEXT[] := ARRAY[
    'system_settings', 'departments', 'programmes', 'academic_years', 'admission_batches',
    'semesters', 'course_categories', 'courses', 'course_offerings', 'course_groups',
    'timetable_periods', 'timetable_entries', 'faculty', 'students',
    'faculty_course_assignments', 'student_course_registrations', 'semester_enrollments',
    'class_sessions', 'attendance_records', 'attendance_correction_requests',
    'substitute_assignments', 'class_tutor_assignments', 'daily_schedule_overrides',
    'faculty_subject_requests', 'faculty_assignment_history', 'faculty_subject_audit',
    'special_attendance_events', 'special_attendance_records',
    'announcements', 'circulars', 'student_leave_requests', 'student_certificate_requests',
    'academic_events', 'academic_resources', 'emergency_alerts', 'user_roles'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY app_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated;', t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated;', t);
    END IF;
  END LOOP;
END $$;

-- Audit logs: append-only (no UPDATE, DELETE, TRUNCATE)
DO $$
DECLARE
  log_tables TEXT[] := ARRAY['audit_logs', 'faculty_subject_audit'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY log_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated;', t);
      EXECUTE format('GRANT SELECT, INSERT ON TABLE public.%I TO anon, authenticated;', t);
    END IF;
  END LOOP;
END $$;

-- 12.1 Public Institutional Catalog & Homepage Config (Public Read, Admin Write)
CREATE POLICY "system_settings_public_read" ON public.system_settings
  FOR SELECT USING (true);
CREATE POLICY "system_settings_admin_write" ON public.system_settings
  FOR ALL USING (public.is_erp_executive()) WITH CHECK (public.is_erp_executive());

CREATE POLICY "departments_catalog_read" ON public.departments
  FOR SELECT USING (true);
CREATE POLICY "departments_admin_write" ON public.departments
  FOR ALL USING (public.is_erp_executive()) WITH CHECK (public.is_erp_executive());

CREATE POLICY "programmes_catalog_read" ON public.programmes
  FOR SELECT USING (true);
CREATE POLICY "programmes_admin_write" ON public.programmes
  FOR ALL USING (public.is_erp_executive()) WITH CHECK (public.is_erp_executive());

DO $$
DECLARE
  cat_tables TEXT[] := ARRAY['academic_years', 'admission_batches', 'semesters', 'course_categories', 'timetable_periods'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY cat_tables LOOP
    EXECUTE format('CREATE POLICY "%s_catalog_read" ON public.%I FOR SELECT USING (true);', t, t);
    EXECUTE format('CREATE POLICY "%s_admin_write" ON public.%I FOR ALL USING (public.is_erp_executive()) WITH CHECK (public.is_erp_executive());', t, t);
  END LOOP;
END $$;

-- Courses, Offerings, Groups (Public academic catalog read; Admin/HOD/Coordinator write)
CREATE POLICY "courses_catalog_read" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_staff_insert" ON public.courses FOR INSERT WITH CHECK (public.is_erp_admin());
CREATE POLICY "courses_staff_update" ON public.courses FOR UPDATE USING (public.is_erp_admin()) WITH CHECK (public.is_erp_admin());
CREATE POLICY "courses_admin_delete" ON public.courses FOR DELETE USING (public.is_erp_executive() OR public.has_erp_role('HOD') OR public.has_erp_role('OFFICE_STAFF'));

CREATE POLICY "offerings_catalog_read" ON public.course_offerings FOR SELECT USING (true);
CREATE POLICY "offerings_staff_write" ON public.course_offerings FOR ALL USING (public.is_erp_admin()) WITH CHECK (public.is_erp_admin());

CREATE POLICY "groups_catalog_read" ON public.course_groups FOR SELECT USING (true);
CREATE POLICY "groups_staff_write" ON public.course_groups FOR ALL USING (public.is_erp_admin()) WITH CHECK (public.is_erp_admin());

-- 12.2 Public Notice Board & Campus Events (Active/Published Read, Faculty/Admin Write)
CREATE POLICY "announcements_public_read" ON public.announcements
  FOR SELECT USING (COALESCE(is_active, true) = true OR public.is_erp_authenticated());
CREATE POLICY "announcements_faculty_write" ON public.announcements
  FOR ALL USING (public.is_erp_faculty()) WITH CHECK (public.is_erp_faculty());

CREATE POLICY "circulars_auth_read" ON public.circulars
  FOR SELECT USING (public.is_erp_authenticated());
CREATE POLICY "circulars_faculty_write" ON public.circulars
  FOR INSERT WITH CHECK (public.is_erp_faculty());
CREATE POLICY "circulars_update" ON public.circulars
  FOR UPDATE USING (public.is_erp_authenticated()) WITH CHECK (public.is_erp_authenticated());
CREATE POLICY "circulars_delete" ON public.circulars
  FOR DELETE USING (public.is_erp_faculty());

CREATE POLICY "academic_events_public_read" ON public.academic_events
  FOR SELECT USING (true);
CREATE POLICY "academic_events_faculty_write" ON public.academic_events
  FOR ALL USING (public.is_erp_faculty()) WITH CHECK (public.is_erp_faculty());

CREATE POLICY "emergency_alerts_public_read" ON public.emergency_alerts
  FOR SELECT USING (COALESCE(is_active, true) = true OR public.is_erp_authenticated());
CREATE POLICY "emergency_alerts_admin_write" ON public.emergency_alerts
  FOR ALL USING (public.is_erp_executive() OR public.has_erp_role('HOD')) WITH CHECK (public.is_erp_executive() OR public.has_erp_role('HOD'));

CREATE POLICY "academic_resources_auth_read" ON public.academic_resources
  FOR SELECT USING (public.is_erp_authenticated());
CREATE POLICY "academic_resources_faculty_write" ON public.academic_resources
  FOR ALL USING (public.is_erp_faculty()) WITH CHECK (public.is_erp_faculty());

-- 12.3 Faculty Directory (ZERO unauthenticated access)
CREATE POLICY "faculty_auth_read" ON public.faculty
  FOR SELECT USING (public.is_erp_authenticated());
CREATE POLICY "faculty_admin_insert" ON public.faculty
  FOR INSERT WITH CHECK (public.is_erp_executive() OR public.has_erp_role('HOD'));
CREATE POLICY "faculty_self_or_admin_update" ON public.faculty
  FOR UPDATE USING (
    public.is_erp_executive()
    OR (public.has_erp_role('HOD') AND department_id = public.current_erp_department_id())
    OR (public.current_erp_user_type() = 'FACULTY' AND id = public.current_erp_profile_id())
  )
  WITH CHECK (
    public.is_erp_executive()
    OR (public.has_erp_role('HOD') AND department_id = public.current_erp_department_id())
    OR (public.current_erp_user_type() = 'FACULTY' AND id = public.current_erp_profile_id())
  );
CREATE POLICY "faculty_exec_delete" ON public.faculty
  FOR DELETE USING (public.is_erp_executive());

-- 12.4 Students PII (ZERO unauthenticated access; students read/update ONLY self)
CREATE POLICY "students_scoped_read" ON public.students
  FOR SELECT USING (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND id = public.current_erp_profile_id())
  );
CREATE POLICY "students_admin_insert" ON public.students
  FOR INSERT WITH CHECK (public.is_erp_admin());
CREATE POLICY "students_self_or_admin_update" ON public.students
  FOR UPDATE USING (
    public.is_erp_admin()
    OR (public.is_erp_student() AND id = public.current_erp_profile_id())
  )
  WITH CHECK (
    public.is_erp_admin()
    OR (public.is_erp_student() AND id = public.current_erp_profile_id())
  );
CREATE POLICY "students_admin_delete" ON public.students
  FOR DELETE USING (public.is_erp_executive() OR public.has_erp_role('HOD'));

-- 12.5 Registrations & Semester Enrollments (ZERO unauthenticated access)
CREATE POLICY "registrations_scoped_read" ON public.student_course_registrations
  FOR SELECT USING (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id())
  );
CREATE POLICY "registrations_faculty_write" ON public.student_course_registrations
  FOR ALL USING (public.is_erp_faculty()) WITH CHECK (public.is_erp_faculty());

CREATE POLICY "semester_enrollments_read" ON public.semester_enrollments
  FOR SELECT USING (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id())
  );
CREATE POLICY "semester_enrollments_write" ON public.semester_enrollments
  FOR ALL USING (public.is_erp_admin()) WITH CHECK (public.is_erp_admin());

-- 12.6 Attendance, Sessions, Corrections & Duty Leave (Students read own only; faculty/admins mark & review)
CREATE POLICY "class_sessions_auth_read" ON public.class_sessions
  FOR SELECT USING (public.is_erp_authenticated());
CREATE POLICY "class_sessions_faculty_write" ON public.class_sessions
  FOR ALL USING (public.is_erp_faculty()) WITH CHECK (public.is_erp_faculty());

CREATE POLICY "attendance_records_scoped_read" ON public.attendance_records
  FOR SELECT USING (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id())
  );
CREATE POLICY "attendance_records_faculty_insert" ON public.attendance_records
  FOR INSERT WITH CHECK (public.is_erp_faculty());
CREATE POLICY "attendance_records_faculty_update" ON public.attendance_records
  FOR UPDATE USING (public.is_erp_faculty()) WITH CHECK (public.is_erp_faculty());
CREATE POLICY "attendance_records_admin_delete" ON public.attendance_records
  FOR DELETE USING (public.is_erp_admin());

CREATE POLICY "corr_requests_scoped_read" ON public.attendance_correction_requests
  FOR SELECT USING (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id())
  );
CREATE POLICY "corr_requests_insert" ON public.attendance_correction_requests
  FOR INSERT WITH CHECK (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id() AND status = 'PENDING')
  );
CREATE POLICY "corr_requests_update" ON public.attendance_correction_requests
  FOR UPDATE USING (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id() AND status = 'PENDING')
  )
  WITH CHECK (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id() AND status = 'PENDING')
  );

CREATE POLICY "special_events_auth_read" ON public.special_attendance_events
  FOR SELECT USING (public.is_erp_authenticated());
CREATE POLICY "special_events_faculty_write" ON public.special_attendance_events
  FOR ALL USING (public.is_erp_faculty()) WITH CHECK (public.is_erp_faculty());

CREATE POLICY "special_records_scoped_read" ON public.special_attendance_records
  FOR SELECT USING (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id())
  );
CREATE POLICY "special_records_faculty_write" ON public.special_attendance_records
  FOR ALL USING (public.is_erp_faculty()) WITH CHECK (public.is_erp_faculty());

-- Leave & Certificate Requests (Student submits & views self; Staff/Admin reviews)
CREATE POLICY "leave_requests_scoped_read" ON public.student_leave_requests
  FOR SELECT USING (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id())
  );
CREATE POLICY "leave_requests_insert" ON public.student_leave_requests
  FOR INSERT WITH CHECK (
    public.is_erp_admin()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id() AND status = 'SUBMITTED')
  );
CREATE POLICY "leave_requests_update" ON public.student_leave_requests
  FOR UPDATE USING (public.is_erp_faculty()) WITH CHECK (public.is_erp_faculty());

CREATE POLICY "cert_requests_scoped_read" ON public.student_certificate_requests
  FOR SELECT USING (
    public.is_erp_faculty()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id())
  );
CREATE POLICY "cert_requests_insert" ON public.student_certificate_requests
  FOR INSERT WITH CHECK (
    public.is_erp_admin()
    OR (public.is_erp_student() AND student_id = public.current_erp_profile_id() AND status = 'SUBMITTED')
  );
CREATE POLICY "cert_requests_update" ON public.student_certificate_requests
  FOR UPDATE USING (public.is_erp_admin()) WITH CHECK (public.is_erp_admin());

-- Timetable & Faculty Assignment Tables (Authenticated Read, Faculty/Admin Write)
DO $$
DECLARE
  tt_tables TEXT[] := ARRAY[
    'timetable_entries', 'faculty_course_assignments', 'class_tutor_assignments',
    'substitute_assignments', 'daily_schedule_overrides', 'faculty_subject_requests',
    'faculty_assignment_history'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tt_tables LOOP
    EXECUTE format('CREATE POLICY "%s_auth_read" ON public.%I FOR SELECT USING (public.is_erp_authenticated());', t, t);
    EXECUTE format('CREATE POLICY "%s_faculty_write" ON public.%I FOR ALL USING (public.is_erp_faculty()) WITH CHECK (public.is_erp_faculty());', t, t);
  END LOOP;
END $$;

-- User Roles
CREATE POLICY "user_roles_read" ON public.user_roles
  FOR SELECT USING (auth_user_id = auth.uid() OR public.is_erp_executive());
CREATE POLICY "user_roles_exec_write" ON public.user_roles
  FOR ALL USING (public.is_erp_executive()) WITH CHECK (public.is_erp_executive());

-- Append-Only Immutable Audit Logs
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT USING (public.is_erp_executive() OR public.has_erp_role('HOD'));
CREATE POLICY "audit_logs_auth_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_erp_authenticated());
CREATE POLICY "audit_logs_immutable_update" ON public.audit_logs
  FOR UPDATE USING (false);
CREATE POLICY "audit_logs_immutable_delete" ON public.audit_logs
  FOR DELETE USING (false);

CREATE POLICY "faculty_subject_audit_admin_read" ON public.faculty_subject_audit
  FOR SELECT USING (public.is_erp_executive() OR public.has_erp_role('HOD'));
CREATE POLICY "faculty_subject_audit_auth_insert" ON public.faculty_subject_audit
  FOR INSERT WITH CHECK (public.is_erp_faculty());
CREATE POLICY "faculty_subject_audit_no_update" ON public.faculty_subject_audit
  FOR UPDATE USING (false);
CREATE POLICY "faculty_subject_audit_no_delete" ON public.faculty_subject_audit
  FOR DELETE USING (false);

-- 13. RESTRICT EXECUTE ON INTERNAL PRIVATE HELPERS & GRANT SAFE RPCS
REVOKE ALL ON FUNCTION public._issue_erp_session(TEXT, UUID, TEXT[], TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hash_erp_secret(TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_bootstrap_status() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_initial_admin(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_institutional_login(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_and_link_google_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_supabase_jwt_login(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_erp_role(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.logout_erp_session() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_own_credentials(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(TEXT, UUID, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_dashboard_state(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.report_security_incident(TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_system_pause(BOOLEAN, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unquarantine_device(TEXT) TO anon, authenticated;

-- 14. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
