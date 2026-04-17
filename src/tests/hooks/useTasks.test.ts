import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTasks, clearTasksCache } from '../../hooks/useTasks';
import { useAuthStore } from '../../store/authStore';
import type { Task } from '../../types';
import { mockApiOk, mockApiError } from '../fetchMock';

const mockUser = {
  id: 'user-1', nrp: '12345', nama: 'Komandan A', role: 'komandan' as const,
  satuan: 'Satuan A', is_active: true, is_online: true, login_attempts: 0,
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
};

const mockTasks: Task[] = [
  {
    id: 't1', judul: 'Tugas Pertama', status: 'pending', prioritas: 1,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't2', judul: 'Tugas Kedua', status: 'in_progress', prioritas: 2,
    created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTasksCache();
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
  });

  it('loads tasks on mount', async () => {
    mockApiOk(mockTasks);
    const { result } = renderHook(() => useTasks());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0].judul).toBe('Tugas Pertama');
  });

  it('sets error when fetch fails', async () => {
    mockApiError('db error');
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('db error');
    expect(result.current.tasks).toHaveLength(0);
  });

  it('createTask calls insertTask and refreshes', async () => {
    mockApiOk(mockTasks); // initial load
    mockApiOk(null); // insertTask POST
    mockApiOk(mockTasks); // re-fetch

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask({ judul: 'New Task', assigned_to: 'user-2', prioritas: 1 });
    });
    expect(result.current.error).toBeNull();
  });

  it('createTask throws when insert fails', async () => {
    mockApiOk(mockTasks); // initial load
    mockApiError('insert failed'); // insertTask fails

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.createTask({ judul: 'Bad', assigned_to: 'u2', prioritas: 2 });
      })
    ).rejects.toThrow('insert failed');
  });

  it('approveTask calls patchTaskStatus with approved', async () => {
    mockApiOk(mockTasks); // initial load
    mockApiOk(null); // patchTaskStatus PATCH
    mockApiOk(mockTasks); // re-fetch

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.approveTask('t1'); });
    expect(result.current.error).toBeNull();
  });

  it('rejectTask saves rejection note and sets status to in_progress', async () => {
    mockApiOk(mockTasks); // initial load
    mockApiOk(null); // insertTaskReport POST
    mockApiOk(null); // patchTaskStatus PATCH
    mockApiOk(mockTasks); // re-fetch

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.rejectTask('t1', 'Revisi diperlukan'); });
    expect(result.current.error).toBeNull();
  });

  it('rejectTask without note skips insertTaskReport', async () => {
    mockApiOk(mockTasks); // initial load
    mockApiOk(null); // patchTaskStatus PATCH
    mockApiOk(mockTasks); // re-fetch

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.rejectTask('t1'); });
    expect(result.current.error).toBeNull();
  });

  it('submitTaskReport inserts report and sets status to done', async () => {
    mockApiOk(mockTasks); // initial load
    mockApiOk(null); // insertTaskReport POST
    mockApiOk(null); // patchTaskStatus PATCH (status=done)
    mockApiOk(mockTasks); // re-fetch

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.submitTaskReport('t1', 'Laporan selesai'); });
    expect(result.current.error).toBeNull();
  });

  it('getTaskReport fetches the latest report for a task', async () => {
    const mockReport = { id: 'r1', task_id: 't1', isi_laporan: 'report' };
    mockApiOk(mockTasks); // initial load
    mockApiOk(mockReport); // fetchLatestTaskReport GET

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let report: unknown;
    await act(async () => { report = await result.current.getTaskReport('t1'); });
    expect(report).toEqual(mockReport);
  });

  it('getTaskReport returns null when not found', async () => {
    mockApiOk(mockTasks); // initial load
    mockApiError('not found', 404); // fetchLatestTaskReport throws -> caught -> null

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let report: unknown;
    await act(async () => { report = await result.current.getTaskReport('t99'); });
    expect(report).toBeNull();
  });
});
