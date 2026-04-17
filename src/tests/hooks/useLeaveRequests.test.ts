import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLeaveRequests } from '../../hooks/useLeaveRequests';
import { useAuthStore } from '../../store/authStore';
import type { LeaveRequest } from '../../types';
import { mockApiOk, mockApiError } from '../fetchMock';

const mockUser = {
  id: 'user-1', nrp: '12345', nama: 'Prajurit A', role: 'prajurit' as const,
  satuan: 'Satuan A', is_active: true, is_online: true, login_attempts: 0,
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
};

const mockRequests: LeaveRequest[] = [
  {
    id: 'lr1', user_id: 'user-1', jenis_izin: 'cuti',
    tanggal_mulai: '2024-02-01', tanggal_selesai: '2024-02-05', alasan: 'Liburan',
    status: 'pending', created_at: '2024-01-15T00:00:00Z',
    user: { ...mockUser, satuan: 'Satuan A' },
  },
  {
    id: 'lr2', user_id: 'user-2', jenis_izin: 'sakit',
    tanggal_mulai: '2024-02-10', tanggal_selesai: '2024-02-12', alasan: 'Demam',
    status: 'approved', created_at: '2024-01-20T00:00:00Z',
    user: { ...mockUser, id: 'user-2', satuan: 'Satuan B' },
  },
];

describe('useLeaveRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
  });

  it('loads leave requests on mount', async () => {
    mockApiOk(mockRequests);
    const { result } = renderHook(() => useLeaveRequests());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toHaveLength(2);
  });

  it('sets error on fetch failure', async () => {
    mockApiError('network error');
    const { result } = renderHook(() => useLeaveRequests());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('network error');
  });

  it('filters by satuan via joined user data', async () => {
    mockApiOk(mockRequests);
    const { result } = renderHook(() => useLeaveRequests({ satuan: 'Satuan A' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toHaveLength(1);
    expect(result.current.requests[0].id).toBe('lr1');
  });

  it('returns all requests when no satuan filter', async () => {
    mockApiOk(mockRequests);
    const { result } = renderHook(() => useLeaveRequests());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toHaveLength(2);
  });

  describe('submitLeaveRequest', () => {
    it('inserts a leave request and refreshes', async () => {
      mockApiOk(mockRequests); // initial load
      mockApiOk(null); // insertLeaveRequest
      mockApiOk(mockRequests); // re-fetch

      const { result } = renderHook(() => useLeaveRequests());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.submitLeaveRequest({
          jenis_izin: 'cuti', tanggal_mulai: '2024-03-01',
          tanggal_selesai: '2024-03-05', alasan: 'Keluarga',
        });
      });
      expect(result.current.error).toBeNull();
    });

    it('throws when not authenticated', async () => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
      mockApiOk([]);
      const { result } = renderHook(() => useLeaveRequests());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.submitLeaveRequest({
            jenis_izin: 'sakit', tanggal_mulai: '2024-03-01',
            tanggal_selesai: '2024-03-03', alasan: 'Demam',
          });
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('throws when insert fails', async () => {
      mockApiOk([]); // initial load
      mockApiError('insert failed'); // insertLeaveRequest fails

      const { result } = renderHook(() => useLeaveRequests());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.submitLeaveRequest({
            jenis_izin: 'cuti', tanggal_mulai: '2024-04-01',
            tanggal_selesai: '2024-04-05', alasan: 'test',
          });
        })
      ).rejects.toThrow('insert failed');
    });
  });

  describe('reviewLeaveRequest', () => {
    it('updates status and refreshes', async () => {
      mockApiOk(mockRequests); // initial load
      mockApiOk(null); // patchLeaveRequestStatus
      mockApiOk(mockRequests); // re-fetch

      const { result } = renderHook(() => useLeaveRequests());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.reviewLeaveRequest('lr1', 'approved');
      });
      expect(result.current.error).toBeNull();
    });

    it('throws when not authenticated', async () => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
      mockApiOk([]);
      const { result } = renderHook(() => useLeaveRequests());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => { await result.current.reviewLeaveRequest('lr1', 'rejected'); })
      ).rejects.toThrow('Not authenticated');
    });
  });
});
