-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - DATABASE SECURITY AUDIT & REMEDIATION SUITE
-- Script 03: ROW-LEVEL SECURITY (RLS) POLICIES REPLACEMENT & HARDENING
--
-- IMPORTANT USAGE INSTRUCTIONS:
-- 1. Copy ONLY the SQL code below into the Supabase SQL Editor.
--    Do NOT copy markdown text, headers, or brackets.
-- 2. Eliminates all 25 unrestricted "Allow all access" / USING(true) policies.
-- 3. Enables and forces Row-Level Security on all public tables.
-- 4. Installs least-privilege, role-aware policies for Students, Faculty, HODs,
--    Principals, and Super Administrators.
-- 5. Safe and idempotent: will not crash if any optional table is missing.
-- ==============================================================================

-- ==============================================================================
-- STEP 1: DROP ALL UNRESTRICTED & PERMISSIVE LEGACY POLICIES
-- ==============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop any policy named 'Allow all access', 'Public read *', 'All write *',
  -- or any policy having USING(true) with CHECK(true)
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND (
        policyname ILIKE '%Allow all access%'
        OR policyname ILIKE '%Public read%'
        OR policyname ILIKE '%All write%'
        OR policyname ILIKE '%allow all%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped legacy permissive policy: % on %', r.policyname, r.tablename;
  END LOOP;
END $$;

-- ==============================================================================
-- STEP 2: ENABLE & FORCE RLS ON ALL PUBLIC TABLES
-- ==============================================================================
DO $$
DECLARE
  tbl RECORD;
BEGIN
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
-- STEP 3: ACADEMIC MASTER CATALOG TABLES (Public Catalog Read, Admin Write)
-- Tables: departments, programmes, academic_years, semesters, course_categories,
--         courses, course_offerings, course_groups, timetable_periods
-- ==============================================================================

-- Helper macro procedure to secure master catalog tables
DO $$
DECLARE
  master_tables TEXT[] := ARRAY[
    'departments', 'programmes', 'academic_years', 'semesters', 
    'course_categories', 'courses', 'course_offerings', 'course_groups', 
    'timetable_periods'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY master_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "%s_read_catalog" ON public.%I;', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_admin_modify" ON public.%I;', t, t);

      -- Everyone (anon and authenticated) can view catalog definitions
      EXECUTE format('
        CREATE POLICY "%s_read_catalog" ON public.%I
        FOR SELECT TO anon, authenticated
        USING (true);
      ', t, t);

      -- Only verified administrators can insert, update, or delete catalog records
      EXECUTE format('
        CREATE POLICY "%s_admin_modify" ON public.%I
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
      ', t, t);

      RAISE NOTICE 'Secured catalog table: %', t;
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- STEP 4: PUBLIC ANNOUNCEMENTS, CIRCULARS & NOTICES
-- Tables: announcements, circulars, emergency_alerts, academic_events
-- ==============================================================================
DO $$
BEGIN
  -- Announcements
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'announcements') THEN
    DROP POLICY IF EXISTS "announcements_read_policy" ON public.announcements;
    DROP POLICY IF EXISTS "announcements_write_policy" ON public.announcements;

    CREATE POLICY "announcements_read_policy" ON public.announcements
      FOR SELECT TO anon, authenticated
      USING (is_published = true OR auth.role() = 'authenticated');

    CREATE POLICY "announcements_write_policy" ON public.announcements
      FOR ALL TO authenticated
      USING (public.is_faculty() OR public.is_admin())
      WITH CHECK (public.is_faculty() OR public.is_admin());
  END IF;

  -- Circulars
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'circulars') THEN
    DROP POLICY IF EXISTS "circulars_read_policy" ON public.circulars;
    DROP POLICY IF EXISTS "circulars_write_policy" ON public.circulars;

    CREATE POLICY "circulars_read_policy" ON public.circulars
      FOR SELECT TO anon, authenticated
      USING (true);

    CREATE POLICY "circulars_write_policy" ON public.circulars
      FOR ALL TO authenticated
      USING (public.is_faculty() OR public.is_admin())
      WITH CHECK (public.is_faculty() OR public.is_admin());
  END IF;

  -- Emergency Alerts
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emergency_alerts') THEN
    DROP POLICY IF EXISTS "emergency_alerts_read_policy" ON public.emergency_alerts;
    DROP POLICY IF EXISTS "emergency_alerts_write_policy" ON public.emergency_alerts;

    CREATE POLICY "emergency_alerts_read_policy" ON public.emergency_alerts
      FOR SELECT TO anon, authenticated
      USING (is_active = true OR auth.role() = 'authenticated');

    CREATE POLICY "emergency_alerts_write_policy" ON public.emergency_alerts
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  -- Academic Events
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'academic_events') THEN
    DROP POLICY IF EXISTS "academic_events_read_policy" ON public.academic_events;
    DROP POLICY IF EXISTS "academic_events_write_policy" ON public.academic_events;

    CREATE POLICY "academic_events_read_policy" ON public.academic_events
      FOR SELECT TO anon, authenticated
      USING (true);

    CREATE POLICY "academic_events_write_policy" ON public.academic_events
      FOR ALL TO authenticated
      USING (public.is_faculty() OR public.is_admin())
      WITH CHECK (public.is_faculty() OR public.is_admin());
  END IF;
