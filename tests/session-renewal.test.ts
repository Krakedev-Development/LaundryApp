import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  ApiError,
  apiClient,
  onSessionExpired,
  setSessionRefresher,
} from "../src/services/api/apiClient";

// Servidor simulado: acepta solo el token "nuevo".
function fakeServer() {
  const seen: string[] = [];
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    const auth = (init?.headers as Record<string, string>)?.Authorization ?? "";
    seen.push(auth);
    const ok = auth === "Bearer nuevo";
    return new Response(JSON.stringify(ok ? { id: "a" } : { message: "Unauthorized" }), {
      status: ok ? 200 : 401,
    });
  }) as typeof fetch;
  return seen;
}

test("con el token vencido se renueva una sola vez para pedidos simultáneos y se repiten", async () => {
  fakeServer();
  let renewals = 0;
  setSessionRefresher(async () => {
    renewals++;
    await new Promise((r) => setTimeout(r, 10));
    return "nuevo";
  });
  const results = await Promise.all([
    apiClient.get<{ id: string }>("/orders/a", { accessToken: "viejo" }),
    apiClient.get<{ id: string }>("/orders/b", { accessToken: "viejo" }),
    apiClient.get<{ id: string }>("/orders", { accessToken: "viejo" }),
  ]);
  assert.equal(renewals, 1);
  assert.deepEqual(results, [{ id: "a" }, { id: "a" }, { id: "a" }]);
  setSessionRefresher(null);
});

test("si el servidor rechaza la renovación se avisa que la sesión venció", async () => {
  fakeServer();
  setSessionRefresher(async () => null);
  let expired = 0;
  const stop = onSessionExpired(() => expired++);
  await assert.rejects(
    apiClient.get("/orders", { accessToken: "viejo" }),
    (e: unknown) => e instanceof ApiError && e.statusCode === 401,
  );
  assert.equal(expired, 1);
  stop();
  setSessionRefresher(null);
});

test("las rutas de autenticación no disparan renovación", async () => {
  fakeServer();
  let renewals = 0;
  setSessionRefresher(async () => {
    renewals++;
    return "nuevo";
  });
  await assert.rejects(apiClient.post("/auth/refresh", { refreshToken: "x" }, { accessToken: "viejo" }));
  assert.equal(renewals, 0);
  setSessionRefresher(null);
});
