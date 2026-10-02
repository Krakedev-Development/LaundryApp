import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLaundry } from '../../store/LaundryStore';
import { Colors } from '../../theme/colors';
import { StatusBadge } from '../../components/StatusBadge';
import { OrderTimeline } from '../../components/OrderTimeline';

export const ClientTrackingScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params || { orderId: 'SOL-4587' };
  const { orders } = useLaundry();

  const order = orders.find((o) => o.id === orderId) || orders[0];

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Pedido no encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.orderCode}>{order.id}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.heroSub}>Fecha de solicitud: {order.createdAt}</Text>
      </View>

      {/* Driver Card */}
      {order.assignedDriverName && (
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.driverName}>{order.assignedDriverName}</Text>
            <Text style={styles.driverVehicle}>
              {order.assignedDriverVehicle} • {order.assignedDriverPlate}
            </Text>
            <Text style={styles.driverPhone}>{order.assignedDriverPhone}</Text>
          </View>
          <TouchableOpacity
            style={styles.chatIconBtn}
            onPress={() => navigation.navigate('Chat', { orderId: order.id })}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Timeline */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Línea de Tiempo del Servicio</Text>
        <OrderTimeline timeline={order.timeline} />
      </View>

      {/* Pickup & Delivery details */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Direcciones y Horarios</Text>

        <View style={styles.locRow}>
          <Ionicons name="pin" size={20} color={Colors.primary} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.locLabel}>Recogida</Text>
            <Text style={styles.locAddress}>{order.pickup.addressFull}</Text>
            <Text style={styles.locTime}>{order.pickup.date} • {order.pickup.timeSlot}</Text>
            {!!order.pickup.notes && <Text style={styles.locNotes}>Nota: {order.pickup.notes}</Text>}
          </View>
        </View>

        <View style={[styles.locRow, { marginTop: 12 }]}>
          <Ionicons name="home" size={20} color={Colors.secondary} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.locLabel}>Entrega</Text>
            <Text style={styles.locAddress}>{order.delivery.addressFull}</Text>
            <Text style={styles.locTime}>{order.delivery.date} • {order.delivery.timeSlot}</Text>
          </View>
        </View>
      </View>

      {/* Items Breakdown */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Prendas en el Pedido</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.quantity}x {item.garmentType} ({item.serviceType})
            </Text>
            <Text style={styles.itemPrice}>${(item.quantity * item.unitPrice).toFixed(2)}</Text>
          </View>
        ))}
        {order.extras.map((extra) => (
          <View key={extra.id} style={styles.itemRow}>
            <Text style={styles.extraName}>+ {extra.name}</Text>
            <Text style={styles.itemPrice}>${extra.price.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>Total Pagado</Text>
          <Text style={styles.totalVal}>${order.pricing.total.toFixed(2)}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderCode: { fontSize: 20, fontWeight: '800', color: Colors.text },
  heroSub: { fontSize: 12, color: Colors.textMuted },
  driverCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  driverVehicle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  driverPhone: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  chatIconBtn: {
    backgroundColor: Colors.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  locRow: { flexDirection: 'row', alignItems: 'flex-start' },
  locLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  locAddress: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: 2 },
  locTime: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  locNotes: { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName: { fontSize: 13, color: Colors.text, flex: 1 },
  extraName: { fontSize: 13, color: Colors.textMuted, flex: 1 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  totalLabel: { fontSize: 14, fontWeight: '800', color: Colors.text },
  totalVal: { fontSize: 16, fontWeight: '800', color: Colors.primary },
});
