-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - SPECIAL ATTENDANCE & CONSOLIDATION MIGRATION
-- Run directly in Supabase SQL Editor (100% valid PostgreSQL syntax)
-- ==============================================================================

-- 1. Create or update special_attendance_events table
CREATE TABLE IF NOT EXISTS public.special_attendance_events (
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
  status VARCHAR(50) DEFAULT 'PENDING_PRINCIPAL',
  duty_certificate_ref VARCHAR(255),
  forwarded_by_hod_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  forwarded_by_hod_name VARCHAR(150),
  forwarded_at TIMESTAMPTZ,
  approved_by UUID REFERENCES faculty(id) ON DELETE SET NULL,
  approved_by_name VARCHAR(150),
  principal_remarks TEXT,
  principal_action_at TIMESTAMPTZ,
  created_by UUID REFERENCES faculty(id) ON DELETE SET NULL,
  created_by_name VARCHAR(150),
  created_by_role VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Idempotent column additions for existing tables
ALTER TABLE public.special_attendance_events 
  ADD COLUMN IF NOT EXISTS duty_certificate_ref VARCHAR(255),
  ADD COLUMN IF NOT EXISTS forwarded_by_hod_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forwarded_by_hod_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS principal_remarks TEXT,
  ADD COLUMN IF NOT EXISTS principal_action_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING_PRINCIPAL';

-- 2. Create or update special_attendance_records table
CREATE TABLE IF NOT EXISTS public.special_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES special_attendance_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period_id UUID REFERENCES timetable_periods(id) ON DELETE SET NULL,
  attendance_status VARCHAR(50) DEFAULT 'SPECIAL',
  attendance_source VARCHAR(50) DEFAULT 'SPECIAL',
  normal_session_conflict_status VARCHAR(100) DEFAULT 'OVERRIDDEN',
  original_teacher_status VARCHAR(50) DEFAULT 'ABSENT',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Idempotent column additions
ALTER TABLE public.special_attendance_records 
  ADD COLUMN IF NOT EXISTS original_teacher_status VARCHAR(50) DEFAULT 'ABSENT',
  ADD COLUMN IF NOT EXISTS normal_session_conflict_status VARCHAR(100) DEFAULT 'OVERRIDDEN',
  ADD COLUMN IF NOT EXISTS attendance_source VARCHAR(50) DEFAULT 'SPECIAL',
  ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 3. Unique constraint to prevent duplicate credits for the same student period
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unq_special_att_event_student_period'
  ) THEN
    ALTER TABLE public.special_attendance_records 
      ADD CONSTRAINT unq_special_att_event_student_period UNIQUE (event_id, student_id, period_id);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. High-performance lookup indexes for Principal approval queue & Student profile rollups
CREATE INDEX IF NOT EXISTS idx_spec_att_status ON public.special_attendance_events(status);
CREATE INDEX IF NOT EXISTS idx_spec_att_event_type ON public.special_attendance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_spec_att_event_date ON public.special_attendance_events(event_date);
CREATE INDEX IF NOT EXISTS idx_spec_att_dept_id ON public.special_attendance_events(department_id);
CREATE INDEX IF NOT EXISTS idx_spec_rec_student_event ON public.special_attendance_records(student_id, event_id);
CREATE INDEX IF NOT EXISTS idx_spec_rec_student_date ON public.special_attendance_records(student_id, date, period_id);

-- 5. Row-Level Security (RLS) Configuration
ALTER TABLE public.special_attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_attendance_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow all access special_attendance_events" ON public.special_attendance_events;
  CREATE POLICY "Allow all access special_attendance_events" 
    ON public.special_attendance_events FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all access special_attendance_records" ON public.special_attendance_records;
  CREATE POLICY "Allow all access special_attendance_records" 
    ON public.special_attendance_records FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6. Refresh PostgREST schema cache so immediate frontend queries pick up columns
NOTIFY pgrst, 'reload schema';
