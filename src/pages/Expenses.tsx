import { useMemo, useState } from "react";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ExpenseForm from "../components/expenses/ExpenseForm";
import ExpensesTable from "../components/expenses/ExpensesTable";
import Icon from "../components/ui/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useExpenses } from "../hooks/useExpenses";
import { useUsers } from "../hooks/useUsers";
import { useVehicles } from "../hooks/useVehicles";
import { describeError } from "../services/errors";
import { setExpenseArchived } from "../services/expenses.service";
import { calculateVehicleExpenses } from "../utils/calculations";
import { formatCurrency } from "../utils/currency";
import { endOfDay, startOfDay, toMillis } from "../utils/dates";
import { vehicleLabel } from "../utils/vehicle";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type Expense,
  type ExpenseCategory,
} from "../types/expense";

export default function Expenses() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const { expenses, loading, error } = useExpenses({ archived: false });
  const { vehicles } = useVehicles("all");
  const { users } = useUsers();
  const [vehicleId, setVehicleId] = useState("");
  const [userId, setUserId] = useState("");
  const [category, setCategory] = useState<"" | ExpenseCategory>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [formState, setFormState] = useState<{ expense?: Expense } | null>(null);
  const [archiving, setArchiving] = useState<Expense | null>(null);
  const [busy, setBusy] = useState(false);

  const vehiclesById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle] as const)),
    [vehicles],
  );

  // Todos los filtros se aplican en memoria sobre los gastos activos:
  // así no se necesita ningún índice compuesto de Firestore.
  const filtered = useMemo(() => {
    const start = from ? startOfDay(from).getTime() : null;
    const end = to ? endOfDay(to).getTime() : null;
    return expenses.filter((expense) => {
      const time = toMillis(expense.date);
      return (
        (!vehicleId || expense.vehicleId === vehicleId) &&
        (!userId || expense.userId === userId) &&
        (!category || expense.category === category) &&
        (start === null || time >= start) &&
        (end === null || time <= end)
      );
    });
  }, [expenses, vehicleId, userId, category, from, to]);

  const total = calculateVehicleExpenses(filtered);
  const hasFilters = Boolean(vehicleId || userId || category || from || to);

  const clearFilters = () => {
    setVehicleId("");
    setUserId("");
    setCategory("");
    setFrom("");
    setTo("");
  };

  const confirmArchive = async () => {
    if (!archiving) return;
    setBusy(true);
    try {
      await setExpenseArchived(archiving, true, profile);
      notify("success", "Gasto archivado. Ya no suma al total.");
      setArchiving(null);
    } catch (err) {
      notify("error", describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Gastos</h1>
          <p className="muted">Gastos activos de todos los vehículos.</p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--primary" onClick={() => setFormState({})}>
            <Icon name="plus" />
            Agregar gasto
          </button>
        </div>
      </div>

      <section className="card filters">
        <div className="field">
          <label htmlFor="fVehicle">Vehículo</label>
          <select id="fVehicle" className="input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Todos</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicleLabel(vehicle)}
                {vehicle.archived ? " (archivado)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fUser">Administrador</label>
          <select id="fUser" className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Todos</option>
            {users.map((user) => (
              <option key={user.uid} value={user.uid}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fCategory">Categoría</label>
          <select
            id="fCategory"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as "" | ExpenseCategory)}
          >
            <option value="">Todas</option>
            {EXPENSE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {EXPENSE_CATEGORY_LABELS[item]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fFrom">Desde</label>
          <input id="fFrom" className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="fTo">Hasta</label>
          <input id="fTo" className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </section>

      {loading ? (
        <LoadingState label="Cargando gastos…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="summary-bar">
            <span>
              {filtered.length} {filtered.length === 1 ? "gasto" : "gastos"} · Total <strong>{formatCurrency(total)}</strong>
            </span>
            {hasFilters ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilters}>
                Limpiar filtros
              </button>
            ) : null}
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              title={hasFilters ? "Sin resultados" : "Aún no hay gastos"}
              description={
                hasFilters
                  ? "Ningún gasto coincide con los filtros."
                  : "Agrega el primer gasto desde aquí o desde el detalle de un vehículo."
              }
            />
          ) : (
            <ExpensesTable
              expenses={filtered}
              vehicles={vehiclesById}
              onEdit={(expense) => setFormState({ expense })}
              onArchive={(expense) => setArchiving(expense)}
            />
          )}
        </>
      )}

      {formState ? (
        <ExpenseForm expense={formState.expense} vehicles={vehicles} onClose={() => setFormState(null)} />
      ) : null}
      {archiving ? (
        <ConfirmDialog
          title="Archivar gasto"
          message={`El gasto "${archiving.description}" (${formatCurrency(archiving.amount)}) dejará de sumar al total. Puedes restaurarlo desde Archivados.`}
          confirmLabel="Archivar"
          busy={busy}
          onConfirm={confirmArchive}
          onCancel={() => setArchiving(null)}
        />
      ) : null}
    </>
  );
}
