import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/useAuthStore';
import {useBusinessStore,currentActor} from '../../../store/useBusinessStore';
import { BRAND_ASSETS, BRAND_COLORS } from '../../../theme/brand';
import AppHeader from '../../../components/layout/AppHeader';

export default function DriverProfileTab() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const state=useBusinessStore(s=>s.state)!,driver=state.drivers.find(d=>d.id===currentActor().id)!;
  const displayName = user?.name?.trim() || 'Chofer';
  const displayEmail = user?.email?.trim() || 'chofer@laundryapp.app';

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Mi perfil" subtitle="Datos del chofer" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Image source={BRAND_ASSETS.logoMark} style={styles.avatarLogo} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="car-outline" size={12} color={BRAND_COLORS.primary} />
            <Text style={styles.roleText}>Conductor</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del vehículo</Text>
          <View style={styles.sectionCard}>
            <Row icon="car-outline" label="Vehículo" value={driver.vehicleType==='MOTO'?'Moto':driver.vehicleType==='VAN'?'Van':'Camioneta'} />
            <Row icon="pricetag-outline" label="Placa" value={driver.vehiclePlate} />
            <Row icon="call-outline" label="Teléfono interno" value={driver.phone} last />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.sectionCard}>
            <Row icon="shield-checkmark-outline" label="Privacidad" value="Sin WhatsApp personal" />
            <Row icon="time-outline" label="Estado" value={driver.status==='AVAILABLE'?'Disponible':driver.status==='ON_SERVICE'?'En servicio':driver.status} last />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIconBox}>
        <Ionicons name={icon} size={16} color={BRAND_COLORS.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  content: { padding: 16, paddingBottom: 28 },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BRAND_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarLogo: { width: 72, height: 72, resizeMode: 'contain' },
  name: { fontSize: 18, fontWeight: '700', color: BRAND_COLORS.text, textAlign: 'center' },
  email: { fontSize: 13, color: BRAND_COLORS.textMuted, textAlign: 'center', marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND_COLORS.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  roleText: { color: BRAND_COLORS.primary, fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 13, color: '#6B7280', fontWeight: '600' },
  rowValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
