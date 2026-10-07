import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import {
  businessService,
  flushBusiness,
  useBusinessStore,
  currentActor,
} from '../../store/useBusinessStore';
import { Card, Action, ui } from './ui';
import type { Order } from '../../domain/models';
export function CustomerActions({
  order,
  run,
}: {
  order: Order;
  run: (fn: () => unknown) => void;
}) {
  const state = useBusinessStore((s) => s.state)!;
  const [leg, setLeg] = useState<'inbound' | 'outbound'>('outbound'),
    [method, setMethod] = useState<'DRIVER' | 'CUSTOMER'>(
      order.fulfillment!.outbound.method,
    ),
    [slotId, setSlotId] = useState(''),
    [reason, setReason] = useState(''),
    [address, setAddress] = useState(order.deliveryAddress.street),
    [latitude, setLatitude] = useState(
      String(order.deliveryAddress.coordinates.lat),
    ),
    [longitude, setLongitude] = useState(
      String(order.deliveryAddress.coordinates.lng),
    );
  const context =
    leg === 'inbound'
      ? method === 'DRIVER'
        ? 'DRIVER_PICKUP'
        : 'FACILITY_DROPOFF'
      : method === 'DRIVER'
        ? 'DRIVER_DELIVERY'
        : 'FACILITY_PICKUP';
  const slots = businessService.availableSlots(order.facilityId, context);
  return (
    <>
      {state.adjustments
        .filter((a) => a.orderId === order.id)
        .map((a) => (
          <Card key={a.id}>
            <Text style={ui.subtitle}>Ajuste ${a.amount.toFixed(2)}</Text>
            <Text style={ui.text}>{a.customerMessage}</Text>
            <Text style={ui.badge}>{a.status}</Text>
            {a.status === 'PENDING' && (
              <>
                <Action
                  label="Aceptar ajuste"
                  onPress={() =>
                    run(() => businessService.decideAdjustment(a.id, true))
                  }
                />
                <Action
                  label="Rechazar y solicitar revisión"
                  onPress={() =>
                    run(() => businessService.decideAdjustment(a.id, false))
                  }
                />
              </>
            )}
          </Card>
        ))}
      {order.pricing.amountKnown !== false &&
        order.pricing.paymentStatus !== 'PAID' &&
        !['COMPLETED', 'CANCELLED'].includes(order.status) && (
          <Card>
            <Text style={ui.subtitle}>Pago pendiente</Text>
            <Text style={ui.text}>
              ${(order.pricing.amountDue ?? order.pricing.total).toFixed(2)}
            </Text>
            <Action
              label="Pagar con tarjeta · Demo"
              icon="card-outline"
              onPress={() =>
                run(() =>
                  businessService.pay(
                    order.id,
                    `PAY-${order.id}-${order.pricing.total}-CARD`,
                    'TARJETA',
                  ),
                )
              }
            />
            <Action
              label="Pagar con billetera"
              icon="wallet-outline"
              onPress={() =>
                run(() =>
                  businessService.pay(
                    order.id,
                    `PAY-${order.id}-${order.pricing.total}-WALLET`,
                    'BILLETERA',
                  ),
                )
              }
            />
          </Card>
        )}
      {state.charges
        .filter((c) => c.orderId === order.id)
        .map((c) => (
          <Card key={c.id}>
            <Text style={ui.subtitle}>Cargo ${c.amount.toFixed(2)}</Text>
            <Text style={ui.text}>
              {c.reason} · {c.status}
            </Text>
            {c.status === 'PENDING' && (
              <Action
                label="Pagar cargo · Demo"
                onPress={() => run(() => businessService.settleCharge(c.id))}
              />
            )}
          </Card>
        ))}
      {!['COMPLETED', 'CANCELLED'].includes(order.status) && (
        <Card>
          <Text style={ui.subtitle}>Cambiar modalidad o agenda</Text>
          <Text style={ui.muted}>
            Disponible si el tramo aún no inició. La cobertura, el horario y los
            cupos se revisan al confirmar.
          </Text>
          <View style={ui.row}>
            {(['inbound', 'outbound'] as const).map((v) => (
              <TouchableOpacity
                key={v}
                style={[ui.outline, leg === v && ui.selected]}
                onPress={() => {
                  setLeg(v);
                  setSlotId('');
                  const a =
                    v === 'inbound'
                      ? order.customerAddress
                      : order.deliveryAddress;
                  setAddress(a.street);
                  setLatitude(String(a.coordinates.lat));
                  setLongitude(String(a.coordinates.lng));
                }}
              >
                <Text style={ui.text}>
                  {v === 'inbound' ? 'Entrada' : 'Salida'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={ui.row}>
            {(['DRIVER', 'CUSTOMER'] as const).map((v) => (
              <TouchableOpacity
                key={v}
                style={[ui.outline, method === v && ui.selected]}
                onPress={() => {
                  setMethod(v);
                  setSlotId('');
                }}
              >
                <Text style={ui.text}>
                  {v === 'DRIVER' ? 'Domicilio' : 'Sede'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {method === 'DRIVER' && (
            <>
              <TextInput
                accessibilityLabel="Dirección nueva"
                style={ui.input}
                value={address}
                onChangeText={setAddress}
              />
              <View style={ui.row}>
                <TextInput
                  accessibilityLabel="Latitud nueva"
                  style={[ui.input, { flex: 1 }]}
                  value={latitude}
                  onChangeText={setLatitude}
                />
                <TextInput
                  accessibilityLabel="Longitud nueva"
                  style={[ui.input, { flex: 1 }]}
                  value={longitude}
                  onChangeText={setLongitude}
                />
              </View>
            </>
          )}
          <View style={{ gap: 8 }}>
            {slots.slice(0, 12).map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[ui.outline, slotId === slot.id && ui.selected]}
                onPress={() => setSlotId(slot.id)}
              >
                <Text style={ui.text}>
                  {slot.date} · {slot.start}–{slot.end}
                </Text>
                <Text style={ui.muted}>
                  {slot.capacity - slot.reservedCount} cupos
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            accessibilityLabel="Motivo del cambio"
            style={ui.input}
            placeholder="Motivo del cambio o cancelación"
            value={reason}
            onChangeText={setReason}
          />
          <Action
            label="Confirmar cambio"
            disabled={!slotId || !reason.trim()}
            onPress={() =>
              run(() => {
                const old =
                  leg === 'inbound'
                    ? order.customerAddress
                    : order.deliveryAddress;
                const facility = state.facilities.find(
                  (f) => f.id === order.facilityId,
                )!;
                businessService.change(
                  order.id,
                  leg,
                  slotId,
                  method,
                  method === 'CUSTOMER'
                    ? {
                        ...old,
                        street: facility.address,
                        coordinates: facility.coordinates,
                      }
                    : {
                        ...old,
                        street: address,
                        coordinates: {
                          lat: Number(latitude),
                          lng: Number(longitude),
                        },
                      },
                  reason,
                );
              })
            }
          />
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Cancelar solicitud',
                'Se liberarán las reservas y se revocarán los códigos no usados. Los reembolsos pendientes se revisarán con operaciones.',
                [
                  { text: 'Volver', style: 'cancel' },
                  {
                    text: 'Cancelar solicitud',
                    style: 'destructive',
                    onPress: () =>
                      run(() => businessService.cancel(order.id, reason)),
                  },
                ],
              )
            }
          >
            <Text
              style={{
                color: '#B42335',
                fontWeight: '600',
                textAlign: 'center',
                padding: 10,
              }}
            >
              Cancelar solicitud
            </Text>
          </TouchableOpacity>
        </Card>
      )}
    </>
  );
}
