import { useState, useEffect, useCallback } from 'react';
import { fetchAttendance as apiFetchAttendance, rpcCheckIn, rpcCheckOut } from '../lib/api/attendance';
import { handleError } from '../lib/handleError';
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
      const list = await apiFetchAttendance(targetUserId);
      setAttendances(list);
      setTodayAttendance(list.find((a) => a.tanggal === today) ?? null);
    } catch (err) {
      setError(handleError(err, 'Gagal memuat absensi'));
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
    await rpcCheckIn(targetUserId);
    await fetchAttendance();
  };

  const checkOut = async () => {
    if (!targetUserId) throw new Error('User tidak ditemukan');
    if (!todayAttendance?.check_in) throw new Error('Belum check-in hari ini');
    if (todayAttendance.check_out) throw new Error('Sudah check-out hari ini');
    await rpcCheckOut(targetUserId);
    await fetchAttendance();
  };

  return { attendances, todayAttendance, isLoading, error, checkIn, checkOut, refetch: fetchAttendance };
}
