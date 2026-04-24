import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Animated, Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStore, GarmentItem, WashType } from '../../../store/useOrderStore';
import AppHeader from '../../../components/layout/AppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GARMENT_TYPES = [
  { name: 'Camisas', icon: 'shirt-outline' as const },
  { name: 'Pantalones', icon: 'layers-outline' as const },
  { name: 'Vestidos', icon: 'woman-outline' as const },
  { name: 'Ropa interior', icon: 'body-outline' as const },
  { name: 'Calcetines', icon: 'footsteps-outline' as const },
  { name: 'Sabanas', icon: 'bed-outline' as const },
  { name: 'Edredones', icon: 'cloudy-night-outline' as const },
  { name: 'Toallas', icon: 'water-outline' as const },
  { name: 'Chaquetas', icon: 'partly-sunny-outline' as const },
  { name: 'Trajes', icon: 'briefcase-outline' as const },
];

const WASH_TYPES: { id: WashType; label: string; desc: string; price: string; color: string }[] = [
  { id: 'alfombra', label: 'Alfombra', desc: 'Limpieza y secado especializado', price: '$5.60/prenda', color: '#3B82F6' },
  { id: 'blanqueo', label: 'Blanqueo', desc: 'Realce y recuperacion de blancos', price: '$2.50/prenda', color: '#10B981' },
  { id: 'costura', label: 'Costura', desc: 'Ajustes y pequenas reparaciones', price: '$3.60/prenda', color: '#8B5CF6' },
  { id: 'desmanche', label: 'Desmanche', desc: 'Tratamiento puntual de manchas', price: '$2.00/prenda', color: '#F59E0B' },
  { id: 'edredones', label: 'Edredones', desc: 'Proceso especial para volumen', price: '$4.60/prenda', color: '#6366F1' },
  { id: 'lp', label: 'L/P', desc: 'Lavado y planchado', price: '$1.60/prenda', color: '#0EA5E9' },
  { id: 'ls', label: 'L/S', desc: 'Lavado y secado', price: '$1.40/prenda', color: '#14B8A6' },
  { id: 'reproceso', label: 'Reproceso', desc: 'Retrabajo de calidad', price: '$1.00/prenda', color: '#6B7280' },
  { id: 'solo_plancha', label: 'Solo Plancha', desc: 'Planchado por pieza', price: '$1.30/prenda', color: '#EC4899' },
  { id: 'tinturado', label: 'Tinturado', desc: 'Recuperacion o cambio de tono', price: '$4.10/prenda', color: '#7C3AED' },
  { id: 'zapatos', label: 'Zapatos', desc: 'Limpieza especializada de calzado', price: '$6.50/par', color: '#334155' },
];

