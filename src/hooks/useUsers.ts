import { useState, useEffect, useCallback } from 'react';
import { fetchUsers as apiFetchUsers, createUserWithPin, patchUser, resetUserPin as apiResetUserPin } from '../lib/api/users';
import { handleError } from '../lib/handleError';
import type { User, Role } from '../types';

interface UseUsersOptions {
  role?: Role;
  satuan?: string;
  isActive?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetchUsers({ role: options.role, satuan: options.satuan, isActive: options.isActive });
      setUsers(data);
    } catch (err) {
      setError(handleError(err, 'Gagal memuat data user'));
    } finally {
      setIsLoading(false);
    }
  }, [options.role, options.satuan, options.isActive]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'is_online' | 'login_attempts'> & { pin: string }) => {
    const { pin, ...rest } = userData;
    const data = await createUserWithPin({
      nrp: rest.nrp,
      pin,
      nama: rest.nama,
      role: rest.role,
      satuan: rest.satuan,
      pangkat: rest.pangkat,
      jabatan: rest.jabatan,
    });
    await fetchUsers();
    return data;
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    await patchUser(id, updates);
    await fetchUsers();
  };

  const toggleUserActive = async (id: string, isActive: boolean) => {
    await updateUser(id, { is_active: isActive });
  };

  const resetUserPin = async (userId: string, newPin: string) => {
    await apiResetUserPin(userId, newPin);
  };

  return { users, isLoading, error, refetch: fetchUsers, createUser, updateUser, toggleUserActive, resetUserPin };
}
