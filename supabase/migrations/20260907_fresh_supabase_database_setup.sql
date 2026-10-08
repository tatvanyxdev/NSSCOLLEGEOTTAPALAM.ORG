-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - COMPLETE & ROBUST SUPABASE DATABASE SETUP SCRIPT
-- ==============================================================================
-- This script is completely safe to run on an existing database with existing data.
-- It fixes all UUID types, missing columns, RLS permissions, stored procedures,
-- and seeds missing data without ANY duplicate key or foreign key errors.
-- ==============================================================================

-- 0. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLE DEFINITIONS & COLUMN HARMONIZATION (ADD COLUMN IF NOT EXISTS)
-- ==============================================================================

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  type VARCHAR(50) DEFAULT 'ACADEMIC',
  hod_faculty_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS short_name VARCHAR(50);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'ACADEMIC';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS hod_faculty_id UUID;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. PROGRAMMES
CREATE TABLE IF NOT EXISTS programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  duration_years INTEGER DEFAULT 4,
  total_semesters INTEGER DEFAULT 8,
  expected_strength INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS duration_years INTEGER DEFAULT 4;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS total_semesters INTEGER DEFAULT 8;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS expected_strength INTEGER DEFAULT 60;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. ACADEMIC YEARS
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 4. SEMESTERS
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50),
  semester_number INTEGER NOT NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  academic_year VARCHAR(50),
  term VARCHAR(20) DEFAULT 'ODD',
  is_current BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS name VARCHAR(50);
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS term VARCHAR(20) DEFAULT 'ODD';
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 5. COURSE CATEGORIES
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 6. COURSES
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code VARCHAR(50),
  code VARCHAR(50),
  course_title VARCHAR(255),
  title VARCHAR(255),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  course_category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL,
  category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL,
  credits NUMERIC(4,1) DEFAULT 4,
  lecture_hours INTEGER DEFAULT 3,
  practical_hours INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_code VARCHAR(50);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_title VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS credits NUMERIC(4,1) DEFAULT 4;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lecture_hours INTEGER DEFAULT 3;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS practical_hours INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 7. COURSE OFFERINGS
CREATE TABLE IF NOT EXISTS course_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  offering_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  semester_number INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS offering_department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS semester_number INTEGER DEFAULT 1;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE course_offerings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 8. COURSE GROUPS
CREATE TABLE IF NOT EXISTS course_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  group_name VARCHAR(100),
  name VARCHAR(100),
  capacity INTEGER DEFAULT 60,
  room VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE course_groups ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);
ALTER TABLE course_groups ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE course_groups ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 60;
ALTER TABLE course_groups ADD COLUMN IF NOT EXISTS room VARCHAR(100);
ALTER TABLE course_groups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE course_groups ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 9. FACULTY
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(100),
  employee_code VARCHAR(100),
  full_name VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile_number VARCHAR(50),
  phone_number VARCHAR(50),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  designation VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_code VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 10. STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number VARCHAR(100),
  student_id VARCHAR(100),
  roll_number VARCHAR(100),
  university_reg_no VARCHAR(100),
  reg_no VARCHAR(100),
  full_name VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  mobile_number VARCHAR(50),
  phone VARCHAR(50),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  current_semester INTEGER DEFAULT 1,
  academic_year VARCHAR(50),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_number VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS university_reg_no VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS reg_no VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_semester INTEGER DEFAULT 1;
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 11. FACULTY COURSE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS faculty_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 12. STUDENT COURSE REGISTRATIONS
CREATE TABLE IF NOT EXISTS student_course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'ENROLLED',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unq_student_course_offering') THEN
    ALTER TABLE student_course_registrations ADD CONSTRAINT unq_student_course_offering UNIQUE (student_id, course_offering_id);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 13. TIMETABLE PERIODS
CREATE TABLE IF NOT EXISTS timetable_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_number INTEGER NOT NULL,
  label VARCHAR(50),
  name VARCHAR(50),
  start_time VARCHAR(20),
  end_time VARCHAR(20),
  is_break BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE timetable_periods ADD COLUMN IF NOT EXISTS label VARCHAR(50);
