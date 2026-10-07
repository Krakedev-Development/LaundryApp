import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../layout/AppHeader';
import { useRouter } from 'expo-router';
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 20, paddingBottom: 45, gap: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DFE8F2',
    gap: 12,
    shadowColor: '#0A3660',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  title: { fontSize: 23, fontWeight: '700', color: '#0A3660' },
  subtitle: { fontSize: 17, fontWeight: '700', color: '#0A3660' },
  text: { fontSize: 14, color: '#203B59', lineHeight: 21 },
  muted: { fontSize: 12, color: '#6A82A0', lineHeight: 18 },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CDDCEB',
    borderRadius: 12,
    backgroundColor: '#F7F9FC',
    padding: 13,
    fontSize: 14,
    color: '#183F68',
  },
  button: {
    borderRadius: 12,
    backgroundColor: '#0F4C81',
    paddingVertical: 13,
    paddingHorizontal: 17,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  outline: {
    borderWidth: 1,
    borderColor: '#CBDCEC',
    borderRadius: 12,
    padding: 12,
  },
  warning: { backgroundColor: '#FFF8E6', borderRadius: 12, padding: 14 },
  selected: {
    borderColor: '#0F4C81',
    backgroundColor: '#EDF5FC',
    borderWidth: 2,
  },
  badge: { color: '#0F4C81', fontWeight: '600', fontSize: 12 },
  code: { fontSize: 28, fontWeight: '700', letterSpacing: 4, color: '#0A3660' },
  divider: { height: 1, backgroundColor: '#E4ECF5' },
  link: { fontSize: 14, color: '#0F4C81', fontWeight: '600' },
  error: { color: '#B42335', fontSize: 14 },
});
export function Screen({
  title,
  children,
  back = true,
}: { title: string; back?: boolean } & PropsWithChildren) {
  const router = useRouter();
  return (
    <View style={ui.page}>
      <AppHeader
        title={title}
        onBack={
          back
            ? () => (router.canGoBack() ? router.back() : router.replace('/'))
            : undefined
        }
      />
      <ScrollView
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}
export function Card({ children }: PropsWithChildren) {
  return <View style={ui.card}>{children}</View>;
}
export function Action({
  label,
  onPress,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={[ui.button, disabled && { opacity: 0.4 }]}
    >
      {icon && <Ionicons name={icon} color="#FFF" size={18} />}
      <Text style={ui.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}
export function Loading() {
  return (
    <View style={[ui.page, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator color="#0F4C81" />
      <Text style={ui.text}>Cargando datos locales…</Text>
    </View>
  );
}
