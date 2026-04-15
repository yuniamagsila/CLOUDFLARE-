import { useState } from 'react';
import GatePassScanner from '../../components/gatepass/GatePassScanner';
import { useGatePassStore } from '../../store/gatePassStore';
import { useGatePassRealtime } from '../../hooks/useGatePassRealtime';
import type { GatePass } from '../../types';
import GatePassStatusBadge from '../../components/gatepass/GatePassStatusBadge';
import Badge from '../../components/common/Badge';

export default function GateScannerPage() {
  const scanGatePass = useGatePassStore(s => s.scanGatePass);
  const [result, setResult] = useState<GatePass | null>(null);
  const [error, setError] = useState<string | null>(null);
  useGatePassRealtime();

  const handleScan = async (qrToken: string) => {
    setError(null);
    setResult(null);
    try {
      const gatePass = await scanGatePass(qrToken);
      setResult(gatePass);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error('QR tidak valid');
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">Scan Gate Pass</h1>
      <GatePassScanner onScan={handleScan} />
      {result && (
        <div className="rounded-xl border border-surface bg-bg-card p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-primary">{result.user?.nama ?? '—'}</span>
            <GatePassStatusBadge gatePass={result} />
          </div>
          <div className="text-sm text-text-muted">NRP: {result.user?.nrp ?? '—'}</div>
          <div className="text-sm text-text-muted">Tujuan: {result.tujuan}</div>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2">
          <Badge variant="error">{error}</Badge>
        </div>
      )}
    </div>
  );
}
