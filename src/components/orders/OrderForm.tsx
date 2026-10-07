import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { GarmentType, ServiceType } from '../../types';

const GARMENTS: { label: string; value: GarmentType }[] = [
  { label: 'Ropa normal', value: 'ropa_normal' },
  { label: 'Ropa delicada', value: 'ropa_delicada' },
  { label: 'Sábanas', value: 'sabanas' },
  { label: 'Edredón', value: 'edredon' },
];

const SERVICES: { label: string; value: ServiceType }[] = [
  { label: 'Solo lavado', value: 'lavado' },
  { label: 'Lavado + planchado', value: 'lavado_planchado' },
  { label: 'Solo planchado', value: 'solo_planchado' },
];

interface OrderFormProps {
  onSubmit: (data: { garment: GarmentType; service: ServiceType }) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSubmit }) => {
  const [garment, setGarment] = useState<GarmentType | null>(null);
  const [service, setService] = useState<ServiceType | null>(null);

  const handleSubmit = () => {
    if (!garment || !service) {
      Alert.alert('Error', 'Selecciona tipo de prenda y servicio');
      return;
    }
    onSubmit({ garment, service });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Tipo de prenda</Text>
      {GARMENTS.map((g) => (
        <TouchableOpacity
          key={g.value}
          style={[styles.option, garment === g.value && styles.optionSelected]}
          onPress={() => setGarment(g.value)}
        >
          <Text style={styles.optionText}>{g.label}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>Servicio</Text>
      {SERVICES.map((s) => (
        <TouchableOpacity
          key={s.value}
          style={[styles.option, service === s.value && styles.optionSelected]}
          onPress={() => setService(s.value)}
        >
          <Text style={styles.optionText}>{s.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Confirmar pedido</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  option: {
    padding: 14, borderRadius: 8, borderWidth: 1,
    borderColor: '#D1D5DB', marginBottom: 8, backgroundColor: '#fff',
  },
  optionSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  optionText: { fontSize: 15, color: '#374151' },
  button: {
    backgroundColor: '#3B82F6', borderRadius: 8,
    padding: 14, alignItems: 'center', marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default OrderForm;
