import { supabase } from '../lib/supabase';
import { AuditLog } from '../types';
import { mapAuditLogFromDb } from '../lib/dataMappers';

export const auditLogService = {
  async getAuditLogs(): Promise<{ data: AuditLog[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return { data: (data || []).map(mapAuditLogFromDb), error: null };
    } catch (err: any) {
      console.warn('auditLogService.getAuditLogs fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createAuditLog(log: Partial<AuditLog> & { action: string; entityType: string; entityId: string }): Promise<{ data: AuditLog | null; error: Error | null }> {
    try {
      const logAny = log as any;
      const payload = {
        actor_id: logAny.actorId || null,
        actor_name: log.actorName || 'System',
        actor_role: log.actorRole || 'SUPER_ADMIN',
        action: log.action,
        entity_type: log.entityType,
        entity_id: log.entityId,
        details: logAny.details || { oldData: log.oldData, newData: log.newData },
        timestamp: log.timestamp || new Date().toISOString(),
        ip_address: log.ipAddress || null
      };
      const { data, error } = await supabase.from('audit_logs').insert([payload]).select().single();
      if (error) throw error;
      return { data: data ? mapAuditLogFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('auditLogService.createAuditLog fallback:', err?.message || err);
      return { data: null, error: err };
    }
  }
};
