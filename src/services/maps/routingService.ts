export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface DrivingRouteResult {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: LatLng[];
  isFallback?: boolean;
}

const EARTH_RADIUS_METERS = 6_371_000;
const FALLBACK_SPEED_METERS_PER_SECOND = (25 * 1000) / 3600; // 25 km/h, promedio urbano
// Las calles no siguen la línea recta: se estima el recorrido real como 1.3 veces la distancia
// directa para que el tiempo estimado no sea demasiado optimista.
export const ROAD_SINUOSITY_FACTOR = 1.3;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(EARTH_RADIUS_METERS * c);
}

export function buildHaversineFallbackRoute(
  origin: LatLng,
  destination: LatLng,
): DrivingRouteResult {
  const distanceMeters = Math.round(
    haversineDistanceMeters(origin, destination) * ROAD_SINUOSITY_FACTOR,
  );
  const durationSeconds = Math.max(
    60,
    Math.round(distanceMeters / FALLBACK_SPEED_METERS_PER_SECOND),
  );
  return {
    distanceMeters,
    durationSeconds,
    coordinates: [
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
    ],
    isFallback: true,
  };
}


export function formatRouteEta(
  distanceMeters: number,
  durationSeconds: number,
): string {
  const distText =
    distanceMeters >= 1000
      ? `${(distanceMeters / 1000).toFixed(1)} km`
      : `${Math.max(50, Math.round(distanceMeters))} m`;
  const mins = Math.max(1, Math.round(durationSeconds / 60));
  return `A ${distText} · Llega en ~${mins} min`;
}

// Respaldo cuando el backend no entrega la ruta: estimación local en línea recta, sin llamar a
// servicios de terceros desde el teléfono (la ruta real con tráfico la calcula el backend).
export async function fetchDrivingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<DrivingRouteResult> {
  return buildHaversineFallbackRoute(origin, destination);
}
