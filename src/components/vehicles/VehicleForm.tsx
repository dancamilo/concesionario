import { useState, type FormEvent } from "react";
import Modal from "../ui/Modal";
import MoneyInput from "../ui/MoneyInput";
import { Spinner } from "../ui/Loader";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../contexts/ToastContext";
import { createVehicle, updateVehicle } from "../../services/vehicles.service";
import { describeError } from "../../services/errors";
import { fromInputDate, toInputDate } from "../../utils/dates";
import type { Vehicle, VehicleInput } from "../../types/vehicle";

interface VehicleFormProps {
  vehicle?: Vehicle;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

const FORM_ID = "vehicle-form";

export default function VehicleForm({ vehicle, onClose, onSaved }: VehicleFormProps) {
  const { profile } = useAuth();
  const { notify } = useToast();
  const [brand, setBrand] = useState(vehicle?.brand ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [year, setYear] = useState(String(vehicle?.year ?? new Date().getFullYear()));
  const [plate, setPlate] = useState(vehicle?.plate ?? "");
  const [mileage, setMileage] = useState(String(vehicle?.mileage ?? 0));
  const [purchasePrice, setPurchasePrice] = useState(vehicle?.purchasePrice ?? 0);
  const [purchaseDate, setPurchaseDate] = useState(toInputDate(vehicle?.purchaseDate));
  const [notes, setNotes] = useState(vehicle?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
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
        const id = await createVehicle(input, profile);
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
            <MoneyInput id="purchasePrice" value={purchasePrice} onChange={setPurchasePrice} />
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
