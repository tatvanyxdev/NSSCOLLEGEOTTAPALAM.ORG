import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../lib/supabase';

export interface HeartbeatResult {
  success: boolean;
  timestamp: string;
  latencyMs: number;
  status: 'ACTIVE' | 'WAKING_UP' | 'OFFLINE';
  message: string;
  source: 'REST_QUERY' | 'HEALTH_ENDPOINT';
}

const HEARTBEAT_KEY = 'nss_supabase_last_heartbeat';
const HEARTBEAT_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours in-app check

class SupabaseHeartbeatService {
  private intervalId: any = null;
  private isPinging = false;

  /**
   * Pings Supabase with a lightweight query to ensure the free-tier instance stays active.
   */
  async ping(): Promise<HeartbeatResult> {
    if (this.isPinging) {
      return {
        success: true,
        timestamp: new Date().toISOString(),
        latencyMs: 0,
        status: 'ACTIVE',
        message: 'Ping already in progress.',
        source: 'REST_QUERY'
      };
    }

    this.isPinging = true;
    const start = performance.now();

    try {
      // 1. Direct Supabase query on lightweight system_settings
      const { data, error } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      const elapsed = Math.round(performance.now() - start);

      if (!error) {
        const result: HeartbeatResult = {
          success: true,
          timestamp: new Date().toISOString(),
          latencyMs: elapsed,
          status: 'ACTIVE',
          message: `Database is active and responsive (${elapsed}ms).`,
          source: 'REST_QUERY'
        };
        this.saveLastResult(result);
        this.isPinging = false;
        return result;
      }

      // If query failed (e.g. cold start), try auth health endpoint
      return await this.pingHealthEndpoint(start);
    } catch (err: any) {
      return await this.pingHealthEndpoint(start);
    } finally {
      this.isPinging = false;
    }
  }

  /**
   * Fallback ping to the Supabase REST/Auth endpoint directly via fetch
   */
  private async pingHealthEndpoint(startTime: number): Promise<HeartbeatResult> {
    try {
      const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/system_settings?select=id&limit=1`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        }
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (res.ok) {
        const result: HeartbeatResult = {
          success: true,
          timestamp: new Date().toISOString(),
          latencyMs: elapsed,
          status: 'ACTIVE',
          message: `Supabase REST API is active (${elapsed}ms).`,
          source: 'REST_QUERY'
        };
        this.saveLastResult(result);
        return result;
      }

      if (res.status === 503 || res.status === 504) {
        return {
          success: false,
          timestamp: new Date().toISOString(),
          latencyMs: elapsed,
          status: 'WAKING_UP',
          message: 'Supabase instance is currently waking up from standby.',
          source: 'HEALTH_ENDPOINT'
        };
      }

      return {
        success: false,
        timestamp: new Date().toISOString(),
        latencyMs: elapsed,
        status: 'OFFLINE',
        message: `HTTP ${res.status}: ${res.statusText}`,
        source: 'HEALTH_ENDPOINT'
      };
    } catch (e: any) {
      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        latencyMs: elapsed,
        status: 'OFFLINE',
        message: e?.message || 'Network connectivity error.',
        source: 'HEALTH_ENDPOINT'
      };
    }
  }

  /**
   * Initialize in-app periodic keep-alive
   */
  initHeartbeat(): void {
    if (typeof window === 'undefined') return;

    // Check if ping is needed on load (if > 4 hours since last ping)
    const last = this.getLastResult();
    const shouldPingNow = !last || (Date.now() - new Date(last.timestamp).getTime()) > HEARTBEAT_INTERVAL_MS;

    if (shouldPingNow) {
      setTimeout(() => {
        this.ping().catch(() => {});
      }, 3000); // 3 second delay after app start
    }

    // Set recurring timer
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.ping().catch(() => {});
      }, HEARTBEAT_INTERVAL_MS);
    }
  }

  getLastResult(): HeartbeatResult | null {
    try {
      const raw = localStorage.getItem(HEARTBEAT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveLastResult(result: HeartbeatResult): void {
    try {
      localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(result));
    } catch {
      // ignore storage quota errors
    }
  }
}

export const supabaseHeartbeatService = new SupabaseHeartbeatService();
