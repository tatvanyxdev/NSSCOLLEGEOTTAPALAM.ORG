# Supabase Security Hardening & Authorization Architecture

## 1. Executive Summary & Audit Findings

During the security audit of the NSS College Ottapalam ERP Supabase database, critical authorization vulnerabilities were identified:

1. **25 Unrestricted "Allow all access" Policies**: Tables throughout the schema had active policies defined as `FOR ALL USING (true) WITH CHECK (true)`, allowing any client holding the public anon key to read, modify, or delete sensitive academic data.
2. **Blanket Table Grants**: The `anon` role held `ALL PRIVILEGES` across public tables, allowing unauthorized external requests to bypass logical application boundaries.
3. **Sensitive Data Exposure**: Student contact information, faculty records, and attendance histories were accessible without role verification.
4. **Unlinked Auth Identities**: The application was utilizing local username/password validation on `students` and `faculty` tables rather than cryptographic tokens issued by Supabase Auth (`auth.users`).

---

## 2. Security Remediation Plan

The remediation suite consists of 6 self-contained, idempotent SQL scripts in `supabase/security_migration/`:

| Script | Purpose | Execution Mode | Safety |
|---|---|---|---|
| `00_preflight_audit.sql` | Diagnostic health check of extensions, tables, policies, and row counts. | 100% Read-Only | Safe |
| `01_schema_and_access_report.sql` | Deep audit of sensitive credential fields, foreign keys, triggers, and functions. | 100% Read-Only | Safe |
| `02_auth_linking_preparation.sql` | Adds `auth_user_id` columns, helper functions (`is_admin`, `is_faculty`, etc.), and email-linking trigger. | Idempotent DDL | Safe |
| `03_rls_policy_migration.sql` | Drops all 25 `Allow all access` policies and replaces them with strict role-based RLS policies. | RLS Migration | Safe |
| `04_grants_migration.sql` | Revokes blanket `ALL` from `anon` and configures least-privilege table grants. | DCL Migration | Safe |
| `05_post_migration_verification.sql` | Validates that all checks pass and outputs a security verification scorecard. | 100% Read-Only | Safe |

---

## 3. How to Execute in Supabase SQL Editor

### Critical Copy-Paste Rule:
> **IMPORTANT**: When copying SQL into the Supabase SQL Editor:
> - Open each file directly or copy **ONLY** the raw SQL code.
> - **DO NOT copy markdown section headers, brackets (such as `[Phase 1]`), or backticks.** 
> - Copying non-SQL characters causes PostgreSQL error `42601: syntax error at or near "["`.

### Execution Sequence:
1. Open **Supabase Dashboard** -> Select your Project -> **SQL Editor**.
2. Run `00_preflight_audit.sql` to view current active policies and table row counts.
3. Run `01_schema_and_access_report.sql` to inspect existing column constraints.
4. Run `02_auth_linking_preparation.sql` to install helper functions and auth linking triggers.
5. Run `03_rls_policy_migration.sql` to replace unrestricted policies with fine-grained RLS.
6. Run `04_grants_migration.sql` to restrict table-level grants.
7. Run `05_post_migration_verification.sql` to confirm zero vulnerabilities remain.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Entity / Resource | Anonymous (`anon`) | Student | Faculty | HOD / Principal | Super Admin |
|---|---|---|---|---|---|
| **Departments & Programmes** | Read-Only | Read-Only | Read-Only | Read / Write | Full Access |
| **Courses & Offerings** | Read-Only | Read-Only | Read-Only | Read / Write | Full Access |
| **Announcements & Circulars** | Published Only | Read-Only | Read / Create | Read / Write | Full Access |
| **Emergency Alerts** | Active Only | Read-Only | Read-Only | Read / Write | Full Access |
| **Student Profiles** | **No Access** | Own Record (Read/Update) | Department / Read | Department / Read | Full Access |
| **Faculty Profiles** | **No Access** | Directory Read | Own Record (Update) | Department / Update | Full Access |
| **Attendance Records** | **No Access** | Own Records Only | Mark / Edit Assigned | All Department / College | Full Access |
| **Special Duty Attendance** | **No Access** | Own Records Only | Submit Duty / View | Sanction / Consolidate | Full Access |
| **Correction Requests** | **No Access** | Submit / View Own | Review Assigned | Review All | Full Access |
| **Timetable & Schedules** | **No Access** | View Enrolled | View Assigned / All | Coordinate / Edit | Full Access |
| **Audit Logs** | **No Access** | **No Access** | **No Access** | Read-Only | Read-Only (Immutable) |

---

## 5. Transition to Supabase Auth (Zero Downtime)

### Safe Coexistence
- The frontend supports both development mode (with offline role testing) and live Supabase Auth sessions.
- In `02_auth_linking_preparation.sql`, an automated trigger `handle_auth_user_linking` is established. When an existing faculty member or student creates an account or signs in via Supabase Auth using their official college email, the system automatically binds their `auth.users(id)` to their `faculty` or `students` record.
- No existing student records or faculty passwords are wiped during this transition.
