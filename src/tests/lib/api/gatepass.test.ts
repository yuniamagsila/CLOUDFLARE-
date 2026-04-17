import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchGatePassesByUser,
  fetchAllGatePasses,
  fetchGatePassByQrToken,
  insertGatePass,
  patchGatePassStatus,
  rpcScanGatePass,
} from '../../../lib/api/gatepass';
import type { GatePass } from '../../../types';
import { mockApiOk, mockApiError } from '../../fetchMock';

const now = new Date().toISOString();
const sampleGatePasses: GatePass[] = [
  {
    id: 'gp1', user_id: 'u1', keperluan: 'Cuti', tujuan: 'Rumah',
    waktu_keluar: now, waktu_kembali: now, status: 'pending',
    qr_token: 'qr-1', created_at: now, updated_at: now,
  },
];

describe('gatepass API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchGatePassesByUser', () => {
    it('returns gate passes for a user', async () => {
      mockApiOk(sampleGatePasses);
      const result = await fetchGatePassesByUser('u1');
      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('u1');
    });

    it('returns empty array when no gate passes', async () => {
      mockApiOk([]);
      const result = await fetchGatePassesByUser('u1');
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockApiError('fetch error');
      await expect(fetchGatePassesByUser('u1')).rejects.toThrow('fetch error');
    });
  });

  describe('fetchAllGatePasses', () => {
    it('returns all gate passes', async () => {
      mockApiOk(sampleGatePasses);
      const result = await fetchAllGatePasses();
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no data', async () => {
      mockApiOk([]);
      const result = await fetchAllGatePasses();
      expect(result).toEqual([]);
    });
  });

  describe('fetchGatePassByQrToken', () => {
    it('returns gate pass matching QR token', async () => {
      mockApiOk(sampleGatePasses[0]);
      const result = await fetchGatePassByQrToken('qr-1');
      expect(result?.qr_token).toBe('qr-1');
    });

    it('returns null when not found', async () => {
      mockApiError('not found', 404);
      const result = await fetchGatePassByQrToken('missing');
      expect(result).toBeNull();
    });
  });

  describe('insertGatePass', () => {
    it('succeeds with valid payload', async () => {
      mockApiOk(null);
      await expect(insertGatePass({
        user_id: 'u1', qr_token: 'qr-new',
        keperluan: 'Cuti', tujuan: 'Rumah',
        waktu_keluar: now, waktu_kembali: now,
      })).resolves.toBeUndefined();
    });

    it('throws when insert fails', async () => {
      mockApiError('insert failed');
      await expect(insertGatePass({ user_id: 'u1', qr_token: 'x' })).rejects.toThrow('insert failed');
    });
  });

  describe('patchGatePassStatus', () => {
    it('succeeds with valid update', async () => {
      mockApiOk(null);
      await expect(patchGatePassStatus('gp1', 'approved', 'u2')).resolves.toBeUndefined();
    });

    it('throws when update fails', async () => {
      mockApiError('update failed');
      await expect(patchGatePassStatus('gp1', 'rejected')).rejects.toThrow('update failed');
    });
  });

  describe('rpcScanGatePass', () => {
    it('returns message on success', async () => {
      mockApiOk({ message: 'Keluar berhasil' });
      const result = await rpcScanGatePass('qr-1');
      expect(result).toBe('Keluar berhasil');
    });

    it('returns fallback message when no message field', async () => {
      mockApiOk({});
      const result = await rpcScanGatePass('qr-1');
      expect(result).toBe('Scan berhasil');
    });

    it('throws on RPC error', async () => {
      mockApiError('QR tidak valid');
      await expect(rpcScanGatePass('bad')).rejects.toThrow('QR tidak valid');
    });
  });
});
