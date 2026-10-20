import type { AppState } from "../domain/models";

export function migrateClientAudience(state: AppState): AppState {
  state.accounts = state.accounts.filter(
    (account) => account.role === "CLIENT",
  );
  if (state.session?.role !== "CLIENT") state.session = null;
  const legacy = state as AppState & {
    driver?: { currentLat?: number; currentLng?: number };
  };
  const position = legacy.driver;
  if (
    Number.isFinite(position?.currentLat) &&
    Number.isFinite(position?.currentLng)
  ) {
    for (const order of state.orders) {
      order.trackingPosition ??= {
        latitude: position!.currentLat!,
        longitude: position!.currentLng!,
      };
    }
  }
  delete legacy.driver;
  return state;
}
