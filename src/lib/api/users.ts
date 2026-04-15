import { supabase } from '../supabase';
import type { User, Role } from '../../types';

const USER_COLUMNS =
  'id, nrp, nama, role, pangkat, jabatan, satuan, foto_url, is_active, is_online, login_attempts, locked_until, last_login, created_at, updated_at';

export interface FetchUsersParams {
  role?: Role;
  satuan?: string;
  isActive?: boolean;
}

export async function fetchUsers(params: FetchUsersParams = {}): Promise<User[]> {
  let query = supabase.from('users').select(USER_COLUMNS).order('nama');
  if (params.role) query = query.eq('role', params.role);
  if (params.satuan) query = query.eq('satuan', params.satuan);
  if (params.isActive !== undefined) query = query.eq('is_active', params.isActive);
  const { data, error } = await query;
  if (error) throw error;
  return (data as User[]) ?? [];
}

export async function createUserWithPin(userData: {
  nrp: string;
  pin: string;
  nama: string;
  role: Role;
  satuan: string;
  pangkat?: string;
  jabatan?: string;
}): Promise<unknown> {
  const { data, error } = await supabase.rpc('create_user_with_pin', {
    p_nrp: userData.nrp,
    p_pin: userData.pin,
    p_nama: userData.nama,
    p_role: userData.role,
    p_satuan: userData.satuan,
    p_pangkat: userData.pangkat ?? null,
    p_jabatan: userData.jabatan ?? null,
  });
  if (error) throw error;
  return data;
}

export async function patchUser(id: string, updates: Partial<User>): Promise<void> {
  const { error } = await supabase.from('users').update(updates).eq('id', id);
  if (error) throw error;
}

export async function resetUserPin(userId: string, newPin: string): Promise<void> {
  const { error } = await supabase.rpc('reset_user_pin', {
    p_user_id: userId,
    p_new_pin: newPin,
  });
  if (error) throw error;
}
