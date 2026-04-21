import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';

export default function ClientDashboard() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hola, {user?.name} 👋</Text>
      <Text style={styles.subtitle}>¿Qué necesitas hoy?</Text>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ClientDashboard')}>
        <Text style={styles.cardIcon}>🧺</Text>
        <Text style={styles.cardTitle}>Nuevo pedido</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ClientDashboard')}>
        <Text style={styles.cardIcon}>📋</Text>
        <Text style={styles.cardTitle}>Mis pedidos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Tracking')}>
        <Text style={styles.cardIcon}>📍</Text>
        <Text style={styles.cardTitle}>Tracking en vivo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB' },
  greeting: { fontSize: 26, fontWeight: '700', color: '#111827', marginTop: 48 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    marginBottom: 16, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardIcon: { fontSize: 28, marginRight: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  logoutButton: { marginTop: 'auto', padding: 14, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: '600' },
});
