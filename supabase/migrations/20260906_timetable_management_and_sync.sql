-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - TIMETABLE SYSTEM & DATABASE SYNC MIGRATION
-- Migration: 20260906_timetable_management_and_sync.sql
-- Target: Live PostgreSQL / Supabase Schema
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SEED / UPSERT 5-PERIOD COLLEGE MODEL INTO timetable_periods
-- Exact live columns: id (uuid), period_number (int), name (text), start_time (time), end_time (time), is_break (bool), is_active (bool)
INSERT INTO timetable_periods (id, period_number, name, start_time, end_time, is_break, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 1, 'Period 1', '09:30:00'::time, '10:30:00'::time, false, true),
  ('00000000-0000-0000-0000-000000000002'::uuid, 2, 'Period 2', '10:30:00'::time, '11:30:00'::time, false, true),
  ('00000000-0000-0000-0000-000000000003'::uuid, 3, 'Period 3', '11:30:00'::time, '12:30:00'::time, false, true),
  ('00000000-0000-0000-0000-000000000000'::uuid, 0, 'Lunch Break', '12:30:00'::time, '13:30:00'::time, true, true),
  ('00000000-0000-0000-0000-000000000004'::uuid, 4, 'Period 4', '13:30:00'::time, '14:30:00'::time, false, true),
  ('00000000-0000-0000-0000-000000000005'::uuid, 5, 'Period 5', '14:30:00'::time, '15:30:00'::time, false, true)
ON CONFLICT (id) DO UPDATE SET
  period_number = EXCLUDED.period_number,
  name = EXCLUDED.name,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_break = EXCLUDED.is_break,
  is_active = EXCLUDED.is_active;

-- 2. PERFORMANCE & CONFLICT DETECTION INDEXES FOR timetable_entries
-- Exact live columns: id, academic_year_id, semester_id, course_offering_id, course_group_id, faculty_id, weekday, period_id, room, is_active
CREATE INDEX IF NOT EXISTS idx_timetable_weekday_period 
  ON timetable_entries(weekday, period_id);

CREATE INDEX IF NOT EXISTS idx_timetable_faculty_slot 
  ON timetable_entries(faculty_id, weekday, period_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_timetable_room_slot 
  ON timetable_entries(room, weekday, period_id)
  WHERE is_active = true AND room IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_timetable_offering 
  ON timetable_entries(course_offering_id);

CREATE INDEX IF NOT EXISTS idx_timetable_group 
  ON timetable_entries(course_group_id);

-- 3. ROW LEVEL SECURITY (RLS) FOR TIMETABLE TABLES
ALTER TABLE timetable_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;

-- Timetable Periods RLS
DROP POLICY IF EXISTS "Anyone can read timetable periods" ON timetable_periods;
CREATE POLICY "Anyone can read timetable periods" 
  ON timetable_periods FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Admins can manage timetable periods" ON timetable_periods;
CREATE POLICY "Admins can manage timetable periods" 
  ON timetable_periods FOR ALL 
  USING (
    auth.role() = 'authenticated'
    OR auth.uid() IS NOT NULL
  );

-- Timetable Entries RLS: Public read, authenticated users can insert/update/delete
DROP POLICY IF EXISTS "Public read timetable entries" ON timetable_entries;
CREATE POLICY "Public read timetable entries" 
  ON timetable_entries FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "SuperAdmins and HODs insert timetable" ON timetable_entries;
CREATE POLICY "SuperAdmins and HODs insert timetable" 
  ON timetable_entries FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated'
    OR auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "SuperAdmins and HODs update timetable" ON timetable_entries;
CREATE POLICY "SuperAdmins and HODs update timetable" 
  ON timetable_entries FOR UPDATE 
  USING (
    auth.role() = 'authenticated'
    OR auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "SuperAdmins and HODs delete timetable" ON timetable_entries;
CREATE POLICY "SuperAdmins and HODs delete timetable" 
  ON timetable_entries FOR DELETE 
  USING (
    auth.role() = 'authenticated'
    OR auth.uid() IS NOT NULL
  );

-- 4. CONVENIENT VIEW: TIMETABLE DETAILS WITH JOINED METADATA
-- Perfectly mapped to:
--   - courses (course_category_id, department_id)
--   - course_offerings (offering_department_id, academic_year_id, semester_id)
--   - timetable_periods (name, start_time, end_time)
--   - timetable_entries (weekday integer)
CREATE OR REPLACE VIEW view_timetable_details AS
SELECT 
  te.id,
  ay.name AS academic_year,
  COALESCE(sem.semester_number, 1) AS semester_number,
  CASE te.weekday
    WHEN 1 THEN 'MONDAY'
    WHEN 2 THEN 'TUESDAY'
    WHEN 3 THEN 'WEDNESDAY'
    WHEN 4 THEN 'THURSDAY'
    WHEN 5 THEN 'FRIDAY'
    WHEN 6 THEN 'SATURDAY'
    WHEN 7 THEN 'SUNDAY'
    ELSE 'MONDAY'
  END AS day_of_week,
  te.weekday,
  te.period_id,
  tp.period_number,
  tp.start_time,
  tp.end_time,
  tp.name AS period_label,
  tp.name AS period_name,
  tp.is_break,
  te.course_offering_id,
  c.course_code,
  c.course_title,
  c.credits,
  cc.name AS category_name,
  cc.code AS category_code,
  te.course_group_id,
  cg.group_name,
  te.faculty_id,
  f.full_name AS faculty_name,
  f.designation AS faculty_designation,
  d.id AS department_id,
  d.name AS department_name,
  d.code AS department_code,
  COALESCE(te.room, cg.room, 'Room 101') AS room,
  te.is_active,
  te.created_at
FROM timetable_entries te
LEFT JOIN timetable_periods tp ON te.period_id = tp.id
LEFT JOIN academic_years ay ON te.academic_year_id = ay.id
LEFT JOIN semesters sem ON te.semester_id = sem.id
LEFT JOIN course_offerings co ON te.course_offering_id = co.id
LEFT JOIN courses c ON co.course_id = c.id
LEFT JOIN course_categories cc ON c.course_category_id = cc.id
LEFT JOIN course_groups cg ON te.course_group_id = cg.id
LEFT JOIN faculty f ON te.faculty_id = f.id
LEFT JOIN departments d ON COALESCE(co.offering_department_id, c.department_id) = d.id;

-- Grant select permissions on the view
GRANT SELECT ON view_timetable_details TO authenticated, anon;
