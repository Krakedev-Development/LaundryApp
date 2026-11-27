import type { LoyaltyRedemption } from "../../domain/models";
import { apiClient } from "../api/apiClient";
import { withSession } from "../auth/withSession";

export interface ServerPointsEntry {
  id: string;
  customerId: string;
  orderId?: string | null;
  points: number;
  reason: string;
  note?: string | null;
  createdAt: string;
}

export interface MyPointsResponse {
  balance: number;
  entries: ServerPointsEntry[];
}

export interface ServerRedemption {
  id: string;
  customerId: string;
  rewardId: string;
  pointsCost: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewReason?: string | null;
  generatedPromoCode?: string | null;
  walletCreditAmount?: string | number | null;
  createdAt: string;
  reviewedAt?: string | null;
  reward?: { title: string; fulfillmentType?: string | null } | null;
}

export function mapServerRedemptionToDomain(
  raw: ServerRedemption,
): LoyaltyRedemption {
  const statusLabel =
    raw.status === "APPROVED"
      ? "Aprobado"
      : raw.status === "REJECTED"
        ? "Rechazado"
        : "Pendiente de aprobación";
  return {
    id: raw.id,
    customerId: raw.customerId,
    rewardTitle: raw.reward?.title ?? "Recompensa",
    pointsCost: raw.pointsCost,
    date: raw.createdAt.slice(0, 10),
    status: statusLabel,
    generatedPromoCode: raw.generatedPromoCode ?? null,
    walletCreditAmount:
      raw.walletCreditAmount != null ? Number(raw.walletCreditAmount) : null,
    reviewReason: raw.reviewReason ?? null,
  };
}

export const pointsService = {
  getMyPoints(): Promise<MyPointsResponse> {
    return withSession((accessToken) =>
      apiClient.get<MyPointsResponse>("/points", { accessToken }),
    );
  },

  redeem(rewardId: string): Promise<ServerRedemption> {
    return withSession((accessToken) =>
      apiClient.post<ServerRedemption>(
        "/points/redeem",
        { rewardId },
        { accessToken },
      ),
    );
  },

  async listRedemptions(
    status?: "PENDING" | "APPROVED" | "REJECTED",
  ): Promise<LoyaltyRedemption[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    const rows = await withSession((accessToken) =>
      apiClient.get<ServerRedemption[]>(`/redemptions${qs}`, { accessToken }),
    );
    return (Array.isArray(rows) ? rows : []).map(mapServerRedemptionToDomain);
  },
};
