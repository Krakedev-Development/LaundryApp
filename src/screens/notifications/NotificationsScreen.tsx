import { SegmentedControl } from "../../components/presentation";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { Page } from "../../components/Page";
import { Button } from "../../components/ui";
import {
  NotificationCard,
  NotificationsEmptyState,
  notificationStyles,
} from "../../components/NotificationsPresentation";
import { useApp } from "../../store/AppProvider";
import { currentCustomer } from "../../domain/repository";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";

export function NotificationsScreen() {
  const navigation = useLaundryNavigation(),
    { state, execute } = useApp(),
    c = currentCustomer(state);
  const [filter, setFilter] = useState("Todas");
  const notifications = state.notifications.filter(
    (n) => n.customerId === c.id && (filter === "Todas" || !n.isRead),
  );
  return (
    <Page scroll={false}>
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { value: "Todas", label: "Todas" },
          { value: "Sin leer", label: "Sin leer" },
        ]}
      />
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        ItemSeparatorComponent={() => (
          <View style={notificationStyles.separator} />
        )}
        ListEmptyComponent={
          <NotificationsEmptyState text="No tienes notificaciones en esta vista." />
        }
        renderItem={({ item: n }) => (
          <NotificationCard notification={n}>
            <Button
              label={
                n.relatedOrderId
                  ? "Ver solicitud " + n.relatedOrderId
                  : "Marcar como leída"
              }
              secondary
              variant="ghost"
              style={notificationStyles.action}
              textStyle={notificationStyles.actionText}
              icon={n.relatedOrderId ? "chevron-forward" : "checkmark-outline"}
              onPress={() => {
                execute((r) => r.markNotificationRead(n.id));
                if (n.relatedOrderId)
                  navigation.navigate("ClientOrderDetail", {
                    orderId: n.relatedOrderId,
                  });
              }}
            />
          </NotificationCard>
        )}
        contentContainerStyle={notificationStyles.list}
      />
    </Page>
  );
}
