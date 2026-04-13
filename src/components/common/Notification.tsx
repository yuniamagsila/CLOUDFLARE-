import { useUIStore } from '../../store/uiStore';

export default function Notification() {
  const { notification, clearNotification } = useUIStore();

  if (!notification) return null;

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-700 dark:bg-success/20 dark:border-success dark:text-success',
    error: 'bg-red-50 border-red-200 text-red-700 dark:bg-accent-red/20 dark:border-accent-red dark:text-accent-red',
    info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500 dark:text-blue-400',
    warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-accent-gold/20 dark:border-accent-gold dark:text-accent-gold',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] max-w-sm animate-slide-in">
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur-sm ${colors[notification.type]}`}
      >
        <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-lg bg-white/70 text-sm font-bold dark:bg-white/10">{icons[notification.type]}</span>
        <p className="text-sm font-medium flex-1">{notification.message}</p>
        <button
          onClick={clearNotification}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Tutup notifikasi"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
