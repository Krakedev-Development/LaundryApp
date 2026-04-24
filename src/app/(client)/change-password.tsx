import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../../components/layout/AppHeader';
import { BRAND_COLORS } from '../../theme/brand';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = () => {
    if (!current.trim() || !next.trim() || !confirm.trim()) {
      Alert.alert('Faltan datos', 'Completa todos los campos.');
      return;
    }
    if (next.length < 8) {
      Alert.alert('Contraseña débil', 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('No coinciden', 'La confirmación debe ser igual a la nueva contraseña.');
      return;
    }
    Alert.alert(
      'Contraseña actualizada',
      'En esta versión de demostración no hay servidor: tu cambio se simuló correctamente.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Cambiar contraseña" subtitle="Protege tu cuenta" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hint}>
            <Ionicons name="shield-checkmark-outline" size={22} color={BRAND_COLORS.primary} />
            <Text style={styles.hintText}>
              Usa una contraseña que no reutilices en otros sitios. Mínimo 8 caracteres.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={[styles.label, styles.labelFirst]}>Contraseña actual</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={current}
                onChangeText={setCurrent}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowCurrent((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nueva contraseña</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={next}
                onChangeText={setNext}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showNext}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowNext((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={showNext ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirmar nueva contraseña</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repite la nueva contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>Actualizar contraseña</Text>
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
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: BRAND_COLORS.primarySoft,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  hintText: { flex: 1, fontSize: 13, color: BRAND_COLORS.text, lineHeight: 19 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 20,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 12 },
  labelFirst: { marginTop: 0 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: BRAND_COLORS.border,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingRight: 4,
  },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  eyeBtn: { padding: 10 },
  primaryBtn: {
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
