import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Body, Card, Icon, Title, type IconName } from "./ui";
import type { NotificationItem } from "../domain/models";
import { contentTheme as theme } from "../design-system/classic";

const notificationTones: Record<
  string,
  { icon: IconName; color: string; background: string }
> = {
  CHOFER: { icon: "car-outline", color: "#10B981", background: "#D1FAE5" },
  PEDIDO: { icon: "receipt-outline", color: "#3B82F6", background: "#DBEAFE" },
  PROMO: { icon: "pricetag-outline", color: "#F59E0B", background: "#FEF3C7" },
  PROMOCION: {
    icon: "pricetag-outline",
    color: "#F59E0B",
    background: "#FEF3C7",
  },
};
const systemTone = {
  icon: "notifications-outline" as const,
  color: "#7C3AED",
  background: "#EDE9FE",
};

/** Presentation from 4fa1bd3; reading and routing remain in NotificationsScreen. */
export function NotificationCard({
  notification,
  children,
}: {
  notification: NotificationItem;
  children: ReactNode;
}) {
  const category =
    typeof notification.category === "string"
      ? notification.category.toUpperCase()
      : "";
  const tone = notificationTones[category] ?? systemTone;
  return (
    <Card
      style={[
        notificationStyles.card,
        !notification.isRead && notificationStyles.unreadCard,
      ]}
    >
      <View style={notificationStyles.iconContainer}>
        <View
          style={[
            notificationStyles.icon,
            { backgroundColor: tone.background },
          ]}
        >
          <Icon name={tone.icon} color={tone.color} size={20} />
        </View>
      </View>
      <View style={notificationStyles.content}>
        <View style={notificationStyles.titleRow}>
          <Title
            style={[
              notificationStyles.title,
              !notification.isRead && notificationStyles.unreadTitle,
            ]}
          >
            {notification.title}
          </Title>
          {!notification.isRead && (
            <View style={notificationStyles.unreadIndicator}>
              <View style={notificationStyles.unreadDot} />
              <Text style={notificationStyles.unreadLabel}>Sin leer</Text>
            </View>
          )}
        </View>
        <Body style={notificationStyles.body}>{notification.body}</Body>
        <Body muted style={notificationStyles.time}>
          {notification.timeAgo}
        </Body>
        {children}
      </View>
    </Card>
  );
}

export function NotificationsEmptyState({ text }: { text: string }) {
  return (
    <View style={notificationStyles.empty}>
      <Icon
        name="notifications-off-outline"
        size={48}
        color={theme.colors.border}
      />
      <Title style={notificationStyles.emptyTitle}>Sin notificaciones</Title>
      <Body muted style={notificationStyles.emptyText}>
        {text}
      </Body>
    </View>
  );
}

export const notificationStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
    shadowOpacity: 0,
    elevation: 0,
  },
  unreadCard: { backgroundColor: "#F0F7FF", borderColor: "#BFDBFE" },
  iconContainer: { flexShrink: 0 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  title: {
    flex: 1,
    minWidth: 90,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#374151",
  },
  unreadTitle: { color: "#111827", fontWeight: "700" },
  unreadIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  unreadLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  body: { fontSize: 13, lineHeight: 18, color: theme.colors.muted },
  time: { fontSize: 11, lineHeight: 16, color: theme.colors.muted },
  action: {
    alignSelf: "flex-start",
    borderRadius: 8,
    minHeight: 48,
    paddingVertical: 8,
    paddingHorizontal: 0,
    flexDirection: "row-reverse",
  },
  actionText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
  separator: { height: 8 },
  list: { paddingBottom: 32 },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: theme.colors.muted,
    textAlign: "center",
  },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: "center" },
});
