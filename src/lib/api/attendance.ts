import { apiRequest } from './client';
import type { Attendance } from '../../types';

export async function fetchAttendance(userId: string, limit = 30): Promise<Attendance[]> {
  const data = await apiRequest<Attendance[]>('/attendance', {
    query: { user_id: userId, order_by: 'tanggal', ascending: false, limit },
  });
  return data ?? [];
}

export async function rpcCheckIn(userId: string): Promise<void> {
  const result = await apiRequest<{ error?: string }>('/rpc/server_checkin', {
    method: 'POST',
    body: { p_user_id: userId },
  });
  if (result && typeof result === 'object' && 'error' in result && result.error) {
    throw new Error(result.error as string);
  }
}

export async function rpcCheckOut(userId: string): Promise<void> {
  const result = await apiRequest<{ error?: string }>('/rpc/server_checkout', {
    method: 'POST',
    body: { p_user_id: userId },
  });
  if (result && typeof result === 'object' && 'error' in result && result.error) {
    throw new Error(result.error as string);
  }
}
