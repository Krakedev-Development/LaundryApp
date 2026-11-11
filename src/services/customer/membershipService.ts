import { apiClient } from "../api/apiClient";
import { withSession } from "../auth/withSession";

export const membershipService = {
  // El servidor es quien registra el plan elegido; sin elegir uno no hay membresía.
  choose(planId: string): Promise<{ membershipPlan: { id: string; name: string } }> {
    return withSession((accessToken) =>
      apiClient.put<{ membershipPlan: { id: string; name: string } }>(
        "/customers/me/membership",
        { planId },
        { accessToken },
      ),
    );
  },
};
