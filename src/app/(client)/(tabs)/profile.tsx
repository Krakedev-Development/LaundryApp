import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/useAuthStore';
import { MOCK_ORDERS, MOCK_CLIENT } from '../../../data/mockData';
import { BRAND_ASSETS, BRAND_COLORS } from '../../../theme/brand';

const MENU_SECTIONS = [
  {
    title: 'Pagos y suscripciones',
    items: [
      { icon: 'card-outline' as const, label: 'Métodos de pago', route: '/(client)/payments', color: '#3B82F6' },
      { icon: 'wallet-outline' as const, label: 'Recargar saldo', route: '/(client)/payments/recharge', color: '#10B981' },
      { icon: 'star-outline' as const, label: 'Membresías', route: '/(client)/payments/subscriptions', color: '#7C3AED' },
    ],
  },
  {
    title: 'Mi cuenta',
    items: [
      { icon: 'location-outline' as const, label: 'Mis direcciones', route: '/(client)/addresses', color: '#F59E0B' },
      { icon: 'notifications-outline' as const, label: 'Notificaciones', route: '/(client)/notifications', color: '#EF4444' },
      { icon: 'lock-closed-outline' as const, label: 'Cambiar contraseña', route: null, color: '#6B7280' },
      { icon: 'help-circle-outline' as const, label: 'Ayuda y soporte', route: null, color: '#6B7280' },
    ],
  },
];

export default function ClientProfile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const displayName = user?.name?.trim() || 'Cliente';
  const displayEmail = user?.email?.trim() || 'sin-correo@laundryapp.app';
  const delivered = MOCK_ORDERS.filter((o) => o.status === 'delivered').length;
  const active = MOCK_ORDERS.filter((o) => o.status !== 'delivered').length;
  const [billingName, setBillingName] = useState(displayName);
  const [billingId, setBillingId] = useState('');
  const [billingEmail, setBillingEmail] = useState(displayEmail);
  const [billingPhone, setBillingPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const handleSaveBilling = () => {
    Alert.alert('Datos guardados', 'Tus datos de facturación fueron actualizados.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Image source={BRAND_ASSETS.logoMark} style={styles.avatarLogo} />
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{displayEmail}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Cliente</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{MOCK_ORDERS.length}</Text>
          <Text style={styles.statLabel}>Pedidos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{active}</Text>
          <Text style={styles.statLabel}>En curso</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{MOCK_CLIENT.points}</Text>
          <Text style={styles.statLabel}>Puntos</Text>
        </View>
      </View>

      {/* Saldo rápido */}
      <TouchableOpacity
        style={styles.balanceCard}
        onPress={() => router.push('/(client)/payments')}
      >
        <View style={styles.balanceLeft}>
          <View style={styles.balanceIconBox}>
            <Ionicons name="wallet-outline" size={20} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balanceAmount}>${MOCK_CLIENT.balance.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.balanceRight}>
          <TouchableOpacity
            style={styles.rechargeBtn}
            onPress={() => router.push('/(client)/payments/recharge')}
          >
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.rechargeBtnText}>Recargar</Text>
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      {/* Verificación de identidad */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verificación</Text>
        <View style={styles.sectionCard}>
          <View style={[styles.menuItem, styles.menuItemBorder]}>
            <View style={[styles.menuIconBox, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="card-outline" size={18} color="#2563EB" />
            </View>
            <View style={styles.verificationInfo}>
              <Text style={styles.menuLabel}>Foto de cédula</Text>
              <Text style={styles.verificationStatus}>{user?.cedula_photo ? 'Documento cargado' : 'No disponible'}</Text>
            </View>
            {user?.cedula_photo ? (
              <Image source={{ uri: user.cedula_photo }} style={styles.verificationImage} />
            ) : (
              <Ionicons name="image-outline" size={18} color="#D1D5DB" />
            )}
          </View>

          <View style={styles.menuItem}>
            <View style={[styles.menuIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="person-outline" size={18} color="#16A34A" />
            </View>
            <View style={styles.verificationInfo}>
              <Text style={styles.menuLabel}>Foto de rostro</Text>
              <Text style={styles.verificationStatus}>{user?.selfie_photo ? 'Selfie verificada' : 'No disponible'}</Text>
            </View>
            {user?.selfie_photo ? (
              <Image source={{ uri: user.selfie_photo }} style={styles.verificationImage} />
            ) : (
              <Ionicons name="image-outline" size={18} color="#D1D5DB" />
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Facturación</Text>
        <View style={styles.sectionCardForm}>
          <Text style={styles.formLabel}>Nombre / Razón social</Text>
          <TextInput style={styles.input} value={billingName} onChangeText={setBillingName} placeholder="Nombre para factura" placeholderTextColor="#9CA3AF" />

          <Text style={styles.formLabel}>CI o RUC</Text>
          <TextInput style={styles.input} value={billingId} onChangeText={setBillingId} placeholder="Ej: 1712345678 / 1790012345001" placeholderTextColor="#9CA3AF" />

          <Text style={styles.formLabel}>Correo</Text>
          <TextInput style={styles.input} value={billingEmail} onChangeText={setBillingEmail} keyboardType="email-address" autoCapitalize="none" placeholder="correo@dominio.com" placeholderTextColor="#9CA3AF" />

          <Text style={styles.formLabel}>Teléfono</Text>
          <TextInput style={styles.input} value={billingPhone} onChangeText={setBillingPhone} keyboardType="phone-pad" placeholder="0991234567" placeholderTextColor="#9CA3AF" />

          <Text style={styles.formLabel}>Dirección</Text>
          <TextInput style={[styles.input, styles.inputMultiline]} value={billingAddress} onChangeText={setBillingAddress} placeholder="Dirección fiscal" placeholderTextColor="#9CA3AF" multiline />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBilling}>
            <Text style={styles.saveBtnText}>Guardar datos de facturación</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menú secciones */}
      {MENU_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, i < section.items.length - 1 && styles.menuItemBorder]}
                onPress={() => item.route && router.push(item.route as any)}
              >
                <View style={[styles.menuIconBox, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  content: { paddingBottom: 32 },
  avatarSection: { alignItems: 'center', paddingTop: 56, paddingBottom: 20, backgroundColor: '#fff' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: BRAND_COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarLogo: { width: 52, height: 52, resizeMode: 'contain' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 2 },
  email: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  roleBadge: { backgroundColor: BRAND_COLORS.primarySoft, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  roleText: { color: BRAND_COLORS.primary, fontWeight: '600', fontSize: 12 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  balanceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { fontSize: 12, color: '#6B7280' },
  balanceAmount: { fontSize: 20, fontWeight: '700', color: '#1D4ED8' },
  balanceRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rechargeBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  rechargeBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  sectionCardForm: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1.2, borderColor: BRAND_COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: BRAND_COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIconBox: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  verificationInfo: { flex: 1 },
  verificationStatus: { fontSize: 12, color: '#6B7280' },
  verificationImage: { width: 46, height: 46, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 20, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
