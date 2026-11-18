// Fixture de Playwright: la aplicación arranca vacía, así que estas pruebas siembran un
// cliente con pedidos de prueba (tests/fixtures/seedState.ts) y simulan la API.
const fs = require("node:fs");
const path = require("node:path");
const base = require("@playwright/test");

const STATE_KEY = "laundry.native-migration.v2";
const SEED = path.join(__dirname, "../fixtures/generated/seed-state.json");
const CATALOG = path.join(__dirname, "../fixtures/generated/catalog.json");
const cors = { "access-control-allow-origin": "*" };

exports.expect = base.expect;
exports.test = base.test.extend({
  seeded: [true, { option: true }],
  context: async ({ context, seeded }, use) => {
    await context.route("**/api/v1/**", (route) => {
      if (route.request().method() === "OPTIONS")
        return route.fulfill({
          status: 204,
          headers: {
            ...cors,
            "access-control-allow-headers": "*",
            "access-control-allow-methods": "*",
          },
        });
      return route.fulfill({
        status: 200,
        headers: cors,
        contentType: "application/json",
        body: "[]",
      });
    });
    // Catálogo de prueba: el producto no trae prendas, servicios ni planes propios.
    const catalog = fs.existsSync(CATALOG)
      ? JSON.parse(fs.readFileSync(CATALOG, "utf8"))
      : {};
    for (const name of ["garments", "services", "extras", "memberships", "promotions", "rewards", "weight-tiers", "weight-restrictions"])
      await context.route(`**/api/v1/catalog/${name}`, (route) =>
        route.request().method() === "OPTIONS"
          ? route.fallback()
          : route.fulfill({
              status: 200,
              headers: cors,
              contentType: "application/json",
              body: JSON.stringify(catalog[name] ?? []),
            }),
      );
    // Agenda de prueba con las mismas reglas que el servidor para el cliente: por defecto solo
    // franjas con cupo; con onlyAvailable=false también las completas (available: 0).
    await context.route(/\/api\/v1\/slots(\?.*)?$/, (route) => {
      if (route.request().method() === "OPTIONS") return route.fallback();
      const q = new URL(route.request().url()).searchParams;
      // Como el servidor, rechaza una sede que no es suya (p. ej. las sedes locales de los
      // pedidos de prueba); la app entonces usa la agenda guardada.
      if (q.get("facilityId") && q.get("facilityId") !== "facility-test-1")
        return route.fulfill({
          status: 400,
          headers: cors,
          contentType: "application/json",
          body: JSON.stringify({ message: "facilityId must be a UUID" }),
        });
      const rows = (catalog.slots ?? [])
        .filter((s) => !q.get("context") || s.context === q.get("context"))
        .filter((s) => !q.get("facilityId") || s.facilityId === q.get("facilityId"))
        .filter((s) => q.get("onlyAvailable") === "false" || s.available > 0);
      return route.fulfill({
        status: 200,
        headers: cors,
        contentType: "application/json",
        body: JSON.stringify(rows),
      });
    });
    // Sede de prueba: las pruebas de interfaz eligen sede, y el producto no trae ninguna.
    await context.route('**/api/v1/facilities', (route) =>
      route.request().method() === 'OPTIONS'
        ? route.fallback()
        : route.fulfill({
            status: 200,
            headers: cors,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                id: 'facility-test-1',
                name: 'Sede Central Norte - Planta 1',
                address: 'Av. de Prueba 123',
                city: 'Guayaquil',
                latitude: -2.1894,
                longitude: -79.8891,
                active: true,
                acceptsDropoff: false,
                allowsPickup: true,
              },
            ]),
          }),
    );
    if (seeded) {
      if (!fs.existsSync(SEED))
        throw new Error("Falta el estado de prueba: ejecuta pnpm test:ui.");
      const raw = fs.readFileSync(SEED, "utf8");
      // Tras localStorage.clear() la siguiente carga vuelve a sembrar el estado.
      await context.addInitScript(
        ({ key, raw }) => {
          if (!localStorage.getItem(key)) localStorage.setItem(key, raw);
        },
        { key: STATE_KEY, raw },
      );
    }
    await use(context);
  },
});
