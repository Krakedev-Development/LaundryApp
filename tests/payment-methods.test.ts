import { strict as assert } from "node:assert";
import { test } from "node:test";
import { initializeState, transact } from "../src/domain/repository";
import { decodeState } from "../src/store/persistence";
import { cardInputError, expiryError } from "../src/domain/paymentMethods";

const now = new Date("2026-10-13T12:00:00Z");
const card = {
  number: "4111 1111 1111 1111",
  holder: "María Torres",
  expiry: "12/30",
  cvv: "123",
};
const bank = {
  bank: "Banco de prueba",
  holder: "María Torres",
  accountNumber: "0123456789",
  accountType: "Ahorros" as const,
};

test("card and bank methods persist independently of wallet without card number or CVV", () => {
  const initial = initializeState(now);
  const wallet = JSON.stringify({
    balance: initial.customers[0].walletBalance,
    transactions: initial.walletTransactions,
    charges: initial.customerCharges,
    orders: initial.orders,
  });
  const next = transact(
    initial,
    (repo) => {
      repo.addPaymentCard(card);
      repo.addPaymentBankAccount(bank);
    },
    now,
  ).state;
  const stored = decodeState(JSON.stringify(next));
  assert.equal(stored.paymentMethods.length, 3);
  const saved = stored.paymentMethods.find(
    (method) => method.last4 === "1111",
  )!;
  assert.equal(saved.kind, "CARD");
  assert.equal("number" in saved, false);
  assert.equal("cvv" in saved, false);
  assert.equal(
    stored.paymentMethods.filter((method) => method.isDefault).length,
    1,
  );
  assert.equal(
    JSON.stringify({
      balance: stored.customers[0].walletBalance,
      transactions: stored.walletTransactions,
      charges: stored.customerCharges,
      orders: stored.orders,
    }),
    wallet,
  );
});

test("invalid, expired and duplicate methods cannot partially commit", () => {
  const initial = initializeState(now);
  assert.throws(
    () =>
      transact(
        initial,
        (repo) => repo.addPaymentCard({ ...card, number: "4111111111111112" }),
        now,
      ),
    /número/,
  );
  assert.throws(
    () =>
      transact(
        initial,
        (repo) => repo.addPaymentCard({ ...card, expiry: "09/26" }),
        now,
      ),
    /vencida/,
  );
  assert.throws(
    () =>
      transact(
        initial,
        (repo) => repo.addPaymentCard({ ...card, cvv: "12" }),
        now,
      ),
    /seguridad/,
  );
  assert.throws(
    () =>
      transact(
        initial,
        (repo) =>
          repo.addPaymentBankAccount({ ...bank, accountNumber: "abc123456" }),
        now,
      ),
    /dígitos/,
  );
  const withCard = transact(
    initial,
    (repo) => repo.addPaymentCard(card),
    now,
  ).state;
  assert.throws(
    () => transact(withCard, (repo) => repo.addPaymentCard(card), now),
    /registrada/,
  );
  const withBank = transact(
    initial,
    (repo) => repo.addPaymentBankAccount(bank),
    now,
  ).state;
  assert.throws(
    () => transact(withBank, (repo) => repo.addPaymentBankAccount(bank), now),
    /registrada/,
  );
  assert.equal(initial.paymentMethods.length, 1);
  assert.equal(expiryError("10/26", now), undefined);
  assert.equal(
    cardInputError(
      {
        number: "378282246310005",
        holder: "María Torres",
        expiry: "12/30",
        cvv: "1234",
      },
      now,
    ),
    undefined,
  );
});

test("default changes and deletion remain scoped to each customer", () => {
  let state = transact(
    initializeState(now),
    (repo) => repo.addPaymentBankAccount(bank),
    now,
  ).state;
  const id = state.paymentMethods.find(
    (method) => method.kind === "TRANSFER",
  )!.id;
  state = transact(
    state,
    (repo) => repo.setDefaultPaymentMethod(id),
    now,
  ).state;
  assert.equal(
    state.paymentMethods.find((method) => method.id === id)!.isDefault,
    true,
  );
  state = transact(state, (repo) => repo.removePaymentMethod(id), now).state;
  assert.equal(state.paymentMethods.length, 1);
  assert.equal(state.paymentMethods[0].isDefault, true);
  const other = transact(
    state,
    (repo) =>
      repo.register("Otra Persona", "otra@example.com", "0991234567", "hash"),
    now,
  ).state;
  assert.throws(
    () =>
      transact(
        other,
        (repo) => repo.removePaymentMethod(state.paymentMethods[0].id),
        now,
      ),
    /acceso/,
  );
  assert.throws(
    () =>
      transact(
        other,
        (repo) => repo.setDefaultPaymentMethod(state.paymentMethods[0].id),
        now,
      ),
    /acceso/,
  );
  const driver = transact(state, (repo) => repo.demoLogin("DRIVER"), now).state;
  assert.throws(
    () => transact(driver, (repo) => repo.addPaymentCard(card), now),
    /cliente/,
  );
});

test("older saved data gains methods without changing existing wallet records", () => {
  const state = initializeState(now);
  const raw = JSON.parse(JSON.stringify(state));
  delete raw.paymentMethods;
  const loaded = decodeState(JSON.stringify(raw));
  assert.deepEqual(loaded.paymentMethods, state.paymentMethods);
  assert.deepEqual(loaded.walletTransactions, state.walletTransactions);
  assert.equal(
    loaded.customers[0].walletBalance,
    state.customers[0].walletBalance,
  );
  assert.throws(
    () => decodeState(JSON.stringify({ ...state, paymentMethods: {} })),
    /formato/,
  );
  const duplicate = {
    ...state,
    paymentMethods: [state.paymentMethods[0], state.paymentMethods[0]],
  };
  assert.throws(() => decodeState(JSON.stringify(duplicate)), /válidos/);
});
