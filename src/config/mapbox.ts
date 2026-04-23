export const MAPBOX_ACCESS_TOKEN: string =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

export const USE_MAPBOX: boolean = !!MAPBOX_ACCESS_TOKEN;
