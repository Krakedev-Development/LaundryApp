import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TrackingMap from '../../components/map/TrackingMap';
import { DriverLocation } from '../../types';

export default function TrackingScreen() {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);

  useEffect(() => {
    // TODO: suscribirse a WebSocket o polling para ubicación en tiempo real
    // Ejemplo mock para desarrollo:
    setDrivers([
      {
        driverId: '1',
        coordinates: { latitude: -0.2310, longitude: -78.5200 },
        updatedAt: new Date().toISOString(),
      },
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tracking en vivo</Text>
      <TrackingMap drivers={drivers} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    fontSize: 20, fontWeight: '700', color: '#111827',
    padding: 16, paddingTop: 48,
  },
});
