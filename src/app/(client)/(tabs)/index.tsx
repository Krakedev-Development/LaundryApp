import React, { useState } from 'react';
import {BusinessHomeCard} from '../../../components/mvp/BusinessHomeCard';
import {useBusinessStore,currentActor} from '../../../store/useBusinessStore';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStore } from '../../../store/useOrderStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { MOCK_CLIENT, MOCK_ORDERS, MOCK_PROMOTIONS, Promotion } from '../../../data/mockData';
import RewardsModal from '../../../components/rewards/RewardsModal';
import PromoDetailModal from '../../../components/promos/PromoDetailModal';
import { BRAND_ASSETS, BRAND_COLORS } from '../../../theme/brand';

export default function ClientHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const business=useBusinessStore(s=>s.state);
  const actor=currentActor();
  const customer=business?.customers.find(c=>c.id===actor.id);
  const ownOrders=business?.orders.filter(o=>o.customerId===actor.id)??[];
  const promotions:Promotion[]=(business?.promotions??[]).filter(p=>p.status==='ACTIVE'&&p.startDate<=new Date().toISOString().slice(0,10)&&p.endDate>=new Date().toISOString().slice(0,10)).map(p=>({id:p.code,title:p.name,description:p.description,discount:p.discountType==='PERCENTAGE'?p.discountValue:0,type:'package',badge:p.discountType==='PERCENTAGE'?p.discountValue+'%':String(p.discountValue)+' USD',color:'#0F4C81'}));
  const {setPromo}=useOrderStore();
  const firstName = user?.name?.trim()?.split(/\s+/)[0] ?? 'Cliente';
  const [showRewards, setShowRewards] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const activeOrder = undefined as typeof MOCK_ORDERS[number]|undefined;

  const handlePromoAccept = (promo: Promotion) => {
    setSelectedPromo(null);
    setPromo(promo.id.toUpperCase(),0);
    router.push('/(client)/new-order/step1-garments');
  };

  return (
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <View style={styles.headerLeft}>
          <Image source={BRAND_ASSETS.logoMark} style={styles.headerLogo} />
          <View style={styles.headerGreetingWrap}>
            <Text style={styles.headerGreeting}>Hola,</Text>
            <Text style={styles.headerName} numberOfLines={1}>{firstName}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.alertChip}
            onPress={() => router.push('/(client)/notifications')}
            activeOpacity={0.75}
          >
            <Ionicons name="notifications-outline" size={15} color="#B45309" />
            <Text style={styles.alertText}>Alertas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pointsChip}
            onPress={() => router.push('/(client)/rewards')}
            activeOpacity={0.75}
          >
            <Ionicons name="star" size={15} color="#F59E0B" />
            <Text style={styles.pointsText}>{customer?.points??0}</Text>
            <Text style={styles.pointsUnit}>pts</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="wallet-outline" size={20} color={BRAND_COLORS.primary} />
            <Text style={styles.statAmount}>${(customer?.walletBalance??0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Saldo</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(client)/rewards')}>
            <Ionicons name="star-outline" size={20} color="#F59E0B" />
            <Text style={styles.statAmount}>{customer?.points??0}</Text>
            <Text style={styles.statLabel}>Puntos</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="receipt-outline" size={20} color={BRAND_COLORS.accentDark} />
            <Text style={styles.statAmount}>{ownOrders.length}</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
        </View>

        <BusinessHomeCard/>
        <TouchableOpacity onPress={()=>router.push('/(client)/wallet')}><Text style={styles.sectionTitle}>Mi billetera y movimientos</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>router.push('/(client)/promotions')}><Text style={styles.sectionTitle}>Ver promociones disponibles</Text></TouchableOpacity>
        {activeOrder && (
          <TouchableOpacity
            style={styles.activeOrderCard}
            onPress={() => router.push({ pathname: '/(client)/order-detail', params: { id: activeOrder.id } })}
          >
            <View style={styles.activeOrderLeft}>
              <View style={styles.activePulse} />
              <View>
                <Text style={styles.activeOrderTitle}>Pedido en camino</Text>
                <Text style={styles.activeOrderSub}>
                  {activeOrder.id} · {activeOrder.driver.name} · {activeOrder.driver.plate}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={BRAND_COLORS.primary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.newOrderBtn}
          onPress={() => router.push('/(client)/new-order/step1-garments')}
        >
          <Ionicons name="add-circle" size={22} color="#fff" />
          <Text style={styles.newOrderBtnText}>Nueva solicitud</Text>
        </TouchableOpacity>

        <View style={styles.promoHeader}>
          <Text style={styles.sectionTitle}>Ofertas para ti</Text>
          <Text style={styles.promoSubtitle}>Toca para ver detalles</Text>
        </View>

        {promotions[0]&&<TouchableOpacity
          style={[styles.promoFeatured, { backgroundColor: promotions[0].color }]}
          onPress={() => setSelectedPromo(promotions[0])}
          activeOpacity={0.85}
        >
          {promotions[0].badge && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{promotions[0].badge}</Text>
            </View>
          )}
          <Text style={styles.featuredTitle}>{promotions[0].title}</Text>
          <Text style={styles.featuredDesc}>{promotions[0].description}</Text>
          <View style={styles.featuredCta}>
            <Text style={styles.featuredCtaText}>Ver oferta</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </TouchableOpacity>}

        <View style={styles.promoGrid}>
          {promotions.slice(1).map((promo) => (
            <TouchableOpacity
              key={promo.id}
              style={[styles.promoCard, { backgroundColor: promo.color }]}
              onPress={() => setSelectedPromo(promo)}
              activeOpacity={0.85}
            >
              {promo.badge && (
                <View style={styles.promoCardBadge}>
                  <Text style={styles.promoCardBadgeText}>{promo.badge}</Text>
                </View>
              )}
              <Text style={styles.promoCardTitle}>{promo.title}</Text>
              <Text style={styles.promoCardDesc} numberOfLines={2}>{promo.description}</Text>
              <View style={styles.promoCardCta}>
                <Text style={styles.promoCardCtaText}>Ver</Text>
                <Ionicons name="chevron-forward" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <RewardsModal visible={showRewards} onClose={() => setShowRewards(false)} />
      <PromoDetailModal
        promo={selectedPromo}
        onClose={() => setSelectedPromo(null)}
        onAccept={handlePromoAccept}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.background },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F4',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerLogo: { width: 44, height: 44, resizeMode: 'contain' },
  headerGreetingWrap: { flex: 1, minWidth: 0, justifyContent: 'center' },
  headerGreeting: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 1 },
  headerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  alertText: { fontSize: 12, fontWeight: '700', color: '#B45309' },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pointsText: { fontSize: 13, fontWeight: '800', color: '#B45309' },
  pointsUnit: { fontSize: 11, fontWeight: '700', color: '#D97706', marginLeft: -2 },
  scroll: { flex: 1 },
  content: { paddingBottom: 32, paddingTop: 12 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },
  statAmount: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280' },
  activeOrderCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#EFF6FF', marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BFDBFE',
  },
  activeOrderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  activeOrderTitle: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
  activeOrderSub: { fontSize: 12, color: '#3B82F6', marginTop: 2 },
  newOrderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: BRAND_COLORS.primary, borderRadius: 12, margin: 16, padding: 16,
  },
  newOrderBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  promoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  promoSubtitle: { fontSize: 12, color: '#9CA3AF' },
  promoFeatured: {
    marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 10,
  },
  featuredBadge: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  featuredBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featuredTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  featuredDesc: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 19, marginBottom: 14 },
  featuredCta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  featuredCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  promoGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  promoCard: { flex: 1, borderRadius: 14, padding: 14 },
  promoCardBadge: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6 },
  promoCardBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  promoCardTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  promoCardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 16, marginBottom: 10 },
  promoCardCta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  promoCardCtaText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
