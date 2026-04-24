import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Promotion } from '../../data/mockData';

interface PromoDetailModalProps {
  promo: Promotion | null;
  onClose: () => void;
  onAccept: (promo: Promotion) => void;
}

const PROMO_DETAILS: Record<string, { requirements: string[]; includes: string[] }> = {
  p1: {
    requirements: ['Mínimo 15 prendas de ropa', 'Válido de lunes a viernes'],
    includes: ['Lavado completo', 'Secado', 'Doblado', 'Entrega a domicilio'],
  },
  p2: {
    requirements: ['Solo primer pedido', 'Mínimo $8 en servicio'],
    includes: ['10% de descuento automático', 'Aplica a cualquier servicio'],
  },
  p3: {
    requirements: ['Recarga mínima de $30', 'Saldo no expira'],
    includes: ['$35 en saldo', 'Ahorro de $5', 'Úsalo cuando quieras'],
  },
};

export default function PromoDetailModal({ promo, onClose, onAccept }: PromoDetailModalProps) {
  if (!promo) return null;
  const details = PROMO_DETAILS[promo.id] ?? { requirements: [], includes: [] };

  return (
    <Modal visible={!!promo} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: promo.color }]}>
          <View style={styles.handle} />

          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: promo.color }]}>
            {promo.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{promo.badge}</Text>
              </View>
            )}
            <Text style={styles.heroTitle}>{promo.title}</Text>
            <Text style={styles.heroDesc}>{promo.description}</Text>
          </View>

          <View style={styles.body}>
            <ScrollView contentContainerStyle={styles.content}>
              {/* Incluye */}
              <Text style={styles.sectionTitle}>Qué incluye</Text>
              {details.includes.map((item) => (
                <View key={item} style={styles.listRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}

              {/* Requisitos */}
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Condiciones</Text>
              {details.requirements.map((item) => (
                <View key={item} style={styles.listRow}>
                  <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: promo.color }]}
                onPress={() => onAccept(promo)}
              >
                <Ionicons name="arrow-forward" size={18} color="#fff" />
                <Text style={styles.acceptText}>Aprovechar oferta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', overflow: 'hidden' },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  hero: { padding: 24, paddingTop: 16 },
  body: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  badge: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  content: { padding: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  listText: { fontSize: 14, color: '#374151', flex: 1 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  acceptBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, padding: 14 },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
