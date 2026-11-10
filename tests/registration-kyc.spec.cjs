const { test, expect } = require("@playwright/test");

// La aplicación arranca vacía. Estas pruebas simulan solo la API: registro, estado de
// verificación, subida de imágenes y revisión del administrador.
const JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.from("imagen-de-prueba"),
]);
const cors = { "access-control-allow-origin": "*" };
const TOKENS = { accessToken: "test-access", refreshToken: "test-refresh", expiresIn: 900 };

function mockApi(page, { maxResubmissions = 3 } = {}) {
  const server = {
    status: "NOT_SUBMITTED",
    reason: null,
    submissions: 0,
    uploaded: new Set(),
    puts: [],
    submitted: [],
    registered: null,
  };
  const kyc = () => ({
    status: server.status,
    rejectionReason: server.reason,
    reviewedAt: null,
    submissions: server.submissions,
    resubmissionsLeft: Math.max(0, maxResubmissions - Math.max(0, server.submissions - 1)),
    canSubmit:
      (server.status === "NOT_SUBMITTED" || server.status === "REJECTED") &&
      (server.submissions === 0 || server.submissions - 1 < maxResubmissions),
    uploaded: [...server.uploaded],
  });
  const user = () => ({
    id: "cliente-1",
    email: server.registered?.email ?? "ana@correo.test",
    name: server.registered
      ? `${server.registered.firstName} ${server.registered.lastName}`
      : "Ana Pérez",
    role: "CLIENT",
    status: "ACTIVE",
    facilityId: null,
    kycStatus: server.status,
  });
  page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^.*\/api\/v1/, "");
    const send = (status, body) =>
      route.fulfill({ status, headers: cors, contentType: "application/json", body: JSON.stringify(body) });
    if (request.method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" },
      });
    if (path === "/auth/register" && request.method() === "POST") {
      server.registered = request.postDataJSON();
      return send(201, { user: user(), tokens: TOKENS });
    }
    if (path === "/auth/login") return send(200, { user: user(), tokens: TOKENS });
    if (path === "/auth/me") return send(200, user());
    if (path === "/auth/logout") return route.fulfill({ status: 204, headers: cors });
    if (path === "/kyc/me" && request.method() === "GET") return send(200, kyc());
    const upload = path.match(/^\/kyc\/me\/documents\/(\w+)$/);
    if (upload && request.method() === "PUT") {
      server.puts.push(upload[1]);
      server.uploaded.add(upload[1]);
      return send(200, kyc());
    }
    if (path === "/kyc/me/submit" && request.method() === "POST") {
      const { documentNumber } = request.postDataJSON();
      if (documentNumber === "1234567890")
        return send(400, { message: "El número de cédula no es válido." });
      if (server.uploaded.size < 3)
        return send(400, { message: "Faltan imágenes." });
      server.submitted.push(documentNumber);
      server.status = "PENDING";
      server.submissions += 1;
      server.uploaded.clear();
      return send(201, kyc());
    }
    // Catálogo y demás consultas: sin datos.
    return send(200, []);
  });
  return server;
}

async function start(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("button", { name: "Crear cuenta", exact: true })).toBeVisible();
}

