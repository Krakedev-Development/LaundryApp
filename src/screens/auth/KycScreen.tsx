import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLaundry } from '../../store/LaundryStore';
import { Colors } from '../../theme/colors';

export const KycScreen = ({ navigation }: any) => {
  const { customer, submitKyc } = useLaundry();
  const [docType, setDocType] = useState('DNI / Cédula');
  const [docNumber, setDocNumber] = useState(customer.billingTaxId || '10458921345');

  const handleSubmit = () => {
    if (!docNumber.trim()) {
      Alert.alert('Error', 'Por favor ingresa el número de documento.');
      return;
    }
    submitKyc(docType, docNumber.trim());
    Alert.alert(
      'Documentos Recibidos',
      'Tu verificación de identidad ha pasado a estado Pendiente de validación.',
      [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
        <Text style={styles.title}>Validación de Identidad KYC</Text>
        <Text style={styles.desc}>
          Para garantizar la seguridad y entrega de prendas de alto valor, validamos la identidad de nuestros usuarios.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tipo de Documento</Text>
        <TextInput style={styles.input} value={docType} onChangeText={setDocType} />

        <Text style={[styles.label, { marginTop: 12 }]}>Número de Documento</Text>
        <TextInput style={styles.input} value={docNumber} onChangeText={setDocNumber} />
      </View>

      <View style={styles.photoBox}>
        <Ionicons name="camera-outline" size={28} color={Colors.primary} />
        <Text style={styles.photoTitle}>Foto de Documento (Frontal y Reverso)</Text>
        <Text style={styles.photoSub}>Toca para adjuntar fotografía</Text>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>Enviar Verificación</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 8 },
  desc: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  photoBox: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primaryLight,
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  photoTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 6 },
  photoSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
