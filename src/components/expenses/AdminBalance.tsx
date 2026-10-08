import { formatCurrency } from "../../utils/currency";
import type { AdminTotal } from "../../utils/calculations";

interface AdminBalanceProps {
  title: string;
  rows: AdminTotal[];
  total: number;
  totalLabel?: string;
}

export default function AdminBalance({ title, rows, total, totalLabel = "TOTAL GASTOS" }: AdminBalanceProps) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <ul className="balance">
        {rows.map((row) => (
          <li key={row.userId}>
            <span>{row.name}</span>
            <strong>{formatCurrency(row.total)}</strong>
          </li>
        ))}
        <li className="balance__total">
          <span>{totalLabel}</span>
          <strong>{formatCurrency(total)}</strong>
        </li>
      </ul>
    </section>
  );
}
