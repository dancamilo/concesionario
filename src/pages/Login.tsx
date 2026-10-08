import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAuthErrorMessage } from "../services/auth.service";
import { isFirebaseConfigured } from "../services/firebase";
import Logo from "../components/ui/Logo";
import { Spinner } from "../components/ui/Loader";

export default function Login() {
  const { user, profile, loading, accessError, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  if (!loading && user && profile) return <Navigate to={redirectTo} replace />;

  const busy = submitting || loading;
  const message = error ?? accessError;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <section className="login__brand">
        <div className="login__wordmark">
          <Logo />
          <strong>Concesionario</strong>
        </div>
        <div>
          <h1>Cada vehículo tiene su propia cuenta.</h1>
          <p>
            Registra compras, gastos y ventas, y consulta cuánto lleva invertido cada administrador en
            cada carro.
          </p>
        </div>
        <div className="login__road" aria-hidden="true" />
      </section>

      <section className="login__panel">
        <form className="login__form" onSubmit={handleSubmit}>
          <div>
            <h2>Iniciar sesión</h2>
            <p className="muted">Usa el correo de tu cuenta de administrador.</p>
          </div>

          {!isFirebaseConfigured && (
            <div className="alert alert--warning" role="alert">
              Firebase no está configurado. Copia <code>.env.example</code> a <code>.env</code> y completa
              las variables.
            </div>
          )}
          {message && (
            <div className="alert alert--error" role="alert">
              {message}
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
            />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? <Spinner size={16} /> : null}
            {busy ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </div>
  );
}
