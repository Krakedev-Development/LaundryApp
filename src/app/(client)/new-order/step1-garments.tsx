import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStore, GarmentItem, WashType, GARMENT_WEIGHTS } from '../../../store/useOrderStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const GARMENT_TYPES = [
  { name: 'Camisas',       icon: 'shirt-outline' as const },
  { name: 'Pantalones',    icon: 'layers-outline' as const },
  { name: 'Vestidos',      icon: 'woman-outline' as const },
  { name: 'Ropa interior', icon: 'body-outline' as const },
  { name: 'Calcetines',    icon: 'footsteps-outline' as const },
  { name: 'Sábanas',       icon: 'bed-outline' as const },
  { name: 'Edredones',     icon: 'cloudy-night-outline' as const },
  { name: 'Toallas',       icon: 'water-outline' as const },
  { name: 'Chaquetas',     icon: 'partly-sunny-outline' as const },
  { name: 'Trajes',        icon: 'briefcase-outline' as const },
];

const WASH_TYPES: { id: WashType; label: string; desc: string; price: string; color: string }[] = [
  { id: 'wash_fold',  label: 'Lavado y doblado', desc: 'Lavado, secado y doblado',    price: '$1.25/lb', color: '#3B82F6' },
  { id: 'wash_only',  label: 'Solo lavado',       desc: 'Lavado y secado sin doblar',  price: '$0.90/lb', color: '#10B981' },
  { id: 'dry_clean',  label: 'Lavado en seco',    desc: 'Para prendas delicadas',      price: '$3.50/lb', color: '#7C3AED' },
  { id: 'iron',       label: 'Solo planchado',    desc: 'Planchado profesional',       price: '$1.50/lb', color: '#F59E0B' },
];

