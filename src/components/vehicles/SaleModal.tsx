import { useState, type FormEvent } from "react";
import Modal from "../ui/Modal";
import MoneyInput from "../ui/MoneyInput";
import { Spinner } from "../ui/Loader";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../contexts/ToastContext";
import { registerSale } from "../../services/vehicles.service";
import { describeError } from "../../services/errors";
import { calculateProfit, calculateProfitability } from "../../utils/calculations";
import { formatCurrency, formatPercent } from "../../utils/currency";
import { fromInputDate, toInputDate } from "../../utils/dates";
import type { Vehicle } from "../../types/vehicle";

interface SaleModalProps {
  vehicle: Vehicle;
  totalCost: number;
  onClose: () => void;
}

const FORM_ID = "sale-form";

export default function SaleModal({ vehicle, totalCost, onClose }: SaleModalProps) {
  const { profile } = useAuth();
  const { notify } = useToast();
  const isEdit = vehicle.status === "sold";
  const [salePrice, setSalePrice] = useState(vehicle.salePrice ?? 0);
  const [saleDate, setSaleDate] = useState(toInputDate(vehicle.saleDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profit = calculateProfit(salePrice, totalCost);
  const margin = calculateProfitability(profit, totalCost);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (salePrice <= 0) {
      setError("El precio de venta debe ser mayor a cero.");
      return;
    }
    if (!saleDate) {
      setError("Indica la fecha de venta.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await registerSale(vehicle.id, { salePrice, saleDate: fromInputDate(saleDate) }, profile);
      notify("success", isEdit ? "Venta actualizada." : "Venta registrada.");
      onClose();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Editar venta" : "Registrar venta"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form={FORM_ID} className="btn btn--primary" disabled={saving}>
            {saving ? <Spinner size={16} /> : null}
            Guardar venta
          </button>
        </>
      }
    >
      <form id={FORM_ID} className="form" onSubmit={handleSubmit}>
        {error ? (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        ) : null}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="salePrice">Precio de venta</label>
            <MoneyInput id="salePrice" value={salePrice} onChange={setSalePrice} />
          </div>
          <div className="field">
            <label htmlFor="saleDate">Fecha de venta</label>
            <input
              id="saleDate"
              className="input"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </div>
        </div>
        <ul className="balance">
          <li>
            <span>Inversión total</span>
            <strong>{formatCurrency(totalCost)}</strong>
          </li>
          {salePrice > 0 ? (
            <>
              <li>
                <span>{profit >= 0 ? "Utilidad" : "Pérdida"}</span>
                <strong className={profit >= 0 ? "profit--positive" : "profit--negative"}>
                  {formatCurrency(profit)}
                </strong>
              </li>
              <li>
                <span>Rentabilidad</span>
                <strong>{formatPercent(margin)}</strong>
              </li>
            </>
          ) : null}
        </ul>
        <p className="hint">La utilidad se calcula sola: precio de venta menos inversión total.</p>
      </form>
    </Modal>
  );
}
