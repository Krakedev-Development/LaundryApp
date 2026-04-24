import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapViewCustom, { StopMarker } from '../../components/map/MapViewCustom';
import { MOCK_ORDERS, MOCK_DRIVER } from '../../data/mockData';
import { BRAND_COLORS } from '../../theme/brand';
import AppHeader from '../../components/layout/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MATRIZ = { latitude: -0.2295, longitude: -78.5243 };

export default function DriverMap() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0];
  const dest = order.client.coordinates;

  const stops: StopMarker[] = [
    { id: 'dest', label: '1', latitude: dest.latitude, longitude: dest.longitude },
  ];

  const route = [MATRIZ, dest];

  const drivers = [
    { id: 'd1', latitude: MOCK_DRIVER.coordinates.latitude, longitude: MOCK_DRIVER.coordinates.longitude, label: 'Tú' },
  ];

  const center = {
    latitude: (MATRIZ.latitude + dest.latitude) / 2,
    longitude: (MATRIZ.longitude + dest.longitude) / 2,
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Ruta en mapa" subtitle={order.id} onBack={() => router.back()} />

      <MapViewCustom
        center={center}
        zoom={12}
        stops={stops}
        drivers={drivers}
        routeWaypoints={route}
        style={styles.map}
      />

      <View style={[styles.infoCard, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.infoLeft}>
          <Ionicons name="location" size={18} color={BRAND_COLORS.primary} />
          <View>
            <Text style={styles.infoName}>{order.client.name}</Text>
            <Text style={styles.infoAddress}>{order.address}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => router.push({ pathname: '/(driver)/chat', params: { id: order.id } })}
        >
          <Ionicons name="chatbubble-outline" size={18} color={BRAND_COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  map: { flex: 1 },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  infoAddress: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  chatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND_COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
