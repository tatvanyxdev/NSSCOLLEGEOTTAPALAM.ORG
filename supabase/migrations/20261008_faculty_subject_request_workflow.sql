-- ==============================================================================
-- FACULTY SUBJECT REQUEST, HOD APPROVAL & ALLOCATION WORKFLOW
-- NSS College Ottapalam - Additive Foundation Migration
-- Idempotent, safe migration that does not modify existing attendance tables.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure faculty_course_assignments has lifecycle tracking columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'faculty_course_assignments' AND column_name = 'start_date'
    ) THEN
        ALTER TABLE public.faculty_course_assignments ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'faculty_course_assignments' AND column_name = 'end_date'
    ) THEN
        ALTER TABLE public.faculty_course_assignments ADD COLUMN end_date DATE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'faculty_course_assignments' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.faculty_course_assignments ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'faculty_course_assignments' AND column_name = 'reason'
    ) THEN
        ALTER TABLE public.faculty_course_assignments ADD COLUMN reason TEXT;
    END IF;
END $$;

-- 2. Requests submitted by teachers
CREATE TABLE IF NOT EXISTS public.faculty_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requested_by UUID NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_by_faculty_id UUID
        REFERENCES public.faculty(id) ON DELETE SET NULL,

    department_id UUID NOT NULL
        REFERENCES public.departments(id) ON DELETE CASCADE,

    course_name TEXT NOT NULL,
    proposed_course_code TEXT,

    course_type TEXT NOT NULL
        CHECK (course_type IN (
            'MAJOR', 'MINOR', 'MDC', 'AEC',
            'SEC', 'VAC', 'DSC', 'OTHER'
        )),

    programme_id UUID
        REFERENCES public.programmes(id) ON DELETE SET NULL,

    semester_number INTEGER
        CHECK (semester_number BETWEEN 1 AND 12),

    academic_year TEXT DEFAULT '2026-27',
    academic_year_id UUID,

    existing_course_id UUID
        REFERENCES public.courses(id) ON DELETE SET NULL,
    existing_course_group_id UUID
        REFERENCES public.course_groups(id) ON DELETE SET NULL,

    proposed_group_name TEXT,
    request_notes TEXT,

    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING',
            'APPROVED',
            'REJECTED',
            'RETURNED',
            'CANCELLED',
            'NEEDS_CHANGES'
        )),

    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_by_faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faculty_subject_requests_teacher
ON public.faculty_subject_requests(requested_by);

CREATE INDEX IF NOT EXISTS idx_faculty_subject_requests_faculty_id
ON public.faculty_subject_requests(requested_by_faculty_id);

CREATE INDEX IF NOT EXISTS idx_faculty_subject_requests_department_status
ON public.faculty_subject_requests(department_id, status);


-- 3. Historical record of teaching assignments (Preserves historical attendance!)
CREATE TABLE IF NOT EXISTS public.faculty_assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_group_id UUID NOT NULL
        REFERENCES public.course_groups(id) ON DELETE CASCADE,

    faculty_id UUID
        REFERENCES public.faculty(id) ON DELETE CASCADE,
    faculty_auth_user_id UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,

    department_id UUID NOT NULL
        REFERENCES public.departments(id) ON DELETE CASCADE,

    assignment_role TEXT NOT NULL DEFAULT 'PRIMARY'
        CHECK (assignment_role IN (
            'PRIMARY',
            'CO_TEACHER',
            'LAB_INSTRUCTOR'
        )),

    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,

    source_request_id UUID
        REFERENCES public.faculty_subject_requests(id) ON DELETE SET NULL,

    assigned_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,

    ended_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,

    reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_assignment_dates
        CHECK (
            effective_until IS NULL
            OR effective_until >= effective_from
        )
);

CREATE INDEX IF NOT EXISTS idx_faculty_assignment_history_group
ON public.faculty_assignment_history(course_group_id);

CREATE INDEX IF NOT EXISTS idx_faculty_assignment_history_faculty
ON public.faculty_assignment_history(faculty_id);

CREATE INDEX IF NOT EXISTS idx_faculty_assignment_history_auth_user
ON public.faculty_assignment_history(faculty_auth_user_id);


