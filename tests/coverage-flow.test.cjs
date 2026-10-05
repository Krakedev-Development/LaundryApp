require("./ts-loader.cjs");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { makeSeed } = require("../src/services/seed.ts");
const { DomainEngine } = require("../src/domain/engine.ts");
const { DEMO_FACILITIES } = require("../src/services/geo/demo.ts");
const { today, addDays, deliveryDates } = require("../src/domain/rules.ts");
const session = { userId: "CUST-DEMO", role: "CLIENTE" };
test("STORE_STORE domain accepts only facility and dropoff appointment without home schedules or home coverage", () => {
  const engine = new DomainEngine(makeSeed());
  const item = engine.data.catalog.find((c) => c.id === "CAT-01");
  const draft = {
    fulfillmentMode: "STORE_STORE",
    facilityId: "FAC-02",
    customerDropoff: { date: addDays(today(), 1), timeSlot: "16:00 - 18:00" },
    items: [
      {
        id: "STORE",
        catalogId: item.id,
        serviceId: "care",
        name: item.name,
        serviceName: "Cuidado incluido",
        quantity: 3,
        unitPrice: item.price,
        notes: "",
      },
    ],
    extraIds: [],
    promoCode: "",
    paymentMethod: "WALLET",
  };
  engine.update((d) => {
    d.customers.find((c) => c.id === session.userId).addresses = [];
  });
  const order = engine.createOrder(
    session,
    draft,
    "store-without-addresses",
    true,
  );
  assert.equal(order.fulfillment.mode, "STORE_STORE");
  assert.equal(order.fulfillment.inbound.method, "CUSTOMER");
  assert.equal(order.pricing.deliveryFee, 0);
  assert.deepEqual(
    order.pickup.address.coordinates,
    DEMO_FACILITIES[1].coordinates,
  );
  engine.dispatch();
  assert.equal(
    engine.data.assignments.filter((a) => a.orderId === order.id).length,
    0,
  );
  assert.equal(
    engine.data.handoffs.find(
      (h) => h.orderId === order.id && h.type === "CUSTOMER_TO_FACILITY",
    ).status,
    "ACTIVE",
  );
});
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
