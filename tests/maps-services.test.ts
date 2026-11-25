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
  ROAD_SINUOSITY_FACTOR,
} from "../src/services/maps/routingService";

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
  // Recorrido estimado por calles: 1.3 veces la línea recta, a 25 km/h.
  assert.equal(ROAD_SINUOSITY_FACTOR, 1.3);
  assert.equal(fallback.distanceMeters, Math.round(dist * 1.3));
  assert.equal(fallback.durationSeconds, Math.round(fallback.distanceMeters / ((25 * 1000) / 3600)));
  assert.equal(fallback.coordinates.length, 2);
});

test("fetchDrivingRoute estima la ruta localmente sin llamar a servicios de terceros", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    throw new Error("No debe consultar la red");
  }) as typeof fetch;

  try {
    const origin = { latitude: -2.1894, longitude: -79.8891 };
    const dest = { latitude: -2.172, longitude: -79.911 };
    const route = await fetchDrivingRoute(origin, dest);

    assert.equal(calls, 0);
    assert.equal(route.isFallback, true);
    assert.equal(route.distanceMeters, Math.round(haversineDistanceMeters(origin, dest) * 1.3));
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
