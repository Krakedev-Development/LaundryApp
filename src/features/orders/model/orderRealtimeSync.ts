// Lógica sin React Native, para poder probarla.
//
// El servidor avisa por el socket cada cambio de un pedido del cliente (`order:status:changed`):
// asignación de chofer, avance del chofer o de la sede, cancelación, reprogramación. La app vuelve
// a leer ese pedido y actualiza su copia local. Al reconectar se relee la lista completa, porque
// mientras no había conexión se pudieron perder avisos.

export const ORDER_SYNC_DEBOUNCE_MS = 300;

export interface OrderSyncDeps<T> {
  fetchOne(orderId: string): Promise<T | null | undefined>;
  fetchAll(): Promise<T[] | null | undefined>;
  apply(orders: T[]): void;
  debounceMs?: number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export interface OrderSyncScheduler {
  /** Un pedido cambió: se relee (agrupando avisos repetidos del mismo pedido). */
  orderChanged(orderId: string): void;
  /** Reconexión o vuelta a la app: se relee la lista completa. */
  resync(): Promise<void>;
  dispose(): void;
}

const isRecord = (value: unknown): value is { id: string } =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof (value as { id?: unknown }).id === "string";

export function createOrderSyncScheduler<T>(deps: OrderSyncDeps<T>): OrderSyncScheduler {
  const debounceMs = deps.debounceMs ?? ORDER_SYNC_DEBOUNCE_MS;
  const setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const pending = new Map<string, unknown>();
  let disposed = false;

  const load = async (orderId: string) => {
    try {
      const raw = await deps.fetchOne(orderId);
      if (!disposed && isRecord(raw)) deps.apply([raw]);
    } catch {
      // Sin conexión o sin acceso: se conserva lo último conocido.
    }
  };

  return {
    orderChanged(orderId) {
      if (disposed || !orderId) return;
      const previous = pending.get(orderId);
      if (previous !== undefined) clearTimer(previous);
      pending.set(
        orderId,
        setTimer(() => {
          pending.delete(orderId);
          void load(orderId);
        }, debounceMs),
      );
    },
    async resync() {
      if (disposed) return;
      try {
        const list = await deps.fetchAll();
        if (!disposed && Array.isArray(list) && list.length) deps.apply(list);
      } catch {
        // Igual que arriba: sin conexión se conserva lo último conocido.
      }
    },
    dispose() {
      disposed = true;
      for (const handle of pending.values()) clearTimer(handle);
      pending.clear();
    },
  };
}
