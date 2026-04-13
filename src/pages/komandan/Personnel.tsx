import DashboardLayout from '../../components/layout/DashboardLayout';
import Table from '../../components/ui/Table';
import { RoleBadge } from '../../components/common/Badge';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';

export default function Personnel() {
  const { user } = useAuthStore();
  const { users, isLoading } = useUsers({ satuan: user?.satuan, isActive: true });

  return (
    <DashboardLayout title="Data Personel">
      <div className="space-y-5">
        <p className="text-text-muted text-sm">
          Personel aktif di satuan <span className="text-text-primary font-medium">{user?.satuan}</span>
          {' '}— Total: <span className="text-primary font-bold">{users.length}</span> personel
        </p>

        <Table<User>
          columns={[
            { key: 'nrp', header: 'NRP', render: (u) => <span className="font-mono text-sm">{u.nrp}</span> },
            { key: 'nama', header: 'Nama' },
            { key: 'pangkat', header: 'Pangkat', render: (u) => u.pangkat ?? '—' },
            { key: 'jabatan', header: 'Jabatan', render: (u) => u.jabatan ?? '—' },
            { key: 'role', header: 'Role', render: (u) => <RoleBadge role={u.role} /> },
            {
              key: 'is_online',
              header: 'Status',
              render: (u) => (
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${u.is_online ? 'bg-success' : 'bg-text-muted'}`} />
                  <span className="text-xs">{u.is_online ? 'Online' : 'Offline'}</span>
                </div>
              ),
            },
            {
              key: 'last_login',
              header: 'Login Terakhir',
              render: (u) => u.last_login
                ? new Date(u.last_login).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                : '—',
            },
          ]}
          data={users}
          keyExtractor={(u) => u.id}
          isLoading={isLoading}
          emptyMessage="Tidak ada personel di satuan ini"
        />
      </div>
    </DashboardLayout>
  );
}