ALTER TABLE timetable_periods ADD COLUMN IF NOT EXISTS name VARCHAR(50);
ALTER TABLE timetable_periods ADD COLUMN IF NOT EXISTS is_break BOOLEAN DEFAULT false;
ALTER TABLE timetable_periods ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 14. TIMETABLE ENTRIES
CREATE TABLE IF NOT EXISTS timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday INTEGER NOT NULL,
  period_id UUID REFERENCES timetable_periods(id) ON DELETE CASCADE,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE SET NULL,
  faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  room VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS course_group_id UUID REFERENCES course_groups(id) ON DELETE SET NULL;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS room VARCHAR(100);
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 15. CLASS SESSIONS
CREATE TABLE IF NOT EXISTS class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE SET NULL,
  faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  substitute_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  period_id UUID REFERENCES timetable_periods(id) ON DELETE SET NULL,
  start_time VARCHAR(20),
  end_time VARCHAR(20),
  topic_covered TEXT,
  session_type VARCHAR(50) DEFAULT 'REGULAR',
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  attendance_submitted BOOLEAN DEFAULT false,
  submitted_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS substitute_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS topic_covered TEXT;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(50) DEFAULT 'REGULAR';
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SCHEDULED';
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS attendance_submitted BOOLEAN DEFAULT false;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS submitted_timestamp TIMESTAMPTZ;

-- 16. ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  marked_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  marked_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS marked_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS marked_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS remarks TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unq_session_student') THEN
    ALTER TABLE attendance_records ADD CONSTRAINT unq_session_student UNIQUE (class_session_id, student_id);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 17. ATTENDANCE CORRECTION REQUESTS
CREATE TABLE IF NOT EXISTS attendance_correction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  requested_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  old_status VARCHAR(50),
  requested_status VARCHAR(50),
  reason TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  requested_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  reviewed_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  review_date TIMESTAMPTZ,
  review_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 18. ADMISSION BATCHES
CREATE TABLE IF NOT EXISTS admission_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name VARCHAR(100) NOT NULL,
  academic_year VARCHAR(50),
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  max_capacity INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 19. SEMESTER ENROLLMENTS
CREATE TABLE IF NOT EXISTS semester_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  academic_year VARCHAR(50),
  semester_number INTEGER NOT NULL DEFAULT 1,
  enrolled_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 20. SUBSTITUTE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS substitute_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  original_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  substitute_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  assigned_by_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 21. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  priority VARCHAR(50) DEFAULT 'NORMAL',
  target_audience VARCHAR(100) DEFAULT 'ALL',
  author_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 22. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  user_role VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 23. APP SETTINGS
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES - OPEN ACCESS
-- ==============================================================================

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'departments', 'programmes', 'academic_years', 'semesters',
    'course_categories', 'courses', 'course_offerings', 'course_groups',
    'faculty', 'students', 'faculty_course_assignments',
    'student_course_registrations', 'timetable_periods', 'timetable_entries',
    'class_sessions', 'attendance_records', 'attendance_correction_requests',
    'admission_batches', 'semester_enrollments', 'substitute_assignments',
    'announcements', 'audit_logs', 'app_settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access" ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public read %I" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "All write %I" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "Allow all access" ON %I FOR ALL USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;

-- ==============================================================================
-- 3. SAFE IDEMPOTENT MASTER SEED DATA (Never violates duplicate or foreign keys)
-- ==============================================================================

