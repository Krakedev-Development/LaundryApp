import {
  API_BASE_URL,
  ApiError,
  apiClient,
  parseResponse,
} from "../api/apiClient";
import { authService, getStoredAuthSession } from "../auth/authService";

export type KycDocumentType = "SELFIE" | "ID_FRONT" | "ID_BACK";
export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

// Estado de la verificación según el servidor, que es quien decide.
export interface KycState {
  status: KycStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  submissions: number;
  resubmissionsLeft: number;
  canSubmit: boolean;
  uploaded: KycDocumentType[];
}

export const KYC_DOCUMENT_TYPES: readonly KycDocumentType[] = [
  "SELFIE",
  "ID_FRONT",
  "ID_BACK",
];

// Si el token de acceso venció a mitad del registro, se renueva una vez y se reintenta.
async function withSession<T>(call: (token: string | null) => Promise<T>): Promise<T> {
  const { accessToken } = await getStoredAuthSession();
  try {
    return await call(accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
    const tokens = await authService.refresh();
    return call(tokens.accessToken);
  }
}

export const kycService = {
  status(): Promise<KycState> {
    return withSession((accessToken) =>
      apiClient.get<KycState>("/kyc/me", { accessToken }),
    );
  },

  // Sube (o reemplaza) una imagen del envío en curso.
  upload(type: KycDocumentType, uri: string): Promise<KycState> {
    return withSession(async (token) => {
      const form = new FormData();
      // En web el archivo se envía como Blob; en nativo, como referencia al archivo.
      if (typeof document !== "undefined") {
        const blob = await (await fetch(uri)).blob();
        form.append("file", blob, `${type}.jpg`);
      } else {
        form.append("file", {
          uri,
          name: `${type}.jpg`,
          type: "image/jpeg",
        } as unknown as Blob);
      }
      const response = await fetch(
        `${API_BASE_URL.replace(/\/+$/, "")}/kyc/me/documents/${type}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: form,
        },
      );
      return parseResponse<KycState>(response);
    });
  },

  // Envía a revisión: el servidor exige las tres imágenes y valida la cédula.
  submit(documentNumber: string): Promise<KycState> {
    return withSession((accessToken) =>
      apiClient.post<KycState>(
        "/kyc/me/submit",
        { documentNumber: documentNumber.trim() },
        { accessToken },
      ),
    );
  },
};
