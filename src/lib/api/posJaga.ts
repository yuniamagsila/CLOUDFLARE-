import { apiRequest } from './client';
import type { PosJaga, ScanPosJagaResult } from '../../types';

export async function fetchAllPosJaga(): Promise<PosJaga[]> {
  const data = await apiRequest<PosJaga[]>('/pos_jaga', {
    query: { order_by: 'created_at', ascending: false },
  });
  return data ?? [];
}

export async function insertPosJaga(payload: { nama: string }): Promise<void> {
  await apiRequest<void>('/pos_jaga', { method: 'POST', body: payload });
}

export async function patchPosJagaActive(id: string, is_active: boolean): Promise<void> {
  await apiRequest<void>(`/pos_jaga/${id}`, { method: 'PATCH', body: { is_active } });
}

export async function rpcScanPosJaga(posToken: string, userId: string): Promise<ScanPosJagaResult> {
  const data = await apiRequest<ScanPosJagaResult>('/rpc/scan_pos_jaga', {
    method: 'POST',
    body: { p_pos_token: posToken, p_user_id: userId },
  });
  if (!data) throw new Error('QR pos jaga tidak valid');
  return data;
}
