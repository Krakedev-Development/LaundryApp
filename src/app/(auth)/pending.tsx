import { View, Text, StyleSheet, Image } from 'react-native';
import { BRAND_ASSETS, BRAND_COLORS } from '../../theme/brand';

export default function PendingScreen() {
  return (
    <View style={styles.container}>
      <Image source={BRAND_ASSETS.logoName} style={styles.logo} />
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>Cuenta pendiente</Text>
      <Text style={styles.subtitle}>Tu cuenta está siendo revisada por un administrador. Te notificaremos cuando sea aprobada.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  logo: { width: 220, height: 72, resizeMode: 'contain', marginBottom: 10 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: BRAND_COLORS.primary, marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});
