import type { ReactNode } from "react";
import { Spinner } from "./Loader";

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="state">
      <Spinner size={28} />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state state--error" role="alert">
      <h3>No se pudieron cargar los datos</h3>
      <p>{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