-- 4. Audit events for subject requests and assignments
CREATE TABLE IF NOT EXISTS public.faculty_subject_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id UUID
        REFERENCES public.faculty_subject_requests(id) ON DELETE SET NULL,

    assignment_history_id UUID
        REFERENCES public.faculty_assignment_history(id) ON DELETE SET NULL,

    action TEXT NOT NULL,

    performed_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,

    details JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faculty_subject_audit_action
ON public.faculty_subject_audit(action, created_at DESC);


-- 5. Enable Row Level Security
ALTER TABLE public.faculty_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_subject_audit ENABLE ROW LEVEL SECURITY;


-- 6. Teacher policies
DROP POLICY IF EXISTS "Teacher view own subject requests" ON public.faculty_subject_requests;
CREATE POLICY "Teacher view own subject requests"
ON public.faculty_subject_requests
FOR SELECT TO authenticated
USING (
    requested_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.faculty f
        WHERE f.id = faculty_subject_requests.requested_by_faculty_id
          AND f.auth_user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.faculty f
        WHERE f.auth_user_id = auth.uid()
          AND (f.roles::text ILIKE '%HOD%' OR f.roles::text ILIKE '%PRINCIPAL%' OR f.roles::text ILIKE '%SUPER_ADMIN%')
    )
);

DROP POLICY IF EXISTS "Teacher submit own subject request" ON public.faculty_subject_requests;
CREATE POLICY "Teacher submit own subject request"
ON public.faculty_subject_requests
FOR INSERT TO authenticated
WITH CHECK (
    (requested_by = auth.uid() OR requested_by_faculty_id IS NOT NULL)
    AND status = 'PENDING'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
);

DROP POLICY IF EXISTS "HOD and Admin update subject requests" ON public.faculty_subject_requests;
CREATE POLICY "HOD and Admin update subject requests"
ON public.faculty_subject_requests
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.faculty f
        WHERE f.auth_user_id = auth.uid()
          AND (
            f.department_id = faculty_subject_requests.department_id
            OR f.roles::text ILIKE '%PRINCIPAL%'
            OR f.roles::text ILIKE '%SUPER_ADMIN%'
          )
    )
);


-- 7. Assignment history & audit policies
DROP POLICY IF EXISTS "Staff view assignment history" ON public.faculty_assignment_history;
CREATE POLICY "Staff view assignment history"
ON public.faculty_assignment_history
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Staff view audit logs" ON public.faculty_subject_audit;
CREATE POLICY "Staff view audit logs"
ON public.faculty_subject_audit
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.faculty f
        WHERE f.auth_user_id = auth.uid()
          AND (f.roles::text ILIKE '%HOD%' OR f.roles::text ILIKE '%PRINCIPAL%' OR f.roles::text ILIKE '%SUPER_ADMIN%')
    )
);


