import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { facilities } from "../src/domain/catalog";
import {
  modeFor,
  type AppState,
  type Leg,
  type Method,
  type OrderItem,
} from "../src/domain/models";
import {
  calculatePricing,
  initializeState,
  LaundryRepository,
  refreshSchedule,
  slotRange,
  today,
  transact,
  visibleOrders,
} from "../src/domain/repository";
import { DEMO_PASSWORD_HASH } from "../src/domain/seed";
import {
  decodeState,
  PersistenceQueue,
  STORAGE_KEY,
} from "../src/store/persistence";

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
test("preserves the native customer, driver, five scenarios, catalog values and demo credentials", () => {
  const s = initializeState(now);
  assert.equal(s.customers[0].walletBalance, 28.5);
  assert.equal(s.customers[0].loyaltyPoints, 1540);
  assert.equal(s.driver.vehiclePlate, "ABC-789");
  assert.equal(s.driver.completedDeliveriesCount, 34);
  assert.equal(s.orders.find((o) => o.id === "SOL-4587")!.pricing.total, 21.96);
  assert.equal(
    s.orders.find((o) => o.id === "SOL-HS-001")!.pricing.total,
    19.36,
  );
  assert.equal(
    s.orders.find((o) => o.id === "SOL-SS-001")!.pricing.total,
    12.68,
  );
  assert.equal(s.orders.find((o) => o.id === "SOL-WEIGHT-001")!.weightLb, 18.5);
  assert.equal(
    s.orders.find((o) => o.id === "SOL-ADJ-002")!.adjustments[0]
      .amountDifference,
    4.5,
  );
  assert.equal(
    createHash("sha256").update("123456").digest("hex"),
    DEMO_PASSWORD_HASH,
  );
});
for (const inbound of ["DRIVER", "CUSTOMER"] as const)
  for (const outbound of ["DRIVER", "CUSTOMER"] as const) {
    test(`complete ${modeFor(inbound, outbound)} lifecycle, custody and evidence`, () => {
      const h = harness();
      const startBalance = h.state.customers[0].walletBalance;
      const o = h.run((r) => r.createOrder(input(h.state, inbound, outbound)));
      const id = o.id;
      assert.equal(
        o.status,
        inbound === "DRIVER" ? "PICKUP_ASSIGNED" : "AWAITING_INTAKE",
      );
      assert.equal(o.handoffs[0].fallbackCode.length, 6);
      assert.equal(h.state.customers[0].walletBalance, startBalance - 7.04);
      assert.equal(h.state.customers[0].loyaltyPoints, 1610);
      if (inbound === "DRIVER") {
        h.run((r) => r.demoLogin("DRIVER"));
        h.run((r) => r.driverAction(id, "START_PICKUP"));
        h.run((r) => r.driverAction(id, "ARRIVE_PICKUP"));
        const originalCode = h.state.orders.find((o) => o.id === id)!
          .handoffs[0].fallbackCode;
        assert.throws(
          () =>
            h.run((r) =>
              r.driverConfirmPickup(id, 2, "", undefined, "incorrect"),
            ),
          /código/,
        );
        h.run((r) =>
          r.driverConfirmPickup(
            id,
            2,
            "Bolsa sellada",
            "file:///pickup.jpg",
            originalCode,
          ),
        );
        assert.equal(
          h.state.orders.find((o) => o.id === id)!.pickup.evidencePhotoUri,
          "file:///pickup.jpg",
        );
        h.run((r) => r.driverAction(id, "GO_FACILITY"));
        h.run((r) => r.driverAction(id, "ARRIVE_FACILITY"));
      } else h.run((r) => r.advancePlantOperation(id));
      h.run((r) => r.demoLogin("CLIENT"));
      h.run((r) => r.advancePlantOperation(id));
      h.run((r) => r.advancePlantOperation(id));
      h.run((r) => r.advancePlantOperation(id));
      if (outbound === "DRIVER") {
        h.run((r) => r.advancePlantOperation(id));
        h.run((r) => r.demoLogin("DRIVER"));
        h.run((r) => r.driverAction(id, "START_DELIVERY"));
        h.run((r) => r.driverAction(id, "ARRIVE_DELIVERY"));
        h.run((r) =>
          r.driverConfirmDelivery(
            id,
            "Ana Torres",
            "Familiar",
            "Entregado completo",
            "file:///delivery.jpg",
          ),
        );
        assert.equal(h.state.driver.completedDeliveriesCount, 35);
        assert.equal(
          h.state.orders.find((o) => o.id === id)!.delivery.recipientName,
          "Ana Torres",
        );
        assert.throws(
          () =>
            h.run((r) => r.driverConfirmDelivery(id, "Ana", "Familiar", "")),
          /llegada/,
        );
      } else h.run((r) => r.advancePlantOperation(id));
      const final = h.state.orders.find((o) => o.id === id)!;
      assert.equal(
        final.status,
        outbound === "DRIVER" ? "DELIVERED" : "COMPLETED",
      );
      assert.equal(final.fulfillmentPlan.inbound.status, "COMPLETED");
      assert.equal(final.fulfillmentPlan.outbound.status, "COMPLETED");
      assert.ok(final.handoffs.every((code) => code.status === "USED"));
      assert.ok(final.timeline.filter((e) => e.completed).length >= 6);
      assert.ok(h.state.notifications.some((n) => n.relatedOrderId === id));
    });
  }
