import { Coordinates } from '../types';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

export interface RouteGeoJSON {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
}

/**
 * Obtiene la ruta por calles entre dos o más puntos usando la API de Directions de Mapbox.
 * Equivalente al fetch que hace RouteMap en web.
 */
export async function getRoute(stops: Coordinates[]): Promise<RouteGeoJSON | null> {
  if (stops.length < 2) return null;

  const coords = stops
    .map((s) => `${s.longitude},${s.latitude}`)
    .join(';');

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.routes?.length) return null;

    return {
      type: 'Feature',
      geometry: data.routes[0].geometry,
    };
  } catch (e) {
    console.error('[directions] Error fetching route:', e);
    return null;
  }
}
