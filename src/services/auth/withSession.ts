import { ApiError } from "../api/apiClient";
import { authService, getStoredAuthSession } from "./authService";

// Si el token de acceso venció, se renueva una vez y se reintenta la llamada.
export async function withSession<T>(
  call: (token: string | null) => Promise<T>,
): Promise<T> {
  const { accessToken } = await getStoredAuthSession();
  try {
    return await call(accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
    const tokens = await authService.refresh();
    return call(tokens.accessToken);
  }
}
