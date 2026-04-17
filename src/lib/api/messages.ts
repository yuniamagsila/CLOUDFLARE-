import { apiRequest } from './client';
import type { Message } from '../../types';

export async function fetchInbox(userId: string): Promise<Message[]> {
  const data = await apiRequest<Message[]>('/messages/inbox', {
    query: { user_id: userId, order_by: 'created_at', ascending: false },
  });
  return data ?? [];
}

export async function fetchSent(userId: string): Promise<Message[]> {
  const data = await apiRequest<Message[]>('/messages/sent', {
    query: { user_id: userId, order_by: 'created_at', ascending: false },
  });
  return data ?? [];
}

export async function insertMessage(fromUser: string, toUser: string, isi: string): Promise<void> {
  await apiRequest<void>('/messages', {
    method: 'POST',
    body: { from_user: fromUser, to_user: toUser, isi },
  });
}

export async function markMessageRead(messageId: string): Promise<void> {
  await apiRequest<void>(`/messages/${messageId}/read`, { method: 'PATCH' });
}

export async function markAllMessagesRead(toUserId: string): Promise<void> {
  await apiRequest<void>('/messages/read-all', {
    method: 'PATCH',
    body: { to_user: toUserId },
  });
}
