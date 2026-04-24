import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import OrderCard from '../../../components/orders/OrderCard';
import { MOCK_ORDERS } from '../../../data/mockData';
import { BRAND_COLORS } from '../../../theme/brand';
import { useOrderStatusStore } from '../../../store/useOrderStatusStore';
import AppHeader from '../../../components/layout/AppHeader';

type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function DriverHistoryTab() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const overrides = useOrderStatusStore((s) => s.overrides);

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(startOfToday); weekAgo.setDate(startOfToday.getDate() - 7);
    const monthAgo = new Date(startOfToday); monthAgo.setDate(startOfToday.getDate() - 30);
    const q = query.trim().toLowerCase();

    const ordersWithResolvedStatus = MOCK_ORDERS.map((order) => ({
      ...order,
      status: overrides[order.id] ?? order.status,
    }));

    return ordersWithResolvedStatus.filter((order) => {
      const pickup = new Date(order.pickupTime);
      const passDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' && pickup >= startOfToday) ||
        (dateFilter === 'week' && pickup >= weekAgo) ||
        (dateFilter === 'month' && pickup >= monthAgo);

      const passText = !q || order.client.name.toLowerCase().includes(q) || order.id.toLowerCase().includes(q);
      return passDate && passText;
    });
  }, [dateFilter, query, overrides]);

  return (
    <View style={styles.container}>
      <AppHeader title="Historial de rutas" subtitle="Filtra por fecha o cliente" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cliente o código de pedido"
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#9CA3AF"
        />

        <View style={styles.filtersRow}>
          {([
            { id: 'all', label: 'Todo' },
            { id: 'today', label: 'Hoy' },
            { id: 'week', label: '7 días' },
            { id: 'month', label: '30 días' },
          ] as { id: DateFilter; label: string }[]).map((f) => (
            <TouchableOpacity key={f.id} style={[styles.filterBtn, dateFilter === f.id && styles.filterBtnActive]} onPress={() => setDateFilter(f.id)}>
              <Text style={[styles.filterText, dateFilter === f.id && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay resultados con los filtros actuales.</Text>
          </View>
        ) : (
          filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push({ pathname: '/(driver)/order', params: { id: order.id } })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  content: { padding: 16, paddingBottom: 26 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1.2, borderColor: BRAND_COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: BRAND_COLORS.text, marginBottom: 10 },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { flex: 1, borderWidth: 1.2, borderColor: BRAND_COLORS.border, borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: BRAND_COLORS.primary, borderColor: BRAND_COLORS.primary },
  filterText: { color: BRAND_COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: BRAND_COLORS.border, padding: 16 },
  emptyText: { color: BRAND_COLORS.textMuted, fontSize: 13 },
});
