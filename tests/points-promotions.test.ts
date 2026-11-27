import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  currentCustomer,
  initializeState,
  LaundryRepository,
} from "../src/domain/repository";
import {
  clearAuthSession,
  saveAuthSession,
} from "../src/services/auth/authService";
import { validatePromotion } from "../src/services/catalog/catalogService";
import { pointsService } from "../src/services/points/pointsService";

test("pointsService y validatePromotion sincronizan saldo, canjes con cupón/crédito y validación real", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; method: string; body: unknown }> = [];

  try {
    await clearAuthSession();
    await saveAuthSession(
      {
        id: "user-1",
        email: "cliente@correo.test",
        name: "Cliente Prueba",
        role: "CLIENT",
        status: "ACTIVE",
        pointsBalance: 350,
      },
      {
        accessToken: "token-points-123",
        refreshToken: "refresh-points-123",
      },
    );

    globalThis.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ url, method, body });

      if (url.endsWith("/points") && method === "GET") {
        return new Response(
          JSON.stringify({
            balance: 200,
            entries: [
              {
                id: "pe-1",
                customerId: "cust-1",
                points: 350,
                reason: "ORDER_COMPLETED",
                createdAt: "2026-11-27T01:00:00Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.endsWith("/points/redeem") && method === "POST") {
        return new Response(
          JSON.stringify({
            id: "red-1",
            customerId: "cust-1",
            rewardId: (body as { rewardId: string }).rewardId,
            pointsCost: 150,
            status: "PENDING",
            createdAt: "2026-11-27T01:05:00Z",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.endsWith("/redemptions") && method === "GET") {
        return new Response(
          JSON.stringify([
            {
              id: "red-1",
              customerId: "cust-1",
              rewardId: "rw-1",
              pointsCost: 150,
              status: "APPROVED",
              generatedPromoCode: "CANJE-ABCD1234",
              walletCreditAmount: null,
              createdAt: "2026-11-27T01:05:00Z",
              reward: { title: "Cupón $4", fulfillmentType: "PROMO_COUPON" },
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.endsWith("/catalog/promotions/validate") && method === "POST") {
        return new Response(
          JSON.stringify({
            valid: true,
            promotion: {
              id: "pr-1",
              code: "CANJE-ABCD1234",
              discountType: "FIXED",
              discountValue: "4.00",
              isPersonal: true,
            },
            estimatedDiscount: 4,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ message: "Not found" }), {
        status: 404,
      });
    };

    const repo = new LaundryRepository(initializeState());
    repo.authenticateFromApi({
      id: "user-1",
      email: "cliente@correo.test",
      name: "Cliente Prueba",
      role: "CLIENT",
      status: "ACTIVE",
      pointsBalance: 350,
    });
    assert.equal(currentCustomer(repo.state).loyaltyPoints, 350);

    await pointsService.redeem("rw-1");
    const [pts, reds] = await Promise.all([
      pointsService.getMyPoints(),
      pointsService.listRedemptions(),
    ]);
    repo.syncPointsFromApi(pts.balance, reds);

    assert.equal(currentCustomer(repo.state).loyaltyPoints, 200);
    assert.equal(repo.state.loyaltyRedemptions[0].generatedPromoCode, "CANJE-ABCD1234");
    assert.equal(repo.state.loyaltyRedemptions[0].status, "Aprobado");

    const validated = await validatePromotion("canje-abcd1234", 20);
    assert.equal(validated.promotion.code, "CANJE-ABCD1234");
    assert.equal(validated.estimatedDiscount, 4);
    assert.ok(
      calls.some(
        (c) =>
          c.url.endsWith("/catalog/promotions/validate") &&
          (c.body as { code: string }).code === "CANJE-ABCD1234",
      ),
    );
  } finally {
    globalThis.fetch = originalFetch;
    await clearAuthSession();
  }
});