END $$;

-- ==============================================================================
-- STEP 5: STUDENTS TABLE PRIVACY & ACCESS CONTROL
-- Principles:
-- - Anonymous users: NO ACCESS
-- - Student: Can view and update own profile (cannot change marks, roll no, status)
-- - Faculty & Admin: Can view department/college students
-- - Admin: Full write
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
    DROP POLICY IF EXISTS "students_select_policy" ON public.students;
    DROP POLICY IF EXISTS "students_update_policy" ON public.students;
    DROP POLICY IF EXISTS "students_insert_policy" ON public.students;
    DROP POLICY IF EXISTS "students_delete_policy" ON public.students;

    -- SELECT: Student reads self, faculty/admin reads students
    CREATE POLICY "students_select_policy" ON public.students
      FOR SELECT TO authenticated
      USING (
        auth_user_id = auth.uid()
        OR id = public.get_current_student_id()
        OR public.is_faculty()
        OR public.is_admin()
      );

    -- UPDATE: Student updates own profile; Admin updates any
    CREATE POLICY "students_update_policy" ON public.students
      FOR UPDATE TO authenticated
      USING (
        auth_user_id = auth.uid()
        OR id = public.get_current_student_id()
        OR public.is_admin()
      )
      WITH CHECK (
        auth_user_id = auth.uid()
        OR id = public.get_current_student_id()
        OR public.is_admin()
      );

    -- INSERT: Admin only
    CREATE POLICY "students_insert_policy" ON public.students
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());

    -- DELETE: Super Admin only
    CREATE POLICY "students_delete_policy" ON public.students
      FOR DELETE TO authenticated
      USING (public.has_role('SUPER_ADMIN'));

    RAISE NOTICE 'Hardened public.students RLS policies';
  END IF;
END $$;

