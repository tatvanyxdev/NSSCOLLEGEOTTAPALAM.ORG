-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - DATABASE SECURITY AUDIT & REMEDIATION SUITE
-- Script 05: POST-MIGRATION VERIFICATION & SECURITY HEALTH CHECK
--
-- IMPORTANT USAGE INSTRUCTIONS:
-- 1. Copy ONLY the SQL code below into the Supabase SQL Editor.
--    Do NOT copy markdown text, labels, or brackets.
-- 2. 100% READ-ONLY verification test.
-- 3. Returns PASS / FAIL results verifying that RLS is active, blanket policies
--    are eliminated, and anonymous access to sensitive tables is blocked.
-- ==============================================================================

-- 1. CHECK 1: Ensure All Tables Have Row-Level Security Enabled and Forced
SELECT 
  c.relname AS table_name,
  CASE 
    WHEN c.relrowsecurity AND c.relforcerowsecurity THEN 'PASS: RLS Enabled & Forced'
    WHEN c.relrowsecurity THEN 'WARN: RLS Enabled (Not Forced)'
    ELSE 'FAIL: RLS DISABLED'
  END AS rls_verification_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 2. CHECK 2: Verify Elimination of Dangerous Blanket "Allow all access" Policies
SELECT 
  tablename,
  policyname,
  qual,
  with_check,
  CASE 
    WHEN (qual = 'true' OR qual IS NULL) AND (with_check = 'true' OR with_check IS NULL) 
      AND tablename IN ('students', 'faculty', 'attendance_records', 'special_attendance_records', 'audit_logs', 'attendance_correction_requests')
      THEN 'FAIL: UNRESTRICTED SENSITIVE ACCESS DETECTED'
    ELSE 'PASS: SECURED'
  END AS check_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. CHECK 3: Verify Anonymous Role Has ZERO Write Permissions on Public Tables
SELECT 
  table_name,
  privilege_type,
  CASE 
    WHEN privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') THEN 'FAIL: ANON HAS WRITE PERMISSION'
    ELSE 'PASS: READ-ONLY'
  END AS anon_permission_status
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'anon'
ORDER BY 
  CASE WHEN privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE') THEN 1 ELSE 2 END,
  table_name;

-- 4. CHECK 4: Verify Security Definer Helper Functions Exist with Pinned Search Path
SELECT 
  proname AS helper_function,
  CASE WHEN prosecdef THEN 'PASS: SECURITY DEFINER' ELSE 'FAIL: SECURITY INVOKER' END AS security_mode,
  CASE 
    WHEN proconfig IS NOT NULL AND array_to_string(proconfig, ',') ILIKE '%search_path%' THEN 'PASS: search_path pinned'
    ELSE 'FAIL: search_path NOT pinned'
  END AS search_path_check
FROM pg_proc
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public'
  AND proname IN (
    'is_admin', 
    'is_faculty', 
    'is_student', 
    'has_role', 
    'get_current_faculty_id', 
    'get_current_student_id',
    'get_current_department_id'
  );

-- 5. FINAL VERIFICATION SUMMARY SCORECARD
SELECT 
  'Tables With RLS Enabled' AS security_metric,
  COUNT(*) FILTER (WHERE c.relrowsecurity)::text || ' / ' || COUNT(*)::text AS metric_value,
  CASE WHEN COUNT(*) FILTER (WHERE NOT c.relrowsecurity) = 0 THEN 'PASS' ELSE 'FAIL' END AS overall_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'

UNION ALL

SELECT 
  'Unrestricted Blanket Policies on Sensitive Tables',
  COUNT(*)::text,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('students', 'faculty', 'attendance_records', 'special_attendance_records', 'audit_logs')
  AND qual = 'true' AND with_check = 'true'

UNION ALL

SELECT 
  'Anon Write Grants (Insert/Update/Delete)',
  COUNT(*)::text,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee = 'anon'
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');
