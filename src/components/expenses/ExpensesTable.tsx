import { Link } from "react-router-dom";
import Icon from "../ui/Icon";
import { EXPENSE_CATEGORY_LABELS, type Expense } from "../../types/expense";
import type { Vehicle } from "../../types/vehicle";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/dates";
import { vehicleTitle } from "../../utils/vehicle";

interface ExpensesTableProps {
  expenses: Expense[];
  /** Si se pasa, se muestra la columna Vehículo. */
  vehicles?: Map<string, Vehicle>;
  onEdit?: (expense: Expense) => void;
  onArchive?: (expense: Expense) => void;
  onRestore?: (expense: Expense) => void;
  busyId?: string | null;
}

export default function ExpensesTable({
  expenses,
  vehicles,
  onEdit,
  onArchive,
  onRestore,
  busyId = null,
}: ExpensesTableProps) {
  const hasActions = Boolean(onEdit || onArchive || onRestore);

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            {vehicles ? <th>Vehículo</th> : null}
            <th>Administrador</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th className="num">Valor</th>
            {hasActions ? <th className="num">Acciones</th> : null}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => {
            const vehicle = vehicles?.get(expense.vehicleId);
            return (
              <tr key={expense.id}>
                <td className="nowrap">{formatDate(expense.date)}</td>
                {vehicles ? (
                  <td>
                    {vehicle ? (
                      <Link to={`/vehicles/${vehicle.id}`} className="link">
                        {vehicleTitle(vehicle)}
                      </Link>
                    ) : (
                      "—"
                    )}
                    {vehicle?.archived ? <span className="hint"> (archivado)</span> : null}
                  </td>
                ) : null}
                <td>{expense.userName}</td>
                <td>{EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}</td>
                <td>{expense.description}</td>
                <td className="num">{formatCurrency(expense.amount)}</td>
                {hasActions ? (
                  <td>
                    <div className="table__actions">
                      {onEdit ? (
                        <button
                          type="button"
                          className="icon-btn icon-btn--sm"
                          title="Editar"
                          aria-label="Editar gasto"
                          disabled={busyId === expense.id}
                          onClick={() => onEdit(expense)}
                        >
                          <Icon name="edit" />
                        </button>
                      ) : null}
                      {onArchive ? (
                        <button
                          type="button"
                          className="icon-btn icon-btn--sm icon-btn--danger"
                          title="Archivar"
                          aria-label="Archivar gasto"
                          disabled={busyId === expense.id}
                          onClick={() => onArchive(expense)}
                        >
                          <Icon name="archive" />
                        </button>
                      ) : null}
                      {onRestore ? (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          disabled={busyId === expense.id}
                          onClick={() => onRestore(expense)}
                        >
                          <Icon name="restore" />
                          Restaurar
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
