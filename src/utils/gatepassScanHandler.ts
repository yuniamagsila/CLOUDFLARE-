import { supabase } from '../lib/supabase';

export async function handleGatePassScan(qr_token: string) {
  const { data, error } = await supabase
    .from('gate_pass')
    .select('id, user_id, status, actual_keluar, actual_kembali, waktu_keluar, waktu_kembali, qr_token, user:users(nama, nrp)')
    .eq('qr_token', qr_token)
    .single();

  if (error || !data) throw new Error('QR tidak valid');

  if (data.status === 'approved' && !data.actual_keluar) {
    const now = new Date().toISOString();
    const { error: err } = await supabase
      .from('gate_pass')
      .update({ status: 'out', actual_keluar: now })
      .eq('id', data.id);
    if (err) throw err;
    return { ...data, status: 'out', actual_keluar: now };
  } else if (data.status === 'out' && !data.actual_kembali) {
    const now = new Date().toISOString();
    const { error: err } = await supabase
      .from('gate_pass')
      .update({ status: 'returned', actual_kembali: now })
      .eq('id', data.id);
    if (err) throw err;
    return { ...data, status: 'returned', actual_kembali: now };
  } else if (data.status === 'returned') {
    throw new Error('Sudah kembali, tidak bisa scan lagi');
  } else {
    throw new Error('Status tidak valid untuk scan');
  }
}