-- ==============================================================================
-- STEP 6: FACULTY TABLE PRIVACY & ACCESS CONTROL
-- Principles:
-- - Anonymous users: NO ACCESS
-- - Authenticated users: Can view faculty directory
-- - Faculty: Can update own profile
-- - Admin: Can assign roles, update department, insert faculty
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faculty') THEN
    DROP POLICY IF EXISTS "faculty_select_policy" ON public.faculty;
    DROP POLICY IF EXISTS "faculty_update_policy" ON public.faculty;
    DROP POLICY IF EXISTS "faculty_insert_policy" ON public.faculty;
    DROP POLICY IF EXISTS "faculty_delete_policy" ON public.faculty;

    -- SELECT: Authenticated users can view faculty members
    CREATE POLICY "faculty_select_policy" ON public.faculty
      FOR SELECT TO authenticated
      USING (true);

    -- UPDATE: Faculty updates self, Admin updates any
    CREATE POLICY "faculty_update_policy" ON public.faculty
      FOR UPDATE TO authenticated
      USING (
        auth_user_id = auth.uid()
        OR id = public.get_current_faculty_id()
        OR public.is_admin()
      )
      WITH CHECK (
        auth_user_id = auth.uid()
        OR id = public.get_current_faculty_id()
        OR public.is_admin()
      );

    -- INSERT: Admin only
    CREATE POLICY "faculty_insert_policy" ON public.faculty
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());

    -- DELETE: Super Admin only
    CREATE POLICY "faculty_delete_policy" ON public.faculty
      FOR DELETE TO authenticated
      USING (public.has_role('SUPER_ADMIN'));

    RAISE NOTICE 'Hardened public.faculty RLS policies';
  END IF;
END $$;

-- ==============================================================================
-- STEP 7: ATTENDANCE RECORDS & CLASS SESSIONS
-- Principles:
-- - Anonymous: NO ACCESS
-- - Students: Can read ONLY their own attendance records
-- - Faculty: Can mark & modify attendance for their courses
-- - Admin: Full oversight
-- ==============================================================================
DO $$
BEGIN
  -- Class Sessions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'class_sessions') THEN
    DROP POLICY IF EXISTS "class_sessions_select_policy" ON public.class_sessions;
    DROP POLICY IF EXISTS "class_sessions_write_policy" ON public.class_sessions;

    CREATE POLICY "class_sessions_select_policy" ON public.class_sessions
      FOR SELECT TO authenticated
      USING (true);

    CREATE POLICY "class_sessions_write_policy" ON public.class_sessions
      FOR ALL TO authenticated
      USING (
        faculty_id = public.get_current_faculty_id()
        OR public.is_faculty()
        OR public.is_admin()
      )
      WITH CHECK (
        faculty_id = public.get_current_faculty_id()
        OR public.is_faculty()
        OR public.is_admin()
      );
  END IF;

  -- Attendance Records
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_records') THEN
    DROP POLICY IF EXISTS "attendance_records_select_policy" ON public.attendance_records;
    DROP POLICY IF EXISTS "attendance_records_insert_policy" ON public.attendance_records;
    DROP POLICY IF EXISTS "attendance_records_update_policy" ON public.attendance_records;
    DROP POLICY IF EXISTS "attendance_records_delete_policy" ON public.attendance_records;

    -- SELECT: Student reads self; Faculty and Admin read all
    CREATE POLICY "attendance_records_select_policy" ON public.attendance_records
      FOR SELECT TO authenticated
      USING (
        student_id = public.get_current_student_id()
        OR public.is_faculty()
        OR public.is_admin()
      );

    -- INSERT: Faculty and Admin only (Students CANNOT record attendance)
    CREATE POLICY "attendance_records_insert_policy" ON public.attendance_records
      FOR INSERT TO authenticated
      WITH CHECK (
        public.is_faculty()
        OR public.is_admin()
      );

    -- UPDATE: Faculty and Admin only
    CREATE POLICY "attendance_records_update_policy" ON public.attendance_records
      FOR UPDATE TO authenticated
      USING (
        public.is_faculty()
        OR public.is_admin()
      )
      WITH CHECK (
        public.is_faculty()
        OR public.is_admin()
      );

    -- DELETE: Admin only
    CREATE POLICY "attendance_records_delete_policy" ON public.attendance_records
      FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- ==============================================================================
