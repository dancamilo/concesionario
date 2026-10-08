export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Concesionario">
      <rect width="40" height="40" rx="10" style={{ fill: "var(--accent)" }} />
      <path
        d="M9 24l2.2-6.6A3 3 0 0 1 14 15h12a3 3 0 0 1 2.8 2.4L31 24v4a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H13v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z"
        style={{ fill: "var(--ink-900)" }}
      />
      <circle cx="13.5" cy="28" r="2.4" style={{ fill: "var(--ink-900)", stroke: "var(--accent)", strokeWidth: 1.4 }} />
      <circle cx="26.5" cy="28" r="2.4" style={{ fill: "var(--ink-900)", stroke: "var(--accent)", strokeWidth: 1.4 }} />
    </svg>
  );
}
