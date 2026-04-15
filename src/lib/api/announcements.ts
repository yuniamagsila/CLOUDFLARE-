import { supabase } from '../supabase';
import type { Announcement, Role } from '../../types';

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, creator:created_by(id,nama,nrp,role)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Announcement[]) ?? [];
}

export async function insertAnnouncement(data: {
  judul: string;
  isi: string;
  created_by?: string;
  target_role?: Role[];
  target_satuan?: string;
  is_pinned?: boolean;
}): Promise<void> {
  const { error } = await supabase.from('announcements').insert(data);
  if (error) throw error;
}

export async function patchAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  const { error } = await supabase.from('announcements').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
}
