import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Attendance } from '../types';
import { useAuthStore } from '../store/authStore';

export function useAttendance(userId?: string) {
  const { user } = useAuthStore();
  const targetUserId = userId ?? user?.id;

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchAttendance = useCallback(async () => {
    if (!targetUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('attendance')
        .select('*, user:user_id(id,nama,nrp,pangkat)')
        .eq('user_id', targetUserId)
        .order('tanggal', { ascending: false })
        .limit(30);
      if (err) throw err;
      const list = (data as Attendance[]) ?? [];
      setAttendances(list);
      setTodayAttendance(list.find((a) => a.tanggal === today) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat absensi');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, today]);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  const checkIn = async () => {
    if (!targetUserId) throw new Error('User tidak ditemukan');
    if (todayAttendance?.check_in) throw new Error('Sudah check-in hari ini');

    // Use server_checkin RPC so the timestamp comes from the database
    // server, preventing client-side clock manipulation.
    const { error } = await supabase.rpc('server_checkin', { p_user_id: targetUserId });
    if (error) throw new Error(error.message);
    await fetchAttendance();
  };

  const checkOut = async () => {
    if (!targetUserId) throw new Error('User tidak ditemukan');
    if (!todayAttendance?.check_in) throw new Error('Belum check-in hari ini');
    if (todayAttendance.check_out) throw new Error('Sudah check-out hari ini');

    // Use server_checkout RPC so the timestamp comes from the database server.
    const { error } = await supabase.rpc('server_checkout', { p_user_id: targetUserId });
    if (error) throw new Error(error.message);
    await fetchAttendance();
  };

  return { attendances, todayAttendance, isLoading, error, checkIn, checkOut, refetch: fetchAttendance };
}
