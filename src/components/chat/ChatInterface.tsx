import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { ChatMessage } from '../../data/mockData';
import { BRAND_COLORS } from '../../theme/brand';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string) => void;
  otherName: string;
  quickActions?: string[];
  onQuickAction?: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages, currentUserId, onSend, otherName, quickActions = [], onQuickAction,
}) => {
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === currentUserId;
    const time = new Date(item.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.text}
          </Text>
          <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{otherName[0]}</Text>
          </View>
          <Text style={styles.headerName}>{otherName}</Text>
        </View>

        {/* Mensajes */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {quickActions.length > 0 && (
          <View style={styles.quickRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action}
                style={styles.quickChip}
                onPress={() => (onQuickAction ? onQuickAction(action) : onSend(action))}
              >
                <Text style={styles.quickChipText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un mensaje..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: BRAND_COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  messageList: { padding: 16, paddingBottom: 12 },
  messageRow: { marginBottom: 8 },
  messageRowMe: { alignItems: 'flex-end' },
  messageRowOther: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 10 },
  bubbleMe: { backgroundColor: BRAND_COLORS.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTextMe: { color: '#fff' },
  messageTextOther: { color: '#111827' },
  time: { fontSize: 10, marginTop: 4 },
  timeMe: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  timeOther: { color: '#9CA3AF' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    fontSize: 15, maxHeight: 100, backgroundColor: '#F9FAFB',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: BRAND_COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
  sendIcon: { color: '#fff', fontSize: 16 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff' },
  quickChip: { backgroundColor: BRAND_COLORS.primarySoft, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  quickChipText: { fontSize: 12, color: BRAND_COLORS.primary, fontWeight: '600' },
});

export default ChatInterface;
