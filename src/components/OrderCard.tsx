import { View } from "react-native";
import { Badge, Body, Button, Card, Title, ui } from "./ui";
import {
  canTrack,
  garmentCount,
  modeLabels,
  money,
  statusLabels,
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
    <Card>
      <View style={[ui.row, { justifyContent: "space-between" }]}>
        <Title>{order.id}</Title>
        <Badge>{statusLabels[order.status]}</Badge>
      </View>
      <Body>{modeLabels[order.fulfillmentPlan.mode]}</Body>
      <Body muted>
        {order.pricingModel === "PER_WEIGHT"
          ? "Ropa por peso · $2.20 / lb"
          : `${garmentCount(order)} prendas · ${order.items[0]?.serviceType ?? "Lavado y cuidado"}`}
      </Body>
      <Body>
        {order.pickup.date} · {order.pickup.timeSlot}
      </Body>
      <Body>
        {order.pricingStatus === "PENDING_WEIGHT"
          ? "Monto por determinar"
          : money(order.pricing.total)}
      </Body>
      <Button
        label={`Ver detalle de ${order.id}`}
        secondary
        onPress={onDetail}
      />
      {onTrack && canTrack(order) && (
        <Button
          label="Seguir chofer"
          icon="navigate-outline"
          onPress={onTrack}
        />
      )}
    </Card>
  );
}
