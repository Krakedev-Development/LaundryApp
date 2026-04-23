import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, Keyboard, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStore } from '../../../store/useOrderStore';
import { MOCK_CLIENT, MOCK_PAYMENT_METHODS } from '../../../data/mockData';
import { SafeAreaView } from 'react-native-safe-area-context';

const WASH_LABELS: Record<string, string> = {
  wash_fold: 'Lavado y doblado',
  wash_only: 'Solo lavado',
  dry_clean: 'Lavado en seco',
  iron: 'Solo planchado',
};

export default function Step5Confirm() {
  const router = useRouter();
  const {
    garments, extras, pickupDate, pickupSlot, pickupAddress,
    deliveryDate, deliverySlot, deliveryAddress, deliverySameAsPickup,
    promoCode, promoDiscount, setPromo, getSubtotal, getTotalItems, reset,
  } = useOrderStore();

  const [promoInput, setPromoInput] = useState(promoCode ?? '');
  const [promoApplied, setPromoApplied] = useState(Boolean(promoCode && promoDiscount > 0));
  const [selectedPayment, setSelectedPayment] = useState(MOCK_PAYMENT_METHODS[0]?.id ?? 'wallet');
  const [showGateway, setShowGateway] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const subtotal = getSubtotal();
  const activeDiscount = promoApplied ? (promoDiscount || 0.1) : 0;
  const discount = subtotal * activeDiscount;
  const total = subtotal - discount;

  const applyPromo = () => {
    if (promoInput.toUpperCase() === 'BIENVENIDA') {
      setPromo(promoInput, 0.1);
      setPromoApplied(true);
    } else {
      Alert.alert('Código inválido', 'El código ingresado no es válido.');
    }
  };

  const selectedCard = MOCK_PAYMENT_METHODS.find((c) => c.id === selectedPayment);

  const completeOrder = () => {
    reset();
    router.replace('/(client)/(tabs)/orders');
  };

  const handlePay = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowGateway(false);
      Alert.alert(
        'Pago exitoso',
        `Tu pedido fue confirmado por $${total.toFixed(2)}.`,
        [{ text: 'Ver mis pedidos', onPress: completeOrder }]
      );
    }, 1400);
  };

  const handleConfirm = () => {
    if (selectedPayment === 'wallet' && MOCK_CLIENT.balance < total) {
      Alert.alert('Saldo insuficiente', 'Recarga saldo o paga con tarjeta.');
      return;
    }
    setShowGateway(true);
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Confirmar pedido</Text>
          <Text style={styles.step}>5 / 5</Text>
        </View>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: '100%' }]} /></View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
        >

        {/* Prendas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Prendas ({getTotalItems()} total)</Text>
          {garments.map((g, i) => (
            <View key={i} style={styles.garmentRow}>
              <View style={styles.garmentLeft}>
                <Ionicons name="shirt-outline" size={14} color="#6B7280" />
                <Text style={styles.garmentText}>{g.quantity}x {g.type}</Text>
              </View>
              <Text style={styles.garmentWash}>{WASH_LABELS[g.washType]}</Text>
            </View>
          ))}
          {extras.length > 0 && (
            <View style={styles.extrasRow}>
              <Ionicons name="sparkles-outline" size={13} color="#7C3AED" />
              <Text style={styles.extrasText}>{extras.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Recogida */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recogida</Text>
          <InfoRow icon="calendar-outline" label="Fecha" value={pickupDate ?? '-'} />
          <InfoRow icon="time-outline" label="Horario" value={pickupSlot ?? '-'} />
          <InfoRow icon="location-outline" label="Dirección" value={pickupAddress || '-'} />
        </View>

        {/* Entrega */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrega</Text>
          <InfoRow icon="calendar-outline" label="Fecha" value={deliveryDate ?? '-'} />
          <InfoRow icon="time-outline" label="Horario" value={deliverySlot ?? '-'} />
          <InfoRow icon="location-outline" label="Dirección" value={deliverySameAsPickup ? 'Misma que recogida' : (deliveryAddress || '-')} />
        </View>

        {/* Código promo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Código de descuento</Text>
          {promoApplied ? (
            <View style={styles.promoApplied}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.promoAppliedText}>
                {Math.round(activeDiscount * 100)}% de descuento aplicado
              </Text>
            </View>
          ) : (
            <View style={styles.promoRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Ej: BIENVENIDA"
                value={promoInput}
                onChangeText={setPromoInput}
                autoCapitalize="characters"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.promoBtn} onPress={applyPromo}>
                <Text style={styles.promoBtnText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Totales */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de pago</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
          </View>
          {promoApplied && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: '#10B981' }]}>
                Descuento {Math.round(activeDiscount * 100)}%
              </Text>
              <Text style={[styles.priceValue, { color: '#10B981' }]}>-${discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Recogida y entrega</Text>
            <Text style={[styles.priceValue, { color: '#10B981' }]}>Gratis</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Método de pago</Text>
          <TouchableOpacity
            style={[styles.payOption, selectedPayment === 'wallet' && styles.payOptionSelected]}
            onPress={() => setSelectedPayment('wallet')}
          >
            <Ionicons name="wallet-outline" size={18} color={selectedPayment === 'wallet' ? '#2563EB' : '#6B7280'} />
            <View style={styles.payInfo}>
              <Text style={styles.payTitle}>Saldo Wallet</Text>
              <Text style={styles.paySub}>Disponible: ${MOCK_CLIENT.balance.toFixed(2)}</Text>
            </View>
            {selectedPayment === 'wallet' && <Ionicons name="checkmark-circle" size={18} color="#2563EB" />}
          </TouchableOpacity>
          {MOCK_PAYMENT_METHODS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.payOption, selectedPayment === card.id && styles.payOptionSelected]}
              onPress={() => setSelectedPayment(card.id)}
            >
              <Ionicons name="card-outline" size={18} color={selectedPayment === card.id ? '#2563EB' : '#6B7280'} />
              <View style={styles.payInfo}>
                <Text style={styles.payTitle}>{card.type.toUpperCase()} •••• {card.last4}</Text>
                <Text style={styles.paySub}>Titular: {card.holder}</Text>
              </View>
              {selectedPayment === card.id && <Ionicons name="checkmark-circle" size={18} color="#2563EB" />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.balanceNote}>
          <Ionicons name="wallet-outline" size={14} color="#6B7280" />
          <Text style={styles.balanceNoteText}>Saldo disponible: ${MOCK_CLIENT.balance.toFixed(2)}</Text>
        </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.confirmBtnText}>Confirmar pedido · ${total.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={showGateway} transparent animationType="fade">
        <View style={styles.gatewayOverlay}>
          <View style={styles.gatewayCard}>
            <Text style={styles.gatewayTitle}>Pasarela de pago (simulada)</Text>
            <Text style={styles.gatewaySubtitle}>
              Método: {selectedPayment === 'wallet' ? 'Wallet' : `${selectedCard?.type.toUpperCase()} •••• ${selectedCard?.last4}`}
            </Text>
            <Text style={styles.gatewayAmount}>Total: ${total.toFixed(2)}</Text>
            {isProcessingPayment ? (
              <View style={styles.processingRow}>
                <ActivityIndicator color="#2563EB" />
                <Text style={styles.processingText}>Procesando pago seguro...</Text>
              </View>
            ) : (
              <View style={styles.gatewayActions}>
                <TouchableOpacity style={styles.gatewayCancel} onPress={() => setShowGateway(false)}>
                  <Text style={styles.gatewayCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gatewayPay} onPress={handlePay}>
                  <Text style={styles.gatewayPayText}>Pagar ahora</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon} size={14} color="#9CA3AF" />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 8 },
  label: { width: 70, fontSize: 13, color: '#6B7280' },
  value: { flex: 1, fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  step: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 16, borderRadius: 2, marginBottom: 10 },
  progressFill: { height: 4, backgroundColor: '#3B82F6', borderRadius: 2 },
  content: { padding: 16, paddingBottom: 28 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  garmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  garmentLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  garmentText: { fontSize: 13, color: '#374151' },
  garmentWash: { fontSize: 12, color: '#6B7280' },
  extrasRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  extrasText: { fontSize: 12, color: '#7C3AED', flex: 1 },
  promoRow: { flexDirection: 'row', gap: 8 },
  promoInput: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  promoBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  promoBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  promoApplied: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promoAppliedText: { color: '#10B981', fontWeight: '600', fontSize: 14 },
  payOption: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.2, borderColor: '#E5E7EB', borderRadius: 10, padding: 11, marginBottom: 8 },
  payOptionSelected: { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  payInfo: { flex: 1 },
  payTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
  paySub: { fontSize: 12, color: '#6B7280' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  priceLabel: { fontSize: 14, color: '#6B7280' },
  priceValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4, paddingTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#3B82F6' },
  balanceNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  balanceNoteText: { fontSize: 12, color: '#6B7280' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 12, padding: 16 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  gatewayOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  gatewayCard: { width: '100%', backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  gatewayTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  gatewaySubtitle: { fontSize: 13, color: '#6B7280' },
  gatewayAmount: { fontSize: 24, fontWeight: '700', color: '#2563EB', marginTop: 10, marginBottom: 14 },
  gatewayActions: { flexDirection: 'row', gap: 8 },
  gatewayCancel: { flex: 1, borderWidth: 1.3, borderColor: '#E5E7EB', borderRadius: 10, alignItems: 'center', padding: 12 },
  gatewayCancelText: { color: '#6B7280', fontWeight: '600' },
  gatewayPay: { flex: 1, backgroundColor: '#2563EB', borderRadius: 10, alignItems: 'center', padding: 12 },
  gatewayPayText: { color: '#fff', fontWeight: '700' },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  processingText: { color: '#374151', fontSize: 14, fontWeight: '500' },
});
