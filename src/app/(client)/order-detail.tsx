import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_ORDERS } from '../../data/mockData';
import { BRAND_COLORS } from '../../theme/brand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrderStatusStore } from '../../store/useOrderStatusStore';
import AppHeader from '../../components/layout/AppHeader';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pending:    { label: 'Pendiente',  color: '#D97706', bg: '#FEF3C7', step: 0 },
  picked_up:  { label: 'Recogido',   color: '#2563EB', bg: '#DBEAFE', step: 1 },
  in_process: { label: 'En proceso', color: '#7C3AED', bg: '#EDE9FE', step: 2 },
  delivering: { label: 'En camino',  color: '#059669', bg: '#D1FAE5', step: 3 },
  delivered:  { label: 'Entregado',  color: '#6B7280', bg: '#F3F4F6', step: 4 },
};

const STEPS = ['Pendiente', 'Recogido', 'En proceso', 'En camino', 'Entregado'];

const SERVICE_LABEL: Record<string, string> = {
  wash: 'Lavado', wash_fold: 'Lavado y Doblado',
  dry_clean: 'Lavado en Seco', iron: 'Planchado',
};

export default function OrderDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0];
  const resolvedStatus = useOrderStatusStore((s) => s.overrides[order.id] ?? order.status);
  const status = STATUS_CONFIG[resolvedStatus];
  const pickup = new Date(order.pickupTime);
  const hasDeliveryDate = Boolean(order.deliveryTime);
  const delivery = hasDeliveryDate ? new Date(order.deliveryTime) : null;
  const serviceLabel = SERVICE_LABEL[order.serviceType] ?? order.serviceType;

  return (
    <View style={styles.container}>
      <AppHeader title="Detalle del pedido" subtitle={order.id} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroOrder}>{order.id}</Text>
            <View style={[styles.heroBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.heroBadgeText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={styles.heroStatusKey}>Estado del sistema: {resolvedStatus}</Text>
          <Text style={styles.heroMessage}>
            {resolvedStatus === 'delivering'
              ? `${order.driver.name} va en camino con tu pedido.`
              : resolvedStatus === 'picked_up'
              ? 'Tu pedido ya fue recogido y está rumbo a planta.'
              : 'Seguimos avanzando con tu pedido.'}
          </Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaChip}>
              <Ionicons name="water-outline" size={14} color={BRAND_COLORS.primary} />
              <Text style={styles.heroMetaText}>{serviceLabel}</Text>
            </View>
            <View style={styles.heroMetaChip}>
              <Ionicons name="cash-outline" size={14} color={BRAND_COLORS.primary} />
              <Text style={styles.heroMetaText}>${order.price.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          <Text style={styles.sectionTitle}>Estado del pedido</Text>
          {STEPS.map((step, i) => {
            const done = i <= status.step;
            const active = i === status.step;
            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, done && styles.timelineDotDone, active && styles.timelineDotActive]}>
                    {done && !active && <Ionicons name="checkmark" size={12} color="#fff" />}
                    {active && <View style={styles.timelineDotInner} />}
                  </View>
                  {i < STEPS.length - 1 && <View style={[styles.timelineLine, done && styles.timelineLineDone]} />}
                </View>
                <Text style={[styles.timelineLabel, active && styles.timelineLabelActive, !done && styles.timelineLabelPending]}>
                  {step}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Info del pedido */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detalles del servicio</Text>
          <InfoRow icon="water-outline" label="Servicio" value={serviceLabel} />
          <InfoRow icon="scale-outline" label="Prendas" value={`${order.garmentCount} prendas`} />
          <InfoRow icon="cash-outline" label="Total" value={`$${order.price.toFixed(2)}`} />
          <InfoRow icon="calendar-outline" label="Recogida" value={pickup.toLocaleDateString('es')} />
          <InfoRow icon="calendar-outline" label="Entrega" value={delivery ? delivery.toLocaleDateString('es') : 'Fecha de entrega aun no asignada'} />
          <InfoRow icon="location-outline" label="Dirección" value={order.address} />
        </View>

        {/* Chofer */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tu chofer</Text>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{order.driver.name[0]}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{order.driver.name}</Text>
              <Text style={styles.driverVehicle}>{order.driver.vehicle} · {order.driver.plate}</Text>
            </View>
          </View>
        </View>

        {/* Novedades */}
        {order.issues && order.issues.length > 0 && (
          <View style={styles.issuesCard}>
            <View style={styles.issuesHeader}>
              <Ionicons name="warning-outline" size={16} color="#D97706" />
              <Text style={styles.sectionTitleWarning}>Novedades detectadas</Text>
            </View>
            {order.issues.map((issue, i) => (
              <View key={i} style={styles.issueRow}>
                <Text style={styles.issueGarment}>{issue.garment}</Text>
                <Text style={styles.issueDesc}>{issue.issue}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Acciones pegadas al pedido */}
        {(resolvedStatus === 'delivering' || resolvedStatus === 'picked_up' || resolvedStatus === 'in_process') && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(client)/tracking')}
            >
              <Ionicons name="location-outline" size={20} color="#3B82F6" />
              <Text style={styles.actionBtnText}>Ver en mapa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={() => router.push('/(client)/chat')}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Chatear con chofer</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon} size={15} color="#9CA3AF" />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 8 },
  label: { flex: 1, fontSize: 13, color: '#6B7280' },
  value: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '55%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 32 },
  heroCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: BRAND_COLORS.border, borderRadius: 14, padding: 14, marginBottom: 12 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  heroOrder: { fontSize: 18, fontWeight: '700', color: BRAND_COLORS.primary },
  heroBadge: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { fontSize: 12, fontWeight: '700' },
  heroStatusKey: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 6 },
  heroMessage: { fontSize: 13, color: '#374151', lineHeight: 19 },
  heroMetaRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  heroMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: BRAND_COLORS.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  heroMetaText: { fontSize: 12, color: BRAND_COLORS.primary, fontWeight: '600' },
  timeline: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  timelineLeft: { alignItems: 'center', marginRight: 12, width: 20 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: BRAND_COLORS.primary },
  timelineDotActive: { backgroundColor: '#fff', borderWidth: 2.5, borderColor: BRAND_COLORS.primary },
  timelineDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND_COLORS.primary },
  timelineLine: { width: 2, height: 24, backgroundColor: '#E5E7EB', marginVertical: 2 },
  timelineLineDone: { backgroundColor: BRAND_COLORS.primary },
  timelineLabel: { fontSize: 14, color: '#374151', paddingTop: 2, paddingBottom: 26 },
  timelineLabelActive: { fontWeight: '700', color: '#111827' },
  timelineLabelPending: { color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  sectionTitleWarning: { fontSize: 14, fontWeight: '700', color: '#D97706' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: BRAND_COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  driverAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  driverVehicle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  issuesCard: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, marginBottom: 12 },
  issuesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  issueRow: { marginBottom: 6 },
  issueGarment: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  issueDesc: { fontSize: 12, color: '#B45309' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: BRAND_COLORS.primary, borderRadius: 12, padding: 14 },
  actionBtnPrimary: { backgroundColor: BRAND_COLORS.primary, borderColor: BRAND_COLORS.primary },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: BRAND_COLORS.primary },
});
