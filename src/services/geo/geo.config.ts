import { DEMO_CENTER } from "./demo";
export const geoConfig = {
  accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "",
  country: process.env.EXPO_PUBLIC_APP_COUNTRY ?? "EC",
  language: process.env.EXPO_PUBLIC_APP_MAP_LANGUAGE ?? "es",
  center: {
    lat: Number(
      process.env.EXPO_PUBLIC_APP_DEFAULT_LATITUDE ?? DEMO_CENTER.lat,
    ),
    lng: Number(
      process.env.EXPO_PUBLIC_APP_DEFAULT_LONGITUDE ?? DEMO_CENTER.lng,
    ),
  },
  style:
    process.env.EXPO_PUBLIC_MAPBOX_STYLE ??
    "mapbox://styles/mapbox/streets-v12",
  permanentGeocoding:
    process.env.EXPO_PUBLIC_MAPBOX_PERMANENT_GEOCODING === "true",
  useBackendGeo: process.env.EXPO_PUBLIC_USE_BACKEND_GEO === "true",
  backendUrl: process.env.EXPO_PUBLIC_GEO_API_URL ?? "",
  mode:
    process.env.EXPO_PUBLIC_GEO_MODE ??
    (process.env.EXPO_PUBLIC_MAPBOX_TOKEN ? "mapbox" : "demo"),
  trackingIntervalMs: 3000,
  staleSeconds: 120,
  trackingMode: process.env.EXPO_PUBLIC_TRACKING_MODE ?? "mock",
};
