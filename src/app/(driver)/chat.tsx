import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ChatInterface from '../../components/chat/ChatInterface';
import { MOCK_MESSAGES, MOCK_ORDERS, ChatMessage } from '../../data/mockData';
import AppHeader from '../../components/layout/AppHeader';

export default function DriverChat() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0];
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const quickStatuses = ['Ya estoy afuera', 'No contestan al timbre', 'Estoy en ruta a matriz', 'Voy en camino con tu entrega'];

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: 'd1',
        text,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Chat con cliente" subtitle={order.id} onBack={() => router.back()} />
      <ChatInterface
        messages={messages}
        currentUserId="d1"
        onSend={handleSend}
        otherName={order.client.name}
        quickActions={quickStatuses}
        onQuickAction={handleSend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 36, height: 36 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '600' },
});
