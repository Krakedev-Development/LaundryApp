import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MOCK_ORDERS, OrderStatus } from '../../data/mockData';
import { BRAND_COLORS } from '../../theme/brand';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStatusStore } from '../../store/useOrderStatusStore';
import AppHeader from '../../components/layout/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'picked_up',
  picked_up: 'in_process',
  in_process: 'delivering',
  delivering: 'delivered',
};

export default function DriverOrderDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0];
  const status = useOrderStatusStore((s) => s.overrides[order.id] ?? order.status);
  const setStatus = useOrderStatusStore((s) => s.setStatus);
  const nextAllowedStatus = NEXT_STATUS[status];
  const garments = Array.isArray((order as any).garments) && (order as any).garments.length > 0
    ? ((order as any).garments as string[])
    : [`Servicio: ${order.serviceType.replace('_', ' ')}`, `${order.garmentCount} prendas estimadas`];

  const pickupDate = new Date(order.pickupTime);
  const hasDeliveryDate = Boolean(order.deliveryTime);
  const deliveryDate = hasDeliveryDate ? new Date(order.deliveryTime) : null;

  return (
    <View style={styles.container}>
      <AppHeader title="Detalle del pedido" subtitle={order.id} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
      {/* ID y estado */}
      <View style={styles.card}>
        <Text style={styles.orderId}>{order.id}</Text>
        <Text style={styles.status}>Estado: {status.replace('_', ' ').toUpperCase()}</Text>
      </View>

      {/* Cliente */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Ionicons name="person-outline" size={16} color={BRAND_COLORS.primary} />
          <Text style={styles.cardTitle}>Cliente</Text>
        </View>
        <Text style={styles.cardValue}>{order.client.name}</Text>
        <Text style={styles.cardSub}>Dirección: {order.address}</Text>
        <Text style={styles.cardSub}>Teléfono: {order.client.phone}</Text>
      </View>

      {/* Horarios */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Ionicons name="time-outline" size={16} color={BRAND_COLORS.primary} />
          <Text style={styles.cardTitle}>Horarios</Text>
        </View>
        <Text style={styles.cardSub}>
          Recogida: {pickupDate.toLocaleDateString('es')} {pickupDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.cardSub}>
          Entrega: {deliveryDate
            ? `${deliveryDate.toLocaleDateString('es')} ${deliveryDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
            : 'Fecha de entrega aun no asignada'}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Ionicons name="car-outline" size={16} color={BRAND_COLORS.primary} />
          <Text style={styles.cardTitle}>Datos visibles al cliente</Text>
        </View>
        <Text style={styles.cardSub}>Chofer: {order.driver.name}</Text>
        <Text style={styles.cardSub}>Vehículo: {order.driver.vehicle}</Text>
        <Text style={styles.cardSub}>Placa: {order.driver.plate}</Text>
        <Text style={styles.auditText}>Privacidad activa: no se comparte teléfono personal.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estado operativo</Text>
        <View style={styles.statusActions}>
          <TouchableOpacity
            style={[styles.statusBtn, styles.statusBtnGrid, nextAllowedStatus !== 'picked_up' && styles.statusBtnDisabled]}
            onPress={() => setStatus(order.id, 'picked_up' as OrderStatus)}
            disabled={nextAllowedStatus !== 'picked_up'}
          >
            <Text style={styles.statusBtnText}>Marcar recogido</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusBtn, styles.statusBtnGrid, nextAllowedStatus !== 'in_process' && styles.statusBtnDisabled]}
            onPress={() => setStatus(order.id, 'in_process' as OrderStatus)}
            disabled={nextAllowedStatus !== 'in_process'}
          >
            <Text style={styles.statusBtnText}>Entregado en matriz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusBtn, styles.statusBtnGrid, nextAllowedStatus !== 'delivering' && styles.statusBtnDisabled]}
            onPress={() => setStatus(order.id, 'delivering' as OrderStatus)}
            disabled={nextAllowedStatus !== 'delivering'}
          >
            <Text style={styles.statusBtnText}>Salir a entregar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusBtn, styles.statusBtnGrid, nextAllowedStatus !== 'delivered' && styles.statusBtnDisabled]}
            onPress={() => setStatus(order.id, 'delivered' as OrderStatus)}
            disabled={nextAllowedStatus !== 'delivered'}
          >
            <Text style={styles.statusBtnText}>Marcar entregado</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.statusHint}>
          {nextAllowedStatus
            ? `Siguiente paso: ${nextAllowedStatus.replace('_', ' ')}`
            : 'Pedido completado. No hay más cambios de estado.'}
        </Text>
      </View>

      {/* Prendas */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Ionicons name="shirt-outline" size={16} color={BRAND_COLORS.primary} />
          <Text style={styles.cardTitle}>Prendas</Text>
        </View>
        {garments.map((g, i) => (
          <Text key={i} style={styles.cardSub}>• {g}</Text>
        ))}
      </View>

      {/* Acciones */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.push({ pathname: '/(driver)/map', params: { id: order.id } })}
      >
        <View style={styles.btnContent}>
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Ver ruta en mapa</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => router.push({ pathname: '/(driver)/chat', params: { id: order.id } })}
      >
        <View style={styles.btnContent}>
          <Ionicons name="chatbubble-outline" size={18} color={BRAND_COLORS.primary} />
          <Text style={styles.secondaryBtnText}>Chatear con cliente</Text>
        </View>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  content: { paddingTop: 16, paddingBottom: 52 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 36, height: 36 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginHorizontal: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  orderId: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  status: { fontSize: 13, color: '#6B7280' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 8 },
  cardValue: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#6B7280', marginBottom: 2 },
  primaryBtn: {
    backgroundColor: BRAND_COLORS.primary, borderRadius: 12,
    padding: 16, alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: BRAND_COLORS.primary,
    padding: 16, alignItems: 'center', marginHorizontal: 16, marginBottom: 16,
  },
  secondaryBtnText: { color: BRAND_COLORS.primary, fontWeight: '700', fontSize: 16 },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { borderWidth: 1.2, borderColor: BRAND_COLORS.border, borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  statusBtnGrid: { width: '48%', minHeight: 68, paddingHorizontal: 8 },
  statusBtnDisabled: { opacity: 0.45 },
  statusBtnText: { color: BRAND_COLORS.primary, fontWeight: '600', fontSize: 13, textAlign: 'center' },
  statusHint: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  auditText: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
});
