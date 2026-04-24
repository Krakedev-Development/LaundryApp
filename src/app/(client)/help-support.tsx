import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../../components/layout/AppHeader';
import { BRAND_COLORS } from '../../theme/brand';

const CONTACT = {
  phone: '+593 2 123 4567',
  phoneTel: '+59321234567',
  email: 'soporte@laundryapp.app',
  hours: 'Lun–Sáb 8:00 – 20:00',
};

const FAQ = [
  {
    q: '¿Cómo programo una recogida?',
    a: 'En Inicio pulsa «Solicitar recogida» y sigue los pasos: prendas, extras, fecha de recogida y dirección.',
  },
  {
    q: '¿Puedo cambiar la dirección después de pedir?',
    a: 'Mientras el pedido esté pendiente, puedes editar desde el detalle del pedido o contactando a soporte.',
  },
  {
    q: '¿Cómo uso mi saldo o puntos?',
    a: 'El saldo se aplica al confirmar el pedido. Los puntos se canjean desde el modal de recompensas en Inicio.',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const openMail = () => {
    Linking.openURL(`mailto:${CONTACT.email}?subject=Ayuda%20LaundryApp`).catch(() =>
      Alert.alert('No disponible', 'No se pudo abrir el correo en este dispositivo.'),
    );
  };

  const openPhone = () => {
    Linking.openURL(`tel:${CONTACT.phoneTel}`).catch(() =>
      Alert.alert('No disponible', 'No se pudo iniciar la llamada.'),
    );
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Ayuda y soporte" subtitle="Estamos para ayudarte" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Contacto</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={openPhone} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="call-outline" size={18} color="#15803D" />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Llamada</Text>
              <Text style={styles.rowSub}>{CONTACT.phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={openMail} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="mail-outline" size={18} color="#2563EB" />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Correo</Text>
              <Text style={styles.rowSub}>{CONTACT.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="time-outline" size={18} color="#6B7280" />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Horario</Text>
              <Text style={styles.rowSub}>{CONTACT.hours}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Preguntas frecuentes</Text>
        <View style={styles.card}>
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <View key={item.q} style={i < FAQ.length - 1 ? styles.faqBlockBorder : styles.faqBlock}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => setOpenFaq(open ? null : i)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQ}>{item.q}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
                </TouchableOpacity>
                {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
              </View>
            );
          })}
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={BRAND_COLORS.textMuted} />
          <Text style={styles.noteText}>
            Esta app es una demostración: los enlaces de teléfono y correo son de ejemplo.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND_COLORS.background },
  scroll: { padding: 16, paddingTop: 8 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 2 },
  rowSub: { fontSize: 13, color: '#6B7280' },
  faqBlock: { paddingHorizontal: 4 },
  faqBlockBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: 4 },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 12,
  },
  faqQ: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827', lineHeight: 21 },
  faqA: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    paddingHorizontal: 10,
    paddingBottom: 14,
    paddingTop: 0,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noteText: { flex: 1, fontSize: 12, color: BRAND_COLORS.textMuted, lineHeight: 18 },
});
