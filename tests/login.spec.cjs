const { test, expect } = require("./support/fixtures.cjs");

const cors = { "access-control-allow-origin": "*" };
const tokens = { accessToken: "a", refreshToken: "r", expiresIn: 900 };

test("el acceso arranca vacío y solo admite cuentas de cliente", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Perfil", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  await expect(page.getByTestId("login_email_input")).toHaveValue("");
  await expect(page.getByTestId("login_password_input")).toHaveValue("");
  await expect(page.getByText(/demo/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Crear cuenta", exact: true })).toBeVisible();

  // Una cuenta de otro rol que el servidor acepte no entra a la app del cliente.
  await page.route("**/api/v1/auth/login", (route) =>
    route.request().method() === "OPTIONS"
      ? route.fulfill({ status: 204, headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" } })
      : route.fulfill({
          status: 200,
          headers: cors,
          contentType: "application/json",
          body: JSON.stringify({
            user: { id: "d1", email: "chofer@correo.test", name: "Chofer", role: "DRIVER", status: "ACTIVE", facilityId: null, kycStatus: null },
            tokens,
          }),
        }),
  );
  await page.getByTestId("login_email_input").fill("chofer@correo.test");
  await page.getByTestId("login_password_input").fill("ClaveSegura123");
  await page.getByTestId("login_submit_button").click();
  await expect(page.getByRole("alert")).toContainText("exclusiva para clientes");
  await expect(page.getByRole("tablist")).toHaveCount(0);
});
