import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { facilities } from "../src/domain/catalog";
import { modeFor, type AppState, type Leg, type Method, type OrderItem } from "../src/domain/models";
import { calculatePricing, initializeState, LaundryRepository, refreshSchedule, slotRange, today, transact, visibleOrders } from "../src/domain/repository";
import { decodeState, PersistenceQueue, STORAGE_KEY } from "../src/store/persistence";
const now = new Date("2026-10-07T12:00:00Z");
const shirt: OrderItem = {
  id: "g-1",
  garmentType: "Camisas / Blusas",
  quantity: 2,
  serviceType: "Lavado + Planchado",
  unitPrice: 4,
  notes: "",
  iconName: "shirt-outline",
};
function leg(s: AppState, method: Method, outbound: boolean): Leg {
  const context = outbound
    ? method === "DRIVER"
      ? "DRIVER_DELIVERY"
      : "FACILITY_PICKUP"
    : method === "DRIVER"
      ? "DRIVER_PICKUP"
      : "FACILITY_DROPOFF";
  const slot = s.timeSlots.find(
    (slot) =>
      slot.context === context &&
      slot.active &&
      slot.reservedCount < slot.capacity,
  )!;
  const f = facilities[0],
    a = s.customers[0].addresses[0];
  return {
    method,
    facilityId: method === "CUSTOMER" ? f.id : undefined,
    facilityName: method === "CUSTOMER" ? f.name : undefined,
    addressId: method === "DRIVER" ? a.id : undefined,
    addressFull: method === "DRIVER" ? a.fullAddress : f.address,
    scheduledDate: slot.date,
    timeSlotId: slot.id,
    timeSlotText: slotRange(slot),
    status: "SCHEDULED",
    latitude: a.latitude,
    longitude: a.longitude,
  };
}
function harness() {
  let state = initializeState(now);
  return {
    get state() {
      return state;
    },
    run<T>(fn: (r: LaundryRepository) => T) {
      const outcome = transact(state, fn, now);
      state = outcome.state;
      return outcome.result;
    },
  };
}
function input(
  s: AppState,
  inbound: Method = "DRIVER",
  outbound: Method = "DRIVER",
) {
  return {
    items: [shirt],
    extraIds: [],
    inbound: leg(s, inbound, false),
    outbound: leg(s, outbound, true),
    pricingModel: "FIXED" as const,
    paymentMethod: "Billetera",
    notes: "Timbre 502",
  };
}
test("per-weight order defers debit until certified weight, then pays once and earns points once", () => {
  const h = harness();
  const balance = h.state.customers[0].walletBalance;
  const o = h.run((r) =>
    r.createOrder({
      ...input(h.state, "DRIVER", "CUSTOMER"),
      items: [],
      pricingModel: "PER_WEIGHT",
      estimatedWeightLb: 10,
    }),
  );
  assert.equal(o.paymentStatus, "PENDIENTE_PESO");
  assert.equal(h.state.customers[0].walletBalance, balance);
  assert.equal(h.state.customers[0].loyaltyPoints, 1540);
  assert.throws(() => h.run((r) => r.confirmWeightAndPay(o.id)), /pesaje/);
  intake(h, o.id);
  h.run((r) => r.advancePlantOperation(o.id));
  h.run((r) => r.advancePlantOperation(o.id, 5));
  assert.equal(h.state.orders[0].weightKg, 2.27);
  assert.equal(h.state.orders[0].pricing.total, 9.68);
  h.run((r) => r.confirmWeightAndPay(o.id));
  assert.equal(h.state.customers[0].walletBalance, 18.82);
  assert.equal(h.state.customers[0].loyaltyPoints, 1636);
  assert.throws(() => h.run((r) => r.confirmWeightAndPay(o.id)), /pesaje/);
  assert.equal(h.state.customers[0].walletBalance, 18.82);
});
test("native adjustment approval and rejection retain original treatment and cannot apply twice", () => {
  const h = harness();
  h.run((r) => r.approveAdjustment("SOL-ADJ-002", "adj-1"));
  const o = h.state.orders.find((o) => o.id === "SOL-ADJ-002")!;
  assert.equal(o.status, "IN_PROCESS");
  assert.equal(o.pricing.total, 11.1);
  assert.equal(o.adjustments[0].status, "APPROVED");
  assert.throws(
    () => h.run((r) => r.approveAdjustment(o.id, "adj-1")),
    /resuelto/,
  );
  const rejected = harness();
  rejected.run((r) => r.approveAdjustment(o.id, "adj-1", false));
  assert.equal(
    rejected.state.orders.find((x) => x.id === "SOL-ADJ-002")!.pricing.total,
    6.6,
  );
  assert.equal(
    rejected.state.orders.find((x) => x.id === "SOL-ADJ-002")!.adjustments[0]
      .status,
    "REJECTED",
  );
});
test("insufficient balance and full slots leave state, reservations and transactions untouched", () => {
  const h = harness();
  const before = JSON.stringify(h.state);
  assert.throws(
    () => h.run((r) => r.confirmWeightAndPay("SOL-WEIGHT-001")),
    /Saldo insuficiente/,
  );
  assert.equal(JSON.stringify(h.state), before);
  const data = input(h.state);
  data.inbound.timeSlotId = "slot-1";
  data.inbound.timeSlotText = "09:00 - 11:00";
  assert.throws(() => h.run((r) => r.createOrder(data)), /franja/);
  assert.equal(JSON.stringify(h.state), before);
  assert.throws(
    () =>
      h.run((r) =>
        r.createOrder({
          ...input(h.state),
          items: [{ ...shirt, quantity: 100 }],
        }),
      ),
    /Saldo insuficiente/,
  );
  assert.equal(JSON.stringify(h.state), before);
});
test("late cancellation charges $5, revokes codes and blocks creation until settled once", () => {
  const h = harness();
  h.run((r) => r.cancelOrder("SOL-4587"));
  const charge = h.state.customerCharges[0];
  assert.equal(charge.amount, 5);
  assert.equal(
    h.run((r) => r.canCreateNewOrder()),
    false,
  );
  assert.ok(
    h.state.orders
      .find((o) => o.id === "SOL-4587")!
      .handoffs.every((h) => h.status === "REVOKED"),
  );
  assert.throws(
    () => h.run((r) => r.createOrder(input(h.state))),
    /regulariza/,
  );
  h.run((r) => r.payCustomerCharge(charge.id));
  assert.equal(
    h.run((r) => r.canCreateNewOrder()),
    true,
  );
  assert.throws(
    () => h.run((r) => r.payCustomerCharge(charge.id)),
    /regularizado/,
  );
  assert.throws(() => h.run((r) => r.cancelOrder("SOL-4587")), /cerrada/);
});
test("timely cancellation releases both reservations without a charge", () => {
  const h = harness();
  const data = input(h.state);
  const counts = h.state.timeSlots.map((s) => s.reservedCount);
  const o = h.run((r) => r.createOrder(data));
  h.run((r) => r.cancelOrder(o.id));
  assert.deepEqual(
    h.state.timeSlots.map((s) => s.reservedCount),
    counts,
  );
  assert.equal(h.state.customerCharges.length, 0);
});
test("KYC rejects, retries and approves; accounts are isolated and password changes persist", () => {
  const h = harness();
  const hash = createHash("sha256").update("NuevaClave1").digest("hex");
  h.run((r) => r.register("Ana Torres", "ana@example.com", "0991234567", hash));
  assert.equal(visibleOrders(h.state).length, 0);
  assert.equal(
    h.run((r) => r.canCreateNewOrder()),
    false,
  );
  assert.throws(() => h.run((r) => r.submitKyc("file:///selfie")), /documento/);
  h.run((r) => r.saveKycDocument("DNI", "12345678", "file:///document"));
  h.run((r) => r.submitKyc("file:///selfie"));
  h.run((r) => r.simulateKyc(false, "Documento borroso"));
  assert.equal(h.state.customers[1].kycStatus, "REJECTED");
  h.run((r) => r.submitKyc("file:///new-selfie"));
  h.run((r) => r.simulateKyc(true));
  assert.equal(
    h.run((r) => r.canCreateNewOrder()),
    true,
  );
  assert.throws(() => h.run((r) => r.cancelOrder("SOL-4587")), /acceso/);
  const nextHash = createHash("sha256").update("OtraClave2").digest("hex");
  h.run((r) => r.changePassword(hash, nextHash));
  h.run((r) => r.logout());
  assert.throws(
    () => h.run((r) => r.login("ana@example.com", hash)),
    /incorrectos/,
  );
  h.run((r) => r.login("ana@example.com", nextHash));
  assert.equal(h.state.session!.id, h.state.customers[1].id);
});
test("wallet, points, memberships, billing and addresses retain independent state", () => {
  const h = harness();
  h.run((r) => r.addWalletCredit(20));
  assert.equal(h.state.customers[0].walletBalance, 48.5);
  assert.throws(() => h.run((r) => r.addWalletCredit(-5)), /recarga/);
  h.run((r) => r.redeemReward("rew-2"));
  assert.equal(h.state.customers[0].loyaltyPoints, 1040);
  assert.equal(h.state.loyaltyRedemptions[0].status, "Pendiente de aprobación");
  assert.equal(h.state.customers[0].walletBalance, 48.5);
  h.run((r) => r.changeMembershipPlan("Premium"));
  assert.equal(calculatePricing([shirt], [], "FIXED", "Premium").total, 6.4);
  h.run((r) => r.setDefaultAddress("addr-2"));
  h.run((r) => r.removeAddress("addr-2"));
  assert.equal(h.state.customers[0].addresses[0].isPrimary, true);
  h.run((r) =>
    r.updateBillingData({
      billingName: "Empresa",
      billingTaxId: "1234",
      billingEmail: "billing@example.com",
      billingPhone: "0991234567",
      billingAddress: "Calle A",
    }),
  );
  assert.equal(h.state.customers[0].billingName, "Empresa");
});
test("persisted data reloads, saves in order and recovers after a failed storage write", async () => {
  let raw: string | null = null;
  let fail = true;
  const snapshots: string[] = [];
  const adapter = {
    async getItem(key: string) {
      assert.equal(key, STORAGE_KEY);
      return raw;
    },
    async setItem(_key: string, value: string) {
      if (fail) {
        fail = false;
        throw Error("Quota");
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
      snapshots.push(value);
      raw = value;
    },
  };
  const queue = new PersistenceQueue(adapter);
  const s = initializeState(now);
  await assert.rejects(queue.save(s));
  s.customers[0].walletBalance = 40;
  const first = queue.save(s);
  s.customers[0].walletBalance = 50;
  const second = queue.save(s);
  await Promise.all([first, second]);
  await queue.flush();
  assert.equal(decodeState(snapshots[0]).customers[0].walletBalance, 40);
  assert.equal((await queue.load())!.customers[0].walletBalance, 50);
  assert.throws(() => decodeState("{broken"));
  assert.throws(() => decodeState('{"version":9}'));
});
test("schedule dates use Guayaquil timezone near midnight and promotion minimums apply", () => {
  assert.equal(today(new Date("2026-10-08T03:30:00Z")), "2026-10-07");
  assert.throws(
    () => calculatePricing([shirt], [], "FIXED", "Estándar", "FRESH10", now),
    /promoción/,
  );
  assert.throws(
    () => calculatePricing([shirt], [], "FIXED", "Estándar", "UNKNOWN", now),
    /existe/,
  );
  const price = calculatePricing(
    [{ ...shirt, quantity: 5 }],
    ["ext-2"],
    "FIXED",
    "Estándar",
    "FRESH10",
    now,
  );
  assert.equal(price.total, 16.6);
});
test("reopening later renews the agenda while preserving previous reservations", () => {
  const s = initializeState(now);
  const original = s.timeSlots.find((slot) => slot.id === "slot-2")!;
  const count = original.reservedCount;
  refreshSchedule(s, new Date("2026-10-17T12:00:00Z"));
  assert.equal(original.reservedCount, count);
  assert.ok(
    s.timeSlots.some(
      (slot) => slot.date === "2026-10-17" && slot.context === "DRIVER_PICKUP",
    ),
  );
  const total = s.timeSlots.length;
  refreshSchedule(s, new Date("2026-10-17T12:00:00Z"));
  assert.equal(s.timeSlots.length, total);
});
test("customer drop-off is rejected without changing balances or reservations", () => {
  const h = harness();
  const data = input(h.state);
  const before = JSON.stringify(h.state);
  assert.throws(() => modeFor("CUSTOMER", "CUSTOMER"), /domicilio/);
  assert.throws(
    () =>
      h.run((r) =>
        r.createOrder({
          ...data,
          inbound: { ...data.inbound, method: "CUSTOMER" },
        }),
      ),
    /domicilio/,
  );
  assert.equal(JSON.stringify(h.state), before);
  const order = h.run((r) => r.createOrder(data));
  const booked = JSON.stringify(h.state);
  assert.throws(
    () =>
      h.run((r) =>
        r.changeLeg(order.id, "INBOUND", {
          ...data.inbound,
          method: "CUSTOMER",
        }),
      ),
    /domicilio/,
  );
  assert.equal(JSON.stringify(h.state), booked);
  assert.ok(
    h.state.orders.every((o) => o.fulfillmentPlan.inbound.method === "DRIVER"),
  );
  assert.ok(
    !h.state.timeSlots.some((slot) => slot.context === "FACILITY_DROPOFF"),
  );
});
test("pending saved drop-offs migrate once and require a home booking without fabricated custody", () => {
  const old = initializeState(now);
  const order = old.orders.find((o) => o.id === "SOL-SS-001")!;
  order.fulfillmentPlan.inbound.method = "CUSTOMER";
  order.fulfillmentPlan.inbound.timeSlotId = "old-slot";
  order.status = "AWAITING_INTAKE";
  order.handoffs[0].type = "CUSTOMER_TO_FACILITY";
  old.timeSlots.push({
    ...old.timeSlots[0],
    id: "old-slot",
    context: "FACILITY_DROPOFF",
    reservedCount: 1,
  });
  const balance = old.customers[0].walletBalance;
  const events = structuredClone(order.timeline);
  const migrated = decodeState(JSON.stringify(old));
  const next = migrated.orders.find((o) => o.id === order.id)!;
  assert.equal(next.fulfillmentPlan.mode, "HOME_STORE");
  assert.equal(next.fulfillmentPlan.inbound.method, "DRIVER");
  assert.equal(next.status, "PICKUP_PENDING");
  assert.equal(next.pickupNeedsScheduling, true);
  assert.equal(next.fulfillmentPlan.inbound.timeSlotId, undefined);
  assert.equal(next.assignedDriverId, undefined);
  assert.equal(next.handoffs[0].status, "REVOKED");
  assert.equal(migrated.customers[0].walletBalance, balance);
  assert.deepEqual(next.timeline, events);
  assert.deepEqual(decodeState(JSON.stringify(migrated)), migrated);
  const { state: booked } = transact(
    migrated,
    (r) => r.changeLeg(next.id, "INBOUND", leg(migrated, "DRIVER", false)),
    now,
  );
  assert.equal(
    booked.orders.find((o) => o.id === next.id)!.pickupNeedsScheduling,
    false,
  );
  assert.equal(
    booked.orders.find((o) => o.id === next.id)!.status,
    "PICKUP_ASSIGNED",
  );
});
test("completed local intake stays historical without requiring another pickup or modifying receipts", () => {
  const old = initializeState(now);
  const order = old.orders.find((o) => o.id === "SOL-HS-001")!;
  order.fulfillmentPlan.inbound.method = "CUSTOMER";
  const receipt = {
    ...order.handoffs[0],
    type: "CUSTOMER_TO_FACILITY" as const,
    status: "USED" as const,
    usedAt: "2026-10-06T12:00:00Z",
  };
  order.handoffs.unshift(receipt);
  const migrated = decodeState(JSON.stringify(old));
  const next = migrated.orders.find((o) => o.id === order.id)!;
  assert.equal(next.status, "READY_FOR_PICKUP");
  assert.equal(next.pickupNeedsScheduling, undefined);
  assert.equal(next.legacyInbound?.method, "CUSTOMER");
  assert.deepEqual(next.handoffs[0], receipt);
  assert.deepEqual(next.timeline, order.timeline);
});
function intake(h:ReturnType<typeof harness>,id:string){
const order=h.state.orders.find(order=>order.id===id)!;
order.status='AT_FACILITY';order.fulfillmentPlan.inbound.status='COMPLETED';
order.handoffs.filter(h=>h.type==='CUSTOMER_TO_DRIVER').forEach(h=>{h.status='USED';});
}