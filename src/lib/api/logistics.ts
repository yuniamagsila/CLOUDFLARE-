import { apiRequest } from './client';
import type { LogisticsRequest, LogisticsRequestStatus } from '../../types';

export interface FetchLogisticsRequestsParams {
  satuan?: string;
  requestedBy?: string;
}

export async function fetchLogisticsRequests(
  params: FetchLogisticsRequestsParams = {},
): Promise<LogisticsRequest[]> {
  const data = await apiRequest<LogisticsRequest[]>('/logistics_requests', {
    query: {
      requested_by: params.requestedBy,
      satuan: params.satuan,
      order_by: 'created_at',
      ascending: false,
    },
  });
  return data ?? [];
}

export async function insertLogisticsRequest(data: {
  nama_item: string;
  jumlah: number;
  satuan_item?: string;
  alasan: string;
  requested_by: string;
  satuan: string;
}): Promise<void> {
  await apiRequest<void>('/logistics_requests', {
    method: 'POST',
    body: { ...data, status: 'pending' },
  });
}

export async function patchLogisticsRequestStatus(
  id: string,
  status: Extract<LogisticsRequestStatus, 'approved' | 'rejected'>,
  reviewedBy: string,
  adminNote?: string,
): Promise<void> {
  await apiRequest<void>(`/logistics_requests/${id}/status`, {
    method: 'PATCH',
    body: {
      status,
      admin_note: adminNote ?? null,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    },
  });
}
