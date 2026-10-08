import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { requireActor } from "./auth.service";
import { logAction } from "./audit.service";
import { describeError } from "./errors";
import type { SaleInput, Vehicle, VehicleInput } from "../types/vehicle";
import type { UserProfile } from "../types/user";
import { toMillis } from "../utils/dates";

const VEHICLES = "vehicles";

export type VehicleScope = "active" | "archived" | "all";

function toVehicle(snapshot: DocumentSnapshot): Vehicle | null {
  if (!snapshot.exists()) return null;
  return {
    ...(snapshot.data({ serverTimestamps: "estimate" }) as Omit<Vehicle, "id">),
    id: snapshot.id,
  };
}

function editableFields(input: VehicleInput) {
  return {
    brand: input.brand.trim(),
    model: input.model.trim(),
    year: input.year,
    plate: input.plate.trim().toUpperCase(),
    mileage: input.mileage,
    purchasePrice: input.purchasePrice,
    purchaseDate: Timestamp.fromDate(input.purchaseDate),
    notes: input.notes.trim(),
  };
}

export function subscribeToVehicles(
  scope: VehicleScope,
  onData: (vehicles: Vehicle[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const constraints: QueryConstraint[] =
    scope === "all" ? [] : [where("archived", "==", scope === "archived")];

  return onSnapshot(
    query(collection(db, VEHICLES), ...constraints),
    (snapshot) => {
      const vehicles = snapshot.docs
        .map((item) => toVehicle(item))
        .filter((vehicle): vehicle is Vehicle => vehicle !== null);
      vehicles.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(vehicles);
    },
    (error) => onError(describeError(error)),
  );
}

export function subscribeToVehicle(
  id: string,
  onData: (vehicle: Vehicle | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, VEHICLES, id),
    (snapshot) => onData(toVehicle(snapshot)),
    (error) => onError(describeError(error)),
  );
}

export async function createVehicle(input: VehicleInput, profile: UserProfile | null): Promise<string> {
  const actor = requireActor(profile);
  const created = await addDoc(collection(db, VEHICLES), {
    ...editableFields(input),
    status: "available",
    salePrice: null,
    saleDate: null,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logAction(actor, "vehicle.create", { vehicleId: created.id });
  return created.id;
}

export async function updateVehicle(
  id: string,
  input: VehicleInput,
  profile: UserProfile | null,
): Promise<void> {
  const actor = requireActor(profile);
  await updateDoc(doc(db, VEHICLES, id), { ...editableFields(input), updatedAt: serverTimestamp() });
  await logAction(actor, "vehicle.update", { vehicleId: id });
}

/** Nunca se borra físicamente: "eliminar" = archived true. */
export async function setVehicleArchived(
  id: string,
  archived: boolean,
  profile: UserProfile | null,
): Promise<void> {
  const actor = requireActor(profile);
  await updateDoc(doc(db, VEHICLES, id), { archived, updatedAt: serverTimestamp() });
  await logAction(actor, archived ? "vehicle.archive" : "vehicle.restore", { vehicleId: id });
}

/** status = "sold", salePrice y saleDate. La utilidad NO se guarda: se calcula. */
export async function registerSale(id: string, sale: SaleInput, profile: UserProfile | null): Promise<void> {
  const actor = requireActor(profile);
  await updateDoc(doc(db, VEHICLES, id), {
    status: "sold",
    salePrice: sale.salePrice,
    saleDate: Timestamp.fromDate(sale.saleDate),
    updatedAt: serverTimestamp(),
  });
  await logAction(actor, "vehicle.sale", { vehicleId: id });
}
