import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/useAuthStore';
import { MOCK_ORDERS } from '../../../data/mockData';
import { BRAND_ASSETS, BRAND_COLORS } from '../../../theme/brand';
import OrderCard from '../../../components/orders/OrderCard';
import { useOrderStatusStore } from '../../../store/useOrderStatusStore';

export default function DriverHomeTab() {
  const router = useRouter();
  const { user } = useAuthStore();
  const overrides = useOrderStatusStore((s) => s.overrides);
  const firstName = user?.name?.trim()?.split(/\s+/)[0] ?? 'Chofer';

  const ordersWithResolvedStatus = MOCK_ORDERS.map((o) => ({
    ...o,
    status: overrides[o.id] ?? o.status,
  }));

  const routeInProgress = ordersWithResolvedStatus.find((o) => ['picked_up', 'delivering', 'in_process'].includes(o.status));
  const pendingRoutes = ordersWithResolvedStatus.filter((o) => o.status === 'pending');

  return (
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <View style={styles.headerLeft}>
          <Image source={BRAND_ASSETS.logoMark} style={styles.headerLogo} />
          <View style={styles.headerGreetingWrap}>
            <Text style={styles.headerGreeting}>Hola,</Text>
            <Text style={styles.headerName} numberOfLines={1}>{firstName}</Text>
            <Text style={styles.headerCaption}>Panel de chofer</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Ruta en curso</Text>
        {routeInProgress ? (
          <OrderCard
            order={routeInProgress}
            onPress={() => router.push({ pathname: '/(driver)/order', params: { id: routeInProgress.id } })}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tienes una ruta activa ahora.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Rutas pendientes</Text>
        {pendingRoutes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay rutas pendientes.</Text>
          </View>
        ) : (
          pendingRoutes.map((order) => (
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
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F4',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerLogo: { width: 44, height: 44, resizeMode: 'contain' },
  headerGreetingWrap: { flex: 1, minWidth: 0, justifyContent: 'center' },
  headerGreeting: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 1 },
  headerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  headerCaption: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  content: { padding: 16, paddingBottom: 26 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 6 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BRAND_COLORS.border, marginBottom: 10 },
  emptyText: { color: BRAND_COLORS.textMuted, fontSize: 13 },
});
