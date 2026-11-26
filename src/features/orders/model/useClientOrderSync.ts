import { useEffect, useRef } from "react";
import { AppState as Lifecycle } from "react-native";
import { useApp } from "../../../store/AppProvider";
import { orderService } from "../../../services/orders/orderService";
import { clientSocketService } from "../../../services/realtime/clientSocketService";
import { createOrderSyncScheduler } from "./orderRealtimeSync";

// Mantiene al día los pedidos del cliente mientras tiene sesión, en cualquier pantalla: inicio,
// lista, detalle. Antes solo escuchaba la pantalla de seguimiento y el resto dependía de recargar.
export function useClientOrderSync(enabled: boolean): void {
  const { execute } = useApp();
  const executeRef = useRef(execute);
  executeRef.current = execute;

  useEffect(() => {
    if (!enabled) return;
    const scheduler = createOrderSyncScheduler({
      fetchOne: (id) => orderService.getOrder(id),
      fetchAll: () => orderService.listOrders(),
      apply: (orders) => executeRef.current((repo) => repo.syncOrdersFromApi(orders)),
    });
    const onChanged = (payload: unknown) => {
      const orderId = (payload as { orderId?: unknown } | null)?.orderId;
      if (typeof orderId === "string") scheduler.orderChanged(orderId);
    };
    // Cada (re)conexión autenticada relee la lista: cubre los avisos perdidos durante el corte.
    const onAuthenticated = () => void scheduler.resync();

    clientSocketService.on("order:status:changed", onChanged);
    clientSocketService.on("order:driver_arrived", onChanged);
    clientSocketService.on("authenticated", onAuthenticated);
    void clientSocketService.connect();

    const lifecycle = Lifecycle.addEventListener("change", (status) => {
      if (status !== "active") return;
      if (clientSocketService.connected) void scheduler.resync();
      else void clientSocketService.connect();
    });

    return () => {
      lifecycle.remove();
      clientSocketService.off("order:status:changed", onChanged);
      clientSocketService.off("order:driver_arrived", onChanged);
      clientSocketService.off("authenticated", onAuthenticated);
      scheduler.dispose();
    };
  }, [enabled]);

  // Al cerrar sesión se corta la conexión; la próxima cuenta abre la suya.
  useEffect(() => {
    if (!enabled) clientSocketService.disconnect();
  }, [enabled]);
}
