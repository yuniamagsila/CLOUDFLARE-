import { apiRequest } from './client';
import type { LeaveRequest, LeaveStatus } from '../../types';

export interface FetchLeaveRequestsParams {
  userId?: string;
}

export async function fetchLeaveRequests(params: FetchLeaveRequestsParams = {}): Promise<LeaveRequest[]> {
  const data = await apiRequest<LeaveRequest[]>('/leave_requests', {
    query: { user_id: params.userId, order_by: 'created_at', ascending: false },
  });
  return data ?? [];
}

export async function insertLeaveRequest(data: {
  user_id: string;
  jenis_izin: 'cuti' | 'sakit' | 'dinas_luar';
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
}): Promise<void> {
  await apiRequest<void>('/leave_requests', {
    method: 'POST',
    body: { ...data, status: 'pending' },
  });
}

export async function patchLeaveRequestStatus(
  id: string,
  status: LeaveStatus,
  reviewedBy: string,
): Promise<void> {
  await apiRequest<void>(`/leave_requests/${id}/status`, {
    method: 'PATCH',
    body: { status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() },
  });
}
