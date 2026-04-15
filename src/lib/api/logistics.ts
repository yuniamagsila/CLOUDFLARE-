import { supabase } from '../supabase';
import type { LogisticsRequest, LogisticsRequestStatus } from '../../types';

export interface FetchLogisticsRequestsParams {
  satuan?: string;
  requestedBy?: string;
}

export async function fetchLogisticsRequests(
  params: FetchLogisticsRequestsParams = {},
): Promise<LogisticsRequest[]> {
  let query = supabase
    .from('logistics_requests')
    .select('*, requester:requested_by(id,nama,nrp,pangkat,satuan), reviewer:reviewed_by(id,nama)')
    .order('created_at', { ascending: false });
  if (params.requestedBy) query = query.eq('requested_by', params.requestedBy);
  if (params.satuan) query = query.eq('satuan', params.satuan);
  const { data, error } = await query;
  if (error) throw error;
  return (data as LogisticsRequest[]) ?? [];
}

export async function insertLogisticsRequest(data: {
  nama_item: string;
  jumlah: number;
  satuan_item?: string;
  alasan: string;
  requested_by: string;
  satuan: string;
}): Promise<void> {
  const { error } = await supabase.from('logistics_requests').insert({ ...data, status: 'pending' });
  if (error) throw error;
}

export async function patchLogisticsRequestStatus(
  id: string,
  status: Extract<LogisticsRequestStatus, 'approved' | 'rejected'>,
  reviewedBy: string,
  adminNote?: string,
): Promise<void> {
  const { error } = await supabase
    .from('logistics_requests')
    .update({
      status,
      admin_note: adminNote ?? null,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}
