import { supabase } from '../supabase';
import type { AuditLog } from '../../types';

export interface FetchAuditLogsParams {
  userId?: string;
  action?: string;
  limit?: number;
}

export async function fetchAuditLogs(params: FetchAuditLogsParams = {}): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*, user:user_id(id,nama,nrp,role)')
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 100);
  if (params.userId) query = query.eq('user_id', params.userId);
  if (params.action) query = query.eq('action', params.action);
  const { data, error } = await query;
  if (error) throw error;
  return (data as AuditLog[]) ?? [];
}
