import { useEffect, useState } from "react";
import { subscribeToVehicle } from "../services/vehicles.service";
import type { Vehicle } from "../types/vehicle";

interface VehicleState {
  vehicle: Vehicle | null;
  loading: boolean;
  error: string | null;
}

export function useVehicle(id: string): VehicleState {
  const [state, setState] = useState<VehicleState>({ vehicle: null, loading: true, error: null });

  useEffect(() => {
    setState({ vehicle: null, loading: true, error: null });
    return subscribeToVehicle(
      id,
      (vehicle) => setState({ vehicle, loading: false, error: null }),
      (message) => setState({ vehicle: null, loading: false, error: message }),
    );
  }, [id]);

  return state;
}
