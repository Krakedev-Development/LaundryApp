// Mapbox: token público solo desde variables de entorno (sin fallback hardcodeado).
// Tiles y renderizado en cliente; rutas con tráfico y ETA vía backend.
export const MAPBOX_ACCESS_TOKEN: string =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "";

export const USE_MAPBOX: boolean = MAPBOX_ACCESS_TOKEN.length > 0;

export const MAPBOX_STYLES = {
  tactical: "mapbox://styles/mapbox/navigation-night-v1",
  light: "mapbox://styles/mapbox/navigation-day-v1",
} as const;
