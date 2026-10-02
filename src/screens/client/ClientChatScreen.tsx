import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLaundry } from '../../store/LaundryStore';
import { Colors } from '../../theme/colors';
import { ChatMessage } from '../../types';

export const ClientChatScreen = ({ route }: any) => {
  const { orderId } = route.params || { orderId: 'SOL-4587' };
  const { chatMessages, sendChatMessage, orders } = useLaundry();
  const [inputText, setInputText] = useState('');

  const order = orders.find((o) => o.id === orderId);
  const messages = chatMessages[orderId] || [];

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendChatMessage(orderId, 'CLIENTE', inputText.trim());
    setInputText('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.isMine;
    return (
      <View
        style={[
          styles.msgBubble,
          isMine ? styles.msgMine : styles.msgOther,
        ]}
      >
        <Text style={[styles.senderName, isMine ? styles.senderMine : styles.senderOther]}>
          {item.senderName} ({item.senderRole})
        </Text>
        <Text style={[styles.msgText, isMine ? styles.msgTextMine : styles.msgTextOther]}>
          {item.text}
        </Text>
        <Text style={[styles.timestamp, isMine ? styles.timeMine : styles.timeOther]}>
          {item.timestamp}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Top Banner */}
      <View style={styles.topInfo}>
        <Text style={styles.topTitle}>Chat para Solicitud {orderId}</Text>
        <Text style={styles.topSub}>
          Chofer: {order?.assignedDriverName || 'Asignado'} • {order?.assignedDriverPlate || ''}
        </Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
      />

      {/* Input row */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje al chofer..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topInfo: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  topTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  topSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 20 },
  msgBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  msgMine: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  msgOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 2,
  },
  senderName: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  senderMine: { color: '#E0F2FE' },
  senderOther: { color: Colors.primary },
  msgText: { fontSize: 14 },
  msgTextMine: { color: '#FFF' },
  msgTextOther: { color: Colors.text },
  timestamp: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  timeMine: { color: '#BAE6FD' },
  timeOther: { color: Colors.textMuted },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 14,
    color: Colors.text,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
