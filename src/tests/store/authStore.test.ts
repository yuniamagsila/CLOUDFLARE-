import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { useAuthStore, saveSession } from '../../store/authStore';
import type { Role } from '../../types';
import { mockApiOk, mockApiError } from '../fetchMock';

const SESSION_KEY = 'karyo_session';

async function makeValidEncryptedSession(userId = 'u1', role: Role = 'admin') {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 8);
  await saveSession({ user_id: userId, role, expires_at: expiresAt.toISOString() });
}

async function makeExpiredEncryptedSession() {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() - 1);
  await saveSession({ user_id: 'u1', role: 'admin', expires_at: expiresAt.toISOString() });
}

const mockUser = {
  id: 'u1', nrp: '12345', nama: 'Test User', role: 'admin' as const,
  satuan: 'Satuan A', is_active: true, is_online: false,
  login_attempts: 0, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
};

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null, isAuthenticated: false, isLoading: false, error: null,
    });
    vi.clearAllMocks();
  });

  describe('restoreSession', () => {
    it('sets isLoading false when no session in localStorage', async () => {
      await act(async () => { await useAuthStore.getState().restoreSession(); });
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('clears session and does not authenticate if session is expired', async () => {
      await makeExpiredEncryptedSession();
      await act(async () => { await useAuthStore.getState().restoreSession(); });
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('clears session if user fetch fails', async () => {
      await makeValidEncryptedSession();
      mockApiError('db error', 500);
      await act(async () => { await useAuthStore.getState().restoreSession(); });
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('restores user and sets isAuthenticated when session is valid', async () => {
      await makeValidEncryptedSession('u1', 'admin');
      mockApiOk(mockUser);
      await act(async () => { await useAuthStore.getState().restoreSession(); });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.id).toBe('u1');
    });

    it('handles malformed session data gracefully', async () => {
      localStorage.setItem(SESSION_KEY, 'not-valid-json');
      await act(async () => { await useAuthStore.getState().restoreSession(); });
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears user and session when logged in', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      await makeValidEncryptedSession();
      mockApiOk(null); // /auth/logout
      await act(async () => { await useAuthStore.getState().logout(); });
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    });

    it('clears state even when no user is logged in', async () => {
      await act(async () => { await useAuthStore.getState().logout(); });
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useAuthStore.setState({ error: 'some error' });
      act(() => useAuthStore.getState().clearError());
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('updateOnlineStatus', () => {
    it('updates user is_online in store', async () => {
      useAuthStore.setState({ user: { ...mockUser, is_online: false } });
      mockApiOk(null); // /auth/online-status
      await act(async () => { await useAuthStore.getState().updateOnlineStatus(true); });
      expect(useAuthStore.getState().user?.is_online).toBe(true);
    });

    it('does nothing if no user is set', async () => {
      useAuthStore.setState({ user: null });
      await act(async () => { await useAuthStore.getState().updateOnlineStatus(true); });
    });
  });

  describe('login', () => {
    it('sets error state on wrong credentials', async () => {
      mockApiError('NRP atau PIN salah', 401);
      let thrown = false;
      await act(async () => {
        try { await useAuthStore.getState().login('99999', '0000'); }
        catch { thrown = true; }
      });
      expect(thrown).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toContain('NRP atau PIN salah');
    });

    it('sets error state on system error', async () => {
      mockApiError('kesalahan sistem', 500);
      let thrown = false;
      await act(async () => {
        try { await useAuthStore.getState().login('99999', '0000'); }
        catch { thrown = true; }
      });
      expect(thrown).toBe(true);
      expect(useAuthStore.getState().error).toContain('kesalahan sistem');
    });

    it('authenticates on successful login', async () => {
      mockApiOk({
        user: mockUser,
        session: { user_id: 'u1', role: 'admin' },
      });
      await act(async () => { await useAuthStore.getState().login('12345', '1234'); });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.id).toBe('u1');
      expect(localStorage.getItem('karyo_session')).not.toBeNull();
    });
  });
});
