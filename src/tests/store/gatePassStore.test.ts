import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGatePassStore } from '../../store/gatePassStore';
import { useAuthStore } from '../../store/authStore';
import type { GatePass } from '../../types';
import { mockApiOk, mockApiError } from '../fetchMock';

const now = new Date();
const overdueTime = new Date(now.getTime() - 1000 * 60 * 60).toISOString();
const gatePassOut: GatePass = {
  id: 'gp1',
  user_id: 'u1',
  keperluan: 'Cuti',
  tujuan: 'Rumah',
  waktu_keluar: now.toISOString(),
  waktu_kembali: overdueTime,
  actual_keluar: now.toISOString(),
  actual_kembali: null,
  status: 'out',
  approved_by: 'u2',
  qr_token: 'qr-1',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
};

const approvedGatePass: GatePass = {
  id: 'gp2',
  user_id: 'u1',
  status: 'approved',
  actual_keluar: null,
  actual_kembali: null,
  waktu_keluar: now.toISOString(),
  waktu_kembali: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
  qr_token: 'qr-1',
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
};

describe('gatePassStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGatePassStore.setState({ gatePasses: [] });
    useAuthStore.setState({
      user: {
        id: 'u1', nrp: '11111', nama: 'Prajurit A', role: 'prajurit',
        satuan: 'Satuan X', is_active: true, is_online: true, login_attempts: 0,
        created_at: now.toISOString(), updated_at: now.toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
  });

  it('fetches gate passes and updates overdue status for prajurit', async () => {
    mockApiOk([gatePassOut]);
    const store = useGatePassStore.getState();
    await store.fetchGatePasses();
    expect(useGatePassStore.getState().gatePasses[0].status).toBe('overdue');
  });

  it('creates a gate pass and refreshes list', async () => {
    mockApiOk(null); // insertGatePass
    mockApiOk([gatePassOut]); // re-fetch
    const store = useGatePassStore.getState();
    await store.createGatePass({ tujuan: 'Aman' });
    expect(useGatePassStore.getState().gatePasses).toHaveLength(1);
  });

  it('approves a gate pass successfully', async () => {
    mockApiOk(null); // patchGatePassStatus
    mockApiOk([gatePassOut]); // re-fetch
    const store = useGatePassStore.getState();
    await store.approveGatePass('gp2', true);
    // No error thrown means success
  });

  it('scans approved gate pass and returns the updated GatePass object', async () => {
    useAuthStore.setState({
      user: {
        id: 'u2', nrp: '22222', nama: 'Guard A', role: 'guard',
        satuan: 'Pos X', is_active: true, is_online: true, login_attempts: 0,
        created_at: now.toISOString(), updated_at: now.toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      error: null,
    });

    mockApiOk({ message: 'Keluar berhasil' }); // rpcScanGatePass
    mockApiOk(approvedGatePass); // fetchGatePassByQrToken
    mockApiOk([approvedGatePass]); // fetchGatePasses (fetchAllGatePasses for guard)

    const store = useGatePassStore.getState();
    const result = await store.scanGatePass('qr-1');

    expect(result).toMatchObject({ id: approvedGatePass.id, status: approvedGatePass.status });
  });

  it('throws when trying to scan as prajurit', async () => {
    // user is prajurit in beforeEach
    await expect(useGatePassStore.getState().scanGatePass('qr-1')).rejects.toThrow(
      'Akses hanya untuk petugas jaga',
    );
  });
});
