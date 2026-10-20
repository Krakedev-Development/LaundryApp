import { strict as assert } from "node:assert";
import { test } from "node:test";
import { authenticateSession } from "@laundry/mobile-auth";
import { initializeState, transact } from "../src/domain/repository";
import { DEMO_PASSWORD_HASH } from "../src/domain/seed";
import { decodeState } from "../src/store/persistence";

test("customer login cannot activate the driver role or driver operations", () => {
  const state = initializeState();
  assert.ok(state.accounts.every((account) => account.role === "CLIENT"));
  const logged = transact(state, (repo) =>
    repo.login(" MARIA.TORRES@GMAIL.COM ", DEMO_PASSWORD_HASH),
  );
  assert.equal(logged.state.session?.role, "CLIENT");
  assert.throws(() =>
    transact(state, (repo) =>
      repo.login("carlos.mendoza@laundryfresh.com", DEMO_PASSWORD_HASH),
    ),
  );
  assert.throws(() => transact(state, (repo) => repo.demoLogin("DRIVER")));
  transact(state, (repo) =>
    assert.equal(
      "driverAction" in repo ||
        "driverConfirmPickup" in repo ||
        "driverConfirmDelivery" in repo,
      false,
    ),
  );
  assert.throws(() =>
    authenticateSession(
      state.accounts,
      state.customers[0].email,
      DEMO_PASSWORD_HASH,
      "DRIVER",
    ),
  );
});

test("legacy driver session is closed without losing customer data or recorded custody", () => {
  const state = initializeState();
  const snapshot = JSON.parse(JSON.stringify(state));
  snapshot.accounts.push({
    id: "drv-1",
    email: "carlos.mendoza@laundryfresh.com",
    role: "DRIVER",
    passwordHash: DEMO_PASSWORD_HASH,
  });
  snapshot.driver.mustChangePassword = true;
  snapshot.driver.completedDeliveriesCount = 34;
  snapshot.session = { id: "drv-1", role: "DRIVER" };
  const migrated = decodeState(JSON.stringify(snapshot));
  assert.equal(migrated.session, null);
  assert.ok(migrated.accounts.every((account) => account.role === "CLIENT"));
  assert.deepEqual(migrated.customers, state.customers);
  assert.deepEqual(migrated.orders, snapshot.orders);
  assert.deepEqual(migrated.walletTransactions, state.walletTransactions);
  assert.ok(!("mustChangePassword" in migrated.driver));
});
