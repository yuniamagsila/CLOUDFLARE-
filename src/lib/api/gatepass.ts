import { apiRequest } from './client';
import type { GatePass } from '../../types';

export async function fetchGatePassesByUser(userId: string): Promise<GatePass[]> {
  const data = await apiRequest<GatePass[]>('/gatepass', {
    query: {
      user_id: userId,
      order_by: 'created_at',
      ascending: false,
    },
  });
  return data ?? [];
}

export async function fetchGatePassesByUserAndStatus(userId: string, status: GatePass['status']): Promise<GatePass[]> {
  const data = await apiRequest<GatePass[]>('/gatepass', {
    query: {
      user_id: userId,
      status,
      order_by: 'created_at',
      ascending: false,
    },
  });
  return data ?? [];
}

export async function fetchAllGatePasses(): Promise<GatePass[]> {
  const data = await apiRequest<GatePass[]>('/gatepass', {
    query: {
      include_user: true,
      order_by: 'created_at',
      ascending: false,
    },
  });
  return data ?? [];
}

export async function fetchGatePassByQrToken(qrToken: string): Promise<GatePass | null> {
  try {
    return await apiRequest<GatePass>(`/gatepass/qr/${encodeURIComponent(qrToken)}`);
  } catch {
    return null;
  }
}

export async function insertGatePass(payload: Partial<GatePass> & { user_id: string; qr_token: string }): Promise<void> {
  await apiRequest<void>('/gatepass', {
    method: 'POST',
    body: payload,
  });
}

export async function patchGatePassStatus(
  id: string,
  status: GatePass['status'],
  approvedBy?: string,
): Promise<void> {
  await apiRequest<void>(`/gatepass/${id}/status`, {
    method: 'PATCH',
    body: { status, approved_by: approvedBy ?? null },
  });
}

/** Response shape returned by the `server_scan_gate_pass` Supabase RPC. */
interface ScanGatePassResponse {
  message?: string;
}

export async function rpcScanGatePass(qrToken: string): Promise<string> {
  const data = await apiRequest<ScanGatePassResponse>('/gatepass/scan', {
    method: 'POST',
    body: { qr_token: qrToken },
  });
  return data?.message ?? 'Scan berhasil';
}
