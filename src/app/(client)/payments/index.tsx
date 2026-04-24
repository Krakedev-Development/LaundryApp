import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_PAYMENT_METHODS, MOCK_CLIENT, PaymentMethod } from '../../../data/mockData';
import { BRAND_COLORS } from '../../../theme/brand';
import AppHeader from '../../../components/layout/AppHeader';

const CARD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  visa: 'card-outline',
  mastercard: 'card-outline',
  amex: 'card-outline',
};

const CARD_COLORS: Record<string, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#007BC1',
};

function CardItem({ card, onDelete }: { card: PaymentMethod; onDelete: () => void }) {
  return (
      <View style={[styles.cardItem, card.isDefault && styles.cardItemDefault]}>
      <View style={[styles.cardBrand, { backgroundColor: CARD_COLORS[card.type] }]}>
        <Ionicons name="card-outline" size={18} color="#fff" />
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardRow}>
          <Text style={styles.cardType}>{card.type.toUpperCase()}</Text>
          {card.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Principal</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
        <Text style={styles.cardExpiry}>{card.holder} · Vence {card.expiry}</Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

export default function PaymentsScreen() {
  const router = useRouter();
  const [cards, setCards] = useState(MOCK_PAYMENT_METHODS);

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar tarjeta', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setCards(c => c.filter(x => x.id !== id)) },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Metodos de pago" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Saldo */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceLeft}>
            <Ionicons name="wallet-outline" size={24} color="#3B82F6" />
            <View>
              <Text style={styles.balanceLabel}>Saldo disponible</Text>
              <Text style={styles.balanceAmount}>${MOCK_CLIENT.balance.toFixed(2)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.rechargeBtn}
            onPress={() => router.push('/(client)/payments/recharge')}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.rechargeBtnText}>Recargar</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjetas */}
        <Text style={styles.sectionTitle}>Mis tarjetas</Text>
        {cards.map(card => (
          <CardItem key={card.id} card={card} onDelete={() => handleDelete(card.id)} />
        ))}

        <TouchableOpacity
          style={styles.addCardBtn}
          onPress={() => router.push('/(client)/payments/add-card')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.addCardText}>Agregar tarjeta</Text>
        </TouchableOpacity>

        {/* Suscripciones */}
        <TouchableOpacity
          style={styles.subscriptionBanner}
          onPress={() => router.push('/(client)/payments/subscriptions')}
        >
          <View style={styles.subscriptionLeft}>
            <Ionicons name="star-outline" size={22} color="#7C3AED" />
            <View>
              <Text style={styles.subscriptionTitle}>Membresías</Text>
              <Text style={styles.subscriptionSub}>Ahorra con recogidas semanales fijas</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 32 },
  balanceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: BRAND_COLORS.primarySoft, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: BRAND_COLORS.border },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  balanceLabel: { fontSize: 12, color: BRAND_COLORS.primary, marginBottom: 2 },
  balanceAmount: { fontSize: 24, fontWeight: '700', color: BRAND_COLORS.primaryDark },
  rechargeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BRAND_COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  rechargeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 4 },
  cardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#E5E7EB' },
  cardItemDefault: { borderColor: BRAND_COLORS.primary },
  cardBrand: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardType: { fontSize: 12, fontWeight: '700', color: '#374151' },
  defaultBadge: { backgroundColor: BRAND_COLORS.primarySoft, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  defaultText: { fontSize: 10, color: BRAND_COLORS.primary, fontWeight: '700' },
  cardNumber: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardExpiry: { fontSize: 12, color: '#6B7280' },
  deleteBtn: { padding: 6 },
  addCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: BRAND_COLORS.primary, borderRadius: 12, padding: 14, marginBottom: 20, borderStyle: 'dashed' },
  addCardText: { color: BRAND_COLORS.primary, fontWeight: '600', fontSize: 15 },
  subscriptionBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F3FF', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  subscriptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subscriptionTitle: { fontSize: 15, fontWeight: '700', color: '#7C3AED' },
  subscriptionSub: { fontSize: 12, color: '#8B5CF6', marginTop: 2 },
});
