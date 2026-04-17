import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAllPosJaga,
  insertPosJaga,
  patchPosJagaActive,
  rpcScanPosJaga,
} from '../../../lib/api/posJaga';
import type { PosJaga } from '../../../types';
import { mockApiOk, mockApiError } from '../../fetchMock';

const samplePosJaga: PosJaga[] = [
  { id: 'pj1', nama: 'Pos Utama', is_active: true, pos_token: 'tok1', created_at: '2024-01-01T00:00:00Z' },
];

describe('posJaga API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('fetchAllPosJaga', () => {
    it('returns list', async () => {
      mockApiOk(samplePosJaga);
      const result = await fetchAllPosJaga();
      expect(result).toHaveLength(1);
      expect(result[0].nama).toBe('Pos Utama');
    });

    it('returns empty array', async () => {
      mockApiOk([]);
      expect(await fetchAllPosJaga()).toEqual([]);
    });

    it('throws on error', async () => {
      mockApiError('fetch failed');
      await expect(fetchAllPosJaga()).rejects.toThrow('fetch failed');
    });
  });

  describe('insertPosJaga', () => {
    it('succeeds', async () => {
      mockApiOk(null);
      await expect(insertPosJaga({ nama: 'Pos Baru' })).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockApiError('insert failed');
      await expect(insertPosJaga({ nama: 'X' })).rejects.toThrow('insert failed');
    });
  });

  describe('patchPosJagaActive', () => {
    it('succeeds', async () => {
      mockApiOk(null);
      await expect(patchPosJagaActive('pj1', false)).resolves.toBeUndefined();
    });
  });

  describe('rpcScanPosJaga', () => {
    it('returns scan result', async () => {
      mockApiOk({ valid: true, message: 'Scan ok' });
      const result = await rpcScanPosJaga('tok1', 'u1');
      expect(result.valid).toBe(true);
    });

    it('throws when scan fails', async () => {
      mockApiError('QR tidak valid');
      await expect(rpcScanPosJaga('bad-token', 'u1')).rejects.toThrow('QR tidak valid');
    });
  });
});
