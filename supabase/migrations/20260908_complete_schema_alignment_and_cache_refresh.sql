-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - FYUGP ERP
-- 20260908_complete_schema_alignment_and_cache_refresh.sql
--
-- Complete Schema Alignment & PostgREST Schema Cache Refresh
-- This script fixes all column name discrepancies (e.g. student_status vs status,
-- theory_hours vs tutorial_hours, profile_photo_url, etc.) and ensures that
-- both legacy and fresh Supabase instances run without any missing column errors.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. STUDENTS TABLE ALIGNMENT
-- ==============================================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number VARCHAR(50) UNIQUE,
  roll_number VARCHAR(50),
  university_register_number VARCHAR(100),
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255) DEFAULT 'Student@123',
  email VARCHAR(255),
  mobile_number VARCHAR(50),
  phone VARCHAR(50),
  home_department_id UUID,
  department_id UUID,
  programme_id UUID,
  current_semester INTEGER DEFAULT 1,
  blood_group VARCHAR(10),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  student_status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS home_department_id UUID;
ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE students ADD COLUMN IF NOT EXISTS university_register_number VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS university_reg_no VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_semester INTEGER DEFAULT 1;
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'Student@123';

-- Safely ensure status and student_status are VARCHAR(50) regardless of existing ENUM types
DO $$
BEGIN
  -- Handle status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'status'
  ) THEN
    ALTER TABLE students ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';
  ELSE
    BEGIN
      ALTER TABLE students ALTER COLUMN status DROP DEFAULT;
      ALTER TABLE students ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
      ALTER TABLE students ALTER COLUMN status SET DEFAULT 'ACTIVE';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- Handle student_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'student_status'
  ) THEN
    ALTER TABLE students ADD COLUMN student_status VARCHAR(50) DEFAULT 'ACTIVE';
  ELSE
    BEGIN
      ALTER TABLE students ALTER COLUMN student_status DROP DEFAULT;
      ALTER TABLE students ALTER COLUMN student_status TYPE VARCHAR(50) USING student_status::text;
      ALTER TABLE students ALTER COLUMN student_status SET DEFAULT 'ACTIVE';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- Safe sync inside DO block with exception safety
  BEGIN
    EXECUTE 'UPDATE students SET status = student_status::text WHERE status IS NULL AND student_status IS NOT NULL';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    EXECUTE 'UPDATE students SET student_status = status::text WHERE student_status IS NULL AND status IS NOT NULL';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Sync column values between aliases with explicit text casting
UPDATE students SET department_id = COALESCE(department_id, home_department_id) WHERE department_id IS NULL AND home_department_id IS NOT NULL;
UPDATE students SET home_department_id = COALESCE(home_department_id, department_id) WHERE home_department_id IS NULL AND department_id IS NOT NULL;
UPDATE students SET university_register_number = COALESCE(university_register_number, university_reg_no) WHERE university_register_number IS NULL AND university_reg_no IS NOT NULL;
UPDATE students SET university_reg_no = COALESCE(university_reg_no, university_register_number) WHERE university_reg_no IS NULL AND university_register_number IS NOT NULL;
UPDATE students SET phone = COALESCE(phone, mobile_number, phone_number) WHERE phone IS NULL;
UPDATE students SET mobile_number = COALESCE(mobile_number, phone, phone_number) WHERE mobile_number IS NULL;

-- ==============================================================================
-- 2. STUDENT COURSE REGISTRATIONS ALIGNMENT
-- ==============================================================================
CREATE TABLE IF NOT EXISTS student_course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_offering_id UUID NOT NULL,
  course_group_id UUID,
  course_category_id UUID,
  registration_status VARCHAR(50) DEFAULT 'REGISTERED',
  status VARCHAR(50) DEFAULT 'REGISTERED',
  registration_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE student_course_registrations ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE student_course_registrations ADD COLUMN IF NOT EXISTS course_category_id UUID;
ALTER TABLE student_course_registrations ADD COLUMN IF NOT EXISTS course_group_id UUID;

