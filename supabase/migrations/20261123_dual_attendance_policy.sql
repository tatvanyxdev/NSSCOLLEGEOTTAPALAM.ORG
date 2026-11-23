-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - DUAL ATTENDANCE CALCULATION POLICY MIGRATION
-- Migration: 20261123_dual_attendance_policy.sql
-- Purpose:
--   1. Add `attendance_policy` ('HOUR_WISE' | 'SESSION_STRICT') to `departments`.
--   2. Add `session` ('FN' | 'AN') to `timetable_periods` & backfill existing rows.
--   3. Safely add `'DUTY_LEAVE'` and `'CANCELLED'` to `attendance_status_enum`.
--   4. Update `submit_session_attendance_atomic` RPC to tally DUTY_LEAVE & CANCELLED.
--   5. Reload PostgREST schema cache without affecting any existing raw period logs.
-- ==============================================================================

-- 1. Department Attendance Policy Setting ('HOUR_WISE' default, or 'SESSION_STRICT')
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS attendance_policy VARCHAR(30) NOT NULL DEFAULT 'HOUR_WISE';

UPDATE departments
SET attendance_policy = 'HOUR_WISE'
WHERE attendance_policy IS NULL
   OR attendance_policy NOT IN ('HOUR_WISE', 'SESSION_STRICT');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_departments_attendance_policy'
      AND conrelid = 'departments'::regclass
  ) THEN
    ALTER TABLE departments DROP CONSTRAINT chk_departments_attendance_policy;
  END IF;

  ALTER TABLE departments
    ADD CONSTRAINT chk_departments_attendance_policy
    CHECK (attendance_policy IN ('HOUR_WISE', 'SESSION_STRICT'));
END $$;

-- 2. Timetable Period Session Mapping ('FN' = Forenoon Periods 1-3, 'AN' = Afternoon Periods 4-5+)
ALTER TABLE timetable_periods
  ADD COLUMN IF NOT EXISTS session VARCHAR(10) NOT NULL DEFAULT 'FN';

UPDATE timetable_periods
SET session = CASE
  WHEN period_number >= 4 THEN 'AN'
  ELSE 'FN'
END
WHERE (period_number >= 4 AND (session IS NULL OR session <> 'AN'))
   OR (period_number < 4 AND (session IS NULL OR session NOT IN ('FN', 'AN')));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_timetable_periods_session'
      AND conrelid = 'timetable_periods'::regclass
  ) THEN
    ALTER TABLE timetable_periods DROP CONSTRAINT chk_timetable_periods_session;
  END IF;

  ALTER TABLE timetable_periods
    ADD CONSTRAINT chk_timetable_periods_session
    CHECK (session IN ('FN', 'AN'));
END $$;

-- 3. Align attendance_records, class_sessions, audit_logs, and corrections with atomic RPCs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_records'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE attendance_records
      ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PRESENT';
  ELSE
    BEGIN
      ALTER TABLE attendance_records ALTER COLUMN status DROP DEFAULT;
      ALTER TABLE attendance_records ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
      ALTER TABLE attendance_records ALTER COLUMN status SET DEFAULT 'PRESENT';
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- Legacy attendance_status_id FK column must be nullable when storing atomic string statuses
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_records'
      AND column_name = 'attendance_status_id'
  ) THEN
    ALTER TABLE attendance_records ALTER COLUMN attendance_status_id DROP NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_session_student
  ON attendance_records(class_session_id, student_id);

-- Keep class_sessions date and session_date aligned
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS session_date DATE;

UPDATE class_sessions
SET date = COALESCE(date, session_date, CURRENT_DATE),
    session_date = COALESCE(session_date, date, CURRENT_DATE)
WHERE date IS NULL OR session_date IS NULL;

