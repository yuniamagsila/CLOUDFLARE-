import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsers } from '../../hooks/useUsers';
import type { User } from '../../types';
import { mockApiOk, mockApiError } from '../fetchMock';

const mockUsers: User[] = [
  {
    id: 'u1', nrp: '11111', nama: 'Alpha', role: 'prajurit',
    satuan: 'Satuan A', is_active: true, is_online: false,
    login_attempts: 0, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u2', nrp: '22222', nama: 'Bravo', role: 'komandan',
    satuan: 'Satuan B', is_active: false, is_online: false,
    login_attempts: 0, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads users on mount', async () => {
    mockApiOk(mockUsers);
    const { result } = renderHook(() => useUsers());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.users).toHaveLength(2);
  });

  it('sets error when fetch fails', async () => {
    mockApiError('connection refused');
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('connection refused');
    expect(result.current.users).toHaveLength(0);
  });

  it('returns empty list and no error for empty dataset', async () => {
    mockApiOk([]);
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.users).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  describe('createUser', () => {
    it('calls POST /api/users and refreshes list', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiOk({ id: 'new-id' }); // createUser POST
      mockApiOk(mockUsers); // refresh after create

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.createUser({
          nrp: '33333', pin: '5678', nama: 'Charlie',
          role: 'prajurit', satuan: 'Satuan C', is_active: true,
        });
      });
      expect(result.current.error).toBeNull();
    });

    it('throws when create fails', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiError('rpc error'); // createUser fails

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.createUser({
            nrp: '33333', pin: '5678', nama: 'Charlie',
            role: 'prajurit', satuan: 'Satuan C', is_active: true,
          });
        })
      ).rejects.toThrow('rpc error');
    });
  });

  describe('updateUser', () => {
    it('calls PATCH /api/users/:id and succeeds', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiOk(null); // updateUser PATCH

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => { await result.current.updateUser('u1', { nama: 'Alpha Updated' }); });
      expect(result.current.error).toBeNull();
    });

    it('throws when update fails', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiError('update failed'); // PATCH fails

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => { await result.current.updateUser('u1', { nama: 'Fail' }); })
      ).rejects.toThrow('update failed');
    });
  });

  describe('toggleUserActive', () => {
    it('calls updateUser with is_active flag', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiOk(null); // toggleUserActive

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => { await result.current.toggleUserActive('u2', true); });
      expect(result.current.error).toBeNull();
    });
  });

  describe('resetUserPin', () => {
    it('calls POST /api/users/:id/reset-pin', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiOk(null); // resetUserPin

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => { await result.current.resetUserPin('u1', '9999'); });
      expect(result.current.error).toBeNull();
    });

    it('throws when reset fails', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiError('pin reset failed'); // POST fails

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => { await result.current.resetUserPin('u1', '0000'); })
      ).rejects.toThrow('pin reset failed');
    });
  });

  describe('getUserById', () => {
    it('returns user by id', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiOk(mockUsers[0]); // getUserById

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let user: User | undefined;
      await act(async () => { user = await result.current.getUserById('u1'); });
      expect(user?.id).toBe('u1');
    });

    it('throws when user not found', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiError('not found', 404); // getUserById fails

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => { await result.current.getUserById('invalid-id'); })
      ).rejects.toThrow('not found');
    });
  });

  describe('updateOwnProfile', () => {
    it('calls PATCH /api/users/:id/profile', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiOk(null); // updateOwnProfile

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateOwnProfile('u1', {
          no_telepon: '081234567890', alamat: 'Jl. Merdeka No. 1',
        });
      });
      expect(result.current.error).toBeNull();
    });

    it('throws when update fails', async () => {
      mockApiOk(mockUsers); // initial load
      mockApiError('not authorized'); // PATCH fails

      const { result } = renderHook(() => useUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => { await result.current.updateOwnProfile('u2', { no_telepon: '0812' }); })
      ).rejects.toThrow('not authorized');
    });
  });
});
