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

export const DriverConfirmationsScreen = ({ route, navigation }: any) => {
  const { orderId, type } = route.params || { orderId: 'SOL-4587', type: 'PICKUP' };
  const { orders, driverConfirmPickup, driverConfirmDelivery } = useLaundry();

  const order = orders.find((o) => o.id === orderId) || orders[0];

  const [garmentCount, setGarmentCount] = useState(
    order?.items.reduce((s, i) => s + i.quantity, 0).toString() || '7'
  );
  const [recipientName, setRecipientName] = useState(order?.customerName || '');
  const [relation, setRelation] = useState('Titular / Cliente');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (type === 'PICKUP') {
      const count = parseInt(garmentCount, 10) || 0;
      driverConfirmPickup(order.id, count, notes);
      Alert.alert(
        '¡Recogida Confirmada!',
        `Se han registrado ${count} prendas para ${order.id}.`,
        [{ text: 'Volver a Ruta', onPress: () => navigation.goBack() }]
      );
    } else {
      if (!recipientName.trim()) {
        Alert.alert('Atención', 'Por favor ingresa el nombre de quien recibe.');
        return;
      }
      driverConfirmDelivery(order.id, recipientName.trim(), relation, notes);
      Alert.alert(
        '¡Entrega Exitosa!',
        `Pedido ${order.id} entregado a ${recipientName}.`,
        [{ text: 'Volver a Ruta', onPress: () => navigation.goBack() }]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {type === 'PICKUP' ? 'Confirmación de Recogida' : 'Confirmación de Entrega'}
        </Text>
        <Text style={styles.orderCode}>{order?.id} • {order?.customerName}</Text>
      </View>

      {type === 'PICKUP' ? (
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Cantidad de prendas contadas en mano</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={garmentCount}
            onChangeText={setGarmentCount}
          />

          <Text style={styles.subText}>
            Prendas registradas en la orden: {order?.items.reduce((s, i) => s + i.quantity, 0)}
          </Text>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Observaciones de recepción</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            multiline
            placeholder="Ej. Bolsa azul, manchas previas en camisa blanca..."
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Nombre de quien recibe</Text>
          <TextInput
            style={styles.input}
            value={recipientName}
            onChangeText={setRecipientName}
          />

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Parentesco o Relación</Text>
          <TextInput
            style={styles.input}
            value={relation}
            onChangeText={setRelation}
            placeholder="Ej. Titular, Familiar, Conserjería..."
          />

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Notas de entrega</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            multiline
            placeholder="Ej. Entregado en recepción con firma..."
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      )}

      {/* Simulated Photo Evidence Box */}
      <View style={styles.evidenceBox}>
        <Ionicons name="camera" size={32} color={Colors.primary} />
        <Text style={styles.evidenceTitle}>Evidencia Fotográfica</Text>
        <Text style={styles.evidenceSub}>Foto de las prendas o de la entrega registrada</Text>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleConfirm}>
        <Text style={styles.submitBtnText}>
          {type === 'PICKUP' ? 'Registrar Recogida' : 'Completar Entrega'}
        </Text>
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
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  orderCode: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  subText: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
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
  evidenceBox: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primaryLight,
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  evidenceTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 8 },
  evidenceSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
