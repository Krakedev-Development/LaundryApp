import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapViewCustom, { StopMarker } from '../../components/map/MapViewCustom';
import { MOCK_ORDERS, MOCK_DRIVER } from '../../data/mockData';
import { BRAND_COLORS } from '../../theme/brand';
import { SafeAreaView } from 'react-native-safe-area-context';

const MATRIZ = { latitude: -0.2295, longitude: -78.5243 };

export default function DriverMap() {
  const router = useRouter();
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Ruta al cliente</Text>
        <View style={{ width: 32 }} />
      </View>

      <MapViewCustom
        center={center}
        zoom={12}
        stops={stops}
        drivers={drivers}
        routeWaypoints={route}
        style={styles.map}
      />

      <View style={styles.infoCard}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
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
