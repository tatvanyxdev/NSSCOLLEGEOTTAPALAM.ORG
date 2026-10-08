-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - SPECIAL & INSTITUTIONAL ATTENDANCE MODULE
-- Fully idempotent migration script for auditable special attendance tracking
-- ==============================================================================

-- 1. SPECIAL ATTENDANCE EVENTS TABLE
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
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES admission_batches(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  course_group_id UUID REFERENCES course_groups(id) ON DELETE SET NULL,
  student_coverage VARCHAR(50) DEFAULT 'ALL_ELIGIBLE',
  selected_student_ids TEXT[] DEFAULT '{}',
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'APPLIED',
  created_by UUID REFERENCES faculty(id) ON DELETE SET NULL,
  created_by_name VARCHAR(150),
  created_by_role VARCHAR(50),
  approved_by UUID REFERENCES faculty(id) ON DELETE SET NULL,
  approved_by_name VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Idempotent column checks
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS period_ids TEXT[] DEFAULT '{}';
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS is_full_day BOOLEAN DEFAULT false;
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS start_time VARCHAR(20);
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS end_time VARCHAR(20);
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL;
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES admission_batches(id) ON DELETE SET NULL;
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL;
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS course_group_id UUID REFERENCES course_groups(id) ON DELETE SET NULL;
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS student_coverage VARCHAR(50) DEFAULT 'ALL_ELIGIBLE';
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS selected_student_ids TEXT[] DEFAULT '{}';
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(150);
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50);
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES faculty(id) ON DELETE SET NULL;
ALTER TABLE special_attendance_events ADD COLUMN IF NOT EXISTS approved_by_name VARCHAR(150);

-- 2. SPECIAL ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS special_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES special_attendance_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period_id UUID REFERENCES timetable_periods(id) ON DELETE SET NULL,
  attendance_status VARCHAR(50) DEFAULT 'SPECIAL',
  attendance_source VARCHAR(50) DEFAULT 'SPECIAL',
  normal_session_conflict_status VARCHAR(100) DEFAULT 'NO_SESSION',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE special_attendance_records ADD COLUMN IF NOT EXISTS normal_session_conflict_status VARCHAR(100) DEFAULT 'NO_SESSION';
ALTER TABLE special_attendance_records ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE special_attendance_records ADD COLUMN IF NOT EXISTS attendance_source VARCHAR(50) DEFAULT 'SPECIAL';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unq_special_att_event_student_period') THEN
    ALTER TABLE special_attendance_records ADD CONSTRAINT unq_special_att_event_student_period UNIQUE (event_id, student_id, period_id);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. INDEXES FOR HIGH-PERFORMANCE CONFLICT CHECKS
CREATE INDEX IF NOT EXISTS idx_spec_att_event_date ON special_attendance_events(event_date);
CREATE INDEX IF NOT EXISTS idx_spec_att_dept ON special_attendance_events(department_id);
CREATE INDEX IF NOT EXISTS idx_spec_rec_student_date ON special_attendance_records(student_id, date, period_id);

-- 4. ROW-LEVEL SECURITY POLICIES
ALTER TABLE special_attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_attendance_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow all access" ON special_attendance_events;
  CREATE POLICY "Allow all access" ON special_attendance_events FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all access" ON special_attendance_records;
  CREATE POLICY "Allow all access" ON special_attendance_records FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
