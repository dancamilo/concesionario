import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FullScreenLoader } from "../ui/Loader";

export default function ProtectedRoute() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader label="Verificando sesión…" />;
  if (!user || !profile) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
