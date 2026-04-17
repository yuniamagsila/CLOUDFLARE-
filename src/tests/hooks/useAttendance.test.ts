import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAttendance } from '../../hooks/useAttendance';
import { useAuthStore } from '../../store/authStore';
import type { Attendance } from '../../types';
import { mockApiOk, mockApiError } from '../fetchMock';

const mockUser = {
  id: 'user-1', nrp: '12345', nama: 'Prajurit A', role: 'prajurit' as const,
  satuan: 'Satuan A', is_active: true, is_online: true, login_attempts: 0,
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
};

const today = new Date().toISOString().split('T')[0];

const mockAttendances: Attendance[] = [
  { id: 'a1', user_id: 'user-1', tanggal: today, status: 'hadir', created_at: '2024-01-01T07:00:00Z' },
];

describe('useAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
  });

  it('loads attendance records on mount', async () => {
    mockApiOk(mockAttendances);
    const { result } = renderHook(() => useAttendance());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.attendances).toHaveLength(1);
    expect(result.current.todayAttendance?.tanggal).toBe(today);
  });

  it('sets error on fetch failure', async () => {
    mockApiError('fetch error');
    const { result } = renderHook(() => useAttendance());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('fetch error');
  });

  it('todayAttendance is null when no record for today exists', async () => {
    const pastRecord: Attendance = {
      id: 'a2', user_id: 'user-1', tanggal: '2020-01-01', status: 'hadir', created_at: '2020-01-01T07:00:00Z',
    };
    mockApiOk([pastRecord]);
    const { result } = renderHook(() => useAttendance());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.todayAttendance).toBeNull();
  });

  describe('checkIn', () => {
    it('throws if already checked in today', async () => {
      const checkedIn: Attendance = { ...mockAttendances[0], check_in: '2024-01-01T07:00:00Z' };
      mockApiOk([checkedIn]);
      const { result } = renderHook(() => useAttendance());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await expect(
        act(async () => { await result.current.checkIn(); })
      ).rejects.toThrow('Sudah check-in hari ini');
    });

    it('calls rpcCheckIn when no prior check-in', async () => {
      mockApiOk(mockAttendances); // initial load
      mockApiOk({}); // rpcCheckIn POST
      mockApiOk(mockAttendances); // re-fetch
      const { result } = renderHook(() => useAttendance());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await act(async () => { await result.current.checkIn(); });
      // No error thrown means success
    });
  });

  describe('checkOut', () => {
    it('throws if not checked in', async () => {
      mockApiOk(mockAttendances);
      const { result } = renderHook(() => useAttendance());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await expect(
        act(async () => { await result.current.checkOut(); })
      ).rejects.toThrow('Belum check-in hari ini');
    });

    it('throws if already checked out', async () => {
      const checkedOut: Attendance = {
        ...mockAttendances[0],
        check_in: '2024-01-01T07:00:00Z',
        check_out: '2024-01-01T16:00:00Z',
      };
      mockApiOk([checkedOut]);
      const { result } = renderHook(() => useAttendance());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await expect(
        act(async () => { await result.current.checkOut(); })
      ).rejects.toThrow('Sudah check-out hari ini');
    });

    it('calls rpcCheckOut when valid', async () => {
      const checkedIn: Attendance = { ...mockAttendances[0], check_in: '2024-01-01T07:00:00Z' };
      mockApiOk([checkedIn]); // initial load
      mockApiOk({}); // rpcCheckOut POST
      mockApiOk([checkedIn]); // re-fetch
      const { result } = renderHook(() => useAttendance());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await act(async () => { await result.current.checkOut(); });
    });
  });

  it('throws when no user is set', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    const { result } = renderHook(() => useAttendance());
    await expect(
      act(async () => { await result.current.checkIn(); })
    ).rejects.toThrow('User tidak ditemukan');
  });
});
