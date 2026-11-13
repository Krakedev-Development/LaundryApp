export interface PlaceSearchResult {
  id: string;
  label: string;
  subtitle: string;
  latitude: number;
  longitude: number;
}

export interface NominatimAddressDetails {
  road?: string;
  pedestrian?: string;
  footway?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
}

export interface NominatimReverseResponse {
  display_name?: string;
  address?: NominatimAddressDetails;
}

export interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    osm_id?: number | string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const GUAYAQUIL_CENTER = {
  latitude: -2.1894,
  longitude: -79.8891,
} as const;

export function formatNominatimAddress(
  data: NominatimReverseResponse | null | undefined,
): string | null {
  if (!data) return null;
  const addr = data.address;
  if (addr) {
    const streetName = addr.road || addr.pedestrian || addr.footway || "";
    const street = [streetName, addr.house_number].filter(Boolean).join(" ").trim();
    const sector = (
      addr.neighbourhood ||
      addr.suburb ||
      addr.city_district ||
      ""
    ).trim();
    const city = (addr.city || addr.town || addr.village || "").trim();

    const parts: string[] = [];
    for (const part of [street, sector, city]) {
      if (part && !parts.includes(part)) {
        parts.push(part);
      }
    }
    if (parts.length > 0) {
      return parts.join(", ");
    }
  }

  if (typeof data.display_name === "string" && data.display_name.trim()) {
    return data.display_name
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");
  }

  return null;
}

export function parsePhotonFeatures(
  features: PhotonFeature[] | null | undefined,
): PlaceSearchResult[] {
  if (!Array.isArray(features)) return [];
  const results: PlaceSearchResult[] = [];

  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const coords = f?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const longitude = Number(coords[0]);
    const latitude = Number(coords[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const props = f.properties ?? {};
    const streetLine = [props.street, props.housenumber]
      .filter(Boolean)
      .join(" ")
      .trim();
    const primaryParts: string[] = [];
    if (props.name?.trim()) primaryParts.push(props.name.trim());
    if (streetLine && !primaryParts.includes(streetLine)) {
      primaryParts.push(streetLine);
    }

    const sector = (props.district || props.suburb || "").trim();
    const city = (props.city || props.state || "").trim();
    const subtitleParts: string[] = [];
    if (sector) subtitleParts.push(sector);
    if (city && !subtitleParts.includes(city)) subtitleParts.push(city);

    const label =
      primaryParts.join(", ") ||
      subtitleParts.join(", ") ||
      `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    const subtitle = subtitleParts.join(", ") || "Guayaquil, Ecuador";

    results.push({
      id: `${props.osm_id ?? "place"}-${i}-${latitude.toFixed(5)}`,
      label,
      subtitle,
      latitude,
      longitude,
    });
  }

  return results;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      String(lat),
    )}&lon=${encodeURIComponent(String(lng))}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "es",
      },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as NominatimReverseResponse;
    return formatNominatimAddress(data);
  } catch {
    return null;
  }
}

export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      trimmed,
    )}&lat=${GUAYAQUIL_CENTER.latitude}&lon=${GUAYAQUIL_CENTER.longitude}&limit=5`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = (await response.json()) as { features?: PhotonFeature[] };
    return parsePhotonFeatures(data.features);
  } catch {
    return [];
  }
}