export default function Step1Garments() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { garments, setGarments } = useOrderStore();
  const [items, setItems] = useState<GarmentItem[]>(garments.length > 0 ? garments : []);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [modalStep, setModalStep] = useState<'form' | 'type' | 'wash'>('form');
  const [selType, setSelType] = useState(GARMENT_TYPES[0].name);
  const [selWash, setSelWash] = useState<WashType>('lp');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [pickerQuery, setPickerQuery] = useState('');
  const stepAnim = useRef(new Animated.Value(1)).current;

  const selectedWashMeta = WASH_TYPES.find((w) => w.id === selWash) ?? WASH_TYPES[0];

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [modalStep, stepAnim]);

  const openAdd = () => {
    setSelType(GARMENT_TYPES[0].name);
    setSelWash('lp');
    setQty(1);
    setNotes('');
    setEditIndex(null);
    setModalStep('form');
    setShowModal(true);
  };

  const openEdit = (i: number) => {
    const g = items[i];
    setSelType(g.type);
    setSelWash(g.washType);
    setQty(g.quantity);
    setNotes(g.notes ?? '');
    setEditIndex(i);
    setModalStep('form');
    setShowModal(true);
  };

  const handleSave = () => {
    const item: GarmentItem = { type: selType, washType: selWash, quantity: qty, notes: notes.trim() || undefined };
    if (editIndex !== null) {
      const updated = [...items];
      updated[editIndex] = item;
      setItems(updated);
    } else {
      setItems((prev) => [...prev, item]);
    }
    setShowModal(false);
    setModalStep('form');
  };
  const normalizeSearch = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const openTypePicker = () => {
    setPickerQuery('');
    setModalStep('type');
  };

  const openWashPicker = () => {
    setPickerQuery('');
    setModalStep('wash');
  };

  const closePickerToForm = () => {
    setPickerQuery('');
    setModalStep('form');
  };


  const handleDelete = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const handleNext = () => {
    setGarments(items);
    router.push('/(client)/new-order/step2-extras');
  };

  const totalItems = items.reduce((s, g) => s + g.quantity, 0);

  return (
    <View style={styles.container}>
      <AppHeader title="Mis prendas" rightText="1 / 5" onBack={() => router.back()} />
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: '20%' }]} /></View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shirt-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Agrega tus prendas</Text>
            <Text style={styles.emptyDesc}>Indica que ropa vas a enviar y que tipo de lavado necesita cada una</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryChip}>
                <Ionicons name="shirt-outline" size={14} color="#3B82F6" />
                <Text style={styles.summaryChipText}>{totalItems} prendas</Text>
              </View>
            </View>

            {items.map((item, i) => {
              const wash = WASH_TYPES.find((w) => w.id === item.washType) ?? WASH_TYPES[0];
              const garmentIcon = GARMENT_TYPES.find((g) => g.name === item.type)?.icon ?? 'shirt-outline';
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
                    {item.notes ? <Text style={styles.garmentNotes}>{item.notes}</Text> : null}
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[styles.nextBtn, items.length === 0 && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={items.length === 0}
        >
          <Text style={styles.nextBtnText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={24}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                {modalStep === 'type'
                  ? 'Selecciona tipo de prenda'
                  : modalStep === 'wash'
                  ? 'Selecciona tipo de lavado'
                  : editIndex !== null
                  ? 'Editar prenda'
                  : 'Agregar prenda'}
              </Text>
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
                <Animated.View
                  style={{
                    opacity: stepAnim,
                    transform: [
                      {
                        translateY: stepAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      },
                    ],
                  }}
                >
                {modalStep === 'form' ? (
                  <>
                    <Text style={styles.modalLabel}>Tipo de prenda</Text>
                    <TouchableOpacity style={styles.selectorField} onPress={openTypePicker}>
                      <View style={styles.selectorLeft}>
                        <Ionicons name={GARMENT_TYPES.find((g) => g.name === selType)?.icon ?? 'shirt-outline'} size={18} color="#374151" />
                        <Text style={styles.selectorText}>{selType}</Text>
                      </View>
                      <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    <Text style={styles.modalLabel}>Tipo de lavado</Text>
                    <TouchableOpacity style={styles.selectorField} onPress={openWashPicker}>
                      <View style={styles.selectorLeft}>
                        <View style={[styles.washOptionIcon, { backgroundColor: selectedWashMeta.color + '20' }]}>
                          <Ionicons name="water-outline" size={14} color={selectedWashMeta.color} />
                        </View>
                        <View>
                          <Text style={styles.selectorText}>{selectedWashMeta.label}</Text>
                          <Text style={styles.selectorSubText}>{selectedWashMeta.price}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    <Text style={styles.modalLabel}>Cantidad</Text>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                        <Ionicons name="remove" size={20} color="#3B82F6" />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{qty}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
                        <Ionicons name="add" size={20} color="#3B82F6" />
                      </TouchableOpacity>
                    </View>

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
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => {
                          setShowModal(false);
                          setModalStep('form');
                        }}
                      >
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>{editIndex !== null ? 'Guardar' : 'Agregar'}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.backToFormBtn} onPress={closePickerToForm}>
                      <Ionicons name="arrow-back" size={16} color="#6B7280" />
                      <Text style={styles.backToFormText}>Volver al formulario</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.searchInput}
                      placeholder={modalStep === 'type' ? 'Buscar prenda...' : 'Buscar tipo de lavado...'}
                      placeholderTextColor="#9CA3AF"
                      value={pickerQuery}
                      onChangeText={setPickerQuery}
                    />
                    {modalStep === 'type'
                      ? GARMENT_TYPES.filter((g) =>
                          normalizeSearch(g.name).includes(normalizeSearch(pickerQuery))
                        ).map((g) => {
                          const isSelected = g.name === selType;
                          return (
                            <TouchableOpacity
                              key={g.name}
                              style={[styles.typeResultItem, isSelected && styles.typeResultItemSelected]}
                              onPress={() => {
                                setSelType(g.name);
                                closePickerToForm();
                              }}
                            >
                              <Ionicons name={g.icon} size={18} color={isSelected ? '#fff' : '#374151'} />
                              <Text style={[styles.typeResultText, isSelected && styles.typeResultTextSelected]}>{g.name}</Text>
                            </TouchableOpacity>
                          );
                        })
                      : WASH_TYPES.filter((w) =>
                          normalizeSearch(`${w.label} ${w.desc}`).includes(normalizeSearch(pickerQuery))
                        ).map((w) => {
                          const isSelected = w.id === selWash;
                          return (
                            <TouchableOpacity
                              key={w.id}
                              style={[styles.washOption, isSelected && styles.washOptionSelected, isSelected && { borderColor: w.color }]}
                              onPress={() => {
                                setSelWash(w.id);
                                closePickerToForm();
                              }}
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
                          );
                        })}
                  </>
                )}
                </Animated.View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalScroll: { flexGrow: 0 },
  modalScrollContent: { paddingBottom: 12 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  selectorField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  selectorText: { fontSize: 14, color: '#111827', fontWeight: '600' },
  selectorSubText: { fontSize: 11, color: '#6B7280' },
  backToFormBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  backToFormText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  searchInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 10,
  },
  typeResultItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  typeResultItemSelected: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  typeResultText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  typeResultTextSelected: { color: '#fff' },
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
