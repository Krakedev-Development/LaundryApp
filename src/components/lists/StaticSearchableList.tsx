import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StaticSearchableListProps<T> {
  items: T[];
  selectedKey: string;
  getKey: (item: T) => string;
  getSearchText: (item: T) => string;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  searchPlaceholder?: string;
  emptyText?: string;
  searchThreshold?: number;
  maxHeight?: number;
}

const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function StaticSearchableList<T>({
  items,
  selectedKey,
  getKey,
  getSearchText,
  renderItem,
  searchPlaceholder = 'Buscar...',
  emptyText = 'Sin resultados.',
  searchThreshold = 8,
  maxHeight = 220,
}: StaticSearchableListProps<T>) {
  const [query, setQuery] = useState('');
  const showSearch = items.length > searchThreshold;

  const filtered = useMemo(() => {
    if (!showSearch) return items;
    const q = normalizeSearch(query);
    if (!q) return items;
    return items.filter((item) => normalizeSearch(getSearchText(item)).includes(q));
  }, [getSearchText, items, query, showSearch]);

  return (
    <View>
      {showSearch ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
        </View>
      ) : null}

      <View style={[styles.listContainer, { maxHeight }]}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            directionalLockEnabled
          >
            {filtered.map((item, idx) => (
              <View key={getKey(item)}>
                {renderItem(item, selectedKey === getKey(item))}
                {idx < filtered.length - 1 ? <View style={styles.separator} /> : null}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  listContainer: {
    marginTop: 10,
    borderRadius: 10,
  },
  separator: { height: 8 },
  emptyText: { width: '100%', fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingVertical: 10 },
});
