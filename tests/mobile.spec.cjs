const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText("Ropa fresca, tiempo para ti.")).toBeVisible();
});
async function switchRole(page, role) {
  await page
    .getByRole("button", { name: "Abrir menú lateral", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Cambiar a ${role} demo`, exact: true })
    .click();
}
async function slot(page) {
  await page
    .getByRole("radio", { name: /^\d{4}-\d{2}-\d{2} ·/ })
    .last()
    .click();
}
test("client sections preserve filters and the bottom bar while switching tabs and menu", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Pedidos", exact: true }).click();
  await page.getByRole("radio", { name: "Historial", exact: true }).click();
  await page
    .getByRole("radio", { name: "Entrega y retiro en sede", exact: true })
    .click();
  const bar = page.getByRole("tablist");
  const initialBounds = await bar.boundingBox();
  for (const name of ["Beneficios", "Cuenta", "Inicio", "Pedidos"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(bar).toHaveCount(1);
    expect(await bar.boundingBox()).toEqual(initialBounds);
  }
  await expect(
    page.getByRole("radio", { name: "Historial", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("radio", { name: "Entrega y retiro en sede", exact: true }),
  ).toBeChecked();
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole("button", { name: "Abrir menú lateral", exact: true })
      .click();
    await page.getByRole("button", { name: "Inicio", exact: true }).click();
    await expect(page.getByText("Ropa fresca, tiempo para ti.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cerrar menú", exact: true }),
    ).not.toBeVisible();
    await page.getByRole("tab", { name: "Pedidos", exact: true }).click();
    await expect(
      page.getByRole("radio", { name: "Historial", exact: true }),
    ).toBeChecked();
  }
});

test("driver sections retain the service filter when leaving and returning", async ({
  page,
}) => {
  await switchRole(page, "chofer");
  await page.getByRole("tab", { name: "Servicios", exact: true }).click();
  await page.getByRole("radio", { name: "Próximos", exact: true }).click();
  for (const name of ["Cuenta", "Historial", "Mi ruta", "Servicios"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tablist")).toHaveCount(1);
  }
  await expect(
    page.getByRole("radio", { name: "Próximos", exact: true }),
  ).toBeChecked();
});

test("returning from tracking reuses the order detail and back returns to its origin", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Ver detalle de SOL-4587", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Seguir chofer en mapa", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Seguimiento", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Volver al detalle", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Detalle de solicitud", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Atrás", exact: true }).click();
  await expect(page.getByText("Ropa fresca, tiempo para ti.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Atrás", exact: true }),
  ).not.toBeVisible();
});

test("opening addresses from a request preserves its draft and returns to the same step", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Solicitar", exact: true }).click();
  const address = page.getByRole("radio", { name: /^Casa ·/ });
  await address.click();
  await slot(page);
  await page
    .getByRole("button", { name: "Administrar direcciones", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Direcciones guardadas", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Atrás", exact: true }).click();
  await expect(address).toBeChecked();
  await expect(
    page.getByRole("radio", { name: /^\d{4}-\d{2}-\d{2} ·/ }).last(),
  ).toBeChecked();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByRole("radio", {
      name: "Chofer entrega en domicilio",
      exact: true,
    }),
  ).toBeVisible();
});

test("profile lives in sidebar; billing and addresses persist across reload", async ({
  page,
}) => {
  await expect(
    page.getByText("maria.torres@gmail.com", { exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole("button", { name: "Abrir menú lateral", exact: true })
    .click();
  await expect(
    page.getByText("María Elena Torres", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("maria.torres@gmail.com", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Direcciones guardadas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Añadir dirección", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Nombre de dirección", exact: true })
    .fill("Oficina nueva");
  await page
    .getByRole("textbox", { name: "Dirección completa", exact: true })
    .fill("Calle Prueba 123");
  await page
    .getByRole("button", { name: "Guardar dirección", exact: true })
    .click();
  await expect(page.getByText("Oficina nueva", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Cuenta", exact: true }).click();
  await page
    .getByRole("button", { name: "Datos de facturación", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Nombre o razón social", exact: true })
    .fill("Laundry Cliente Test");
  await page
    .getByRole("button", { name: "Guardar datos de facturación", exact: true })
    .click();
  await expect(page.getByText("Datos de facturación guardados.")).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Cuenta", exact: true }).click();
  await page
    .getByRole("button", { name: "Datos de facturación", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Nombre o razón social", exact: true }),
  ).toHaveValue("Laundry Cliente Test");
});
for (const inbound of ["domicilio", "sede"])
  for (const outbound of ["domicilio", "sede"]) {
    test(`five-step request ${inbound} to ${outbound}`, async ({ page }) => {
      await page
        .getByRole("button", { name: "Nueva solicitud", exact: true })
        .click();
      await page
        .getByRole("radio", {
          name:
            inbound === "domicilio"
              ? "Chofer recoge en domicilio"
              : "Entrego en sede",
          exact: true,
        })
        .click();
      await page
        .getByRole("radio", {
          name:
            inbound === "domicilio"
              ? /^Casa ·/
              : /^Sede Central Norte - Planta 1 ·/,
        })
        .click();
      await slot(page);
      await page
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      await page
        .getByRole("radio", {
          name:
            outbound === "domicilio"
              ? "Chofer entrega en domicilio"
              : "Retiro en sede",
          exact: true,
        })
        .click();
      await page
        .getByRole("radio", {
          name:
            outbound === "domicilio"
              ? /^Casa ·/
              : /^Sede Central Norte - Planta 1 ·/,
        })
        .click();
      await slot(page);
      await page
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      await expect(
        page.getByText("Catálogo completo", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Aplicar promoción", exact: true })
        .click();
      await page
        .getByRole("radio", { name: "Tarjeta · Demo", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Confirmar solicitud", exact: true })
        .click();
      await expect(
        page.getByText("Solicitud agendada", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Ver mi solicitud", exact: true })
        .click();
      await expect(
        page
          .getByText(
            inbound === "domicilio"
              ? "Chofer asignado"
              : "Esperando entrega en sede",
            { exact: true },
          )
          .filter({ visible: true })
          .first(),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /^Código manual:/ }),
      ).toBeVisible();
    });
  }
test("driver pickup, plant, delivery, recipient and history form a complete route", async ({
  page,
}) => {
  await switchRole(page, "chofer");
  await page
    .getByRole("button", { name: "Marcar llegada al domicilio", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar recogida de prendas", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirmar recogida", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Observaciones de recogida", exact: true })
    .fill("Bolsa sellada");
  await page
    .getByRole("textbox", {
      name: "Código de transferencia (opcional)",
      exact: true,
    })
    .fill("482910");
  await page
    .getByRole("checkbox", {
      name: "Verifiqué las prendas con el cliente",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirmar recogida", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ir a planta central", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar entrega en planta", exact: true })
    .click();
  await switchRole(page, "cliente");
  await page
    .getByRole("button", { name: "Ver detalle de SOL-4587", exact: true })
    .click();
  for (const action of [
    "Simular ingreso a lavado",
    "Simular control de calidad",
    "Simular prendas listas",
    "Simular asignación de entrega",
  ])
    await page
      .getByRole("button", { name: `${action} · Demo`, exact: true })
      .click();
  await switchRole(page, "chofer");
  await page
    .getByRole("button", { name: "Iniciar navegación de entrega", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Navegar con Google Maps", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Atrás", exact: true }).click();
  await page
    .getByRole("button", { name: "Marcar llegada a entrega", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar entrega al cliente", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Nombre de quien recibe", exact: true })
    .fill("Ana Torres");
  await page.getByRole("radio", { name: "Familiar", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Confirmo la entrega completa a la persona indicada",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirmar entrega", exact: true })
    .click();
  await page.getByRole("tab", { name: "Historial", exact: true }).click();
  await page
    .getByRole("button", { name: "Ver detalle de SOL-4587", exact: true })
    .click();
  await expect(
    page.getByText("Ana Torres · Familiar", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/driver-completed.png",
    fullPage: true,
  });
});
test("registration verification rejection and resubmission unlock the new client", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Abrir menú lateral", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Nombre completo", exact: true })
    .fill("Ana Test");
  await page
    .getByRole("textbox", { name: "Correo electrónico", exact: true })
    .fill("ana@example.com");
  await page
    .getByRole("textbox", { name: "Teléfono", exact: true })
    .fill("0991234567");
  await page
    .getByLabel("Contraseña nueva", { exact: true })
    .fill("NuevaClave1");
  await page
    .getByRole("button", { name: "Continuar a verificación", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Adjuntar documento simulado · Demo",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Continuar a selfie", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Adjuntar selfie simulada · Demo",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Enviar verificación", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Simular rechazo · Demo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Volver a enviar documentos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Continuar a selfie", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Adjuntar selfie simulada · Demo",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Enviar verificación", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Simular aprobación · Demo", exact: true })
    .click();
  await expect(page.getByText("Ropa fresca, tiempo para ti.")).toBeVisible();
  await expect(
    page.getByText(
      "No tienes solicitudes activas. Agenda tu próximo servicio.",
    ),
  ).toBeVisible();
});
