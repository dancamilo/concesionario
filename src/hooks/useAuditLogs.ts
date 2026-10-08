import { useEffect, useState } from "react";
import { subscribeToAuditLogs } from "../services/audit.service";
import type { AuditLog } from "../types/audit";

interface AuditState {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
}

export function useAuditLogs(options: { vehicleId?: string; max?: number } = {}): AuditState {
  const { vehicleId, max } = options;
  const [state, setState] = useState<AuditState>({ logs: [], loading: true, error: null });

  useEffect(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToAuditLogs(
      { vehicleId, max },
      (logs) => setState({ logs, loading: false, error: null }),
      (message) => setState((current) => ({ ...current, loading: false, error: message })),
    );
  }, [vehicleId, max]);

  return state;
}
