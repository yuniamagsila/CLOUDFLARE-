import { useState, useEffect, useCallback } from 'react';
import { fetchAuditLogs as apiFetchAuditLogs } from '../lib/api/auditLogs';
import { handleError } from '../lib/handleError';
import type { AuditLog } from '../types';

interface UseAuditLogsOptions {
  userId?: string;
  action?: string;
  limit?: number;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetchAuditLogs({ userId: options.userId, action: options.action, limit: options.limit });
      setLogs(data);
    } catch (err) {
      setError(handleError(err, 'Gagal memuat audit log'));
    } finally {
      setIsLoading(false);
    }
  }, [options.userId, options.action, options.limit]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return { logs, isLoading, error, refetch: fetchLogs };
}
