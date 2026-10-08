import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: "admin";
  active: boolean;
  createdAt: Timestamp;
}
