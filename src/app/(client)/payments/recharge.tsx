import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_CLIENT, MOCK_PAYMENT_METHODS, RECHARGE_AMOUNTS } from '../../../data/mockData';
import { BRAND_COLORS } from '../../../theme/brand';
import AppHeader from '../../../components/layout/AppHeader';

export default function RechargeScreen() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedCard, setSelectedCard] = useState(MOCK_PAYMENT_METHODS[0].id);

  const amount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);
  const bonus = amount >= 30 ? amount * 0.1 : 0;

  const handleConfirm = () => {
    if (!amount || amount < 5) {
      Alert.alert('Monto inválido', 'El monto mínimo de recarga es $5');
      return;
    }
    Alert.alert(
      'Recarga exitosa',
      `Se acreditaron $${(amount + bonus).toFixed(2)} a tu saldo.${bonus > 0 ? `\n(Incluye $${bonus.toFixed(2)} de bono)` : ''}`,
      [{ text: 'Listo', onPress: () => router.back() }]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppHeader title="Recargar saldo" onBack={() => router.back()} />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {/* Saldo actual */}
        <View style={styles.currentBalance}>
          <Text style={styles.currentLabel}>Saldo actual</Text>
          <Text style={styles.currentAmount}>${MOCK_CLIENT.balance.toFixed(2)}</Text>
        </View>

        {/* Montos rápidos */}
        <Text style={styles.sectionLabel}>Selecciona un monto</Text>
        <View style={styles.amountGrid}>
          {RECHARGE_AMOUNTS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.amountChip, selectedAmount === a && styles.amountChipSelected]}
              onPress={() => { setSelectedAmount(a); setCustomAmount(''); }}
            >
              <Text style={[styles.amountText, selectedAmount === a && styles.amountTextSelected]}>
                ${a}
              </Text>
              {a >= 30 && (
                <Text style={[styles.bonusText, selectedAmount === a && styles.bonusTextSelected]}>
                  +{a >= 30 ? '10%' : ''}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Monto personalizado */}
        <Text style={styles.sectionLabel}>O ingresa otro monto</Text>
        <View style={[styles.customInput, customAmount && styles.customInputActive]}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.customInputText}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={customAmount}
            onChangeText={(t) => { setCustomAmount(t); setSelectedAmount(null); }}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Bono */}
        {bonus > 0 && (
          <View style={styles.bonusCard}>
            <Ionicons name="gift-outline" size={18} color="#10B981" />
            <Text style={styles.bonusCardText}>
              Recibes <Text style={styles.bonusCardBold}>${bonus.toFixed(2)} extra</Text> por recargar ${amount}+
            </Text>
          </View>
        )}

        {/* Resumen */}
        {amount > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monto a recargar</Text>
              <Text style={styles.summaryValue}>${amount.toFixed(2)}</Text>
            </View>
            {bonus > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#10B981' }]}>Bono</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>+${bonus.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total acreditado</Text>
              <Text style={styles.summaryTotalValue}>${(amount + bonus).toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Método de pago */}
        <Text style={styles.sectionLabel}>Pagar con</Text>
        {MOCK_PAYMENT_METHODS.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.cardOption, selectedCard === card.id && styles.cardOptionSelected]}
            onPress={() => setSelectedCard(card.id)}
          >
            <Ionicons name="card-outline" size={20} color={selectedCard === card.id ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.cardOptionText, selectedCard === card.id && styles.cardOptionTextSelected]}>
              {card.type.toUpperCase()} •••• {card.last4}
            </Text>
            {selectedCard === card.id && <Ionicons name="checkmark-circle" size={18} color="#3B82F6" />}
          </TouchableOpacity>
        ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmBtn, (!amount || amount < 5) && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!amount || amount < 5}
          >
            <Ionicons name="wallet-outline" size={20} color="#fff" />
            <Text style={styles.confirmBtnText}>
              {amount > 0 ? `Recargar $${amount.toFixed(2)}` : 'Recargar'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 24 },
  currentBalance: { backgroundColor: BRAND_COLORS.primarySoft, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  currentLabel: { fontSize: 13, color: BRAND_COLORS.primary, marginBottom: 4 },
  currentAmount: { fontSize: 32, fontWeight: '700', color: BRAND_COLORS.primaryDark },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  amountChip: { width: '30%', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff', padding: 14, alignItems: 'center' },
  amountChipSelected: { borderColor: BRAND_COLORS.primary, backgroundColor: BRAND_COLORS.primarySoft },
  amountText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  amountTextSelected: { color: BRAND_COLORS.primary },
  bonusText: { fontSize: 11, color: '#10B981', fontWeight: '600', marginTop: 2 },
  bonusTextSelected: { color: '#10B981' },
  customInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, marginBottom: 16 },
  customInputActive: { borderColor: BRAND_COLORS.primary },
  dollarSign: { fontSize: 18, fontWeight: '700', color: '#374151', marginRight: 6 },
  customInputText: { flex: 1, fontSize: 18, color: '#111827', fontWeight: '600' },
  bonusCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, marginBottom: 16 },
  bonusCardText: { fontSize: 13, color: '#374151', flex: 1 },
  bonusCardBold: { fontWeight: '700', color: '#10B981' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4, paddingTop: 10 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  summaryTotalValue: { fontSize: 18, fontWeight: '700', color: BRAND_COLORS.primary },
  cardOption: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#E5E7EB' },
  cardOptionSelected: { borderColor: BRAND_COLORS.primary, backgroundColor: BRAND_COLORS.primarySoft },
  cardOptionText: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  cardOptionTextSelected: { color: BRAND_COLORS.primary, fontWeight: '600' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BRAND_COLORS.primary, borderRadius: 12, padding: 16 },
  confirmBtnDisabled: { backgroundColor: '#D1D5DB' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
