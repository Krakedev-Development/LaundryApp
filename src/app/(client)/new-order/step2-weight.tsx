import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStore } from '../../../store/useOrderStore';

const POUND_OPTIONS = [10, 15, 20, 25, 30, 40];

export default function Step2Weight() {
  const router = useRouter();
  const { service, pounds, setPounds, getTotal } = useOrderStore();
  const [selected, setSelected] = useState(pounds);

  const isPerPound = !!service?.pricePerPound;

  const handleSelect = (val: number) => {
    setSelected(val);
    setPounds(val);
  };

  const handleMinus = () => {
    if (selected > (service?.minPounds ?? 1)) {
      handleSelect(selected - 1);
    }
  };

  const handlePlus = () => handleSelect(selected + 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Cantidad</Text>
        <Text style={styles.step}>2 / 5</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '40%' }]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.serviceName}>{service?.name}</Text>

        {isPerPound ? (
          <>
            <Text style={styles.sectionLabel}>Selecciona las libras estimadas</Text>

            {/* Selector manual */}
            <View style={styles.counterRow}>
              <TouchableOpacity style={styles.counterBtn} onPress={handleMinus}>
                <Ionicons name="remove" size={22} color="#3B82F6" />
              </TouchableOpacity>
              <View style={styles.counterValue}>
                <Text style={styles.counterNumber}>{selected}</Text>
                <Text style={styles.counterUnit}>libras</Text>
              </View>
              <TouchableOpacity style={styles.counterBtn} onPress={handlePlus}>
                <Ionicons name="add" size={22} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            {/* Opciones rápidas */}
            <Text style={styles.quickLabel}>Opciones rápidas</Text>
            <View style={styles.poundGrid}>
              {POUND_OPTIONS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.poundChip, selected === p && styles.poundChipSelected]}
                  onPress={() => handleSelect(p)}
                >
                  <Text style={[styles.poundChipText, selected === p && styles.poundChipTextSelected]}>
                    {p} lbs
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                El peso final se confirma en planta. Solo pagas por lo real.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.fixedPriceBox}>
            <Ionicons name="pricetag-outline" size={32} color="#3B82F6" />
            <Text style={styles.fixedPriceText}>Precio fijo por servicio</Text>
            <Text style={styles.fixedPriceAmount}>${service?.fixedPrice?.toFixed(2)}</Text>
          </View>
        )}

        {/* Total estimado */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total estimado</Text>
          <Text style={styles.totalAmount}>${getTotal().toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={() => router.push('/(client)/new-order/step3-schedule')}>
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
  content: { flex: 1, paddingHorizontal: 16 },
  serviceName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionLabel: { fontSize: 14, color: '#6B7280', marginBottom: 20, marginTop: 4 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  counterBtn: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
  },
  counterValue: { alignItems: 'center', marginHorizontal: 32 },
  counterNumber: { fontSize: 48, fontWeight: '700', color: '#111827', lineHeight: 56 },
  counterUnit: { fontSize: 14, color: '#6B7280' },
  quickLabel: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  poundGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  poundChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  poundChipSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  poundChipText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  poundChipTextSelected: { color: '#3B82F6' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10 },
  infoText: { fontSize: 12, color: '#6B7280', flex: 1, lineHeight: 17 },
  fixedPriceBox: { alignItems: 'center', paddingVertical: 40 },
  fixedPriceText: { fontSize: 16, color: '#6B7280', marginTop: 12 },
  fixedPriceAmount: { fontSize: 40, fontWeight: '700', color: '#111827', marginTop: 4 },
  totalCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F0F7FF', borderRadius: 12, padding: 16, marginTop: 8,
  },
  totalLabel: { fontSize: 15, color: '#374151', fontWeight: '600' },
  totalAmount: { fontSize: 22, fontWeight: '700', color: '#3B82F6' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#3B82F6', borderRadius: 12, padding: 16,
  },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
