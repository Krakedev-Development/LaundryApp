import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  orderService,
  type OrderTrackingDto,
} from "../src/services/orders/orderService";
import {
  GUAYAQUIL_BASE,
  GUAYAQUIL_SECTORS,
  normalizeGuayaquilCoords,
} from "../src/components/routeMapShared";
import * as orderServiceModule from "../src/services/orders/orderService";

test("Guayaquil coordinates and sectors are correctly positioned within Guayaquil polygon", () => {
  // Base coordinate check
  assert.equal(GUAYAQUIL_BASE.latitude, -2.1894);
  assert.equal(GUAYAQUIL_BASE.longitude, -79.8891);

  // Sectors check
  assert.ok(GUAYAQUIL_SECTORS.length >= 4, "Should define frequent Guayaquil sectors");
  for (const sector of GUAYAQUIL_SECTORS) {
    assert.ok(sector.name, "Sector must have a name");
    assert.ok(
      sector.latitude >= -2.35 && sector.latitude <= -2.05,
      `Sector ${sector.name} latitude ${sector.latitude} out of Guayaquil bounds`,
    );
    assert.ok(
      sector.longitude >= -80.05 && sector.longitude <= -79.80,
      `Sector ${sector.name} longitude ${sector.longitude} out of Guayaquil bounds`,
    );
  }
});

test("normalizeGuayaquilCoords standardizes legacy placeholder coordinates around Guayaquil base", () => {
  const legacyOrigin = { latitude: -12.094, longitude: -77.032 }; // Legacy Lima coords
  const legacyDest = { latitude: 0, longitude: 0 };

  const normalized = normalizeGuayaquilCoords(legacyOrigin, legacyDest);

  // Both coordinates must now be in Guayaquil polygon
  assert.ok(
    normalized.origin.latitude >= -2.30 && normalized.origin.latitude <= -2.05,
    "Origin latitude must be normalized to Guayaquil",
  );
  assert.ok(
    normalized.origin.longitude >= -80.05 && normalized.origin.longitude <= -79.80,
    "Origin longitude must be normalized to Guayaquil",
  );
  assert.ok(
    normalized.destination.latitude >= -2.30 && normalized.destination.latitude <= -2.05,
    "Destination latitude must be normalized to Guayaquil",
  );
  assert.ok(
    normalized.destination.longitude >= -80.05 && normalized.destination.longitude <= -79.80,
    "Destination longitude must be normalized to Guayaquil",
  );
});

test("el seguimiento no tiene un respaldo simulado: solo usa datos del servidor", () => {
  assert.equal("buildSimulatedTracking" in orderServiceModule, false);
});

test("orderService.getOrderTracking validates token and rejects unauthorized requests", async () => {
  await assert.rejects(
    async () => {
      const result: OrderTrackingDto = await orderService.getOrderTracking(
        "00000000-0000-0000-0000-000000000000",
        "invalid-token",
      );
      assert.ok(result);
    },
    (err: any) => {
      return (
        typeof err?.message === "string" &&
        (err.message.includes("Unauthorized") ||
          err.message.includes("No hay una sesión activa"))
      );
    },
  );
});
