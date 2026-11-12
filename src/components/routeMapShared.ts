// Constantes y utilidades del mapa compartidas por la versión nativa y la web. Viven aparte
// porque RouteMap.web.tsx no puede importar a RouteMap.tsx: en web ambos resuelven al mismo archivo.

export const GUAYAQUIL_BASE = {
  latitude: -2.1894,
  longitude: -79.8891,
} as const;

export const GUAYAQUIL_SECTORS = [
  { name: "Centro", latitude: -2.1894, longitude: -79.8891 },
  { name: "Kennedy Norte", latitude: -2.1585, longitude: -79.8962 },
  { name: "Urdesa", latitude: -2.172, longitude: -79.911 },
  { name: "Samborondón", latitude: -2.145, longitude: -79.865 },
  { name: "Los Ceibos", latitude: -2.179, longitude: -79.945 },
] as const;

export const MAP_MODE_STORAGE_KEY = "laundry.map-theme-mode.v1";

export const OSM_TILE_URLS = {
  tactical: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  light: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
} as const;

export type MapThemeMode = keyof typeof OSM_TILE_URLS;

/** Normalizes legacy placeholder coordinates around Guayaquil base (-2.1894, -79.8891). */
export function normalizeGuayaquilCoords(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  const isLegacyOrigin = origin.latitude < -8 || origin.latitude === 0;
  const isLegacyDest = destination.latitude < -8 || destination.latitude === 0;

  if (!isLegacyOrigin && !isLegacyDest) {
    return { origin, destination };
  }

  const dLat =
    isLegacyOrigin && isLegacyDest
      ? Math.max(-0.025, Math.min(0.025, origin.latitude - destination.latitude))
      : 0.008;
  const dLng =
    isLegacyOrigin && isLegacyDest
      ? Math.max(
          -0.025,
          Math.min(0.025, origin.longitude - destination.longitude),
        )
      : -0.009;

  const normDest = isLegacyDest
    ? {
        latitude: GUAYAQUIL_BASE.latitude - 0.0032,
        longitude: GUAYAQUIL_BASE.longitude + 0.0038,
      }
    : destination;

  const normOrigin = isLegacyOrigin
    ? {
        latitude: normDest.latitude + (dLat || 0.0064),
        longitude: normDest.longitude + (dLng || -0.0076),
      }
    : origin;

  return { origin: normOrigin, destination: normDest };
}
