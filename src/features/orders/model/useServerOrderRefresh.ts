import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { useApp } from "../../../store/AppProvider";
import { orderService } from "../../../services/orders/orderService";

// La lista de solicitudes no trae el historial. Mientras el detalle está en pantalla se pide la
// solicitud completa al servidor (con sus eventos) al entrar y cada `everyMs`, para reflejar el
// avance que registra el chofer o la sede.
export const ORDER_REFRESH_MS = 20_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useServerOrderRefresh(backendId: string | undefined, everyMs = ORDER_REFRESH_MS) {
  const { execute } = useApp();
  const focused = useIsFocused();
  const executeRef = useRef(execute);
  executeRef.current = execute;

  useEffect(() => {
    // Las solicitudes que solo existen en el teléfono no tienen id del servidor.
    if (!backendId || !UUID.test(backendId) || !focused) return;
    let active = true;
    const load = () =>
      orderService
        .getOrder(backendId)
        .then((raw) => {
          if (!active || !raw || typeof raw !== "object" || Array.isArray(raw) || !raw.id) return;
          executeRef.current((repo) => repo.syncOrdersFromApi([raw]));
        })
        .catch(() => {
          // Sin conexión o sin sesión se mantiene lo último conocido.
        });
    void load();
    const timer = setInterval(() => void load(), everyMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [backendId, focused, everyMs]);
}
