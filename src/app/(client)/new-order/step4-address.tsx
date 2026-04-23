import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStore } from '../../../store/useOrderStore';
import { MOCK_CLIENT } from '../../../data/mockData';

const SAVED_ADDRESSES = [
  { id: '1', label: 'Casa', address: MOCK_CLIENT.address, icon: 'home-outline' as const },
  { id: '2', label: 'Trabajo', address: 'Av. 6 de Diciembre N33-12, Quito', icon: 'business-outline' as const },
];

export default function Step4Address() {
  const router = useRouter();
  const { setAddress } = useOrderStore();
  const [selected, setSelected] = useState<string | null>('1');
  const [custom, setCustom] = useState('');

  const handleNext = () => {
    const addr = selected
      ? SAVED_ADDRESSES.find((a) => a.id === selected)?.address ?? ''
      : custom;
    if (!addr) return;
    setAddress(addr);
    router.push('/(client)/new-order/step5-confirm');
  };

  const canContinue = selected || custom.trim().length > 5;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Dirección</Text>
          <Text style={styles.step}>4 / 5</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '80%' }]} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.sectionLabel}>Direcciones guardadas</Text>

        {SAVED_ADDRESSES.map((addr) => (
          <TouchableOpacity
            key={addr.id}
            style={[styles.addressCard, selected === addr.id && styles.addressCardSelected]}
            onPress={() => { setSelected(addr.id); setCustom(''); }}
          >
            <View style={[styles.addrIcon, selected === addr.id && styles.addrIconSelected]}>
              <Ionicons name={addr.icon} size={20} color={selected === addr.id ? '#fff' : '#3B82F6'} />
            </View>
            <View style={styles.addrInfo}>
              <Text style={styles.addrLabel}>{addr.label}</Text>
              <Text style={styles.addrText} numberOfLines={1}>{addr.address}</Text>
            </View>
            {selected === addr.id && <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>O ingresa una nueva</Text>
        <View style={[styles.inputBox, custom.length > 0 && styles.inputBoxActive]}>
          <Ionicons name="location-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Escribe la dirección completa"
            value={custom}
            onChangeText={(t) => { setCustom(t); setSelected(null); }}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, !canContinue && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canContinue}
          >
            <Text style={styles.nextBtnText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  addressCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 10,
  },
  addressCardSelected: { borderColor: '#3B82F6', backgroundColor: '#F0F7FF' },
  addrIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  addrIconSelected: { backgroundColor: '#3B82F6' },
  addrInfo: { flex: 1 },
  addrLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  addrText: { fontSize: 12, color: '#6B7280' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12,
  },
  inputBoxActive: { borderColor: '#3B82F6' },
  input: { flex: 1, fontSize: 14, color: '#111827' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#3B82F6', borderRadius: 12, padding: 16,
  },
  nextBtnDisabled: { backgroundColor: '#D1D5DB' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
