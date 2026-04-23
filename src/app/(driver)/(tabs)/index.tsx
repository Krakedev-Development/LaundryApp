import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/useAuthStore';
import { MOCK_ORDERS } from '../../../data/mockData';
import { BRAND_COLORS } from '../../../theme/brand';
import OrderCard from '../../../components/orders/OrderCard';

export default function DriverHomeTab() {
  const router = useRouter();
  const { user } = useAuthStore();

  const routeInProgress = MOCK_ORDERS.find((o) => ['picked_up', 'delivering', 'in_process'].includes(o.status));
  const pendingRoutes = MOCK_ORDERS.filter((o) => o.status === 'pending');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.subtitle}>Tu hoja de ruta de hoy</Text>
        </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  content: { padding: 16, paddingTop: 20, paddingBottom: 26 },
  header: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14 },
  greeting: { fontSize: 24, fontWeight: '700', color: BRAND_COLORS.text },
  subtitle: { fontSize: 13, color: BRAND_COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BRAND_COLORS.border, marginBottom: 10 },
  emptyText: { color: BRAND_COLORS.textMuted, fontSize: 13 },
});
