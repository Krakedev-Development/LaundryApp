import { View, Text, StyleSheet, Image,TouchableOpacity } from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useAuthStore} from '../../store/useAuthStore';
import { BRAND_ASSETS, BRAND_COLORS } from '../../theme/brand';

export default function PendingScreen() {
  const router=useRouter(),{user,logout}=useAuthStore();
  return (
    <View style={styles.container}>
      <Image source={BRAND_ASSETS.logoName} style={styles.logo} />
      <Ionicons name="time-outline" size={64} color="#0F4C81"/>
      <Text style={styles.title}>{user?.status==='rejected'?'Verificación rechazada':'Cuenta pendiente'}</Text>
      <Text style={styles.subtitle}>Tu cuenta está siendo revisada por un administrador. Te notificaremos cuando sea aprobada.</Text>
      <TouchableOpacity style={{padding:15,backgroundColor:'#0F4C81',borderRadius:12,marginTop:24}} onPress={()=>{logout();router.replace('/(auth)/login');}}><Text style={{color:'white',fontWeight:'600'}}>Volver a iniciar sesión / cambiar cuenta</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  logo: { width: 280, height: 96, resizeMode: 'contain', marginBottom: 10 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: BRAND_COLORS.primary, marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});