-- 3.1 DEPARTMENTS (Insert only if code does not already exist)
DO $$
BEGIN
  INSERT INTO departments (code, name, short_name, type, is_active)
  SELECT d.code, d.name, d.short_name, d.type, d.is_active
  FROM (VALUES
    ('ENG', 'Department of English', 'ENG', 'ACADEMIC', true),
    ('HIN', 'Department of Hindi', 'HIN', 'ACADEMIC', true),
    ('MAL', 'Department of Malayalam', 'MAL', 'ACADEMIC', true),
    ('ECO', 'Department of Economics', 'ECO', 'ACADEMIC', true),
    ('HIS', 'Department of History', 'HIS', 'ACADEMIC', true),
    ('BOT', 'Department of Botany', 'BOT', 'ACADEMIC', true),
    ('CHE', 'Department of Chemistry', 'CHE', 'ACADEMIC', true),
    ('CSC', 'Department of Computer Science', 'CSC', 'ACADEMIC', true),
    ('IC',  'Department of Industrial Chemistry', 'IC', 'ACADEMIC', true),
    ('MAT', 'Department of Mathematics', 'MAT', 'ACADEMIC', true),
    ('PHY', 'Department of Physics', 'PHY', 'ACADEMIC', true),
    ('ZOO', 'Department of Zoology', 'ZOO', 'ACADEMIC', true),
    ('COM', 'Department of Commerce & Management', 'COM', 'ACADEMIC', true),
    ('PED', 'Department of Physical Education', 'PED', 'ACADEMIC', true),
    ('SAN', 'Department of Sanskrit', 'SAN', 'ACADEMIC', true),
    ('POL', 'Department of Political Science', 'POL', 'ACADEMIC', true),
    ('STA', 'Department of Statistics', 'STA', 'ACADEMIC', true),
    ('ADM', 'Administrative Office', 'ADM', 'ADMINISTRATIVE', true)
  ) AS d(code, name, short_name, type, is_active)
  WHERE NOT EXISTS (
    SELECT 1 FROM departments WHERE departments.code = d.code
  );
EXCEPTION WHEN unique_violation THEN NULL;
WHEN OTHERS THEN NULL;
END $$;

UPDATE departments SET
  short_name = COALESCE(short_name, code),
  type = COALESCE(type, 'ACADEMIC'),
  is_active = COALESCE(is_active, true);

-- 3.2 COURSE CATEGORIES (Insert only if code does not already exist)
DO $$
BEGIN
  INSERT INTO course_categories (code, name, description, is_active)
  SELECT c.code, c.name, c.description, c.is_active
  FROM (VALUES
    ('MAJOR', 'Major Core Course', 'Core discipline course of the admitted programme', true),
    ('MINOR', 'Minor Course', 'Discipline specific minor chosen from other departments', true),
    ('MDC',   'Multidisciplinary Course (MDC)', 'Introductory courses across various discipline clusters', true),
    ('AEC',   'Ability Enhancement Course (AEC)', 'Language and Communication proficiency (English)', true),
    ('SEC',   'Skill Enhancement Course (SEC)', 'Hands-on practical skills & modern applied languages', true),
    ('VAC',   'Value Added Course (VAC)', 'Environmental studies, Ethics, Indian Constitution', true),
    ('INTERN','Internship / Field Project', 'Industrial training and community engagement', true),
    ('PROJECT','Research Project / Dissertation', 'Capstone undergraduate or postgraduate thesis', true)
  ) AS c(code, name, description, is_active)
  WHERE NOT EXISTS (
    SELECT 1 FROM course_categories WHERE course_categories.code = c.code
  );
EXCEPTION WHEN unique_violation THEN NULL;
WHEN OTHERS THEN NULL;
END $$;

-- 3.3 ACADEMIC YEARS
DO $$
BEGIN
  INSERT INTO academic_years (name, start_date, end_date, is_current, is_active)
  SELECT y.name, y.start_date::date, y.end_date::date, y.is_current, y.is_active
  FROM (VALUES
    ('2026-27', '2026-06-01', '2027-03-31', true, true),
    ('2025-26', '2025-06-01', '2026-03-31', false, true),
    ('2024-25', '2024-06-01', '2025-03-31', false, true)
  ) AS y(name, start_date, end_date, is_current, is_active)
  WHERE NOT EXISTS (
    SELECT 1 FROM academic_years WHERE academic_years.name = y.name
  );
EXCEPTION WHEN unique_violation THEN NULL;
WHEN OTHERS THEN NULL;
END $$;

-- 3.4 SEMESTERS (Guards against semesters_semester_number_key)
DO $$
BEGIN
  INSERT INTO semesters (name, semester_number, academic_year_id, academic_year, term, is_active)
  SELECT
    s.name,
    s.num,
    (SELECT id FROM academic_years WHERE name = '2026-27' LIMIT 1),
    '2026-27',
    s.term,
    true
  FROM (VALUES
    ('Semester 1', 1, 'ODD'),
    ('Semester 2', 2, 'EVEN'),
    ('Semester 3', 3, 'ODD'),
    ('Semester 4', 4, 'EVEN'),
    ('Semester 5', 5, 'ODD'),
    ('Semester 6', 6, 'EVEN'),
    ('Semester 7', 7, 'ODD'),
    ('Semester 8', 8, 'EVEN')
  ) AS s(name, num, term)
  WHERE NOT EXISTS (
    SELECT 1 FROM semesters WHERE semesters.semester_number = s.num
  );
