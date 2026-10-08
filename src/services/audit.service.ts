import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { describeError } from "./errors";
import type { Actor } from "./auth.service";
import type { AuditAction, AuditLog } from "../types/audit";
import { toMillis } from "../utils/dates";

/** Registra una acción. Si falla, no interrumpe la operación principal. */
export async function logAction(
  actor: Actor,
  action: AuditAction,
  refs: { vehicleId?: string; expenseId?: string } = {},
): Promise<void> {
  try {
    await addDoc(collection(db, "auditLogs"), {
      userId: actor.uid,
      userName: actor.name,
      action,
      ...(refs.vehicleId ? { vehicleId: refs.vehicleId } : {}),
      ...(refs.expenseId ? { expenseId: refs.expenseId } : {}),
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.warn("No se pudo registrar la auditoría:", error);
  }
}

/**
 * Sin vehicleId: últimas `max` acciones (orderBy simple, sin índice compuesto).
 * Con vehicleId: una sola igualdad (sin índice compuesto); se ordena en memoria.
 */
export function subscribeToAuditLogs(
  options: { vehicleId?: string; max?: number },
  onData: (logs: AuditLog[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const constraints: QueryConstraint[] =
    options.vehicleId !== undefined
      ? [where("vehicleId", "==", options.vehicleId)]
      : [orderBy("timestamp", "desc"), limit(options.max ?? 50)];

  return onSnapshot(
    query(collection(db, "auditLogs"), ...constraints),
    (snapshot) => {
      const logs = snapshot.docs.map((item) => ({
        ...(item.data({ serverTimestamps: "estimate" }) as Omit<AuditLog, "id">),
        id: item.id,
      }));
      logs.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
      onData(logs);
    },
    (error) => onError(describeError(error)),
  );
}
