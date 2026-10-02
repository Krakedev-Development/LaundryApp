import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLaundry } from '../../store/LaundryStore';
import { Colors } from '../../theme/colors';
import { LoyaltyReward } from '../../types';

export const ClientWalletScreen = () => {
  const {
    customer,
    walletTransactions,
    loyaltyRewards,
    membershipPlans,
    addWalletCredit,
    redeemReward,
  } = useLaundry();

  const [activeTab, setActiveTab] = useState<'WALLET' | 'POINTS' | 'MEMBERSHIP'>('WALLET');

  const handleRecharge = (amount: number) => {
    addWalletCredit(amount);
    Alert.alert('¡Recarga Exitosa!', `Se acreditaron $${amount.toFixed(2)} a tu Billetera.`);
  };

  const handleRedeem = (reward: LoyaltyReward) => {
    const ok = redeemReward(reward);
    if (ok) {
      Alert.alert('¡Recompensa Canjeada!', `Has canjeado "${reward.title}".`);
    } else {
      Alert.alert('Puntos Insuficientes', 'No tienes los puntos requeridos para este canje.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Balance Header */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Saldo Total Disponible</Text>
        <Text style={styles.heroBalance}>${customer.walletBalance.toFixed(2)}</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>🌟 {customer.loyaltyPoints} Puntos Fresh</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['WALLET', 'POINTS', 'MEMBERSHIP'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'WALLET' ? 'Billetera' : t === 'POINTS' ? 'Puntos' : 'Planes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* WALLET TAB */}
      {activeTab === 'WALLET' && (
        <View>
          <Text style={styles.sectionTitle}>Recarga Rápida</Text>
          <View style={styles.quickRechargeRow}>
            {[10, 20, 50].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.rechargeChip}
                onPress={() => handleRecharge(amt)}
              >
                <Text style={styles.rechargeChipText}>+${amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Historial de Movimientos</Text>
          {walletTransactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <Ionicons
                name={tx.type === 'CREDIT' ? 'arrow-down-circle' : 'arrow-up-circle'}
                size={28}
                color={tx.type === 'CREDIT' ? Colors.success : Colors.primary}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.txRef}>{tx.reference}</Text>
                <Text style={styles.txDesc}>{tx.description}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.type === 'CREDIT' ? Colors.success : Colors.text },
                ]}
              >
                {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* POINTS TAB */}
      {activeTab === 'POINTS' && (
        <View>
          <Text style={styles.sectionTitle}>Recompensas Disponibles</Text>
          {loyaltyRewards.map((reward) => (
            <View key={reward.id} style={styles.rewardCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardDesc}>{reward.description}</Text>
                <Text style={styles.rewardCost}>Costo: {reward.pointsCost} pts</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.redeemBtn,
                  customer.loyaltyPoints < reward.pointsCost && styles.redeemBtnDisabled,
                ]}
                onPress={() => handleRedeem(reward)}
                disabled={customer.loyaltyPoints < reward.pointsCost}
              >
                <Text style={styles.redeemBtnText}>Canjear</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* MEMBERSHIP TAB */}
      {activeTab === 'MEMBERSHIP' && (
        <View>
          <Text style={styles.sectionTitle}>Membresías Laundry Clean & Fresh</Text>
          {membershipPlans.map((plan) => (
            <View
              key={plan.id}
              style={[styles.planCard, plan.isCurrent && styles.planCardActive]}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>ACTUAL</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>${plan.priceMonthly.toFixed(2)} / mes</Text>
              <Text style={styles.planBenefitText}>
                • {plan.weeklyPickups} recogida(s) por semana
              </Text>
              <Text style={styles.planBenefitText}>
                • {plan.garmentDiscountPercent}% de descuento en catálogo
              </Text>
              {plan.benefits.map((b, i) => (
                <Text key={i} style={styles.planBenefitText}>• {b}</Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.primary,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: { color: '#E0F2FE', fontSize: 13, fontWeight: '600' },
  heroBalance: { color: '#FFF', fontSize: 34, fontWeight: '800', marginVertical: 4 },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
  },
  pointsBadgeText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 6,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.primaryLight },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: Colors.primaryDark },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12, marginTop: 8 },
  quickRechargeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  rechargeChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  rechargeChipText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  txRef: { fontSize: 14, fontWeight: '700', color: Colors.text },
  txDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  txDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800' },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  rewardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  rewardDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rewardCost: { fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 4 },
  redeemBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  redeemBtnDisabled: { backgroundColor: Colors.borderDark },
  redeemBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  planCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  planCardActive: { borderColor: Colors.primary, borderWidth: 2, backgroundColor: '#F0F9FF' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  currentBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  currentBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  planPrice: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginVertical: 6 },
  planBenefitText: { fontSize: 12, color: Colors.text, marginTop: 4 },
});
