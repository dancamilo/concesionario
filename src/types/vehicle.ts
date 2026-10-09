import type { Timestamp } from "firebase/firestore";

export type VehicleStatus = "available" | "sold";

/** Aporte de un socio a la compra de un vehículo. */
export interface PartnerContribution {
  userId: string;
  userName: string;
  amount: number;
}

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
  /** Compra en sociedad. Los vehículos anteriores no tienen estos campos (= compra individual). */
  partnership?: boolean;
  partners?: PartnerContribution[];
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

/** Al crear: además se indica si fue compra en sociedad. No se puede cambiar al editar. */
export interface NewVehicleInput extends VehicleInput {
  partnership: boolean;
  partners: PartnerContribution[];
}

export interface SaleInput {
  salePrice: number;
  saleDate: Date;
}

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  available: "Disponible",
  sold: "Vendido",
};
