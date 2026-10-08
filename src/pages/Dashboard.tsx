import { useMemo } from "react";
import { Link } from "react-router-dom";
import AdminBalance from "../components/expenses/AdminBalance";
import ExpensesTable from "../components/expenses/ExpensesTable";
import StatCard from "../components/dashboard/StatCard";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useAuth } from "../hooks/useAuth";
import { useExpenses } from "../hooks/useExpenses";
import { useUsers } from "../hooks/useUsers";
import { useVehicles } from "../hooks/useVehicles";
import {
  calculateExpensesByAdmin,
  calculateProfit,
  calculateVehicleExpenses,
  calculateVehicleTotalCost,
  groupExpensesByVehicle,
  sortExpensesByDate,
} from "../utils/calculations";
import { formatCurrency } from "../utils/currency";
import type { Vehicle } from "../types/vehicle";

export default function Dashboard() {
  const { profile } = useAuth();
  const { vehicles, loading: loadingVehicles, error: vehiclesError } = useVehicles("active");
  const { expenses, loading: loadingExpenses, error: expensesError } = useExpenses({ archived: false });
  const { users } = useUsers();

  const data = useMemo(() => {
    // Solo cuentan los vehículos no archivados y sus gastos activos.
    const vehicleIds = new Set(vehicles.map((vehicle) => vehicle.id));
    const scoped = expenses.filter((expense) => vehicleIds.has(expense.vehicleId));
    const byVehicle = groupExpensesByVehicle(scoped);

    let available = 0;
    let sold = 0;
    let currentInvestment = 0;
    let gains = 0;
    let losses = 0;
    for (const vehicle of vehicles) {
      const cost = calculateVehicleTotalCost(vehicle.purchasePrice, byVehicle.get(vehicle.id) ?? []);
      if (vehicle.status === "available") {
        available += 1;
        currentInvestment += cost;
      } else {
        sold += 1;
        if (vehicle.salePrice !== null) {
          const profit = calculateProfit(vehicle.salePrice, cost);
          if (profit >= 0) gains += profit;
          else losses += -profit;
        }
      }
    }

    return {
      available,
      sold,
      currentInvestment,
      gains,
      losses,
      totalExpenses: calculateVehicleExpenses(scoped),
      byAdmin: calculateExpensesByAdmin(scoped, users),
      latest: sortExpensesByDate(scoped).slice(0, 8),
    };
  }, [vehicles, expenses, users]);

  const vehiclesById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle] as const)),
    [vehicles],
  ) as Map<string, Vehicle>;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hola, {profile?.name}</h1>
          <p className="muted">Resumen del inventario activo.</p>
        </div>
      </div>

      {loadingVehicles || loadingExpenses ? (
        <LoadingState label="Calculando resumen…" />
      ) : vehiclesError || expensesError ? (
        <ErrorState message={vehiclesError ?? expensesError ?? ""} />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Vehículos activos" value={String(data.available)} hint="Disponibles para la venta" />
            <StatCard label="Vehículos vendidos" value={String(data.sold)} />
            <StatCard
              label="Inversión actual"
              value={formatCurrency(data.currentInvestment)}
              hint="Compra + gastos de los disponibles"
            />
            <StatCard label="Gastos acumulados" value={formatCurrency(data.totalExpenses)} />
            <StatCard label="Utilidad acumulada" value={formatCurrency(data.gains)} tone="positive" />
            <StatCard label="Pérdidas acumuladas" value={formatCurrency(-data.losses)} tone="negative" />
          </div>

          <AdminBalance
            title="Gastos por administrador"
            rows={data.byAdmin}
            total={data.totalExpenses}
            totalLabel="TOTAL GASTOS"
          />

          <div className="section-title">
            <h2>Últimos gastos</h2>
            <Link to="/expenses" className="link">
              Ver todos
            </Link>
          </div>
          {data.latest.length === 0 ? (
            <EmptyState
              title="Aún no hay gastos"
              description="Cuando registres gastos en un vehículo aparecerán aquí."
            />
          ) : (
            <ExpensesTable expenses={data.latest} vehicles={vehiclesById} />
          )}
        </>
      )}
    </>
  );
}
