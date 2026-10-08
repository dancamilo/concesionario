import type { Timestamp } from "firebase/firestore";

export type VehicleStatus = "available" | "sold";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  mileage: number;
  purchasePrice: number;
  purchaseDate: Timestamp;
  status: VehicleStatus;
  salePrice: number | null;
  saleDate: Timestamp | null;
  notes: string;
  archived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Datos que llena el usuario al crear o editar un vehículo. */
export interface VehicleInput {
  brand: string;
  model: string;
  year: number;
  plate: string;
  mileage: number;
  purchasePrice: number;
  purchaseDate: Date;
  notes: string;
}

export interface SaleInput {
  salePrice: number;
  saleDate: Date;
}

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  available: "Disponible",
  sold: "Vendido",
};