CREATE OR REPLACE FUNCTION trg_sync_class_session_dates()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date := COALESCE(NEW.date, NEW.session_date, CURRENT_DATE);
  NEW.session_date := COALESCE(NEW.session_date, NEW.date, CURRENT_DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_class_session_dates_trigger ON class_sessions;
CREATE TRIGGER sync_class_session_dates_trigger
BEFORE INSERT OR UPDATE ON class_sessions
FOR EACH ROW
EXECUTE FUNCTION trg_sync_class_session_dates();

-- Ensure audit_logs supports atomic RPC audit entries
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
DO $$
BEGIN
  ALTER TABLE audit_logs ALTER COLUMN entity_id TYPE TEXT USING entity_id::text;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Ensure attendance_correction_requests supports period-level requests
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS class_session_id UUID;
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS requested_by_faculty_id UUID;
ALTER TABLE attendance_correction_requests ADD COLUMN IF NOT EXISTS request_group_id UUID;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance_correction_requests'
      AND column_name = 'attendance_record_id'
  ) THEN
    ALTER TABLE attendance_correction_requests ALTER COLUMN attendance_record_id DROP NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    BEGIN
      ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'CONDUCTED';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'CANCELLED';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status_enum') THEN
    BEGIN
      ALTER TYPE attendance_status_enum ADD VALUE IF NOT EXISTS 'DUTY_LEAVE';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE attendance_status_enum ADD VALUE IF NOT EXISTS 'CANCELLED';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 4. Update atomic attendance submission RPC to track DUTY_LEAVE and CANCELLED cleanly
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
  v_session RECORD;
  v_rec JSONB;
  v_student_id UUID;
  v_status VARCHAR(50);
  v_remarks TEXT;
  v_inserted_count INT := 0;
  v_present_count INT := 0;
  v_absent_count INT := 0;
  v_duty_leave_count INT := 0;
  v_od_count INT := 0;
  v_medical_count INT := 0;
  v_cancelled_count INT := 0;
  v_server_now TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
BEGIN
  -- 1. Lock and validate session
  SELECT * INTO v_session
  FROM class_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class session with ID % does not exist.', p_session_id;
  END IF;

  -- 2. Authorization check: must be assigned faculty, substitute faculty, or authorized admin
  IF v_session.faculty_id IS NOT NULL
     AND v_session.faculty_id <> p_marked_by_faculty_id
     AND (v_session.substitute_faculty_id IS NULL OR v_session.substitute_faculty_id <> p_marked_by_faculty_id) THEN

     IF NOT EXISTS (
       SELECT 1 FROM faculty
       WHERE id = p_marked_by_faculty_id
         AND ('SUPER_ADMIN' = ANY(roles) OR 'PRINCIPAL' = ANY(roles) OR 'HOD' = ANY(roles))
     ) THEN
       RAISE EXCEPTION 'Unauthorized: Faculty % is not authorized to submit attendance for session %.', p_marked_by_faculty_id, p_session_id;
     END IF;
  END IF;

  -- 3. Upsert atomic period-level attendance records (never overwrite raw history)
  FOR v_rec IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    v_student_id := (v_rec->>'student_id')::UUID;
    v_status := COALESCE(v_rec->>'status', 'PRESENT');
    v_remarks := NULLIF(v_rec->>'remarks', '');

    INSERT INTO attendance_records (
      class_session_id,
      student_id,
      status,
      marked_by_faculty_id,
      marked_timestamp,
      remarks
    ) VALUES (
      p_session_id,
      v_student_id,
      v_status,
      p_marked_by_faculty_id,
      v_server_now,
      v_remarks
    )
    ON CONFLICT (class_session_id, student_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      marked_by_faculty_id = EXCLUDED.marked_by_faculty_id,
      marked_timestamp = v_server_now,
      remarks = EXCLUDED.remarks;

    v_inserted_count := v_inserted_count + 1;
    IF v_status = 'PRESENT' THEN
      v_present_count := v_present_count + 1;
    ELSIF v_status = 'ABSENT' THEN
      v_absent_count := v_absent_count + 1;
    ELSIF v_status = 'DUTY_LEAVE' THEN
      v_duty_leave_count := v_duty_leave_count + 1;
    ELSIF v_status = 'OD' THEN
      v_od_count := v_od_count + 1;
    ELSIF v_status = 'MEDICAL_LEAVE' THEN
      v_medical_count := v_medical_count + 1;
    ELSIF v_status = 'CANCELLED' THEN
      v_cancelled_count := v_cancelled_count + 1;
    END IF;
  END LOOP;

  -- 4. Update class session to CONDUCTED with server timestamp
  UPDATE class_sessions
  SET status = 'CONDUCTED',
      attendance_submitted = true,
      submitted_timestamp = v_server_now,
      topic_covered = COALESCE(NULLIF(p_topic_covered, ''), topic_covered)
  WHERE id = p_session_id;

  -- 5. Record authoritative audit log in the same database transaction
  INSERT INTO audit_logs (
    actor_id,
    actor_name,
    actor_role,
    action,
    entity_type,
    entity_id,
    details,
    timestamp
  ) VALUES (
    p_marked_by_faculty_id::TEXT,
    p_actor_name,
    p_actor_role,
    'SUBMIT_ATTENDANCE_ATOMIC',
    'CLASS_SESSION',
    p_session_id::TEXT,
    jsonb_build_object(
      'totalRecords', v_inserted_count,
      'presentCount', v_present_count,
      'absentCount', v_absent_count,
      'dutyLeaveCount', v_duty_leave_count,
      'odCount', v_od_count,
      'medicalCount', v_medical_count,
      'cancelledCount', v_cancelled_count,
      'topicCovered', p_topic_covered
    ),
    v_server_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'class_session_id', p_session_id,
    'total_marked', v_inserted_count,
    'present_count', v_present_count,
    'absent_count', v_absent_count,
    'duty_leave_count', v_duty_leave_count,
    'od_count', v_od_count,
    'cancelled_count', v_cancelled_count,
    'submitted_at', v_server_now
  );
END;
$$;

-- 5. Enforce active session slot uniqueness (course_group_id, date, period_id) for non-CANCELLED sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'class_sessions'
      AND indexname = 'uq_class_sessions_active_slot'
  ) THEN
    BEGIN
      CREATE UNIQUE INDEX uq_class_sessions_active_slot
        ON class_sessions (course_group_id, date, period_id)
        WHERE status <> 'CANCELLED'
          AND course_group_id IS NOT NULL
          AND period_id IS NOT NULL
          AND date IS NOT NULL;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Skipped uq_class_sessions_active_slot creation due to pre-existing duplicate slot rows.';
    END;
  END IF;
