import { useEffect, useState } from "react";
import { subscribeToVehicles, type VehicleScope } from "../services/vehicles.service";
import type { Vehicle } from "../types/vehicle";

interface VehiclesState {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
}

export function useVehicles(scope: VehicleScope = "active"): VehiclesState {
  const [state, setState] = useState<VehiclesState>({ vehicles: [], loading: true, error: null });

  useEffect(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToVehicles(
      scope,
      (vehicles) => setState({ vehicles, loading: false, error: null }),
      (message) => setState((current) => ({ ...current, loading: false, error: message })),
    );
  }, [scope]);

  return state;
}
