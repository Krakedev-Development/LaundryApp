const fs = require("node:fs");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
    }).outputText,
    filename,
  );
const { makeSeed } = require("../src/services/seed.ts");
const { DomainEngine } = require("../src/domain/engine.ts");
const rules = require("../src/domain/rules.ts");
const web = require("../src/services/laundryWebSeed.json");

const client = { userId: "CUST-DEMO", role: "CLIENTE" };
const driver = { userId: "DRV-102", role: "CHOFER" };
function fixture() {
  const engine = new DomainEngine(makeSeed());
  engine.update((d) => {
    d.drivers.forEach((v) => {
      v.operationalStatus = "AVAILABLE";
      v.mustChangePassword = false;
      v.locationAllowed = true;
    });
    d.orders = [];
    d.assignments = [];
    d.customers.find((c) => c.id === client.userId).membershipId = "premium";
  });
  const c = engine.customer(client);
  const g = engine.data.catalog.find((c) => c.id === "CAT-01");
  const items = [
    {
      id: "item-test",
      catalogId: g.id,
      name: g.name,
      serviceId: "care",
      serviceName: "Cuidado incluido",
      quantity: 5,
      unitPrice: g.price,
      notes: "",
    },
  ];
  const date = rules.addDays(rules.today(), 1);
  const deliveryDate = rules.deliveryDates(engine.data, items, date)[0];
  const draft = {
    items,
    extraIds: [],
    pickup: {
      address: c.addresses[0],
      date,
      timeSlot: "16:00 - 18:00",
      notes: "",
    },
    delivery: {
      address: c.addresses[0],
      date: deliveryDate,
      timeSlot: "16:00 - 18:00",
      notes: "",
    },
    promoCode: "",
    paymentMethod: "WALLET",
  };
  return { engine, draft };
}
test("dataset preserves Web identities, catalogue, wallet and point balances", () => {
  const d = makeSeed();
  for (const c of web.INITIAL_CUSTOMERS) {
    assert.equal(d.customers.find((v) => v.id === c.id).name, c.fullName);
    assert.equal(rules.walletBalance(d, c.id), c.walletBalance);
    assert.equal(rules.pointsBalance(d, c.id), c.points);
  }
  for (const c of web.INITIAL_CATALOG)
    assert.equal(d.catalog.find((v) => v.id === c.id).price, c.price);
  for (const o of web.INITIAL_ORDERS) {
    assert.equal(d.orders.find((v) => v.id === o.id).status, o.status);
    assert.equal(
      d.orders.find((v) => v.id === o.id).pricing.total,
      o.pricing.total,
    );
  }
});
test("KYC blocks pending and rejected customers before payment", () => {
  const { engine, draft } = fixture();
  for (const status of ["PENDING", "REJECTED", "NOT_SUBMITTED"]) {
    engine.update((d) => {
      d.customers.find((c) => c.id === client.userId).kycStatus = status;
    });
    assert.throws(
      () => engine.createOrder(client, draft, "request", true),
      /identidad/,
    );
  }
  assert.equal(engine.data.orders.length, 0);
});
test("checkout validates coordinates, dates, lead time and empty garments", () => {
  const { engine, draft } = fixture();
  assert.deepEqual(rules.deliveryDates(engine.data, draft.items, ""), []);
  assert.throws(
    () => engine.createOrder(client, { ...draft, items: [] }, "empty", true),
    /prenda/,
  );
  assert.throws(
    () =>
      engine.createOrder(
        client,
        {
          ...draft,
          pickup: {
            ...draft.pickup,
            address: {
              ...draft.pickup.address,
              coordinates: { lat: 100, lng: 0 },
            },
          },
        },
        "coords",
        true,
      ),
    /ubicación/,
  );
  assert.throws(
    () =>
      engine.createOrder(
        client,
        { ...draft, delivery: { ...draft.delivery, date: draft.pickup.date } },
        "early",
        true,
      ),
    /fecha de entrega/,
  );
  assert.throws(
    () =>
      engine.createOrder(
        client,
        { ...draft, pickup: { ...draft.pickup, timeSlot: "" } },
        "slot",
        true,
      ),
    /franja/,
  );
});
test("promotion validation checks validity, service, minimum and customer limits", () => {
  const { engine, draft } = fixture();
  const c = engine.customer(client);
  const promoDraft = { ...draft, promoCode: "FRESHSTART" };
  assert.equal(rules.quote(engine.data, c, promoDraft).discount, 4.88);
  assert.throws(
    () => rules.quote(engine.data, c, { ...draft, promoCode: "FAKE" }),
    /no existe/,
  );
  assert.throws(
    () => rules.quote(engine.data, c, { ...draft, promoCode: "EDREDON20" }),
    /mínimo/,
  );
  engine.update((d) => {
    d.promotions.find((p) => p.code === "FRESHSTART").endDate = "2000-01-01";
  });
  assert.throws(() => rules.quote(engine.data, c, promoDraft), /vigencia/);
  engine.update((d) => {
    const p = d.promotions.find((p) => p.code === "FRESHSTART");
    p.endDate = "2099-01-01";
    p.usageCount = p.usageLimit;
  });
  assert.throws(() => rules.quote(engine.data, c, promoDraft), /límite/);
});
test("payment is atomic, idempotent and appends a debit ledger entry", () => {
  const { engine, draft } = fixture();
  const initial = rules.walletBalance(engine.data, client.userId);
  const order = engine.createOrder(client, draft, "same-request", true);
  const duplicate = engine.createOrder(client, draft, "same-request", true);
  assert.equal(order.id, duplicate.id);
  assert.equal(engine.data.orders.length, 1);
  assert.equal(
    engine.data.walletTransactions.filter((t) => t.reference === order.id)
      .length,
    1,
  );
  assert.equal(
    rules.walletBalance(engine.data, client.userId),
    rules.money(initial - order.pricing.total),
  );
  assert.equal(order.status, "PICKUP_PENDING");
  assert.equal(order.payment.amount, order.pricing.total);
  assert.equal(
    engine.data.pointsLedger.filter(
      (p) => p.type === "EARN" && p.reference === order.id,
    ).length,
    0,
  );
});
test("insufficient wallet, declined card and offline checkout leave no order or debit", () => {
  const { engine, draft } = fixture();
  const count = engine.data.walletTransactions.length;
  assert.throws(
    () =>
      engine.createOrder(
        client,
        { ...draft, items: [{ ...draft.items[0], quantity: 99 }] },
        "large",
        true,
      ),
    /Saldo insuficiente/,
  );
  assert.throws(
    () => engine.createOrder(client, draft, "offline", false),
    /Conéctate/,
  );
  engine.update((d) => {
    d.cards.push({
      id: "declined",
      customerId: client.userId,
      last4: "0002",
      brand: "Visa",
      expiry: "12/28",
      primary: false,
    });
  });
  assert.throws(
    () =>
      engine.createOrder(
        client,
        { ...draft, paymentMethod: "declined" },
        "decline",
        true,
      ),
    /procesar el pago/,
  );
  assert.equal(engine.data.orders.length, 0);
  assert.equal(engine.data.walletTransactions.length, count);
});
test("dispatch assigns only available drivers and does not fabricate delivery orders", () => {
  const { engine, draft } = fixture();
  const o = engine.createOrder(client, draft, "pickup", true);
  engine.update((d) => {
    d.drivers
      .filter((v) => v.facilityId === "FAC-02")
      .forEach((v) => {
        v.operationalStatus = "BREAK";
      });
  });
  engine.dispatch();
  assert.equal(engine.data.assignments.length, 0);
  engine.update((d) => {
    d.drivers.find((v) => v.id === driver.userId).operationalStatus =
      "AVAILABLE";
  });
  engine.dispatch();
  assert.equal(engine.data.assignments[0].orderId, o.id);
  assert.equal(engine.data.assignments[0].driverId, driver.userId);
  assert.equal(engine.routeFor(driver).date, rules.today());
  assert.equal(engine.data.orders.length, 1);
});
test("driver state machine completes pickup, facility, internal plant and delivery on one order", () => {
  const { engine, draft } = fixture();
  const o = engine.createOrder(client, draft, "cycle", true);
  engine.dispatch();
  assert.throws(
    () => engine.transition(client, o.id, "HEADING_TO_PICKUP", true),
    /chofer/,
  );
  assert.throws(
    () => engine.transition(driver, o.id, "IN_PROCESS", true),
    /estado actual/,
  );
  for (const s of ["HEADING_TO_PICKUP", "ARRIVED_FOR_PICKUP"])
    engine.transition(driver, o.id, s, true);
  engine.transition(driver, o.id, "PICKED_UP", true, {
    confirmed: true,
    count: 5,
  });
  engine.transition(driver, o.id, "HEADING_TO_FACILITY", true);
  engine.transition(driver, o.id, "AT_FACILITY", true);
  assert.equal(engine.routeFor(driver).assignments.length, 0);
  for (let i = 0; i < 4; i++) engine.plantTick();
  engine.dispatch();
  assert.equal(engine.data.orders.length, 1);
  assert.equal(engine.data.assignments.length, 2);
  assert.equal(engine.order(client, o.id).status, "DELIVERY_ASSIGNED");
  engine.transition(driver, o.id, "OUT_FOR_DELIVERY", true);
  engine.transition(driver, o.id, "ARRIVED_FOR_DELIVERY", true);
  assert.throws(
    () =>
      engine.transition(driver, o.id, "DELIVERED", true, {
        confirmed: true,
        recipient: "",
        relationship: "Cliente",
      }),
    /destinatario/,
  );
  engine.transition(driver, o.id, "DELIVERED", true, {
    confirmed: true,
    recipient: "María Torres",
    relationship: "Cliente",
  });
  assert.equal(
    engine.order(client, o.id).delivery.recipient.name,
    "María Torres",
  );
  engine.plantTick();
  assert.equal(engine.order(client, o.id).status, "CLOSED");
  engine.plantTick();
  assert.equal(engine.routeFor(driver).assignments.length, 0);
  assert.equal(
    engine.data.pointsLedger.filter(
      (p) => p.type === "EARN" && p.reference === o.id,
    ).length,
    1,
  );
  assert.throws(
    () =>
      engine.transition(driver, o.id, "DELIVERED", true, {
        confirmed: true,
        recipient: "María Torres",
        relationship: "Cliente",
      }),
    /estado actual/,
  );
});
test("location and temporary-password gates cannot be bypassed through repository calls", () => {
  const { engine, draft } = fixture();
  const o = engine.createOrder(client, draft, "gate", true);
  engine.dispatch();
  engine.update((d) => {
    d.drivers.find((v) => v.id === driver.userId).mustChangePassword = true;
  });
  assert.throws(
    () => engine.transition(driver, o.id, "HEADING_TO_PICKUP", true),
    /contraseña/,
  );
  engine.update((d) => {
    const v = d.drivers.find((v) => v.id === driver.userId);
    v.mustChangePassword = false;
    v.locationAllowed = false;
  });
  assert.throws(
    () => engine.transition(driver, o.id, "HEADING_TO_PICKUP", true),
    /ubicación/,
  );
});
test("other drivers cannot inspect or modify assignments or customer orders", () => {
  const { engine, draft } = fixture();
  const o = engine.createOrder(client, draft, "private", true);
  engine.dispatch();
  const other = { userId: "DRV-101", role: "CHOFER" };
  assert.throws(() => engine.order(other, o.id), /acceso/);
  assert.equal(engine.ordersFor(other).length, 0);
  assert.equal(engine.assignmentsFor(other).length, 0);
  assert.throws(
    () => engine.order({ userId: "CUST-001", role: "CLIENTE" }, o.id),
    /acceso/,
  );
});
test("offline logistics and messages expose pending sync, then sync exactly once", () => {
  const { engine, draft } = fixture();
  const o = engine.createOrder(client, draft, "offline-cycle", true);
  engine.dispatch();
  engine.transition(driver, o.id, "HEADING_TO_PICKUP", false);
  engine.sendMessage(driver, o.id, "Estoy en camino.", false);
  assert.equal(engine.data.pendingOperations.length, 1);
  assert.equal(
    engine.order(client, o.id).timeline.at(-1).syncStatus,
    "PENDING",
  );
  assert.equal(engine.data.messages[0].syncStatus, "PENDING");
  engine.sync(false);
  assert.equal(engine.data.pendingOperations.length, 1);
  engine.sync(true);
  engine.sync(true);
  assert.equal(engine.data.pendingOperations.length, 0);
  assert.equal(engine.data.messages[0].syncStatus, "SYNCED");
  assert.equal(engine.order(client, o.id).timeline.at(-1).syncStatus, "SYNCED");
});
test("pending reward reserves points; approval debits once and wallet benefit is applied once", () => {
  const { engine } = fixture();
  engine.update((d) => {
    const c = d.customers.find((v) => v.id === client.userId);
    c.previousPurchases = 10;
    c.previousSpend = 1000;
    d.pointsLedger.push({
      id: "grant",
      customerId: c.id,
      points: 1500,
      type: "ADJUSTMENT",
      reference: "test",
      date: new Date().toISOString(),
    });
  });
  const initialWallet = rules.walletBalance(engine.data, client.userId);
  engine.requestReward(client, "REW-03", true);
  const r = engine.data.redemptions[0];
  assert.equal(r.status, "PENDING");
  assert.equal(rules.pointsBalance(engine.data, client.userId), 1500);
  assert.equal(rules.reservedPoints(engine.data, client.userId), 1200);
  assert.throws(
    () => engine.requestReward(client, "REW-03", true),
    /suficientes/,
  );
  engine.reviewReward(r.id, true);
  engine.reviewReward(r.id, true);
  assert.equal(rules.pointsBalance(engine.data, client.userId), 300);
  assert.equal(
    rules.walletBalance(engine.data, client.userId),
    initialWallet + 20,
  );
});
test("pickup discrepancy registers an incident and persists in a JSON round trip", () => {
  const { engine, draft } = fixture();
  const o = engine.createOrder(client, draft, "count", true);
  engine.dispatch();
  engine.transition(driver, o.id, "HEADING_TO_PICKUP", true);
  engine.transition(driver, o.id, "ARRIVED_FOR_PICKUP", true);
  engine.transition(driver, o.id, "PICKED_UP", true, {
    confirmed: true,
    count: 4,
    notes: "Falta una camisa.",
  });
  const restored = new DomainEngine(JSON.parse(JSON.stringify(engine.data)));
  assert.equal(restored.order(client, o.id).incidents.length, 1);
  assert.equal(restored.order(client, o.id).pickup.notes, "Falta una camisa.");
  assert.equal(restored.assignmentsFor(driver)[0].actualCount, 4);
});

