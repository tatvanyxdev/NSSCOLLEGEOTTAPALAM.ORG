-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - COMPREHENSIVE MASTER DATA & SCHEMA SYNC MIGRATION
-- Migration: 20260906_comprehensive_schema_and_master_data_sync.sql
-- Target: Live Supabase Database
-- Fixes:
--   1. "invalid input syntax for type uuid: 'dept-com'"
--   2. Missing master rows in departments, programmes, categories, academic_years, semesters
--   3. Row Level Security policies allowing seamless reads and writes
--   4. Missing tables: admission_batches, semester_enrollments, substitute_assignments
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROW LEVEL SECURITY (RLS) POLICIES FOR MASTER & OPERATIONAL TABLES
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read departments" ON departments;
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write departments" ON departments;
CREATE POLICY "All write departments" ON departments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read programmes" ON programmes;
CREATE POLICY "Public read programmes" ON programmes FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write programmes" ON programmes;
CREATE POLICY "All write programmes" ON programmes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read academic_years" ON academic_years;
CREATE POLICY "Public read academic_years" ON academic_years FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write academic_years" ON academic_years;
CREATE POLICY "All write academic_years" ON academic_years FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read semesters" ON semesters;
CREATE POLICY "Public read semesters" ON semesters FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write semesters" ON semesters;
CREATE POLICY "All write semesters" ON semesters FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read course_categories" ON course_categories;
CREATE POLICY "Public read course_categories" ON course_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write course_categories" ON course_categories;
CREATE POLICY "All write course_categories" ON course_categories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read courses" ON courses;
CREATE POLICY "Public read courses" ON courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write courses" ON courses;
CREATE POLICY "All write courses" ON courses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read course_offerings" ON course_offerings;
CREATE POLICY "Public read course_offerings" ON course_offerings FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write course_offerings" ON course_offerings;
CREATE POLICY "All write course_offerings" ON course_offerings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE course_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read course_groups" ON course_groups;
CREATE POLICY "Public read course_groups" ON course_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write course_groups" ON course_groups;
CREATE POLICY "All write course_groups" ON course_groups FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read faculty" ON faculty;
CREATE POLICY "Public read faculty" ON faculty FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write faculty" ON faculty;
CREATE POLICY "All write faculty" ON faculty FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read students" ON students;
CREATE POLICY "Public read students" ON students FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write students" ON students;
CREATE POLICY "All write students" ON students FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read timetable_entries" ON timetable_entries;
CREATE POLICY "Public read timetable_entries" ON timetable_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write timetable_entries" ON timetable_entries;
CREATE POLICY "All write timetable_entries" ON timetable_entries FOR ALL USING (true) WITH CHECK (true);

-- 2. CREATE MISSING TABLES IF NOT EXISTS
CREATE TABLE IF NOT EXISTS admission_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_name VARCHAR(100) NOT NULL,
  academic_year VARCHAR(50),
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  max_capacity INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE admission_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read admission_batches" ON admission_batches;
CREATE POLICY "Public read admission_batches" ON admission_batches FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write admission_batches" ON admission_batches;
CREATE POLICY "All write admission_batches" ON admission_batches FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS semester_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  academic_year VARCHAR(50),
  semester_number INTEGER NOT NULL DEFAULT 1,
  enrolled_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE semester_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read semester_enrollments" ON semester_enrollments;
CREATE POLICY "Public read semester_enrollments" ON semester_enrollments FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write semester_enrollments" ON semester_enrollments;
CREATE POLICY "All write semester_enrollments" ON semester_enrollments FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS substitute_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
  original_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  substitute_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  assigned_by_faculty_id UUID REFERENCES faculty(id) ON DELETE RESTRICT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE substitute_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read substitute_assignments" ON substitute_assignments;
CREATE POLICY "Public read substitute_assignments" ON substitute_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "All write substitute_assignments" ON substitute_assignments;
CREATE POLICY "All write substitute_assignments" ON substitute_assignments FOR ALL USING (true) WITH CHECK (true);

