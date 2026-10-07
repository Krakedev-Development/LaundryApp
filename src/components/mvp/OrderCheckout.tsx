import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrderStore, WASH_PRICES } from '../../store/useOrderStore';
import {
  businessService,
  currentActor,
  flushBusiness,
  useBusinessStore,
} from '../../store/useBusinessStore';
import {
  MODE_LABELS,
  type CreateOrderInput,
} from '../../services/domain/BusinessService';
import type { OrderPricing } from '../../domain/models';
import { Screen, Card, Action, ui } from './ui';

export const EXTRA_PRICES: Record<string, number> = {
  'Doblado especial': 2,
  Perfumado: 1.5,
  'Empaque premium': 3,
  'Tratamiento manchas': 2.5,
  'Suavizante premium': 1,
};
export function OrderCheckout() {
  const router = useRouter(),
    draft = useOrderStore(),
    state = useBusinessStore((s) => s.state)!,
    actor = currentActor();
  const [payment, setPayment] = useState<'TARJETA' | 'BILLETERA'>('TARJETA');
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const facility = state.facilities.find((f) => f.id === draft.facilityId);
  const known = draft.pricingModel === 'FIXED';
  const address = (out: boolean) => ({
    street: out ? draft.deliveryAddress : draft.pickupAddress,
    number: '',
    neighborhood: '',
    city: facility?.city ?? '',
    coordinates: {
      lat: (out ? draft.deliveryCoords : draft.pickupCoords)?.latitude ?? NaN,
      lng: (out ? draft.deliveryCoords : draft.pickupCoords)?.longitude ?? NaN,
    },
  });
  const input: CreateOrderInput = {
    requestId: draft.requestId,
    customerId: actor.id,
    facilityId: draft.facilityId,
    inbound: draft.inboundMethod,
    outbound: draft.outboundMethod,
    inboundSlotId: draft.inboundSlotId,
    outboundSlotId: draft.outboundSlotId || undefined,
    pickupAddress: address(false),
    deliveryAddress: address(true),
    items: draft.garments.map((g) => ({
      id: 'APP-' + g.washType,
      name: `${g.type} · ${g.washType}`,
      quantity: g.quantity,
      unitPrice: WASH_PRICES[g.washType],
      category: 'PRENDAS',
      notes: g.notes,
    })),
    extras: draft.extras.map((id) => ({
      id: 'APP-EXTRA-' + id,
      name: id,
      price: EXTRA_PRICES[id] ?? 0,
    })),
    pricingModel: draft.pricingModel,
    catalogServiceId: known ? undefined : draft.catalogServiceId,
    promoCode: draft.promoCode || undefined,
  };
  let quote: OrderPricing | undefined,
    quoteError = '';
  try {
    quote = businessService.quote(input);
  } catch (e) {
    quoteError = e instanceof Error ? e.message : 'Revisa tu solicitud.';
  }
  const confirm = async () => {
    setError('');
    setBusy(true);
    try {
      const order = businessService.create(input);
      await flushBusiness();
      if (known) {
        businessService.pay(order.id, `PAY-${draft.requestId}`, payment);
        await flushBusiness();
      }
      draft.reset();
      router.replace({
        pathname: '/(client)/order-detail',
        params: { id: order.id },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo confirmar.');
    } finally {
      setBusy(false);
    }
  };
  const mode =
    `${draft.inboundMethod === 'DRIVER' ? 'HOME' : 'STORE'}_${draft.outboundMethod === 'DRIVER' ? 'HOME' : 'STORE'}` as keyof typeof MODE_LABELS;
  return (
    <Screen title="Confirmar solicitud">
      <Text style={ui.muted}>Paso 5 de 5 · Pago de demostración</Text>
      <Card>
        <Text style={ui.subtitle}>{MODE_LABELS[mode]}</Text>
        <Text style={ui.text}>{facility?.name}</Text>
        <Text style={ui.text}>
          Entrada: {draft.pickupDate} · {draft.pickupSlot}
        </Text>
        <Text style={ui.text}>
          Salida: {draft.deliveryDate || 'Al estar listo'} ·{' '}
          {draft.deliverySlot}
        </Text>
        {draft.garments.map((g, i) => (
          <Text key={i} style={ui.text}>
            {g.quantity} × {g.type} · {g.washType}
          </Text>
        ))}
      </Card>
      <Card>
        <Text style={ui.subtitle}>
          Precio {known ? 'por prenda' : 'por peso'}
        </Text>
        {known && quote ? (
          <>
            <Text style={ui.text}>Prendas: ${quote.subtotal.toFixed(2)}</Text>
            <Text style={ui.text}>Extras: ${quote.extrasTotal.toFixed(2)}</Text>
            <Text style={ui.text}>
              Descuento: −${quote.discount.toFixed(2)}
            </Text>
            <Text style={ui.text}>
              Logística configurada: ${quote.deliveryFee.toFixed(2)}
            </Text>
            {quote.taxAmount !== undefined && (
              <Text style={ui.text}>
                IVA{' '}
                {state.businessPolicy.taxIncluded ? 'incluido' : 'adicional'}: $
                {quote.taxAmount.toFixed(2)}
              </Text>
            )}
            <Text style={ui.title}>Total: ${quote.total.toFixed(2)}</Text>
          </>
        ) : !known ? (
          <>
            <Text style={ui.text}>
              Tarifa: $
              {state.catalog
                .find((c) => c.id === draft.catalogServiceId)
                ?.pricePerWeightUnit?.toFixed(2)}{' '}
              /{' '}
              {
                state.catalog.find((c) => c.id === draft.catalogServiceId)
                  ?.weightUnit
              }
            </Text>
            <Text style={ui.text}>
              Extras conocidos: ${(quote?.extrasTotal ?? 0).toFixed(2)}
            </Text>
            {state.catalog
              .find((c) => c.id === draft.catalogServiceId)
              ?.restrictions?.map((condition) => (
                <Text key={condition} style={ui.muted}>
                  {condition}
                </Text>
              ))}
            <View style={ui.warning}>
              <Text style={ui.text}>
                Importe pendiente de pesaje. Puedes ingresar tus prendas sin
                pagar todavía. Planta registrará el peso real, inspeccionará y
                te notificará el monto para pagar.
              </Text>
            </View>
          </>
        ) : null}
        {state.businessPolicy.taxRate === undefined && (
          <Text style={ui.muted}>
            Tratamiento de IVA en revisión. No se aplica una tasa definitiva.
          </Text>
        )}
        <TextInput
          accessibilityLabel="Código de promoción"
          style={ui.input}
          placeholder="Código promocional (opcional)"
          value={draft.promoCode ?? ''}
          onChangeText={(text) =>
            draft.setBusinessDraft({ promoCode: text.toUpperCase() })
          }
        />
        {!known && draft.promoCode && (
          <Text style={ui.muted}>
            Las condiciones del descuento se comprobarán al registrar el peso
            real.
          </Text>
        )}
        {known && (
          <View style={ui.row}>
            {(['TARJETA', 'BILLETERA'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[ui.outline, p === payment && ui.selected]}
                onPress={() => setPayment(p)}
              >
                <Text style={ui.text}>
                  {p === 'TARJETA' ? 'Tarjeta · Demo' : 'Billetera'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
      {(error || quoteError) && (
        <Text style={ui.error}>{error || quoteError}</Text>
      )}
      <Action
        label={
          busy
            ? 'Guardando…'
            : known
              ? 'Confirmar y pagar · Demo'
              : 'Confirmar · importe pendiente'
        }
        onPress={() => void confirm()}
        disabled={busy || !!quoteError}
      />
      <Text style={ui.muted}>
        La solicitud y sus pagos se conservan en esta instalación.
      </Text>
    </Screen>
  );
}
