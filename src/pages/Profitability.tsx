import { useMemo } from "react";
import StatCard from "../components/dashboard/StatCard";
import ProfitabilityTable, { type ProfitRow } from "../components/profitability/ProfitabilityTable";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useExpenses } from "../hooks/useExpenses";
import { useVehicles } from "../hooks/useVehicles";
import {
  calculateProfit,
  calculateProfitability,
  calculateVehicleTotalCost,
  groupExpensesByVehicle,
} from "../utils/calculations";
import { formatCurrency } from "../utils/currency";
import { toMillis } from "../utils/dates";

export default function Profitability() {
  const { vehicles, loading, error } = useVehicles("active");
  const { expenses, loading: loadingExpenses, error: expensesError } = useExpenses({ archived: false });

  const rows = useMemo<ProfitRow[]>(() => {
    const byVehicle = groupExpensesByVehicle(expenses);
    const result: ProfitRow[] = [];
    for (const vehicle of vehicles) {
      if (vehicle.status !== "sold" || vehicle.salePrice === null) continue;
      const totalCost = calculateVehicleTotalCost(vehicle.purchasePrice, byVehicle.get(vehicle.id) ?? []);
      const profit = calculateProfit(vehicle.salePrice, totalCost);
      result.push({
        vehicle,
        totalCost,
        salePrice: vehicle.salePrice,
        profit,
        margin: calculateProfitability(profit, totalCost),
      });
    }
    return result.sort((a, b) => toMillis(b.vehicle.saleDate) - toMillis(a.vehicle.saleDate));
  }, [vehicles, expenses]);

  const totals = useMemo(() => {
    let gains = 0;
    let losses = 0;
    for (const row of rows) {
      if (row.profit >= 0) gains += row.profit;
      else losses += -row.profit;
    }
    return { gains, losses, net: gains - losses };
  }, [rows]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Rentabilidad</h1>
          <p className="muted">Vehículos vendidos: utilidad = precio de venta − inversión total.</p>
        </div>
      </div>

      {loading || loadingExpenses ? (
        <LoadingState label="Calculando rentabilidad…" />
      ) : error || expensesError ? (
        <ErrorState message={error ?? expensesError ?? ""} />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Utilidad total" value={formatCurrency(totals.gains)} tone="positive" />
            <StatCard label="Pérdida total" value={formatCurrency(-totals.losses)} tone="negative" />
            <StatCard
              label="Resultado neto"
              value={formatCurrency(totals.net)}
              tone={totals.net >= 0 ? "positive" : "negative"}
            />
          </div>
          {rows.length === 0 ? (
            <EmptyState
              title="Aún no hay ventas"
              description="Cuando registres la venta de un vehículo aparecerá aquí con su utilidad."
            />
          ) : (
            <ProfitabilityTable rows={rows} />
          )}
        </>
      )}
    </>
  );
}
