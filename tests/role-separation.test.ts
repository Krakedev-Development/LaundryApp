import { strict as assert } from "node:assert";
import { test } from "node:test";
import { authenticateSession } from "@laundry/mobile-auth";
import { transact } from "../src/domain/repository";
import { initializeSeededState as initializeState } from "./fixtures/seedState";
import { TEST_PASSWORD_HASH } from "./fixtures/seedState";
import { decodeState } from "../src/store/persistence";

test("customer app contains only customer accounts and operations", () => {
  const state = initializeState();
  assert.equal("driver" in state, false);
  assert.ok(state.accounts.every((account) => account.role === "CLIENT"));
  const logged = transact(state, (repo) =>
    repo.login(" MARIA.TORRES@GMAIL.COM ", TEST_PASSWORD_HASH),
  );
  assert.equal(logged.state.session?.role, "CLIENT");
  assert.throws(() =>
    transact(state, (repo) =>
      repo.login("carlos.mendoza@laundryfresh.com", TEST_PASSWORD_HASH),
    ),
  );
  transact(state, (repo) => {
    for (const operation of [
      "driverAction",
      "driverConfirmPickup",
      "driverConfirmDelivery",
      "setDriverOperationalStatus",
      "simulateTemporaryPassword",
      "advancePlantOperation",
      "consume",
    ]) {
      assert.equal(operation in repo, false, operation);
    }
    assert.equal(repo.changePassword.length, 2);
  });
  assert.equal(
    transact(state, (repo) =>
      repo.authenticateFromApi({
        id: state.customers[0].id,
        email: state.customers[0].email,
        name: state.customers[0].name,
        role: "CLIENT",
        kycStatus: "APPROVED",
      }),
    ).state.session?.role,
    "CLIENT",
  );
  assert.throws(() =>
    authenticateSession(
      state.accounts,
      state.customers[0].email,
      TEST_PASSWORD_HASH,
      "DRIVER",
    ),
  );
});

test("legacy sessions and private operational data are discarded while customer data survives", () => {
  const state = initializeState();
  const snapshot = JSON.parse(JSON.stringify(state));
  snapshot.accounts.push({
    id: "drv-1",
    email: "carlos.mendoza@laundryfresh.com",
    role: "DRIVER",
    passwordHash: TEST_PASSWORD_HASH,
  });
  snapshot.driver = {
    id: "drv-1",
    currentLat: -12.1,
    currentLng: -77.1,
    mustChangePassword: true,
    operationalStatus: "BREAK",
    completedDeliveriesCount: 34,
  };
  snapshot.session = { id: "drv-1", role: "DRIVER" };
  delete snapshot.orders[0].trackingPosition;
  const migrated = decodeState(JSON.stringify(snapshot));
  assert.equal(migrated.session, null);
  assert.equal("driver" in migrated, false);
  assert.ok(migrated.accounts.every((account) => account.role === "CLIENT"));
  assert.deepEqual(migrated.orders[0].trackingPosition, {
    latitude: -12.1,
    longitude: -77.1,
  });
  snapshot.orders[0].trackingPosition = migrated.orders[0].trackingPosition;
  assert.deepEqual(migrated.orders, snapshot.orders);
  for (const field of [
    "customers",
    "walletTransactions",
    "paymentMethods",
    "loyaltyRedemptions",
    "chatMessages",
  ] as const)
    assert.deepEqual(migrated[field], state[field]);
  assert.deepEqual(decodeState(JSON.stringify(migrated)), migrated);
});

test("customer cannot regenerate an internal plant transfer or consume custody", () => {
  const state = initializeState();
  const order = state.orders[0];
  order.handoffs.push({
    ...order.handoffs[0],
    id: "internal-transfer",
    type: "DRIVER_TO_FACILITY",
    status: "ACTIVE",
  });
  const before = JSON.stringify(state);
  assert.throws(() =>
    transact(state, (repo) =>
      repo.regenerateHandoffCode(order.id, "internal-transfer"),
    ),
  );
  assert.equal(JSON.stringify(state), before);
  transact(state, (repo) =>
    repo.regenerateHandoffCode(order.id, order.handoffs[0].id),
  );
});
