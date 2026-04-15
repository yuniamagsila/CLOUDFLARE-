import type { ReactNode } from 'react';
import PageHeader from '../ui/PageHeader';
import ErrorBoundary from './ErrorBoundary';

interface PageShellProps {
  /** Judul halaman yang ditampilkan di header */
  title: string;
  /** Sub-judul opsional di bawah judul */
  subtitle?: string;
  /** Elemen aksi (tombol, dll) di sudut kanan header */
  actions?: ReactNode;
  /** Info/metadata tambahan di bawah judul */
  meta?: ReactNode;
  /** Konten utama halaman */
  children: ReactNode;
}

/**
 * PageShell — wrapper standar untuk semua halaman.
 *
 * Menyatukan PageHeader + ErrorBoundary + spacing konsisten
 * sehingga setiap halaman baru cukup ditulis:
 *
 *   <PageShell title="Nama Halaman" actions={<TombolTambah />}>
 *     {konten}
 *   </PageShell>
 */
export default function PageShell({ title, subtitle, actions, meta, children }: PageShellProps) {
  return (
    <ErrorBoundary>
      <div className="space-y-5">
        <PageHeader title={title} subtitle={subtitle} actions={actions} meta={meta} />
        {children}
      </div>
    </ErrorBoundary>
  );
}
