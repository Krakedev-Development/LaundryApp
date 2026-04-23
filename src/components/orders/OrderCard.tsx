import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderStatus } from '../../data/mockData';
import { BRAND_COLORS } from '../../theme/brand';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pendiente',  color: '#D97706', bg: '#FEF3C7' },
  picked_up:  { label: 'Recogido',   color: BRAND_COLORS.primary, bg: BRAND_COLORS.primarySoft },
  in_process: { label: 'En proceso', color: '#7C3AED', bg: '#EDE9FE' },
  delivering: { label: 'En camino',  color: BRAND_COLORS.accentDark, bg: BRAND_COLORS.accentSoft },
  delivered:  { label: 'Entregado',  color: '#6B7280', bg: '#F3F4F6' },
};

const SERVICE_LABEL: Record<string, string> = {
  wash:       'Lavado',
  wash_fold:  'Lavado y Doblado',
  dry_clean:  'Lavado en Seco',
  iron:       'Planchado',
  shirts:     'Paquete Camisas',
};

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const status = STATUS_CONFIG[order.status];
  const pickupDate = new Date(order.pickupTime);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.orderId}>{order.id}</Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.clientName}>{order.client.name}</Text>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={13} color="#9CA3AF" />
        <Text style={styles.address} numberOfLines={1}>{order.address}</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="water-outline" size={13} color="#9CA3AF" />
        <Text style={styles.service}>{SERVICE_LABEL[order.serviceType] ?? order.serviceType}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={12} color="#9CA3AF" />
          <Text style={styles.time}>
            {pickupDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="scale-outline" size={12} color="#9CA3AF" />
          <Text style={styles.pounds}>{order.pounds} lbs · ${order.price.toFixed(2)}</Text>
        </View>
      </View>

      {/* Novedades de prendas */}
      {order.issues && order.issues.length > 0 && (
        <View style={styles.issueBox}>
          <Ionicons name="warning-outline" size={13} color="#D97706" />
          <Text style={styles.issueText}>{order.issues[0].issue}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  clientName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  address: { fontSize: 12, color: '#6B7280', flex: 1 },
  service: { fontSize: 13, color: '#374151' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, marginTop: 6,
  },
  time: { fontSize: 12, color: '#6B7280' },
  pounds: { fontSize: 12, color: '#6B7280' },
  issueBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', borderRadius: 6, padding: 6, marginTop: 8,
  },
  issueText: { fontSize: 11, color: '#D97706', flex: 1 },
});

export default OrderCard;
