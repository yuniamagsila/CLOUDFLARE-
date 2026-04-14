import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { GatePass, GatePassStatus } from '../types/gatepass';
import { generateQrToken } from '../utils/gatepass';
import { useAuthStore } from './authStore';


interface GatePassState {
  gatePasses: GatePass[];
  fetchGatePasses: () => Promise<void>;
  createGatePass: (data: Partial<GatePass>) => Promise<void>;
  approveGatePass: (id: string, approved: boolean) => Promise<void>;
  scanGatePass: (qrToken: string) => Promise<string>;
}

export const useGatePassStore = create<GatePassState>((set, get) => ({
  gatePasses: [],
  async fetchGatePasses() {
    const user = useAuthStore.getState().user;
    let query = supabase
      .from('gate_pass')
      .select('id,user_id,keperluan,tujuan,waktu_keluar,waktu_kembali,actual_keluar,actual_kembali,status,approved_by,qr_token,created_at')
      .order('created_at', { ascending: false });
    if (user?.role === 'prajurit') {
      query = query.eq('user_id', user.id);
    }
    // Komandan/guard bisa lihat semua, filter di komponen jika perlu
    const { data, error } = await query;
    if (!error && data) {
      // Tandai overdue jika waktu_kembali < now dan status masih 'out'
      const now = new Date();
      const updated = await Promise.all(data.map(async (gp) => {
        if (gp.status === 'out' && gp.waktu_kembali && new Date(gp.waktu_kembali) < now) {
          // Update status di DB jika belum overdue
          if (gp.status !== 'overdue') {
            await supabase.from('gate_pass').update({ status: 'overdue' }).eq('id', gp.id);
            return { ...gp, status: 'overdue' };
          }
        }
        return gp;
      }));
      set({ gatePasses: updated });
    }
  },
  async createGatePass(data) {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User tidak ditemukan');
    const qr_token = generateQrToken();
    const { error } = await supabase.from('gate_pass').insert([
      { ...data, user_id: user.id, qr_token }
    ]);
    if (error) throw error;
    await get().fetchGatePasses();
  },
  async approveGatePass(id, approved) {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User tidak ditemukan');
    const status: GatePassStatus = approved ? 'approved' : 'rejected';
    const { error } = await supabase
      .from('gate_pass')
      .update({ status, approved_by: user.id })
      .eq('id', id);
    if (error) throw error;
    await get().fetchGatePasses();
  },
  async scanGatePass(qrToken) {
    const user = useAuthStore.getState().user;
    if (!user || (user.role !== 'guard' && user.role !== 'admin')) {
      throw new Error('Akses hanya untuk petugas jaga');
    }
    const { data, error } = await supabase
      .from('gate_pass')
      .select('id,status,actual_keluar,actual_kembali,waktu_keluar,waktu_kembali')
      .eq('qr_token', qrToken)
      .single();
    if (error || !data) throw new Error('QR tidak valid');

    // Blokir double scan keluar
    if (data.status === 'out' && data.actual_keluar) {
      // Sudah keluar, cek apakah sudah scan masuk
      if (!data.actual_kembali) {
        // Sudah keluar, belum kembali
        throw new Error('Sudah scan keluar, silakan scan masuk saat kembali.');
      }
    }
    // Blokir double scan masuk
    if (data.status === 'returned' && data.actual_kembali) {
      throw new Error('Sudah scan kembali, tidak bisa scan lagi.');
    }

    if (data.status === 'approved') {
      // Set keluar
      const { error: err } = await supabase
        .from('gate_pass')
        .update({ status: 'out', actual_keluar: new Date().toISOString() })
        .eq('id', data.id);
      if (err) throw err;
      await get().fetchGatePasses();
      return 'Keluar berhasil';
    } else if (data.status === 'out') {
      // Set kembali
      const { error: err } = await supabase
        .from('gate_pass')
        .update({ status: 'returned', actual_kembali: new Date().toISOString() })
        .eq('id', data.id);
      if (err) throw err;
      await get().fetchGatePasses();
      return 'Kembali berhasil';
    } else if (data.status === 'returned') {
      throw new Error('Sudah kembali, tidak bisa scan lagi');
    } else if (data.status === 'pending' || data.status === 'rejected') {
      throw new Error('Gate pass belum di-approve atau sudah ditolak');
    } else if (data.status === 'overdue') {
      throw new Error('Gate pass overdue, segera lapor ke komandan.');
    } else {
      throw new Error('Status gate pass tidak valid untuk scan');
    }
  },
});

let gatePassChannel: any = null;

export const useGatePassStore = create<GatePassState>((set, get) => {
  // Realtime listener
  if (!gatePassChannel && typeof window !== 'undefined') {
    // Hindari duplicate channel
    const { supabase } = require('../lib/supabase');
    gatePassChannel = supabase
      .channel('gate-pass-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gate_pass' }, () => {
        get().fetchGatePasses();
      })
      .subscribe();
  }
  return {
    gatePasses: [],
    async fetchGatePasses() {
      // ...existing code...
    },
    async createGatePass(data) {
      // ...existing code...
    },
    async approveGatePass(id, approved) {
      // ...existing code...
    },
    async scanGatePass(qrToken) {
      // ...existing code...
    },
  };
});
}));
