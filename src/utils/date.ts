/**
 * Utilitas pemformatan tanggal dan waktu untuk KARYO OS.
 * Semua output dalam Bahasa Indonesia (locale id-ID).
 */

/** Format: "Senin, 13 April 2026" */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format: "13 Apr 2026" */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format: "Sen, 13 Apr" */
export function formatDateCompact(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Format: "13/04/2026" */
export function formatDateNumeric(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Format: "13 April 2026, 07.30" */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format: "07.30" */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Relative time: "2 menit lalu", "3 jam lalu", "kemarin", "2 hari lalu" */
export function formatRelative(date: string | Date): string {
  const now = Date.now();
  const ts = new Date(date).getTime();
  const diffMs = now - ts;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay === 1) return 'kemarin';
  if (diffDay < 7) return `${diffDay} hari lalu`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} minggu lalu`;
  return formatDateShort(date);
}

/** ISO date string for today: "2026-04-13" */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
