import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SUBSCRIPTION_PLANS, MOCK_PAYMENT_METHODS, SubscriptionPlan } from '../../../data/mockData';
import { BRAND_COLORS } from '../../../theme/brand';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [activePlan] = useState<string | null>('standard'); // mock plan activo

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (plan.id === activePlan) return;
    Alert.alert(
      `Suscribirse a ${plan.name}`,
      `$${plan.price}/mes · Se cobrará a tu tarjeta principal.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => Alert.alert('Suscripción activada', `Plan ${plan.name} activado correctamente.`, [
            { text: 'Listo', onPress: () => router.back() }
          ])
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Membresías</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Recogidas semanales fijas con descuento</Text>

        {SUBSCRIPTION_PLANS.map((plan) => {
          const isActive = plan.id === activePlan;
          const isSelected = plan.id === selected;

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                { borderColor: plan.color },
                isActive && styles.planCardActive,
                isSelected && styles.planCardSelected,
              ]}
              onPress={() => setSelected(plan.id)}
              activeOpacity={0.8}
            >
              {/* Badge */}
              <View style={styles.planTop}>
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                    <Text style={styles.popularText}>Más popular</Text>
                  </View>
                )}
                {isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: plan.color + '20' }]}>
                    <Ionicons name="checkmark-circle" size={14} color={plan.color} />
                    <Text style={[styles.activeText, { color: plan.color }]}>Plan actual</Text>
                  </View>
                )}
              </View>

              {/* Nombre y precio */}
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>${plan.price}</Text>
                  <Text style={styles.planPeriod}>/mes</Text>
                </View>
              </View>

              {/* Resumen */}
              <View style={styles.planSummary}>
                <View style={styles.summaryChip}>
                  <Ionicons name="car-outline" size={14} color="#374151" />
                  <Text style={styles.summaryChipText}>{plan.pickupsPerWeek}x/semana</Text>
                </View>
                <View style={styles.summaryChip}>
                  <Ionicons name="scale-outline" size={14} color="#374151" />
                  <Text style={styles.summaryChipText}>{plan.poundsPerPickup} lbs c/u</Text>
                </View>
              </View>

              {/* Features */}
              {plan.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={15} color={plan.color} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}

              {/* Botón */}
              <TouchableOpacity
                style={[styles.planBtn, { backgroundColor: isActive ? '#E5E7EB' : plan.color }]}
                onPress={() => handleSubscribe(plan)}
                disabled={isActive}
              >
                <Text style={[styles.planBtnText, isActive && { color: '#9CA3AF' }]}>
                  {isActive ? 'Plan actual' : `Suscribirse por $${plan.price}/mes`}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {/* Cancelar suscripción */}
        {activePlan && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => Alert.alert('Cancelar membresía', '¿Deseas cancelar tu membresía actual?', [
              { text: 'No', style: 'cancel' },
              { text: 'Sí, cancelar', style: 'destructive', onPress: () => Alert.alert('Membresía cancelada') },
            ])}
          >
            <Text style={styles.cancelBtnText}>Cancelar membresía actual</Text>
          </TouchableOpacity>
        )}
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
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16, textAlign: 'center' },
  planCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 2, borderColor: '#E5E7EB' },
  planCardActive: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  planCardSelected: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  planTop: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  popularBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  activeText: { fontSize: 11, fontWeight: '700' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  planName: { fontSize: 22, fontWeight: '700' },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  planPrice: { fontSize: 28, fontWeight: '700', color: '#111827' },
  planPeriod: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  planSummary: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  summaryChipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText: { fontSize: 13, color: '#374151' },
  planBtn: { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  planBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { alignItems: 'center', padding: 14 },
  cancelBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});
