import { useAuth } from "./useAuth";
import type { UserProfile } from "../types/user";

/** Perfil del administrador autenticado (users/{uid}). */
export function useUserProfile(): { profile: UserProfile | null; loading: boolean } {
  const { profile, loading } = useAuth();
  return { profile, loading };
}
