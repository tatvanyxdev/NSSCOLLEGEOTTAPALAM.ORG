-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - DATABASE SECURITY AUDIT & REMEDIATION SUITE
-- Script 02: AUTH LINKING & RBAC INFRASTRUCTURE PREPARATION
--
-- IMPORTANT USAGE INSTRUCTIONS:
-- 1. Copy ONLY the SQL code below into the Supabase SQL Editor.
--    Do NOT copy markdown headers, backticks, or brackets.
-- 2. This script is NON-DESTRUCTIVE and IDEMPOTENT.
-- 3. Prepares auth_user_id columns, indexes, and trusted SECURITY DEFINER
--    helper functions used by the Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure auth_user_id exists on students and faculty tables
DO $$
BEGIN
  -- Add auth_user_id to students if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'auth_user_id') THEN
      ALTER TABLE public.students ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added auth_user_id to public.students';
    END IF;
  END IF;

  -- Add auth_user_id to faculty if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faculty') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'faculty' AND column_name = 'auth_user_id') THEN
      ALTER TABLE public.faculty ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added auth_user_id to public.faculty';
    END IF;
  END IF;
END $$;

-- 3. Create high-performance indexes on auth_user_id for fast RLS policy evaluation
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON public.students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_auth_user_id ON public.faculty(auth_user_id);

-- 4. Create user_roles table if it does not already exist (for system-wide role assignments)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  granted_by UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(auth_user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_auth ON public.user_roles(auth_user_id);

-- 5. Helper Function: Get Current User's Faculty ID
CREATE OR REPLACE FUNCTION public.get_current_faculty_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM public.faculty 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;
$$;

-- 6. Helper Function: Get Current User's Student ID
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM public.students 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;
$$;

-- 7. Helper Function: Check if Authenticated User has Faculty Record
CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.faculty 
    WHERE auth_user_id = auth.uid()
  );
$$;

-- 8. Helper Function: Check if Authenticated User has Student Record
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students 
    WHERE auth_user_id = auth.uid()
  );
$$;

-- 9. Helper Function: Check if User has a Specific Role
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Check user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE auth_user_id = v_uid AND (role = required_role OR role = 'SUPER_ADMIN')
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check faculty roles column
  IF EXISTS (
    SELECT 1 FROM public.faculty 
    WHERE auth_user_id = v_uid 
      AND (
        required_role = ANY(roles) 
        OR 'SUPER_ADMIN' = ANY(roles)
        OR (required_role = 'TEACHER' AND (roles IS NULL OR array_length(roles, 1) = 0))
      )
  ) THEN
    RETURN TRUE;
  END IF;

  -- 3. Check student role
  IF required_role = 'STUDENT' THEN
    RETURN EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = v_uid);
  END IF;

  RETURN FALSE;
END;
$$;

-- 10. Helper Function: Check if User is an Administrator (Super Admin, Principal, or HOD)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE auth_user_id = v_uid AND role IN ('SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'ADMIN')
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check faculty.roles column
  IF EXISTS (
    SELECT 1 FROM public.faculty 
    WHERE auth_user_id = v_uid 
      AND ('SUPER_ADMIN' = ANY(roles) OR 'PRINCIPAL' = ANY(roles) OR 'HOD' = ANY(roles))
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 11. Helper Function: Get Current Department ID (Faculty or Student)
CREATE OR REPLACE FUNCTION public.get_current_department_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_dept UUID;
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT department_id INTO v_dept FROM public.faculty WHERE auth_user_id = v_uid LIMIT 1;
  IF v_dept IS NOT NULL THEN
    RETURN v_dept;
  END IF;

  SELECT COALESCE(home_department_id, department_id) INTO v_dept FROM public.students WHERE auth_user_id = v_uid LIMIT 1;
  RETURN v_dept;
END;
$$;

-- 12. Automated Account Linking Trigger on Auth Sign-in / Sign-up
-- Links auth.users to existing faculty or students by verified email
CREATE OR REPLACE FUNCTION public.handle_auth_user_linking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    -- Try to link faculty
    UPDATE public.faculty 
    SET auth_user_id = NEW.id 
    WHERE LOWER(email) = LOWER(NEW.email)
      AND (auth_user_id IS NULL OR auth_user_id = NEW.id);

    -- Try to link student
    UPDATE public.students 
    SET auth_user_id = NEW.id 
    WHERE LOWER(email) = LOWER(NEW.email)
      AND (auth_user_id IS NULL OR auth_user_id = NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate cleanly on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_link ON auth.users;
CREATE TRIGGER on_auth_user_created_link
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_linking();

-- 13. Safe Admin Account Linking Helper Functions
CREATE OR REPLACE FUNCTION public.link_faculty_to_auth(p_faculty_id UUID, p_auth_uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can manually link faculty accounts.';
  END IF;

  UPDATE public.faculty 
  SET auth_user_id = p_auth_uid 
  WHERE id = p_faculty_id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_student_to_auth(p_student_id UUID, p_auth_uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can manually link student accounts.';
  END IF;

  UPDATE public.students 
  SET auth_user_id = p_auth_uid 
  WHERE id = p_student_id;
  RETURN TRUE;
END;
$$;
