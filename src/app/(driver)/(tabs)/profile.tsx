import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/useAuthStore';
import { MOCK_DRIVER } from '../../../data/mockData';
import { BRAND_ASSETS, BRAND_COLORS } from '../../../theme/brand';

export default function DriverProfileTab() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const displayName = user?.name?.trim() || 'Chofer';
  const displayEmail = user?.email?.trim() || 'chofer@laundryapp.app';

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Image source={BRAND_ASSETS.logoMark} style={styles.avatarLogo} />
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{displayEmail}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Conductor</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Datos del vehículo</Text>
        <Row icon="car-outline" label={`${MOCK_DRIVER.vehicle}`} />
        <Row icon="pricetag-outline" label={`Placa: ${MOCK_DRIVER.plate}`} />
        <Row icon="call-outline" label={`Teléfono interno: ${MOCK_DRIVER.phone}`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <Row icon="shield-checkmark-outline" label="Privacidad habilitada (sin WhatsApp personal)" />
        <Row icon="time-outline" label="Estado: Disponible para asignación" />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Row({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={17} color={BRAND_COLORS.primary} />
      <Text style={styles.rowText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background, padding: 16, paddingTop: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BRAND_COLORS.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: BRAND_COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 6, marginBottom: 10 },
  avatarLogo: { width: 52, height: 52, resizeMode: 'contain' },
  name: { fontSize: 20, fontWeight: '700', color: BRAND_COLORS.text, textAlign: 'center' },
  email: { fontSize: 13, color: BRAND_COLORS.textMuted, textAlign: 'center', marginTop: 2 },
  roleBadge: { alignSelf: 'center', marginTop: 8, backgroundColor: BRAND_COLORS.primarySoft, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  roleText: { color: BRAND_COLORS.primary, fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowText: { fontSize: 13, color: '#374151', flex: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginTop: 6 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
