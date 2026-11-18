import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  freeSeats,
  mapBackendSlotToTimeSlot,
  seatsLabel,
} from "../src/services/slots/slotService";

const base = {
  id: "s-1",
  facilityId: "f-1",
  context: "DRIVER_PICKUP" as const,
  date: "2099-06-15",
  startTime: "08:00",
  endTime: "12:00",
};

test("el cliente ve los cupos libres que informa el servidor", () => {
  const slot = mapBackendSlotToTimeSlot({ ...base, available: 3 });
  assert.equal(freeSeats(slot), 3);
  assert.equal(slot.active, true);
  assert.equal(seatsLabel(freeSeats(slot)), "3 cupos disponibles");
  assert.equal(seatsLabel(1), "1 cupo disponible");
});

test("una franja completa sigue activa pero sin cupo, para mostrarla como Completo", () => {
  const slot = mapBackendSlotToTimeSlot({ ...base, available: 0 });
  assert.equal(slot.active, true);
  assert.equal(freeSeats(slot), 0);
});

test("con datos del personal se respetan capacidad, reservas y estado", () => {
  const slot = mapBackendSlotToTimeSlot({
    ...base,
    available: 0,
    capacity: 10,
    reservedCount: 4,
    active: false,
  });
  assert.deepEqual(
    [slot.capacity, slot.reservedCount, slot.active, freeSeats(slot)],
    [10, 4, false, 6],
  );
});

test("valores inválidos del servidor no generan cupos", () => {
  const slot = mapBackendSlotToTimeSlot({ ...base, available: Number.NaN });
  assert.equal(freeSeats(slot), 0);
  assert.equal(freeSeats(mapBackendSlotToTimeSlot({ ...base, available: -2 })), 0);
});
