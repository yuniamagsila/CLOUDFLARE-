import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuthStore } from '../../store/authStore';

export default function Settings() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout title="Pengaturan Sistem">
      <div className="space-y-6 max-w-2xl">
        {/* System Info */}
        <div className="bg-bg-card border border-surface rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Informasi Sistem</h2>
          <div className="space-y-3">
            {[
              { label: 'Versi Aplikasi', value: 'v1.0.0' },
              { label: 'Platform', value: 'KARYO OS — Command & Battalion Tracking' },
              { label: 'Satuan', value: user?.satuan ?? '—' },
              { label: 'Admin', value: user?.nama ?? '—' },
              { label: 'NRP Admin', value: user?.nrp ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-surface last:border-0">
                <span className="text-sm text-text-muted">{label}</span>
                <span className="text-sm font-medium text-text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Session Settings */}
        <div className="bg-bg-card border border-surface rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Keamanan Session</h2>
          <div className="space-y-3">
            {[
              { label: 'Durasi Session', value: '8 jam (1 shift)' },
              { label: 'Max Percobaan Login', value: '5 kali' },
              { label: 'Lockout Duration', value: '15 menit' },
              { label: 'PIN Hashing', value: 'bcrypt (Supabase pgcrypto)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-surface last:border-0">
                <span className="text-sm text-text-muted">{label}</span>
                <span className="text-sm font-medium text-text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-accent-gold/10 border border-accent-gold/30 rounded-xl p-4">
          <p className="text-sm text-accent-gold">
            ⚠ Pengaturan lanjutan (konfigurasi Supabase, RLS policy, dll.) dikelola langsung melalui Supabase Dashboard.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
