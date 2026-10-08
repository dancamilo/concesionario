import type { Timestamp } from "firebase/firestore";

type DateLike = Timestamp | Date | null | undefined;

const pad = (value: number): string => String(value).padStart(2, "0");

export function toDate(value: DateLike): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : value.toDate();
}

export function toMillis(value: DateLike): number {
  const date = toDate(value);
  return date ? date.getTime() : 0;
}

/** dd/mm/aaaa */
export function formatDate(value: DateLike): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDateTime(value: DateLike): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** aaaa-mm-dd para <input type="date">. Sin valor devuelve la fecha de hoy. */
export function toInputDate(value?: DateLike): string {
  const date = toDate(value) ?? new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Convierte aaaa-mm-dd a Date al mediodía local (evita saltos de día por zona horaria). */
export function fromInputDate(text: string): Date {
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function startOfDay(text: string): Date {
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function endOfDay(text: string): Date {
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}
