-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - DATABASE SECURITY AUDIT & REMEDIATION SUITE
-- Script 04: TABLE GRANTS REMEDIATION & LEAST-PRIVILEGE HARDENING
--
-- IMPORTANT USAGE INSTRUCTIONS:
-- 1. Copy ONLY the SQL code below into the Supabase SQL Editor.
--    Do NOT copy markdown text, labels, or brackets.
-- 2. Revokes dangerous blanket table grants (ALL PRIVILEGES) from anon.
-- 3. Enforces least-privilege principle: anon only gets SELECT on public catalogs.
-- 4. Revokes TRUNCATE privileges from both anon and authenticated users.
-- 5. Configures safe future default privileges in public schema.
-- ==============================================================================

-- 1. Revoke dangerous blanket privileges on schema public
REVOKE ALL ON SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Revoke blanket ALL privileges from anon across ALL public tables
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon;', tbl.tablename);
    EXECUTE format('REVOKE TRUNCATE ON TABLE public.%I FROM authenticated;', tbl.tablename);
  END LOOP;
END $$;

-- 3. Grant strictly read-only SELECT to anon ONLY on genuinely public reference tables
DO $$
DECLARE
  public_read_tables TEXT[] := ARRAY[
    'departments', 'programmes', 'academic_years', 'semesters',
    'course_categories', 'courses', 'course_offerings', 'course_groups',
    'timetable_periods', 'announcements', 'circulars', 'academic_events',
    'emergency_alerts'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY public_read_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon;', t);
      RAISE NOTICE 'Granted read-only access to anon for table: %', t;
    END IF;
  END LOOP;
END $$;

-- 4. Grant appropriate CRUD permissions to authenticated users
-- Note: Row-Level Security (RLS) policies strictly filter each row for authenticated users!
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    -- Allow authenticated role to interact with tables through RLS
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated;', tbl.tablename);
  END LOOP;
END $$;

-- 5. Revoke write permissions from authenticated on immutable audit logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM authenticated;
    GRANT SELECT, INSERT ON TABLE public.audit_logs TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faculty_subject_audit') THEN
    REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.faculty_subject_audit FROM authenticated;
    GRANT SELECT, INSERT ON TABLE public.faculty_subject_audit TO authenticated;
  END IF;
END $$;

-- 6. Grant USAGE on all current and future sequences in public schema
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 7. Configure safe DEFAULT PRIVILEGES for future tables created in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
