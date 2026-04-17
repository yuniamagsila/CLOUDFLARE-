import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePosJagaStore } from '../../store/posJagaStore';
import { useAuthStore } from '../../store/authStore';
import type { PosJaga, ScanPosJagaResult } from '../../types';
import { mockApiOk, mockApiError } from '../fetchMock';

const now = new Date().toISOString();

const samplePos: PosJaga[] = [
  { id: 'p1', nama: 'Pos Jaga Utara', pos_token: 'token-utara', is_active: true, created_at: now },
  { id: 'p2', nama: 'Pos Jaga Selatan', pos_token: 'token-selatan', is_active: false, created_at: now },
];

const mockUser = {
  id: 'u1', nrp: '11111', nama: 'Prajurit A', role: 'prajurit' as const,
  satuan: 'Satuan X', is_active: true, is_online: true, login_attempts: 0,
  created_at: now, updated_at: now,
};

describe('posJagaStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePosJagaStore.setState({ posJagaList: [] });
    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
  });

  describe('fetchPosJaga', () => {
    it('fetches all pos jaga and updates store', async () => {
      mockApiOk(samplePos);
      await usePosJagaStore.getState().fetchPosJaga();
      expect(usePosJagaStore.getState().posJagaList).toHaveLength(2);
      expect(usePosJagaStore.getState().posJagaList[0].nama).toBe('Pos Jaga Utara');
    });

    it('throws on api error', async () => {
      mockApiError('db error');
      await expect(usePosJagaStore.getState().fetchPosJaga()).rejects.toThrow('db error');
    });
  });

  describe('createPosJaga', () => {
    it('inserts a new pos jaga then refreshes list', async () => {
      mockApiOk(null); // insertPosJaga
      mockApiOk(samplePos); // fetchPosJaga re-fetch

      await usePosJagaStore.getState().createPosJaga('Pos Baru');
      expect(usePosJagaStore.getState().posJagaList).toHaveLength(2);
    });

    it('throws when insert fails', async () => {
      mockApiError('insert error');
      await expect(usePosJagaStore.getState().createPosJaga('X')).rejects.toThrow('insert error');
    });
  });

  describe('setActive', () => {
    it('activates a pos jaga and refreshes', async () => {
      mockApiOk(null); // patchPosJagaActive
      mockApiOk(samplePos); // re-fetch

      await usePosJagaStore.getState().setActive('p2', true);
      expect(usePosJagaStore.getState().posJagaList).toHaveLength(2);
    });

    it('deactivates a pos jaga', async () => {
      mockApiOk(null); // patchPosJagaActive
      mockApiOk(samplePos); // re-fetch

      await usePosJagaStore.getState().setActive('p1', false);
      // No error thrown means success
    });
  });

  describe('scanPosJaga', () => {
    it('calls rpcScanPosJaga with correct args and returns result', async () => {
      const scanResult: ScanPosJagaResult = {
        gate_pass_id: 'gp1',
        pos_nama: 'Pos Jaga Utara',
        status: 'out',
        message: 'Keluar berhasil dicatat',
      };
      mockApiOk(scanResult);

      const result = await usePosJagaStore.getState().scanPosJaga('token-utara');
      expect(result.status).toBe('out');
      expect(result.message).toBe('Keluar berhasil dicatat');
    });

    it('returns returned status when gate pass was already out', async () => {
      const scanResult: ScanPosJagaResult = {
        gate_pass_id: 'gp2',
        pos_nama: 'Pos Jaga Selatan',
        status: 'returned',
        message: 'Kembali berhasil dicatat',
      };
      mockApiOk(scanResult);

      const result = await usePosJagaStore.getState().scanPosJaga('token-selatan');
      expect(result.status).toBe('returned');
    });

    it('throws when no user is set', async () => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
      await expect(usePosJagaStore.getState().scanPosJaga('some-token')).rejects.toThrow(
        'User tidak ditemukan',
      );
    });

    it('throws when API returns an error', async () => {
      mockApiError('QR tidak valid');
      await expect(usePosJagaStore.getState().scanPosJaga('bad-token')).rejects.toThrow(
        'QR tidak valid',
      );
    });
  });
});
