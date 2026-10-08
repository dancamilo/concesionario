import type { Timestamp } from "firebase/firestore";

export type ExpenseCategory =
  | "fuel"
  | "repair"
  | "parking"
  | "washing"
  | "transport"
  | "paperwork"
  | "maintenance"
  | "other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "fuel",
  "repair",
  "parking",
  "washing",
  "transport",
  "paperwork",
  "maintenance",
  "other",
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fuel: "Gasolina",
  repair: "Reparación",
  parking: "Parqueadero",
  washing: "Lavado",
  transport: "Transporte",
  paperwork: "Trámites",
  maintenance: "Mantenimiento",
  other: "Otros",
};

export interface Expense {
  id: string;
  vehicleId: string;
  userId: string;
  userName: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Timestamp;
  archived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Datos del formulario. userId y userName NUNCA vienen del formulario: salen de la sesión. */
export interface ExpenseInput {
  vehicleId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
}

/** Filtros de consulta. Solo `archived` es obligatorio. */
export interface ExpenseFilters {
  archived: boolean;
  vehicleId?: string;
  userId?: string;
  category?: ExpenseCategory;
  from?: Date;
  to?: Date;
}
