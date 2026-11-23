const { test, expect } = require("./support/fixtures.cjs");
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText("Ropa fresca, tiempo para ti.")).toBeVisible();
});
async function account(page, target) {
  await page.getByRole("tab", { name: "Perfil", exact: true }).click();
  await page.getByRole("button", { name: target, exact: true }).click();
}

test("calendar month navigation is independent of booking availability and retains the selected date", async ({ page }) => {
  await page.getByRole("tab", { name: "Solicitar", exact: true }).click();
  await page.getByRole("button", { name: "Elegir fecha y horario", exact: true }).click();
  const dates = page.getByRole("radiogroup", { name: "Fecha del servicio", exact: true });
  const selectedDate = await dates.locator('[aria-checked="true"]').getAttribute("aria-label");
  const [year, month] = selectedDate.split("-").map(Number);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const title = (offset) => {
    const date = new Date(year, month - 1 + offset, 1);
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };
  const previous = page.getByRole("button", { name: "Mes anterior", exact: true });
  const next = page.getByRole("button", { name: "Mes siguiente", exact: true });
  await expect(previous).toBeEnabled();
  await expect(next).toBeEnabled();
  await previous.click();
  await expect(page.getByRole("heading", { name: title(-1), exact: true })).toBeVisible();
  for (const day of await dates.getByRole("radio").all()) await expect(day).toBeDisabled();
  await next.click();
  await expect(page.getByRole("radio", { name: selectedDate, exact: true })).toBeChecked();
  for (let i = 0; i < 12; i++) await next.click();
  await expect(page.getByRole("heading", { name: title(12), exact: true })).toBeVisible();
  for (const day of await dates.getByRole("radio").all()) await expect(day).toBeDisabled();
  for (let i = 0; i < 12; i++) await previous.click();
  await expect(page.getByRole("heading", { name: title(0), exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: selectedDate, exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Cerrar panel", exact: true }).click();
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
});
test("sheets dismiss by backdrop and Escape; wizard progress is guarded and its footer remains fixed", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Solicitar", exact: true }).click();
  const next = page.getByRole("button", { name: "Continuar", exact: true });
  await expect(next).toBeDisabled();
  const bounds = await next.boundingBox();
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(915);
  await page
    .getByRole("button", { name: "Elegir dirección", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cerrar panel", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Cerrar panel tocando fuera", exact: true })
    .click({ position: { x: 10, y: 10 } });
  await expect(
    page.getByRole("button", { name: "Cerrar panel", exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole("button", { name: "Elegir dirección", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Cerrar panel", exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole("button", { name: "Elegir dirección", exact: true })
    .click();
  await page.getByRole("radio", { name: /^Casa ·/ }).click();
  await page
    .getByRole("button", { name: "Elegir fecha y horario", exact: true })
    .click();
  await page
    .getByRole("radio", { name: /^\d{4}-\d{2}-\d{2} ·/ })
    .last()
    .click();
  await expect(next).toBeEnabled();
  await next.click();
  await page.getByRole("button", { name: "Atrás", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Entrada", exact: true }),
  ).toBeVisible();
  await expect(next).toBeEnabled();
  await page.screenshot({ path: "test-results/ux-wizard.png" });
});
test("search has a useful empty state and clear restores existing orders", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Pedidos", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Buscar solicitudes", exact: true })
    .fill("no-existe-xyz");
  await expect(
    page.getByRole("heading", { name: "No hay solicitudes", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Limpiar búsqueda", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ver detalle de SOL-4587", exact: true }),
  ).toBeVisible();
});
test("recharge is contextual, applies once on double tap and persists", async ({
  page,
}) => {
  await account(page, /^Billetera Laundry ·/);
  await expect(
    page.getByRole("textbox", { name: "Otro monto de recarga", exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole("button", { name: "Recargar billetera", exact: true })
    .click();
  const amount = page.getByRole("textbox", {
    name: "Otro monto de recarga",
    exact: true,
  });
  await amount.fill("-1");
  await expect(
    page.getByRole("button", { name: "Confirmar recarga", exact: true }),
  ).toBeDisabled();
  await amount.fill("20");
  await page
    .getByRole("button", { name: "Confirmar recarga", exact: true })
    .dblclick();
  await expect(
    page.getByRole("heading", { name: "$48.50", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Saldo recargado.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await account(page, /^Billetera Laundry ·/);
  await expect(
    page.getByRole("heading", { name: "$48.50", exact: true }),
  ).toBeVisible();
});
test("address deletion requires confirmation and retaining leaves data untouched", async ({
  page,
}) => {
  await account(page, "Direcciones guardadas");
  await page
    .getByRole("button", { name: "Opciones de Casa", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Eliminar Casa", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cerrar panel", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Conservar dirección", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Casa", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Opciones de Casa", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Eliminar Casa", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar eliminación", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Casa", exact: true }),
  ).not.toBeVisible();
});
test("request cancellation retains the warning and creates the existing late fee flow", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Ver detalle de SOL-4587", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Opciones de solicitud", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancelar solicitud", exact: true })
    .click();
  await expect(page.getByText(/Se generará un cargo de \$5.00/)).toBeVisible();
  await page
    .getByRole("button", { name: "Conservar solicitud", exact: true })
    .click();
  await expect(
    page
      .getByText("Chofer en camino", { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Opciones de solicitud", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancelar solicitud", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar cancelación", exact: true })
    .click();
  await expect(
    page.getByText("Cancelado", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await account(page, /^Billetera Laundry ·/);
  await page
    .getByRole("button", { name: "Pagar cargo con billetera", exact: true })
    .click();
  await expect(
    page.getByText("Cargo regularizado.", { exact: true }),
  ).toBeVisible();
});
test("email validation is contextual and login has no demo access", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Perfil", exact: true }).click();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  const email = page.getByRole("textbox", {
    name: "Correo electrónico",
    exact: true,
  });
  await email.fill("incorrecto");
  await email.blur();
  await expect(
    page.getByText("Revisa el formato del correo.", { exact: true }),
  ).toBeVisible();
  await email.fill("maria.torres@gmail.com");
  await expect(
    page.getByText("Revisa el formato del correo.", { exact: true }),
  ).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Cliente demo", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Chofer con contraseña temporal · Demo", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Conocer Laundry", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Acceso rápido del prototipo", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Chofer demo", exact: true })).toHaveCount(0);
  await expect(page.getByText(/demo/i)).toHaveCount(0);
});
for (const viewport of [
  { width: 320, height: 640 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
]) {
  test(
    "adaptive layout and reduced motion " + viewport.width,
    async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const name of ["Inicio", "Pedidos", "Beneficios", "Perfil"]) {
        await page.getByRole("tab", { name, exact: true }).click();
        await expect(page.getByRole("tablist")).toHaveCount(1);
        const box = await page.getByRole("tablist").boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
      await page.getByRole("tab", { name: "Solicitar", exact: true }).click();
      const button = await page
        .getByRole("button", { name: "Continuar", exact: true })
        .boundingBox();
      expect(button.height).toBeGreaterThanOrEqual(48);
      expect(button.y + button.height).toBeLessThanOrEqual(viewport.height);
      await page
        .getByRole("button", { name: "Elegir dirección", exact: true })
        .click();
      await expect(page.getByRole("radio", { name: /^Casa ·/ })).toBeVisible();
      await page
        .getByRole("button", { name: "Cerrar panel", exact: true })
        .click();
      expect(errors).toEqual([]);
      await page.screenshot({
        path: "test-results/ux-responsive-" + viewport.width + ".png",
      });
    },
  );
}

test("tracking without server data shows the error, and the code stays available on the order", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Ver detalle de SOL-4587", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Seguir chofer en mapa", exact: true })
    .click();
  // Un pedido que el servidor no conoce no muestra un chofer, una placa ni una ruta inventados.
  await expect(
    page.getByText("No se pudo cargar el seguimiento", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reintentar", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Carlos Mendoza").filter({ visible: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(
    page.getByText("No se pudo cargar el seguimiento", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Volver al detalle", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^Mostrar código ·/ })
    .first()
    .click();
  const original = await page
    .getByRole("heading", { name: /^Código manual:/ })
    .innerText();
  await page
    .getByRole("button", { name: "Regenerar código", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /^Código manual:/ }),
  ).not.toHaveText(original);
  await expect(
    page.getByText("Código actualizado.", { exact: true }),
  ).toBeVisible();
});
test("schedule is a focused screen; saving an outbound change returns to the existing detail", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Ver detalle de SOL-4587", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Opciones de solicitud", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Cambiar modalidad o reprogramar",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Reprogramar solicitud", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("radio", { name: "Pick up · retiro en sede", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Guardar nueva agenda", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Elegir sede", exact: true }).click();
  await page
    .getByRole("radio", { name: /^Sede Central Norte - Planta 1 ·/ })
    .click();
  await page
    .getByRole("button", { name: "Elegir fecha y horario", exact: true })
    .click();
  await page
    .getByRole("radio", { name: /^\d{4}-\d{2}-\d{2}$/ })
    .last()
    .click();
  await page
    .getByRole("radio", { name: /^\d{4}-\d{2}-\d{2} ·/ })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Guardar nueva agenda", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Detalle de solicitud", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText("Pick up · recogida a domicilio y retiro en sede", {
        exact: true,
      })
      .filter({ visible: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Agenda, direcciones y constancias",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Retiro en sede", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
});
test("weight request remains deferred and the compact garment controls work at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole("tab", { name: "Solicitar", exact: true }).click();
  for (let step = 0; step < 2; step++) {
    await page
      .getByRole("button", { name: "Elegir dirección", exact: true })
      .click();
    await page.getByRole("radio", { name: /^Casa ·/ }).click();
    await page
      .getByRole("button", { name: "Elegir fecha y horario", exact: true })
      .click();
    await page
      .getByRole("radio", { name: /^\d{4}-\d{2}-\d{2} ·/ })
      .last()
      .click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
  }
  await page
    .getByRole("button", { name: "Agregar Camisas / Blusas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Quitar Camisas / Blusas", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  // El precio que se muestra es el de la bolsa propuesta (la primera que configuró el administrador).
  await page
    .getByRole("radio", { name: "Ropa por peso · $2.20 / lb", exact: true })
    .click();
  // Las restricciones vienen del servidor.
  await expect(
    page.getByText(/NO aplica para edredones gruesos o plumones\./).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/NO aplica para vestidos con pedrería/).filter({ visible: true }),
  ).toBeVisible();
  // Cada bolsa tiene su propio precio por libra.
  await page
    .getByRole("radio", { name: /^3\+ bolsas, aproximadamente 35 libras, \$1\.80 por libra$/ })
    .click();
  await expect(
    page.getByRole("radio", { name: "Ropa por peso · $1.80 / lb", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Servicio de Ropa por Peso: $1.80 / lb", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/35 lb × \$1\.80 = \$63\.00/).filter({ visible: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Por determinar", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirmar solicitud", exact: true })
    .click();
  await expect(
    page.getByText("El pago se confirma después del pesaje certificado.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ver mi solicitud", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pesaje certificado", exact: true }),
  ).toBeVisible();
  // La solicitud conserva la bolsa y el precio con que se creó.
  await expect(
    page
      .getByText("Pendiente en planta · 3+ bolsas, estimado 35 lb · $1.80 / lb", { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
});
test("benefits, unread notifications, support and chat remain reachable", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Beneficios", exact: true }).click();
  await page.getByRole("radio", { name: "Recompensas", exact: true }).click();
  await expect(
    page.getByText("1540 puntos disponibles", { exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "Membresía", exact: true }).click();
  await expect(page.getByText("Plan actual", { exact: true })).toBeVisible();
  await account(page, "Ayuda y soporte");
  await page
    .getByRole("button", {
      name: "¿Cuándo pago la ropa por peso?",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/Después del pesaje certificado en planta/),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Perfil", exact: true }).click();
  await page
    .getByRole("button", { name: "Notificaciones", exact: true })
    .click();
  await page.getByRole("radio", { name: "Sin leer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Notificaciones", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Inicio", exact: true }).click();
  await page
    .getByRole("button", { name: "Ver detalle de SOL-4587", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Abrir chat con el chofer", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Enviar mensaje", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Escribe un mensaje", exact: true })
    .fill("Estoy en recepción.");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect(
    page.getByText("Estoy en recepción.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Escribe un mensaje", exact: true }),
  ).toHaveValue("");
});

// Agenda del servidor controlada por la prueba: franjas de mañana, una completa.
async function serveSlots(page, initial) {
  const state = { rows: initial };
  const tomorrow = new Date(Date.now() + 86400000 - 5 * 3600000).toISOString().slice(0, 10);
  await page.route(/\/api\/v1\/slots(\?.*)?$/, (route) => {
    if (route.request().method() === "OPTIONS") return route.fallback();
    const q = new URL(route.request().url()).searchParams;
    const rows = state.rows
      .map((s) => ({ facilityId: "facility-test-1", context: "DRIVER_PICKUP", date: tomorrow, ...s }))
      .filter((s) => s.context === q.get("context"))
      .filter((s) => q.get("onlyAvailable") === "false" || s.available > 0);
    return route.fulfill({
      status: 200,
      headers: { "access-control-allow-origin": "*" },
      contentType: "application/json",
      body: JSON.stringify(rows),
    });
  });
  return { state, tomorrow };
}

test("las franjas completas se muestran como Completo y no se pueden elegir", async ({ page }) => {
  const { tomorrow } = await serveSlots(page, [
    { id: "srv-1", startTime: "08:00", endTime: "12:00", available: 0 },
    { id: "srv-2", startTime: "13:00", endTime: "17:00", available: 1 },
    { id: "srv-3", startTime: "17:00", endTime: "20:00", available: 6 },
  ]);
  await page.getByRole("tab", { name: "Solicitar", exact: true }).click();
  await page.getByRole("button", { name: "Elegir fecha y horario", exact: true }).click();
  await expect(page.getByRole("radio", { name: tomorrow, exact: true })).toBeChecked();
  const full = page.getByRole("radio", { name: `${tomorrow} · 08:00 - 12:00`, exact: true });
  await expect(full).toBeDisabled();
  await expect(page.getByText("Completo", { exact: true })).toBeVisible();
  await expect(page.getByText("1 cupo disponible", { exact: true })).toBeVisible();
  await expect(page.getByText("6 cupos disponibles", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: `${tomorrow} · 17:00 - 20:00`, exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Elegir fecha y horario/ }),
  ).toContainText("17:00 - 20:00");
});

test("si otro cliente llena la franja elegida, al volver a abrir se avisa y se pide otra", async ({ page }) => {
  const { state, tomorrow } = await serveSlots(page, [
    { id: "srv-2", startTime: "13:00", endTime: "17:00", available: 1 },
    { id: "srv-3", startTime: "17:00", endTime: "20:00", available: 6 },
  ]);
  await page.getByRole("tab", { name: "Solicitar", exact: true }).click();
  await page.getByRole("button", { name: "Elegir fecha y horario", exact: true }).click();
  await page.getByRole("radio", { name: `${tomorrow} · 13:00 - 17:00`, exact: true }).click();
  // Otro cliente toma el último cupo mientras tanto.
  state.rows = [
    { id: "srv-2", startTime: "13:00", endTime: "17:00", available: 0 },
    { id: "srv-3", startTime: "17:00", endTime: "20:00", available: 6 },
  ];
  await page.getByRole("button", { name: /Elegir fecha y horario/ }).click();
  await expect(page.getByTestId("slot_notice")).toHaveText(
    "La franja que elegiste ya no tiene cupo. Elige otro horario.",
  );
  await expect(
    page.getByRole("radio", { name: `${tomorrow} · 13:00 - 17:00`, exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Cerrar panel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Elegir fecha y horario", exact: true }),
  ).toContainText("Selecciona una franja con cupo");
});

test("la entrega solo ofrece franjas que empiezan cuando termina la recogida", async ({ page }) => {
  const { tomorrow } = await serveSlots(page, [
    { id: "srv-p", startTime: "13:00", endTime: "17:00", available: 3 },
    { id: "srv-d1", context: "DRIVER_DELIVERY", startTime: "08:00", endTime: "12:00", available: 4 },
    { id: "srv-d2", context: "DRIVER_DELIVERY", startTime: "17:00", endTime: "20:00", available: 4 },
  ]);
  await page.getByRole("tab", { name: "Solicitar", exact: true }).click();
  await page.getByRole("button", { name: "Elegir dirección", exact: true }).click();
  await page.getByRole("radio", { name: /^Casa ·/ }).click();
  await page.getByRole("button", { name: "Elegir fecha y horario", exact: true }).click();
  await page.getByRole("radio", { name: `${tomorrow} · 13:00 - 17:00`, exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();

  await page.getByRole("button", { name: "Elegir fecha y horario", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: `${tomorrow} · 17:00 - 20:00`, exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("radio", { name: `${tomorrow} · 08:00 - 12:00`, exact: true }),
  ).toHaveCount(0);
});

// Custodia de la recogida con el servidor: el cliente genera su código cuando el chofer llegó.
test("con el chofer en el domicilio, el cliente genera su código de custodia en el servidor", async ({ page }) => {
  const ORDER = "9d0a8700-d1c1-4f74-b2ef-73db0e9fd844";
  const cors = { "access-control-allow-origin": "*" };
  const backendOrder = {
    id: ORDER,
    number: 9001,
    status: "ARRIVED_FOR_PICKUP",
    mode: "HOME_HOME",
    facilityId: "facility-test-1",
    paymentStatus: "PAID",
    pricingStatus: "ESTIMATED",
    total: "12.50",
    version: 5,
    createdAt: new Date().toISOString(),
    events: [
      { id: "e1", status: "PICKUP_ASSIGNED", title: "Estado: PICKUP_ASSIGNED", description: null, createdAt: new Date().toISOString() },
      { id: "e2", status: "ARRIVED_FOR_PICKUP", title: "Estado: ARRIVED_FOR_PICKUP", description: "Chofer llegó al domicilio", createdAt: new Date().toISOString() },
    ],
  };
  const issued = [];
  const json = (route, status, body) =>
    route.fulfill({ status, headers: cors, contentType: "application/json", body: JSON.stringify(body) });
  await page.route(/\/api\/v1\/orders(\/[^?]*)?(\?.*)?$/, (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" },
      });
    const path = new URL(req.url()).pathname;
    if (path.endsWith("/handoffs/issue")) {
      issued.push(req.postDataJSON());
      return json(route, 201, {
        handoffId: `h-${issued.length}`,
        type: "CUSTOMER_TO_DRIVER",
        code: issued.length === 1 ? "482910" : "731045",
        qrToken: "AbCdEfGhIjKlMnOpQrStUvWxYz012345",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
    }
    if (path.endsWith(`/orders/${ORDER}`)) return json(route, 200, backendOrder);
    if (path.endsWith("/orders")) return json(route, 200, [backendOrder]);
    return json(route, 200, []);
  });
  await page.evaluate(() => localStorage.setItem("laundry.auth.accessToken", "test-access"));
  await page.reload();
  await page.getByRole("button", { name: "Ver detalle de ORD-9001", exact: true }).click();
  await expect(page.getByText("Entrega tu ropa al chofer", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mostrar código", exact: true }).click();
  const panel = page.getByTestId("handoff_code");
  await expect(panel).toContainText("482 910");
  await expect(panel).toContainText(/Vence en (59|60) minutos/);
  expect(issued).toEqual([{ type: "CUSTOMER_TO_DRIVER" }]);
  // Generar otro reemplaza el código anterior.
  await page.getByRole("button", { name: "Generar otro código", exact: true }).click();
  await expect(panel).toContainText("731 045");
  expect(issued).toHaveLength(2);
  // El historial ya refleja la llegada del chofer con su título claro.
  await expect(
    page.getByText("Chofer en tu dirección", { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
});

// Ajustes de precio y saldo pendiente contra el servidor.
test("el cliente aprueba un ajuste de precio y paga el saldo con su billetera", async ({ page }) => {
  const ORDER = "9d0a8700-d1c1-4f74-b2ef-73db0e9fd844";
  const cors = { "access-control-allow-origin": "*" };
  const state = {
    order: {
      id: ORDER, number: 9002, status: "CUSTOMER_APPROVAL_PENDING", mode: "HOME_HOME", facilityId: "facility-test-1",
      paymentStatus: "PAID", pricingStatus: "ADJUSTMENT_PENDING", total: "22.00", amountPaid: "22.00", amountDue: "0",
      paymentMethodKind: "WALLET", version: 7, createdAt: new Date().toISOString(), events: [],
    },
    adjustments: [
      { id: "adj-1", type: "EXTRA_ITEM", customerMessage: "Tratamiento de mancha", amountDifference: "2.50", requiresCustomerApproval: true, status: "PENDING_CUSTOMER", createdAt: new Date().toISOString() },
    ],
  };
  const calls = [];
  const json = (route, status, body) =>
    route.fulfill({ status, headers: cors, contentType: "application/json", body: JSON.stringify(body) });
  await page.route(/\/api\/v1\/orders(\/[^?]*)?(\?.*)?$/, (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    const path = new URL(req.url()).pathname;
    if (req.method() !== "GET") calls.push([path.replace(/^.*\/orders\/[^/]+/, ""), req.postDataJSON()]);
    if (path.endsWith("/adjustments/adj-1/decision")) {
      state.adjustments[0].status = "APPROVED";
      // La sede fija el precio: sube a 24.50 y quedan 2.50 por pagar.
      state.order = { ...state.order, status: "IN_PROCESS", total: "24.50", amountDue: "2.50", paymentStatus: "PENDING", version: 9 };
      return json(route, 201, { pending: 0, requiresStaffReview: false });
    }
    if (path.endsWith("/pay")) {
      state.order = { ...state.order, amountDue: "0", amountPaid: "24.50", paymentStatus: "PAID", version: 10 };
      return json(route, 201, state.order);
    }
    if (path.endsWith("/adjustments")) return json(route, 200, state.adjustments);
    if (path.endsWith(`/orders/${ORDER}`)) return json(route, 200, state.order);
    if (path.endsWith("/orders")) return json(route, 200, [state.order]);
    return json(route, 200, []);
  });
  await page.evaluate(() => localStorage.setItem("laundry.auth.accessToken", "test-access"));
  await page.reload();
  await page.getByRole("button", { name: "Ver detalle de ORD-9002", exact: true }).click();
  await expect(page.getByTestId("adjustment_adj-1")).toContainText("Tratamiento de mancha");
  await expect(page.getByTestId("adjustment_adj-1")).toContainText("+$2.50");
  await page.getByRole("button", { name: "Aprobar", exact: true }).click();
  await expect(page.getByText("Tratamiento de mancha · +$2.50 · Aplicado", { exact: true })).toBeVisible();
  await expect(page.getByTestId("amount_due")).toContainText("$2.50");
  await page.getByRole("button", { name: "Pagar con billetera", exact: true }).click();
  await expect(page.getByTestId("amount_due")).toHaveCount(0);
  expect(calls).toEqual([
    ["/adjustments/adj-1/decision", { approve: true, expectedVersion: 7 }],
    ["/pay", { expectedVersion: 9 }],
  ]);
});

for (const [status, mode, title, type] of [
  ["ARRIVED_FOR_DELIVERY", "HOME_HOME", "Recibe tu ropa", "DRIVER_TO_CUSTOMER"],
  ["READY_FOR_PICKUP", "HOME_STORE", "Retira tu ropa en la sede", "FACILITY_TO_CUSTOMER"],
]) {
  test(`al recibir la ropa (${status}) el cliente genera su código de custodia`, async ({ page }) => {
    const ORDER = "9d0a8700-d1c1-4f74-b2ef-73db0e9fd844";
    const cors = { "access-control-allow-origin": "*" };
    const order = {
      id: ORDER, number: 9003, status, mode, facilityId: "facility-test-1", paymentStatus: "PAID",
      pricingStatus: "FINAL", total: "22.00", amountPaid: "22.00", amountDue: "0", version: 30,
      createdAt: new Date().toISOString(), events: [],
    };
    const issued = [];
    const json = (route, code, body) =>
      route.fulfill({ status: code, headers: cors, contentType: "application/json", body: JSON.stringify(body) });
    await page.route(/\/api\/v1\/orders(\/[^?]*)?(\?.*)?$/, (route) => {
      const req = route.request();
      if (req.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
      const path = new URL(req.url()).pathname;
      if (path.endsWith("/handoffs/issue")) {
        issued.push(req.postDataJSON());
        return json(route, 201, {
          handoffId: "h-1", type, code: "265810", qrToken: "AbCdEfGhIjKlMnOpQrStUvWxYz012345",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });
      }
      if (path.endsWith(`/orders/${ORDER}`)) return json(route, 200, order);
      if (path.endsWith("/orders")) return json(route, 200, [order]);
      return json(route, 200, []);
    });
    await page.evaluate(() => localStorage.setItem("laundry.auth.accessToken", "test-access"));
    await page.reload();
    await page.getByRole("button", { name: "Ver detalle de ORD-9003", exact: true }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Mostrar código", exact: true }).click();
    await expect(page.getByTestId("handoff_code")).toContainText("265 810");
    expect(issued).toEqual([{ type }]);
  });
}