DO $$
BEGIN
  -- 1. Ensure status column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_course_registrations' AND column_name = 'status'
  ) THEN
    ALTER TABLE student_course_registrations ADD COLUMN status VARCHAR(50) DEFAULT 'REGISTERED';
  END IF;

  -- 2. Ensure registration_status column exists as VARCHAR(50)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_course_registrations' AND column_name = 'registration_status'
  ) THEN
    ALTER TABLE student_course_registrations ADD COLUMN registration_status VARCHAR(50) DEFAULT 'REGISTERED';
  END IF;

  -- 3. Populate registration_status (VARCHAR) safely from status::text
  BEGIN
    EXECUTE 'UPDATE student_course_registrations SET registration_status = status::text WHERE registration_status IS NULL AND status IS NOT NULL';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 4. If status is null, safely attempt to populate from registration_status
  BEGIN
    EXECUTE 'UPDATE student_course_registrations SET status = registration_status WHERE status IS NULL AND registration_status IS NOT NULL';
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      EXECUTE 'UPDATE student_course_registrations SET status = registration_status::text::registration_status WHERE status IS NULL AND registration_status IS NOT NULL';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END;
END $$;

-- ==============================================================================
-- 3. COURSES TABLE ALIGNMENT
-- ==============================================================================
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_code VARCHAR(50);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_title VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_category_id UUID;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lecture_hours INT DEFAULT 3;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS theory_hours INT DEFAULT 3;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tutorial_hours INT DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS practical_hours INT DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE courses SET course_code = COALESCE(course_code, code) WHERE course_code IS NULL AND code IS NOT NULL;
UPDATE courses SET code = COALESCE(code, course_code) WHERE code IS NULL AND course_code IS NOT NULL;
UPDATE courses SET course_title = COALESCE(course_title, title) WHERE course_title IS NULL AND title IS NOT NULL;
UPDATE courses SET title = COALESCE(title, course_title) WHERE title IS NULL AND course_title IS NOT NULL;
UPDATE courses SET theory_hours = COALESCE(theory_hours, lecture_hours, 3) WHERE theory_hours IS NULL;
UPDATE courses SET tutorial_hours = COALESCE(tutorial_hours, 0) WHERE tutorial_hours IS NULL;
UPDATE courses SET course_category_id = COALESCE(course_category_id, category_id) WHERE course_category_id IS NULL AND category_id IS NOT NULL;
UPDATE courses SET category_id = COALESCE(category_id, course_category_id) WHERE category_id IS NULL AND course_category_id IS NOT NULL;

-- ==============================================================================
-- 4. FACULTY TABLE ALIGNMENT
-- ==============================================================================
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_code VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE faculty SET employee_id = COALESCE(employee_id, employee_code) WHERE employee_id IS NULL AND employee_code IS NOT NULL;
UPDATE faculty SET employee_code = COALESCE(employee_code, employee_id) WHERE employee_code IS NULL AND employee_id IS NOT NULL;
UPDATE faculty SET full_name = COALESCE(full_name, name) WHERE full_name IS NULL AND name IS NOT NULL;
UPDATE faculty SET name = COALESCE(name, full_name) WHERE name IS NULL AND full_name IS NOT NULL;
UPDATE faculty SET phone = COALESCE(phone, mobile_number, phone_number) WHERE phone IS NULL;
UPDATE faculty SET mobile_number = COALESCE(mobile_number, phone, phone_number) WHERE mobile_number IS NULL;
UPDATE faculty SET profile_photo_url = COALESCE(profile_photo_url, profile_image_url) WHERE profile_photo_url IS NULL AND profile_image_url IS NOT NULL;
UPDATE faculty SET profile_image_url = COALESCE(profile_image_url, profile_photo_url) WHERE profile_image_url IS NULL AND profile_photo_url IS NOT NULL;

-- ==============================================================================
-- 5. FACULTY COURSE ASSIGNMENTS ALIGNMENT
-- ==============================================================================
ALTER TABLE faculty_course_assignments ADD COLUMN IF NOT EXISTS course_group_id UUID;
ALTER TABLE faculty_course_assignments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

