import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Table from '../../components/ui/Table';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import type { AuditLog } from '../../types';

export default function AuditLog() {
  const [search, setSearch] = useState('');
  const { logs, isLoading } = useAuditLogs({ limit: 200 });

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.user?.nama?.toLowerCase().includes(q) ?? false) ||
      (l.user?.nrp?.includes(search) ?? false)
    );
  });

  return (
    <DashboardLayout title="Audit Log">
      <div className="space-y-5">
        <input
          type="text"
          placeholder="Cari aksi, nama, atau NRP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-surface bg-bg-card px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
        />

        <Table<AuditLog>
          columns={[
            {
              key: 'created_at',
              header: 'Waktu',
              render: (l) => (
                <span className="font-mono text-xs text-text-muted">
                  {new Date(l.created_at).toLocaleString('id-ID')}
                </span>
              ),
            },
            {
              key: 'user',
              header: 'Pengguna',
              render: (l) => l.user ? (
                <div>
                  <div className="font-medium text-text-primary">{l.user.nama}</div>
                  <div className="font-mono text-xs text-text-muted">{l.user.nrp}</div>
                </div>
              ) : <span className="text-text-muted">—</span>,
            },
            {
              key: 'action',
              header: 'Aksi',
              render: (l) => (
                <span className="font-mono text-xs bg-surface px-2 py-0.5 rounded">{l.action}</span>
              ),
            },
            { key: 'resource', header: 'Sumber Daya', render: (l) => l.resource ?? '—' },
            {
              key: 'detail',
              header: 'Detail',
              render: (l) => l.detail ? (
                <span className="text-xs text-text-muted truncate max-w-xs block">
                  {JSON.stringify(l.detail)}
                </span>
              ) : '—',
            },
          ]}
          data={filtered}
          keyExtractor={(l) => l.id}
          isLoading={isLoading}
          emptyMessage="Tidak ada log aktivitas"
        />
      </div>
    </DashboardLayout>
  );
}
