import type { AppState, Driver } from "../domain/models";

export function migrateClientAudience(state: AppState): AppState {
  state.accounts = state.accounts.filter(
    (account) => account.role === "CLIENT",
  );
  if (state.session?.role !== "CLIENT") state.session = null;
  const tracking = state.driver as Driver & {
    mustChangePassword?: boolean;
    operationalStatus?: string;
    completedDeliveriesCount?: number;
  };
  delete tracking.mustChangePassword;
  delete tracking.operationalStatus;
  delete tracking.completedDeliveriesCount;
  return state;
}
