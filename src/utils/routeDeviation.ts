export interface MapRoutePoint {
  latitude: number;
  longitude: number;
}

export const OFF_ROUTE_DISTANCE_M = 40;
export const HEADING_MISMATCH_DEG = 60;
export const MIN_SPEED_FOR_HEADING_MPS = 2;
export const OFF_ROUTE_CONFIRM_SAMPLES = 3;
export const OFF_ROUTE_CONFIRM_MS = 8_000;
export const MIN_PROGRESS_WINDOW_M = 250;
export const MAX_PLAUSIBLE_SPEED_MPS = 30;
export const MAX_PROGRESS_WINDOW_M = 3_000;
export const CONTINUITY_SLACK_M = 15;

const EARTH_RADIUS_M = 6_371_000;
const DEG_TO_RAD = Math.PI / 180;

export interface DriverFix {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
}

export interface RouteProjection {
  distanceMeters: number;
  segmentIndex: number;
  point: MapRoutePoint;
  segmentBearing: number | null;
  alongRouteMeters: number;
}

export type RouteProgressDecision =
  | { kind: "on_route"; trimmedRoute: MapRoutePoint[]; offRouteStreak: 0 }
  | { kind: "off_route_pending"; offRouteStreak: number }
  | { kind: "deviated"; offRouteStreak: number };

export type RouteMarkerPlacement =
  | {
      kind: "on_route";
      point: MapRoutePoint;
      path: MapRoutePoint[];
      bearing: number | null;
    }
  | { kind: "holding"; point: MapRoutePoint }
  | { kind: "off_route" };

export function isHeadingReliable(
  heading: number | null | undefined,
  speed: number | null | undefined,
): heading is number {
  return (
    typeof heading === "number" &&
    Number.isFinite(heading) &&
    heading >= 0 &&
    typeof speed === "number" &&
    Number.isFinite(speed) &&
    speed >= MIN_SPEED_FOR_HEADING_MPS
  );
}

export function progressWindowMeters(elapsedMs: number): number {
  const elapsedSeconds =
    Number.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs / 1000 : 0;
  return Math.min(
    MAX_PROGRESS_WINDOW_M,
    Math.max(MIN_PROGRESS_WINDOW_M, elapsedSeconds * MAX_PLAUSIBLE_SPEED_MPS),
  );
}

export function headingDifference(a: number, b: number): number {
  const diff = Math.abs((((a - b) % 360) + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

export function projectOntoSegments(
  route: MapRoutePoint[],
  location: MapRoutePoint,
): RouteProjection[] {
  if (route.length < 2) return [];

  const cosLat = Math.cos(location.latitude * DEG_TO_RAD);
  const toXY = (p: MapRoutePoint) => ({
    x: (p.longitude - location.longitude) * DEG_TO_RAD * EARTH_RADIUS_M * cosLat,
    y: (p.latitude - location.latitude) * DEG_TO_RAD * EARTH_RADIUS_M,
  });

  const projections: RouteProjection[] = [];
  let start = toXY(route[0]);
  let traveled = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const end = toXY(route[i + 1]);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSq = dx * dx + dy * dy;
    const length = Math.sqrt(lengthSq);
    const t =
      lengthSq === 0
        ? 0
        : Math.min(1, Math.max(0, -(start.x * dx + start.y * dy) / lengthSq));
    const a = route[i];
    const b = route[i + 1];

    projections.push({
      distanceMeters: Math.hypot(start.x + t * dx, start.y + t * dy),
      segmentIndex: i,
      point: {
        latitude: a.latitude + t * (b.latitude - a.latitude),
        longitude: a.longitude + t * (b.longitude - a.longitude),
      },
      segmentBearing:
        lengthSq === 0
          ? null
          : ((Math.atan2(dx, dy) / DEG_TO_RAD) + 360) % 360,
      alongRouteMeters: traveled + t * length,
    });

    traveled += length;
    start = end;
  }

  return projections;
}

export function matchRouteProgress(
  route: MapRoutePoint[],
  location: DriverFix,
  maxProgressMeters: number = MIN_PROGRESS_WINDOW_M,
): RouteProjection | null {
  const headingReliable = isHeadingReliable(location.heading, location.speed);

  const candidates = projectOntoSegments(route, location).filter(
    (projection) =>
      projection.distanceMeters <= OFF_ROUTE_DISTANCE_M &&
      projection.alongRouteMeters <= maxProgressMeters &&
      (!headingReliable ||
        projection.segmentBearing === null ||
        headingDifference(
          location.heading as number,
          projection.segmentBearing,
        ) <= HEADING_MISMATCH_DEG),
  );
  if (candidates.length === 0) return null;

  const closest = Math.min(...candidates.map((p) => p.distanceMeters));
  return (
    candidates.find((p) => p.distanceMeters <= closest + CONTINUITY_SLACK_M) ??
    null
  );
}

export function trimRouteToProjection(
  route: MapRoutePoint[],
  projection: RouteProjection,
): MapRoutePoint[] {
  return [projection.point, ...route.slice(projection.segmentIndex + 1)];
}

export function isOffRouteConfirmed(
  streak: number,
  offRouteElapsedMs: number,
): boolean {
  return (
    streak >= OFF_ROUTE_CONFIRM_SAMPLES ||
    (Number.isFinite(offRouteElapsedMs) &&
      offRouteElapsedMs >= OFF_ROUTE_CONFIRM_MS)
  );
}

export function evaluateRouteProgress(params: {
  route: MapRoutePoint[];
  location: DriverFix;
  offRouteStreak: number;
  elapsedSinceProgressMs?: number;
  offRouteElapsedMs?: number;
}): RouteProgressDecision | null {
  const {
    route,
    location,
    offRouteStreak,
    elapsedSinceProgressMs = 0,
    offRouteElapsedMs = 0,
  } = params;
  if (route.length < 2) return null;

  const projection = matchRouteProgress(
    route,
    location,
    progressWindowMeters(elapsedSinceProgressMs),
  );
  if (projection) {
    return {
      kind: "on_route",
      trimmedRoute: trimRouteToProjection(route, projection),
      offRouteStreak: 0,
    };
  }

  const streak = offRouteStreak + 1;
  return isOffRouteConfirmed(streak, offRouteElapsedMs)
    ? { kind: "deviated", offRouteStreak: streak }
    : { kind: "off_route_pending", offRouteStreak: streak };
}

export function resolveRouteMarkerPlacement(params: {
  route: MapRoutePoint[];
  location: DriverFix;
  offRouteStreak: number;
  elapsedSinceProgressMs?: number;
  offRouteElapsedMs?: number;
}): RouteMarkerPlacement | null {
  const {
    route,
    location,
    offRouteStreak,
    elapsedSinceProgressMs = 0,
    offRouteElapsedMs = 0,
  } = params;
  if (route.length < 2) return null;

  const projection = matchRouteProgress(
    route,
    location,
    progressWindowMeters(elapsedSinceProgressMs),
  );
  if (projection) {
    return {
      kind: "on_route",
      point: projection.point,
      path: [...route.slice(0, projection.segmentIndex + 1), projection.point],
      bearing: projection.segmentBearing,
    };
  }

  if (isOffRouteConfirmed(offRouteStreak + 1, offRouteElapsedMs)) {
    return { kind: "off_route" };
  }

  return { kind: "holding", point: route[0] };
}
