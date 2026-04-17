import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import type { AuditLog } from '../../types';
import { mockApiOk, mockApiError, getFetchMock } from '../fetchMock';

const sampleLogs: AuditLog[] = [
  { id: 'l1', action: 'LOGIN', created_at: '2024-01-01T08:00:00Z' },
  { id: 'l2', user_id: 'u1', action: 'GATE_PASS_CREATE', created_at: '2024-01-01T09:00:00Z' },
] as AuditLog[];

describe('useAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads audit logs on mount', async () => {
    mockApiOk(sampleLogs);
    const { result } = renderHook(() => useAuditLogs());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.logs).toHaveLength(2);
    expect(result.current.logs[0].action).toBe('LOGIN');
  });

  it('sets error when fetch fails', async () => {
    mockApiError('db error');
    const { result } = renderHook(() => useAuditLogs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('db error');
    expect(result.current.logs).toHaveLength(0);
  });

  it('returns empty list for empty dataset', async () => {
    mockApiOk([]);
    const { result } = renderHook(() => useAuditLogs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.logs).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('refetch re-fetches audit logs', async () => {
    mockApiOk(sampleLogs);
    mockApiOk(sampleLogs);
    const { result } = renderHook(() => useAuditLogs());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsBefore = getFetchMock().mock.calls.length;
    await act(async () => { await result.current.refetch(); });
    expect(getFetchMock().mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('passes userId filter in query', async () => {
    mockApiOk([sampleLogs[1]]);
    const { result } = renderHook(() => useAuditLogs({ userId: 'u1' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].user_id).toBe('u1');
  });

  it('passes action filter in query', async () => {
    mockApiOk([sampleLogs[0]]);
    const { result } = renderHook(() => useAuditLogs({ action: 'LOGIN' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].action).toBe('LOGIN');
  });
});
