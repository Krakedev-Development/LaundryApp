import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  handoffTypeForTrackingStatus,
  isCustomerLiveTrackingStatus,
  liveTrackingLegForStatus,
  parseDriverLocationFromSocketPayload,
} from "../src/utils/orderTracking";
import {
  evaluateRouteProgress,
  resolveRouteMarkerPlacement,
} from "../src/utils/routeDeviation";

test("isCustomerLiveTrackingStatus enables map only when driver heads to customer home", () => {
  for (const s of [
    "PICKUP_ASSIGNED",
    "HEADING_TO_PICKUP",
    "ARRIVED_FOR_PICKUP",
  ]) {
    assert.equal(isCustomerLiveTrackingStatus(s), true, s);
    assert.equal(liveTrackingLegForStatus(s), "INBOUND", s);
  }
  for (const s of [
    "DELIVERY_ASSIGNED",
    "OUT_FOR_DELIVERY",
    "ARRIVED_FOR_DELIVERY",
  ]) {
    assert.equal(isCustomerLiveTrackingStatus(s), true, s);
    assert.equal(liveTrackingLegForStatus(s), "OUTBOUND", s);
  }
  for (const s of [
    "CONFIRMED",
    "PICKED_UP",
    "HEADING_TO_FACILITY",
    "AT_FACILITY",
    "IN_PROCESS",
    "READY_FOR_DELIVERY",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
  ]) {
    assert.equal(isCustomerLiveTrackingStatus(s), false, s);
    assert.equal(liveTrackingLegForStatus(s), null, s);
  }
});

test("handoffTypeForTrackingStatus resolves PIN/QR handoff type for pickup and delivery", () => {
  assert.equal(
    handoffTypeForTrackingStatus("HEADING_TO_PICKUP"),
    "CUSTOMER_TO_DRIVER",
  );
  assert.equal(
    handoffTypeForTrackingStatus("ARRIVED_FOR_PICKUP"),
    "CUSTOMER_TO_DRIVER",
  );
  assert.equal(
    handoffTypeForTrackingStatus("OUT_FOR_DELIVERY"),
    "DRIVER_TO_CUSTOMER",
  );
  assert.equal(
    handoffTypeForTrackingStatus("ARRIVED_FOR_DELIVERY"),
    "DRIVER_TO_CUSTOMER",
  );
  assert.equal(handoffTypeForTrackingStatus("HEADING_TO_FACILITY"), null);
});

test("parseDriverLocationFromSocketPayload parses nested and flat payloads and rejects invalid coords", () => {
  const nested = parseDriverLocationFromSocketPayload({
    orderId: "ord-1",
    location: {
      lat: -2.1894,
      lng: -79.8891,
      heading: 120,
      speed: 8.5,
      locationAt: "2026-11-23T14:00:00.000Z",
    },
  });
  assert.ok(nested);
  assert.equal(nested.latitude, -2.1894);
  assert.equal(nested.longitude, -79.8891);
  assert.equal(nested.heading, 120);
  assert.equal(nested.speed, 8.5);

  assert.equal(
    parseDriverLocationFromSocketPayload({ location: { lat: 0, lng: 0 } }),
    null,
  );
});

test("evaluateRouteProgress snaps driver on route, trims polyline, and detects deviation", () => {
  const route = [
    { latitude: -2.1894, longitude: -79.8891 },
    { latitude: -2.1884, longitude: -79.8891 }, // ~111m north
    { latitude: -2.1874, longitude: -79.8891 }, // ~222m north
  ];

  // Driver on route ~55m north (heading ~0 deg north)
  const onRoute = evaluateRouteProgress({
    route,
    location: { latitude: -2.1889, longitude: -79.8891, heading: 2, speed: 6 },
    offRouteStreak: 0,
  });
  assert.ok(onRoute);
  assert.equal(onRoute.kind, "on_route");
  assert.equal(onRoute.offRouteStreak, 0);

  const placement = resolveRouteMarkerPlacement({
    route,
    location: { latitude: -2.1889, longitude: -79.8891, heading: 2, speed: 6 },
    offRouteStreak: 0,
  });
  assert.ok(placement);
  assert.equal(placement.kind, "on_route");

  // Driver > 100m east of route: first sample -> pending, third sample -> deviated
  const pending = evaluateRouteProgress({
    route,
    location: { latitude: -2.1889, longitude: -79.8875, heading: 90, speed: 6 },
    offRouteStreak: 0,
  });
  assert.equal(pending?.kind, "off_route_pending");

  const deviated = evaluateRouteProgress({
    route,
    location: { latitude: -2.1889, longitude: -79.8875, heading: 90, speed: 6 },
    offRouteStreak: 2,
  });
  assert.equal(deviated?.kind, "deviated");
});