test("approved reward is consumed once without changing shared plan benefits", () => {
  const { engine, draft } = fixture();
  engine.walletCredit(client, 100, true);
  engine.update((d) => {
    const c = d.customers.find((c) => c.id === client.userId);
    c.previousPurchases = 20;
    c.previousSpend = 2000;
    d.pointsLedger.push({
      id: "gift-points",
      customerId: c.id,
      points: 5000,
      type: "ADJUSTMENT",
      reference: "gift",
      date: new Date().toISOString(),
    });
  });
  engine.requestReward(client, "REW-04", true);
  const redemption = engine.data.redemptions[0];
  engine.reviewReward(redemption.id, true);
  const benefits = [
    ...engine.data.plans.find((p) => p.id === "premium").benefits,
  ];
  const order = engine.createOrder(
    client,
    { ...draft, rewardRedemptionId: redemption.id },
    "gift-order",
    true,
  );
  assert.equal(order.extras.find((e) => e.id === "REW-04").price, 0);
  assert.deepEqual(
    engine.data.plans.find((p) => p.id === "premium").benefits,
    benefits,
  );
  assert.throws(
    () =>
      engine.createOrder(
        client,
        { ...draft, rewardRedemptionId: redemption.id },
        "reuse",
        true,
      ),
    /ya no está disponible/,
  );
  assert.equal(engine.data.orders.length, 1);
});

