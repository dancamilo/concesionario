import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ExpensesTable from "../components/expenses/ExpensesTable";
import Icon from "../components/ui/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import VehicleStatusBadge from "../components/vehicles/VehicleStatusBadge";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useExpenses } from "../hooks/useExpenses";
import { useVehicles } from "../hooks/useVehicles";
import { describeError } from "../services/errors";
import { setExpenseArchived } from "../services/expenses.service";
import { setVehicleArchived } from "../services/vehicles.service";
import { formatCurrency } from "../utils/currency";
import { formatDate } from "../utils/dates";
import { vehicleTitle } from "../utils/vehicle";
import type { Expense } from "../types/expense";
import type { Vehicle } from "../types/vehicle";

export default function Archived() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const { vehicles, loading, error } = useVehicles("all");
  const { expenses, loading: loadingExpenses, error: expensesError } = useExpenses({ archived: true });
  const [busyId, setBusyId] = useState<string | null>(null);

  const archivedVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.archived), [vehicles]);
  const vehiclesById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle] as const)),
    [vehicles],
  );

  const restoreVehicle = async (vehicle: Vehicle) => {
    setBusyId(vehicle.id);
    try {
      await setVehicleArchived(vehicle.id, false, profile);
      notify("success", "Vehículo restaurado.");
    } catch (err) {
      notify("error", describeError(err));
    } finally {
      setBusyId(null);
    }
  };

  const restoreExpense = async (expense: Expense) => {
    setBusyId(expense.id);
    try {
      await setExpenseArchived(expense, false, profile);
      notify("success", "Gasto restaurado. Vuelve a sumar al total.");
    } catch (err) {
      notify("error", describeError(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading || loadingExpenses) return <LoadingState label="Cargando archivados…" />;
  if (error || expensesError) return <ErrorState message={error ?? expensesError ?? ""} />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Archivados</h1>
          <p className="muted">Nada se borra: aquí puedes restaurar vehículos y gastos.</p>
        </div>
      </div>

      <div className="section-title">
        <h2>Vehículos archivados ({archivedVehicles.length})</h2>
      </div>
      {archivedVehicles.length === 0 ? (
        <EmptyState title="Sin vehículos archivados" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Placa</th>
                <th>Estado</th>
                <th className="num">Precio compra</th>
                <th>Archivado</th>
                <th className="num">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {archivedVehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicleTitle(vehicle)}</td>
                  <td>
                    <span className="badge badge--plate">{vehicle.plate}</span>
                  </td>
                  <td>
                    <VehicleStatusBadge status={vehicle.status} />
                  </td>
                  <td className="num">{formatCurrency(vehicle.purchasePrice)}</td>
                  <td className="nowrap">{formatDate(vehicle.updatedAt)}</td>
                  <td>
                    <div className="table__actions">
                      <Link
                        to={`/vehicles/${vehicle.id}`}
                        className="icon-btn icon-btn--sm"
                        title="Ver"
                        aria-label={`Ver ${vehicleTitle(vehicle)}`}
                      >
                        <Icon name="eye" />
                      </Link>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        disabled={busyId === vehicle.id}
                        onClick={() => restoreVehicle(vehicle)}
                      >
                        <Icon name="restore" />
                        Restaurar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-title">
        <h2>Gastos archivados ({expenses.length})</h2>
      </div>
      {expenses.length === 0 ? (
        <EmptyState title="Sin gastos archivados" />
      ) : (
        <ExpensesTable expenses={expenses} vehicles={vehiclesById} onRestore={restoreExpense} busyId={busyId} />
      )}
    </>
  );
}