-- 3. SEED ALL 18 DEPARTMENTS WITH FIXED DETERMINISTIC UUIDs
INSERT INTO departments (id, code, name, short_name, is_active)
VALUES
  ('00000000-0000-0000-0001-000000000001'::uuid, 'ENG', 'Department of English', 'ENG', true),
  ('00000000-0000-0000-0001-000000000002'::uuid, 'HIN', 'Department of Hindi', 'HIN', true),
  ('00000000-0000-0000-0001-000000000003'::uuid, 'MAL', 'Department of Malayalam', 'MAL', true),
  ('00000000-0000-0000-0001-000000000004'::uuid, 'ECO', 'Department of Economics', 'ECO', true),
  ('00000000-0000-0000-0001-000000000005'::uuid, 'HIS', 'Department of History', 'HIS', true),
  ('00000000-0000-0000-0001-000000000006'::uuid, 'BOT', 'Department of Botany', 'BOT', true),
  ('00000000-0000-0000-0001-000000000007'::uuid, 'CHE', 'Department of Chemistry', 'CHE', true),
  ('00000000-0000-0000-0001-000000000008'::uuid, 'CSC', 'Department of Computer Science', 'CSC', true),
  ('00000000-0000-0000-0001-000000000009'::uuid, 'IC',  'Department of Industrial Chemistry', 'IC', true),
  ('00000000-0000-0000-0001-000000000010'::uuid, 'MAT', 'Department of Mathematics', 'MAT', true),
  ('00000000-0000-0000-0001-000000000011'::uuid, 'PHY', 'Department of Physics', 'PHY', true),
  ('00000000-0000-0000-0001-000000000012'::uuid, 'ZOO', 'Department of Zoology', 'ZOO', true),
  ('00000000-0000-0000-0001-000000000013'::uuid, 'COM', 'Department of Commerce & Management', 'COM', true),
  ('00000000-0000-0000-0001-000000000014'::uuid, 'PED', 'Department of Physical Education', 'PED', true),
  ('00000000-0000-0000-0001-000000000015'::uuid, 'SAN', 'Department of Sanskrit', 'SAN', true),
  ('00000000-0000-0000-0001-000000000016'::uuid, 'POL', 'Department of Political Science', 'POL', true),
  ('00000000-0000-0000-0001-000000000017'::uuid, 'STA', 'Department of Statistics', 'STA', true),
  ('00000000-0000-0000-0001-000000000018'::uuid, 'ADM', 'Administrative Office', 'ADM', true)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  is_active = EXCLUDED.is_active;

-- 4. SEED COURSE CATEGORIES (FYUGP Architecture)
INSERT INTO course_categories (id, code, name, description, is_active)
VALUES
  ('00000000-0000-0000-0002-000000000001'::uuid, 'MAJOR', 'Major Core Course', 'Core discipline course of the admitted programme', true),
  ('00000000-0000-0000-0002-000000000002'::uuid, 'MINOR', 'Minor Course', 'Discipline specific minor chosen from other departments', true),
  ('00000000-0000-0000-0002-000000000003'::uuid, 'MDC',   'Multidisciplinary Course (MDC)', 'Introductory courses across various discipline clusters', true),
  ('00000000-0000-0000-0002-000000000004'::uuid, 'AEC',   'Ability Enhancement Course (AEC)', 'Language and Communication proficiency (English)', true),
  ('00000000-0000-0000-0002-000000000005'::uuid, 'SEC',   'Skill Enhancement Course (SEC)', 'Hands-on practical skills & modern applied languages', true),
  ('00000000-0000-0000-0002-000000000006'::uuid, 'VAC',   'Value Added Course (VAC)', 'Environmental studies, Ethics, Indian Constitution', true),
  ('00000000-0000-0000-0002-000000000007'::uuid, 'INTERN','Internship / Field Project', 'Industrial training and community engagement', true),
  ('00000000-0000-0000-0002-000000000008'::uuid, 'PROJECT','Research Project / Dissertation', 'Capstone undergraduate or postgraduate thesis', true)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 5. SEED ACADEMIC YEARS
