import { strict as assert } from "node:assert";
import { test } from "node:test";
import { deliveryPayload } from "../src/services/orders/deliveryPayload";
import { isServerId, slotEnd } from "../src/services/slots/slotService";

const SLOT = "6f0c1d2e-3a4b-4c5d-8e9f-0a1b2c3d4e5f";
const HOME = "11111111-2222-4333-8444-555555555555";
const OFFICE = "99999999-8888-4777-8666-555555555555";
const driver = { method: "DRIVER" as const };

test("entrega a domicilio: viaja la franja y, por defecto, la dirección de recogida", () => {
  assert.deepEqual(
    deliveryPayload(driver, { method: "DRIVER", timeSlotId: SLOT, addressId: HOME }, HOME),
    { mode: "HOME_HOME", outbound: { slotId: SLOT } },
  );
});

test("entrega a otra dirección: viaja también esa dirección", () => {
  assert.deepEqual(
    deliveryPayload(driver, { method: "DRIVER", timeSlotId: SLOT, addressId: OFFICE }, HOME),
    { mode: "HOME_HOME", outbound: { slotId: SLOT, addressId: OFFICE } },
  );
});

test("retiro en sede: modo pick up, con franja y sin dirección", () => {
  assert.deepEqual(
    deliveryPayload(driver, { method: "CUSTOMER", timeSlotId: SLOT, addressId: OFFICE }, HOME),
    { mode: "HOME_STORE", outbound: { slotId: SLOT } },
  );
});

test("una franja de la agenda guardada en el teléfono no se puede reservar", () => {
  assert.throws(
    () => deliveryPayload(driver, { method: "DRIVER", timeSlotId: "slot-7" }, HOME),
    /Vuelve a elegir la franja de entrega/,
  );
  assert.throws(
    () => deliveryPayload(driver, { method: "DRIVER" }, HOME),
    /Vuelve a elegir la franja de entrega/,
  );
});

test("una dirección de entrega que no está en el servidor se rechaza", () => {
  assert.throws(
    () => deliveryPayload(driver, { method: "DRIVER", timeSlotId: SLOT, addressId: "addr-2" }, HOME),
    /dirección de entrega no está registrada/,
  );
});

test("ayudantes: término de la franja e ids del servidor", () => {
  assert.deepEqual(slotEnd("2099-06-15", "08:00 - 12:00"), { date: "2099-06-15", time: "12:00" });
  assert.equal(slotEnd("", "08:00 - 12:00"), undefined);
  assert.equal(slotEnd("2099-06-15", ""), undefined);
  assert.equal(isServerId(SLOT), true);
  assert.equal(isServerId("slot-1"), false);
  assert.equal(isServerId(undefined), false);
});
