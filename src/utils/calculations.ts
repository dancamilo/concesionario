import type { Expense } from "../types/expense";
import { toMillis } from "./dates";

export interface AdminTotal {
  userId: string;
  name: string;
  total: number;
}

/** Suma de los gastos ACTIVOS (archived == false). Los archivados no cuentan. */
export function calculateVehicleExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => (expense.archived ? sum : sum + expense.amount), 0);
}

/** Inversión total = precio de compra + gastos activos. Nunca se guarda: siempre se calcula. */
export function calculateVehicleTotalCost(purchasePrice: number, expenses: Expense[]): number {
  return purchasePrice + calculateVehicleExpenses(expenses);
}

/** Gastos activos registrados por un administrador. */
export function calculateUserVehicleExpenses(expenses: Expense[], userId: string): number {
  return calculateVehicleExpenses(expenses.filter((expense) => expense.userId === userId));
}

/** Utilidad (positiva) o pérdida (negativa) = precio de venta - inversión total. */
export function calculateProfit(salePrice: number, totalCost: number): number {
  return salePrice - totalCost;
}

/** Rentabilidad % = utilidad / inversión total * 100. */
export function calculateProfitability(profit: number, totalCost: number): number {
  return totalCost > 0 ? (profit / totalCost) * 100 : 0;
}

export function groupExpensesByVehicle(expenses: Expense[]): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const list = groups.get(expense.vehicleId);
    if (list) list.push(expense);
    else groups.set(expense.vehicleId, [expense]);
  }
  return groups;
}

/** Total por administrador. Siempre incluye a todos los administradores recibidos, aunque estén en $0. */
export function calculateExpensesByAdmin(
  expenses: Expense[],
  admins: Array<{ uid: string; name: string }>,
): AdminTotal[] {
  const totals = new Map<string, AdminTotal>();
  for (const admin of admins) {
    totals.set(admin.uid, { userId: admin.uid, name: admin.name, total: 0 });
  }
  for (const expense of expenses) {
    if (expense.archived) continue;
    const entry = totals.get(expense.userId) ?? {
      userId: expense.userId,
      name: expense.userName,
      total: 0,
    };
    entry.total += expense.amount;
    totals.set(expense.userId, entry);
  }
  return Array.from(totals.values());
}

export function sortExpensesByDate(expenses: Expense[]): Expense[] {
  return [...expenses].sort(
    (a, b) => toMillis(b.date) - toMillis(a.date) || toMillis(b.createdAt) - toMillis(a.createdAt),
  );
}
