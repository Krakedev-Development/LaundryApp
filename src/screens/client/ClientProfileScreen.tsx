import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLaundry } from '../../store/LaundryStore';
import { Colors } from '../../theme/colors';

export const ClientProfileScreen = ({ navigation }: any) => {
  const { customer } = useLaundry();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Header */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {customer.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </Text>
        </View>
        <Text style={styles.userName}>{customer.name}</Text>
        <Text style={styles.userEmail}>{customer.email} • {customer.phone}</Text>

        <View style={styles.kycRow}>
          <Ionicons
            name={customer.kycStatus === 'APPROVED' ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={customer.kycStatus === 'APPROVED' ? Colors.success : Colors.warning}
          />
          <Text style={styles.kycText}>
            Verificación KYC: {customer.kycStatus === 'APPROVED' ? 'Aprobada' : customer.kycStatus}
          </Text>
        </View>
      </View>

      {/* Options List */}
      <Text style={styles.sectionTitle}>Cuenta y Configuración</Text>

      <TouchableOpacity
        style={styles.optionRow}
        onPress={() => Alert.alert('Direcciones', `Tienes ${customer.addresses.length} direcciones registradas.`)}
      >
        <Ionicons name="location-outline" size={22} color={Colors.primary} />
        <Text style={styles.optionText}>Mis Direcciones Guardadas</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionRow}
        onPress={() => Alert.alert('Datos de Facturación', `Razón Social: ${customer.billingName}\nDocumento: ${customer.billingTaxId}`)}
      >
        <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
        <Text style={styles.optionText}>Datos de Facturación</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionRow}
        onPress={() => navigation.navigate('KycUpload')}
      >
        <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primary} />
        <Text style={styles.optionText}>Identidad y Validación KYC</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionRow}
        onPress={() => Alert.alert('Soporte Laundry Fresh', 'Contáctanos al WhatsApp +51 987 654 321 o vía soporte@laundryfresh.com')}
      >
        <Ionicons name="help-buoy-outline" size={22} color={Colors.primary} />
        <Text style={styles.optionText}>Ayuda y Soporte</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  userCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  userName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  userEmail: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    gap: 6,
  },
  kycText: { fontSize: 12, fontWeight: '700', color: Colors.text },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  optionText: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600', color: Colors.text },
});
