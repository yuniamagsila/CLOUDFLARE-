import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLogisticsRequests } from '../../hooks/useLogisticsRequests';
import { useAuthStore } from '../../store/authStore';
import type { LogisticsRequest } from '../../types';
import { mockApiOk, mockApiError } from '../fetchMock';

const mockUser = {
  id: 'u1', nrp: '11111', nama: 'Prajurit A', role: 'prajurit' as const,
  satuan: 'Satuan X', is_active: true, is_online: true, login_attempts: 0,
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
};

const sampleRequests: LogisticsRequest[] = [
  {
    id: 'req1', nama_item: 'Peluru', jumlah: 100, satuan_item: 'butir',
    alasan: 'Latihan', requested_by: 'u1', satuan: 'Satuan X',
    status: 'pending', created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'req2', nama_item: 'Seragam', jumlah: 5, satuan_item: 'buah',
    alasan: 'Rusak', requested_by: 'u2', satuan: 'Satuan Y',
    status: 'approved', created_at: '2024-01-02T00:00:00Z',
  },
] as LogisticsRequest[];

describe('useLogisticsRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
  });

  it('loads logistics requests on mount', async () => {
    mockApiOk(sampleRequests);
    const { result } = renderHook(() => useLogisticsRequests());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toHaveLength(2);
    expect(result.current.requests[0].nama_item).toBe('Peluru');
  });

  it('sets error when fetch fails', async () => {
    mockApiError('fetch error');
    const { result } = renderHook(() => useLogisticsRequests());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('fetch error');
    expect(result.current.requests).toHaveLength(0);
  });

  it('returns empty list for empty dataset', async () => {
    mockApiOk([]);
    const { result } = renderHook(() => useLogisticsRequests());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  describe('submitRequest', () => {
    it('inserts request and refreshes', async () => {
      mockApiOk(sampleRequests); // initial load
      mockApiOk(null); // insertLogisticsRequest
      mockApiOk(sampleRequests); // re-fetch

      const { result } = renderHook(() => useLogisticsRequests());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.submitRequest({ nama_item: 'Baju', jumlah: 2, alasan: 'Perlu' });
      });
      expect(result.current.error).toBeNull();
    });

    it('throws when not authenticated', async () => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
      mockApiOk([]);
      const { result } = renderHook(() => useLogisticsRequests());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.submitRequest({ nama_item: 'X', jumlah: 1, alasan: 'Y' });
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('reviewRequest', () => {
    it('updates status and refreshes', async () => {
      mockApiOk(sampleRequests); // initial load
      mockApiOk(null); // patchLogisticsRequestStatus
      mockApiOk(sampleRequests); // re-fetch

      const { result } = renderHook(() => useLogisticsRequests());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.reviewRequest('req1', 'approved', 'Disetujui');
      });
      expect(result.current.error).toBeNull();
    });

    it('throws when not authenticated', async () => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
      mockApiOk([]);
      const { result } = renderHook(() => useLogisticsRequests());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => { await result.current.reviewRequest('req1', 'rejected'); })
      ).rejects.toThrow('Not authenticated');
    });
  });
});
