import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  formatNominatimAddress,
  parsePhotonFeatures,
  reverseGeocode,
  searchPlaces,
} from "../src/services/maps/geocodingService";
import {
  buildHaversineFallbackRoute,
  fetchDrivingRoute,
  formatRouteEta,
  haversineDistanceMeters,
  parseOsrmRouteResponse,
} from "../src/services/maps/routingService";

test("parseOsrmRouteResponse converts GeoJSON [lng, lat] coordinates and totals", () => {
  const parsed = parseOsrmRouteResponse({
    code: "Ok",
    routes: [
      {
        distance: 1420.6,
        duration: 295.3,
        geometry: {
          type: "LineString",
          coordinates: [
            [-79.8891, -2.1894],
            [-79.892, -2.175],
            [-79.8962, -2.1585],
          ],
        },
      },
    ],
  });

  assert.ok(parsed);
  assert.equal(parsed.isFallback, false);
  assert.equal(parsed.distanceMeters, 1421);
  assert.equal(parsed.durationSeconds, 295);
  assert.equal(parsed.coordinates.length, 3);
  assert.deepEqual(parsed.coordinates[0], {
    latitude: -2.1894,
    longitude: -79.8891,
  });
  assert.deepEqual(parsed.coordinates[2], {
    latitude: -2.1585,
    longitude: -79.8962,
  });
});

test("parseOsrmRouteResponse returns null for invalid or empty OSRM payloads", () => {
  assert.equal(parseOsrmRouteResponse(null), null);
  assert.equal(parseOsrmRouteResponse({ code: "NoRoute", routes: [] }), null);
  assert.equal(
    parseOsrmRouteResponse({
      code: "Ok",
      routes: [{ distance: 100, duration: 20, geometry: { coordinates: [] } }],
    }),
    null,
  );
});

test("haversineDistanceMeters and buildHaversineFallbackRoute compute realistic Guayaquil metrics", () => {
  const centro = { latitude: -2.1894, longitude: -79.8891 };
  const kennedy = { latitude: -2.1585, longitude: -79.8962 };

  const dist = haversineDistanceMeters(centro, kennedy);
  assert.ok(
    dist > 3000 && dist < 4200,
    `Expected ~3.5km between Centro and Kennedy Norte, got ${dist}m`,
  );

  const fallback = buildHaversineFallbackRoute(centro, kennedy);
  assert.equal(fallback.isFallback, true);
  assert.equal(fallback.distanceMeters, dist);
  assert.ok(fallback.durationSeconds >= 400 && fallback.durationSeconds <= 700);
  assert.equal(fallback.coordinates.length, 2);
});

test("fetchDrivingRoute falls back to Haversine when OSRM request fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("Simulated offline error");
  }) as typeof fetch;

  try {
    const origin = { latitude: -2.1894, longitude: -79.8891 };
    const dest = { latitude: -2.172, longitude: -79.911 };
    const route = await fetchDrivingRoute(origin, dest);

    assert.equal(route.isFallback, true);
    assert.ok(route.distanceMeters > 2000);
    assert.ok(route.durationSeconds >= 60);
    assert.equal(route.coordinates.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("formatRouteEta formats meters/kilometers and estimated minutes cleanly", () => {
  assert.equal(formatRouteEta(1420, 295), "A 1.4 km · Llega en ~5 min");
  assert.equal(formatRouteEta(450, 75), "A 450 m · Llega en ~1 min");
});

test("formatNominatimAddress builds clean readable Guayaquil address", () => {
  const formatted = formatNominatimAddress({
    address: {
      road: "Av. 9 de Octubre",
      house_number: "412",
      neighbourhood: "Centro",
      city: "Guayaquil",
    },
  });
  assert.equal(formatted, "Av. 9 de Octubre 412, Centro, Guayaquil");

  const fallbackDisplay = formatNominatimAddress({
    display_name: "Av. San Jorge, Kennedy Norte, Guayaquil, Guayas, Ecuador",
  });
  assert.equal(fallbackDisplay, "Av. San Jorge, Kennedy Norte, Guayaquil");

  assert.equal(formatNominatimAddress(null), null);
});

test("parsePhotonFeatures extracts valid Guayaquil search results and skips malformed entries", () => {
  const results = parsePhotonFeatures([
    {
      geometry: { coordinates: [-79.8962, -2.1585] },
      properties: {
        osm_id: 101,
        name: "Mall del Sol",
        street: "Av. Juan Tanca Marengo",
        district: "Kennedy Norte",
        city: "Guayaquil",
      },
    },
    {
      geometry: { coordinates: [] as unknown as [number, number] },
      properties: { name: "Invalid" },
    },
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].label, "Mall del Sol, Av. Juan Tanca Marengo");
  assert.equal(results[0].subtitle, "Kennedy Norte, Guayaquil");
  assert.equal(results[0].latitude, -2.1585);
  assert.equal(results[0].longitude, -79.8962);
});

test("searchPlaces and reverseGeocode handle short queries and offline errors gracefully", async () => {
  assert.deepEqual(await searchPlaces("a"), []);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("Simulated offline error");
  }) as typeof fetch;

  try {
    assert.deepEqual(await searchPlaces("Kennedy Norte"), []);
    assert.equal(await reverseGeocode(-2.1894, -79.8891), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
