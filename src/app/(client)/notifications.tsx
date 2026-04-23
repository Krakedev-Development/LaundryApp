import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  type: 'promo' | 'driver' | 'order' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'driver', title: 'Tu chofer está cerca', body: 'Carlos llegará en aproximadamente 5 minutos a recoger tu ropa.', time: 'Hace 2 min', read: false },
  { id: '2', type: 'order', title: 'Pedido en camino', body: 'Tu pedido ORD-001 está siendo entregado. Llega hoy entre 16:00 - 18:00.', time: 'Hace 1 hora', read: false },
  { id: '3', type: 'promo', title: '15 libras por $12 esta semana', body: 'Aprovecha nuestra oferta especial de lavado y doblado. Solo hasta el domingo.', time: 'Hace 3 horas', read: false },
  { id: '4', type: 'order', title: 'Ropa lista para entrega', body: 'Tu pedido ORD-001 fue procesado y está listo. Programamos la entrega para mañana.', time: 'Ayer 14:30', read: true },
  { id: '5', type: 'promo', title: '10% de descuento por descarga', body: 'Gracias por descargar LaundryApp. Usa el código BIENVENIDA en tu primer pedido.', time: 'Ayer 09:00', read: true },
  { id: '6', type: 'driver', title: 'Chofer asignado', body: 'Carlos Chofer fue asignado a tu pedido ORD-001. Placa: PBX-1234.', time: 'Hace 2 días', read: true },
  { id: '7', type: 'system', title: 'Puntos acreditados', body: 'Ganaste 150 puntos por tu último pedido. Total: 340 puntos.', time: 'Hace 2 días', read: true },
  { id: '8', type: 'promo', title: 'Recarga y gana 10% extra', body: 'Recarga $30 o más y recibe $33 en saldo. Oferta válida esta semana.', time: 'Hace 3 días', read: true },
];

const TYPE_CONFIG = {
  promo:  { icon: 'pricetag-outline' as const,       color: '#F59E0B', bg: '#FEF3C7' },
  driver: { icon: 'car-outline' as const,             color: '#10B981', bg: '#D1FAE5' },
  order:  { icon: 'receipt-outline' as const,         color: '#3B82F6', bg: '#DBEAFE' },
  system: { icon: 'notifications-outline' as const,   color: '#7C3AED', bg: '#EDE9FE' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id: string) => setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notificaciones</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Leer todo</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 60 }} />}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cfg = TYPE_CONFIG[item.type];
          return (
            <TouchableOpacity
              style={[styles.notifCard, !item.read && styles.notifCardUnread]}
              onPress={() => markRead(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={20} color={cfg.color} />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTitleRow}>
                  <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.notifTime}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Sin notificaciones</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  unreadBadge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  markAllText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  notifCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  notifCardUnread: { backgroundColor: '#F0F7FF', borderColor: '#BFDBFE' },
  notifIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  notifTitleUnread: { color: '#111827', fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginLeft: 6 },
  notifBody: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
});