-- 8. Atomic Approval RPC Function
CREATE OR REPLACE FUNCTION public.approve_faculty_subject_request(
    p_request_id UUID,
    p_course_offering_id UUID,
    p_course_group_id UUID,
    p_faculty_id UUID,
    p_reviewer_auth_id UUID,
    p_review_notes TEXT DEFAULT 'Approved by HOD'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_req RECORD;
    v_assign_id UUID;
    v_now TIMESTAMPTZ := now();
    v_today DATE := CURRENT_DATE;
BEGIN
    SELECT * INTO v_req FROM public.faculty_subject_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;

    -- 1. Update request status to APPROVED
    UPDATE public.faculty_subject_requests
    SET status = 'APPROVED',
        reviewed_by = p_reviewer_auth_id,
        reviewed_at = v_now,
        review_notes = p_review_notes,
        existing_course_group_id = p_course_group_id,
        updated_at = v_now
    WHERE id = p_request_id;

    -- 2. Insert into active faculty_course_assignments
    INSERT INTO public.faculty_course_assignments (
        faculty_id,
        course_offering_id,
        course_group_id,
        assignment_role,
        start_date,
        is_active
    ) VALUES (
        p_faculty_id,
        p_course_offering_id,
        p_course_group_id,
        'PRIMARY',
        v_today,
        true
    ) RETURNING id INTO v_assign_id;

    -- 3. Record in faculty_assignment_history
    INSERT INTO public.faculty_assignment_history (
        course_group_id,
        faculty_id,
        department_id,
        assignment_role,
        effective_from,
        source_request_id,
        assigned_by,
        reason
    ) VALUES (
        p_course_group_id,
        p_faculty_id,
        v_req.department_id,
        'PRIMARY',
        v_today,
        p_request_id,
        p_reviewer_auth_id,
        p_review_notes
    );

    -- 4. Audit trail
    INSERT INTO public.faculty_subject_audit (
        request_id,
        action,
        performed_by,
        details
    ) VALUES (
        p_request_id,
        'REQUEST_APPROVED',
        p_reviewer_auth_id,
        jsonb_build_object(
            'assignment_id', v_assign_id,
            'course_group_id', p_course_group_id,
            'faculty_id', p_faculty_id,
            'notes', p_review_notes
        )
    );

    RETURN jsonb_build_object('success', true, 'assignment_id', v_assign_id);
END;
$$;


-- 9. Atomic Reassignment RPC Function (Preserves Historical Attendance!)
CREATE OR REPLACE FUNCTION public.reassign_faculty_course_group(
    p_course_group_id UUID,
    p_old_faculty_id UUID,
    p_new_faculty_id UUID,
    p_department_id UUID,
    p_effective_date DATE,
    p_reason TEXT,
    p_assigned_by_auth_id UUID,
    p_update_timetable BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prev_date DATE := p_effective_date - 1;
    v_new_assign_id UUID;
    v_offering_id UUID;
BEGIN
    -- Look up offering id from existing active assignment
    SELECT course_offering_id INTO v_offering_id
    FROM public.faculty_course_assignments
    WHERE course_group_id = p_course_group_id
      AND faculty_id = p_old_faculty_id
      AND is_active = true
    LIMIT 1;

    -- 1. End old assignment without deleting historical records
    UPDATE public.faculty_course_assignments
    SET end_date = v_prev_date,
        is_active = false
    WHERE course_group_id = p_course_group_id
      AND faculty_id = p_old_faculty_id
      AND is_active = true;

    -- 2. Update assignment history record for ended faculty
    UPDATE public.faculty_assignment_history
    SET effective_until = v_prev_date,
        ended_by = p_assigned_by_auth_id
    WHERE course_group_id = p_course_group_id
      AND faculty_id = p_old_faculty_id
      AND effective_until IS NULL;

    -- 3. Create new assignment for new teacher starting from effective date
    INSERT INTO public.faculty_course_assignments (
        faculty_id,
        course_offering_id,
        course_group_id,
        assignment_role,
        start_date,
        is_active
    ) VALUES (
        p_new_faculty_id,
        v_offering_id,
        p_course_group_id,
        'PRIMARY',
        p_effective_date,
        true
    ) RETURNING id INTO v_new_assign_id;

    -- 4. Insert new record in faculty_assignment_history
    INSERT INTO public.faculty_assignment_history (
        course_group_id,
        faculty_id,
        department_id,
        assignment_role,
        effective_from,
        assigned_by,
        reason
    ) VALUES (
        p_course_group_id,
        p_new_faculty_id,
        p_department_id,
        'PRIMARY',
        p_effective_date,
        p_assigned_by_auth_id,
        p_reason
    );

    -- 5. Update timetable entries if requested
    IF p_update_timetable THEN
        UPDATE public.timetable_entries
        SET faculty_id = p_new_faculty_id
        WHERE course_group_id = p_course_group_id;
    END IF;

    -- 6. Audit log
    INSERT INTO public.faculty_subject_audit (
        action,
        performed_by,
        details
    ) VALUES (
        'TEACHER_REASSIGNED',
        p_assigned_by_auth_id,
        jsonb_build_object(
            'course_group_id', p_course_group_id,
            'old_faculty_id', p_old_faculty_id,
            'new_faculty_id', p_new_faculty_id,
            'effective_date', p_effective_date,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object('success', true, 'new_assignment_id', v_new_assign_id);
END;
$$;
