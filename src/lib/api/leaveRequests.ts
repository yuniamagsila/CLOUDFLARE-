import { supabase } from '../supabase';
import type { LeaveRequest, LeaveStatus } from '../../types';

export interface FetchLeaveRequestsParams {
  userId?: string;
}

export async function fetchLeaveRequests(params: FetchLeaveRequestsParams = {}): Promise<LeaveRequest[]> {
  let query = supabase
    .from('leave_requests')
    .select('*, user:user_id(id,nama,nrp,pangkat,satuan), reviewer:reviewed_by(id,nama)')
    .order('created_at', { ascending: false });
  if (params.userId) query = query.eq('user_id', params.userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as LeaveRequest[]) ?? [];
}

export async function insertLeaveRequest(data: {
  user_id: string;
  jenis_izin: 'cuti' | 'sakit' | 'dinas_luar';
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan: string;
}): Promise<void> {
  const { error } = await supabase.from('leave_requests').insert({ ...data, status: 'pending' });
  if (error) throw error;
}

export async function patchLeaveRequestStatus(
  id: string,
  status: LeaveStatus,
  reviewedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('leave_requests')
    .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
