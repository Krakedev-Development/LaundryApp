import React, { useState } from "react";
import { Text } from "react-native";
import { useApp } from "../../store/AppStore";
import {
  AppHeader,
  Button,
  Card,
  Chip,
  ConfirmationSheet,
  ErrorState,
  Field,
  Page,
  ui,
} from "../../components/ui";
import { HandoffAction, HandoffCode, FacilityInfo } from "./components";
import { HANDOFF_LABELS } from "../../domain/fulfillment";

export function DemoOperationsScreen() {
  const { data, session, engine, store } = useApp();
  const orders = engine.ordersFor(session!);
  const [id, setId] = useState(orders[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [reset, setReset] = useState(false);
  const order = data.orders.find((o) => o.id === id);
  const actorId = order ? `DEMO-ADMIN-${order.facilityId}` : "";
  const run = (work: () => void) => {
    setError("");
    try {
      work();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Page>
      <AppHeader
        title="Operaciones de sede · demo"
        subtitle="Controles locales para demostrar el recorrido"
        icon="qr-code-outline"
      />
      <Text style={ui.muted}>
        Representa al personal de la sede. Las mismas validaciones de código,
        pago, etapa, prendas y sede se aplican a cada acción.
      </Text>
      {orders.map((o) => (
        <Chip
          key={o.id}
          title={o.id}
          selected={o.id === id}
          onPress={() => {
            setId(o.id);
            setError("");
          }}
        />
      ))}
      {order && (
        <>
          <FacilityInfo order={order} />
          <HandoffCode order={order} />
          <HandoffAction
            key={id + actorId}
            order={order}
            actorId={actorId}
            demo
          />
          <Field
            label="Motivo o resolución (mínimo 5 caracteres)"
            value={reason}
            onChangeText={setReason}
          />
          {order.intakeHold && !order.intakeHold.resolvedAt && (
            <Card>
              <Text style={ui.section}>
                Diferencia de prendas: procesamiento bloqueado
              </Text>
              <Text style={ui.body}>{order.intakeHold.description}</Text>
              <Button
                title="Resolver incidencia"
                onPress={() =>
                  run(() => engine.handoffService.resolve(id, actorId, reason))
                }
              />
            </Card>
          )}
          {data.handoffs
            .filter((h) => h.orderId === id)
            .map((h) => (
              <Card key={h.id}>
                <Text style={ui.section}>
                  {HANDOFF_LABELS[h.type]} · {h.status}
                </Text>
                <Text style={ui.meta}>
                  Generación {h.generation} · Intentos {h.attempts}/
                  {h.maxAttempts}
                </Text>
                {h.receipt && (
                  <Text style={ui.body}>
                    Recibidas: {h.receipt.count ?? "—"} · Recibe:{" "}
                    {h.receipt.recipient ?? "—"} {h.receipt.relationship}
                  </Text>
                )}
                {["LOCKED", "EXPIRED"].includes(h.status) && (
                  <HandoffAction
                    order={order}
                    actorId={actorId}
                    handoffId={h.id}
                    demo
                  />
                )}
                {h.status !== "USED" && h.status !== "REVOKED" && (
                  <>
                    <Button
                      title="Regenerar código"
                      variant="secondary"
                      onPress={() =>
                        run(() => {
                          engine.handoffService.regenerate(
                            h.id,
                            actorId,
                            reason,
                          );
                        })
                      }
                    />
                    <Button
                      title="Revocar código"
                      variant="secondary"
                      onPress={() =>
                        run(() =>
                          engine.handoffService.revoke(h.id, actorId, reason),
                        )
                      }
                    />
                  </>
                )}
              </Card>
            ))}
          <Text style={ui.section}>Historial de validación local</Text>
          {data.handoffAudits
            .filter((a) => a.orderId === id)
            .map((a) => (
              <Text key={a.id} style={ui.meta}>
                {a.at} · {a.action} · {a.actorRole} · {a.reason}
              </Text>
            ))}
        </>
      )}
      {!!error && <ErrorState text={error} />}
      <Button
        title="Reiniciar escenarios locales"
        variant="secondary"
        onPress={() => setReset(true)}
      />
      <ConfirmationSheet
        visible={reset}
        title="Reiniciar demo"
        text="Se perderán los pedidos, cambios y saldos de esta instalación y cerrarás sesión. Se restaurarán los dos escenarios preparados."
        danger
        onClose={() => setReset(false)}
        confirm={() => {
          setReset(false);
          store.resetDemo();
        }}
      />
    </Page>
  );
}
