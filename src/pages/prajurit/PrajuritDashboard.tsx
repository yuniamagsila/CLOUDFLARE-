import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard, { StatsGrid } from '../../components/ui/StatCard';
import TaskCard from '../../components/ui/TaskCard';
import { useTasks } from '../../hooks/useTasks';
import { useAttendance } from '../../hooks/useAttendance';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import Button from '../../components/common/Button';
import { AttendanceBadge } from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useState } from 'react';

export default function PrajuritDashboard() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();
  const { tasks, isLoading: tasksLoading } = useTasks({ assignedTo: user?.id });
  const { todayAttendance, isLoading: attnLoading, checkIn, checkOut } = useAttendance();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const activeTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done' || t.status === 'approved');

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await checkIn();
      showNotification('Check-in berhasil!', 'success');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Gagal check-in', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await checkOut();
      showNotification('Check-out berhasil!', 'success');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Gagal check-out', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {user?.pangkat ? `${user.pangkat} ` : ''}
              <span className="text-primary">{user?.nama}</span>
            </h2>
            <p className="text-text-muted mt-1">
              {user?.satuan} — {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Quick attendance */}
          <div className="flex items-center gap-3">
            {attnLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-surface border-t-primary" />
            ) : todayAttendance ? (
              <div className="flex items-center gap-3">
                <AttendanceBadge status={todayAttendance.status} />
                {todayAttendance.check_in && !todayAttendance.check_out && (
                  <Button size="sm" variant="secondary" onClick={handleCheckOut} isLoading={checkingOut}>
                    Check-Out
                  </Button>
                )}
              </div>
            ) : (
              <Button size="sm" onClick={handleCheckIn} isLoading={checkingIn}>
                Check-In
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <StatsGrid>
          <StatCard icon="⏳" label="Tugas Aktif" value={activeTasks.length} />
          <StatCard icon="✓" label="Tugas Selesai" value={doneTasks.length} />
          <StatCard icon="📋" label="Total Tugas" value={tasks.length} />
          <StatCard
            icon="📅"
            label="Status Hari Ini"
            value={todayAttendance ? '✓' : '—'}
          />
        </StatsGrid>

        {/* My tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text-primary">Tugas Aktif Saya</h3>
            <a href="/prajurit/tasks" className="text-sm text-primary hover:underline">Lihat semua →</a>
          </div>

          {tasksLoading ? (
            <LoadingSpinner />
          ) : activeTasks.length === 0 ? (
            <div className="bg-bg-card border border-surface rounded-xl p-8 text-center text-text-muted">
              🎉 Tidak ada tugas aktif saat ini
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {activeTasks.slice(0, 4).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAction={() => { window.location.href = '/prajurit/tasks'; }}
                  actionLabel="Kerjakan"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
