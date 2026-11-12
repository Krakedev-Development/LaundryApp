import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  orderService,
  buildSimulatedTracking,
  type OrderTrackingDto,
} from "../src/services/orders/orderService";
import {
  GUAYAQUIL_BASE,
  GUAYAQUIL_SECTORS,
  normalizeGuayaquilCoords,
} from "../src/components/routeMapShared";
import { initializeSeededState } from "./fixtures/seedState";
import { visibleOrders } from "../src/domain/repository";

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

test("buildSimulatedTracking constructs a complete OrderTrackingDto contract from local domain Order", () => {
  const state = initializeSeededState();
  const orders = visibleOrders(state);
  assert.ok(orders.length > 0, "Seeded state should contain sample orders");

  const order = orders[0];
  const tracking = buildSimulatedTracking(order);

  // Check top-level tracking contract
  assert.equal(tracking.orderId, order.id);
  assert.ok(Number.isInteger(tracking.orderNumber));
  assert.equal(tracking.status, order.status);
  assert.ok(["HOME_HOME", "HOME_STORE"].includes(tracking.mode));

  // Check customer address
  assert.ok(tracking.customerAddress.text);
  assert.ok(Number.isFinite(tracking.customerAddress.latitude));
  assert.ok(Number.isFinite(tracking.customerAddress.longitude));

  // Check facility
  assert.ok(tracking.facility.id);
  assert.ok(tracking.facility.name);
  assert.ok(Number.isFinite(tracking.facility.latitude));
  assert.ok(Number.isFinite(tracking.facility.longitude));

  // Check driver logic
  if (order.assignedDriverName || order.assignedDriverId) {
    assert.ok(tracking.assignedDriver, "Assigned driver must be populated");
    assert.equal(tracking.assignedDriver.name, order.assignedDriverName);
    assert.ok(
      tracking.assignedDriver.status === "AVAILABLE" ||
        tracking.assignedDriver.status === "ON_SERVICE",
    );
  }
});

test("buildSimulatedTracking correctly maps activeLeg based on transit status", () => {
  const state = initializeSeededState();
  const order = { ...visibleOrders(state)[0] };

  // Inbound transit statuses
  order.status = "HEADING_TO_PICKUP";
  assert.equal(buildSimulatedTracking(order).activeLeg, "INBOUND");

  order.status = "PICKUP_ASSIGNED";
  assert.equal(buildSimulatedTracking(order).activeLeg, "INBOUND");

  // Outbound transit statuses
  order.status = "OUT_FOR_DELIVERY";
  assert.equal(buildSimulatedTracking(order).activeLeg, "OUTBOUND");

  order.status = "DELIVERY_ASSIGNED";
  assert.equal(buildSimulatedTracking(order).activeLeg, "OUTBOUND");

  // Non-transit status
  order.status = "DELIVERED";
  assert.equal(buildSimulatedTracking(order).activeLeg, null);
});
