-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - DATABASE SECURITY AUDIT & REMEDIATION SUITE
-- Script 01: SCHEMA AND ACCESS REPORT (100% READ-ONLY)
--
-- IMPORTANT USAGE INSTRUCTIONS:
-- 1. Copy ONLY the SQL code below into the Supabase SQL Editor.
--    Do NOT copy markdown text, labels, or brackets.
-- 2. This script is 100% READ-ONLY. It inspects schema structure, sensitive
--    credentials, foreign keys, triggers, and functions without altering anything.
-- ==============================================================================

-- 1. Audit Columns with Plaintext Password or Sensitive Credentials
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name ILIKE '%pass%' THEN 'CRITICAL: PASSWORD FIELD EXPOSURE'
    WHEN column_name ILIKE '%token%' OR column_name ILIKE '%secret%' THEN 'HIGH: CREDENTIAL EXPOSURE'
    WHEN column_name ILIKE '%phone%' OR column_name ILIKE '%mobile%' THEN 'MEDIUM: PII (PHONE)'
    WHEN column_name ILIKE '%email%' THEN 'LOW: PII (EMAIL)'
    ELSE 'STANDARD'
  END AS sensitivity_classification
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name ILIKE '%pass%' 
    OR column_name ILIKE '%token%' 
    OR column_name ILIKE '%secret%' 
    OR column_name ILIKE '%phone%' 
    OR column_name ILIKE '%mobile%'
  )
ORDER BY sensitivity_classification DESC, table_name, column_name;

-- 2. Audit Foreign Key Constraints and Relationships Across Core Academic Tables
SELECT 
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 3. Audit Stored Database Functions, Language, and Security Flags
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  l.lanname AS language,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER (Privileged)' ELSE 'SECURITY INVOKER (Caller)' END AS execution_security,
  CASE 
    WHEN p.proconfig IS NULL THEN 'WARNING: search_path not explicitly pinned'
    ELSE array_to_string(p.proconfig, ', ')
  END AS search_path_configuration
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
ORDER BY p.prosecdef DESC, p.proname;

-- 4. Audit Active Triggers on Public Tables
SELECT 
  event_object_table AS target_table,
  trigger_name,
  event_manipulation AS event_type,
  action_timing AS timing,
  action_statement AS executed_action
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. Audit Identity Columns & UUID Primary Keys
SELECT 
  t.table_name,
  c.column_name AS pk_column,
  c.data_type,
  c.column_default
FROM information_schema.table_constraints t
JOIN information_schema.key_column_usage k
  ON t.constraint_name = k.constraint_name
  AND t.table_schema = k.table_schema
JOIN information_schema.columns c
  ON c.table_name = k.table_name
  AND c.column_name = k.column_name
  AND c.table_schema = k.table_schema
WHERE t.constraint_type = 'PRIMARY KEY'
  AND t.table_schema = 'public'
ORDER BY t.table_name;
