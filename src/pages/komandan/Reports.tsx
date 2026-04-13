import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { AttendanceBadge, TaskStatusBadge } from '../../components/common/Badge';
import type { Attendance, Task } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Reports() {
  const { user } = useAuthStore();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [attnRes, taskRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('*, user:user_id(id,nama,nrp,pangkat)')
          .eq('tanggal', new Date().toISOString().split('T')[0])
          .order('created_at', { ascending: false }),
        supabase
          .from('tasks')
          .select('*, assignee:assigned_to(id,nama,nrp), assigner:assigned_by(id,nama)')
          .eq('satuan', user?.satuan ?? '')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      setAttendances((attnRes.data as Attendance[]) ?? []);
      setTasks((taskRes.data as Task[]) ?? []);
      setIsLoading(false);
    };
    if (user?.satuan) void fetchData();
  }, [user]);

  if (isLoading) return <DashboardLayout title="Laporan"><LoadingSpinner /></DashboardLayout>;

  const presentCount = attendances.filter((a) => a.status === 'hadir').length;
  const absenCount = attendances.filter((a) => a.status === 'alpa').length;
  const approvedTasks = tasks.filter((t) => t.status === 'approved').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

  return (
    <DashboardLayout title="Laporan Harian">
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '✅', label: 'Hadir', value: presentCount, color: 'text-success' },
            { icon: '❌', label: 'Alpa', value: absenCount, color: 'text-accent-red' },
            { icon: '✓', label: 'Tugas Selesai', value: approvedTasks, color: 'text-primary' },
            { icon: '⏳', label: 'Tugas Aktif', value: pendingTasks, color: 'text-accent-gold' },
          ].map((s) => (
            <div key={s.label} className="bg-bg-card border border-surface rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">{s.label}</span>
                <span className="text-xl">{s.icon}</span>
              </div>
              <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Attendance Today */}
        <div className="bg-bg-card border border-surface rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-surface">
            <h3 className="font-semibold text-text-primary">
              Absensi Hari Ini — {new Date().toLocaleDateString('id-ID')}
            </h3>
          </div>
          <div className="divide-y divide-surface/50 max-h-64 overflow-y-auto">
            {attendances.length === 0 ? (
              <p className="text-center text-text-muted py-6">Belum ada absensi hari ini</p>
            ) : (
              attendances.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{a.user?.nama ?? '—'}</p>
                    <p className="text-xs text-text-muted font-mono">{a.user?.nrp}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted">
                      {a.check_in ? new Date(a.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                    <AttendanceBadge status={a.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-bg-card border border-surface rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-surface">
            <h3 className="font-semibold text-text-primary">Status Tugas Terkini</h3>
          </div>
          <div className="divide-y divide-surface/50 max-h-64 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-center text-text-muted py-6">Belum ada tugas</p>
            ) : (
              tasks.slice(0, 20).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{t.judul}</p>
                    <p className="text-xs text-text-muted">{t.assignee?.nama ?? '—'}</p>
                  </div>
                  <TaskStatusBadge status={t.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
