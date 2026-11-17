import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Badge, Body, Button, Card, Title, useAction } from "./ui";
import { money } from "../domain/models";
import { useApp } from "../store/AppProvider";
import {
  orderService,
  type BackendOrderDetails,
  type PriceAdjustment,
} from "../services/orders/orderService";

// Refresco mientras el detalle está abierto: la sede puede registrar ajustes en cualquier momento.
const REFRESH_MS = 20_000;
const CLOSED = ["CANCELLED", "COMPLETED"];

const amount = (v: string | number | undefined | null) => Number(v) || 0;

/**
 * Ajustes de precio y pagos de una solicitud del servidor: el cliente aprueba o rechaza los
 * ajustes que suben el precio y paga lo pendiente (inicial o la diferencia del precio final).
 */
export function ServerOrderBilling({ orderId }: { orderId: string }) {
  const { execute } = useApp();
  const focused = useIsFocused();
  const a = useAction();
  const [order, setOrder] = useState<BackendOrderDetails | null>(null);
  const [adjustments, setAdjustments] = useState<PriceAdjustment[]>([]);
  const executeRef = useRef(execute);
  executeRef.current = execute;

  const load = useCallback(async () => {
    const [detail, rows] = await Promise.all([
      orderService.getOrder(orderId),
      orderService.listAdjustments(orderId).catch(() => [] as PriceAdjustment[]),
    ]);
    if (!detail || typeof detail !== "object" || Array.isArray(detail) || !detail.id) return;
    setOrder(detail);
    setAdjustments(Array.isArray(rows) ? rows : []);
    executeRef.current((repo) => repo.syncOrdersFromApi([detail]));
  }, [orderId]);

  useEffect(() => {
    if (!focused) return;
    void load().catch(() => {});
    const timer = setInterval(() => void load().catch(() => {}), REFRESH_MS);
    return () => clearInterval(timer);
  }, [focused, load]);

  if (!order) return null;
  const pending = adjustments.filter((x) => x.status === "PENDING_CUSTOMER");
  const decided = adjustments.filter((x) => x.status !== "PENDING_CUSTOMER");
  const due = amount(order.amountDue);
  const canPay = due > 0 && !CLOSED.includes(order.status);
  const transfer = order.paymentMethodKind === "TRANSFER";

  const decide = (adjustment: PriceAdjustment, approve: boolean) =>
    a.asyncRun(async () => {
      await orderService.decideAdjustment(orderId, adjustment.id, approve, order.version);
      await load();
    }, approve ? "Ajuste aprobado." : "Ajuste rechazado: no se cobrará.");

  const pay = () =>
    a.asyncRun(async () => {
      await orderService.payOrder(orderId, order.version);
      await load();
    }, "Pago registrado.");

  if (!pending.length && !decided.length && !canPay) return null;

  return (
    <Card style={{ gap: 12 }}>
      <Title>Pagos y ajustes</Title>
      {a.feedback}

      {order.status === "CUSTOMER_APPROVAL_PENDING" && pending.length > 0 && (
        <Body muted>
          La sede encontró cambios en el precio de tu solicitud. Revisa cada uno: lo que rechaces no
          se cobra.
        </Body>
      )}
      {pending.map((x) => (
        <View key={x.id} testID={`adjustment_${x.id}`} style={{ gap: 8 }}>
          <Body>{x.customerMessage}</Body>
          <Badge>
            {amount(x.amountDifference) > 0 ? "+" : "-"}
            {money(Math.abs(amount(x.amountDifference)))}
          </Badge>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button label="Aprobar" busy={a.busy} onPress={() => void decide(x, true)} />
            <Button label="Rechazar" secondary busy={a.busy} onPress={() => void decide(x, false)} />
          </View>
        </View>
      ))}
      {decided.map((x) => (
        <Body key={x.id} muted>
          {x.customerMessage} · {amount(x.amountDifference) > 0 ? "+" : "-"}
          {money(Math.abs(amount(x.amountDifference)))} ·{" "}
          {x.status === "APPROVED" ? "Aplicado" : "Rechazado"}
        </Body>
      ))}

      {canPay && (
        <View testID="amount_due" style={{ gap: 8 }}>
          <Body>
            Saldo pendiente: <Body>{money(due)}</Body>
          </Body>
          {transfer ? (
            <Body muted>
              Elegiste transferencia: la sede confirmará tu pago. También puedes pagar ahora con tu
              billetera.
            </Body>
          ) : null}
          <Button label="Pagar con billetera" busy={a.busy} onPress={() => void pay()} />
        </View>
      )}
    </Card>
  );
}
