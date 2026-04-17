import { apiRequest } from './client';
import type { AuditLog } from '../../types';

export interface FetchAuditLogsParams {
  userId?: string;
  action?: string;
  limit?: number;
}

export async function fetchAuditLogs(params: FetchAuditLogsParams = {}): Promise<AuditLog[]> {
  const data = await apiRequest<AuditLog[]>('/audit_logs', {
    query: {
      user_id: params.userId,
      action: params.action,
      limit: params.limit ?? 100,
      order_by: 'created_at',
      ascending: false,
    },
  });
  return data ?? [];
}
