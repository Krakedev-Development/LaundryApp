import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_COLORS } from '../../../theme/brand';

function formatCardNumber(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val: string) {
  const clean = val.replace(/\D/g, '').slice(0, 4);
  if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2);
  return clean;
}

export default function AddCardScreen() {
  const router = useRouter();
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const canSave = number.replace(/\s/g, '').length === 16 && holder.length > 2 && expiry.length === 5 && cvv.length >= 3;

  const handleSave = () => {
    Alert.alert('Tarjeta agregada', 'Tu tarjeta fue guardada correctamente.', [
      { text: 'Listo', onPress: () => router.back() }
    ]);
  };

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
          <Text style={styles.title}>Agregar tarjeta</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {/* Preview tarjeta */}
        <View style={styles.cardPreview}>
          <View style={styles.cardPreviewTop}>
            <Ionicons name="wifi-outline" size={22} color="rgba(255,255,255,0.7)" style={{ transform: [{ rotate: '90deg' }] }} />
            <Ionicons name="card-outline" size={28} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.cardPreviewNumber}>
            {number || '•••• •••• •••• ••••'}
          </Text>
          <View style={styles.cardPreviewBottom}>
            <View>
              <Text style={styles.cardPreviewLabel}>Titular</Text>
              <Text style={styles.cardPreviewValue}>{holder || 'NOMBRE APELLIDO'}</Text>
            </View>
            <View>
              <Text style={styles.cardPreviewLabel}>Vence</Text>
              <Text style={styles.cardPreviewValue}>{expiry || 'MM/AA'}</Text>
            </View>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Número de tarjeta</Text>
          <View style={styles.inputBox}>
            <Ionicons name="card-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              value={number}
              onChangeText={(t) => setNumber(formatCardNumber(t))}
              keyboardType="number-pad"
              maxLength={19}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Text style={styles.fieldLabel}>Nombre del titular</Text>
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Como aparece en la tarjeta"
              value={holder}
              onChangeText={setHolder}
              autoCapitalize="characters"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Vencimiento</Text>
              <View style={styles.inputBox}>
                <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="MM/AA"
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>CVV</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="•••"
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.secureNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
          <Text style={styles.secureText}>Tus datos están cifrados y protegidos</Text>
        </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Guardar tarjeta</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 24 },
  cardPreview: { backgroundColor: BRAND_COLORS.primary, borderRadius: 16, padding: 20, marginBottom: 24, aspectRatio: 1.6 },
  cardPreviewTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardPreviewNumber: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 2, marginBottom: 20 },
  cardPreviewBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardPreviewLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  cardPreviewValue: { fontSize: 13, fontWeight: '700', color: '#fff' },
  form: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, backgroundColor: '#fff' },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  secureNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 16 },
  secureText: { fontSize: 12, color: '#6B7280' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BRAND_COLORS.primary, borderRadius: 12, padding: 16 },
  saveBtnDisabled: { backgroundColor: '#D1D5DB' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
