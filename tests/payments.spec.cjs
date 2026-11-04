const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText("Ropa fresca, tiempo para ti.")).toBeVisible();
});
async function methods(page) {
  await page.getByRole("tab", { name: "Perfil", exact: true }).click();
  await page
    .getByRole("button", { name: "Métodos de pago", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Métodos de pago", exact: true }),
  ).toBeVisible();
}
test("payment methods is separate from wallet and card registration persists masked data", async ({
  page,
}) => {
  await methods(page);
  await expect(
    page.getByRole("button", { name: "Recargar billetera", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Movimientos", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Agregar método de pago", exact: true })
    .click();
  const save = page.getByRole("button", {
    name: "Guardar tarjeta",
    exact: true,
  });
  await expect(save).toBeDisabled();
  await page
    .getByLabel("Número de tarjeta", { exact: true })
    .fill("4111111111111112");
  await page.getByLabel("Número de tarjeta", { exact: true }).blur();
  await expect(
    page.getByText("Revisa el número de tarjeta.", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Número de tarjeta", { exact: true })
    .fill("4111111111111111");
  await page
    .getByLabel("Nombre del titular", { exact: true })
    .fill("María Torres");
  await page.getByLabel("Vencimiento", { exact: true }).fill("12/30");
  await page.getByLabel("CVV", { exact: true }).fill("123");
  await expect(save).toBeEnabled();
  await save.click();
  await expect(
    page.getByRole("button", { name: "Eliminar Visa · 1111", exact: true }),
  ).toBeVisible();
  await page.reload();
  await methods(page);
  await expect(
    page.getByRole("button", { name: "Eliminar Visa · 1111", exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("laundry.native-migration.v1"),
    ).paymentMethods.find((method) => method.last4 === "1111"),
  );
  expect(saved.number).toBeUndefined();
  expect(saved.cvv).toBeUndefined();
  await page.getByRole("tab", { name: "Perfil", exact: true }).click();
  await page.getByRole("button", { name: /^Billetera Laundry ·/ }).click();
  await expect(
    page.getByRole("heading", { name: "Billetera Laundry", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "$28.50", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Agregar método de pago", exact: true }),
  ).toHaveCount(0);
});
test("bank transfer accounts persist, can become principal and deletion is confirmed", async ({
  page,
}) => {
  await methods(page);
  await page
    .getByRole("button", { name: "Agregar método de pago", exact: true })
    .click();
  await page.getByRole("radio", { name: "Transferencia", exact: true }).click();
  const save = page.getByRole("button", {
    name: "Guardar cuenta bancaria",
    exact: true,
  });
  await expect(save).toBeDisabled();
  await expect(page.getByLabel("CVV", { exact: true })).toHaveCount(0);
  await page.getByLabel("Banco", { exact: true }).fill("Banco de prueba");
  await page
    .getByLabel("Titular de la cuenta", { exact: true })
    .fill("María Torres");
  await page.getByLabel("Número de cuenta", { exact: true }).fill("0123456789");
  await page.getByRole("radio", { name: "Corriente", exact: true }).click();
  await expect(save).toBeEnabled();
  await save.click();
  await expect(
    page.getByText("Transferencia · Cuenta corriente", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Usar Banco de prueba · 6789 como principal",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Usar Visa · 4242 como principal",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await methods(page);
  const remove = page.getByRole("button", {
    name: "Eliminar Banco de prueba · 6789",
    exact: true,
  });
  await remove.click();
  await page
    .getByRole("button", { name: "Conservar método", exact: true })
    .click();
  await expect(remove).toBeVisible();
  await remove.click();
  await page
    .getByRole("button", {
      name: "Confirmar eliminación del método",
      exact: true,
    })
    .click();
  await expect(remove).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Usar Visa · 4242 como principal",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.reload();
  await methods(page);
  await expect(remove).toHaveCount(0);
});
test("payment forms fit a small phone and Back returns to methods without saving", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await methods(page);
  await page
    .getByRole("button", { name: "Agregar método de pago", exact: true })
    .click();
  await page
    .getByLabel("Nombre del titular", { exact: true })
    .fill("Un borrador sin guardar");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.getByRole("button", { name: "Atrás", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Métodos de pago", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Eliminar / })).toHaveCount(1);
  await page
    .getByRole("button", { name: "Agregar método de pago", exact: true })
    .click();
  await page.getByRole("radio", { name: "Transferencia", exact: true }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  const bounds = await page
    .getByRole("button", { name: "Guardar cuenta bancaria", exact: true })
    .boundingBox();
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(640);
});
