import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {useBusinessStore} from '../../../store/useBusinessStore';
import { useOrderStore, WASH_PRICES } from '../../../store/useOrderStore';
import AppHeader from '../../../components/layout/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EXTRAS = [
  { id: 'Doblado especial', label: 'Doblado especial', desc: 'Doblado cuidadoso tipo boutique', price: '+$2.00', icon: 'layers-outline' as const, color: '#3B82F6' },
  { id: 'Perfumado', label: 'Perfumado', desc: 'Aroma fresco duradero', price: '+$1.50', icon: 'flower-outline' as const, color: '#EC4899' },
  { id: 'Empaque premium', label: 'Empaque premium', desc: 'Entrega en bolsa sellada', price: '+$3.00', icon: 'bag-outline' as const, color: '#7C3AED' },
  { id: 'Tratamiento manchas', label: 'Tratamiento de manchas', desc: 'Prelavado especial para manchas', price: '+$2.50', icon: 'sparkles-outline' as const, color: '#F59E0B' },
  { id: 'Suavizante premium', label: 'Suavizante premium', desc: 'Suavizante de alta calidad', price: '+$1.00', icon: 'water-outline' as const, color: '#10B981' },
];

export default function Step2Extras() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { extras, setExtras, garments,pricingModel } = useOrderStore();
  const minimum=useBusinessStore(s=>s.state?.businessPolicy.minimumOrderAmount)??0;
  const [selected, setSelected] = useState<string[]>(extras);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleNext = () => {
    setExtras(selected);
    router.push('/(client)/new-order/step3-pickup');
  };

  const totalItems = garments.reduce((s, g) => s + g.quantity, 0);
  const subtotalPreview = useMemo(() => {
    let total = garments.reduce((sum, g) => {
      const price = WASH_PRICES[g.washType] ?? 1.6;
      return sum + g.quantity * price;
    }, 0);

    if (selected.includes('Doblado especial')) total += 2;
    if (selected.includes('Perfumado')) total += 1.5;
    if (selected.includes('Empaque premium')) total += 3;
    if (selected.includes('Tratamiento manchas')) total += 2.5;
    if (selected.includes('Suavizante premium')) total += 1;

    return Math.max(total, minimum);
  }, [garments, selected,minimum]);

  return (
    <View style={styles.container}>
      <AppHeader title="Servicios extra" rightText="2 / 5" onBack={() => router.back()} />
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: '40%' }]} /></View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Resumen prendas */}
        <View style={styles.summaryCard}>
          <Ionicons name="shirt-outline" size={18} color="#3B82F6" />
          <Text style={styles.summaryText}>
            {totalItems} prendas · {garments.length} tipo{garments.length !== 1 ? 's' : ''} de lavado
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Agrega servicios opcionales</Text>

        {EXTRAS.map((extra) => {
          const isSelected = selected.includes(extra.id);
          return (
            <TouchableOpacity
              key={extra.id}
              style={[styles.extraCard, isSelected && styles.extraCardSelected, isSelected && { borderColor: extra.color }]}
              onPress={() => toggle(extra.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.extraIcon, { backgroundColor: extra.color + '20' }]}>
                <Ionicons name={extra.icon} size={20} color={extra.color} />
              </View>
              <View style={styles.extraInfo}>
                <Text style={styles.extraLabel}>{extra.label}</Text>
                <Text style={styles.extraDesc}>{extra.desc}</Text>
              </View>
              <View style={styles.extraRight}>
                <Text style={[styles.extraPrice, { color: extra.color }]}>{extra.price}</Text>
                <View style={[styles.checkbox, isSelected && { backgroundColor: extra.color, borderColor: extra.color }]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={15} color="#6B7280" />
          <Text style={styles.infoText}>Los servicios extra se aplican a todas las prendas del pedido.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal estimado</Text>
          <Text style={styles.totalAmount}>{pricingModel==='PER_WEIGHT'?'Pendiente de pesaje':`${subtotalPreview.toFixed(2)}`}</Text>
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  step: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 16, borderRadius: 2, marginBottom: 10 },
  progressFill: { height: 4, backgroundColor: '#3B82F6', borderRadius: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 16 },
  summaryText: { fontSize: 13, color: '#1D4ED8', fontWeight: '600' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  extraCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 8 },
  extraCardSelected: { backgroundColor: '#F9FAFB' },
  extraIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  extraInfo: { flex: 1 },
  extraLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  extraDesc: { fontSize: 12, color: '#6B7280' },
  extraRight: { alignItems: 'flex-end', gap: 6 },
  extraPrice: { fontSize: 13, fontWeight: '700' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginTop: 8 },
  infoText: { fontSize: 12, color: '#6B7280', flex: 1, lineHeight: 17 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#3B82F6' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 12, padding: 16 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
