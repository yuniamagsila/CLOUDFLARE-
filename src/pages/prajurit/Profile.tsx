import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { RoleBadge } from '../../components/common/Badge';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { supabase } from '../../lib/supabase';

export default function Profile() {
  const { user } = useAuthStore();
  const { showNotification } = useUIStore();

  const [changingPin, setChangingPin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pinForm, setPinForm] = useState({ oldPin: '', newPin: '', confirmPin: '' });

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinForm.newPin.length !== 6 || !/^\d{6}$/.test(pinForm.newPin)) {
      showNotification('PIN baru harus 6 digit angka', 'error');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      showNotification('Konfirmasi PIN tidak cocok', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('change_user_pin', {
        p_user_id: user?.id,
        p_old_pin: pinForm.oldPin,
        p_new_pin: pinForm.newPin,
      });
      if (error) throw new Error('PIN lama tidak sesuai');
      showNotification('PIN berhasil diubah', 'success');
      setChangingPin(false);
      setPinForm({ oldPin: '', newPin: '', confirmPin: '' });
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Gagal mengubah PIN', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout title="Profil Saya">
      <div className="max-w-lg space-y-6">
        {/* Avatar + basic info */}
        <div className="bg-bg-card border border-surface rounded-xl p-6 flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-2xl font-bold text-primary">
            {user.nama.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{user.nama}</h2>
            <p className="text-sm text-text-muted font-mono">{user.nrp}</p>
            <div className="mt-2">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>

        {/* Detail info */}
        <div className="bg-bg-card border border-surface rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4">Informasi Personel</h3>
          <div className="space-y-3">
            {[
              { label: 'NRP', value: user.nrp, mono: true },
              { label: 'Nama Lengkap', value: user.nama },
              { label: 'Pangkat', value: user.pangkat ?? '—' },
              { label: 'Jabatan', value: user.jabatan ?? '—' },
              { label: 'Satuan', value: user.satuan },
              { label: 'Status Akun', value: user.is_active ? 'Aktif' : 'Non-Aktif' },
              {
                label: 'Login Terakhir',
                value: user.last_login
                  ? new Date(user.last_login).toLocaleString('id-ID')
                  : 'Belum pernah',
              },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-surface last:border-0">
                <span className="text-sm text-text-muted">{label}</span>
                <span className={`text-sm font-medium text-text-primary ${mono ? 'font-mono' : ''}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Change PIN */}
        <div className="bg-bg-card border border-surface rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Keamanan</h3>
            {!changingPin && (
              <Button size="sm" variant="outline" onClick={() => setChangingPin(true)}>
                Ubah PIN
              </Button>
            )}
          </div>

          {changingPin ? (
            <form onSubmit={handleChangePin} className="space-y-4">
              <Input
                label="PIN Lama *"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinForm.oldPin}
                onChange={(e) => setPinForm({ ...pinForm, oldPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                required
              />
              <Input
                label="PIN Baru *"
                type="password"
                inputMode="numeric"
                maxLength={6}
                helpText="6 digit angka"
                value={pinForm.newPin}
                onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                required
              />
              <Input
                label="Konfirmasi PIN Baru *"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinForm.confirmPin}
                onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                required
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setChangingPin(false);
                    setPinForm({ oldPin: '', newPin: '', confirmPin: '' });
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" isLoading={isSaving}>
                  Simpan PIN Baru
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-text-muted">
              PIN Anda adalah 6 digit angka rahasia. Jangan bagikan kepada siapapun.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
