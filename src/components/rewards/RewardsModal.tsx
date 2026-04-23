import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_CLIENT } from '../../data/mockData';

const REWARDS = [
  { points: 100, label: '5% descuento', icon: 'pricetag-outline' as const, unlocked: true },
  { points: 250, label: 'Envío gratis', icon: 'car-outline' as const, unlocked: true },
  { points: 340, label: 'Bolso gratis', icon: 'bag-outline' as const, unlocked: true },
  { points: 500, label: '10% descuento', icon: 'ribbon-outline' as const, unlocked: false },
  { points: 750, label: 'Membresía 1 mes', icon: 'star-outline' as const, unlocked: false },
  { points: 1000, label: 'Servicio gratis', icon: 'gift-outline' as const, unlocked: false },
];

const NEXT = REWARDS.find(r => !r.unlocked);
const PROGRESS = NEXT ? Math.min(MOCK_CLIENT.points / NEXT.points, 1) : 1;
const { width } = Dimensions.get('window');

interface RewardsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function RewardsModal({ visible, onClose }: RewardsModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Mis recompensas</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Puntos actuales */}
          <View style={styles.pointsCard}>
            <View style={styles.pointsLeft}>
              <Ionicons name="star" size={28} color="#F59E0B" />
              <View>
                <Text style={styles.pointsNumber}>{MOCK_CLIENT.points}</Text>
                <Text style={styles.pointsLabel}>puntos acumulados</Text>
              </View>
            </View>
            {NEXT && (
              <View style={styles.nextReward}>
                <Text style={styles.nextLabel}>Próxima</Text>
                <Text style={styles.nextName}>{NEXT.label}</Text>
                <Text style={styles.nextPts}>{NEXT.points} pts</Text>
              </View>
            )}
          </View>

          {/* Barra de progreso */}
          {NEXT && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {MOCK_CLIENT.points} / {NEXT.points} pts para "{NEXT.label}"
              </Text>
            </View>
          )}

          {/* Lista de recompensas */}
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {REWARDS.map((r) => (
              <View key={r.points} style={[styles.rewardRow, !r.unlocked && styles.rewardRowLocked]}>
                <View style={[styles.rewardIcon, r.unlocked && styles.rewardIconUnlocked]}>
                  <Ionicons name={r.icon} size={20} color={r.unlocked ? '#fff' : '#9CA3AF'} />
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={[styles.rewardLabel, !r.unlocked && styles.rewardLabelLocked]}>
                    {r.label}
                  </Text>
                  <Text style={styles.rewardPts}>{r.points} puntos</Text>
                </View>
                {r.unlocked ? (
                  <View style={styles.unlockedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={styles.unlockedText}>Disponible</Text>
                  </View>
                ) : (
                  <Text style={styles.lockedText}>
                    {r.points - MOCK_CLIENT.points} pts
                  </Text>
                )}
              </View>
            ))}

            {/* Cómo ganar puntos */}
            <View style={styles.howSection}>
              <Text style={styles.howTitle}>Cómo ganar puntos</Text>
              {[
                { icon: 'water-outline' as const, text: 'Cada pedido suma 10 pts por libra' },
                { icon: 'download-outline' as const, text: 'Descarga la app: +50 pts' },
                { icon: 'people-outline' as const, text: 'Refiere un amigo: +100 pts' },
                { icon: 'calendar-outline' as const, text: 'Pedido semanal: +20 pts extra' },
              ].map((item) => (
                <View key={item.text} style={styles.howRow}>
                  <Ionicons name={item.icon} size={16} color="#3B82F6" />
                  <Text style={styles.howText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  pointsCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FEF3C7', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 12,
  },
  pointsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsNumber: { fontSize: 28, fontWeight: '700', color: '#D97706' },
  pointsLabel: { fontSize: 12, color: '#92400E' },
  nextReward: { alignItems: 'flex-end' },
  nextLabel: { fontSize: 11, color: '#92400E' },
  nextName: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  nextPts: { fontSize: 11, color: '#92400E' },
  progressSection: { paddingHorizontal: 16, marginBottom: 16 },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 8, backgroundColor: '#F59E0B', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#6B7280' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rewardRowLocked: { opacity: 0.6 },
  rewardIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rewardIconUnlocked: { backgroundColor: '#3B82F6' },
  rewardInfo: { flex: 1 },
  rewardLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rewardLabelLocked: { color: '#6B7280' },
  rewardPts: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unlockedText: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  lockedText: { fontSize: 12, color: '#9CA3AF' },
  howSection: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginTop: 16 },
  howTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  howText: { fontSize: 13, color: '#6B7280' },
});
