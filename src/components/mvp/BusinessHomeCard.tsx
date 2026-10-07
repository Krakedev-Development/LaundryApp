import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useBusinessStore, currentActor } from '../../store/useBusinessStore';
import { nextAction } from '../../services/domain/BusinessService';
import { Card, Action, ui } from './ui';
export function BusinessHomeCard() {
  const state = useBusinessStore((s) => s.state),
    router = useRouter();
  if (!state) return null;
  const actor = currentActor();
  const own = state.orders.filter(
    (o) =>
      o.customerId === actor.id &&
      !['COMPLETED', 'CANCELLED'].includes(o.status),
  );
  const important =
    own.find((o) =>
      state.adjustments.some(
        (a) => a.orderId === o.id && a.status === 'PENDING',
      ),
    ) ??
    own.find(
      (o) =>
        o.pricing.amountKnown !== false && o.pricing.paymentStatus !== 'PAID',
    ) ??
    own.find((o) => o.status === 'READY') ??
    own[0];
  return (
    <Card>
      <Text style={ui.subtitle}>Tu próxima acción</Text>
      {important ? (
        <>
          <Text style={ui.text}>
            {important.id} · {nextAction(important, state)}
          </Text>
          <Action
            label="Continuar mi solicitud"
            onPress={() =>
              router.push({
                pathname: '/(client)/order-detail',
                params: { id: important.id },
              })
            }
          />
        </>
      ) : (
        <Text style={ui.text}>No tienes solicitudes activas.</Text>
      )}
      <Action
        label="Promociones y recompensas"
        icon="gift-outline"
        onPress={() => router.push('/(client)/rewards')}
      />
      <Text style={ui.muted}>
        MVP local · Los pedidos no se sincronizan con web ni con otros
        dispositivos.
      </Text>
    </Card>
  );
}
