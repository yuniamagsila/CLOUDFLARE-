import { apiRequest } from './client';
import type { Announcement, Role } from '../../types';

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const data = await apiRequest<Announcement[]>('/announcements', {
    query: { order_by: 'is_pinned', ascending: false },
  });
  return data ?? [];
}

export async function insertAnnouncement(data: {
  judul: string;
  isi: string;
  created_by?: string;
  target_role?: Role[];
  target_satuan?: string;
  is_pinned?: boolean;
}): Promise<void> {
  await apiRequest<void>('/announcements', { method: 'POST', body: data });
}

export async function patchAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  await apiRequest<void>(`/announcements/${id}`, { method: 'PATCH', body: updates });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await apiRequest<void>(`/announcements/${id}`, { method: 'DELETE' });
}
