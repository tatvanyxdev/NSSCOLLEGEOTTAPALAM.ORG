-- ==============================================================================
-- NSS COLLEGE OTTAPALAM - SUPABASE FREE-PLAN KEEP-ALIVE SEQUENCE
-- Purpose:
--   1. Keeps the database active to prevent Supabase from pausing after 7 days of inactivity.
--   2. Provides a dedicated ping log table with auto-pruning.
--   3. Optionally enables pg_cron internal job if available.
-- ==============================================================================

-- 1. CREATE KEEP-ALIVE TABLE
CREATE TABLE IF NOT EXISTS public.supabase_keep_alive_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ping_source VARCHAR(50) DEFAULT 'CLIENT_HEARTBEAT',
  pinged_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ip_source TEXT DEFAULT 'cloud'
);

-- Enable RLS & Open Access for authenticated and anon clients
ALTER TABLE public.supabase_keep_alive_pings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_read_pings ON public.supabase_keep_alive_pings;
CREATE POLICY allow_read_pings ON public.supabase_keep_alive_pings FOR SELECT USING (true);
DROP POLICY IF EXISTS allow_insert_pings ON public.supabase_keep_alive_pings;
CREATE POLICY allow_insert_pings ON public.supabase_keep_alive_pings FOR INSERT WITH CHECK (true);
GRANT ALL ON TABLE public.supabase_keep_alive_pings TO anon, authenticated, service_role;

-- 2. INSERT INITIAL PING RECORD TO REGISTER ACTIVITY
INSERT INTO public.supabase_keep_alive_pings (ping_source)
VALUES ('SYSTEM_SETUP_HEARTBEAT');

-- 3. KEEP-ALIVE STORED PROCEDURE (Can be invoked via RPC from client or cron)
CREATE OR REPLACE FUNCTION public.ping_keep_alive(source_label text DEFAULT 'APP_PULSE')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
  v_count int;
BEGIN
  -- Insert ping record
  INSERT INTO public.supabase_keep_alive_pings (ping_source)
  VALUES (source_label)
  RETURNING id INTO v_id;

  -- Auto-prune old records keeping only latest 100 entries
  DELETE FROM public.supabase_keep_alive_pings
  WHERE id NOT IN (
    SELECT id FROM public.supabase_keep_alive_pings
    ORDER BY pinged_at DESC
    LIMIT 100
  );

  SELECT count(*) INTO v_count FROM public.supabase_keep_alive_pings;

  RETURN jsonb_build_object(
    'status', 'ACTIVE',
    'ping_id', v_id,
    'total_records', v_count,
    'server_time', timezone('utc'::text, now())
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.ping_keep_alive(text) TO anon, authenticated, service_role;

-- 4. OPTIONAL: PG_CRON INTERNAL SCHEDULER (Only runs if pg_cron extension is enabled)
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'supabase-keep-alive-internal',
    '0 3 */3 * *', -- At 03:00 every 3 days
    $$SELECT public.ping_keep_alive('PG_CRON_INTERNAL');$$
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not enabled or permission restricted. External GitHub Actions cron handles keep-alive automatically.';
END $$;

NOTIFY pgrst, 'reload schema';
