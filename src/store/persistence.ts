import type { AppState } from "../domain/models";

export const STORAGE_KEY = "laundry.native-migration.v1";
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export function decodeState(raw: string): AppState {
  const s = JSON.parse(raw) as AppState;
  if (
    !s ||
    s.version !== 1 ||
    !Array.isArray(s.customers) ||
    !s.customers.length ||
    !s.driver ||
    !Array.isArray(s.accounts) ||
    !Array.isArray(s.orders) ||
    !Array.isArray(s.timeSlots) ||
    !Array.isArray(s.customerCharges) ||
    !Array.isArray(s.walletTransactions) ||
    !Array.isArray(s.notifications) ||
    !Array.isArray(s.loyaltyRedemptions) ||
    !Array.isArray(s.rescheduleRequests) ||
    !s.chatMessages
  )
    throw Error("Los datos locales no tienen un formato compatible.");
  if (
    s.customers.some(
      (c) =>
        !c.id ||
        !Array.isArray(c.addresses) ||
        !Number.isFinite(c.walletBalance) ||
        c.walletBalance < 0 ||
        !Number.isFinite(c.loyaltyPoints),
    ) ||
    (s.session &&
      (!s.accounts.some(
        (a) => a.id === s.session!.id && a.role === s.session!.role,
      ) ||
        (s.session.role === "CLIENT" &&
          !s.customers.some((c) => c.id === s.session!.id)) ||
        (s.session.role === "DRIVER" && s.session.id !== s.driver.id)))
  )
    throw Error("Los datos locales no son válidos.");
  return s;
}
/** Serializes writes so rapid actions and reset cannot overwrite newer state. */
export class PersistenceQueue {
  private pending: Promise<void> = Promise.resolve();
  constructor(private storage: StorageAdapter) {}
  load(): Promise<AppState | null> {
    return this.storage
      .getItem(STORAGE_KEY)
      .then((raw) => (raw ? decodeState(raw) : null));
  }
  save(state: AppState): Promise<void> {
    const snapshot = JSON.stringify(state);
    const next = this.pending
      .catch(() => {})
      .then(() => this.storage.setItem(STORAGE_KEY, snapshot));
    this.pending = next;
    return next;
  }
  flush(): Promise<void> {
    return this.pending;
  }
}
