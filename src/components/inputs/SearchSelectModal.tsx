import React, { useMemo, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../layout/AppHeader';

interface SearchSelectModalProps<T> {
  visible: boolean;
  title: string;
  placeholder?: string;
  items: T[];
  selectedKey: string;
  getKey: (item: T) => string;
  getSearchText: (item: T) => string;
  onClose: () => void;
  onSelect: (item: T) => void;
  renderOption: (item: T, isSelected: boolean) => React.ReactNode;
}

const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function SearchSelectModal<T>({
  visible,
  title,
  placeholder = 'Buscar...',
  items,
  selectedKey,
  getKey,
  getSearchText,
  onClose,
  onSelect,
  renderOption,
}: SearchSelectModalProps<T>) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return items;
    return items.filter((item) => normalizeSearch(getSearchText(item)).includes(q));
  }, [items, query, getSearchText]);

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <AppHeader title={title} onBack={onClose} />
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
          {filteredItems.map((item) => {
            const isSelected = getKey(item) === selectedKey;
            return (
              <TouchableOpacity
                key={getKey(item)}
                activeOpacity={0.8}
                onPress={() => {
                  onSelect(item);
                  setQuery('');
                }}
              >
                {renderOption(item, isSelected)}
              </TouchableOpacity>
            );
          })}
          {filteredItems.length === 0 ? <Text style={styles.emptyText}>Sin resultados</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, gap: 8 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 20, fontSize: 13 },
});
