import { apiRequest } from './client';
import type { User, Role } from '../../types';

const USER_COLUMNS =
  'id, nrp, nama, role, pangkat, jabatan, satuan, foto_url, is_active, is_online, login_attempts, locked_until, last_login, created_at, updated_at, tempat_lahir, tanggal_lahir, no_telepon, alamat, tanggal_masuk_dinas, pendidikan_terakhir, agama, status_pernikahan, golongan_darah, kontak_darurat_nama, kontak_darurat_telp';

export interface FetchUsersParams {
  role?: Role;
  satuan?: string;
  isActive?: boolean;
  orderBy?: 'nama' | 'created_at';
  ascending?: boolean;
}

export async function fetchUsers(params: FetchUsersParams = {}): Promise<User[]> {
  const data = await apiRequest<User[]>('/users', {
    query: {
      role: params.role,
      satuan: params.satuan,
      is_active: params.isActive,
      order_by: params.orderBy ?? 'nama',
      ascending: params.ascending ?? true,
      columns: USER_COLUMNS,
    },
  });

  return data ?? [];
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
  return apiRequest<unknown>('/users', {
    method: 'POST',
    body: {
      nrp: userData.nrp,
      pin: userData.pin,
      nama: userData.nama,
      role: userData.role,
      satuan: userData.satuan,
      pangkat: userData.pangkat ?? null,
      jabatan: userData.jabatan ?? null,
    },
  });
}

export async function patchUser(id: string, updates: Partial<User>): Promise<void> {
  await apiRequest<void>(`/users/${id}`, {
    method: 'PATCH',
    body: updates,
  });
}

export async function resetUserPin(userId: string, newPin: string): Promise<void> {
  await apiRequest<void>(`/users/${userId}/reset-pin`, {
    method: 'POST',
    body: { new_pin: newPin },
  });
}

export async function fetchUserById(userId: string): Promise<User> {
  return apiRequest<User>(`/users/${userId}`);
}

export interface UpdateOwnProfileParams {
  no_telepon?: string;
  alamat?: string;
  kontak_darurat_nama?: string;
  kontak_darurat_telp?: string;
}

export async function updateOwnProfile(userId: string, params: UpdateOwnProfileParams): Promise<void> {
  await apiRequest<void>(`/users/${userId}/profile`, {
    method: 'PATCH',
    body: {
      no_telepon: params.no_telepon ?? null,
      alamat: params.alamat ?? null,
      kontak_darurat_nama: params.kontak_darurat_nama ?? null,
      kontak_darurat_telp: params.kontak_darurat_telp ?? null,
    },
  });
}
