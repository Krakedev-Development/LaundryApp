import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapViewCustom, { DriverMarker, StopMarker } from '../../components/map/MapViewCustom';
import { MOCK_ORDERS } from '../../data/mockData';
import AppHeader from '../../components/layout/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Ruta simulada con más puntos para movimiento fluido
const ROUTE_LOOP = [
  { latitude: -0.2295, longitude: -78.5243 }, // Sede
  { latitude: -0.2298, longitude: -78.5230 },
  { latitude: -0.2301, longitude: -78.5218 },
  { latitude: -0.2305, longitude: -78.5210 },
  { latitude: -0.2308, longitude: -78.5205 },
  { latitude: -0.2310, longitude: -78.5200 }, // Parada 1
  { latitude: -0.2315, longitude: -78.5190 },
  { latitude: -0.2325, longitude: -78.5175 },
  { latitude: -0.2338, longitude: -78.5162 },
  { latitude: -0.2350, longitude: -78.5150 }, // Parada 2
  { latitude: -0.2340, longitude: -78.5140 },
  { latitude: -0.2325, longitude: -78.5128 },
  { latitude: -0.2310, longitude: -78.5115 },
  { latitude: -0.2295, longitude: -78.5108 },
  { latitude: -0.2280, longitude: -78.5100 }, // Parada 3
  { latitude: -0.2285, longitude: -78.5115 },
  { latitude: -0.2288, longitude: -78.5130 },
  { latitude: -0.2290, longitude: -78.5180 },
  { latitude: -0.2293, longitude: -78.5210 },
  { latitude: -0.2295, longitude: -78.5243 }, // Vuelve a Sede
];

const MOCK_STOPS: StopMarker[] = [
  { id: '1', label: '1', latitude: -0.2310, longitude: -78.5200 },
  { id: '2', label: '2', latitude: -0.2350, longitude: -78.5150, completed: true },
  { id: '3', label: '3', latitude: -0.2280, longitude: -78.5100, hasIncident: true },
];

export default function TrackingScreen() {
  const router = useRouter();
  const stepRef = useRef(0);
  const insets = useSafeAreaInsets();
  const activeOrder = MOCK_ORDERS[0];

  const [drivers, setDrivers] = useState<DriverMarker[]>([
    { id: 'd1', ...ROUTE_LOOP[0], label: activeOrder.driver.name },
  ]);

  // Bucle continuo — el auto recorre la ruta y vuelve a empezar
  useEffect(() => {
    const interval = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % ROUTE_LOOP.length;
      const pos = ROUTE_LOOP[stepRef.current];

      // Calcula heading entre punto actual y siguiente
      const next = ROUTE_LOOP[(stepRef.current + 1) % ROUTE_LOOP.length];
      const heading = Math.atan2(
        next.longitude - pos.longitude,
        next.latitude - pos.latitude
      ) * (180 / Math.PI);

      setDrivers([{ id: 'd1', ...pos, heading, label: activeOrder.driver.name }]);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader title="Tracking en vivo" rightText="En camino" onBack={() => router.back()} />

      {/* Mapa */}
      <MapViewCustom
        center={{ latitude: -0.2310, longitude: -78.5170 }}
        zoom={13}
        stops={MOCK_STOPS}
        drivers={drivers}
        routeWaypoints={[
          { latitude: -0.2295, longitude: -78.5243 },
          { latitude: -0.2310, longitude: -78.5200 },
          { latitude: -0.2350, longitude: -78.5150 },
          { latitude: -0.2280, longitude: -78.5100 },
        ]}
        style={styles.map}
      />

      {/* Info chofer */}
      <View style={[styles.driverCard, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>{activeOrder.driver.name[0]}</Text>
          </View>
          <View>
            <Text style={styles.driverName}>{activeOrder.driver.name}</Text>
            <Text style={styles.driverVehicle}>{activeOrder.driver.vehicle} · {activeOrder.driver.plate}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.chatBtn} onPress={() => router.push('/(client)/chat')}>
          <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 52, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  badgeText: { color: '#10B981', fontWeight: '600', fontSize: 12 },
  map: { flex: 1 },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  driverAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  driverName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  driverVehicle: { fontSize: 12, color: '#6B7280' },
  chatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
});
