import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import type { Role } from '../../types';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { path: '/admin/dashboard', label: 'Control Center', icon: '⊞' },
    { path: '/admin/users', label: 'Personel', icon: '👥' },
    { path: '/admin/logistics', label: 'Logistik', icon: '📦' },
    { path: '/admin/documents', label: 'Dokumen', icon: '📄' },
    { path: '/admin/announcements', label: 'Pengumuman', icon: '📢' },
    { path: '/admin/schedule', label: 'Jadwal Shift', icon: '📅' },
    { path: '/admin/attendance', label: 'Rekap Absensi', icon: '✅' },
    { path: '/admin/audit', label: 'Audit Log', icon: '📋' },
    { path: '/admin/settings', label: 'Pengaturan', icon: '⚙' },
  ],
  komandan: [
    { path: '/komandan/dashboard', label: 'Ops Center', icon: '⊞' },
    { path: '/komandan/tasks', label: 'Tugas', icon: '✓' },
    { path: '/komandan/personnel', label: 'Personel', icon: '👥' },
    { path: '/komandan/attendance', label: 'Kehadiran', icon: '📅' },
    { path: '/komandan/evaluation', label: 'Evaluasi', icon: '📝' },
    { path: '/komandan/reports', label: 'Laporan', icon: '📊' },
    { path: '/komandan/logistics-request', label: 'Permintaan Logistik', icon: '📦' },
  ],
  prajurit: [
    { path: '/prajurit/dashboard', label: 'Dashboard', icon: '⊞' },
    { path: '/prajurit/tasks', label: 'Tugas Saya', icon: '✓' },
    { path: '/prajurit/attendance', label: 'Absensi', icon: '📅' },
    { path: '/prajurit/messages', label: 'Pesan', icon: '✉' },
    { path: '/prajurit/leave', label: 'Permohonan Izin', icon: '🏖' },
    { path: '/prajurit/profile', label: 'Profil', icon: '👤' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabelMap: Record<Role, string> = {
    admin: 'Administrator',
    komandan: 'Komandan',
    prajurit: 'Prajurit',
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/25 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          app-panel fixed left-0 top-0 z-30 h-full w-[240px] border-r border-surface/80
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="border-b border-surface/80 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-lg text-primary">◈</span>
            <div>
              <div className="text-base font-extrabold tracking-tight text-text-primary leading-tight">KARYO OS</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">Operations Suite</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="border-b border-surface/80 px-4 py-4">
          <div className="flex items-center gap-3 rounded-2xl border border-surface/70 bg-slate-50/70 p-3 dark:bg-surface/35">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 font-bold text-primary">
              {user.nama.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-text-primary">{user.nama}</div>
              <div className="truncate text-xs text-text-muted">
                {user.pangkat ?? roleLabelMap[user.role]} — {user.satuan}
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-success flex-shrink-0" title="Online" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-text-muted hover:bg-slate-100 hover:text-text-primary dark:hover:bg-surface/60'
                }`
              }
              onClick={() => {
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-black/[0.04] text-center text-sm dark:bg-white/[0.06]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-surface/80 px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-accent-red transition-colors hover:bg-accent-red/10"
          >
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent-red/10 text-center text-sm">⏻</span>
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
