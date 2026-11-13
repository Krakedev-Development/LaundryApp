import { strict as assert } from "node:assert";
import { afterEach, test } from "node:test";
import { garments, resetCatalogToFallback } from "../src/domain/catalog";
import { fetchGarments } from "../src/services/catalog/catalogService";

// La API se simula reemplazando fetch: estas pruebas no necesitan un backend encendido.
const realFetch = globalThis.fetch;
function serve(body: unknown) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}
function offline() {
  globalThis.fetch = (async () => {
    throw new TypeError("Network request failed");
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  resetCatalogToFallback();
});

const camisa = { id: "g-1", name: "Camisa", basePrice: 2.5, active: true };

test("la app muestra las prendas que entrega el servidor", async () => {
  serve([camisa, { id: "g-2", name: "Saco", basePrice: 5, active: false }]);
  const loaded = await fetchGarments(null);
  assert.deepEqual(loaded.map((g) => g.name), ["Camisa"], "las inactivas no se ofrecen");
  assert.equal(garments[0]?.id, "g-1");
});

test("si el servidor ya no tiene prendas, la app deja de mostrar las guardadas", async () => {
  serve([camisa]);
  await fetchGarments(null);
  serve([]);
  const loaded = await fetchGarments(null);
  assert.deepEqual(loaded, []);
  assert.equal(garments.length, 0);
  // Sin conexión después, tampoco reaparecen: la copia guardada quedó vacía.
  offline();
  assert.deepEqual(await fetchGarments(null), []);
});

test("sin conexión se usa la última lista que entregó el servidor", async () => {
  serve([camisa]);
  await fetchGarments(null);
  offline();
  const loaded = await fetchGarments(null);
  assert.deepEqual(loaded.map((g) => g.name), ["Camisa"]);
});
