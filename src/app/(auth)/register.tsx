import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cedulaPhoto, setCedulaPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);

  const pickImage = async (type: 'cedula' | 'selfie') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      type === 'cedula' ? setCedulaPhoto(uri) : setSelfiePhoto(uri);
    }
  };

  const takeSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
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
    Alert.alert('Registro enviado', 'Tu cuenta está pendiente de aprobación.');
    navigation.replace('Login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

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
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, color: '#3B82F6' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  photoButton: { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  photoButtonText: { color: '#3B82F6', fontWeight: '600' },
  preview: { width: '100%', height: 160, borderRadius: 8, marginBottom: 16, resizeMode: 'cover' },
  button: { backgroundColor: '#3B82F6', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
