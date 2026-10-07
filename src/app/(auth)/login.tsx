import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import {useOrderStore} from '../../store/useOrderStore';
import { MOCK_USERS } from '../../data/mockUsers';
import {Ionicons} from '@expo/vector-icons';
import {useBusinessStore} from '../../store/useBusinessStore';
import { BRAND_ASSETS, BRAND_COLORS } from '../../theme/brand';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setLoading, isLoading } = useAuthStore();

  const business=useBusinessStore(s=>s.state);
  const accounts=[...MOCK_USERS,...(business?.accounts??[])];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setLoading(true);

    // Mock login — busca el usuario en la lista
    const found = accounts.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password
    );

    setTimeout(() => {
      setLoading(false);
      if (found) {
        if(found.user.role==='client'){const draft=useOrderStore.getState(),owner=found.user.customerId??'c1';if(draft.customerId!==owner)draft.reset();draft.setBusinessDraft({customerId:owner});}
        const c=business?.customers.find(c=>c.id===(found.user.customerId??'c1'));
        setUser({...found.user,facilityId:found.user.role==='admin'?(found.user.facilityId??'FAC-02'):found.user.facilityId,status:found.user.role==='client'&&c?(c.kycStatus==='APPROVED'?'approved':c.kycStatus==='REJECTED'?'rejected':'pending'):found.user.status}, 'mock-token-123');
        router.replace('/');
      } else {
        Alert.alert('Error', 'Credenciales incorrectas');
      }
    }, 600);
  };

  const openForgotPassword = () => {
    setForgotEmail(email.trim().toLowerCase());
    setResetSentEmail(null);
    setShowForgotModal(true);
  };

  const handleSendReset = () => {
    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      Alert.alert('Correo inválido', 'Ingresa un correo válido para continuar.');
      return;
    }

    setIsSendingReset(true);
    setTimeout(() => {
      setIsSendingReset(false);
      setResetSentEmail(targetEmail);
    }, 900);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Image source={BRAND_ASSETS.logoName} style={styles.logo} />
        <Text style={styles.subtitle}>Inicia sesión</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'center',marginBottom:16}}>{MOCK_USERS.filter(a=>['cliente@demo.laundry','chofer@demo.laundry','admin@test.com','supervisor@demo.laundry'].includes(a.email)).map(a=><TouchableOpacity key={a.email} style={{borderRadius:10,borderWidth:1,borderColor:'#CADDEC',padding:9}} onPress={()=>{setEmail(a.email);setPassword(a.password);}}><Text style={{fontSize:12,color:'#0F4C81'}}>{a.user.role==='client'?'Cliente':a.user.role==='driver'?'Chofer':a.user.role==='supervisor'?'Supervisor':'Administrador'} demo</Text></TouchableOpacity>)}</View>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
        <TouchableOpacity onPress={openForgotPassword} style={styles.forgotWrap}>
          <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>

        <Modal visible={showForgotModal} transparent animationType="fade" onRequestClose={() => setShowForgotModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconWrap}>
                    <Ionicons name="lock-closed-outline" size={32} color="#0F4C81"/>
                  </View>
                  <Text style={styles.modalTitle}>¿Olvidaste tu contraseña?</Text>
                  <Text style={styles.modalText}>
                    {resetSentEmail
                      ? 'Listo, simulamos el envío de tu enlace de recuperación.'
                      : 'Ingresa tu correo y te enviaremos un enlace para restablecerla.'}
                  </Text>
                </View>

                {!resetSentEmail ? (
                  <>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Correo electrónico"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <View style={styles.modalActions}>
                      <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowForgotModal(false)}>
                        <Text style={styles.modalCancelText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalSendBtn, isSendingReset && { opacity: 0.7 }]}
                        onPress={handleSendReset}
                        disabled={isSendingReset}
                      >
                        {isSendingReset ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.modalSendText}>Enviar enlace</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.successBox}>
                    <Text style={styles.successEmail}>{resetSentEmail}</Text>
                    <Text style={styles.successHint}>Revisa tu bandeja principal o spam.</Text>
                    <TouchableOpacity
                      style={styles.modalSendBtn}
                      onPress={() => setShowForgotModal(false)}
                    >
                      <Text style={styles.modalSendText}>Entendido</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: BRAND_COLORS.surface },
  logo: { width: 280, height: 100, resizeMode: 'contain', alignSelf: 'center', marginBottom: 14 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#6B7280', marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    padding: 12, marginBottom: 16, fontSize: 16,
  },
  button: {
    backgroundColor: BRAND_COLORS.primary, borderRadius: 8,
    padding: 14, alignItems: 'center', marginBottom: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 14 },
  forgotLink: { color: BRAND_COLORS.primary, fontSize: 13, fontWeight: '600' },
  link: { textAlign: 'center', color: BRAND_COLORS.accentDark, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  modalHeader: { alignItems: 'center', marginBottom: 10 },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalIcon: { fontSize: 24 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  modalText: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 4, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalCancelText: { color: '#6B7280', fontWeight: '600' },
  modalSendBtn: {
    flex: 1,
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalSendText: { color: '#fff', fontWeight: '700' },
  successBox: { alignItems: 'center', marginTop: 4 },
  successEmail: { fontSize: 14, color: '#111827', fontWeight: '700', marginBottom: 4 },
  successHint: { fontSize: 12, color: '#6B7280', marginBottom: 14 },
});
