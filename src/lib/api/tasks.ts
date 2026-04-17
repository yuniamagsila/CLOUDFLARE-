import { apiRequest } from './client';
import type { Task, TaskReport, TaskStatus } from '../../types';

export interface FetchTasksParams {
  assignedTo?: string;
  assignedBy?: string;
  status?: TaskStatus;
  satuan?: string;
}

export async function fetchTasks(params: FetchTasksParams = {}): Promise<Task[]> {
  const data = await apiRequest<Task[]>('/tasks', {
    query: {
      assigned_to: params.assignedTo,
      assigned_by: params.assignedBy,
      status: params.status,
      satuan: params.satuan,
      order_by: 'created_at',
      ascending: false,
    },
  });
  return data ?? [];
}

export async function insertTask(taskData: {
  judul: string;
  deskripsi?: string;
  assigned_to: string;
  assigned_by?: string;
  deadline?: string;
  prioritas: 1 | 2 | 3;
  satuan?: string;
}): Promise<void> {
  await apiRequest<void>('/tasks', {
    method: 'POST',
    body: { ...taskData, status: 'pending' },
  });
}

export async function patchTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  await apiRequest<void>(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function insertTaskReport(report: {
  task_id: string;
  user_id?: string;
  isi_laporan: string;
  file_url?: string;
}): Promise<void> {
  await apiRequest<void>('/task_reports', { method: 'POST', body: report });
}

export async function fetchLatestTaskReport(taskId: string): Promise<TaskReport | null> {
  try {
    const data = await apiRequest<TaskReport>('/task_reports/latest', {
      query: { task_id: taskId },
    });
    return data ?? null;
  } catch {
    return null;
  }
}
