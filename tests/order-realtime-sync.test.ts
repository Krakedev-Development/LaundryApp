import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createOrderSyncScheduler } from "../src/features/orders/model/orderRealtimeSync";

type Raw = { id: string; status: string };

// Temporizador manual: la prueba decide cuándo vence el agrupamiento.
function manualTimers() {
  const queue = new Map<number, () => void>();
  let next = 1;
  return {
    setTimer: (fn: () => void) => {
      const id = next++;
      queue.set(id, fn);
      return id;
    },
    clearTimer: (h: unknown) => void queue.delete(h as number),
    flush: async () => {
      const fns = [...queue.values()];
      queue.clear();
      fns.forEach((fn) => fn());
      await new Promise((r) => setImmediate(r));
    },
    get size() {
      return queue.size;
    },
  };
}

test("un aviso relee solo ese pedido y lo aplica", async () => {
  const timers = manualTimers();
  const applied: Raw[][] = [];
  const fetched: string[] = [];
  const s = createOrderSyncScheduler<Raw>({
    fetchOne: async (id) => {
      fetched.push(id);
      return { id, status: "PICKUP_ASSIGNED" };
    },
    fetchAll: async () => assert.fail("no debe releer la lista"),
    apply: (orders) => applied.push(orders),
    ...timers,
  });
  s.orderChanged("a");
  await timers.flush();
  assert.deepEqual(fetched, ["a"]);
  assert.deepEqual(applied, [[{ id: "a", status: "PICKUP_ASSIGNED" }]]);
});

test("avisos repetidos del mismo pedido se agrupan en una sola lectura", async () => {
  const timers = manualTimers();
  const fetched: string[] = [];
  const s = createOrderSyncScheduler<Raw>({
    fetchOne: async (id) => {
      fetched.push(id);
      return { id, status: "X" };
    },
    fetchAll: async () => [],
    apply: () => {},
    ...timers,
  });
  s.orderChanged("a");
  s.orderChanged("a");
  s.orderChanged("b");
  assert.equal(timers.size, 2);
  await timers.flush();
  assert.deepEqual(fetched.sort(), ["a", "b"]);
});

test("al reconectar se relee la lista completa", async () => {
  const applied: Raw[][] = [];
  const s = createOrderSyncScheduler<Raw>({
    fetchOne: async () => assert.fail("no debe leer un pedido"),
    fetchAll: async () => [{ id: "a", status: "CANCELLED" }],
    apply: (orders) => applied.push(orders),
  });
  await s.resync();
  assert.deepEqual(applied, [[{ id: "a", status: "CANCELLED" }]]);
});

test("sin conexión o con respuesta inválida se conserva lo conocido", async () => {
  const timers = manualTimers();
  let applied = 0;
  const s = createOrderSyncScheduler<Raw>({
    fetchOne: async (id) => {
      if (id === "offline") throw new Error("Network request failed");
      return null;
    },
    fetchAll: async () => {
      throw new Error("Network request failed");
    },
    apply: () => applied++,
    ...timers,
  });
  s.orderChanged("offline");
  s.orderChanged("vacio");
  await timers.flush();
  await s.resync();
  assert.equal(applied, 0);
});

test("después de cerrar sesión no se aplica nada pendiente", async () => {
  const timers = manualTimers();
  let applied = 0;
  const s = createOrderSyncScheduler<Raw>({
    fetchOne: async (id) => ({ id, status: "X" }),
    fetchAll: async () => [{ id: "a", status: "X" }],
    apply: () => applied++,
    ...timers,
  });
  s.orderChanged("a");
  s.dispose();
  await timers.flush();
  await s.resync();
  assert.equal(applied, 0);
  assert.equal(timers.size, 0);
});