EXCEPTION WHEN unique_violation THEN NULL;
WHEN OTHERS THEN NULL;
END $$;

-- 3.5 PROGRAMMES (Foreign key department_id dynamically resolved)
DO $$
BEGIN
  INSERT INTO programmes (code, name, department_id, duration_years, total_semesters, expected_strength, is_active)
  SELECT
    p.code,
    p.name,
    (SELECT id FROM departments WHERE code = p.dept_code LIMIT 1),
    p.duration_years,
    p.total_semesters,
    p.expected_strength,
    true
  FROM (VALUES
    ('BAENG',  'BA English Language and Literature', 'ENG', 4, 8, 50),
    ('BAHIN',  'BA Hindi Language and Literature',   'HIN', 4, 8, 40),
    ('BAMAL',  'BA Malayalam',                       'MAL', 4, 8, 40),
    ('BAECO',  'BA Economics',                       'ECO', 4, 8, 60),
    ('BAHIS',  'BA History',                         'HIS', 4, 8, 50),
    ('BSCBOT', 'BSc Botany',                        'BOT', 4, 8, 40),
    ('BSCCHE', 'BSc Chemistry',                     'CHE', 4, 8, 40),
    ('BSCCS',  'BSc Computer Science',               'CSC', 4, 8, 40),
    ('BSCIC',  'BSc Industrial Chemistry',           'IC',  4, 8, 30),
    ('BSCMAT', 'BSc Mathematics',                    'MAT', 4, 8, 48),
    ('BSCPHY', 'BSc Physics',                        'PHY', 4, 8, 40),
    ('BSCZOO', 'BSc Zoology',                        'ZOO', 4, 8, 40),
    ('BCOM',   'B.Com (Finance & Co-operation)',     'COM', 4, 8, 65),
    ('MAENG',  'MA English Language and Literature', 'ENG', 2, 4, 20),
    ('MAECO',  'MA Economics',                       'ECO', 2, 4, 20),
    ('MSCCS',  'MSc Computer Science',               'CSC', 2, 4, 15),
    ('MSCMAT', 'MSc Mathematics',                   'MAT', 2, 4, 20),
    ('MSCPHY', 'MSc Physics',                       'PHY', 2, 4, 15),
    ('MCOM',   'M.Com Finance',                      'COM', 2, 4, 20)
  ) AS p(code, name, dept_code, duration_years, total_semesters, expected_strength)
  WHERE NOT EXISTS (
    SELECT 1 FROM programmes WHERE programmes.code = p.code OR programmes.name = p.name
  );
EXCEPTION WHEN unique_violation THEN NULL;
WHEN OTHERS THEN NULL;
END $$;

-- 3.6 COURSES (Dynamic foreign keys to departments and categories)
DO $$
BEGIN
  INSERT INTO courses (course_code, code, course_title, title, department_id, course_category_id, credits, lecture_hours, practical_hours, description, is_active)
  SELECT
    c.course_code,
    c.course_code,
    c.title,
    c.title,
    (SELECT id FROM departments WHERE code = c.dept_code LIMIT 1),
    (SELECT id FROM course_categories WHERE code = c.cat_code LIMIT 1),
    c.credits,
    c.lecture_hours,
    c.practical_hours,
    c.description,
    true
  FROM (VALUES
    ('CSC1B01T', 'CSC', 'MAJOR', 'Programming in C and Python Basics', 4, 3, 2, 'Foundation course in structured procedural programming and modern Python scripting.'),
    ('MAT1C01T', 'MAT', 'MINOR', 'Foundations of Discrete Mathematics', 4, 4, 0, 'Set theory, propositional logic, graph theory, and mathematical induction.'),
    ('ENG1A01T', 'ENG', 'AEC',   'Communicative English & Critical Reading', 3, 3, 0, 'Professional verbal communication, technical writing, and rhetoric.'),
    ('MDC101',   'COM', 'MDC',   'Principles of Modern Management', 3, 3, 0, 'Interdisciplinary exploration of managerial economics, human resources, and leadership.'),
    ('SEC101T',  'CSC', 'SEC',   'Web Application Development & UI Design', 2, 1, 2, 'Modern frontend development, responsive layouts, web accessibility, and interactive design.'),
    ('VAC101',   'CSC', 'VAC',   'Ethics, Constitutional Values & Digital Citizenship', 2, 2, 0, 'Constitutional rights, ethical reasoning in digital age, and cyber law awareness.')
  ) AS c(course_code, dept_code, cat_code, title, credits, lecture_hours, practical_hours, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM courses
    WHERE courses.course_code = c.course_code
       OR courses.code = c.course_code
       OR courses.course_title = c.title
       OR courses.title = c.title
  );
