import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminBalance from "../components/expenses/AdminBalance";
import ExpenseForm from "../components/expenses/ExpenseForm";
import ExpensesTable from "../components/expenses/ExpensesTable";
import StatCard from "../components/dashboard/StatCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Icon from "../components/ui/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import SaleModal from "../components/vehicles/SaleModal";
import VehicleForm from "../components/vehicles/VehicleForm";
import VehicleStatusBadge from "../components/vehicles/VehicleStatusBadge";
import { useToast } from "../contexts/ToastContext";
import { useAuditLogs } from "../hooks/useAuditLogs";
import { useAuth } from "../hooks/useAuth";
import { useExpenses } from "../hooks/useExpenses";
import { useUsers } from "../hooks/useUsers";
import { useVehicle } from "../hooks/useVehicle";
import { describeError } from "../services/errors";
import { setExpenseArchived } from "../services/expenses.service";
import { setVehicleArchived } from "../services/vehicles.service";
import {
  calculateExpensesByAdmin,
  calculateProfit,
  calculateProfitability,
  calculateVehicleExpenses,
} from "../utils/calculations";
import { formatCurrency, formatNumber, formatPercent } from "../utils/currency";
import { formatDate, formatDateTime } from "../utils/dates";
import { vehicleTitle } from "../utils/vehicle";
import { auditActionLabel } from "../types/audit";
import type { Expense } from "../types/expense";

