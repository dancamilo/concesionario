import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";
import type { UserProfile } from "../types/user";

/** Administrador autenticado que ejecuta una acción. */
export interface Actor {
  uid: string;
  name: string;
}

export async function login(email: string, password: string): Promise<User> {
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export function logout(): Promise<void> {
  return signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * Identidad real de quien escribe: el UID sale de Firebase Authentication,
 * nunca de un campo del formulario. El nombre sale del perfil en Firestore.
 */
export function requireActor(profile: UserProfile | null): Actor {
  const current = auth.currentUser;
  if (!current || !profile || profile.uid !== current.uid) {
    throw new Error("Tu sesión no es válida. Cierra sesión y vuelve a entrar.");
  }
  return { uid: current.uid, name: profile.name };
}

export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Correo o contraseña incorrectos.";
    case "auth/user-disabled":
      return "Esta cuenta está deshabilitada.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
    case "auth/network-request-failed":
      return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
    case "auth/invalid-api-key":
      return "Firebase no está configurado correctamente. Revisa el archivo .env.";
    default:
      return "No se pudo iniciar sesión. Inténtalo de nuevo.";
  }
}