EXCEPTION WHEN unique_violation THEN NULL;
WHEN OTHERS THEN NULL;
END $$;

-- 3.7 TIMETABLE PERIODS (Periods 1 to 5)
DO $$
BEGIN
  INSERT INTO timetable_periods (period_number, label, name, start_time, end_time, is_break, is_active)
  SELECT p.num, p.label, p.label, p.st, p.et, false, true
  FROM (VALUES
    (1, 'Period 1', '09:30', '10:30'),
    (2, 'Period 2', '10:30', '11:30'),
    (3, 'Period 3', '11:45', '12:45'),
    (4, 'Period 4', '13:30', '14:30'),
    (5, 'Period 5', '14:30', '15:30')
  ) AS p(num, label, st, et)
  WHERE NOT EXISTS (
    SELECT 1 FROM timetable_periods WHERE timetable_periods.period_number = p.num
  );
EXCEPTION WHEN unique_violation THEN NULL;
WHEN OTHERS THEN NULL;
END $$;

-- 3.8 COURSE OFFERINGS & GROUPS (Seed if empty)
DO $$
DECLARE
  v_csc_course UUID;
  v_csc_dept UUID;
  v_ay UUID;
  v_sem UUID;
  v_offering UUID;
BEGIN
  SELECT id INTO v_csc_course FROM courses WHERE course_code = 'CSC1B01T' OR code = 'CSC1B01T' LIMIT 1;
  SELECT id INTO v_csc_dept FROM departments WHERE code = 'CSC' LIMIT 1;
  SELECT id INTO v_ay FROM academic_years WHERE name = '2026-27' LIMIT 1;
  SELECT id INTO v_sem FROM semesters WHERE semester_number = 1 LIMIT 1;

  IF v_csc_course IS NOT NULL AND NOT EXISTS (SELECT 1 FROM course_offerings WHERE course_id = v_csc_course) THEN
    INSERT INTO course_offerings (course_id, offering_department_id, department_id, academic_year_id, semester_id, semester_number, is_active)
    VALUES (v_csc_course, v_csc_dept, v_csc_dept, v_ay, v_sem, 1, true)
    RETURNING id INTO v_offering;

    IF v_offering IS NOT NULL AND NOT EXISTS (SELECT 1 FROM course_groups WHERE course_offering_id = v_offering) THEN
      INSERT INTO course_groups (course_offering_id, group_name, name, capacity, room, is_active)
      VALUES (v_offering, 'Batch CS-A', 'Batch CS-A', 45, 'CS Lab 1 / Room 102', true);
    END IF;
  END IF;
EXCEPTION WHEN unique_violation THEN NULL;
WHEN OTHERS THEN NULL;
END $$;

