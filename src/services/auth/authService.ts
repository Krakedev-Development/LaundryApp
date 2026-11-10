import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError, apiClient } from "../api/apiClient";

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: "laundry.auth.accessToken",
  REFRESH_TOKEN: "laundry.auth.refreshToken",
  USER_PROFILE: "laundry.auth.userProfile",
} as const;

export const CLIENT_ONLY_ERROR_MESSAGE =
  "Esta aplicación es exclusiva para clientes.";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  status?: string;
  facilityId?: string | null;
  // Estado de la verificación de identidad que informa el servidor.
  kycStatus?: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const memoryFallback = new Map<string, string>();

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  memoryFallback.set(key, value);
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Fallback to in-memory storage in non-browser/Node test environments
  }
}

async function safeRemoveItem(key: string): Promise<void> {
  memoryFallback.delete(key);
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Fallback to in-memory storage in non-browser/Node test environments
  }
}

function assertClientAudience(user: AuthUser): void {
  if (!user || user.role !== "CLIENT") {
    throw new Error(CLIENT_ONLY_ERROR_MESSAGE);
  }
}

export async function saveAuthSession(
  user: AuthUser,
  tokens: AuthTokens,
): Promise<void> {
  await Promise.all([
    safeSetItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
    safeSetItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
    safeSetItem(AUTH_STORAGE_KEYS.USER_PROFILE, JSON.stringify(user)),
  ]);
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    safeSetItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
    safeSetItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
  ]);
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([
    safeRemoveItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN),
    safeRemoveItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN),
    safeRemoveItem(AUTH_STORAGE_KEYS.USER_PROFILE),
  ]);
}

export async function getStoredAuthSession(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}> {
  const [accessToken, refreshToken, rawUser] = await Promise.all([
    safeGetItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN),
    safeGetItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN),
    safeGetItem(AUTH_STORAGE_KEYS.USER_PROFILE),
  ]);
  let user: AuthUser | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as AuthUser;
    } catch {
      user = null;
    }
  }
  return { accessToken, refreshToken, user };
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const normalized: RegisterPayload = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      password: payload.password,
    };
    const response = await apiClient.post<AuthResponse>(
      "/auth/register",
      normalized,
    );
    const enrichedUser: AuthUser = {
      ...response.user,
      phone: response.user.phone ?? normalized.phone,
    };
    assertClientAudience(enrichedUser);
    await saveAuthSession(enrichedUser, response.tokens);
    return { user: enrichedUser, tokens: response.tokens };
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const normalized: LoginPayload = {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    };
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      normalized,
    );
    if (!response.user || response.user.role !== "CLIENT") {
      try {
        if (response.tokens?.refreshToken) {
          await apiClient.post("/auth/logout", {
            refreshToken: response.tokens.refreshToken,
          });
        }
      } catch {
        // Ignore cleanup errors when rejecting non-client role
      }
      await clearAuthSession();
      throw new Error(CLIENT_ONLY_ERROR_MESSAGE);
    }
    await saveAuthSession(response.user, response.tokens);
    return response;
  },

  // Perfil vigente desde el servidor (incluye el estado de verificación). Si el token de
  // acceso venció, se renueva una vez con el de renovación.
  async me(): Promise<AuthUser> {
    const load = async () => {
      const { accessToken } = await getStoredAuthSession();
      return apiClient.get<AuthUser>("/auth/me", { accessToken });
    };
    try {
      return await load();
    } catch (error) {
      if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
      await authService.refresh();
      return load();
    }
  },

  // Actualiza el perfil guardado con el vigente del servidor (estado de verificación,
  // por ejemplo). Sin conexión o sin sesión válida conserva el guardado.
  async syncProfile(): Promise<AuthUser | null> {
    try {
      const fresh = await authService.me();
      const stored = await getStoredAuthSession();
      const user: AuthUser = { ...stored.user, ...fresh };
      await safeSetItem(AUTH_STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  },

  async refresh(refreshToken?: string): Promise<AuthTokens> {
    const token =
      refreshToken ?? (await safeGetItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN));
    if (!token) {
      throw new Error("No hay una sesión activa para renovar.");
    }
    const response = await apiClient.post<
      AuthTokens | { tokens: AuthTokens; user?: AuthUser }
    >("/auth/refresh", {
      refreshToken: token,
    });
    const tokens = "tokens" in response ? response.tokens : response;
    if ("user" in response && response.user) {
      assertClientAudience(response.user);
      await saveAuthSession(response.user, tokens);
    } else {
      await saveAuthTokens(tokens);
    }
    return tokens;
  },

  async logout(refreshToken?: string): Promise<void> {
    const token =
      refreshToken ?? (await safeGetItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN));
    try {
      if (token) {
        await apiClient.post("/auth/logout", { refreshToken: token });
      }
    } catch {
      // Proceed to clear local session even if backend is unreachable
    } finally {
      await clearAuthSession();
    }
  },
};
