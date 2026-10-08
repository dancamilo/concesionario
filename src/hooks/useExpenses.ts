import { useEffect, useState } from "react";
import { subscribeToExpenses } from "../services/expenses.service";
import type { Expense, ExpenseFilters } from "../types/expense";

interface ExpensesState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
}

export function useExpenses(filters: ExpenseFilters): ExpensesState {
  const { archived, vehicleId, userId, category } = filters;
  const fromTime = filters.from?.getTime();
  const toTime = filters.to?.getTime();
  const [state, setState] = useState<ExpensesState>({ expenses: [], loading: true, error: null });

  useEffect(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToExpenses(
      {
        archived,
        vehicleId,
        userId,
        category,
        from: fromTime !== undefined ? new Date(fromTime) : undefined,
        to: toTime !== undefined ? new Date(toTime) : undefined,
      },
      (expenses) => setState({ expenses, loading: false, error: null }),
      (message) => setState((current) => ({ ...current, loading: false, error: message })),
    );
  }, [archived, vehicleId, userId, category, fromTime, toTime]);

  return state;
}