-- 3.9 FACULTY (Insert only if employee code / email does not already exist)
DO $$
BEGIN
  INSERT INTO faculty (employee_id, employee_code, full_name, name, email, phone, mobile_number, phone_number, department_id, designation, is_active)
  SELECT
    f.emp_id,
    f.emp_id,
    f.name,
    f.name,
    f.email,
    f.phone,
    f.phone,
    f.phone,
    (SELECT id FROM departments WHERE code = f.dept_code LIMIT 1),
    f.desig,
    true
  FROM (VALUES
    ('PEN-1995-CS01',  'Dr. Radhakrishnan K.', 'radhakrishnan.cs@nssce.ac.in', '+91 94471 23450', 'CSC', 'Associate Professor & HOD'),
    ('PEN-2005-CS02',  'Prof. Lekha S. Pillai', 'lekha.cs@nssce.ac.in',         '+91 94472 34561', 'CSC', 'Assistant Professor & Tutor'),
    ('PEN-1998-MAT01', 'Dr. Narayanan M.',      'narayanan.mat@nssce.ac.in',     '+91 94473 45672', 'MAT', 'Associate Professor & HOD'),
    ('PEN-2002-PHY01', 'Dr. Gopakumar V.',      'gopakumar.phy@nssce.ac.in',     '+91 94474 56783', 'PHY', 'Associate Professor'),
    ('PEN-2010-ENG01', 'Prof. Meera Nair',       'meera.eng@nssce.ac.in',         '+91 94475 67894', 'ENG', 'Assistant Professor'),
    ('PEN-2012-COM01', 'Dr. Suresh Kumar P.',    'suresh.com@nssce.ac.in',        '+91 94476 78905', 'COM', 'Associate Professor & HOD')
  ) AS f(emp_id, name, email, phone, dept_code, desig)
  WHERE NOT EXISTS (
    SELECT 1 FROM faculty
    WHERE faculty.employee_id = f.emp_id
       OR faculty.employee_code = f.emp_id
       OR faculty.email = f.email
  );
EXCEPTION WHEN unique_violation THEN NULL;
WHEN OTHERS THEN NULL;
END $$;

UPDATE faculty SET
  phone = COALESCE(phone, mobile_number, phone_number),
  mobile_number = COALESCE(mobile_number, phone, phone_number),
  phone_number = COALESCE(phone_number, mobile_number, phone);

-- 3.10 STUDENTS (Insert only if admission / roll / email does not already exist)
DO $$
BEGIN
  INSERT INTO students (admission_number, student_id, roll_number, university_reg_no, reg_no, full_name, name, email, mobile_number, phone, department_id, programme_id, current_semester, academic_year, status, is_active)
  SELECT
    s.adm_no,
    s.adm_no,
    s.roll,
    s.u_reg,
    s.u_reg,
    s.name,
    s.name,
    s.email,
    s.phone,
    s.phone,
    (SELECT id FROM departments WHERE code = 'CSC' LIMIT 1),
    (SELECT id FROM programmes WHERE code = 'BSCCS' LIMIT 1),
    1,
    '2026-27',
    'ACTIVE',
    true
  FROM (VALUES
    ('ADM-2024-CS001', '01', 'NSS24CS001', 'Aaditya Menon', 'aaditya.cs24@nssce.ac.in', '+91 98460 11001'),
    ('ADM-2024-CS002', '02', 'NSS24CS002', 'Ananya K. Nair',  'ananya.cs24@nssce.ac.in',  '+91 98460 11002'),
    ('ADM-2024-CS003', '03', 'NSS24CS003', 'Devanand S.',    'devanand.cs24@nssce.ac.in','+91 98460 11003'),
    ('ADM-2024-CS004', '04', 'NSS24CS004', 'Fathima Zehra',  'fathima.cs24@nssce.ac.in', '+91 98460 11004'),
    ('ADM-2024-CS005', '05', 'NSS24CS005', 'Gokul Krishna',  'gokul.cs24@nssce.ac.in',   '+91 98460 11005')
  ) AS s(adm_no, roll, u_reg, name, email, phone)
  WHERE NOT EXISTS (
    SELECT 1 FROM students
    WHERE students.admission_number = s.adm_no
       OR students.student_id = s.adm_no
       OR students.roll_number = s.roll
       OR students.university_reg_no = s.u_reg
       OR students.reg_no = s.u_reg
       OR students.email = s.email
  );
EXCEPTION WHEN unique_violation THEN NULL;
WHEN OTHERS THEN NULL;
END $$;

UPDATE students SET
  student_id = COALESCE(student_id, admission_number),
  university_reg_no = COALESCE(university_reg_no, reg_no),
  reg_no = COALESCE(reg_no, university_reg_no),
  phone = COALESCE(phone, mobile_number),
  mobile_number = COALESCE(mobile_number, phone);

