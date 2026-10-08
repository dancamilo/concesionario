import { useState, type FormEvent } from "react";
import Modal from "../ui/Modal";
import MoneyInput from "../ui/MoneyInput";
import { Spinner } from "../ui/Loader";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../contexts/ToastContext";
import { createExpense, updateExpense } from "../../services/expenses.service";
import { describeError } from "../../services/errors";
import { fromInputDate, toInputDate } from "../../utils/dates";
import { vehicleLabel } from "../../utils/vehicle";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type Expense,
  type ExpenseCategory,
  type ExpenseInput,
} from "../../types/expense";
import type { Vehicle } from "../../types/vehicle";

interface ExpenseFormProps {
  expense?: Expense;
  /** Vehículo fijo (cuando se abre desde el detalle del vehículo). */
  vehicleId?: string;
  /** Lista para elegir vehículo cuando no hay uno fijo. */
  vehicles?: Vehicle[];
  onClose: () => void;
}

const FORM_ID = "expense-form";

export default function ExpenseForm({ expense, vehicleId, vehicles = [], onClose }: ExpenseFormProps) {
  const { profile } = useAuth();
  const { notify } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState(expense?.vehicleId ?? vehicleId ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "fuel");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense?.amount ?? 0);
  const [date, setDate] = useState(toInputDate(expense?.date));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Siempre viene de la sesión (o del gasto original al editar). No es editable.
  const registeredBy = expense?.userName ?? profile?.name ?? "";
  const vehicleOptions = vehicles.filter((vehicle) => !vehicle.archived || vehicle.id === selectedVehicle);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVehicle) {
      setError("Selecciona el vehículo.");
      return;
    }
    if (!description.trim()) {
      setError("Escribe una descripción.");
      return;
    }
    if (amount <= 0) {
      setError("El valor debe ser mayor a cero.");
      return;
    }
    if (!date) {
      setError("Indica la fecha.");
      return;
    }
    const input: ExpenseInput = {
      vehicleId: selectedVehicle,
      category,
      description,
      amount,
      date: fromInputDate(date),
    };
    setError(null);
    setSaving(true);
    try {
      if (expense) {
        await updateExpense(expense.id, input, profile);
        notify("success", "Gasto actualizado.");
      } else {
        await createExpense(input, profile);
        notify("success", "Gasto registrado.");
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
      title={expense ? "Editar gasto" : "Agregar gasto"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form={FORM_ID} className="btn btn--primary" disabled={saving}>
            {saving ? <Spinner size={16} /> : null}
            Guardar gasto
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
        <div className="field">
          <span className="field__label">Registrado por</span>
          <div className="readonly-field" aria-readonly="true">
            <span aria-hidden="true">👤</span> {registeredBy}
          </div>
        </div>
        {vehicleId === undefined ? (
          <div className="field">
            <label htmlFor="expenseVehicle">Vehículo</label>
            <select
              id="expenseVehicle"
              className="input"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="">Selecciona un vehículo</option>
              {vehicleOptions.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicleLabel(vehicle)}
                  {vehicle.archived ? " (archivado)" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {EXPENSE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {EXPENSE_CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="expenseDate">Fecha</label>
            <input
              id="expenseDate"
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="field span-2">
            <label htmlFor="description">Descripción</label>
            <input
              id="description"
              className="input"
              placeholder="Ej. Tanque de gasolina"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="field span-2">
            <label htmlFor="amount">Valor</label>
            <MoneyInput id="amount" value={amount} onChange={setAmount} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
