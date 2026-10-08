import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../contexts/ToastContext";
import Icon from "../ui/Icon";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { profile, signOut } = useAuth();
  const { notify } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      notify("info", "Sesión cerrada.");
    } catch {
      notify("error", "No se pudo cerrar la sesión. Inténtalo de nuevo.");
    }
  };

  return (
    <header className="header">
      <button type="button" className="icon-btn header__menu" onClick={onMenuClick} aria-label="Abrir menú">
        <Icon name="menu" />
      </button>
      <div className="header__spacer" />
      <div className="user-chip">
        <span className="avatar" aria-hidden="true">
          {profile?.name.charAt(0).toUpperCase() ?? "?"}
        </span>
        <div>
          <strong>{profile?.name}</strong>
          <span>Administrador</span>
        </div>
      </div>
      <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
        <Icon name="logout" />
        <span>Cerrar sesión</span>
      </button>
    </header>
  );
}
