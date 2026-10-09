import { useState, type FormEvent } from "react";
import Modal from "../ui/Modal";
import MoneyInput from "../ui/MoneyInput";
import { Spinner } from "../ui/Loader";
import { useAuth } from "../../hooks/useAuth";
import { useUsers } from "../../hooks/useUsers";
import { useToast } from "../../contexts/ToastContext";
import { createVehicle, updateVehicle } from "../../services/vehicles.service";
import { describeError } from "../../services/errors";
import { formatCurrency } from "../../utils/currency";
import { fromInputDate, toInputDate } from "../../utils/dates";
import type { PartnerContribution, Vehicle, VehicleInput } from "../../types/vehicle";

interface VehicleFormProps {
  vehicle?: Vehicle;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

const FORM_ID = "vehicle-form";

export default function VehicleForm({ vehicle, onClose, onSaved }: VehicleFormProps) {
  const { profile } = useAuth();
  const { users, loading: loadingUsers } = useUsers();
  const { notify } = useToast();
  const [brand, setBrand] = useState(vehicle?.brand ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [year, setYear] = useState(String(vehicle?.year ?? new Date().getFullYear()));
  const [plate, setPlate] = useState(vehicle?.plate ?? "");
  const [mileage, setMileage] = useState(String(vehicle?.mileage ?? 0));
  const [purchasePrice, setPurchasePrice] = useState(vehicle?.purchasePrice ?? 0);
  const [purchaseDate, setPurchaseDate] = useState(toInputDate(vehicle?.purchaseDate));
  const [notes, setNotes] = useState(vehicle?.notes ?? "");
  // La compra en sociedad solo se define al crear el vehículo (no se muestra al editar).
  const [partnership, setPartnership] = useState(false);
  const [contributions, setContributions] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contributed = users.reduce((sum, user) => sum + (contributions[user.uid] ?? 0), 0);
  const difference = purchasePrice - contributed;

  const setContribution = (uid: string, value: number) => {
    setContributions((current) => ({ ...current, [uid]: value }));
  };

  const splitEvenly = () => {
    if (purchasePrice <= 0 || users.length === 0) return;
    const share = Math.floor(purchasePrice / users.length);
    const next: Record<string, number> = {};
    users.forEach((user, index) => {
      next[user.uid] = index === 0 ? purchasePrice - share * (users.length - 1) : share;
    });
    setContributions(next);
  };

  const validate = (): string | null => {
    const yearNumber = Number(year);
    const mileageNumber = Number(mileage);
    if (!brand.trim() || !model.trim() || !plate.trim()) return "Marca, modelo y placa son obligatorios.";
    if (!Number.isInteger(yearNumber) || yearNumber < 1900 || yearNumber > new Date().getFullYear() + 1) {
      return "El año no es válido.";
    }
    if (!Number.isInteger(mileageNumber) || mileageNumber < 0) return "El kilometraje no es válido.";
    if (purchasePrice <= 0) return "El precio de compra debe ser mayor a cero.";
    if (!purchaseDate) return "Indica la fecha de compra.";
    if (partnership) {
      if (users.length === 0) return "No se pudieron cargar los socios. Recarga la página.";
      if (contributed !== purchasePrice) {
        return `Los aportes (${formatCurrency(contributed)}) deben sumar el precio de compra (${formatCurrency(purchasePrice)}).`;
      }
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    const partners: PartnerContribution[] = partnership
      ? users
          .filter((user) => (contributions[user.uid] ?? 0) > 0)
          .map((user) => ({ userId: user.uid, userName: user.name, amount: contributions[user.uid] ?? 0 }))
      : [];
    const input: VehicleInput = {
      brand,
      model,
      year: Number(year),
      plate,
      mileage: Number(mileage),
      purchasePrice,
      purchaseDate: fromInputDate(purchaseDate),
      notes,
    };
    setError(null);
    setSaving(true);
    try {
      if (vehicle) {
        await updateVehicle(vehicle.id, input, profile);
        notify("success", "Vehículo actualizado.");
        onSaved?.(vehicle.id);
      } else {
        const id = await createVehicle({ ...input, partnership, partners }, profile);
        notify("success", "Vehículo creado.");
        onSaved?.(id);
      }
      onClose();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={vehicle ? "Editar vehículo" : "Nuevo vehículo"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form={FORM_ID} className="btn btn--primary" disabled={saving}>
            {saving ? <Spinner size={16} /> : null}
            Guardar vehículo
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
            <label htmlFor="brand">Marca</label>
            <input id="brand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="model">Modelo</label>
            <input id="model" className="input" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="year">Año</label>
            <input
              id="year"
              className="input"
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="plate">Placa</label>
            <input
              id="plate"
              className="input"
              maxLength={10}
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
            />
          </div>
          <div className="field">
            <label htmlFor="mileage">Kilometraje</label>
            <input
              id="mileage"
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="purchasePrice">Precio de compra</label>
            <MoneyInput
              id="purchasePrice"
              value={purchasePrice}
              onChange={setPurchasePrice}
              disabled={Boolean(vehicle?.partnership)}
            />
            {vehicle?.partnership ? (
              <p className="hint">No se puede cambiar el precio: el vehículo se compró en sociedad.</p>
            ) : null}
          </div>
          <div className="field span-2">
            <label htmlFor="purchaseDate">Fecha de compra</label>
            <input
              id="purchaseDate"
              className="input"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          {!vehicle ? (
          <div className="field span-2">
            <span className="field__label">¿Este vehículo se compró en sociedad?</span>
            <div className="segmented" role="group" aria-label="Compra en sociedad">
              <button
                type="button"
                className={`segmented__btn${!partnership ? " is-active" : ""}`}
                aria-pressed={!partnership}
                onClick={() => setPartnership(false)}
              >
                No
              </button>
              <button
                type="button"
                className={`segmented__btn${partnership ? " is-active" : ""}`}
                aria-pressed={partnership}
                onClick={() => setPartnership(true)}
              >
                Sí
              </button>
            </div>
          </div>
          ) : null}

          {partnership ? (
            <div className="field span-2">
              <div className="partners">
                <div className="partners__head">
                  <strong>Aporte de cada socio</strong>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={splitEvenly}>
                    Dividir en partes iguales
                  </button>
                </div>
                {loadingUsers ? <p className="hint">Cargando socios…</p> : null}
                {users.map((user) => (
                  <div className="partners__row" key={user.uid}>
                    <label htmlFor={`partner-${user.uid}`}>{user.name}</label>
                    <MoneyInput
                      id={`partner-${user.uid}`}
                      value={contributions[user.uid] ?? 0}
                      onChange={(value) => setContribution(user.uid, value)}
                    />
                  </div>
                ))}
                <p className={difference === 0 ? "hint profit--positive" : "hint profit--negative"}>
                  Aportado {formatCurrency(contributed)} de {formatCurrency(purchasePrice)}
                  {difference > 0 ? ` · faltan ${formatCurrency(difference)}` : null}
                  {difference < 0 ? ` · sobran ${formatCurrency(-difference)}` : null}
                  {difference === 0 && purchasePrice > 0 ? " · cuadra" : null}
                </p>
              </div>
            </div>
          ) : null}

          <div className="field span-2">
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
