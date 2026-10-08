import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { login, logout, subscribeToAuthChanges } from "../services/auth.service";
import { getUserProfile } from "../services/users.service";
import type { UserProfile } from "../types/user";

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  accessError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (!userProfile || !userProfile.active || userProfile.role !== "admin") {
          setAccessError("Tu cuenta no tiene un perfil de administrador activo.");
          await logout();
          return;
        }
        setAccessError(null);
        setUser(firebaseUser);
        setProfile(userProfile);
        setLoading(false);
      } catch {
        setAccessError("No se pudo cargar tu perfil. Revisa tu conexión y las reglas de Firestore.");
        await logout();
      }
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      accessError,
      signIn: async (email, password) => {
        setAccessError(null);
        await login(email, password);
      },
      signOut: logout,
    }),
    [user, profile, loading, accessError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
