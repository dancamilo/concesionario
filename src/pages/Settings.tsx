import { useMemo } from "react";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useAuditLogs } from "../hooks/useAuditLogs";
import { useAuth } from "../hooks/useAuth";
import { useVehicles } from "../hooks/useVehicles";
import { auditActionLabel } from "../types/audit";
import { formatDateTime } from "../utils/dates";
import { vehicleTitle } from "../utils/vehicle";

export default function Settings() {
  const { user, profile } = useAuth();
  const { logs, loading, error } = useAuditLogs({ max: 50 });
  const { vehicles } = useVehicles("all");

  const vehiclesById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle] as const)),
    [vehicles],
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Configuración</h1>
          <p className="muted">Tu perfil y la actividad reciente de los administradores.</p>
        </div>
      </div>

      <section className="card">
        <h2>Mi perfil</h2>
        <dl className="kv">
          <dt>Nombre</dt>
          <dd>{profile?.name}</dd>
          <dt>Correo</dt>
          <dd>{user?.email}</dd>
          <dt>Rol</dt>
          <dd>Administrador</dd>
          <dt>UID</dt>
          <dd className="mono">{user?.uid}</dd>
          <dt>Proyecto</dt>
          <dd className="mono">{import.meta.env.VITE_FIREBASE_PROJECT_ID}</dd>
        </dl>
      </section>

      <div className="section-title">
        <h2>Actividad reciente</h2>
      </div>
      {loading ? (
        <LoadingState label="Cargando actividad…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : logs.length === 0 ? (
        <EmptyState title="Sin actividad" description="Las acciones de los administradores aparecerán aquí." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Administrador</th>
                <th>Acción</th>
                <th>Vehículo</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const vehicle = log.vehicleId ? vehiclesById.get(log.vehicleId) : undefined;
                return (
                  <tr key={log.id}>
                    <td className="nowrap">{formatDateTime(log.timestamp)}</td>
                    <td>{log.userName}</td>
                    <td>{auditActionLabel(log.action)}</td>
                    <td>{vehicle ? vehicleTitle(vehicle) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
