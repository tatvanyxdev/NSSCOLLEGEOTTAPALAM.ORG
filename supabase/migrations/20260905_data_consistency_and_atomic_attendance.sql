-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - ERP DATA CONSISTENCY & ATOMIC TRANSACTIONS MIGRATION
-- Migration: 20260905_data_consistency_and_atomic_attendance.sql
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. HARDENED DATABASE CONSTRAINTS & UNIQUE INDICES
-- Prevent duplicate course registrations for the same student in the same offering
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_course_offering 
  ON student_course_registrations(student_id, course_offering_id);

-- Prevent duplicate course registrations for the same student in the same course group
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_course_group 
  ON student_course_registrations(student_id, course_group_id);

-- Prevent duplicate attendance records for a student in a class session
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_session_student 
  ON attendance_records(class_session_id, student_id);

-- Ensure uniqueness of student university register numbers (case-insensitive where non-null)
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_reg_no_upper 
  ON students(UPPER(university_register_number)) 
  WHERE university_register_number IS NOT NULL;

-- Ensure uniqueness of student admission numbers (case-insensitive where non-null)
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_admission_no_upper 
  ON students(UPPER(admission_number)) 
  WHERE admission_number IS NOT NULL;

-- Ensure uniqueness of faculty employee code
CREATE UNIQUE INDEX IF NOT EXISTS uq_faculty_employee_code 
  ON faculty(employee_code) 
  WHERE employee_code IS NOT NULL;

-- Ensure semester enrollment uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS uq_semester_enrollment 
  ON semester_enrollments(student_id, academic_year, semester_number);

-- 2. ATOMIC ATTENDANCE SUBMISSION RPC FUNCTION
-- Atomically writes attendance records, updates class session status, and logs audit record
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
  v_od_count INT := 0;
  v_medical_count INT := 0;
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
     
     -- Check if caller holds SUPER_ADMIN or PRINCIPAL role
     IF NOT EXISTS (
       SELECT 1 FROM faculty 
       WHERE id = p_marked_by_faculty_id 
         AND ('SUPER_ADMIN' = ANY(roles) OR 'PRINCIPAL' = ANY(roles) OR 'HOD' = ANY(roles))
     ) THEN
       RAISE EXCEPTION 'Unauthorized: Faculty % is not authorized to submit attendance for session %.', p_marked_by_faculty_id, p_session_id;
     END IF;
  END IF;

  -- 3. Upsert attendance records atomically
  FOR v_rec IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    v_student_id := (v_rec->>'student_id')::UUID;
    v_status := COALESCE(v_rec->>'status', 'PRESENT');
    v_remarks := NULLIF(v_rec->>'remarks', '');

    -- Upsert record
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
    ELSIF v_status = 'OD' THEN
      v_od_count := v_od_count + 1;
    ELSIF v_status = 'MEDICAL_LEAVE' THEN
      v_medical_count := v_medical_count + 1;
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
      'odCount', v_od_count,
      'medicalCount', v_medical_count,
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
    'od_count', v_od_count,
    'submitted_at', v_server_now
  );
END;
$$;

-- 3. ATOMIC ATTENDANCE CORRECTION REVIEW RPC FUNCTION
CREATE OR REPLACE FUNCTION review_attendance_correction_atomic(
  p_request_id UUID,
  p_status VARCHAR(50),
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
BEGIN
  -- 1. Lock correction request
  SELECT * INTO v_req
  FROM attendance_correction_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Correction request with ID % not found.', p_request_id;
  END IF;

  IF v_req.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Correction request has already been processed with status: %.', v_req.status;
  END IF;

  -- 2. Update request status
  UPDATE attendance_correction_requests
  SET status = p_status,
      reviewed_by_faculty_id = p_reviewed_by_faculty_id,
      review_date = v_server_now,
      review_remarks = p_remarks
  WHERE id = p_request_id;

  -- 3. If approved, apply the status to the actual attendance record
  IF p_status = 'APPROVED' THEN
    UPDATE attendance_records
    SET status = v_req.requested_status,
        remarks = COALESCE(remarks || ' | ', '') || 'Corrected via HOD Approval: ' || COALESCE(p_remarks, 'Approved'),
        marked_timestamp = v_server_now
    WHERE class_session_id = v_req.class_session_id
      AND student_id = v_req.student_id;
  END IF;

  -- 4. Authoritative audit log
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
    'REVIEW_CORRECTION_ATOMIC',
    'CORRECTION_REQUEST',
    p_request_id::TEXT,
    jsonb_build_object(
      'status', p_status,
      'remarks', p_remarks,
      'sessionId', v_req.class_session_id,
      'studentId', v_req.student_id,
      'requestedStatus', v_req.requestedStatus
    ),
    v_server_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'new_status', p_status,
    'processed_at', v_server_now
  );
END;
$$;
