import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { BRAND_ASSETS, BRAND_COLORS } from '../../theme/brand';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cedulaPhoto, setCedulaPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);

  const ensureLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a fotos para subir tu cédula.');
      return false;
    }
    return true;
  };

  const ensureCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la cámara para tomar la selfie.');
      return false;
    }
    return true;
  };

  const pickImage = async (type: 'cedula' | 'selfie') => {
    const hasPermission = await ensureLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      type === 'cedula' ? setCedulaPhoto(uri) : setSelfiePhoto(uri);
    }
  };

  const takeSelfie = async () => {
    const hasPermission = await ensureCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) setSelfiePhoto(result.assets[0].uri);
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !cedulaPhoto || !selfiePhoto) {
      Alert.alert('Error', 'Todos los campos y fotos son obligatorios');
      return;
    }
    // TODO: llamar a authService.register({ name, email, password, cedulaPhoto, selfiePhoto })
    // La cuenta queda en estado 'pending' hasta aprobación del admin
    setUser(
      {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'client',
        status: 'pending',
        cedula_photo: cedulaPhoto,
        selfie_photo: selfiePhoto,
      },
      'mock-pending-token'
    );
    Alert.alert('Registro enviado', 'Tu cuenta quedó pendiente de aprobación.');
    router.replace('/');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Image source={BRAND_ASSETS.logoName} style={styles.logo} />
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Completa tus datos para activar tu cuenta</Text>

      <TextInput style={styles.input} placeholder="Nombre completo" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

      {/* Foto de cédula */}
      <Text style={styles.label}>Foto de cédula</Text>
      <TouchableOpacity style={styles.photoButton} onPress={() => pickImage('cedula')}>
        <Text style={styles.photoButtonText}>
          {cedulaPhoto ? '✅ Cédula cargada' : '📷 Subir foto de cédula'}
        </Text>
      </TouchableOpacity>
      {cedulaPhoto && <Image source={{ uri: cedulaPhoto }} style={styles.preview} />}

      {/* Selfie */}
      <Text style={styles.label}>Selfie de verificación</Text>
      <TouchableOpacity style={styles.photoButton} onPress={takeSelfie}>
        <Text style={styles.photoButtonText}>
          {selfiePhoto ? '✅ Selfie tomada' : '🤳 Tomar selfie'}
        </Text>
      </TouchableOpacity>
      {selfiePhoto && <Image source={{ uri: selfiePhoto }} style={styles.preview} />}

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Registrarme</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20, backgroundColor: '#fff', paddingBottom: 30 },
  logo: { width: 260, height: 92, resizeMode: 'contain', alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4, color: BRAND_COLORS.primary, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 18, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  photoButton: { backgroundColor: BRAND_COLORS.primarySoft, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: BRAND_COLORS.border },
  photoButtonText: { color: BRAND_COLORS.primary, fontWeight: '600' },
  preview: { width: '100%', height: 160, borderRadius: 8, marginBottom: 16, resizeMode: 'cover' },
  button: { backgroundColor: BRAND_COLORS.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
