const { test, expect } = require("@playwright/test");
test("customer creates STORE_STORE without home addresses, receives locally offline and retires with authorized person", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill("nuevo@laundryfresh.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Laundry2026!");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Solicitar recogida", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Elegir ingreso y retiro en sede",
      exact: true,
    })
    .click();
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
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Elegir sede", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: /^(lun|mar|mié|jue|vie|sáb|dom)/i })
    .first()
    .click();
  await page
    .getByRole("button", { name: /^\d{2}:\d{2} - \d{2}:\d{2}$/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Editar entrega", exact: true }),
  ).toHaveCount(0);
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
  await page
    .getByRole("button", { name: "Operaciones de sede · demo", exact: true })
    .click();
  await context.setOffline(true);
  await page
    .getByRole("button", { name: "Demo: cargar código preparado", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Verificar código", exact: true })
    .click();
  await page.getByLabel("Prendas recibidas", { exact: true }).fill("3");
  await page
    .getByRole("checkbox", {
      name: "Verifiqué las prendas y confirmo la entrega física",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "Confirmar transferencia", exact: true })
    .click();
  await expect(
    page.getByText(
      "Transferencia registrada. El código ya no se puede reutilizar.",
      { exact: true },
    ),
  ).toBeVisible();
  await context.setOffline(false);
  await expect
    .poll(
      () =>
        page.evaluate(
          (id) =>
            JSON.parse(localStorage.getItem("laundry-mvp-v1")).orders.find(
              (o) => o.id === id,
            ).status,
          id,
        ),
      { timeout: 70000 },
    )
    .toBe("READY");
  await page
    .getByRole("button", { name: "Demo: cargar código preparado", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Verificar código", exact: true })
    .click();
  await page
    .getByLabel("Nombre de quien recibe o retira", { exact: true })
    .fill("Ana Pérez");
  await page
    .getByLabel("Relación o autorización", { exact: true })
    .fill("Familiar autorizado con código");
  await page
    .getByRole("checkbox", {
      name: "Verifiqué las prendas y confirmo la entrega física",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "Confirmar transferencia", exact: true })
    .click();
  await page.reload();
  const saved = await page.evaluate((id) => {
    const d = JSON.parse(localStorage.getItem("laundry-mvp-v1"));
    const o = d.orders.find((o) => o.id === id);
    return {
      status: o.status,
      mode: o.fulfillment.mode,
      fee: o.pricing.deliveryFee,
      assignments: d.assignments.filter((a) => a.orderId === id).length,
      used: d.handoffs.filter((h) => h.orderId === id && h.status === "USED")
        .length,
    };
  }, id);
  expect(saved).toEqual({
    status: "COMPLETED",
    mode: "STORE_STORE",
    fee: 0,
    assignments: 0,
    used: 2,
  });
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "test-results/store-completed.png",
    fullPage: true,
  });
});
