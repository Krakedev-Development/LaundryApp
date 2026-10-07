import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { currentActor, useBusinessStore } from '../../store/useBusinessStore';
import { Screen, Card, Action, ui } from './ui';
export function OrderChat() {
  const { id } = useLocalSearchParams<{ id?: string }>(),
    router = useRouter(),
    actor = currentActor(),
    state = useBusinessStore((s) => s.state)!;
  const orders = state.orders.filter(
    (o) =>
      (!id || o.id === id) &&
      (actor.role === 'CLIENT'
        ? o.customerId === actor.id
        : actor.role === 'DRIVER'
          ? [
              o.fulfillment?.inbound.driverId,
              o.fulfillment?.outbound.driverId,
            ].includes(actor.id)
          : false),
  );
  return (
    <Screen title="Chat de solicitudes">
      <Text style={ui.muted}>
        Elige una solicitud para conversar con operaciones o con su chofer
        asignado. Los mensajes se guardan localmente.
      </Text>
      {orders.map((order) => (
        <Card key={order.id}>
          <Text style={ui.subtitle}>{order.id}</Text>
          <Text style={ui.text}>
            {order.customerName} · {order.status}
          </Text>
          <Action
            label="Abrir chat y seguimiento"
            onPress={() =>
              router.push({
                pathname:
                  actor.role === 'CLIENT'
                    ? '/(client)/order-detail'
                    : '/(driver)/order',
                params: { id: order.id },
              })
            }
          />
        </Card>
      ))}
      {!orders.length && (
        <Text style={ui.text}>
          No tienes solicitudes disponibles para conversar.
        </Text>
      )}
    </Screen>
  );
}
