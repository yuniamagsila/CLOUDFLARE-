import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAuditLogs } from '../../../lib/api/auditLogs';
import type { AuditLog } from '../../../types';
import { mockApiOk, mockApiError } from '../../fetchMock';

const sampleLogs: AuditLog[] = [
  { id: 'al1', user_id: 'u1', action: 'login', created_at: '2024-01-01T00:00:00Z', details: {} },
  { id: 'al2', user_id: 'u2', action: 'logout', created_at: '2024-01-02T00:00:00Z', details: {} },
];

describe('auditLogs API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('fetchAuditLogs', () => {
    it('returns list of audit logs', async () => {
      mockApiOk(sampleLogs);
      const result = await fetchAuditLogs();
      expect(result).toHaveLength(2);
    });

    it('filters by userId', async () => {
      mockApiOk([sampleLogs[0]]);
      const result = await fetchAuditLogs({ userId: 'u1' });
      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('u1');
    });

    it('returns empty array when no logs', async () => {
      mockApiOk([]);
      const result = await fetchAuditLogs();
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockApiError('fetch failed');
      await expect(fetchAuditLogs()).rejects.toThrow('fetch failed');
    });
  });
});
