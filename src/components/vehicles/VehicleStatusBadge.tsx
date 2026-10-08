import { VEHICLE_STATUS_LABELS, type VehicleStatus } from "../../types/vehicle";

export default function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return <span className={`badge badge--${status}`}>{VEHICLE_STATUS_LABELS[status]}</span>;
}
