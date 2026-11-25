import assert from "node:assert/strict";
import { test } from "node:test";
import { serviceTimeLabel } from "../src/domain/catalog";

test("el tiempo estimado del servicio se muestra en días cuando son jornadas completas", () => {
  assert.equal(serviceTimeLabel(24), "Listo en aprox. 1 día");
  assert.equal(serviceTimeLabel(48), "Listo en aprox. 2 días");
  assert.equal(serviceTimeLabel(6), "Listo en aprox. 6 h");
  assert.equal(serviceTimeLabel(36), "Listo en aprox. 36 h");
});

test("sin tiempo definido por el administrador no se muestra nada", () => {
  assert.equal(serviceTimeLabel(undefined), "");
  assert.equal(serviceTimeLabel(0), "");
});
