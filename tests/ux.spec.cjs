const { test, expect } = require("@playwright/test");
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText("Ropa fresca, tiempo para ti.")).toBeVisible();
});
async function account(page, target) {
  await page.getByRole("tab", { name: "Cuenta", exact: true }).click();
  await page.getByRole("button", { name: target, exact: true }).click();
}
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
  await account(page, "Métodos de pago");
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
    page.getByRole("button", { name: "Confirmar recarga · Demo", exact: true }),
  ).toBeDisabled();
  await amount.fill("20");
  await page
    .getByRole("button", { name: "Confirmar recarga · Demo", exact: true })
    .dblclick();
  await expect(
    page.getByRole("heading", { name: "$48.50", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Saldo recargado.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await account(page, "Métodos de pago");
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
  await account(page, "Métodos de pago");
  await page
    .getByRole("button", { name: "Pagar cargo con billetera", exact: true })
    .click();
  await expect(
    page.getByText("Cargo regularizado.", { exact: true }),
  ).toBeVisible();
});
test("email and password validation is contextual and temporary password cannot bypass security", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Abrir menú lateral", exact: true })
    .click();
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
  await page
    .getByRole("button", { name: "Acceso rápido del prototipo", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Chofer con contraseña temporal · Demo",
      exact: true,
    })
    .click();
  await expect(page.getByRole("tablist")).not.toBeVisible();
  await page.getByLabel("Nueva contraseña", { exact: true }).fill("nueva");
  await page.getByLabel("Nueva contraseña", { exact: true }).blur();
  await expect(
    page.getByText("Usa 8 caracteres, una mayúscula y un número.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("NuevaClave1");
  await page
    .getByLabel("Confirmar contraseña", { exact: true })
    .fill("NuevaClave1");
  await page
    .getByRole("button", { name: "Guardar contraseña", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "Mi ruta", exact: true }),
  ).toBeVisible();
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
      for (const name of ["Inicio", "Pedidos", "Beneficios", "Cuenta"]) {
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

test("tracking code replaces the details sheet and regeneration remains available on the order", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Ver detalle de SOL-4587", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Seguir chofer en mapa", exact: true })
    .click();
  await page.getByRole("button", { name: "SOL-4587", exact: true }).click();
  await page
    .getByRole("button", { name: /^Mostrar código ·/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: /^Código manual:/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cerrar panel", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Cerrar panel", exact: true }).click();
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
    .getByRole("radio", { name: "Retiro en sede", exact: true })
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
      .getByText("Domicilio a retiro en sede", { exact: true })
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
  await page
    .getByRole("radio", { name: "Ropa por peso · $2.20 / lb", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Peso estimado en libras", exact: true })
    .fill("0");
  await expect(
    page.getByRole("button", { name: "Continuar", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Peso estimado en libras", exact: true })
    .fill("16");
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
  await page.getByRole("tab", { name: "Cuenta", exact: true }).click();
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