async function attach(page, label, fileName) {
  await page.getByRole("button", { name: new RegExp(`^Adjuntar ${label}`, "i") }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Elegir imagen del dispositivo" }).click();
  (await chooser).setFiles({ name: fileName, mimeType: "image/jpeg", buffer: JPEG });
}

async function register(page) {
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await page.getByTestId("register_first_name").fill("Ana");
  await page.getByTestId("register_last_name").fill("Pérez");
  await page.getByTestId("register_next_button").click();
  await page.getByTestId("register_phone").fill("0991234567");
  await page.getByTestId("register_next_button").click();
  await page.getByTestId("register_email").fill("ana@correo.test");
  await page.getByTestId("register_next_button").click();
  await page.getByTestId("register_password").fill("ClaveSegura123");
  await page.getByTestId("register_password_confirmation").fill("ClaveSegura123");
  await page.getByTestId("register_submit_button").click();
}

test("la app arranca sin sesión ni datos de demostración", async ({ page }) => {
  mockApi(page);
  await start(page);
  await expect(page.getByTestId("login_email_input")).toHaveValue("");
  await expect(page.getByTestId("login_password_input")).toHaveValue("");
  await expect(page.getByText(/demo/i)).toHaveCount(0);
  await expect(page.getByText("María")).toHaveCount(0);
});

test("el registro avanza por partes y valida cada paso", async ({ page }) => {
  const server = mockApi(page);
  await start(page);
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  const next = page.getByTestId("register_next_button");
  await expect(next).toBeDisabled();
  await page.getByTestId("register_first_name").fill("Ana");
  await expect(next).toBeDisabled();
  await page.getByTestId("register_last_name").fill("Pérez");
  await expect(next).toBeEnabled();
  await next.click();
  await page.getByTestId("register_phone").fill("123");
  await expect(next).toBeDisabled();
  await page.getByTestId("register_phone").fill("0991234567");
  await next.click();
  await page.getByTestId("register_email").fill("no-es-correo");
  await expect(next).toBeDisabled();
  await page.getByTestId("register_email").fill("ana@correo.test");
  await next.click();
  const submit = page.getByTestId("register_submit_button");
  await page.getByTestId("register_password").fill("corta1");
  await page.getByTestId("register_password_confirmation").fill("corta1");
  await expect(submit).toBeDisabled();
  await page.getByTestId("register_password").fill("ClaveSegura123");
  await page.getByTestId("register_password_confirmation").fill("OtraClave123");
  await expect(submit).toBeDisabled();
  await page.getByTestId("register_password_confirmation").fill("ClaveSegura123");
  await expect(submit).toBeEnabled();
  expect(server.registered).toBeNull();
});

test("registro, selfie y cédula por ambos lados quedan pendientes de aprobación", async ({ page }) => {
  const server = mockApi(page);
  await start(page);
  await register(page);

  await expect(server.registered).toMatchObject({
    firstName: "Ana",
    lastName: "Pérez",
    email: "ana@correo.test",
    phone: "0991234567",
  });
  expect(server.registered).not.toHaveProperty("name");

  await attach(page, "selfie de verificación", "selfie.jpg");
  await page.getByTestId("kyc_next_button").click();
  await attach(page, "cédula, lado frontal", "frente.jpg");
  await page.getByTestId("kyc_next_button").click();
  await attach(page, "cédula, lado posterior", "reverso.jpg");
  await page.getByTestId("kyc_next_button").click();
  expect(server.puts).toEqual(["SELFIE", "ID_FRONT", "ID_BACK"]);

  // El número de cédula se confirma después de las fotos y el servidor lo valida.
  const submit = page.getByTestId("kyc_submit_button");
  await expect(submit).toBeDisabled();
  await page.getByTestId("kyc_document_number").fill("1234567890");
  await submit.click();
  await expect(page.getByRole("alert")).toContainText("no es válido");
  await page.getByTestId("kyc_document_number").fill("0912345675");
  await submit.click();

  await expect(page.getByText("Estamos revisando tu identidad")).toBeVisible();
  expect(server.submitted).toEqual(["0912345675"]);
  // Pendiente: no hay barra de navegación del cliente ni acciones disponibles.
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await expect(page.getByText(/demo/i)).toHaveCount(0);
});

test("pendiente: el cliente mantiene su sesión y entra cuando el administrador aprueba", async ({ page }) => {
  const server = mockApi(page);
  await start(page);
  await register(page);
  for (const [label, file] of [
    ["selfie de verificación", "selfie.jpg"],
    ["cédula, lado frontal", "frente.jpg"],
    ["cédula, lado posterior", "reverso.jpg"],
  ]) {
    await attach(page, label, file);
    await page.getByTestId("kyc_next_button").click();
  }
  await page.getByTestId("kyc_document_number").fill("0912345675");
  await page.getByTestId("kyc_submit_button").click();
  await expect(page.getByText("Estamos revisando tu identidad")).toBeVisible();

  // Sigue pendiente tras recargar: puede entrar a su cuenta pero no operar.
  await page.reload();
  await expect(page.getByText("Estamos revisando tu identidad")).toBeVisible();
  await page.getByTestId("kyc_refresh_button").click();
  await expect(page.getByText("Estamos revisando tu identidad")).toBeVisible();

  server.status = "APPROVED";
  await page.getByTestId("kyc_refresh_button").click();
  await expect(page.getByRole("tab", { name: "Inicio", exact: true })).toBeVisible();
});

test("rechazado: muestra el motivo y permite reenviar", async ({ page }) => {
  const server = mockApi(page);
  await start(page);
  await register(page);
  for (const [label, file] of [
    ["selfie de verificación", "selfie.jpg"],
    ["cédula, lado frontal", "frente.jpg"],
    ["cédula, lado posterior", "reverso.jpg"],
  ]) {
    await attach(page, label, file);
    await page.getByTestId("kyc_next_button").click();
  }
  await page.getByTestId("kyc_document_number").fill("0912345675");
  await page.getByTestId("kyc_submit_button").click();
  await expect(page.getByText("Estamos revisando tu identidad")).toBeVisible();

  server.status = "REJECTED";
  server.reason = "La foto de la cédula está borrosa";
  await page.getByTestId("kyc_refresh_button").click();
  await expect(page.getByText("Necesitamos una nueva verificación")).toBeVisible();
  await expect(page.getByText("La foto de la cédula está borrosa")).toBeVisible();
  await expect(page.getByText("Reenvíos restantes: 3.")).toBeVisible();
  await page.getByRole("button", { name: "Volver a enviar documentos", exact: true }).click();
  await expect(page.getByText("Motivo del rechazo anterior")).toBeVisible();
});

test("sin reenvíos disponibles no se ofrece volver a enviar", async ({ page }) => {
  const server = mockApi(page, { maxResubmissions: 0 });
  await start(page);
  await register(page);
  for (const [label, file] of [
    ["selfie de verificación", "selfie.jpg"],
    ["cédula, lado frontal", "frente.jpg"],
    ["cédula, lado posterior", "reverso.jpg"],
  ]) {
    await attach(page, label, file);
    await page.getByTestId("kyc_next_button").click();
  }
  await page.getByTestId("kyc_document_number").fill("0912345675");
  await page.getByTestId("kyc_submit_button").click();
  server.status = "REJECTED";
  server.reason = "No coincide";
  await page.getByTestId("kyc_refresh_button").click();
  await expect(page.getByText("Alcanzaste el máximo de reenvíos. Contacta a soporte.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Volver a enviar documentos", exact: true })).toHaveCount(0);
});
