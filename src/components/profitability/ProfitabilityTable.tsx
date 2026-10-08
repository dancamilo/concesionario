import { Link } from "react-router-dom";
import { formatCurrency, formatPercent } from "../../utils/currency";
import { formatDate } from "../../utils/dates";
import { vehicleTitle } from "../../utils/vehicle";
import type { Vehicle } from "../../types/vehicle";

export interface ProfitRow {
  vehicle: Vehicle;
  totalCost: number;
  salePrice: number;
  profit: number;
  margin: number;
}

export default function ProfitabilityTable({ rows }: { rows: ProfitRow[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Vehículo</th>
            <th className="num">Inversión</th>
            <th className="num">Precio venta</th>
            <th className="num">Utilidad/Pérdida</th>
            <th className="num">Rentabilidad %</th>
            <th>Fecha venta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ vehicle, totalCost, salePrice, profit, margin }) => (
            <tr key={vehicle.id}>
              <td>
                <Link to={`/vehicles/${vehicle.id}`} className="link">
                  {vehicleTitle(vehicle)}
                </Link>
                <div className="hint">{vehicle.plate}</div>
              </td>
              <td className="num">{formatCurrency(totalCost)}</td>
              <td className="num">{formatCurrency(salePrice)}</td>
              <td className={`num ${profit >= 0 ? "profit--positive" : "profit--negative"}`}>
                <strong>{formatCurrency(profit)}</strong>
              </td>
              <td className={`num ${profit >= 0 ? "profit--positive" : "profit--negative"}`}>
                {formatPercent(margin)}
              </td>
              <td className="nowrap">{formatDate(vehicle.saleDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