export default function Step1Garments() {
  const router = useRouter();
  const { garments, setGarments } = useOrderStore();
  const [items, setItems] = useState<GarmentItem[]>(garments.length > 0 ? garments : []);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Estado del modal
  const [selType, setSelType] = useState(GARMENT_TYPES[0].name);
  const [selWash, setSelWash] = useState<WashType>('wash_fold');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  const openAdd = () => {
    setSelType(GARMENT_TYPES[0].name);
    setSelWash('wash_fold');
    setQty(1);
    setNotes('');
    setEditIndex(null);
    setShowModal(true);
  };

  const openEdit = (i: number) => {
    const g = items[i];
    setSelType(g.type);
    setSelWash(g.washType);
    setQty(g.quantity);
    setNotes(g.notes ?? '');
    setEditIndex(i);
    setShowModal(true);
  };

  const handleSave = () => {
    const item: GarmentItem = { type: selType, washType: selWash, quantity: qty, notes: notes.trim() || undefined };
    if (editIndex !== null) {
      const updated = [...items];
      updated[editIndex] = item;
      setItems(updated);
    } else {
      setItems(prev => [...prev, item]);
    }
    setShowModal(false);
  };

  const handleDelete = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleNext = () => {
    setGarments(items);
    router.push('/(client)/new-order/step2-extras');
  };

  const totalItems = items.reduce((s, g) => s + g.quantity, 0);
  const estWeight = items.reduce((s, g) => s + g.quantity * (GARMENT_WEIGHTS[g.type] ?? 0.3), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Mis prendas</Text>
        <Text style={styles.step}>1 / 5</Text>
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: '20%' }]} /></View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shirt-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Agrega tus prendas</Text>
            <Text style={styles.emptyDesc}>Indica qué ropa vas a enviar y qué tipo de lavado necesita cada una</Text>
          </View>
        ) : (
          <>
            {/* Resumen */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryChip}>
                <Ionicons name="shirt-outline" size={14} color="#3B82F6" />
                <Text style={styles.summaryChipText}>{totalItems} prendas</Text>
              </View>
              <View style={styles.summaryChip}>
                <Ionicons name="scale-outline" size={14} color="#10B981" />
                <Text style={styles.summaryChipText}>~{estWeight.toFixed(1)} kg</Text>
              </View>
            </View>

            {/* Lista de prendas */}
            {items.map((item, i) => {
              const wash = WASH_TYPES.find(w => w.id === item.washType)!;
              const garmentIcon = GARMENT_TYPES.find(g => g.name === item.type)?.icon ?? 'shirt-outline';
              return (
                <View key={i} style={styles.garmentCard}>
                  <View style={[styles.garmentIconBox, { backgroundColor: wash.color + '20' }]}>
                    <Ionicons name={garmentIcon} size={22} color={wash.color} />
                  </View>
                  <View style={styles.garmentInfo}>
                    <View style={styles.garmentTitleRow}>
                      <Text style={styles.garmentType}>{item.type}</Text>
                      <View style={[styles.washBadge, { backgroundColor: wash.color + '20' }]}>
                        <Text style={[styles.washBadgeText, { color: wash.color }]}>{wash.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.garmentQty}>{item.quantity} {item.quantity === 1 ? 'prenda' : 'prendas'}</Text>
                    {item.notes && <Text style={styles.garmentNotes}>{item.notes}</Text>}
                  </View>
                  <View style={styles.garmentActions}>
                    <TouchableOpacity onPress={() => openEdit(i)} style={styles.actionBtn}>
                      <Ionicons name="pencil-outline" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(i)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.addBtnText}>Agregar prenda</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, items.length === 0 && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={items.length === 0}
        >
          <Text style={styles.nextBtnText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal agregar/editar prenda */}
      <Modal visible={showModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editIndex !== null ? 'Editar prenda' : 'Agregar prenda'}</Text>

            {/* Tipo de prenda */}
            <Text style={styles.modalLabel}>Tipo de prenda</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll} keyboardShouldPersistTaps="handled">
              {GARMENT_TYPES.map((g) => (
                <TouchableOpacity
                  key={g.name}
                  style={[styles.typeChip, selType === g.name && styles.typeChipSelected]}
                  onPress={() => setSelType(g.name)}
                >
                  <Ionicons name={g.icon} size={18} color={selType === g.name ? '#fff' : '#374151'} />
                  <Text style={[styles.typeChipText, selType === g.name && styles.typeChipTextSelected]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tipo de lavado */}
            <Text style={styles.modalLabel}>Tipo de lavado</Text>
            {WASH_TYPES.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[styles.washOption, selWash === w.id && styles.washOptionSelected, selWash === w.id && { borderColor: w.color }]}
                onPress={() => setSelWash(w.id)}
              >
                <View style={[styles.washOptionIcon, { backgroundColor: w.color + '20' }]}>
                  <Ionicons name="water-outline" size={16} color={w.color} />
                </View>
                <View style={styles.washOptionInfo}>
                  <Text style={styles.washOptionLabel}>{w.label}</Text>
                  <Text style={styles.washOptionDesc}>{w.desc}</Text>
                </View>
                <Text style={[styles.washOptionPrice, { color: w.color }]}>{w.price}</Text>
              </TouchableOpacity>
            ))}

            {/* Cantidad */}
            <Text style={styles.modalLabel}>Cantidad</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(q => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={20} color="#3B82F6" />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => q + 1)}>
                <Ionicons name="add" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            {/* Notas */}
            <Text style={styles.modalLabel}>Notas especiales (opcional)</Text>
            <View style={styles.notesInput}>
              <TextInput
                style={styles.notesText}
                placeholder="Ej: mancha en el cuello, color delicado..."
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editIndex !== null ? 'Guardar' : 'Agregar'}</Text>
              </TouchableOpacity>
            </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
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
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 12, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 19 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  summaryChipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  garmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  garmentIconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  garmentInfo: { flex: 1 },
  garmentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  garmentType: { fontSize: 14, fontWeight: '700', color: '#111827' },
  washBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  washBadgeText: { fontSize: 10, fontWeight: '700' },
  garmentQty: { fontSize: 12, color: '#6B7280' },
  garmentNotes: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontStyle: 'italic' },
  garmentActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#3B82F6', borderRadius: 12, padding: 14, marginTop: 8, borderStyle: 'dashed' },
  addBtnText: { color: '#3B82F6', fontWeight: '600', fontSize: 15 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 12, padding: 16 },
  nextBtnDisabled: { backgroundColor: '#D1D5DB' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  typeScroll: { marginBottom: 4 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', marginRight: 8, backgroundColor: '#F9FAFB' },
  typeChipSelected: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  typeChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  typeChipTextSelected: { color: '#fff' },
  washOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, marginBottom: 6 },
  washOptionSelected: { backgroundColor: '#F0F7FF' },
  washOptionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  washOptionInfo: { flex: 1 },
  washOptionLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  washOptionDesc: { fontSize: 11, color: '#6B7280' },
  washOptionPrice: { fontSize: 13, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 4 },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 28, fontWeight: '700', color: '#111827', minWidth: 40, textAlign: 'center' },
  notesInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, minHeight: 60, marginBottom: 4 },
  notesText: { fontSize: 14, color: '#111827' },
  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 2, backgroundColor: '#3B82F6', borderRadius: 10, padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
