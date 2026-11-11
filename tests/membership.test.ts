import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  currentCustomer,
  initializeState,
  LaundryRepository,
} from "../src/domain/repository";

const client = (over: object = {}) => ({
  id: "u-1",
  email: "ana@correo.test",
  name: "Ana Pérez",
  phone: "0991234567",
  role: "CLIENT",
  status: "ACTIVE",
  kycStatus: "APPROVED" as const,
  ...over,
});

test("un cliente nuevo no tiene membresía hasta elegir un plan", () => {
  const repo = new LaundryRepository(initializeState());
  repo.authenticateFromApi(client({ membershipPlan: null }), "hash");
  assert.equal(currentCustomer(repo.state).membershipTier, "");
});

test("la membresía la informa el servidor y se actualiza al iniciar sesión", () => {
  const repo = new LaundryRepository(initializeState());
  repo.authenticateFromApi(
    client({ membershipPlan: { id: "p-1", name: "Premium" } }),
    "hash",
  );
  assert.equal(currentCustomer(repo.state).membershipTier, "Premium");
  repo.authenticateFromApi(client({ membershipPlan: null }), "hash");
  assert.equal(currentCustomer(repo.state).membershipTier, "");
});
