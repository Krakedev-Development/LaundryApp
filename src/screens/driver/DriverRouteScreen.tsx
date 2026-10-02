import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLaundry } from '../../store/LaundryStore';
import { Colors } from '../../theme/colors';
import { OperationalStatus, Order } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';

export const DriverRouteScreen = ({ navigation }: any) => {
  const {
    driver,
    orders,
    setDriverOperationalStatus,
    driverStartPickupNavigation,
  } = useLaundry();

  const statuses: OperationalStatus[] = ['AVAILABLE', 'ON_SERVICE', 'BREAK', 'OFFLINE'];

  const pendingPickups = orders.filter(
    (o) => o.status === 'PICKUP_ASSIGNED' || o.status === 'HEADING_TO_PICKUP'
  );
  const pendingDeliveries = orders.filter(
    (o) => o.status === 'DELIVERY_ASSIGNED' || o.status === 'OUT_FOR_DELIVERY'
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Driver Header */}
      <View style={styles.headerCard}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.vehicleText}>
            {driver.vehicleModel} • {driver.vehiclePlate}
          </Text>
          <Text style={styles.zoneText}>📍 {driver.zoneName}</Text>
        </View>

        <View style={styles.deliveriesBadge}>
          <Text style={styles.badgeNum}>{driver.completedDeliveriesCount}</Text>
          <Text style={styles.badgeLabel}>Completados</Text>
        </View>
      </View>

      {/* Operational Status Selector */}
      <Text style={styles.sectionTitle}>Estado de Operación</Text>
      <View style={styles.statusChipsRow}>
        {statuses.map((st) => {
          const isActive = driver.operationalStatus === st;
          let label = 'Disponible';
          if (st === 'ON_SERVICE') label = 'En servicio';
          if (st === 'BREAK') label = 'En pausa';
          if (st === 'OFFLINE') label = 'Desconectado';

          return (
            <TouchableOpacity
              key={st}
              style={[styles.statusChip, isActive && styles.statusChipActive]}
              onPress={() => setDriverOperationalStatus(st)}
            >
              <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active Stops: Recogidas */}
      <Text style={styles.sectionTitle}>Recogidas Pendientes ({pendingPickups.length})</Text>
      {pendingPickups.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No tienes recogidas asignadas actualmente.</Text>
        </View>
      ) : (
        pendingPickups.map((order) => (
          <View key={order.id} style={styles.stopCard}>
            <View style={styles.stopHeader}>
              <Text style={styles.orderId}>{order.id}</Text>
              <StatusBadge status={order.status} />
            </View>

            <Text style={styles.customerName}>Cliente: {order.customerName}</Text>
            <Text style={styles.stopAddress}>📍 {order.pickup.addressFull}</Text>
            <Text style={styles.stopTime}>⏰ {order.pickup.date} • {order.pickup.timeSlot}</Text>

            <View style={styles.actionButtonsRow}>
              {order.status === 'PICKUP_ASSIGNED' && (
                <TouchableOpacity
                  style={[styles.btn, styles.startBtn]}
                  onPress={() => driverStartPickupNavigation(order.id)}
                >
                  <Ionicons name="navigate" size={16} color="#FFF" />
                  <Text style={styles.btnTextWhite}>Iniciar Ruta</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.btn, styles.confirmBtn]}
                onPress={() => navigation.navigate('DriverConfirm', { orderId: order.id, type: 'PICKUP' })}
              >
                <Ionicons name="checkbox-outline" size={16} color="#FFF" />
                <Text style={styles.btnTextWhite}>Confirmar Recogida</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Active Stops: Entregas */}
      <Text style={styles.sectionTitle}>Entregas Pendientes ({pendingDeliveries.length})</Text>
      {pendingDeliveries.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No tienes entregas pendientes en este momento.</Text>
        </View>
      ) : (
        pendingDeliveries.map((order) => (
          <View key={order.id} style={styles.stopCard}>
            <View style={styles.stopHeader}>
              <Text style={styles.orderId}>{order.id}</Text>
              <StatusBadge status={order.status} />
            </View>

            <Text style={styles.customerName}>Cliente: {order.customerName}</Text>
            <Text style={styles.stopAddress}>📍 {order.delivery.addressFull}</Text>

            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { marginTop: 10 }]}
              onPress={() => navigation.navigate('DriverConfirm', { orderId: order.id, type: 'DELIVERY' })}
            >
              <Ionicons name="checkmark-done" size={16} color="#FFF" />
              <Text style={styles.btnTextWhite}>Confirmar Entrega</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  vehicleText: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  zoneText: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  deliveriesBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  badgeNum: { fontSize: 18, fontWeight: '800', color: Colors.primaryDark },
  badgeLabel: { fontSize: 10, color: Colors.primaryDark, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10, marginTop: 8 },
  statusChipsRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  statusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  statusChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusChipText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  statusChipTextActive: { color: '#FFF' },
  stopCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  stopHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { fontSize: 15, fontWeight: '800', color: Colors.text },
  customerName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  stopAddress: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  stopTime: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  actionButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  startBtn: { backgroundColor: Colors.primary },
  confirmBtn: { backgroundColor: Colors.secondary },
  btnTextWhite: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  emptyBox: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
});
