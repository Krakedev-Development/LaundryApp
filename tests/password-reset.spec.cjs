const { test, expect } = require("./support/fixtures.cjs");

// Recuperación de contraseña: la app pide el código y lo canjea; el servidor se simula.
const cors = { "access-control-allow-origin": "*" };
const preflight = { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
const GENERIC = "Si el correo está registrado, te enviamos un código para restablecer tu contraseña.";

async function mockReset(page, { wrongCode = "000000" } = {}) {
  const calls = { requests: [], confirms: [] };
  const json = (route, status, body) =>
    route.fulfill({ status, headers: cors, contentType: "application/json", body: JSON.stringify(body) });
  await page.route("**/api/v1/auth/password-reset/**", (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: preflight });
    const body = req.postDataJSON();
    if (req.url().endsWith("/request")) {
      calls.requests.push(body);
      return json(route, 200, { message: GENERIC });
    }
    calls.confirms.push(body);
    if (body.code === wrongCode)
      return json(route, 400, { message: "El código no es válido o ya venció. Solicita uno nuevo." });
    return json(route, 200, { message: "Tu contraseña fue actualizada. Ya puedes iniciar sesión." });
  });
  return calls;
}

async function openLogin(page) {
  await page.goto("/");
  await page.getByRole("tab", { name: "Perfil", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  await expect(page.getByTestId("login_email_input")).toBeVisible();
}

test("el cliente restablece su contraseña con el código que recibe por correo", async ({ page }) => {
  const calls = await mockReset(page);
  await openLogin(page);
  await page.getByTestId("login_forgot_password").click();

  // Paso 1: correo.
  const send = page.getByTestId("reset_send_code");
  await expect(send).toBeDisabled();
  await page.getByTestId("reset_email_input").fill("  Ana@Correo.test ");
  await send.click();
  await expect(page.getByText(GENERIC, { exact: false })).toBeVisible();
  expect(calls.requests).toEqual([{ email: "ana@correo.test" }]);

  // Paso 2: código y nueva contraseña, con validaciones.
  const submit = page.getByTestId("reset_submit");
  await page.getByTestId("reset_code_input").fill("12a34");
  await expect(page.getByTestId("reset_code_input")).toHaveValue("1234");
  await page.getByTestId("reset_code_input").fill("123456");
  await page.getByTestId("reset_password_input").fill("sinmayuscula1");
  await page.getByTestId("reset_confirm_input").fill("sinmayuscula1");
  await expect(submit).toBeDisabled();
  await page.getByTestId("reset_password_input").fill("Nueva2026");
  await page.getByTestId("reset_confirm_input").fill("Nueva2027");
  await expect(submit).toBeDisabled();
  await page.getByTestId("reset_confirm_input").fill("Nueva2026");
  await expect(submit).toBeEnabled();
  await submit.click();

  // Paso 3: confirmación y regreso al inicio de sesión.
  await expect(page.getByText("Tu contraseña fue actualizada. Ya puedes iniciar sesión.")).toBeVisible();
  expect(calls.confirms).toEqual([
    { email: "ana@correo.test", code: "123456", newPassword: "Nueva2026" },
  ]);
  await page.getByTestId("reset_back_to_login").click();
  await expect(page.getByTestId("login_email_input")).toBeVisible();
});

test("un código incorrecto muestra el motivo y permite pedir otro", async ({ page }) => {
  const calls = await mockReset(page);
  await openLogin(page);
  await page.getByTestId("login_forgot_password").click();
  await page.getByTestId("reset_email_input").fill("ana@correo.test");
  await page.getByTestId("reset_send_code").click();
  await page.getByTestId("reset_code_input").fill("000000");
  await page.getByTestId("reset_password_input").fill("Nueva2026");
  await page.getByTestId("reset_confirm_input").fill("Nueva2026");
  await page.getByTestId("reset_submit").click();
  await expect(page.getByRole("alert")).toContainText("El código no es válido o ya venció");
  await page.getByTestId("reset_resend").click();
  await expect.poll(() => calls.requests.length).toBe(2);
});
