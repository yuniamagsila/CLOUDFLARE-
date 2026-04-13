import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard, { StatsGrid } from '../../components/ui/StatCard';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface DashboardStats {
  totalPersonel: number;
  totalOnline: number;
  totalTugas: number;
  tugasAktif: number;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [usersResult, tasksResult, onlineResult, activeTasks] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('tasks').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_online', true),
          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .in('status', ['pending', 'in_progress']),
        ]);

        setStats({
          totalPersonel: usersResult.count ?? 0,
          totalOnline: onlineResult.count ?? 0,
          totalTugas: tasksResult.count ?? 0,
          tugasAktif: activeTasks.count ?? 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();

    // Realtime subscription for online status
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, () => {
        void fetchStats();
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  return (
    <DashboardLayout title="Control Center">
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Selamat datang, <span className="text-primary">{user?.nama}</span>
          </h2>
          <p className="text-text-muted mt-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <StatsGrid>
            <StatCard
              icon="👥"
              label="Total Personel Aktif"
              value={stats?.totalPersonel ?? 0}
            />
            <StatCard
              icon="🟢"
              label="Sedang Online"
              value={stats?.totalOnline ?? 0}
              trend="saat ini"
              trendUp
            />
            <StatCard
              icon="📋"
              label="Total Tugas"
              value={stats?.totalTugas ?? 0}
            />
            <StatCard
              icon="⏳"
              label="Tugas Aktif"
              value={stats?.tugasAktif ?? 0}
            />
          </StatsGrid>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: '/admin/users', icon: '👥', title: 'Manajemen Personel', desc: 'CRUD user, reset PIN, filter role' },
            { href: '/admin/audit', icon: '📋', title: 'Audit Log', desc: 'Riwayat aktivitas seluruh sistem' },
            { href: '/admin/logistics', icon: '📦', title: 'Logistik', desc: 'Inventaris perlengkapan satuan' },
            { href: '/admin/settings', icon: '⚙', title: 'Pengaturan', desc: 'Konfigurasi sistem & satuan' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="bg-bg-card border border-surface hover:border-primary rounded-xl p-5 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{item.icon}</span>
                <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </div>
              <p className="text-sm text-text-muted">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
