import type { Vehicle } from "../types/vehicle";

/** "CHEVROLET SPARK" */
export function vehicleTitle(vehicle: Pick<Vehicle, "brand" | "model">): string {
  return `${vehicle.brand} ${vehicle.model}`.toUpperCase();
}

/** "Chevrolet Spark · ABC123" */
export function vehicleLabel(vehicle: Pick<Vehicle, "brand" | "model" | "plate">): string {
  return `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`;
}
