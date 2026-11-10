import { getStoredAuthSession } from "../../src/services/auth/authService";
import { apiClient } from "../../src/services/api/apiClient";
import { kycService } from "../../src/services/kyc/kycService";

// Las pruebas contra el backend real necesitan un cliente aprobado: completan la
// verificación con el cliente recién registrado y la aprueba una cuenta de administrador
// que se entrega por variables de entorno (nunca se guarda en el repositorio).
export const adminConfigured = Boolean(
  process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD,
);
export const ADMIN_REQUIRED =
  "Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para aprobar la verificación del cliente de prueba.";

// Cédula de prueba con dígito verificador válido.
const TEST_CEDULA = "0912345675";
const JPEG_BYTES = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3, 4, 5]);

export async function approveClientKyc(email: string): Promise<void> {
  const admin = await apiClient.post<{ tokens: { accessToken: string } }>(
    "/auth/login",
    {
      email: process.env.E2E_ADMIN_EMAIL,
      password: process.env.E2E_ADMIN_PASSWORD,
    },
  );
  const adminToken = admin.tokens.accessToken;
  const { accessToken } = await getStoredAuthSession();
  if (!accessToken) throw Error("El cliente de prueba no tiene sesión.");

  for (const type of ["SELFIE", "ID_FRONT", "ID_BACK"] as const) {
    const form = new FormData();
    form.append("file", new Blob([JPEG_BYTES], { type: "image/jpeg" }), `${type}.jpg`);
    const response = await fetch(`${apiClient.baseUrl}/kyc/me/documents/${type}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    if (!response.ok) throw Error(`No se pudo subir ${type}: ${response.status}`);
  }
  await kycService.submit(TEST_CEDULA);

  const queue = await apiClient.get<{ id: string; user: { email: string } }[]>(
    "/kyc?status=PENDING",
    { accessToken: adminToken },
  );
  const request = queue.find((r) => r.user.email === email.toLowerCase());
  if (!request) throw Error("La verificación no llegó a la cola del administrador.");
  await apiClient.post(
    `/kyc/${request.id}/review`,
    { approve: true },
    { accessToken: adminToken },
  );
}