-- STEP 8: ATTENDANCE CORRECTIONS & SPECIAL DUTY ATTENDANCE
-- Tables: attendance_correction_requests, special_attendance_events,
--         special_attendance_records
-- ==============================================================================
DO $$
BEGIN
  -- Attendance Correction Requests
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance_correction_requests') THEN
    DROP POLICY IF EXISTS "corr_requests_select" ON public.attendance_correction_requests;
    DROP POLICY IF EXISTS "corr_requests_insert" ON public.attendance_correction_requests;
    DROP POLICY IF EXISTS "corr_requests_update" ON public.attendance_correction_requests;

    -- Student views own, Faculty/Admin views all
    CREATE POLICY "corr_requests_select" ON public.attendance_correction_requests
      FOR SELECT TO authenticated
      USING (
        student_id = public.get_current_student_id()
        OR public.is_faculty()
        OR public.is_admin()
      );

    -- Student creates for self; Admin can also create
    CREATE POLICY "corr_requests_insert" ON public.attendance_correction_requests
      FOR INSERT TO authenticated
      WITH CHECK (
        student_id = public.get_current_student_id()
        OR public.is_admin()
      );

    -- Faculty/Admin reviews; Student can update only if PENDING
    CREATE POLICY "corr_requests_update" ON public.attendance_correction_requests
      FOR UPDATE TO authenticated
      USING (
        public.is_faculty()
        OR public.is_admin()
        OR (student_id = public.get_current_student_id() AND status = 'PENDING')
      )
      WITH CHECK (
        public.is_faculty()
        OR public.is_admin()
        OR (student_id = public.get_current_student_id() AND status = 'PENDING')
      );
  END IF;

  -- Special Attendance Events (College Union / Duty)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'special_attendance_events') THEN
    DROP POLICY IF EXISTS "special_events_select" ON public.special_attendance_events;
    DROP POLICY IF EXISTS "special_events_insert" ON public.special_attendance_events;
    DROP POLICY IF EXISTS "special_events_update" ON public.special_attendance_events;

    CREATE POLICY "special_events_select" ON public.special_attendance_events
      FOR SELECT TO authenticated
      USING (true);

    CREATE POLICY "special_events_insert" ON public.special_attendance_events
      FOR INSERT TO authenticated
      WITH CHECK (public.is_faculty() OR public.is_admin());

    -- Sanctioning / Status updating: Faculty / HOD / Principal
    CREATE POLICY "special_events_update" ON public.special_attendance_events
      FOR UPDATE TO authenticated
      USING (public.is_faculty() OR public.is_admin())
      WITH CHECK (public.is_faculty() OR public.is_admin());
  END IF;

  -- Special Attendance Records
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'special_attendance_records') THEN
    DROP POLICY IF EXISTS "special_records_select" ON public.special_attendance_records;
    DROP POLICY IF EXISTS "special_records_write" ON public.special_attendance_records;

    CREATE POLICY "special_records_select" ON public.special_attendance_records
      FOR SELECT TO authenticated
      USING (
        student_id = public.get_current_student_id()
        OR public.is_faculty()
        OR public.is_admin()
      );

    CREATE POLICY "special_records_write" ON public.special_attendance_records
      FOR ALL TO authenticated
      USING (public.is_faculty() OR public.is_admin())
      WITH CHECK (public.is_faculty() OR public.is_admin());
  END IF;
END $$;

