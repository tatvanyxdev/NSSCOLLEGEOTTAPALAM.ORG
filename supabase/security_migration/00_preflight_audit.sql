-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - DATABASE SECURITY AUDIT & REMEDIATION SUITE
-- Script 00: PREFLIGHT AUDIT (100% READ-ONLY DIAGNOSTIC)
--
-- IMPORTANT USAGE INSTRUCTIONS:
-- 1. Copy ONLY the SQL code below into the Supabase SQL Editor.
--    Do NOT copy markdown text, labels, or brackets like "[Phase 1]".
-- 2. This script is 100% READ-ONLY. It does NOT modify or drop any tables or data.
-- 3. It will safely execute even if some tables or columns do not exist yet.
-- ==============================================================================

-- 1. PostgreSQL Server and Environment Diagnostics
SELECT 
  version() AS postgres_version,
  current_database() AS database_name,
  current_user AS executing_role,
  current_setting('search_path') AS active_search_path;

-- 2. Audit Installed Security Extensions (uuid-ossp, pgcrypto, etc.)
SELECT 
  extname AS extension_name, 
  extversion AS extension_version,
  extnamespace::regnamespace AS extension_schema
FROM pg_extension 
ORDER BY extname;

-- 3. Row-Level Security (RLS) Status Across All Public Tables
SELECT 
  c.relname AS table_name,
  CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED (VULNERABLE)' END AS rls_status,
  CASE WHEN c.relforcerowsecurity THEN 'FORCED' ELSE 'NOT FORCED' END AS force_rls,
  COUNT(p.polname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY c.relname;

-- 4. Audit Active Policies and Identify Dangerous "Allow all access" / USING(true) Policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_clause,
  with_check AS check_clause,
  CASE 
    WHEN (qual = 'true' OR qual IS NULL) AND (with_check = 'true' OR with_check IS NULL) AND (roles = '{public}' OR roles = '{anon,authenticated}')
      THEN 'CRITICAL: UNRESTRICTED PUBLIC ACCESS'
    WHEN qual = 'true' OR qual IS NULL 
      THEN 'HIGH: UNRESTRICTED READ'
    WHEN with_check = 'true' OR with_check IS NULL 
      THEN 'HIGH: UNRESTRICTED WRITE'
    ELSE 'ROLE-RESTRICTED'
  END AS security_severity
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY 
  CASE 
    WHEN (qual = 'true' OR qual IS NULL) AND (with_check = 'true' OR with_check IS NULL) THEN 1
    WHEN qual = 'true' OR with_check = 'true' THEN 2
    ELSE 3
  END, 
  tablename, 
  policyname;

-- 5. Audit Table-Level Grants Assigned to 'anon' and 'authenticated' Roles
SELECT 
  table_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- 6. Dynamic Row Counts for All Existing Public Tables (Safe against missing tables)
DO $$
DECLARE
  r RECORD;
  row_cnt BIGINT;
BEGIN
  RAISE NOTICE '--- ROW COUNTS FOR PUBLIC TABLES ---';
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', r.table_name) INTO row_cnt;
    RAISE NOTICE 'Table: % | Row Count: %', r.table_name, row_cnt;
  END LOOP;
END $$;

-- 7. Audit Identity Linking Status (Students & Faculty linked to Supabase Auth)
DO $$
DECLARE
  has_students BOOLEAN;
  has_faculty BOOLEAN;
  has_stud_auth BOOLEAN;
  has_fac_auth BOOLEAN;
  total_stud BIGINT := 0;
  linked_stud BIGINT := 0;
  total_fac BIGINT := 0;
  linked_fac BIGINT := 0;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') INTO has_students;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faculty') INTO has_faculty;
  
  IF has_students THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'auth_user_id') INTO has_stud_auth;
    IF has_stud_auth THEN
      EXECUTE 'SELECT count(*), count(auth_user_id) FROM public.students' INTO total_stud, linked_stud;
      RAISE NOTICE 'STUDENTS LINKING STATUS: Total = %, Linked to Auth = %, Unlinked = %', total_stud, linked_stud, (total_stud - linked_stud);
    ELSE
      EXECUTE 'SELECT count(*) FROM public.students' INTO total_stud;
      RAISE NOTICE 'STUDENTS LINKING STATUS: auth_user_id column is missing! Total unlinked = %', total_stud;
    END IF;
  END IF;

  IF has_faculty THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'faculty' AND column_name = 'auth_user_id') INTO has_fac_auth;
    IF has_fac_auth THEN
      EXECUTE 'SELECT count(*), count(auth_user_id) FROM public.faculty' INTO total_fac, linked_fac;
      RAISE NOTICE 'FACULTY LINKING STATUS: Total = %, Linked to Auth = %, Unlinked = %', total_fac, linked_fac, (total_fac - linked_fac);
    ELSE
      EXECUTE 'SELECT count(*) FROM public.faculty' INTO total_fac;
      RAISE NOTICE 'FACULTY LINKING STATUS: auth_user_id column is missing! Total unlinked = %', total_fac;
    END IF;
  END IF;
END $$;

-- 8. Summary Table of Core Public Tables and Column Counts
SELECT 
  t.table_name,
  COUNT(c.column_name) AS column_count,
  c_rls.relrowsecurity AS rls_enabled
FROM information_schema.tables t
JOIN pg_class c_rls ON c_rls.relname = t.table_name
JOIN pg_namespace n ON n.oid = c_rls.relnamespace AND n.nspname = 'public'
JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = 'public'
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name, c_rls.relrowsecurity
ORDER BY t.table_name;
