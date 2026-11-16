import { strict as assert } from "node:assert";
import { test } from "node:test";
import { transact } from "../src/domain/repository";
import { mapBackendOrderToDomain } from "../src/services/orders/orderService";
import { initializeSeededState } from "./fixtures/seedState";

const ID = "9d0a8700-d1c1-4f74-b2ef-73db0e9fd844";
const base = {
  id: ID,
  orderNumber: 4587,
  mode: "HOME_HOME",
  facilityId: "f-1",
  paymentStatus: "PAID",
  pricingStatus: "ESTIMATED",
  total: "12.50",
  version: 5,
  createdAt: "2026-11-16T16:38:27.727Z",
};
const events = [
  { id: "e1", status: "PAYMENT_PENDING", title: "Estado: PAYMENT_PENDING", description: null, createdAt: "2026-11-16T16:38:27.727Z" },
  { id: "e2", status: "PICKUP_ASSIGNED", title: "Estado: PICKUP_ASSIGNED", description: null, createdAt: "2026-11-16T16:59:57.004Z" },
  { id: "e3", status: "HEADING_TO_PICKUP", title: "Estado: HEADING_TO_PICKUP", description: "Chofer en camino a recoger", createdAt: "2026-11-16T17:10:00.000Z" },
];

test("el historial muestra cada evento del servidor con un título claro y su nota", () => {
  const order = mapBackendOrderToDomain({ ...base, status: "HEADING_TO_PICKUP", events } as never);
  assert.deepEqual(
    order.timeline.map((e) => [e.status, e.title, e.description, e.timestamp]),
    [
      ["PAYMENT_PENDING", "Pago pendiente", "", "2026-11-16T16:38:27.727Z"],
      ["PICKUP_ASSIGNED", "Chofer asignado", "", "2026-11-16T16:59:57.004Z"],
      ["HEADING_TO_PICKUP", "Chofer en camino", "Chofer en camino a recoger", "2026-11-16T17:10:00.000Z"],
    ],
  );
});

test("sin eventos se muestra el estado actual con su nombre claro", () => {
  const order = mapBackendOrderToDomain({ ...base, status: "PICKUP_ASSIGNED" } as never);
  assert.deepEqual(order.timeline.map((e) => e.title), ["Chofer asignado"]);
});

test("sincronizar la lista (sin eventos) no borra el historial cargado del detalle", () => {
  let state = initializeSeededState(new Date("2026-11-16T12:00:00Z"));
  state.session = { id: state.customers[0].id, role: "CLIENT" };
  // 1. El detalle trae los eventos.
  state = transact(state, (r) =>
    r.syncOrdersFromApi([{ ...base, status: "HEADING_TO_PICKUP", events } as never]),
  ).state;
  const find = () =>
    state.orders.find((o) => (o as unknown as { backendId?: string }).backendId === ID)!;
  assert.equal(find().timeline.length, 3);
  // 2. Después llega la lista, sin eventos y con el estado nuevo.
  state = transact(state, (r) =>
    r.syncOrdersFromApi([{ ...base, status: "ARRIVED_FOR_PICKUP", version: 6 } as never]),
  ).state;
  assert.equal(find().status, "ARRIVED_FOR_PICKUP");
  assert.equal(find().timeline.length, 3, "el historial se conserva");
  // 3. El siguiente detalle trae el evento nuevo.
  state = transact(state, (r) =>
    r.syncOrdersFromApi([
      {
        ...base,
        status: "ARRIVED_FOR_PICKUP",
        version: 6,
        events: [
          ...events,
          { id: "e4", status: "ARRIVED_FOR_PICKUP", title: "Estado: ARRIVED_FOR_PICKUP", description: "Chofer llegó al domicilio", createdAt: "2026-11-16T17:25:00.000Z" },
        ],
      } as never,
    ]),
  ).state;
  assert.deepEqual(find().timeline.at(-1)?.title, "Chofer en tu dirección");
  assert.equal(find().timeline.length, 4);
});
