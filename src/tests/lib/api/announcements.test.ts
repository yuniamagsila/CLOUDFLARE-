import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAnnouncements,
  insertAnnouncement,
  patchAnnouncement,
  deleteAnnouncement,
} from '../../../lib/api/announcements';
import type { Announcement } from '../../../types';
import { mockApiOk, mockApiError } from '../../fetchMock';

const sampleAnnouncements: Announcement[] = [
  {
    id: 'a1',
    judul: 'Pengumuman Upacara',
    isi: 'Upacara bendera dilaksanakan besok pagi',
    is_pinned: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'a2',
    judul: 'Jadwal Piket',
    isi: 'Harap cek jadwal piket minggu ini',
    is_pinned: false,
    created_at: '2024-01-02T00:00:00Z',
  },
];

describe('announcements API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAnnouncements', () => {
    it('returns list of announcements', async () => {
      mockApiOk(sampleAnnouncements);
      const result = await fetchAnnouncements();
      expect(result).toHaveLength(2);
      expect(result[0].judul).toBe('Pengumuman Upacara');
    });

    it('returns empty array when data is null', async () => {
      mockApiOk(null);
      const result = await fetchAnnouncements();
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockApiError('fetch failed');
      await expect(fetchAnnouncements()).rejects.toThrow('fetch failed');
    });
  });

  describe('insertAnnouncement', () => {
    it('succeeds when insert returns ok', async () => {
      mockApiOk(null);
      await expect(
        insertAnnouncement({ judul: 'Test', isi: 'Isi test', is_pinned: false })
      ).resolves.toBeUndefined();
    });

    it('throws when insert fails', async () => {
      mockApiError('insert failed');
      await expect(insertAnnouncement({ judul: 'X', isi: 'Y' })).rejects.toThrow('insert failed');
    });
  });

  describe('patchAnnouncement', () => {
    it('succeeds when patch returns ok', async () => {
      mockApiOk(null);
      await expect(patchAnnouncement('a1', { is_pinned: true })).resolves.toBeUndefined();
    });

    it('throws when patch fails', async () => {
      mockApiError('patch failed');
      await expect(patchAnnouncement('a1', { judul: 'New' })).rejects.toThrow('patch failed');
    });
  });

  describe('deleteAnnouncement', () => {
    it('succeeds when delete returns ok', async () => {
      mockApiOk(null);
      await expect(deleteAnnouncement('a2')).resolves.toBeUndefined();
    });

    it('throws when delete fails', async () => {
      mockApiError('delete failed');
      await expect(deleteAnnouncement('a99')).rejects.toThrow('delete failed');
    });
  });
});
