import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MOCK_ORDERS } from '../../data/mockData';
import { BRAND_COLORS } from '../../theme/brand';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function DriverOrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0];
  const [status, setStatus] = useState(order.status);
  const garments = Array.isArray((order as any).garments) && (order as any).garments.length > 0
    ? ((order as any).garments as string[])
    : [`Servicio: ${order.serviceType.replace('_', ' ')}`, `${order.pounds} lbs estimadas`];

  const pickupDate = new Date(order.pickupTime);
  const deliveryDate = new Date(order.deliveryTime);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalle del pedido</Text>
        <View style={{ width: 60 }} />
      </View>

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
          Entrega: {deliveryDate.toLocaleDateString('es')} {deliveryDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
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
          <TouchableOpacity style={styles.statusBtn} onPress={() => setStatus('picked_up')}>
            <Text style={styles.statusBtnText}>Marcar recogido</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statusBtn} onPress={() => setStatus('in_process')}>
            <Text style={styles.statusBtnText}>Entregado en matriz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statusBtn} onPress={() => setStatus('delivering')}>
            <Text style={styles.statusBtnText}>Salir a entregar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statusBtn} onPress={() => setStatus('delivered')}>
            <Text style={styles.statusBtnText}>Marcar entregado</Text>
          </TouchableOpacity>
        </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  content: { paddingBottom: 52 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 16,
  },
  back: { fontSize: 17, color: BRAND_COLORS.primary, width: 60 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
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
  statusActions: { gap: 8 },
  statusBtn: { borderWidth: 1.2, borderColor: BRAND_COLORS.border, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  statusBtnText: { color: BRAND_COLORS.primary, fontWeight: '600', fontSize: 13 },
  auditText: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
});
