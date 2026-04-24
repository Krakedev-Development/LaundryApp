import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/layout/AppHeader';
import { BRAND_COLORS } from '../../theme/brand';
import { useBillingStore, BillingData } from '../../store/useBillingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function sameData(a: BillingData, b: BillingData) {
  return (
    a.name === b.name &&
    a.idDoc === b.idDoc &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.address === b.address
  );
}

function loadDraftFromStores(): BillingData {
  const s = useBillingStore.getState();
  const u = useAuthStore.getState().user;
  return {
    name: s.name || u?.name?.trim() || '',
    idDoc: s.idDoc,
    email: s.email || u?.email?.trim() || '',
    phone: s.phone,
    address: s.address,
  };
}

export default function BillingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saved = useBillingStore();
  const setAllBilling = useBillingStore((st) => st.setAll);

  const [draft, setDraft] = useState<BillingData>(loadDraftFromStores);

  useFocusEffect(
    useCallback(() => {
      setDraft(loadDraftFromStores());
    }, []),
  );

  const update = useCallback((key: keyof BillingData, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  const savedSnapshot: BillingData = {
    name: saved.name,
    idDoc: saved.idDoc,
    email: saved.email,
    phone: saved.phone,
    address: saved.address,
  };

  const dirtyVsSaved = !sameData(draft, savedSnapshot);

  const handleSave = () => {
    setAllBilling({ ...draft });
    Alert.alert('Datos guardados', 'Tu información de facturación quedó guardada en tu perfil.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleExitWithoutSave = () => {
    if (!dirtyVsSaved) {
      router.back();
      return;
    }
    Alert.alert('¿Salir sin guardar?', 'Los cambios no se guardarán en tu perfil.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Salir sin guardar', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Datos de facturación" subtitle="Para boletas y facturas" onBack={handleExitWithoutSave} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 20) }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Ionicons name="document-text-outline" size={22} color={BRAND_COLORS.primary} />
            </View>
            <Text style={styles.introText}>
              Completa o actualiza tus datos fiscales. Usa «Guardar» para conservarlos o «Salir sin guardar» para descartar cambios.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={[styles.label, styles.labelFirst]}>Nombre o razón social</Text>
            <TextInput
              style={styles.input}
              value={draft.name}
              onChangeText={(t) => update('name', t)}
              placeholder="Ej: Juan Pérez / Mi Empresa S.A."
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>CI o RUC</Text>
            <TextInput
              style={styles.input}
              value={draft.idDoc}
              onChangeText={(t) => update('idDoc', t)}
              placeholder="1712345678 o 1790012345001"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              value={draft.email}
              onChangeText={(t) => update('email', t)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="correo@dominio.com"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={draft.phone}
              onChangeText={(t) => update('phone', t)}
              keyboardType="phone-pad"
              placeholder="0991234567"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Dirección fiscal</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={draft.address}
              onChangeText={(t) => update('address', t)}
              placeholder="Calle, número, ciudad"
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} activeOpacity={0.9}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Guardar datos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleExitWithoutSave} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Salir sin guardar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND_COLORS.background },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingTop: 8 },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  introIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 19, fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 20,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, marginTop: 14 },
  labelFirst: { marginTop: 0 },
  input: {
    borderWidth: 1.2,
    borderColor: BRAND_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 6,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 14 },
  secondaryBtnText: { color: '#64748B', fontWeight: '700', fontSize: 15 },
});
