import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGatePass } from '../../hooks/useGatePass';
import { useAuthStore } from '../../store/authStore';
import type { GatePass } from '../../types';
import { mockApiOk, mockApiError } from '../fetchMock';

const sampleGatePasses: GatePass[] = [
  {
    id: 'gp1',
    user_id: 'u1',
    qr_token: 'token-123',
    status: 'pending',
    created_at: '2026-04-14T00:00:00Z',
    updated_at: '2026-04-14T00:00:00Z',
  } as GatePass,
];

describe('useGatePass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u1', nrp: '11111', nama: 'Prajurit A', role: 'prajurit',
        satuan: 'Satuan X', is_active: true, is_online: true, login_attempts: 0,
        created_at: '2026-04-14T00:00:00Z', updated_at: '2026-04-14T00:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
  });

  it('loads gate passes on mount', async () => {
    mockApiOk(sampleGatePasses);
    const { result } = renderHook(() => useGatePass());

    await waitFor(() => expect(result.current.gatePasses).toHaveLength(1));
    expect(result.current.gatePasses[0].id).toBe('gp1');
  });

  it('returns empty list when no gate passes', async () => {
    mockApiOk([]);
    const { result } = renderHook(() => useGatePass());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.gatePasses).toHaveLength(0);
  });

  it('sets error when fetch fails', async () => {
    mockApiError('fetch error');
    const { result } = renderHook(() => useGatePass());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });

  it('creates a gate pass and refetches list', async () => {
    mockApiOk(sampleGatePasses); // initial load
    mockApiOk(null); // insertGatePass
    mockApiOk(sampleGatePasses); // re-fetch

    const { result } = renderHook(() => useGatePass());
    await waitFor(() => expect(result.current.gatePasses).toHaveLength(1));

    await act(async () => {
      await result.current.createGatePass({ keperluan: 'Kunjungan' });
    });

    expect(result.current.gatePasses).toHaveLength(1);
  });
});
