import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBusinessStore, currentActor } from '../../store/useBusinessStore';
import { useAuthStore } from '../../store/useAuthStore';
import { MODE_LABELS, nextAction } from '../../services/domain/BusinessService';
import { Screen, Card, Action, ui } from './ui';
export function BusinessOrderList({
  role = 'client',
  history = false,
}: {
  role?: 'client' | 'driver' | 'operations';
  history?: boolean;
}) {
  const router = useRouter(),
    state = useBusinessStore((s) => s.state),
    user = useAuthStore((s) => s.user);
  if (!state || !user) return null;
  const actor = currentActor();
  const orders = state.orders
    .filter((o) =>
      role === 'client'
        ? o.customerId === actor.id
        : role === 'operations'
          ? actor.role === 'ADMIN' || o.facilityId === actor.facilityId
          : [
              o.fulfillment?.inbound.driverId,
              o.fulfillment?.outbound.driverId,
            ].includes(actor.id),
    )
    .filter((o) =>
      history ? ['COMPLETED', 'CANCELLED'].includes(o.status) : true,
    );
  const open = (id: string) =>
    router.push({
      pathname:
        role === 'client'
          ? '/(client)/order-detail'
          : role === 'driver'
            ? '/(driver)/order'
            : '/(admin)/business-order',
      params: { id },
    });
  return (
    <Screen
      title={
        role === 'client'
          ? 'Mis solicitudes'
          : role === 'driver'
            ? 'Mi ruta y solicitudes'
            : 'Operación local'
      }
      back={false}
    >
      <Text style={ui.muted}>
        MVP local · Los cambios de esta instalación no se sincronizan con
        LaundryWeb.
      </Text>
      {role === 'client' && (
        <Action
          label="Nueva solicitud"
          icon="add-circle-outline"
          onPress={() => router.push('/(client)/new-order/step1-garments')}
        />
      )}
      {role === 'driver' && (
        <Action
          label="Ver ruta en el mapa"
          icon="map-outline"
          onPress={() => router.push('/(driver)/map')}
        />
      )}
      {orders.length === 0 && (
        <Card>
          <Ionicons name="file-tray-outline" size={28} color="#6A82A0" />
          <Text style={ui.text}>No hay solicitudes para esta cuenta.</Text>
        </Card>
      )}
      {orders.map((o) => (
        <TouchableOpacity
          key={o.id}
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${o.id}`}
          onPress={() => open(o.id)}
        >
          <Card>
            <View style={ui.row}>
              <Ionicons
                name={
                  o.fulfillment?.inbound.method === 'CUSTOMER'
                    ? 'business-outline'
                    : 'car-outline'
                }
                size={22}
                color="#0F4C81"
              />
              <Text style={ui.subtitle}>{o.id}</Text>
            </View>
            <Text style={ui.badge}>
              {MODE_LABELS[o.fulfillment?.mode ?? 'HOME_HOME']}
            </Text>
            <Text style={ui.text}>
              {o.customerName} · {o.facilityName}
            </Text>
            <Text style={ui.text}>
              {o.pricing.amountKnown === false
                ? 'Importe pendiente de pesaje'
                : `$${o.pricing.total.toFixed(2)}`}{' '}
              · {o.status}
            </Text>
            <View style={ui.warning}>
              <Text style={ui.text}>{nextAction(o, state)}</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </Screen>
  );
}
