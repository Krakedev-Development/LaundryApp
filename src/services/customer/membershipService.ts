import { apiClient } from "../api/apiClient";
import { withSession } from "../auth/withSession";

export interface CurrentMembershipResponse {
  membershipPlan: {
    id: string;
    name: string;
    description?: string | null;
    priceMonthly: string | number;
    interval?: "MONTHLY" | "QUARTERLY" | "YEARLY";
    weeklyPickups?: number | null;
    garmentDiscountPercent: string | number;
    priorityService?: boolean;
  } | null;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | null;
  startedAt: string | null;
  expiresAt: string | null;
  weeklyPickupsUsed: number;
  weeklyPickupsLimit: number | null;
  walletBalance: string;
}

export interface SubscribeMembershipResponse {
  membershipPlan: {
    id: string;
    name: string;
    priceMonthly: string | number;
    interval?: "MONTHLY" | "QUARTERLY" | "YEARLY";
    weeklyPickups?: number | null;
    garmentDiscountPercent: string | number;
    priorityService?: boolean;
  };
  status: "ACTIVE";
  startedAt: string;
  expiresAt: string;
  priceCharged: string;
  walletBalance: string;
}

export const membershipService = {
  getCurrent(): Promise<CurrentMembershipResponse> {
    return withSession((accessToken) =>
      apiClient.get<CurrentMembershipResponse>("/customers/me/membership", {
        accessToken,
      }),
    );
  },

  // El servidor activa el plan descontando de la billetera y registra la vigencia.
  choose(planId: string): Promise<SubscribeMembershipResponse> {
    return withSession((accessToken) =>
      apiClient.put<SubscribeMembershipResponse>(
        "/customers/me/membership",
        { planId },
        { accessToken },
      ),
    );
  },

  cancel(): Promise<{ membershipPlan: null; status: "CANCELLED" }> {
    return withSession((accessToken) =>
      apiClient.delete<{ membershipPlan: null; status: "CANCELLED" }>(
        "/customers/me/membership",
        { accessToken },
      ),
    );
  },
};
