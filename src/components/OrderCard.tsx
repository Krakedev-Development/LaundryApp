import { Pressable, View } from "react-native";
import { Body, Button, Card, Icon, Title, ui } from "./ui";
import { StatusChip } from "./presentation";
import {
  canTrack,
  garmentCount,
  modeLabels,
  money,
  type Order,
} from "../domain/models";
export function OrderCard({
  order,
  onDetail,
  onTrack,
}: {
  order: Order;
  onDetail(): void;
  onTrack?(): void;
}) {
  return (
    <Card style={{ padding: 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Ver detalle de " + order.id}
        onPress={onDetail}
        style={({ pressed }) => ({
          padding: 18,
          gap: 8,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <Title>{order.id}</Title>
          <Icon name="chevron-forward" size={18} />
        </View>
        <StatusChip status={order.status} />
        <Body muted>{modeLabels[order.fulfillmentPlan.mode]}</Body>
        <Body muted>
          {order.pricingModel === "PER_WEIGHT"
            ? "Ropa por peso · $2.20 / lb"
            : garmentCount(order) +
              " prendas · " +
              (order.items[0]?.serviceType ?? "Lavado y cuidado")}
        </Body>
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <Body muted>
            {order.pickup.date} · {order.pickup.timeSlot}
          </Body>
          <Body>
            {order.pricingStatus === "PENDING_WEIGHT"
              ? "Monto por determinar"
              : money(order.pricing.total)}
          </Body>
        </View>
      </Pressable>
      {onTrack && canTrack(order) && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          <Button
            label="Seguir chofer"
            icon="navigate-outline"
            secondary
            onPress={onTrack}
          />
        </View>
      )}
    </Card>
  );
}
