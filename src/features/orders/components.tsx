import React from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Order, ORDER_STATUS_LABELS, ORDER_STATES } from "../../domain/models";
import {
  chatAvailable,
  dateLabel,
  formatMoney,
  isFinished,
  timeLabel,
  trackingAvailable,
} from "../../domain/rules";
import { Badge, Button, Card, ui } from "../../components/ui";
import { Colors as C } from "../../theme/colors";

export function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  return (
    <Card>
      <View style={ui.between}>
        <Text style={ui.section}>{order.id}</Text>
        {!!(order.priority === "URGENT") && (
          <Badge title="Urgente" tone="warning" />
        )}
      </View>
      <Badge
        title={ORDER_STATUS_LABELS[order.status]}
        tone={isFinished(order.status) ? "success" : "primary"}
      />
      <Text style={ui.body}>
        {order.items.reduce((s, i) => s + i.quantity, 0)} prendas ·{" "}
        {order.items[0]?.serviceName}
      </Text>
      <Text style={ui.muted}>
        Entrega: {dateLabel(order.delivery.date)} · {order.delivery.timeSlot}
      </Text>
      <OrderProgress order={order} />
      <View style={ui.between}>
        <Text style={[ui.section, { color: C.primary }]}>
          {formatMoney(order.pricing.total)}
        </Text>
        <Button
          title={
            trackingAvailable(order.status) ? "Ver seguimiento" : "Ver detalle"
          }
          variant="secondary"
          onPress={() =>
            router.push(
              `/(client)/${trackingAvailable(order.status) ? "tracking" : "order"}/${order.id}`,
            )
          }
        />
      </View>
    </Card>
  );
}
export function OrderProgress({ order }: { order: Order }) {
  const milestones = [
    "CREATED",
    "PICKED_UP",
    "AT_FACILITY",
    "READY_FOR_DELIVERY",
    "DELIVERED",
  ];
  const current = ORDER_STATES.indexOf(order.status);
  return (
    <View
      accessibilityLabel={ORDER_STATUS_LABELS[order.status]}
      style={[ui.row, { gap: 6 }]}
    >
      {milestones.map((m) => (
        <View
          key={m}
          style={{
            flex: 1,
            height: 5,
            borderRadius: 10,
            backgroundColor:
              current >= ORDER_STATES.indexOf(m as Order["status"]) &&
              !["CANCELLED", "QUARANTINE", "INCIDENT"].includes(order.status)
                ? C.limeDark
                : C.border,
          }}
        />
      ))}
    </View>
  );
}
export function Timeline({ order }: { order: Order }) {
  const future = [
    "PICKED_UP",
    "AT_FACILITY",
    "IN_PROCESS",
    "READY_FOR_DELIVERY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ] as const;
  const done = order.timeline.map((t) => t.status);
  const last = order.timeline.at(-1);
  return (
    <Card>
      <Text style={ui.section}>Cada paso, contigo</Text>
      {order.timeline.map((t) => (
        <View key={t.id} style={[ui.row, { alignItems: "flex-start" }]}>
          <View
            style={{
              width: 12,
              height: 12,
              marginTop: 4,
              borderRadius: 6,
              backgroundColor: t.id === last?.id ? C.primary : C.limeDark,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                ui.body,
                { fontWeight: t.id === last?.id ? "800" : "500" },
              ]}
            >
              {ORDER_STATUS_LABELS[t.status]}
            </Text>
            <Text style={ui.meta}>
              {timeLabel(t.timestamp)}
              {t.syncStatus === "PENDING"
                ? " · Pendiente de sincronización"
                : ""}
            </Text>
            {!!t.notes && <Text style={ui.meta}>{t.notes}</Text>}
          </View>
        </View>
      ))}
      {!isFinished(order.status) &&
        future
          .filter(
            (s) =>
              !done.includes(s) &&
              ORDER_STATES.indexOf(s) > ORDER_STATES.indexOf(order.status),
          )
          .map((s) => (
            <View key={s} style={ui.row}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: C.border,
                }}
              />
              <Text style={ui.muted}>{ORDER_STATUS_LABELS[s]}</Text>
            </View>
          ))}
    </Card>
  );
}
export function ClientOrderActions({ order }: { order: Order }) {
  const router = useRouter();
  return (
    <View style={{ gap: 8 }}>
      {!!trackingAvailable(order.status) && (
        <Button
          title="Seguir chofer"
          icon="navigate-outline"
          onPress={() => router.push(`/(client)/tracking/${order.id}`)}
        />
      )}
      {!!chatAvailable(order.status) && (
        <Button
          title="Chat con chofer"
          icon="chatbubble-outline"
          variant="secondary"
          onPress={() => router.push(`/(client)/chat/${order.id}`)}
        />
      )}
    </View>
  );
}
