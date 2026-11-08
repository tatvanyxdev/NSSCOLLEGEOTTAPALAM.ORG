# Rollback Runbook: Supabase Security Migration

This runbook provides emergency rollback procedures if any application functionality is impacted after executing the security hardening migration scripts.

---

## Safety Guarantees

1. **Zero Data Loss**: None of the migration scripts modify or delete rows in `students`, `faculty`, `attendance_records`, or any other academic table.
2. **Reversible Permissions**: Grants and RLS policies can be restored at any time without impacting underlying records.

---

## Scenario A: Rollback Row-Level Security (RLS) to Previous Permissive Mode

If an existing app component fails with `42501: permission denied for table` or RLS violation errors, execute the following script in the **Supabase SQL Editor** to restore development permissive policies while maintaining the tables and data intact:

```sql
-- ==============================================================================
-- EMERGENCY ROLLBACK SCRIPT: RESTORE PERMISSIVE DEVELOPMENT ACCESS
-- Run ONLY in emergency if legitimate user flows are blocked.
-- ==============================================================================

DO $$
DECLARE
  t TEXT;
  tbls TEXT[] := ARRAY[
    'students', 'faculty', 'departments', 'programmes', 'courses', 
    'course_offerings', 'academic_years', 'semesters', 'course_categories',
    'course_groups', 'admission_batches', 'attendance_records', 'class_sessions',
    'attendance_correction_requests', 'special_attendance_events',
    'special_attendance_records', 'daily_schedule_overrides', 'timetable_entries',
    'timetable_periods', 'class_tutor_assignments', 'substitute_assignments',
    'announcements', 'circulars', 'emergency_alerts', 'academic_events',
    'student_course_registrations', 'student_leave_requests', 
    'student_certificate_requests', 'audit_logs', 'user_roles'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      -- Drop granular policies
      EXECUTE format('DROP POLICY IF EXISTS "%s_read_catalog" ON public.%I;', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_admin_modify" ON public.%I;', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I;', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_modify" ON public.%I;', t, t);

      -- Restore single fallback policy
      EXECUTE format('DROP POLICY IF EXISTS "Allow all access" ON public.%I;', t);
      EXECUTE format('CREATE POLICY "Allow all access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t);
    END IF;
  END LOOP;
END $$;
```

---

## Scenario B: Rollback Grants (Restore Development Grants)

If the client application requires anon or broad authenticated grants during transition:

```sql
-- Restore development grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
```

---

## Scenario C: Single Table Exemption

If a specific table (e.g. `special_attendance_records`) requires debugging or temporary permissive access without rolling back the entire database:

```sql
-- Temporarily permit access on a single table for debugging
DROP POLICY IF EXISTS "special_records_select" ON public.special_attendance_records;
DROP POLICY IF EXISTS "special_records_write" ON public.special_attendance_records;
CREATE POLICY "Allow all access" ON public.special_attendance_records FOR ALL USING (true) WITH CHECK (true);
```
