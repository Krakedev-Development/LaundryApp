import { useEffect, useState } from "react";
import { routingService } from "../services/geo";
import type { Coordinates, RouteSummary } from "../services/geo/geo.types";
export function useGeoRoute(
  origin: Coordinates,
  destination: Coordinates,
  stage = "",
  online = true,
) {
  const [route, setRoute] = useState<RouteSummary | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!online) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setRoute(null);
    routingService
      .getRoute(origin, destination, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) {
          setRoute(value);
          if (!value) setError("No pudimos calcular una ruta por carretera.");
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // Route is calculated per stage/destination, not on every mock location update.
  }, [destination.lat, destination.lng, stage, online]);
  return { route, error, loading };
}
