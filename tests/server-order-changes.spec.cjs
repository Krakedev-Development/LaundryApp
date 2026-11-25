const { test, expect } = require("./support/fixtures.cjs");

// Cancelar y reprogramar una solicitud que existe en el servidor: la app llama a la API (no
// cambia solo el estado del teléfono) y muestra lo que responde el servidor.
const ORDER = "5b7c1f0e-3a2d-4c8b-9e61-0f2a4d6c8e10";
const PICKUP_SLOT = "8a1d3c5e-7f90-4b12-a345-6789abcdef01";
const NEW_PICKUP_SLOT = "8a1d3c5e-7f90-4b12-a345-6789abcdef02";
const cors = { "access-control-allow-origin": "*" };
const ymd = (offsetDays) => new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

function serverOrder() {
  return {
    id: ORDER, number: 9100, status: "PICKUP_ASSIGNED", mode: "HOME_HOME", facilityId: "facility-test-1",
    paymentStatus: "PAID", pricingStatus: "FINAL", total: "20.00", amountPaid: "20.00", amountDue: "0",
    paymentMethodKind: "WALLET", version: 4, createdAt: new Date().toISOString(), events: [],
    legs: [
      {
        id: "leg-in", kind: "INBOUND", method: "DRIVER", addressText: "Calle 1 #2-3", latitude: -2.19, longitude: -79.89,
        slot: { id: PICKUP_SLOT, date: `${ymd(2)}T00:00:00.000Z`, startTime: "09:00", endTime: "11:00" },
        driver: { userId: "driver-user", name: "Carlos Mendoza" },
      },
      {
        id: "leg-out", kind: "OUTBOUND", method: "DRIVER", addressText: "Calle 1 #2-3", latitude: -2.19, longitude: -79.89,
        slot: null, driver: null,
      },
    ],
  };
}

async function mockServer(page) {
  const state = { order: serverOrder() };
  const calls = [];
  const json = (route, status, body) =>
    route.fulfill({ status, headers: cors, contentType: "application/json", body: JSON.stringify(body) });
  const preflight = (route) =>
    route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
  await page.route(/\/api\/v1\/orders(\/[^?]*)?(\?.*)?$/, (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return preflight(route);
    const path = new URL(req.url()).pathname;
    if (req.method() !== "GET") calls.push([req.method(), path.replace(/^.*\/orders\/[^/]+/, ""), req.postDataJSON()]);
    if (path.endsWith("/cancel")) {
      state.order = { ...state.order, status: "CANCELLED", version: state.order.version + 1 };
      return json(route, 201, state.order);
    }
    if (path.endsWith("/reschedule")) {
      const body = req.postDataJSON();
      state.order = {
        ...state.order,
        status: "CONFIRMED",
        version: state.order.version + 1,
        legs: state.order.legs.map((l) =>
          l.kind === "INBOUND"
            ? { ...l, driver: null, slot: { id: body.slotId, date: `${ymd(3)}T00:00:00.000Z`, startTime: "14:00", endTime: "16:00" } }
            : l,
        ),
      };
      return json(route, 200, state.order);
    }
    if (path.endsWith(`/orders/${ORDER}`)) return json(route, 200, state.order);
    if (path.endsWith("/orders")) return json(route, 200, [state.order]);
    return json(route, 200, []);
  });
  // Agenda del servidor con ids reales (UUID) para la sede de la solicitud.
  await page.route(/\/api\/v1\/slots(\?.*)?$/, (route) => {
    if (route.request().method() === "OPTIONS") return preflight(route);
    const context = new URL(route.request().url()).searchParams.get("context");
    const rows = context === "DRIVER_PICKUP"
      ? [
          { id: PICKUP_SLOT, facilityId: "facility-test-1", context, date: ymd(2), startTime: "09:00", endTime: "11:00", available: 2 },
          { id: NEW_PICKUP_SLOT, facilityId: "facility-test-1", context, date: ymd(3), startTime: "14:00", endTime: "16:00", available: 3 },
        ]
      : [];
    return json(route, 200, rows);
  });
  await page.evaluate(() => localStorage.setItem("laundry.auth.accessToken", "test-access"));
  await page.reload();
  return { state, calls };
}

async function openOptions(page) {
  await page.getByRole("button", { name: "Ver detalle de ORD-9100", exact: true }).click();
  await page.getByRole("button", { name: "Opciones de solicitud", exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText("Ropa fresca, tiempo para ti.")).toBeVisible();
});

test("cancelar una solicitud del servidor pide un motivo y la cancela en el servidor", async ({ page }) => {
  const { calls } = await mockServer(page);
  await openOptions(page);
  await page.getByRole("button", { name: "Cancelar solicitud", exact: true }).click();
  const confirm = page.getByRole("button", { name: "Confirmar cancelación", exact: true });
  await expect(confirm).toBeDisabled();
  await page.getByRole("radio", { name: "No estaré disponible en el horario", exact: true }).click();
  await confirm.click();
  await expect(page.getByText("Cancelado", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  expect(calls).toEqual([
    ["POST", "/cancel", { reason: "No estaré disponible en el horario", expectedVersion: 4 }],
  ]);
  // Ya cerrada, la solicitud no ofrece más opciones.
  await expect(page.getByRole("button", { name: "Opciones de solicitud", exact: true })).toHaveCount(0);
});

test("reprogramar la recogida de una solicitud del servidor usa la API y refleja la nueva franja", async ({ page }) => {
  const { calls } = await mockServer(page);
  await openOptions(page);
  await page.getByRole("button", { name: "Reprogramar recogida o entrega", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Reprogramar solicitud", exact: true })).toBeVisible();
  // La modalidad de una solicitud ya creada no cambia desde aquí.
  await page.getByRole("radio", { name: "Salida · entrega o retiro en sede", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Pick up · retiro en sede", exact: true })).toHaveCount(0);
  await page.getByRole("radio", { name: "Entrada · recogida a domicilio", exact: true }).click();

  await page.getByRole("button", { name: "Elegir fecha y horario", exact: true }).click();
  await page.getByRole("radio", { name: ymd(3), exact: true }).click();
  await page.getByRole("radio", { name: `${ymd(3)} · 14:00 - 16:00`, exact: true }).click();
  await page.getByRole("button", { name: "Guardar nueva agenda", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Detalle de solicitud", exact: true })).toBeVisible();
  expect(calls).toEqual([
    ["PUT", "/reschedule", { leg: "INBOUND", slotId: NEW_PICKUP_SLOT, expectedVersion: 4 }],
  ]);
  // El chofer se liberó en el servidor: la solicitud vuelve a confirmada con la nueva franja.
  await expect(page.getByText(/Solicitud confirmada/).filter({ visible: true }).first()).toBeVisible();
  const saved = await page.evaluate(
    (id) =>
      JSON.parse(localStorage.getItem("laundry.native-migration.v2")).orders.find((o) => o.backendId === id),
    ORDER,
  );
  expect(saved.fulfillmentPlan.inbound.timeSlotId).toBe(NEW_PICKUP_SLOT);
  expect(saved.fulfillmentPlan.inbound.timeSlotText).toBe("14:00 - 16:00");
});
