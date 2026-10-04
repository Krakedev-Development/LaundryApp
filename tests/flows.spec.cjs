const { test, expect } = require("@playwright/test");
const web = require("../src/services/laundryWebSeed.json");
async function login(page, email, password = "Laundry2026!") {
  await page.goto("/");
  await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
}
async function logout(page) {
  await page.getByText("Perfil", { exact: true }).click();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: "Iniciar sesión", exact: true }),
  ).toBeVisible();
}
async function selectSchedule(page) {
  await page
    .getByRole("button", { name: /^(lun|mar|mié|jue|vie|sáb|dom)/i })
    .first()
    .click();
  await page
    .getByRole("button", { name: /^\d{2}:\d{2} - \d{2}:\d{2}$/ })
    .first()
    .click();
}
test("client order persists and the assigned driver completes its full lifecycle", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "nuevo@laundryfresh.com");
  await page
    .getByRole("button", { name: "Solicitar recogida", exact: true })
    .click();
  await expect(
    page.getByText("Aún no has agregado prendas", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByText("Agrega al menos una prenda.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Agregar prendas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aumentar cantidad", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aumentar cantidad", exact: true })
    .click();
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Agregar · $3.50", exact: true })
    .click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Elegir dirección", exact: true })
    .first()
    .click();
  await selectSchedule(page);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Misma dirección de recogida", exact: true })
    .click();
  await selectSchedule(page);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: /^Confirmar y pagar/ }).click();
  await expect(
    page.getByText("¡Solicitud confirmada!", { exact: true }).first(),
  ).toBeVisible();
  const id = await page
    .getByText(/^SOL-\d+$/)
    .first()
    .innerText();
  await page
    .getByRole("button", { name: "Ver solicitud", exact: true })
    .click();
  await expect(
    page.getByText(id, { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(id, { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  await page.goto("/(client)/(tabs)/profile");
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .last()
    .click();
  await expect
    .poll(() =>
      page.evaluate((orderId) => {
        const data = JSON.parse(localStorage.getItem("laundry-mvp-v1") || "{}");
        return data.assignments?.find(
          (a) => a.orderId === orderId && a.type === "PICKUP",
        )?.driverId;
      }, id),
    )
    .toBeTruthy();
  const pickupDriverEmail = await page.evaluate((orderId) => {
    const data = JSON.parse(localStorage.getItem("laundry-mvp-v1"));
    const assignment = data.assignments.find(
      (a) => a.orderId === orderId && a.type === "PICKUP",
    );
    return data.drivers.find((d) => d.id === assignment.driverId).email;
  }, id);
  await login(page, pickupDriverEmail);
  await expect(
    page.getByText("Tu próxima parada, a un toque", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Habilitar ubicación", exact: true })
    .click();
  await expect(
    page.getByText("Necesitamos tu ubicación", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByText(id, { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  await page.goto(`/(driver)/service/${id}`);
  await expect(
    page.getByRole("button", { name: "Iniciar navegación", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Iniciar navegación", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate((orderId) => {
        const data = JSON.parse(localStorage.getItem("laundry-mvp-v1"));
        const assignment = data.assignments.find(
          (a) => a.orderId === orderId && a.type === "PICKUP",
        );
        const driver = data.drivers.find((d) => d.id === assignment.driverId);
        return (
          driver.trackingEtaSeconds > 0 && driver.trackingEtaSeconds <= 120
        );
      }, id),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Marcar llegada", exact: true })
    .click();
  await page.getByRole("button", { name: "Sí, llegué", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirmar recogida", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "Verifiqué las prendas entregadas por el cliente.",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirmar recogida", exact: true })
    .click();
  await expect(
    page
      .getByText("Recogida registrada", { exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ir a planta", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirmar entrega en planta", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar entrega en planta", exact: true })
    .last()
    .click();
  await expect
    .poll(
      () =>
        page.evaluate((orderId) => {
          const data = JSON.parse(
            localStorage.getItem("laundry-mvp-v1") || "{}",
          );
          return data.assignments?.find(
            (a) => a.orderId === orderId && a.type === "DELIVERY",
          )?.driverId;
        }, id),
      { timeout: 70000 },
    )
    .toBeTruthy();
  const deliveryDriverEmail = await page.evaluate((orderId) => {
    const data = JSON.parse(localStorage.getItem("laundry-mvp-v1"));
    const assignment = data.assignments.find(
      (a) => a.orderId === orderId && a.type === "DELIVERY",
    );
    return data.drivers.find((d) => d.id === assignment.driverId).email;
  }, id);
  if (deliveryDriverEmail !== pickupDriverEmail) {
    await page.goto("/(driver)/(tabs)/profile");
    await page
      .getByRole("button", { name: "Cerrar sesión", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Cerrar sesión", exact: true })
      .last()
      .click();
    await login(page, deliveryDriverEmail);
  }
  await page.goto(`/(driver)/service/${id}`);
  await expect(
    page.getByRole("button", { name: "Iniciar navegación", exact: true }),
  ).toBeVisible({ timeout: 70000 });
  await page
    .getByRole("button", { name: "Iniciar navegación", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Marcar llegada", exact: true })
    .click();
  await page.getByRole("button", { name: "Sí, llegué", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirmar entrega", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Completar entrega", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Nombre del destinatario", { exact: true })
    .fill("Sofía Fresh");
  await page
    .getByRole("checkbox", {
      name: "Confirmo que el pedido fue entregado al destinatario indicado.",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Completar entrega", exact: true })
    .click();
  await expect(
    page.getByText("Entrega completada", { exact: true }),
  ).toBeVisible();
  await page.goto("/(driver)/(tabs)/profile");
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .last()
    .click();
  await login(page, "nuevo@laundryfresh.com");
  await page.goto(`/(client)/order/${id}`);
  await expect(
    page.getByText("Pedido entregado", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Recibió: Sofía Fresh · Cliente", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((orderId) => {
        const data = JSON.parse(localStorage.getItem("laundry-mvp-v1"));
        return data.orders.find((o) => o.id === orderId).status;
      }, id),
    )
    .toBe("CLOSED");
  await expect(
    page.getByText("Pedido finalizado", { exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/client-delivered.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("new customer submits identity images and persists a saved address", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  const email = `demo-${Date.now()}@example.com`;
  for (const [label, value] of [
    ["Nombre", "Lucía"],
    ["Apellido", "Demo"],
    ["Email", email],
    ["Teléfono", "0991234567"],
    ["Contraseña", "Demo2026!"],
    ["Confirmar contraseña", "Demo2026!"],
  ])
    await page
      .getByLabel(label, { exact: true })
      .filter({ visible: true })
      .fill(value);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByText("Verifica tu identidad", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Número de cédula / documento", { exact: true })
    .fill("DEMO12345");
  const image = {
    name: "evidencia-demo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==",
      "base64",
    ),
  };
  async function upload() {
    const chooser = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Subir imagen", exact: true })
      .click();
    await (await chooser).setFiles(image);
  }
  await upload();
  await expect(
    page.getByLabel("Vista previa del documento", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await upload();
  await expect(
    page.getByLabel("Vista previa de la selfie", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enviar verificación", exact: true })
    .click();
  await expect(
    page.getByText("Estamos verificando tu cuenta", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver estado", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Solicitar recogida", exact: true }),
  ).toBeVisible();
  await page.goto("/(client)/addresses");
  await page
    .getByRole("button", { name: "Agregar dirección", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Usar ubicación actual", exact: true })
    .click();
  await page
    .getByLabel("Nombre de dirección", { exact: true })
    .fill("Casa de Lucía");
  await page
    .getByLabel("Dirección completa", { exact: true })
    .fill("Av. Samborondón 123, Ecuador");
  await page
    .getByLabel("Referencia / indicaciones", { exact: true })
    .fill("Portería principal");
  await page
    .getByRole("button", { name: "Confirmar ubicación", exact: true })
    .click();
  await expect(page.getByText("Casa de Lucía", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Casa de Lucía", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/client-address.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("pending and rejected identities cannot reach the order wizard", async ({
  page,
}) => {
  await login(
    page,
    web.INITIAL_CUSTOMERS.find((c) => c.kycStatus === "PENDING").email,
  );
  await expect(
    page.getByText("Estamos verificando tu cuenta", { exact: true }),
  ).toBeVisible();
  await page.goto("/(client)/new-order/garments");
  await expect(
    page.getByText("Estamos verificando tu cuenta", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Solicitar recogida", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Ver estado", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Solicitar recogida", exact: true }),
  ).toBeVisible();
  await logout(page);
  await login(
    page,
    web.INITIAL_CUSTOMERS.find((c) => c.kycStatus === "REJECTED").email,
  );
  await expect(
    page.getByText("Necesitamos nueva información", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reenviar documentos", exact: true })
    .click();
  await expect(
    page.getByText("Verifica tu identidad", { exact: true }),
  ).toBeVisible();
});
test("driver must replace the temporary password before accessing a route", async ({
  page,
}) => {
  await login(page, "carlos.ruiz@laundryweb.com", "Temporal2026!");
  await expect(
    page.getByText("Crea una nueva contraseña", { exact: true }),
  ).toBeVisible();
  await page.goto("/(driver)/(tabs)/route");
  await expect(
    page.getByText("Crea una nueva contraseña", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Contraseña temporal", { exact: true })
    .fill("Temporal2026!");
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("Renovada2026!");
  await page
    .getByLabel("Confirmar contraseña", { exact: true })
    .fill("Renovada2026!");
  await page
    .getByRole("button", { name: "Actualizar contraseña", exact: true })
    .click();
  await expect(
    page.getByText("Tu próxima parada, a un toque", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Tu próxima parada, a un toque", { exact: true }),
  ).toBeVisible();
});
