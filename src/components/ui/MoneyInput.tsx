import { formatCurrency, parseCurrency } from "../../utils/currency";

interface MoneyInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/** Se ve como "$60.000" pero entrega un número (60000). Nunca guarda texto. */
export default function MoneyInput({ id, value, onChange, disabled = false }: MoneyInputProps) {
  return (
    <input
      id={id}
      className="input"
      inputMode="numeric"
      autoComplete="off"
      placeholder="$0"
      disabled={disabled}
      value={value > 0 ? formatCurrency(value) : ""}
      onChange={(event) => onChange(parseCurrency(event.target.value))}
    />
  );
}