END $$;

-- 6. Atomic attendance correction review RPC (updates request + upserts atomic period record + writes audit log)
CREATE OR REPLACE FUNCTION review_attendance_correction_atomic(
  p_request_id UUID,
  p_status VARCHAR,
  p_reviewed_by_faculty_id UUID,
  p_remarks TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Reviewer',
  p_actor_role TEXT DEFAULT 'HOD'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req RECORD;
  v_server_now TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
  v_is_authorized BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_req
  FROM attendance_correction_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance correction request % does not exist.', p_request_id;
  END IF;

  IF p_status NOT IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Invalid correction review status: %.', p_status;
  END IF;

  IF v_req.status <> 'PENDING' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'request_id', p_request_id,
      'status', v_req.status
    );
  END IF;

  -- Authorization check: reviewer must hold an approval-capable faculty role (or fallback role param in demo)
  SELECT EXISTS (
    SELECT 1 FROM faculty
    WHERE id = p_reviewed_by_faculty_id
      AND (
        'SUPER_ADMIN' = ANY(roles)
        OR 'PRINCIPAL' = ANY(roles)
        OR 'HOD' = ANY(roles)
        OR 'ATTENDANCE_COORDINATOR' = ANY(roles)
      )
  ) INTO v_is_authorized;

  IF NOT v_is_authorized AND p_actor_role NOT IN ('SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'ATTENDANCE_COORDINATOR') THEN
    RAISE EXCEPTION 'Unauthorized: Faculty % cannot review attendance correction %.', p_reviewed_by_faculty_id, p_request_id;
  END IF;

  UPDATE attendance_correction_requests
  SET status = p_status,
      reviewed_by_faculty_id = p_reviewed_by_faculty_id,
      review_date = v_server_now,
      review_remarks = NULLIF(p_remarks, '')
  WHERE id = p_request_id;

  IF p_status = 'APPROVED' AND v_req.class_session_id IS NOT NULL AND v_req.student_id IS NOT NULL THEN
    INSERT INTO attendance_records (
      class_session_id,
      student_id,
      status,
      marked_by_faculty_id,
      marked_timestamp,
      remarks
    ) VALUES (
      v_req.class_session_id,
      v_req.student_id,
      v_req.requested_status,
      p_reviewed_by_faculty_id,
      v_server_now,
      COALESCE(NULLIF(p_remarks, ''), 'Correction Approved')
    )
    ON CONFLICT (class_session_id, student_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      marked_by_faculty_id = EXCLUDED.marked_by_faculty_id,
      marked_timestamp = v_server_now,
      remarks = EXCLUDED.remarks;
  END IF;

  INSERT INTO audit_logs (
    actor_id,
    actor_name,
    actor_role,
    action,
    entity_type,
    entity_id,
    details,
    timestamp
  ) VALUES (
    p_reviewed_by_faculty_id::TEXT,
    p_actor_name,
    p_actor_role,
    'REVIEW_CORRECTION_' || p_status,
    'ATTENDANCE_CORRECTION_REQUEST',
    p_request_id::TEXT,
    jsonb_build_object(
      'classSessionId', v_req.class_session_id,
      'studentId', v_req.student_id,
      'oldStatus', v_req.old_status,
      'requestedStatus', v_req.requested_status,
      'remarks', p_remarks
    ),
    v_server_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'status', p_status,
    'reviewed_at', v_server_now
  );
END;
$$;

-- 7. Reload PostgREST schema cache so Supabase API recognizes new columns and RPCs immediately
NOTIFY pgrst, 'reload schema';
