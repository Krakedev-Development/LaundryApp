import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapViewCustom, { DriverMarker, StopMarker } from '../../components/map/MapViewCustom';
import { MOCK_ORDERS, MOCK_DRIVER } from '../../data/mockData';
import { BRAND_COLORS } from '../../theme/brand';

type AdminOrderStatus = 'new' | 'assigned' | 'picked_up' | 'delivering' | 'delivered';

interface DispatchOrder {
  id: string;
  clientName: string;
  address: string;
  slot: string;
  service: string;
  status: AdminOrderStatus;
  assignedDriverId: string | null;
  coordinates: { latitude: number; longitude: number };
}

const DRIVER_POOL = [
  { id: MOCK_DRIVER.id, name: MOCK_DRIVER.name, plate: MOCK_DRIVER.plate, coordinates: MOCK_DRIVER.coordinates },
  { id: 'd2', name: 'Luis Ramirez', plate: 'PDT-8841', coordinates: { latitude: -0.2261, longitude: -78.5179 } },
  { id: 'd3', name: 'Ana Mena', plate: 'PCQ-4192', coordinates: { latitude: -0.2354, longitude: -78.5311 } },
];

const INITIAL_ORDERS: DispatchOrder[] = MOCK_ORDERS.map((order, idx) => ({
  id: order.id,
  clientName: order.client.name,
  address: order.address,
  slot: idx % 2 === 0 ? '09:00 - 09:30' : '10:00 - 10:30',
  service: order.serviceType.replace('_', ' '),
  status: idx === 0 ? 'assigned' : 'new',
  assignedDriverId: idx === 0 ? MOCK_DRIVER.id : null,
  coordinates: order.client.coordinates,
}));

const STATUS_LABEL: Record<AdminOrderStatus, string> = {
  new: 'Nueva',
  assigned: 'Asignada',
  picked_up: 'Recogida',
  delivering: 'En entrega',
  delivered: 'Entregada',
};

const STATUS_COLOR: Record<AdminOrderStatus, string> = {
  new: '#F59E0B',
  assigned: BRAND_COLORS.primary,
  picked_up: '#8B5CF6',
  delivering: '#06B6D4',
  delivered: BRAND_COLORS.accentDark,
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<DispatchOrder[]>(INITIAL_ORDERS);

  const counts = useMemo(() => {
    return {
      incoming: orders.filter((o) => o.status === 'new').length,
      inRoute: orders.filter((o) => ['assigned', 'picked_up', 'delivering'].includes(o.status)).length,
      closed: orders.filter((o) => o.status === 'delivered').length,
    };
  }, [orders]);

  const mapDrivers: DriverMarker[] = DRIVER_POOL.map((driver) => ({
    id: driver.id,
    latitude: driver.coordinates.latitude,
    longitude: driver.coordinates.longitude,
    label: driver.name.split(' ')[0],
  }));

  const mapStops: StopMarker[] = orders.map((order, i) => ({
    id: order.id,
    label: String(i + 1),
    latitude: order.coordinates.latitude,
    longitude: order.coordinates.longitude,
    completed: order.status === 'delivered',
    hasIncident: order.status === 'new',
  }));

  const assignNearestDriver = (orderId: string) => {
    const current = orders.find((o) => o.id === orderId);
    if (!current) return;

    const nearest = DRIVER_POOL.reduce((best, next) => {
      const dBest =
        Math.abs(best.coordinates.latitude - current.coordinates.latitude) +
        Math.abs(best.coordinates.longitude - current.coordinates.longitude);
      const dNext =
        Math.abs(next.coordinates.latitude - current.coordinates.latitude) +
        Math.abs(next.coordinates.longitude - current.coordinates.longitude);
      return dNext < dBest ? next : best;
    }, DRIVER_POOL[0]);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, assignedDriverId: nearest.id, status: o.status === 'new' ? 'assigned' : o.status }
          : o
      )
    );
  };

  const advanceStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status === 'new') return { ...o, status: 'assigned' };
        if (o.status === 'assigned') return { ...o, status: 'picked_up' };
        if (o.status === 'picked_up') return { ...o, status: 'delivering' };
        if (o.status === 'delivering') return { ...o, status: 'delivered' };
        return o;
      })
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Centro de Operaciones</Text>
        <Text style={styles.subtitle}>Supervisor · Auditoria y asignacion manual</Text>
      </View>

      <View style={styles.kpiRow}>
        <KpiCard label="Nuevas" value={counts.incoming} color="#F59E0B" />
        <KpiCard label="En ruta" value={counts.inRoute} color={BRAND_COLORS.primary} />
        <KpiCard label="Cerradas" value={counts.closed} color={BRAND_COLORS.accentDark} />
      </View>

      <View style={styles.mapCard}>
        <Text style={styles.sectionTitle}>Mapa global de choferes</Text>
        <MapViewCustom center={{ latitude: -0.2295, longitude: -78.5243 }} drivers={mapDrivers} stops={mapStops} style={styles.map} />
      </View>

      <Text style={styles.sectionTitle}>Solicitudes y asignaciones</Text>
      {orders.map((order) => {
        const assigned = DRIVER_POOL.find((d) => d.id === order.assignedDriverId);
        return (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderTopRow}>
              <Text style={styles.orderId}>{order.id}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLOR[order.status] + '22' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLOR[order.status] }]}>{STATUS_LABEL[order.status]}</Text>
              </View>
            </View>
            <Text style={styles.orderMeta}>{order.clientName} · {order.slot}</Text>
            <Text style={styles.orderMeta}>Servicio: {order.service}</Text>
            <Text style={styles.orderAddress}>{order.address}</Text>
            <Text style={styles.auditNote}>Auditoria: solo gestion operativa, sin cambios de precio o historial.</Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => assignNearestDriver(order.id)}>
                <Ionicons name="locate-outline" size={16} color={BRAND_COLORS.primary} />
                <Text style={styles.secondaryBtnText}>Asignar cercano</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => advanceStatus(order.id)}>
                <Ionicons name="sync-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Actualizar estado</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.driverText}>
              {assigned ? `Chofer: ${assigned.name} · ${assigned.plate}` : 'Chofer: sin asignar'}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  content: { padding: 16, paddingBottom: 30 },
  header: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  kpiValue: { fontSize: 24, fontWeight: '700' },
  kpiLabel: { fontSize: 12, color: '#6B7280' },
  mapCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  map: { height: 220, borderRadius: 12, overflow: 'hidden' },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: { borderRadius: 16, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  orderMeta: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  orderAddress: { fontSize: 13, color: '#374151', marginBottom: 4 },
  auditNote: { fontSize: 11, color: '#9CA3AF', marginBottom: 8 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  secondaryBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1.2, borderColor: BRAND_COLORS.border, borderRadius: 8, padding: 10 },
  secondaryBtnText: { color: BRAND_COLORS.primary, fontWeight: '600', fontSize: 12 },
  primaryBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_COLORS.primary, borderRadius: 8, padding: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  driverText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
});
