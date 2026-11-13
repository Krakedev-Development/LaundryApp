import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../design-system/tokens";
import { tactile } from "../design-system/interaction";
import {
  searchPlaces,
  type PlaceSearchResult,
} from "../services/maps/geocodingService";

export interface PlaceSearchBarProps {
  isTactical: boolean;
  onSelectPlace: (place: PlaceSearchResult) => void;
}

export function PlaceSearchBar({
  isTactical,
  onSelectPlace,
}: PlaceSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const runSearch = (text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    const reqId = ++requestIdRef.current;
    timerRef.current = setTimeout(() => {
      void searchPlaces(trimmed)
        .then((items) => {
          if (requestIdRef.current !== reqId) return;
          setResults(items);
          setOpen(items.length > 0);
        })
        .finally(() => {
          if (requestIdRef.current === reqId) {
            setSearching(false);
          }
        });
    }, 400);
  };

  const handleSelect = (item: PlaceSearchResult) => {
    tactile("selection");
    setQuery(item.label);
    setOpen(false);
    setResults([]);
    onSelectPlace(item);
  };

  const handleClear = () => {
    tactile("selection");
    if (timerRef.current) clearTimeout(timerRef.current);
    requestIdRef.current++;
    setQuery("");
    setResults([]);
    setOpen(false);
    setSearching(false);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputRow,
          isTactical ? styles.inputDark : styles.inputLight,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={16}
          color={isTactical ? "#38BDF8" : theme.colors.primary}
        />
        <TextInput
          value={query}
          onChangeText={runSearch}
          placeholder="Buscar calle, sector o lugar en Guayaquil..."
          placeholderTextColor={isTactical ? "#64748B" : "#94A3B8"}
          style={[
            styles.input,
            { color: isTactical ? "#F8FAFC" : "#0F172A" },
          ]}
          returnKeyType="search"
          accessibilityLabel="Buscar dirección o sector en Guayaquil"
        />
        {searching ? (
          <ActivityIndicator
            size="small"
            color={isTactical ? "#38BDF8" : theme.colors.primary}
          />
        ) : query.length > 0 ? (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
          >
            <Ionicons
              name="close-circle"
              size={16}
              color={isTactical ? "#94A3B8" : "#64748B"}
            />
          </Pressable>
        ) : null}
      </View>

      {open && results.length > 0 && (
        <View
          style={[
            styles.dropdown,
            isTactical ? styles.dropdownDark : styles.dropdownLight,
          ]}
        >
          {results.map((item, idx) => (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [
                styles.resultItem,
                idx < results.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: isTactical ? "#1E293B" : "#E2E8F0",
                },
                pressed && {
                  backgroundColor: isTactical
                    ? "rgba(56, 189, 248, 0.12)"
                    : "rgba(37, 99, 235, 0.08)",
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={15}
                color={isTactical ? "#38BDF8" : theme.colors.primary}
              />
              <View style={styles.resultTextWrap}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.resultLabel,
                    { color: isTactical ? "#F1F5F9" : "#0F172A" },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.resultSubtitle,
                    { color: isTactical ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  {item.subtitle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 4,
    zIndex: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  inputDark: {
    backgroundColor: "#0F172A",
    borderColor: "#334155",
  },
  inputLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownDark: {
    backgroundColor: "#0F172A",
    borderColor: "#334155",
  },
  dropdownLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  resultTextWrap: {
    flex: 1,
    gap: 1,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  resultSubtitle: {
    fontSize: 11,
  },
});
