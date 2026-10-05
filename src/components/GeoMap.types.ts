import type { Coordinates, RouteSummary } from "../services/geo/geo.types";
export interface GeoMapProps {
  origin?: Coordinates;
  destination: Coordinates;
  label: string;
  height?: number;
  route?: RouteSummary | null;
  onPick?: (p: Coordinates) => void;
}
