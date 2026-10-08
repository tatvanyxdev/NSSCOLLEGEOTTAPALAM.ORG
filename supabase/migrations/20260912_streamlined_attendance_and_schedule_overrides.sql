-- ==============================================================================
-- 20260912_streamlined_attendance_and_schedule_overrides.sql
-- Streamlined Attendance, Timetable-Session Auto-Resolution, Schedule Overrides,
-- Class Tutor Scoping & Multi-Student Correction Batching
-- ==============================================================================

-- 1. Class Sessions Enhancements
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS timetable_entry_id UUID;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS session_source VARCHAR(50) DEFAULT 'TIMETABLE';
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS room VARCHAR(100);

-- Ensure partial unique index to prevent duplicate sessions for the same timetable entry and date
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_timetable_session
  ON class_sessions (timetable_entry_id, date)
  WHERE timetable_entry_id IS NOT NULL AND status <> 'CANCELLED';

-- 2. Daily Schedule Overrides Table
-- Supports PERIOD_SWAP, PERIOD_MOVE, ROOM_CHANGE, EXTRA_CLASS, CANCELLED_CLASS, SUBSTITUTE
CREATE TABLE IF NOT EXISTS daily_schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  timetable_entry_id UUID REFERENCES timetable_entries(id) ON DELETE CASCADE,
  override_type VARCHAR(50) NOT NULL,
  original_period_id UUID REFERENCES timetable_periods(id) ON DELETE SET NULL,
  new_period_id UUID REFERENCES timetable_periods(id) ON DELETE SET NULL,
  original_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  substitute_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  original_room VARCHAR(100),
  new_room VARCHAR(100),
  course_group_id UUID REFERENCES course_groups(id) ON DELETE SET NULL,
  course_offering_id UUID REFERENCES course_offerings(id) ON DELETE SET NULL,
  reason TEXT,
  created_by_faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_daily_overrides_date ON daily_schedule_overrides(date);
CREATE INDEX IF NOT EXISTS idx_daily_overrides_entry ON daily_schedule_overrides(timetable_entry_id);

-- 3. Substitute Assignments Enhancements
ALTER TABLE substitute_assignments ADD COLUMN IF NOT EXISTS timetable_entry_id UUID;
ALTER TABLE substitute_assignments ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE substitute_assignments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ASSIGNED';

-- 4. Attendance Correction Requests Enhancements
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS request_group_id UUID;

-- 5. Class Tutor Assignments Table
CREATE TABLE IF NOT EXISTS class_tutor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  programme_id UUID REFERENCES programmes(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  batch_name VARCHAR(100),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Seed demo class tutor assignment for Prof. Lekha S. Pillai if not exists
DO $$
DECLARE
  v_fac_id UUID;
  v_prog_id UUID;
  v_dept_id UUID;
BEGIN
  SELECT id, department_id INTO v_fac_id, v_dept_id FROM faculty WHERE email = 'lekha.cs@nssce.ac.in' LIMIT 1;
  SELECT id INTO v_prog_id FROM programmes WHERE code = 'BSC-CS' OR code = 'BCA' LIMIT 1;
  
  IF v_fac_id IS NOT NULL AND v_prog_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM class_tutor_assignments WHERE faculty_id = v_fac_id) THEN
      INSERT INTO class_tutor_assignments (faculty_id, programme_id, department_id, batch_name, is_active)
      VALUES (v_fac_id, v_prog_id, v_dept_id, '2024-2028', true);
    END IF;
  END IF;
END $$;

-- 6. Atomic Attendance Submission Function with Optional Topic & Emergency HOD Marking Support
CREATE OR REPLACE FUNCTION submit_session_attendance_atomic(
  p_session_id UUID,
  p_topic_covered TEXT,
  p_records JSONB,
  p_marked_by_faculty_id UUID,
  p_actor_name TEXT DEFAULT 'Faculty',
  p_actor_role TEXT DEFAULT 'TEACHER'
)
RETURNS JSONB
LANGUAGE plpgSQL
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_session RECORD;
  v_submitted_at TIMESTAMPTZ := clock_timestamp();
  v_offering RECORD;
BEGIN
  -- Verify session exists
  SELECT * INTO v_session FROM class_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Class session not found');
  END IF;

  -- Verify authorization:
  -- Allowed if marked_by_faculty_id is session's faculty, substitute faculty, or HOD/Admin
  IF p_actor_role NOT IN ('SUPER_ADMIN', 'PRINCIPAL', 'HOD') THEN
    IF v_session.faculty_id IS NOT NULL 
       AND v_session.faculty_id <> p_marked_by_faculty_id 
       AND (v_session.substitute_faculty_id IS NULL OR v_session.substitute_faculty_id <> p_marked_by_faculty_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You are not assigned to mark attendance for this session');
    END IF;
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
    topic_covered = COALESCE(NULLIF(p_topic_covered, ''), topic_covered, 'Conducted'),
    status = 'CONDUCTED'
  WHERE id = p_session_id;

  -- Insert audit log
  INSERT INTO audit_logs (action, entity_type, entity_id, details, user_name, user_role, timestamp)
  VALUES (
    CASE WHEN p_actor_role = 'HOD' AND v_session.faculty_id <> p_marked_by_faculty_id 
         THEN 'HOD_EMERGENCY_ATTENDANCE' 
         ELSE 'SUBMIT_ATTENDANCE' END,
    'CLASS_SESSION',
    p_session_id::text,
    jsonb_build_object(
      'records_count', jsonb_array_length(p_records),
      'topic_covered', p_topic_covered,
      'marked_by_faculty_id', p_marked_by_faculty_id,
      'is_emergency_hod', (p_actor_role = 'HOD' AND v_session.faculty_id <> p_marked_by_faculty_id)
    ),
    p_actor_name,
    p_actor_role,
    v_submitted_at
  );

  RETURN jsonb_build_object('success', true, 'submitted_at', v_submitted_at);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 7. RLS Policies
ALTER TABLE daily_schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_tutor_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_overrides_read_policy ON daily_schedule_overrides;
CREATE POLICY daily_overrides_read_policy ON daily_schedule_overrides
  FOR SELECT USING (true);

DROP POLICY IF EXISTS daily_overrides_write_policy ON daily_schedule_overrides;
CREATE POLICY daily_overrides_write_policy ON daily_schedule_overrides
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS class_tutor_assignments_read_policy ON class_tutor_assignments;
CREATE POLICY class_tutor_assignments_read_policy ON class_tutor_assignments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS class_tutor_assignments_write_policy ON class_tutor_assignments;
CREATE POLICY class_tutor_assignments_write_policy ON class_tutor_assignments
  FOR ALL USING (true) WITH CHECK (true);
