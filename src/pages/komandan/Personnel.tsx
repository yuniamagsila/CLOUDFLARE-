import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Table from '../../components/ui/Table';
import Button from '../../components/common/Button';
import PageHeader from '../../components/ui/PageHeader';
import { RoleBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/Skeleton';
import UserDetailModal from '../../components/common/UserDetailModal';
import { useUsers } from '../../hooks/useUsers';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';

export default function Personnel() {
  const { user } = useAuthStore();
  const { users, isLoading, getUserById } = useUsers({ satuan: user?.satuan, isActive: true });

  const [searchRaw, setSearchRaw] = useState('');
  const [filterOnline, setFilterOnline] = useState<'all' | 'online' | 'offline'>('all');
  const search = useDebounce(searchRaw, 300);
  const [showDetail, setShowDetail] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      u.nama.toLowerCase().includes(q) ||
      u.nrp.includes(search) ||
      (u.pangkat?.toLowerCase().includes(q) ?? false) ||
      (u.jabatan?.toLowerCase().includes(q) ?? false);
    const matchOnline =
      filterOnline === 'all' ||
      (filterOnline === 'online' ? u.is_online : !u.is_online);
    return matchSearch && matchOnline;
  });

  const onlineCount = users.filter((u) => u.is_online).length;

  const handleOpenDetail = async (u: User) => {
    try {
      const full = await getUserById(u.id);
      setDetailUser(full);
    } catch {
      setDetailUser(u);
    }
    setShowDetail(true);
  };

  return (
    <DashboardLayout title="Data Personel">
      <div className="space-y-5">
        <PageHeader
          title="Data Personel"
          subtitle="Pantau status online, cari personel, dan lihat data keaktifan satuan secara cepat."
        />

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-text-muted">
              <span className="font-bold text-success">{onlineCount}</span> online
            </span>
          </div>
          <span className="text-text-muted/40">|</span>
          <span className="text-sm text-text-muted">
            Total <span className="font-bold text-text-primary">{users.length}</span> personel aktif di <span className="font-medium text-text-primary">{user?.satuan}</span>
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Cari nama, NRP, pangkat..."
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            className="form-control flex-1"
          />
          <div className="flex gap-1 bg-surface/40 rounded-lg p-1">
            {(['all', 'online', 'offline'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilterOnline(opt)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterOnline === opt ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {opt === 'all' ? 'Semua' : opt === 'online' ? '🟢 Online' : '⚫ Offline'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
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
                    <div className={`h-2 w-2 rounded-full ${u.is_online ? 'bg-success animate-pulse' : 'bg-text-muted/40'}`} />
                    <span className={`text-xs ${u.is_online ? 'text-success' : 'text-text-muted'}`}>
                      {u.is_online ? 'Online' : 'Offline'}
                    </span>
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
              {
                key: 'actions',
                header: 'Aksi',
                render: (u) => (
                  <Button size="sm" variant="secondary" onClick={() => handleOpenDetail(u)}>
                    Detail
                  </Button>
                ),
              },
            ]}
            data={filtered}
            keyExtractor={(u) => u.id}
            isLoading={false}
            emptyMessage="Tidak ada personel ditemukan"
          />
        )}
      </div>

      <UserDetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setDetailUser(null); }}
        user={detailUser}
        viewerRole="komandan"
        mode="view"
      />
    </DashboardLayout>
  );
}
