// Fixture de Playwright: la aplicación arranca vacía, así que estas pruebas siembran un
// cliente con pedidos de prueba (tests/fixtures/seedState.ts) y simulan la API.
const fs = require("node:fs");
const path = require("node:path");
const base = require("@playwright/test");

const STATE_KEY = "laundry.native-migration.v2";
const SEED = path.join(__dirname, "../fixtures/generated/seed-state.json");
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
