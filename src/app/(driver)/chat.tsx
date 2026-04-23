import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ChatInterface from '../../components/chat/ChatInterface';
import { MOCK_MESSAGES, MOCK_ORDERS, ChatMessage } from '../../data/mockData';
import { BRAND_COLORS } from '../../theme/brand';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>
      </View>
      <ChatInterface
        messages={messages}
        currentUserId="d1"
        onSend={handleSend}
        otherName={order.client.name}
        quickActions={quickStatuses}
        onQuickAction={handleSend}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16, paddingBottom: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  back: { fontSize: 17, color: BRAND_COLORS.primary },
});
