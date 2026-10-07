import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  DispatchService,
  type DriverCandidate,
} from '../../services/geo/DispatchService';
import { geoProvider, geoIsDemo } from '../../services/geo';
import {
  businessService,
  refreshDemoDriverPositions,
  useBusinessStore,
  flushBusiness,
} from '../../store/useBusinessStore';
import type { Order } from '../../domain/models';
import { Action, ui } from './ui';

const dispatch = new DispatchService(geoProvider);
export function DriverCandidates({
  order,
  leg,
  run,
}: {
  order: Order;
  leg: 'inbound' | 'outbound';
  run: (work: () => unknown) => void;
}) {
  const state = useBusinessStore((s) => s.state)!;
  const [candidates, setCandidates] = useState<DriverCandidate[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false);
  const snapshot = state.drivers
    .map(
      (d) => `${d.id}:${d.status}:${d.activeOrders}:${d.location.lastUpdated}`,
    )
    .join('|');
  const address =
    leg === 'inbound' ? order.customerAddress : order.deliveryAddress;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    dispatch
      .candidates(
        state.drivers.map((d) => ({
          id: d.id,
          status: d.status,
          coordinates: d.location,
          updatedAt: d.location.lastUpdated,
          facilityId: d.facilityId,
          zoneId: d.zoneId,
          authorizedZoneIds: d.authorizedZoneIds,
          activeOrders: d.activeOrders,
          maxOrders: state.businessPolicy.driverLimit ?? d.maxOrders,
          rating: d.rating,
        })),
        {
          id: order.id,
          coordinates: address.coordinates,
          facilityId: order.facilityId,
          zoneId: order.zoneId,
        },
        controller.signal,
        state.businessPolicy.enforceDriverLimit,
      )
      .then((result) => {
        if (!controller.signal.aborted) setCandidates(result);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [
    snapshot,
    order.id,
    leg,
    address.coordinates.lat,
    address.coordinates.lng,
    state.businessPolicy.enforceDriverLimit,
    state.businessPolicy.driverLimit,
  ]);
  return (
    <View style={{ gap: 10 }}>
      <Text style={ui.subtitle}>
        Asignar {leg === 'inbound' ? 'recogida' : 'entrega'}
      </Text>
      <Text style={ui.muted}>
        {geoIsDemo ? 'ETA de demostración' : 'ETA por calles con Mapbox Matrix'}{' '}
        · Laundry pondera cercanía, zona, carga y desempeño. La asignación la
        confirma el operador.
      </Text>
      {loading && <Text style={ui.muted}>Calculando candidatos…</Text>}
      {error && <Text style={ui.error}>{error}</Text>}
      {!loading && !candidates.length && (
        <Text style={ui.muted}>
          Sin candidatos elegibles. Revisa sede, zona y vigencia de sus
          posiciones.
        </Text>
      )}
      {candidates.map((candidate, index) => {
        const driver = state.drivers.find((d) => d.id === candidate.driverId)!;
        return (
          <View key={driver.id} style={ui.outline}>
            <Text style={ui.subtitle}>
              {driver.name}
              {index === 0 ? ' · Recomendado' : ''}
            </Text>
            <Text style={ui.text}>
              {Math.ceil(candidate.etaSeconds! / 60)} min ·{' '}
              {(candidate.distanceMeters! / 1000).toFixed(1)} km · Carga{' '}
              {driver.activeOrders}
            </Text>
            <Text style={ui.muted}>{candidate.reasons.join(' · ')}</Text>
            <Action
              label="Confirmar este chofer"
              onPress={() =>
                run(() => businessService.assign(order.id, driver.id, leg))
              }
            />
          </View>
        );
      })}
      <Action
        label="Actualizar posiciones de demostración"
        onPress={() => run(() => refreshDemoDriverPositions(order.facilityId))}
      />
    </View>
  );
}