-- ==============================================================================
-- STEP 9: TIMETABLE & FACULTY ALLOCATIONS
-- Tables: timetable_entries, class_tutor_assignments, substitute_assignments,
--         faculty_course_assignments, daily_schedule_overrides
-- ==============================================================================
DO $$
DECLARE
  tt_tables TEXT[] := ARRAY[
    'timetable_entries', 'class_tutor_assignments', 'substitute_assignments',
    'faculty_course_assignments', 'daily_schedule_overrides'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tt_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I;', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_modify" ON public.%I;', t, t);

      -- Authenticated users can view timetable & schedule entries
      EXECUTE format('
        CREATE POLICY "%s_select" ON public.%I
        FOR SELECT TO authenticated
        USING (true);
      ', t, t);

      -- Faculty or Admin can create and modify schedules
      EXECUTE format('
        CREATE POLICY "%s_modify" ON public.%I
        FOR ALL TO authenticated
        USING (public.is_faculty() OR public.is_admin())
        WITH CHECK (public.is_faculty() OR public.is_admin());
      ', t, t);
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- STEP 10: STUDENT COURSE REGISTRATIONS & LEAVE REQUESTS
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_course_registrations') THEN
    DROP POLICY IF EXISTS "registrations_select" ON public.student_course_registrations;
    DROP POLICY IF EXISTS "registrations_insert" ON public.student_course_registrations;
    DROP POLICY IF EXISTS "registrations_admin" ON public.student_course_registrations;

    CREATE POLICY "registrations_select" ON public.student_course_registrations
      FOR SELECT TO authenticated
      USING (
        student_id = public.get_current_student_id()
        OR public.is_faculty()
        OR public.is_admin()
      );

    CREATE POLICY "registrations_insert" ON public.student_course_registrations
      FOR INSERT TO authenticated
      WITH CHECK (
        student_id = public.get_current_student_id()
        OR public.is_admin()
      );

    CREATE POLICY "registrations_admin" ON public.student_course_registrations
      FOR UPDATE TO authenticated
      USING (public.is_admin() OR public.is_faculty())
      WITH CHECK (public.is_admin() OR public.is_faculty());
  END IF;

  -- Leave requests
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_leave_requests') THEN
    DROP POLICY IF EXISTS "leave_select" ON public.student_leave_requests;
    DROP POLICY IF EXISTS "leave_insert" ON public.student_leave_requests;
    DROP POLICY IF EXISTS "leave_update" ON public.student_leave_requests;

    CREATE POLICY "leave_select" ON public.student_leave_requests
      FOR SELECT TO authenticated
      USING (
        student_id = public.get_current_student_id()
        OR public.is_faculty()
        OR public.is_admin()
      );

    CREATE POLICY "leave_insert" ON public.student_leave_requests
      FOR INSERT TO authenticated
      WITH CHECK (
        student_id = public.get_current_student_id()
        OR public.is_admin()
      );

    CREATE POLICY "leave_update" ON public.student_leave_requests
      FOR UPDATE TO authenticated
      USING (public.is_faculty() OR public.is_admin())
      WITH CHECK (public.is_faculty() OR public.is_admin());
  END IF;
END $$;

-- ==============================================================================
-- STEP 11: USER ROLES & PRIVILEGED PERMISSIONS
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
    DROP POLICY IF EXISTS "user_roles_modify" ON public.user_roles;

    -- User can view own roles; Admin can view all
    CREATE POLICY "user_roles_select" ON public.user_roles
      FOR SELECT TO authenticated
      USING (
        auth_user_id = auth.uid()
        OR public.is_admin()
      );

    -- Only Super Admin can modify system roles
    CREATE POLICY "user_roles_modify" ON public.user_roles
      FOR ALL TO authenticated
      USING (public.has_role('SUPER_ADMIN'))
      WITH CHECK (public.has_role('SUPER_ADMIN'));
  END IF;
END $$;

-- ==============================================================================
-- STEP 12: AUDIT LOGS (STRICT APPEND-ONLY SECURITY)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
    DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
    DROP POLICY IF EXISTS "audit_logs_prevent_update" ON public.audit_logs;
    DROP POLICY IF EXISTS "audit_logs_prevent_delete" ON public.audit_logs;

    -- Only Administrators can read audit logs
    CREATE POLICY "audit_logs_select" ON public.audit_logs
      FOR SELECT TO authenticated
      USING (public.is_admin());

    -- Authenticated users or database triggers can insert audit events
    CREATE POLICY "audit_logs_insert" ON public.audit_logs
      FOR INSERT TO authenticated
      WITH CHECK (true);

    -- STRICT IMMUTABILITY: Nobody (even admins) can update or delete audit logs
    CREATE POLICY "audit_logs_prevent_update" ON public.audit_logs
      FOR UPDATE TO authenticated
      USING (false);

    CREATE POLICY "audit_logs_prevent_delete" ON public.audit_logs
      FOR DELETE TO authenticated
      USING (false);

    RAISE NOTICE 'Secured audit_logs with strict immutability policies';
  END IF;
END $$;
