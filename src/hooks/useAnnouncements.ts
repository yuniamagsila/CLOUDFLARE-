import { useState, useEffect, useCallback } from 'react';
import { fetchAnnouncements as apiFetchAnnouncements, insertAnnouncement, patchAnnouncement, deleteAnnouncement as apiDeleteAnnouncement } from '../lib/api/announcements';
import { handleError } from '../lib/handleError';
import type { Announcement, Role } from '../types';
import { useAuthStore } from '../store/authStore';

export function useAnnouncements() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetchAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError(handleError(err, 'Gagal memuat pengumuman'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnnouncements();
  }, [fetchAnnouncements]);

  const createAnnouncement = async (data: {
    judul: string;
    isi: string;
    target_role?: Role[];
    target_satuan?: string;
    is_pinned?: boolean;
  }) => {
    await insertAnnouncement({ ...data, created_by: user?.id });
    await fetchAnnouncements();
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    await patchAnnouncement(id, updates);
    await fetchAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    await apiDeleteAnnouncement(id);
    await fetchAnnouncements();
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    await updateAnnouncement(id, { is_pinned: !isPinned });
  };

  return {
    announcements,
    isLoading,
    error,
    refetch: fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
  };
}
