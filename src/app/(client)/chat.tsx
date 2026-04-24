import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import ChatInterface from '../../components/chat/ChatInterface';
import { MOCK_MESSAGES, MOCK_DRIVER, ChatMessage } from '../../data/mockData';
import AppHeader from '../../components/layout/AppHeader';

export default function ClientChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: 'c1',
        text,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Chat con chofer" subtitle={MOCK_DRIVER.name} onBack={() => router.back()} />
      <ChatInterface
        messages={messages}
        currentUserId="c1"
        onSend={handleSend}
        otherName={MOCK_DRIVER.name}
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
