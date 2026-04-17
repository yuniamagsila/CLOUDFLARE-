import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchLeaveRequests,
  insertLeaveRequest,
  patchLeaveRequestStatus,
} from '../../../lib/api/leaveRequests';
import type { LeaveRequest } from '../../../types';
import { mockApiOk, mockApiError } from '../../fetchMock';

const now = new Date().toISOString();
const sampleRequests: LeaveRequest[] = [
  {
    id: 'lr1', user_id: 'u1', jenis_izin: 'cuti',
    tanggal_mulai: now, tanggal_selesai: now, alasan: 'Keluarga',
    status: 'pending', created_at: now, updated_at: now,
  },
];

describe('leaveRequests API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('fetchLeaveRequests', () => {
    it('returns leave requests', async () => {
      mockApiOk(sampleRequests);
      const result = await fetchLeaveRequests();
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no data', async () => {
      mockApiOk([]);
      const result = await fetchLeaveRequests();
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockApiError('fetch failed');
      await expect(fetchLeaveRequests()).rejects.toThrow('fetch failed');
    });
  });

  describe('insertLeaveRequest', () => {
    it('succeeds on valid data', async () => {
      mockApiOk(null);
      await expect(insertLeaveRequest({
        user_id: 'u1', jenis_izin: 'cuti',
        tanggal_mulai: now, tanggal_selesai: now, alasan: 'Test',
      })).resolves.toBeUndefined();
    });

    it('throws when insert fails', async () => {
      mockApiError('insert failed');
      await expect(insertLeaveRequest({
        user_id: 'u1', jenis_izin: 'sakit',
        tanggal_mulai: now, tanggal_selesai: now, alasan: 'Sakit',
      })).rejects.toThrow('insert failed');
    });
  });

  describe('patchLeaveRequestStatus', () => {
    it('succeeds on valid update', async () => {
      mockApiOk(null);
      await expect(patchLeaveRequestStatus('lr1', 'approved', 'u2')).resolves.toBeUndefined();
    });

    it('throws when update fails', async () => {
      mockApiError('patch failed');
      await expect(patchLeaveRequestStatus('lr1', 'rejected', 'u2')).rejects.toThrow('patch failed');
    });
  });
});
