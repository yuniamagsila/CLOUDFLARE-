import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, type RealtimeChannel } from '../lib/supabase';
import { fetchLogisticsRequests as apiFetchLogistics, insertLogisticsRequest, patchLogisticsRequestStatus } from '../lib/api/logistics';
import { handleError } from '../lib/handleError';
import type { LogisticsRequest, LogisticsRequestStatus } from '../types';
import { useAuthStore } from '../store/authStore';

interface UseLogisticsRequestsOptions {
  satuan?: string;
  requestedBy?: string;
}

export function useLogisticsRequests(options: UseLogisticsRequestsOptions = {}) {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<LogisticsRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetchLogistics({ satuan: options.satuan, requestedBy: options.requestedBy });
      setRequests(data);
    } catch (err) {
      setError(handleError(err, 'Gagal memuat permintaan logistik'));
    } finally {
      setIsLoading(false);
    }
  }, [options.requestedBy, options.satuan]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  // Realtime subscription
  // Gunakan ref agar tidak terjadi duplicate subscription
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel('logistics-requests-changes');
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'logistics_requests' }, () => {
      void fetchRequests();
    });
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchRequests]);

  const submitRequest = async (data: {
    nama_item: string;
    jumlah: number;
    satuan_item?: string;
    alasan: string;
  }) => {
    if (!user) throw new Error('Not authenticated');
    await insertLogisticsRequest({ ...data, requested_by: user.id, satuan: user.satuan });
    await fetchRequests();
  };

  const reviewRequest = async (
    id: string,
    status: Extract<LogisticsRequestStatus, 'approved' | 'rejected'>,
    adminNote?: string,
  ) => {
    if (!user) throw new Error('Not authenticated');
    await patchLogisticsRequestStatus(id, status, user.id, adminNote);
    await fetchRequests();
  };

  return {
    requests,
    isLoading,
    error,
    refetch: fetchRequests,
    submitRequest,
    reviewRequest,
  };
}