export default function VehicleDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { notify } = useToast();
  const { vehicle, loading, error } = useVehicle(id);
  const { expenses, loading: loadingExpenses, error: expensesError } = useExpenses({
    archived: false,
    vehicleId: id,
  });
  const { users } = useUsers();
  const { logs } = useAuditLogs({ vehicleId: id });
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [confirmVehicle, setConfirmVehicle] = useState(false);
  const [expenseModal, setExpenseModal] = useState<{ expense?: Expense } | null>(null);
  const [archivingExpense, setArchivingExpense] = useState<Expense | null>(null);
  const [busy, setBusy] = useState(false);

  const balance = useMemo(() => calculateExpensesByAdmin(expenses, users), [expenses, users]);

  if (loading || loadingExpenses) return <LoadingState label="Cargando vehículo…" />;
  if (error ?? expensesError) return <ErrorState message={error ?? expensesError ?? ""} />;
  if (!vehicle) {
    return (
      <EmptyState
        title="Vehículo no encontrado"
        description="Puede que el enlace sea incorrecto."
        action={
          <Link to="/vehicles" className="btn btn--primary">
            Volver a vehículos
          </Link>
        }
      />
    );
  }

  const totalExpenses = calculateVehicleExpenses(expenses);
  const totalCost = vehicle.purchasePrice + totalExpenses;
  const salePrice = vehicle.status === "sold" ? vehicle.salePrice : null;
  const profit = salePrice !== null ? calculateProfit(salePrice, totalCost) : null;
  const margin = profit !== null ? calculateProfitability(profit, totalCost) : null;

  const changeArchived = async (archived: boolean) => {
    setBusy(true);
    try {
      await setVehicleArchived(vehicle.id, archived, profile);
      notify("success", archived ? "Vehículo archivado." : "Vehículo restaurado.");
      setConfirmVehicle(false);
    } catch (err) {
      notify("error", describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmArchiveExpense = async () => {
    if (!archivingExpense) return;
    setBusy(true);
    try {
      await setExpenseArchived(archivingExpense, true, profile);
      notify("success", "Gasto archivado. Ya no suma al total.");
      setArchivingExpense(null);
    } catch (err) {
      notify("error", describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/vehicles" className="back-link">
        <Icon name="back" />
        Vehículos
      </Link>

      {vehicle.archived ? (
        <div className="alert alert--warning banner">
          <span>Este vehículo está archivado y no aparece en el inventario activo.</span>
          <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => changeArchived(false)}>
            <Icon name="restore" />
            Restaurar
          </button>
        </div>
      ) : null}

      <div className="detail-head">
        <div>
          <h1>{vehicleTitle(vehicle)}</h1>
          <div className="detail-meta">
            <span className="badge badge--plate">{vehicle.plate}</span>
            <VehicleStatusBadge status={vehicle.status} />
            <span>
              {vehicle.year} · {formatNumber(vehicle.mileage)} km
            </span>
          </div>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setEditingVehicle(true)}>
            <Icon name="edit" />
            Editar
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setSaleOpen(true)}>
            <Icon name="cash" />
            {vehicle.status === "sold" ? "Editar venta" : "Registrar venta"}
          </button>
          {!vehicle.archived ? (
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmVehicle(true)}>
              <Icon name="archive" />
              Archivar
            </button>
          ) : null}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Precio de compra" value={formatCurrency(vehicle.purchasePrice)} hint={formatDate(vehicle.purchaseDate)} />
        <StatCard label="Total gastos" value={formatCurrency(totalExpenses)} />
        <StatCard label="INVERSIÓN TOTAL" value={formatCurrency(totalCost)} />
        {salePrice !== null && profit !== null && margin !== null ? (
          <>
            <StatCard label="Precio de venta" value={formatCurrency(salePrice)} hint={formatDate(vehicle.saleDate)} />
            <StatCard
              label={profit >= 0 ? "UTILIDAD" : "PÉRDIDA"}
              value={formatCurrency(profit)}
              tone={profit >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Rentabilidad"
              value={formatPercent(margin)}
              tone={profit >= 0 ? "positive" : "negative"}
            />
          </>
        ) : null}
      </div>

      <div className="grid-2">
        <AdminBalance title="BALANCE POR ADMINISTRADOR" rows={balance} total={totalExpenses} totalLabel="TOTAL" />
        <section className="card">
          <h2>Información</h2>
          <dl className="kv">
            <dt>Año</dt>
            <dd>{vehicle.year}</dd>
            <dt>Kilometraje</dt>
            <dd>{formatNumber(vehicle.mileage)} km</dd>
            <dt>Comprado</dt>
            <dd>{formatDate(vehicle.purchaseDate)}</dd>
            <dt>Notas</dt>
            <dd>{vehicle.notes || "—"}</dd>
          </dl>
        </section>
      </div>

      <div className="section-title">
        <h2>HISTORIAL DE GASTOS</h2>
        <button type="button" className="btn btn--primary" onClick={() => setExpenseModal({})}>
          <Icon name="plus" />
          Agregar gasto
        </button>
      </div>
      {expenses.length === 0 ? (
        <EmptyState title="Sin gastos" description="Este vehículo aún no tiene gastos activos." />
      ) : (
        <ExpensesTable
          expenses={expenses}
          onEdit={(expense) => setExpenseModal({ expense })}
          onArchive={(expense) => setArchivingExpense(expense)}
        />
      )}

      <div className="section-title">
        <h2>Actividad del vehículo</h2>
      </div>
      {logs.length === 0 ? (
        <p className="muted">Sin actividad registrada.</p>
      ) : (
        <section className="card">
          <ul className="balance">
            {logs.slice(0, 15).map((log) => (
              <li key={log.id}>
                <span>
                  <strong>{log.userName}</strong> · {auditActionLabel(log.action)}
                </span>
                <span className="muted">{formatDateTime(log.timestamp)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editingVehicle ? <VehicleForm vehicle={vehicle} onClose={() => setEditingVehicle(false)} /> : null}
      {saleOpen ? <SaleModal vehicle={vehicle} totalCost={totalCost} onClose={() => setSaleOpen(false)} /> : null}
      {expenseModal ? (
        <ExpenseForm vehicleId={vehicle.id} expense={expenseModal.expense} onClose={() => setExpenseModal(null)} />
      ) : null}
      {confirmVehicle ? (
        <ConfirmDialog
          title="Archivar vehículo"
          message={`${vehicleTitle(vehicle)} saldrá del inventario activo. No se borra nada y puedes restaurarlo desde Archivados.`}
          confirmLabel="Archivar"
          busy={busy}
          onConfirm={() => changeArchived(true)}
          onCancel={() => setConfirmVehicle(false)}
        />
      ) : null}
      {archivingExpense ? (
        <ConfirmDialog
          title="Archivar gasto"
          message={`El gasto "${archivingExpense.description}" (${formatCurrency(archivingExpense.amount)}) dejará de sumar al total. Puedes restaurarlo desde Archivados.`}
          confirmLabel="Archivar"
          busy={busy}
          onConfirm={confirmArchiveExpense}
          onCancel={() => setArchivingExpense(null)}
        />
      ) : null}
    </>
  );
}
