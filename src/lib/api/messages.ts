import { supabase } from '../supabase';
import type { Message } from '../../types';

export async function fetchInbox(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:from_user(id,nama,nrp,pangkat), receiver:to_user(id,nama,nrp)')
    .eq('to_user', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Message[]) ?? [];
}

export async function fetchSent(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:from_user(id,nama,nrp), receiver:to_user(id,nama,nrp,pangkat)')
    .eq('from_user', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Message[]) ?? [];
}

export async function insertMessage(fromUser: string, toUser: string, isi: string): Promise<void> {
  const { error } = await supabase.from('messages').insert({ from_user: fromUser, to_user: toUser, isi });
  if (error) throw error;
}

export async function markMessageRead(messageId: string): Promise<void> {
  const { error } = await supabase.from('messages').update({ is_read: true }).eq('id', messageId);
  if (error) throw error;
}

export async function markAllMessagesRead(toUserId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('to_user', toUserId)
    .eq('is_read', false);
  if (error) throw error;
}
