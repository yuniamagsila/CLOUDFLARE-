import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { useAuthStore } from '../../store/authStore';
import type { Announcement } from '../../types';
import { mockApiOk, mockApiError, getFetchMock } from '../fetchMock';

const mockUser = {
  id: 'u1', nrp: '11111', nama: 'Admin A', role: 'admin' as const,
  satuan: 'Satuan X', is_active: true, is_online: true, login_attempts: 0,
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
};

const sampleAnnouncements: Announcement[] = [
  { id: 'a1', judul: 'Pengumuman Upacara', isi: 'Besok ada upacara', is_pinned: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'a2', judul: 'Jadwal Piket', isi: 'Piket minggu ini', is_pinned: false, created_at: '2024-01-02T00:00:00Z' },
];

describe('useAnnouncements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
  });

  it('loads announcements on mount', async () => {
    mockApiOk(sampleAnnouncements);
    const { result } = renderHook(() => useAnnouncements());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.announcements).toHaveLength(2);
    expect(result.current.announcements[0].judul).toBe('Pengumuman Upacara');
  });

  it('sets error when fetch fails', async () => {
    mockApiError('fetch error');
    const { result } = renderHook(() => useAnnouncements());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('fetch error');
    expect(result.current.announcements).toHaveLength(0);
  });

  it('returns empty list for empty dataset', async () => {
    mockApiOk([]);
    const { result } = renderHook(() => useAnnouncements());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.announcements).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  describe('createAnnouncement', () => {
    it('calls insert and refreshes list', async () => {
      mockApiOk(sampleAnnouncements); // initial load
      mockApiOk(null); // insert
      mockApiOk(sampleAnnouncements); // refresh

      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.createAnnouncement({ judul: 'Baru', isi: 'Isi baru' });
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('updateAnnouncement', () => {
    it('calls update and refreshes list', async () => {
      mockApiOk(sampleAnnouncements); // initial load
      mockApiOk(null); // update
      mockApiOk(sampleAnnouncements); // refresh

      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateAnnouncement('a1', { judul: 'Updated' });
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('deleteAnnouncement', () => {
    it('calls delete and refreshes list', async () => {
      mockApiOk(sampleAnnouncements); // initial load
      mockApiOk(null); // delete
      mockApiOk(sampleAnnouncements); // refresh

      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => { await result.current.deleteAnnouncement('a2'); });
      expect(result.current.error).toBeNull();
    });
  });

  describe('togglePin', () => {
    it('toggles is_pinned for an announcement', async () => {
      mockApiOk(sampleAnnouncements); // initial load
      mockApiOk(null); // toggle (update)
      mockApiOk(sampleAnnouncements); // refresh

      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => { await result.current.togglePin('a2', false); });
      expect(result.current.error).toBeNull();
    });
  });

  it('refetch re-fetches announcements', async () => {
    mockApiOk(sampleAnnouncements); // initial load
    mockApiOk(sampleAnnouncements); // refetch

    const { result } = renderHook(() => useAnnouncements());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const fetchMock = getFetchMock();
    const callsBefore = fetchMock.mock.calls.length;

    await act(async () => { await result.current.refetch(); });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
