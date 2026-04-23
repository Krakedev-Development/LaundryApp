import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_SERVICES, ServicePackage } from '../../../data/mockData';
import { useOrderStore } from '../../../store/useOrderStore';

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  wash_fold: 'water-outline',
  dry_clean: 'shirt-outline',
  iron: 'flame-outline',
  shirts: 'layers-outline',
};

export default function Step1Service() {
  const router = useRouter();
  const { setService } = useOrderStore();
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    if (!selected) return;
    const service = MOCK_SERVICES.find((s) => s.id === selected)!;
    setService(service);
    router.push('/(client)/new-order/step2-weight');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Tipo de servicio</Text>
        <Text style={styles.step}>1 / 5</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '20%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Selecciona el servicio que necesitas</Text>

        {MOCK_SERVICES.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[styles.serviceCard, selected === service.id && styles.serviceCardSelected]}
            onPress={() => setSelected(service.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.serviceIconBox, selected === service.id && styles.serviceIconBoxSelected]}>
              <Ionicons
                name={SERVICE_ICONS[service.id] ?? 'cube-outline'}
                size={24}
                color={selected === service.id ? '#fff' : '#3B82F6'}
              />
            </View>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceNameRow}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
              </View>
              <Text style={styles.serviceDesc}>{service.description}</Text>
              <Text style={styles.servicePrice}>
                {service.pricePerPound
                  ? `$${service.pricePerPound.toFixed(2)} / libra`
                  : `$${service.fixedPrice?.toFixed(2)} fijo`}
              </Text>
            </View>
            {selected === service.id && (
              <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!selected}
        >
          <Text style={styles.nextBtnText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  step: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 16, borderRadius: 2, marginBottom: 20 },
  progressFill: { height: 4, backgroundColor: '#3B82F6', borderRadius: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionLabel: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  serviceCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
    marginBottom: 10, backgroundColor: '#fff',
  },
  serviceCardSelected: { borderColor: '#3B82F6', backgroundColor: '#F0F7FF' },
  serviceIconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  serviceIconBoxSelected: { backgroundColor: '#3B82F6' },
  serviceInfo: { flex: 1 },
  serviceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  serviceName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  popularBadge: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  popularText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  serviceDesc: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  servicePrice: { fontSize: 13, fontWeight: '600', color: '#3B82F6' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#3B82F6', borderRadius: 12, padding: 16,
  },
  nextBtnDisabled: { backgroundColor: '#D1D5DB' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
