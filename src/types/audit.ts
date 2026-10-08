import type { Timestamp } from "firebase/firestore";

export type AuditAction =
  | "vehicle.create"
  | "vehicle.update"
  | "vehicle.archive"
  | "vehicle.restore"
  | "vehicle.sale"
  | "expense.create"
  | "expense.update"
  | "expense.archive"
  | "expense.restore";

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  vehicleId?: string;
  expenseId?: string;
  timestamp: Timestamp;
}

const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "vehicle.create": "Creó el vehículo",
  "vehicle.update": "Editó el vehículo",
  "vehicle.archive": "Archivó el vehículo",
  "vehicle.restore": "Restauró el vehículo",
  "vehicle.sale": "Registró la venta",
  "expense.create": "Agregó un gasto",
  "expense.update": "Editó un gasto",
  "expense.archive": "Archivó un gasto",
  "expense.restore": "Restauró un gasto",
};

export function auditActionLabel(action: string): string {
  return (AUDIT_ACTION_LABELS as Record<string, string>)[action] ?? action;
}
