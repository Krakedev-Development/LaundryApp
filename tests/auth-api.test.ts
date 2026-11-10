import { strict as assert } from "node:assert";
import { test } from "node:test";
import { currentCustomer, LaundryRepository } from "../src/domain/repository";
import { initializeSeededState as initializeState } from "./fixtures/seedState";
import {
  authService,
  CLIENT_ONLY_ERROR_MESSAGE,
  getStoredAuthSession,
} from "../src/services/auth/authService";

test("authService and repository integrate with backend register, login, refresh, logout and reject non-CLIENT roles", async () => {
  const uniqueEmail = `cliente.api.${Date.now()}@laundryfresh.com`;
  const repo = new LaundryRepository(initializeState());

  // 1. Register a real CLIENT in PostgreSQL and update state
  const registeredUser = await repo.registerWithApi(
    "Valeria",
    "Gómez",
    uniqueEmail,
    "0998765432",
    "ClaveSegura123",
    "hash-demo-1",
  );
  assert.equal(registeredUser.role, "CLIENT");
  assert.equal(registeredUser.email, uniqueEmail);
  assert.equal(repo.state.session?.id, registeredUser.id);
  assert.equal(repo.state.session?.role, "CLIENT");

  const activeCustomer = currentCustomer(repo.state);
  assert.equal(activeCustomer.id, registeredUser.id);
  assert.equal(activeCustomer.name, "Valeria Gómez");
  assert.equal(activeCustomer.email, uniqueEmail);

  const storedAfterRegister = await getStoredAuthSession();
  assert.ok(storedAfterRegister.accessToken);
  assert.ok(storedAfterRegister.refreshToken);
  assert.equal(storedAfterRegister.user?.email, uniqueEmail);

  // 2. Refresh token rotation
  const refreshed = await authService.refresh();
  assert.ok(refreshed.accessToken);
  assert.ok(refreshed.refreshToken);

  // 3. Logout clears session and tokens
  await authService.logout();
  const storedAfterLogout = await getStoredAuthSession();
  assert.equal(storedAfterLogout.accessToken, null);
  assert.equal(storedAfterLogout.refreshToken, null);
  assert.equal(storedAfterLogout.user, null);

  // 4. Real login against PostgreSQL
  const loggedInUser = await repo.loginWithApi(
    uniqueEmail,
    "ClaveSegura123",
    "hash-demo-1",
  );
  assert.equal(loggedInUser.id, registeredUser.id);
  assert.equal(repo.state.session?.id, registeredUser.id);

  // 5. Reject non-CLIENT role with exact message
  assert.throws(
    () =>
      repo.authenticateFromApi({
        id: "drv-99",
        email: "chofer@laundryfresh.com",
        name: "Chofer Ruta",
        role: "DRIVER",
      }),
    new RegExp(CLIENT_ONLY_ERROR_MESSAGE),
  );

  // 6. A new account starts unverified until the administrator approves it
  assert.equal(
    repo.state.customers.find((c) => c.id === registeredUser.id)?.kycStatus,
    "NOT_SUBMITTED",
  );

  await authService.logout();
});
