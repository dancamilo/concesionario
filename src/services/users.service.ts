import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile } from "../types/user";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return { ...(snapshot.data() as Omit<UserProfile, "uid">), uid: snapshot.id };
}

/** Todos los perfiles (los dos administradores), ordenados por nombre. */
export async function listUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs
    .map((item) => ({ ...(item.data() as Omit<UserProfile, "uid">), uid: item.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
