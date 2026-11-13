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

export interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      type?: string;
      coordinates?: Array<[number, number]>;
    };
  }>;
}

const EARTH_RADIUS_METERS = 6_371_000;
const FALLBACK_SPEED_METERS_PER_SECOND = (25 * 1000) / 3600; // 25 km/h

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
  const distanceMeters = haversineDistanceMeters(origin, destination);
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

export function parseOsrmRouteResponse(
  data: OsrmRouteResponse | null | undefined,
): DrivingRouteResult | null {
  if (!data || data.code !== "Ok" || !Array.isArray(data.routes)) {
    return null;
  }
  const route = data.routes[0];
  if (!route) return null;

  const rawCoords = route.geometry?.coordinates;
  if (!Array.isArray(rawCoords) || rawCoords.length === 0) {
    return null;
  }

  const coordinates: LatLng[] = [];
  for (const pair of rawCoords) {
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const lng = Number(pair[0]);
    const lat = Number(pair[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      coordinates.push({ latitude: lat, longitude: lng });
    }
  }

  if (coordinates.length === 0) return null;

  const distanceMeters = Number(route.distance);
  const durationSeconds = Number(route.duration);
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
    return null;
  }

  return {
    distanceMeters: Math.round(distanceMeters),
    durationSeconds: Math.round(durationSeconds),
    coordinates,
    isFallback: false,
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

export async function fetchDrivingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<DrivingRouteResult> {
  if (
    !Number.isFinite(origin.latitude) ||
    !Number.isFinite(origin.longitude) ||
    !Number.isFinite(destination.latitude) ||
    !Number.isFinite(destination.longitude)
  ) {
    return buildHaversineFallbackRoute(origin, destination);
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) {
      return buildHaversineFallbackRoute(origin, destination);
    }
    const data = (await response.json()) as OsrmRouteResponse;
    const parsed = parseOsrmRouteResponse(data);
    return parsed ?? buildHaversineFallbackRoute(origin, destination);
  } catch {
    return buildHaversineFallbackRoute(origin, destination);
  }
}
