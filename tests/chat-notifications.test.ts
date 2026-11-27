import assert from "node:assert/strict";
import test from "node:test";
import { initializeState, transact } from "../src/domain/repository";
import {
  chatRoleLabel,
  chatService,
  mergeChatMessages,
  type ServerChatMessage,
} from "../src/services/chat/chatService";
import {
  mapServerNotificationToItem,
  notificationsService,
} from "../src/services/notifications/notificationsService";

test("chatService merges messages without duplicates and calls real REST endpoints", async () => {
  const m2: ServerChatMessage = {
    id: "m2",
    orderId: "ord-1",
    senderId: "u-driver",
    senderName: "Carlos Chofer",
    senderRole: "DRIVER",
    text: "Llegando",
    createdAt: "2026-11-27T12:05:00.000Z",
  };
  const m1: ServerChatMessage = {
    id: "m1",
    orderId: "ord-1",
    senderId: "u-client",
    senderName: "Ana",
    senderRole: "CLIENT",
    text: "Hola",
    createdAt: "2026-11-27T12:00:00.000Z",
  };

  const merged = mergeChatMessages([m2], [m1, m2]);
  assert.deepEqual(
    merged.map((m) => m.id),
    ["m1", "m2"],
  );
  assert.equal(chatRoleLabel("SUPERVISOR"), "Soporte sede");

  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push(`${init?.method ?? "GET"} ${url}`);
    if (init?.method === "POST") {
      return new Response(JSON.stringify(m1), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify([m1, m2]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const listed = await chatService.listOrderMessages("ord-1", {
      accessToken: "tok-1",
    });
    assert.equal(listed.length, 2);
    const sent = await chatService.sendOrderMessage("ord-1", " Hola ", "tok-1");
    assert.equal(sent.id, "m1");
    assert.ok(calls[0]?.includes("/orders/ord-1/messages"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("notificationsService maps and syncs server notifications and device tokens", async () => {
  const mapped = mapServerNotificationToItem(
    {
      id: "n-1",
      orderId: "ord-9",
      category: "CHAT",
      title: "Nuevo mensaje",
      body: "Revisa tu chat",
      readAt: null,
      createdAt: new Date().toISOString(),
    },
    "cust-1",
  );
  assert.equal(mapped.isRead, false);
  assert.equal(mapped.relatedOrderId, "ord-9");

  let state = initializeState();
  state = transact(state, (repo) => {
    repo.authenticateFromApi({
      id: "cust-1",
      email: "c@test.local",
      name: "Cliente",
      role: "CLIENT",
      kycStatus: "APPROVED",
    });
    repo.syncNotificationsFromApi([mapped]);
    repo.upsertNotificationFromApi({
      ...mapped,
      id: "n-2",
      title: "Segundo aviso",
    });
  }).state;

  const forCustomer = state.notifications.filter(
    (n) => n.customerId === "cust-1",
  );
  assert.equal(forCustomer.length, 2);
  assert.equal(forCustomer[0]?.id, "n-2");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ id: "dev-1", token: "ExponentPushToken[abc]", active: true }),
      { status: 201, headers: { "content-type": "application/json" } },
    )) as typeof fetch;

  try {
    const dev = await notificationsService.registerDeviceToken(
      {
        token: "ExponentPushToken[abc]",
        platform: "ANDROID",
        appType: "CLIENT",
      },
      "tok-1",
    );
    assert.equal(dev.active, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
