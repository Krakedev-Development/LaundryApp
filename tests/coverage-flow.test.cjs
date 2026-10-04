require("./ts-loader.cjs");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { makeSeed } = require("../src/services/seed.ts");
const { DomainEngine } = require("../src/domain/engine.ts");
const { DEMO_FACILITIES } = require("../src/services/geo/demo.ts");
const { today, addDays, deliveryDates } = require("../src/domain/rules.ts");
const session = { userId: "CUST-DEMO", role: "CLIENTE" };
test("addresses and checkout reject out-of-area locations before mutating data or wallet", () => {
  const engine = new DomainEngine(makeSeed());
  const address = {
    ...engine.customer(session).addresses[0],
    coordinates: { lat: 0, lng: 0 },
  };
  const before = JSON.stringify(engine.data);
  assert.throws(() => engine.saveAddress(session, address), /zona/);
  assert.equal(JSON.stringify(engine.data), before);
  assert.throws(
    () =>
      engine.saveAddress(session, {
        ...address,
        coordinates: DEMO_FACILITIES[0].coordinates,
        persistence: "temporary",
      }),
    /guardar/,
  );
});
test("distinct covered pickup/delivery select the pickup facility and conserve both pins", () => {
  const engine = new DomainEngine(makeSeed());
  const garment = engine.data.catalog.find((c) => c.id === "CAT-01");
  const items = [
    {
      id: "test",
      catalogId: garment.id,
      serviceId: "care",
      name: garment.name,
      serviceName: "Cuidado incluido",
      quantity: 3,
      unitPrice: garment.price,
      notes: "",
    },
  ];
  const base = engine.customer(session).addresses[0],
    date = addDays(today(), 1);
  const pickup = { ...base, coordinates: DEMO_FACILITIES[0].coordinates };
  const delivery = { ...base, coordinates: DEMO_FACILITIES[2].coordinates };
  const draft = {
    items,
    extraIds: [],
    promoCode: "",
    paymentMethod: "WALLET",
    pickup: { address: pickup, date, timeSlot: "16:00 - 18:00", notes: "" },
    delivery: {
      address: delivery,
      date: deliveryDates(engine.data, items, date)[0],
      timeSlot: "16:00 - 18:00",
      notes: "",
    },
  };
  const order = engine.createOrder(session, draft, "different-pins", true);
  assert.equal(order.facilityId, "FAC-01");
  assert.deepEqual(order.pickup.address.coordinates, pickup.coordinates);
  assert.deepEqual(order.delivery.address.coordinates, delivery.coordinates);
});