INSERT INTO academic_years (id, name, start_date, end_date, is_current, is_active)
VALUES
  ('00000000-0000-0000-0003-000000000001'::uuid, '2026-27', '2026-06-01'::date, '2027-03-31'::date, true, true),
  ('00000000-0000-0000-0003-000000000002'::uuid, '2025-26', '2025-06-01'::date, '2026-03-31'::date, false, true),
  ('00000000-0000-0000-0003-000000000003'::uuid, '2024-25', '2024-06-01'::date, '2025-03-31'::date, false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  is_current = EXCLUDED.is_current,
  is_active = EXCLUDED.is_active;

-- 6. SEED SEMESTERS (1 to 8)
INSERT INTO semesters (id, name, semester_number, academic_year_id, is_active)
VALUES
  ('00000000-0000-0000-0004-000000000001'::uuid, 'Semester 1', 1, '00000000-0000-0000-0003-000000000001'::uuid, true),
  ('00000000-0000-0000-0004-000000000002'::uuid, 'Semester 2', 2, '00000000-0000-0000-0003-000000000001'::uuid, true),
  ('00000000-0000-0000-0004-000000000003'::uuid, 'Semester 3', 3, '00000000-0000-0000-0003-000000000001'::uuid, true),
  ('00000000-0000-0000-0004-000000000004'::uuid, 'Semester 4', 4, '00000000-0000-0000-0003-000000000001'::uuid, true),
  ('00000000-0000-0000-0004-000000000005'::uuid, 'Semester 5', 5, '00000000-0000-0000-0003-000000000001'::uuid, true),
  ('00000000-0000-0000-0004-000000000006'::uuid, 'Semester 6', 6, '00000000-0000-0000-0003-000000000001'::uuid, true),
  ('00000000-0000-0000-0004-000000000007'::uuid, 'Semester 7', 7, '00000000-0000-0000-0003-000000000001'::uuid, true),
  ('00000000-0000-0000-0004-000000000008'::uuid, 'Semester 8', 8, '00000000-0000-0000-0003-000000000001'::uuid, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  semester_number = EXCLUDED.semester_number,
  academic_year_id = EXCLUDED.academic_year_id,
  is_active = EXCLUDED.is_active;

-- 7. SEED PROGRAMMES
INSERT INTO programmes (id, code, name, department_id, duration_years, total_semesters, expected_strength, is_active)
VALUES
  ('00000000-0000-0000-0005-000000000001'::uuid, 'BAENG',  'BA English Language and Literature', '00000000-0000-0000-0001-000000000001'::uuid, 4, 8, 50, true),
  ('00000000-0000-0000-0005-000000000002'::uuid, 'BAHIN',  'BA Hindi Language and Literature',   '00000000-0000-0000-0001-000000000002'::uuid, 4, 8, 40, true),
  ('00000000-0000-0000-0005-000000000003'::uuid, 'BAMAL',  'BA Malayalam',                       '00000000-0000-0000-0001-000000000003'::uuid, 4, 8, 40, true),
  ('00000000-0000-0000-0005-000000000004'::uuid, 'BAECO',  'BA Economics',                       '00000000-0000-0000-0001-000000000004'::uuid, 4, 8, 60, true),
  ('00000000-0000-0000-0005-000000000005'::uuid, 'BAHIS',  'BA History',                         '00000000-0000-0000-0001-000000000005'::uuid, 4, 8, 50, true),
  ('00000000-0000-0000-0005-000000000006'::uuid, 'BSCBOT', 'BSc Botany',                        '00000000-0000-0000-0001-000000000006'::uuid, 4, 8, 40, true),
  ('00000000-0000-0000-0005-000000000007'::uuid, 'BSCCHE', 'BSc Chemistry',                     '00000000-0000-0000-0001-000000000007'::uuid, 4, 8, 40, true),
  ('00000000-0000-0000-0005-000000000008'::uuid, 'BSCCS',  'BSc Computer Science',               '00000000-0000-0000-0001-000000000008'::uuid, 4, 8, 40, true),
  ('00000000-0000-0000-0005-000000000009'::uuid, 'BSCIC',  'BSc Industrial Chemistry',           '00000000-0000-0000-0001-000000000009'::uuid, 4, 8, 30, true),
  ('00000000-0000-0000-0005-000000000010'::uuid, 'BSCMAT', 'BSc Mathematics',                    '00000000-0000-0000-0001-000000000010'::uuid, 4, 8, 48, true),
  ('00000000-0000-0000-0005-000000000011'::uuid, 'BSCPHY', 'BSc Physics',                        '00000000-0000-0000-0001-000000000011'::uuid, 4, 8, 40, true),
  ('00000000-0000-0000-0005-000000000012'::uuid, 'BSCZOO', 'BSc Zoology',                        '00000000-0000-0000-0001-000000000012'::uuid, 4, 8, 40, true),
  ('00000000-0000-0000-0005-000000000013'::uuid, 'BCOM',   'B.Com (Finance & Co-operation)',     '00000000-0000-0000-0001-000000000013'::uuid, 4, 8, 65, true),
  ('00000000-0000-0000-0005-000000000014'::uuid, 'MAENG',  'MA English Language and Literature', '00000000-0000-0000-0001-000000000001'::uuid, 2, 4, 20, true),
  ('00000000-0000-0000-0005-000000000015'::uuid, 'MAECO',  'MA Economics',                       '00000000-0000-0000-0001-000000000004'::uuid, 2, 4, 20, true),
  ('00000000-0000-0000-0005-000000000016'::uuid, 'MSCCS',  'MSc Computer Science',               '00000000-0000-0000-0001-000000000008'::uuid, 2, 4, 15, true),
  ('00000000-0000-0000-0005-000000000017'::uuid, 'MSCMAT', 'MSc Mathematics',                   '00000000-0000-0000-0001-000000000010'::uuid, 2, 4, 20, true),
  ('00000000-0000-0000-0005-000000000018'::uuid, 'MSCPHY', 'MSc Physics',                       '00000000-0000-0000-0001-000000000011'::uuid, 2, 4, 15, true),
  ('00000000-0000-0000-0005-000000000019'::uuid, 'MCOM',   'M.Com Finance',                      '00000000-0000-0000-0001-000000000013'::uuid, 2, 4, 20, true)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  department_id = EXCLUDED.department_id,
  duration_years = EXCLUDED.duration_years,
  total_semesters = EXCLUDED.total_semesters,
  expected_strength = EXCLUDED.expected_strength,
  is_active = EXCLUDED.is_active;

-- 8. SEED CORE FOUNDATIONAL COURSES
INSERT INTO courses (id, course_code, course_title, department_id, course_category_id, credits, lecture_hours, practical_hours, description, is_active)
VALUES
  ('00000000-0000-0000-0006-000000000001'::uuid, 'CSC1B01T', 'Programming in C and Python Basics', '00000000-0000-0000-0001-000000000008'::uuid, '00000000-0000-0000-0002-000000000001'::uuid, 4, 3, 2, 'Foundation course in structured procedural programming and modern Python scripting.', true),
  ('00000000-0000-0000-0006-000000000002'::uuid, 'MAT1C01T', 'Foundations of Discrete Mathematics', '00000000-0000-0000-0001-000000000010'::uuid, '00000000-0000-0000-0002-000000000002'::uuid, 4, 4, 0, 'Set theory, propositional logic, graph theory, and mathematical induction.', true),
  ('00000000-0000-0000-0006-000000000003'::uuid, 'ENG1A01T', 'Communicative English & Critical Reading', '00000000-0000-0000-0001-000000000001'::uuid, '00000000-0000-0000-0002-000000000004'::uuid, 3, 3, 0, 'Professional verbal communication, technical writing, and rhetoric.', true),
  ('00000000-0000-0000-0006-000000000004'::uuid, 'MDC101',   'Principles of Modern Management', '00000000-0000-0000-0001-000000000013'::uuid, '00000000-0000-0000-0002-000000000003'::uuid, 3, 3, 0, 'Interdisciplinary exploration of managerial economics, human resources, and leadership.', true),
  ('00000000-0000-0000-0006-000000000005'::uuid, 'SEC101T',  'Web Application Development & UI Design', '00000000-0000-0000-0001-000000000008'::uuid, '00000000-0000-0000-0002-000000000005'::uuid, 2, 1, 2, 'Modern frontend development, responsive layouts, web accessibility, and interactive design.', true),
  ('00000000-0000-0000-0006-000000000006'::uuid, 'VAC101',   'Ethics, Constitutional Values & Digital Citizenship', '00000000-0000-0000-0001-000000000008'::uuid, '00000000-0000-0000-0002-000000000006'::uuid, 2, 2, 0, 'Constitutional rights, ethical reasoning in digital age, and cyber law awareness.', true)
ON CONFLICT (id) DO UPDATE SET
  course_code = EXCLUDED.course_code,
  course_title = EXCLUDED.course_title,
  department_id = EXCLUDED.department_id,
  course_category_id = EXCLUDED.course_category_id,
  credits = EXCLUDED.credits,
  is_active = EXCLUDED.is_active;

-- 9. SEED COURSE OFFERINGS
INSERT INTO course_offerings (id, course_id, offering_department_id, academic_year_id, semester_id, is_active)
VALUES
  ('00000000-0000-0000-0007-000000000001'::uuid, '00000000-0000-0000-0006-000000000001'::uuid, '00000000-0000-0000-0001-000000000008'::uuid, '00000000-0000-0000-0003-000000000001'::uuid, '00000000-0000-0000-0004-000000000001'::uuid, true),
  ('00000000-0000-0000-0007-000000000002'::uuid, '00000000-0000-0000-0006-000000000002'::uuid, '00000000-0000-0000-0001-000000000010'::uuid, '00000000-0000-0000-0003-000000000001'::uuid, '00000000-0000-0000-0004-000000000001'::uuid, true),
  ('00000000-0000-0000-0007-000000000003'::uuid, '00000000-0000-0000-0006-000000000003'::uuid, '00000000-0000-0000-0001-000000000001'::uuid, '00000000-0000-0000-0003-000000000001'::uuid, '00000000-0000-0000-0004-000000000001'::uuid, true),
  ('00000000-0000-0000-0007-000000000004'::uuid, '00000000-0000-0000-0006-000000000004'::uuid, '00000000-0000-0000-0001-000000000013'::uuid, '00000000-0000-0000-0003-000000000001'::uuid, '00000000-0000-0000-0004-000000000001'::uuid, true),
  ('00000000-0000-0000-0007-000000000005'::uuid, '00000000-0000-0000-0006-000000000005'::uuid, '00000000-0000-0000-0001-000000000008'::uuid, '00000000-0000-0000-0003-000000000001'::uuid, '00000000-0000-0000-0004-000000000001'::uuid, true),
  ('00000000-0000-0000-0007-000000000006'::uuid, '00000000-0000-0000-0006-000000000006'::uuid, '00000000-0000-0000-0001-000000000008'::uuid, '00000000-0000-0000-0003-000000000001'::uuid, '00000000-0000-0000-0004-000000000001'::uuid, true)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  offering_department_id = EXCLUDED.offering_department_id,
  academic_year_id = EXCLUDED.academic_year_id,
  semester_id = EXCLUDED.semester_id,
  is_active = EXCLUDED.is_active;

-- 10. SEED COURSE GROUPS
INSERT INTO course_groups (id, course_offering_id, group_name, capacity, room, is_active)
VALUES
  ('00000000-0000-0000-0008-000000000001'::uuid, '00000000-0000-0000-0007-000000000001'::uuid, 'Batch CS-A', 45, 'CS Lab 1 / Room 102', true),
  ('00000000-0000-0000-0008-000000000002'::uuid, '00000000-0000-0000-0007-000000000002'::uuid, 'Minor Group M1', 55, 'Ramanujan Hall 204', true),
  ('00000000-0000-0000-0008-000000000003'::uuid, '00000000-0000-0000-0007-000000000003'::uuid, 'AEC English Cohort 1', 60, 'Language Lab 105', true),
  ('00000000-0000-0000-0008-000000000004'::uuid, '00000000-0000-0000-0007-000000000004'::uuid, 'MDC Cluster C1', 60, 'Commerce Seminar Hall', true),
  ('00000000-0000-0000-0008-000000000005'::uuid, '00000000-0000-0000-0007-000000000005'::uuid, 'SEC Web Lab S1', 40, 'Computing Centre Lab 3', true),
  ('00000000-0000-0000-0008-000000000006'::uuid, '00000000-0000-0000-0007-000000000006'::uuid, 'Values Cohort V1', 50, 'Room 102', true)
ON CONFLICT (id) DO UPDATE SET
  course_offering_id = EXCLUDED.course_offering_id,
  group_name = EXCLUDED.group_name,
  capacity = EXCLUDED.capacity,
  room = EXCLUDED.room,
  is_active = EXCLUDED.is_active;

-- 11. SEED INITIAL FACULTY
INSERT INTO faculty (id, employee_id, employee_code, full_name, email, phone, mobile_number, department_id, designation, is_active)
VALUES
  ('00000000-0000-0000-0009-000000000001'::uuid, 'PEN-1995-CS01',  'PEN-1995-CS01',  'Dr. Radhakrishnan K.', 'radhakrishnan.cs@nssce.ac.in', '+91 94471 23450', '+91 94471 23450', '00000000-0000-0000-0001-000000000008'::uuid, 'Associate Professor & HOD', true),
  ('00000000-0000-0000-0009-000000000002'::uuid, 'PEN-2005-CS02',  'PEN-2005-CS02',  'Prof. Lekha S. Pillai', 'lekha.cs@nssce.ac.in',         '+91 94472 34561', '+91 94472 34561', '00000000-0000-0000-0001-000000000008'::uuid, 'Assistant Professor & Tutor', true),
  ('00000000-0000-0000-0009-000000000003'::uuid, 'PEN-1998-MAT01', 'PEN-1998-MAT01', 'Dr. Narayanan M.',      'narayanan.mat@nssce.ac.in',     '+91 94473 45672', '+91 94473 45672', '00000000-0000-0000-0001-000000000010'::uuid, 'Associate Professor & HOD', true),
  ('00000000-0000-0000-0009-000000000004'::uuid, 'PEN-2002-PHY01', 'PEN-2002-PHY01', 'Dr. Gopakumar V.',      'gopakumar.phy@nssce.ac.in',     '+91 94474 56783', '+91 94474 56783', '00000000-0000-0000-0001-000000000011'::uuid, 'Associate Professor', true),
  ('00000000-0000-0000-0009-000000000005'::uuid, 'PEN-2010-ENG01', 'PEN-2010-ENG01', 'Prof. Meera Nair',       'meera.eng@nssce.ac.in',         '+91 94475 67894', '+91 94475 67894', '00000000-0000-0000-0001-000000000001'::uuid, 'Assistant Professor', true),
  ('00000000-0000-0000-0009-000000000006'::uuid, 'PEN-2012-COM01', 'PEN-2012-COM01', 'Dr. Suresh Kumar P.',    'suresh.com@nssce.ac.in',        '+91 94476 78905', '+91 94476 78905', '00000000-0000-0000-0001-000000000013'::uuid, 'Associate Professor & HOD', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  mobile_number = EXCLUDED.mobile_number,
  department_id = EXCLUDED.department_id,
  designation = EXCLUDED.designation,
  is_active = EXCLUDED.is_active;
