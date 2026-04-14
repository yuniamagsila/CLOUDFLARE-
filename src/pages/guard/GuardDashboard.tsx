import React, { useState } from 'react';
import QRScanner from '../../components/guard/QRScanner';
import ScanResultCard from '../../components/guard/ScanResultCard';
import { handleGatePassScan } from '../../utils/gatepassScanHandler';

export default function GuardDashboard() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const onScan = async (qr_token: string) => {
    setError(null);
    try {
      const res = await handleGatePassScan(qr_token);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'QR tidak valid');
      setResult(null);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold text-center">Scan Gate Pass</h1>
      <QRScanner onScan={onScan} />
      {error && <div className="alert alert-error">{error}</div>}
      {result && <ScanResultCard data={result} />}
    </div>
  );
}