DO $$
BEGIN
  -- 1. Ensure role column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'faculty_course_assignments' AND column_name = 'role'
  ) THEN
    ALTER TABLE faculty_course_assignments ADD COLUMN role VARCHAR(50) DEFAULT 'PRIMARY';
  END IF;

  -- 2. Ensure assignment_role column exists as VARCHAR(50)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'faculty_course_assignments' AND column_name = 'assignment_role'
  ) THEN
    ALTER TABLE faculty_course_assignments ADD COLUMN assignment_role VARCHAR(50) DEFAULT 'PRIMARY';
  END IF;

  -- 3. Populate assignment_role safely from role::text
  BEGIN
    EXECUTE 'UPDATE faculty_course_assignments SET assignment_role = role::text WHERE assignment_role IS NULL AND role IS NOT NULL';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 4. Populate role if null
  BEGIN
    EXECUTE 'UPDATE faculty_course_assignments SET role = assignment_role WHERE role IS NULL AND assignment_role IS NOT NULL';
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      EXECUTE 'UPDATE faculty_course_assignments SET role = assignment_role::text::assignment_role_enum WHERE role IS NULL AND assignment_role IS NOT NULL';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END;
END $$;

-- ==============================================================================
-- 6. COURSE OFFERINGS ALIGNMENT
-- ==============================================================================
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS offering_department_id UUID;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS academic_year_id UUID;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS semester_id UUID;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS semester_number INT DEFAULT 1;

UPDATE course_offerings SET offering_department_id = COALESCE(offering_department_id, department_id) WHERE offering_department_id IS NULL AND department_id IS NOT NULL;
UPDATE course_offerings SET department_id = COALESCE(department_id, offering_department_id) WHERE department_id IS NULL AND offering_department_id IS NOT NULL;

-- ==============================================================================
-- 7. TIMETABLE ENTRIES ALIGNMENT
-- ==============================================================================
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS weekday INTEGER DEFAULT 1;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS day_of_week VARCHAR(20);
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS room VARCHAR(100);
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS room_number VARCHAR(100);
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS course_group_id UUID;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS academic_year_id UUID;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS semester_id UUID;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE timetable_entries SET room = COALESCE(room, room_number, 'Room 101') WHERE room IS NULL;
UPDATE timetable_entries SET room_number = COALESCE(room_number, room, 'Room 101') WHERE room_number IS NULL;

-- ==============================================================================
-- 8. CLASS SESSIONS & ATTENDANCE ALIGNMENT
-- ==============================================================================
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS timetable_entry_id UUID;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS substitute_faculty_id UUID;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS topic_covered TEXT;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(50) DEFAULT 'REGULAR';
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SCHEDULED';
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS attendance_submitted BOOLEAN DEFAULT false;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS submitted_timestamp TIMESTAMPTZ;

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS marked_by_faculty_id UUID;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS marked_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS remarks TEXT;

ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS review_date TIMESTAMPTZ;
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS review_remarks TEXT;
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS reviewed_by_faculty_id UUID;

-- ==============================================================================
-- 9. SPECIAL ATTENDANCE TABLES (IF NOT EXISTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS special_attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100) NOT NULL,
  event_date DATE NOT NULL,
  period_ids TEXT[] DEFAULT '{}',
  is_full_day BOOLEAN DEFAULT false,
  start_time VARCHAR(20),
  end_time VARCHAR(20),
  scope_type VARCHAR(50) NOT NULL,
  department_id UUID,
  programme_id UUID,
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

CREATE TABLE IF NOT EXISTS special_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES special_attendance_events(id) ON DELETE CASCADE,
  student_id UUID,
  date DATE NOT NULL,
  period_id UUID,
  attendance_status VARCHAR(50) DEFAULT 'SPECIAL',
  attendance_source VARCHAR(50) DEFAULT 'SPECIAL',
  normal_session_conflict_status VARCHAR(50) DEFAULT 'NO_SESSION',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE IMMEDIATELY
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
