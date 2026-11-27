import { useIsFocused } from "@react-navigation/native";
import { SegmentedControl } from "../../components/presentation";
import { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Page } from "../../components/Page";
import { Body, Button } from "../../components/ui";
import {
  NotificationCard,
  NotificationsEmptyState,
  notificationStyles,
} from "../../components/NotificationsPresentation";
import { useApp } from "../../store/AppProvider";
import { currentCustomer } from "../../domain/repository";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import {
  listNotifications,
  mapServerNotificationToItem,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notifications/notificationsService";

export function NotificationsScreen() {
  const navigation = useLaundryNavigation(),
    { state, execute } = useApp(),
    c = currentCustomer(state),
    focused = useIsFocused();
  const [filter, setFilter] = useState("Todas");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromServer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listNotifications({ pageSize: 50 });
      const mapped = res.data.map((row) =>
        mapServerNotificationToItem(row, c.id),
      );
      execute((r) => r.syncNotificationsFromApi(mapped));
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "No se pudieron actualizar las notificaciones.",
      );
    } finally {
      setLoading(false);
    }
  }, [c.id]);

  useEffect(() => {
    if (focused) {
      void loadFromServer();
    }
  }, [focused, loadFromServer]);

  const allNotifications = state.notifications.filter(
    (n) => n.customerId === c.id,
  );
  const unreadCount = allNotifications.filter((n) => !n.isRead).length;
  const notifications = allNotifications.filter(
    (n) => filter === "Todas" || !n.isRead,
  );

  return (
    <Page scroll={false}>
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { value: "Todas", label: `Todas (${allNotifications.length})` },
          { value: "Sin leer", label: `Sin leer (${unreadCount})` },
        ]}
      />
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          label={loading ? "Actualizando..." : "Actualizar"}
          secondary
          variant="ghost"
          icon="refresh-outline"
          disabled={loading}
          onPress={() => void loadFromServer()}
        />
        {unreadCount > 0 ? (
          <Button
            label="Marcar todas leídas"
            secondary
            variant="ghost"
            icon="checkmark-done-outline"
            onPress={() => {
              allNotifications.forEach((item) => {
                if (!item.isRead) execute((r) => r.markNotificationRead(item.id));
              });
              void markAllNotificationsRead().catch(() => {});
            }}
          />
        ) : null}
      </View>
      {error ? (
        <Body style={{ color: "#B91C1C", fontSize: 12 }}>{error}</Body>
      ) : null}
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        ItemSeparatorComponent={() => (
          <View style={notificationStyles.separator} />
        )}
        ListEmptyComponent={
          <NotificationsEmptyState
            text={
              loading
                ? "Consultando notificaciones del servidor..."
                : "No tienes notificaciones en esta vista."
            }
          />
        }
        renderItem={({ item: n }) => (
          <NotificationCard notification={n}>
            <Button
              label={
                n.category === "CHAT" && n.relatedOrderId
                  ? "Abrir chat del pedido"
                  : n.relatedOrderId
                    ? "Ver solicitud"
                    : "Marcar como leída"
              }
              secondary
              variant="ghost"
              style={notificationStyles.action}
              textStyle={notificationStyles.actionText}
              icon={
                n.category === "CHAT"
                  ? "chatbubble-outline"
                  : n.relatedOrderId
                    ? "chevron-forward"
                    : "checkmark-outline"
              }
              onPress={() => {
                execute((r) => r.markNotificationRead(n.id));
                void markNotificationRead(n.id).catch(() => {});
                if (n.category === "CHAT" && n.relatedOrderId) {
                  navigation.navigate("Chat", {
                    orderId: n.relatedOrderId,
                  });
                } else if (n.relatedOrderId) {
                  navigation.navigate("ClientOrderDetail", {
                    orderId: n.relatedOrderId,
                  });
                }
              }}
            />
          </NotificationCard>
        )}
        contentContainerStyle={notificationStyles.list}
      />
    </Page>
  );
}
