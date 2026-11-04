const { test, expect } = require("@playwright/test");

test("client login retains registration and rejects driver credentials", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("tab", { name: "Perfil", exact: true }).click();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Chofer demo", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Crear cuenta", exact: true }),
  ).toBeVisible();
  await page
    .getByTestId("login_email_input")
    .fill("carlos.mendoza@laundryfresh.com");
  await page.getByTestId("login_submit_button").click();
  await expect(page.getByRole("alert")).toContainText("incorrect");
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Nombre completo", exact: true }),
  ).toBeVisible();
});
