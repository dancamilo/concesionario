import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Icon from "../components/ui/Icon";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import VehicleForm from "../components/vehicles/VehicleForm";
import VehicleStatusBadge from "../components/vehicles/VehicleStatusBadge";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useExpenses } from "../hooks/useExpenses";
import { useVehicles } from "../hooks/useVehicles";
import { describeError } from "../services/errors";
import { setVehicleArchived } from "../services/vehicles.service";
import { calculateVehicleExpenses, groupExpensesByVehicle } from "../utils/calculations";
import { formatCurrency } from "../utils/currency";
import { vehicleTitle } from "../utils/vehicle";
import type { Vehicle, VehicleStatus } from "../types/vehicle";

export default function Vehicles() {
  const { profile } = useAuth();
  const { notify } = useToast();
  const { vehicles, loading, error } = useVehicles("active");
  const { expenses, loading: loadingExpenses, error: expensesError } = useExpenses({ archived: false });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | VehicleStatus>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [archiving, setArchiving] = useState<Vehicle | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const byVehicle = groupExpensesByVehicle(expenses);
    const term = search.trim().toLowerCase();
    return vehicles
      .filter((vehicle) => status === "all" || vehicle.status === status)
      .filter(
        (vehicle) => !term || `${vehicle.brand} ${vehicle.model} ${vehicle.plate}`.toLowerCase().includes(term),
      )
      .map((vehicle) => {
        const totalExpenses = calculateVehicleExpenses(byVehicle.get(vehicle.id) ?? []);
        return { vehicle, totalExpenses, totalCost: vehicle.purchasePrice + totalExpenses };
      });
  }, [vehicles, expenses, search, status]);

  const confirmArchive = async () => {
    if (!archiving) return;
    setBusy(true);
    try {
      await setVehicleArchived(archiving.id, true, profile);
      notify("success", "Vehículo archivado.");
      setArchiving(null);
    } catch (err) {
      notify("error", describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const newButton = (
    <button type="button" className="btn btn--primary" onClick={() => setFormOpen(true)}>
      <Icon name="plus" />
      Nuevo vehículo
    </button>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Vehículos</h1>
          <p className="muted">Inventario activo con su inversión total.</p>
        </div>
        <div className="page-head__actions">{newButton}</div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input
            className="input"
            type="search"
            placeholder="Buscar por marca, modelo o placa"
            aria-label="Buscar vehículos"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field">
          <select
            className="input"
            aria-label="Filtrar por estado"
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | VehicleStatus)}
          >
            <option value="all">Todos los estados</option>
            <option value="available">Disponibles</option>
            <option value="sold">Vendidos</option>
          </select>
        </div>
      </div>

      {loading || loadingExpenses ? (
        <LoadingState label="Cargando vehículos…" />
      ) : error || expensesError ? (
        <ErrorState message={error ?? expensesError ?? ""} />
      ) : vehicles.length === 0 ? (
        <EmptyState
          title="Aún no hay vehículos"
          description="Registra el primer vehículo para empezar a llevar su cuenta."
          action={newButton}
        />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin resultados" description="Ningún vehículo coincide con la búsqueda o el filtro." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Placa</th>
                <th>Estado</th>
                <th className="num">Precio compra</th>
                <th className="num">Total gastos</th>
                <th className="num">Inversión total</th>
                <th className="num">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ vehicle, totalExpenses, totalCost }) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.brand}</td>
                  <td>{vehicle.model}</td>
                  <td>
                    <span className="badge badge--plate">{vehicle.plate}</span>
                    {vehicle.partnership ? <span className="badge badge--partner">Sociedad</span> : null}
                  </td>
                  <td>
                    <VehicleStatusBadge status={vehicle.status} />
                  </td>
                  <td className="num">{formatCurrency(vehicle.purchasePrice)}</td>
                  <td className="num">{formatCurrency(totalExpenses)}</td>
                  <td className="num">
                    <strong>{formatCurrency(totalCost)}</strong>
                  </td>
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
                        className="icon-btn icon-btn--sm"
                        title="Editar"
                        aria-label={`Editar ${vehicleTitle(vehicle)}`}
                        onClick={() => setEditing(vehicle)}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--sm icon-btn--danger"
                        title="Archivar"
                        aria-label={`Archivar ${vehicleTitle(vehicle)}`}
                        onClick={() => setArchiving(vehicle)}
                      >
                        <Icon name="archive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen ? <VehicleForm onClose={() => setFormOpen(false)} /> : null}
      {editing ? <VehicleForm vehicle={editing} onClose={() => setEditing(null)} /> : null}
      {archiving ? (
        <ConfirmDialog
          title="Archivar vehículo"
          message={`${vehicleTitle(archiving)} saldrá del inventario activo. No se borra nada: conserva sus gastos y puedes restaurarlo desde Archivados.`}
          confirmLabel="Archivar"
          busy={busy}
          onConfirm={confirmArchive}
          onCancel={() => setArchiving(null)}
        />
      ) : null}
    </>
  );
}
