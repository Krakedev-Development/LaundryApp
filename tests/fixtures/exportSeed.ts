import { testExtras, testGarments, testPlans, testPromos, testRewards, testServices } from "./testCatalog";
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
  }),
);
