import { contentColors } from "../design-system/classic";
import { Pressable, StyleSheet, View } from "react-native";
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
  appearance = "default",
}: {
  order: Order;
  onDetail(): void;
  onTrack?(): void;
  appearance?: "default" | "home";
}) {
  const home = appearance === "home";
  return (
    <Card style={[{ padding: 0 }, home && homeOrderStyles.card]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Ver detalle de " + order.id}
        onPress={onDetail}
        style={({ pressed }) => ({
          padding: home ? 14 : 16,
          gap: 8,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <Title style={home && homeOrderStyles.title}>{order.id}</Title>
          <Icon name="chevron-forward" size={18} />
        </View>
        <StatusChip status={order.status} />
        <Body muted style={home && homeOrderStyles.caption}>
          {modeLabels[order.fulfillmentPlan.mode]}
        </Body>
        <Body muted style={home && homeOrderStyles.caption}>
          {order.pricingModel === "PER_WEIGHT"
            ? "Ropa por peso · $2.20 / lb"
            : garmentCount(order) +
              " prendas · " +
              (order.items[0]?.serviceType ?? "Lavado y cuidado")}
        </Body>
        <View
          style={[
            ui.row,
            {
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderTopColor: home ? "#BFDBFE" : contentColors.divider,
              paddingTop: 8,
              marginTop: 4,
            },
          ]}
        >
          <Body muted style={home && homeOrderStyles.caption}>
            {order.pickup.date} · {order.pickup.timeSlot}
          </Body>
          <Body style={home && homeOrderStyles.amount}>
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

const homeOrderStyles = StyleSheet.create({
  card: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    shadowOpacity: 0,
    elevation: 0,
  },
  title: { fontSize: 14, lineHeight: 20, fontWeight: "700", color: "#1D4ED8" },
  caption: { color: contentColors.primary, fontSize: 12, lineHeight: 18 },
  amount: { color: contentColors.primary, fontWeight: "700" },
});
