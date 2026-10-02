import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLaundry } from '../../store/LaundryStore';
import { Colors } from '../../theme/colors';
import { StatusBadge } from '../../components/StatusBadge';

export const ClientHomeScreen = ({ navigation }: any) => {
  const { customer, activeOrder, orders, catalogServices } = useLaundry();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.userName}>{customer.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBadge}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={36} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Wallet / Points Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Saldo Billetera</Text>
          <Text style={styles.walletAmount}>${customer.walletBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.pointsInfo}>
          <Text style={styles.pointsLabel}>Puntos Fresh</Text>
          <Text style={styles.pointsAmount}>🌟 {customer.loyaltyPoints}</Text>
        </View>
        <TouchableOpacity
          style={styles.rechargeBtn}
          onPress={() => navigation.navigate('Benefits')}
        >
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.rechargeText}>Cargar</Text>
        </TouchableOpacity>
      </View>

      {/* Active Order Card */}
      {activeOrder && (
        <View style={styles.activeOrderCard}>
          <View style={styles.activeOrderHeader}>
            <View>
              <Text style={styles.activeOrderCode}>{activeOrder.id}</Text>
              <Text style={styles.activeOrderSubtitle}>Pedido en curso</Text>
            </View>
            <StatusBadge status={activeOrder.status} />
          </View>

          <View style={styles.driverInfoRow}>
            <Ionicons name="car-sport" size={24} color={Colors.primary} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.driverName}>Chofer: {activeOrder.assignedDriverName}</Text>
              <Text style={styles.driverPlate}>{activeOrder.assignedDriverVehicle} • {activeOrder.assignedDriverPlate}</Text>
            </View>
          </View>

          <View style={styles.orderActionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.trackBtn]}
              onPress={() => navigation.navigate('Tracking', { orderId: activeOrder.id })}
            >
              <Ionicons name="navigate-outline" size={18} color="#FFF" />
              <Text style={styles.actionBtnTextWhite}>Seguimiento</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.chatBtn]}
              onPress={() => navigation.navigate('Chat', { orderId: activeOrder.id })}
            >
              <Ionicons name="chatbubbles-outline" size={18} color={Colors.primary} />
              <Text style={styles.actionBtnTextBlue}>Chat Chofer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* New Order Banner */}
      <TouchableOpacity
        style={styles.wizardPromoBanner}
        onPress={() => navigation.navigate('NewOrderWizard')}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.promoTag}>RECOGIDA HOY</Text>
          <Text style={styles.promoTitle}>Programa tu Lavado</Text>
          <Text style={styles.promoDesc}>Recogemos en tu puerta y devolvemos impecable en 24h.</Text>
        </View>
        <View style={styles.promoArrow}>
          <Ionicons name="arrow-forward" size={24} color="#FFF" />
        </View>
      </TouchableOpacity>

      {/* Services List */}
      <Text style={styles.sectionTitle}>Nuestros Servicios</Text>
      <View style={styles.servicesGrid}>
        {catalogServices.map((svc) => (
          <View key={svc.id} style={styles.serviceCard}>
            <Ionicons name="shirt-outline" size={24} color={Colors.primary} />
            <Text style={styles.serviceName}>{svc.name}</Text>
            <Text style={styles.serviceDesc}>{svc.description}</Text>
          </View>
        ))}
      </View>

      {/* Recent Orders Section */}
      <Text style={styles.sectionTitle}>Historial Reciente</Text>
      {orders.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.historyCard}
          onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.historyId}>{item.id}</Text>
            <Text style={styles.historyDate}>{item.createdAt} • {item.items.length} tipo(s) de prenda</Text>
            <Text style={styles.historyTotal}>Total: ${item.pricing.total.toFixed(2)}</Text>
          </View>
          <StatusBadge status={item.status} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  profileBadge: {
    padding: 4,
  },
  walletCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  walletAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  pointsInfo: {
    marginRight: 16,
  },
  pointsLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  pointsAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  rechargeBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rechargeText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  activeOrderCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeOrderCode: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  activeOrderSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  driverName: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.text,
  },
  driverPlate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  trackBtn: {
    backgroundColor: Colors.primary,
  },
  chatBtn: {
    backgroundColor: '#FFF',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  actionBtnTextWhite: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  actionBtnTextBlue: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  wizardPromoBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  promoTag: {
    color: '#BAE6FD',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  promoTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  promoDesc: {
    color: '#E0F2FE',
    fontSize: 13,
    marginTop: 4,
  },
  promoArrow: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceName: {
    fontWeight: '700',
    fontSize: 13,
    color: Colors.text,
    marginTop: 6,
  },
  serviceDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyId: {
    fontWeight: '700',
    fontSize: 15,
    color: Colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
});
