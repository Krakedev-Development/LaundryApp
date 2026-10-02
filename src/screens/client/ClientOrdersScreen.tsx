import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useLaundry } from '../../store/LaundryStore';
import { Colors } from '../../theme/colors';
import { StatusBadge } from '../../components/StatusBadge';
import { Order } from '../../types';

export const ClientOrdersScreen = ({ navigation }: any) => {
  const { orders } = useLaundry();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DELIVERED'>('ALL');

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ACTIVE') {
      return o.status !== 'DELIVERED' && o.status !== 'CLOSED' && o.status !== 'CANCELLED';
    }
    if (filter === 'DELIVERED') {
      return o.status === 'DELIVERED' || o.status === 'CLOSED';
    }
    return true;
  });

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Tracking', { orderId: item.id })}
    >
      <View style={styles.headerRow}>
        <Text style={styles.orderId}>{item.id}</Text>
        <StatusBadge status={item.status} />
      </View>

      <Text style={styles.dateText}>Creado: {item.createdAt}</Text>
      <Text style={styles.infoText}>
        {item.items.reduce((s, i) => s + i.quantity, 0)} prendas • {item.pickup.addressTitle}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.totalText}>Total: ${item.pricing.total.toFixed(2)}</Text>
        <Text style={styles.actionLink}>Ver detalles y tracking →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'ACTIVE', 'DELIVERED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterBtn, filter === tab && styles.filterBtnActive]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.filterBtnText,
                filter === tab && styles.filterBtnTextActive,
              ]}
            >
              {tab === 'ALL' ? 'Todos' : tab === 'ACTIVE' ? 'En Curso' : 'Entregados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyText}>No hay solicitudes en esta categoría.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  filterBtnActive: { backgroundColor: Colors.primaryLight },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  filterBtnTextActive: { color: Colors.primaryDark, fontWeight: '700' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: { fontSize: 16, fontWeight: '800', color: Colors.text },
  dateText: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  infoText: { fontSize: 13, color: Colors.text, marginBottom: 10 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 10,
  },
  totalText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  actionLink: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  emptyView: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
});
