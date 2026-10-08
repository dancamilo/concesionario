/** Pesos colombianos: 10000000 -> "$10.000.000". Negativos: "-$500.000". */
export function formatCurrency(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const digits = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${value < 0 && rounded !== 0 ? "-" : ""}$${digits}`;
}

/** "$60.000" -> 60000. Ignora todo lo que no sea dígito. */
export function parseCurrency(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${String(rounded).replace(".", ",")}%`;
}

/** 120000 -> "120.000" (sin símbolo de moneda). */
export function formatNumber(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
