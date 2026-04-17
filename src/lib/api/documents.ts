import { apiRequest } from './client';
import type { Document } from '../../types';

export async function fetchDocuments(): Promise<Document[]> {
  const data = await apiRequest<Document[]>('/documents', {
    query: { order_by: 'created_at', ascending: false },
  });
  return data ?? [];
}

export async function insertDocument(data: {
  nama: string;
  kategori?: string | null;
  file_url: string;
  satuan?: string | null;
  file_size?: number | null;
}): Promise<void> {
  await apiRequest<void>('/documents', { method: 'POST', body: data });
}

export async function deleteDocument(id: string): Promise<void> {
  await apiRequest<void>(`/documents/${id}`, { method: 'DELETE' });
}
