import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import ChatInterface from '../../components/chat/ChatInterface';
import { MOCK_MESSAGES, MOCK_DRIVER, ChatMessage } from '../../data/mockData';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_COLORS } from '../../theme/brand';

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>
      </View>
      <ChatInterface
        messages={messages}
        currentUserId="c1"
        onSend={handleSend}
        otherName={MOCK_DRIVER.name}
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
