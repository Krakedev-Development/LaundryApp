import {
  testExtras,
  testGarments,
  testPlans,
  testPromos,
  testRewards,
  testServices,
  testWeightRestrictions,
  testWeightTiers,
} from "./testCatalog";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { initializeSeededState } from "./seedState";

// Genera el estado de prueba que usan las pruebas de interfaz (Playwright). El producto
// arranca vacío: estos datos existen solo para las pruebas y no se versionan.
const state = initializeSeededState();
state.session = { id: state.customers[0].id, role: "CLIENT" };
const out = join(__dirname, "generated");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "seed-state.json"), JSON.stringify(state));
console.log("Estado de prueba generado en tests/fixtures/generated/seed-state.json");

// Catálogo de prueba que la API simulada entrega a las pruebas de interfaz.
writeFileSync(
  join(out, "catalog.json"),
  JSON.stringify({
    garments: testGarments,
    services: testServices,
    extras: testExtras,
    memberships: testPlans,
    promotions: testPromos,
    rewards: testRewards,
    "weight-tiers": testWeightTiers.map((t, i) => ({ ...t, sortOrder: i + 1, active: true })),
    "weight-restrictions": testWeightRestrictions.map((r, i) => ({ ...r, sortOrder: i + 1, active: true })),
    // Agenda con la forma que el servidor entrega al cliente: solo cupos libres, sin capacidad.
    slots: state.timeSlots
      .filter((s) => s.active && s.context !== "FACILITY_DROPOFF")
      .map((s) => ({
        id: s.id,
        facilityId: "facility-test-1",
        context: s.context,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        available: Math.max(s.capacity - s.reservedCount, 0),
      })),
  }),
);
