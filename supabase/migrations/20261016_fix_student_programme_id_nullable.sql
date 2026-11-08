-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - FIX STUDENT PROGRAMME_ID & SCHEMA CONSTRAINTS
-- Purpose:
--   1. Fixes the error:
--      "null value in column 'programme_id' of relation 'students' violates not-null constraint"
--   2. Makes programme_id, home_department_id, and department_id nullable on students table.
--   3. Sets foreign key constraint to ON DELETE SET NULL to avoid cascading failures.
--   4. Inserts standard academic departments & degree programmes so foreign keys match.
--   5. Notifies PostgREST to immediately refresh its schema cache.
-- ==============================================================================

-- 1. DROP NOT-NULL CONSTRAINTS ON STUDENTS TABLE
DO $$ BEGIN
  -- Make programme_id nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'programme_id'
  ) THEN
    ALTER TABLE students ALTER COLUMN programme_id DROP NOT NULL;
  END IF;

  -- Make home_department_id nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'home_department_id'
  ) THEN
    ALTER TABLE students ALTER COLUMN home_department_id DROP NOT NULL;
  END IF;

  -- Make legacy department_id nullable if present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE students ALTER COLUMN department_id DROP NOT NULL;
  END IF;

  -- Make non-mandatory student fields nullable for fast onboarding
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'admission_academic_year'
  ) THEN
    ALTER TABLE students ALTER COLUMN admission_academic_year DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'admission_batch'
  ) THEN
    ALTER TABLE students ALTER COLUMN admission_batch DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'mobile_number'
  ) THEN
    ALTER TABLE students ALTER COLUMN mobile_number DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'email'
  ) THEN
    ALTER TABLE students ALTER COLUMN email DROP NOT NULL;
  END IF;
END $$;

-- 2. UPDATE FOREIGN KEY CONSTRAINTS TO 'ON DELETE SET NULL'
DO $$ BEGIN
  -- Fix students_programme_id_fkey
  ALTER TABLE students DROP CONSTRAINT IF EXISTS students_programme_id_fkey;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programmes') THEN
    ALTER TABLE students ADD CONSTRAINT students_programme_id_fkey 
      FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE SET NULL;
  END IF;

  -- Fix students_home_department_id_fkey
  ALTER TABLE students DROP CONSTRAINT IF EXISTS students_home_department_id_fkey;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
    ALTER TABLE students ADD CONSTRAINT students_home_department_id_fkey 
      FOREIGN KEY (home_department_id) REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update skipped or already applied: %', SQLERRM;
END $$;

-- 3. ENSURE BASE DEPARTMENTS EXIST IN SUPABASE
INSERT INTO departments (id, code, name, type, is_active)
VALUES 
  ('00000000-0000-0000-0001-000000000001', 'CS', 'Department of Computer Science', 'ACADEMIC', true),
  ('00000000-0000-0000-0001-000000000002', 'ENG', 'Department of English', 'ACADEMIC', true),
  ('00000000-0000-0000-0001-000000000003', 'COM', 'Department of Commerce', 'ACADEMIC', true),
  ('00000000-0000-0000-0001-000000000004', 'MAT', 'Department of Mathematics', 'ACADEMIC', true),
  ('00000000-0000-0000-0001-000000000005', 'PHY', 'Department of Physics', 'ACADEMIC', true),
  ('00000000-0000-0000-0001-000000000006', 'CHE', 'Department of Chemistry', 'ACADEMIC', true),
  ('00000000-0000-0000-0001-000000000007', 'BOT', 'Department of Botany', 'ACADEMIC', true),
  ('00000000-0000-0000-0001-000000000008', 'ZOO', 'Department of Zoology', 'ACADEMIC', true),
  ('00000000-0000-0000-0001-000000000009', 'ECO', 'Department of Economics', 'ACADEMIC', true),
  ('00000000-0000-0000-0001-000000000010', 'HIS', 'Department of History', 'ACADEMIC', true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- 4. ENSURE BASE PROGRAMMES EXIST IN SUPABASE
INSERT INTO programmes (id, code, name, department_id, type, duration_years, total_semesters, is_active)
VALUES
  ('00000000-0000-0000-0002-000000000001', 'BSCCS', 'BSc Computer Science', '00000000-0000-0000-0001-000000000001', 'UG', 4, 8, true),
  ('00000000-0000-0000-0002-000000000002', 'BAENG', 'BA English Language and Literature', '00000000-0000-0000-0001-000000000002', 'UG', 4, 8, true),
  ('00000000-0000-0000-0002-000000000003', 'BCOM', 'B.Com (Finance & Co-operation)', '00000000-0000-0000-0001-000000000003', 'UG', 4, 8, true),
  ('00000000-0000-0000-0002-000000000004', 'BSCMAT', 'BSc Mathematics', '00000000-0000-0000-0001-000000000004', 'UG', 4, 8, true),
  ('00000000-0000-0000-0002-000000000005', 'BSCPHY', 'BSc Physics', '00000000-0000-0000-0001-000000000005', 'UG', 4, 8, true),
  ('00000000-0000-0000-0002-000000000006', 'BSCCHE', 'BSc Chemistry', '00000000-0000-0000-0001-000000000006', 'UG', 4, 8, true),
  ('00000000-0000-0000-0002-000000000007', 'BSCBOT', 'BSc Botany', '00000000-0000-0000-0001-000000000007', 'UG', 4, 8, true),
  ('00000000-0000-0000-0002-000000000008', 'BSCZOO', 'BSc Zoology', '00000000-0000-0000-0001-000000000008', 'UG', 4, 8, true),
  ('00000000-0000-0000-0002-000000000009', 'BAECO', 'BA Economics', '00000000-0000-0000-0001-000000000009', 'UG', 4, 8, true),
  ('00000000-0000-0000-0002-000000000010', 'BAHIS', 'BA History', '00000000-0000-0000-0001-000000000010', 'UG', 4, 8, true),
  ('00000000-0000-0000-0002-000000000011', 'MSCCS', 'MSc Computer Science', '00000000-0000-0000-0001-000000000001', 'PG', 2, 4, true),
  ('00000000-0000-0000-0002-000000000012', 'MCOM', 'M.Com Finance', '00000000-0000-0000-0001-000000000003', 'PG', 2, 4, true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, department_id = EXCLUDED.department_id, is_active = EXCLUDED.is_active;

-- 5. REFRESH POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
