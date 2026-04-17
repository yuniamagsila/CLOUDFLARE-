import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchLogisticsRequests,
  insertLogisticsRequest,
  patchLogisticsRequestStatus,
} from '../../../lib/api/logistics';
import type { LogisticsRequest } from '../../../types';
import { mockApiOk, mockApiError } from '../../fetchMock';

const now = new Date().toISOString();
const sampleRequests: LogisticsRequest[] = [
  {
    id: 'logreq1', nama_item: 'Senapan', jumlah: 5, alasan: 'Latihan',
    requested_by: 'u1', satuan: 'Batalyon 1', status: 'pending', created_at: now,
  },
];

describe('logistics API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('fetchLogisticsRequests', () => {
    it('returns requests', async () => {
      mockApiOk(sampleRequests);
      const result = await fetchLogisticsRequests();
      expect(result).toHaveLength(1);
    });

    it('returns empty array', async () => {
      mockApiOk([]);
      expect(await fetchLogisticsRequests()).toEqual([]);
    });

    it('throws on error', async () => {
      mockApiError('fetch failed');
      await expect(fetchLogisticsRequests()).rejects.toThrow('fetch failed');
    });
  });

  describe('insertLogisticsRequest', () => {
    it('succeeds', async () => {
      mockApiOk(null);
      await expect(insertLogisticsRequest({
        nama_item: 'Senapan', jumlah: 2, alasan: 'Latihan',
        requested_by: 'u1', satuan: 'Batalyon 1',
      })).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockApiError('insert failed');
      await expect(insertLogisticsRequest({
        nama_item: 'X', jumlah: 1, alasan: 'Y',
        requested_by: 'u1', satuan: 'B1',
      })).rejects.toThrow('insert failed');
    });
  });

  describe('patchLogisticsRequestStatus', () => {
    it('succeeds', async () => {
      mockApiOk(null);
      await expect(patchLogisticsRequestStatus('logreq1', 'approved', 'u2')).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      mockApiError('patch failed');
      await expect(patchLogisticsRequestStatus('logreq1', 'rejected', 'u2')).rejects.toThrow('patch failed');
    });
  });
});
