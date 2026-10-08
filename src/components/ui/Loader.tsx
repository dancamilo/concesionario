export function Spinner({ size = 20 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} role="status" aria-label="Cargando" />;
}

export function FullScreenLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="fullscreen-loader">
      <Spinner size={32} />
      <p>{label}</p>
    </div>
  );
}