test("rejected redemptions release reservations and refund imported debits once", () => {
  const { engine } = fixture();
  engine.update((d) => {
    const c = d.customers.find((c) => c.id === client.userId);
    c.previousPurchases = 20;
    c.previousSpend = 2000;
    d.pointsLedger.push({
      id: "grant-rejection",
      customerId: c.id,
      points: 3000,
      type: "ADJUSTMENT",
      reference: "grant",
      date: new Date().toISOString(),
    });
  });
  engine.requestReward(client, "REW-03", true);
  const first = engine.data.redemptions[0];
  engine.reviewReward(first.id, false);
  assert.equal(rules.reservedPoints(engine.data, client.userId), 0);
  assert.equal(rules.pointsBalance(engine.data, client.userId), 3000);
  engine.requestReward(client, "REW-03", true);
  const second = engine.data.redemptions[0];
  engine.update((d) =>
    d.pointsLedger.push({
      id: "imported-debit",
      customerId: client.userId,
      points: -1200,
      type: "REDEEM",
      reference: second.id,
      date: new Date().toISOString(),
    }),
  );
  engine.reviewReward(second.id, false);
  engine.reviewReward(second.id, false);
  assert.equal(rules.pointsBalance(engine.data, client.userId), 3000);
  assert.equal(
    engine.data.pointsLedger.filter(
      (p) => p.reference === `refund-${second.id}`,
    ).length,
    1,
  );
});

test("previous pickup driver cannot message the newly assigned delivery driver", () => {
  const { engine, draft } = fixture();
  const order = engine.createOrder(client, draft, "handoff", true);
  engine.dispatch();
  engine.transition(driver, order.id, "HEADING_TO_PICKUP", true);
  engine.transition(driver, order.id, "ARRIVED_FOR_PICKUP", true);
  engine.transition(driver, order.id, "PICKED_UP", true, {
    confirmed: true,
    count: 5,
  });
  engine.transition(driver, order.id, "HEADING_TO_FACILITY", true);
  engine.transition(driver, order.id, "AT_FACILITY", true);
  engine.driverStatus(driver, "BREAK");
  for (let i = 0; i < 4; i++) engine.plantTick();
  engine.dispatch();
  assert.notEqual(
    rules.activeAssignment(engine.data, engine.order(client, order.id))
      .driverId,
    driver.userId,
  );
  assert.throws(
    () =>
      engine.sendMessage(driver, order.id, "Mensaje fuera de mi etapa", true),
    /etapa actual/,
  );
  engine.sendMessage(client, order.id, "Te espero", true);
  assert.equal(engine.data.messages.length, 1);
});
