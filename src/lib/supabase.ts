import { createClient } from '@supabase/supabase-js';

// Configuration: uses environment variables if present, falling back to the configured project credentials
const metaEnv = (import.meta as any).env || {};
export const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || 'https://jpirkjbqirkwsmesusqa.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_axxVDb7f0ftRbdCkeXiluw_oBtS9Clb';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_URL.includes('your-project')
);

/**
 * In-memory ERP session token holder.
 * Deliberately stored ONLY in runtime memory (never in localStorage or sessionStorage)
 * to prevent token exfiltration and client-side persistence tampering.
 */
let inMemoryErpSessionToken: string | null = null;

export function setInMemoryErpSessionToken(token: string | null): void {
  inMemoryErpSessionToken = token && token.trim() ? token.trim() : null;
}

export function getInMemoryErpSessionToken(): string | null {
  return inMemoryErpSessionToken;
}

const sessionAwareFetch: typeof fetch = (input, init?: RequestInit) => {
  const headers = new Headers(
    init?.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined)
  );
  if (inMemoryErpSessionToken) {
    headers.set('x-erp-session', inMemoryErpSessionToken);
  }
  return fetch(input, {
    ...(init || {}),
    headers
  });
};

// Create Supabase Client instance with in-memory ERP session header injection
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    },
    global: {
      fetch: sessionAwareFetch
    }
  }
);

/**
 * Generates the hardened PostgreSQL DDL & RLS blueprint reference.
 * Full idempotent migration script is stored in supabase/migrations/20261124_complete_security_hardening.sql.
 */
export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - FYUGP COLLEGE ERP HARDENED DATABASE BLUEPRINT
-- Complete Idempotent Script: supabase/migrations/20261124_complete_security_hardening.sql
-- ==============================================================================
-- Security Architecture Highlights:
-- 1. Zero Plaintext Passwords: All passwords hashed via pgcrypto bcrypt in
--    isolated private table public.user_credentials (RLS: USING (false)).
-- 2. Server-Verified Session Tokens: SHA-256 hashed 256-bit tokens stored in
--    public.erp_sessions and validated on every query via x-erp-session header.
-- 3. Automatic Plaintext Scrubbing Triggers: BEFORE INSERT/UPDATE triggers on
--    students and faculty hash any incoming password and force NEW.password := NULL.
-- 4. Anti-Escalation Triggers & Bruteforce Lockouts: Role escalation attempts,
--    unauthorized approvals, and 5+ failed logins are blocked server-side.
-- 5. Least-Privilege Forced RLS: Zero USING(true) write policies; students
--    cannot view or alter peers' PII or attendance records.
-- ==============================================================================
-- Run supabase/migrations/20261124_complete_security_hardening.sql in the
-- Supabase SQL Editor to apply the full schema, triggers, RPCs, and RLS policies.
`;

export function generateSupabaseSqlSchema(): string {
  return SUPABASE_SCHEMA_SQL;
}