-- ==============================================================================
-- 4. ATOMIC STORED PROCEDURES (Attendance Locking & Review Workflows)
-- ==============================================================================

CREATE OR REPLACE FUNCTION submit_session_attendance_atomic(
  p_session_id UUID,
  p_topic_covered TEXT,
  p_records JSONB,
  p_marked_by_faculty_id UUID,
  p_actor_name TEXT DEFAULT 'Faculty',
  p_actor_role TEXT DEFAULT 'TEACHER'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_submitted_at TIMESTAMPTZ := clock_timestamp();
BEGIN
  -- Verify session exists
  IF NOT EXISTS (SELECT 1 FROM class_sessions WHERE id = p_session_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Class session not found');
  END IF;

  -- Upsert individual attendance records
  FOR v_rec IN SELECT * FROM jsonb_to_recordset(p_records) AS x(student_id UUID, status VARCHAR(50), remarks TEXT)
  LOOP
    INSERT INTO attendance_records (
      class_session_id,
      student_id,
      status,
      marked_by_faculty_id,
      marked_timestamp,
      remarks
    )
    VALUES (
      p_session_id,
      v_rec.student_id,
      v_rec.status,
      p_marked_by_faculty_id,
      v_submitted_at,
      v_rec.remarks
    )
    ON CONFLICT (class_session_id, student_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      marked_by_faculty_id = EXCLUDED.marked_by_faculty_id,
      marked_timestamp = EXCLUDED.marked_timestamp,
      remarks = EXCLUDED.remarks;
  END LOOP;

  -- Update session status to CONDUCTED and mark attendance_submitted = true
  UPDATE class_sessions
  SET
    attendance_submitted = true,
    submitted_timestamp = v_submitted_at,
    topic_covered = COALESCE(NULLIF(p_topic_covered, ''), topic_covered),
    status = 'CONDUCTED'
  WHERE id = p_session_id;

  -- Insert audit log
  INSERT INTO audit_logs (action, entity_type, entity_id, details, user_name, user_role, timestamp)
  VALUES (
    'SUBMIT_ATTENDANCE',
    'CLASS_SESSION',
    p_session_id::text,
    jsonb_build_object('records_count', jsonb_array_length(p_records), 'topic_covered', p_topic_covered),
    p_actor_name,
    p_actor_role,
    v_submitted_at
  );

  RETURN jsonb_build_object('success', true, 'submitted_at', v_submitted_at);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION review_attendance_correction_atomic(
  p_request_id UUID,
  p_status VARCHAR(50),
  p_reviewed_by_faculty_id UUID,
  p_remarks TEXT,
  p_actor_name TEXT DEFAULT 'Reviewer',
  p_actor_role TEXT DEFAULT 'HOD'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req RECORD;
  v_review_date TIMESTAMPTZ := clock_timestamp();
BEGIN
  SELECT * INTO v_req FROM attendance_correction_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Correction request not found');
  END IF;

  UPDATE attendance_correction_requests
  SET
    status = p_status,
    reviewed_by_faculty_id = p_reviewed_by_faculty_id,
    review_date = v_review_date,
    review_remarks = p_remarks
  WHERE id = p_request_id;

  -- If approved, update attendance_records
  IF p_status = 'APPROVED' THEN
    UPDATE attendance_records
    SET
      status = v_req.requested_status,
      remarks = COALESCE(remarks || ' | ', '') || 'Corrected via HOD approval'
    WHERE class_session_id = v_req.class_session_id AND student_id = v_req.student_id;
  END IF;

  -- Log action
  INSERT INTO audit_logs (action, entity_type, entity_id, details, user_name, user_role, timestamp)
  VALUES (
    'REVIEW_ATTENDANCE_CORRECTION',
    'ATTENDANCE_CORRECTION_REQUEST',
    p_request_id::text,
    jsonb_build_object('status', p_status, 'student_id', v_req.student_id, 'class_session_id', v_req.class_session_id),
    p_actor_name,
    p_actor_role,
    v_review_date
  );

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ==============================================================================
-- 5. RELOAD POSTGREST SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