test("per-weight order defers debit until certified weight, then pays once and earns points once", () => {
  const h = harness();
  const balance = h.state.customers[0].walletBalance;
  const o = h.run((r) =>
    r.createOrder({
      ...input(h.state, "CUSTOMER", "CUSTOMER"),
      items: [],
      pricingModel: "PER_WEIGHT",
      estimatedWeightLb: 10,
    }),
  );
  assert.equal(o.paymentStatus, "PENDIENTE_PESO");
  assert.equal(h.state.customers[0].walletBalance, balance);
  assert.equal(h.state.customers[0].loyaltyPoints, 1540);
  assert.throws(() => h.run((r) => r.confirmWeightAndPay(o.id)), /pesaje/);
  h.run((r) => r.advancePlantOperation(o.id));
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
test("outbound mode change updates plan, destination, slot, custody and later driver route", () => {
  const h = harness();
  const o = h.run((r) => r.createOrder(input(h.state, "CUSTOMER", "CUSTOMER")));
  h.run((r) => r.advancePlantOperation(o.id));
  h.run((r) => r.advancePlantOperation(o.id));
  h.run((r) => r.advancePlantOperation(o.id));
  h.run((r) => r.advancePlantOperation(o.id));
  h.run((r) => r.changeLeg(o.id, "OUTBOUND", leg(h.state, "DRIVER", true)));
  const updated = h.state.orders.find((x) => x.id === o.id)!;
  assert.equal(updated.fulfillmentPlan.mode, "STORE_HOME");
  assert.equal(updated.status, "DELIVERY_ASSIGNED");
  assert.equal(
    updated.delivery.addressFull,
    h.state.customers[0].addresses[0].fullAddress,
  );
  assert.equal(
    updated.handoffs.find((h) => h.type === "FACILITY_TO_CUSTOMER")!.status,
    "REVOKED",
  );
  assert.equal(h.state.rescheduleRequests.length, 1);
  h.run((r) => r.demoLogin("DRIVER"));
  h.run((r) => r.driverAction(o.id, "START_DELIVERY"));
  h.run((r) => r.demoLogin("CLIENT"));
  assert.throws(
    () =>
      h.run((r) =>
        r.changeLeg(o.id, "OUTBOUND", leg(h.state, "CUSTOMER", true)),
      ),
    /inició/,
  );
});
test("QR regeneration changes both tokens and used codes cannot be regenerated", () => {
  const h = harness();
  const handoff = h.state.orders[0].handoffs[0];
  const old = { ...handoff };
  h.run((r) => r.regenerateHandoffCode("SOL-4587", handoff.id));
  const next = h.state.orders[0].handoffs[0];
  assert.notEqual(next.fallbackCode, old.fallbackCode);
  assert.notEqual(next.qrToken, old.qrToken);
  h.run((r) => r.demoLogin("DRIVER"));
  h.run((r) => r.driverAction("SOL-4587", "ARRIVE_PICKUP"));
  h.run((r) =>
    r.driverConfirmPickup("SOL-4587", 7, "", undefined, next.fallbackCode),
  );
  h.run((r) => r.demoLogin("CLIENT"));
  assert.throws(
    () => h.run((r) => r.regenerateHandoffCode("SOL-4587", old.id)),
    /activo/,
  );
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
test("forced driver password blocks bypass and completion clears the flag", () => {
  const h = harness();
  h.run((r) => r.simulateTemporaryPassword());
  assert.equal(h.state.driver.mustChangePassword, true);
  assert.throws(
    () => h.run((r) => r.driverAction("SOL-4587", "ARRIVE_PICKUP")),
    /contraseña temporal/,
  );
  h.run((r) => r.changePassword("", "new-hash", true));
  assert.equal(h.state.driver.mustChangePassword, false);
  assert.throws(
    () => h.run((r) => r.changePassword("", "bypass", true)),
    /obligatorio/,
  );
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
test("chat keeps sender ownership when switching role and survives serialization", () => {
  const h = harness();
  h.run((r) => r.sendChatMessage("SOL-4587", "  Pedido listo  "));
  h.run((r) => r.demoLogin("DRIVER"));
  h.run((r) => r.sendChatMessage("SOL-4587", "Voy en camino"));
  const saved = decodeState(JSON.stringify(h.state));
  const messages = saved.chatMessages["SOL-4587"];
  assert.equal(messages.at(-2)!.senderRole, "CLIENT");
  assert.equal(messages.at(-1)!.senderRole, "DRIVER");
  assert.equal(messages.at(-2)!.text, "Pedido listo");
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
