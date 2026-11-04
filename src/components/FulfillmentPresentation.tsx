import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Body, Icon, Title, type IconName } from "./ui";
import { ListItem } from "./presentation";

/** Pickup/delivery surfaces from 4fa1bd3, retaining the current place/time panels. */
export function FulfillmentRow({
  appearance,
  selected,
  title,
  subtitle,
  icon,
  onPress,
}: {
  appearance: "default" | "request";
  selected: boolean;
  title: string;
  subtitle: string;
  icon: IconName;
  onPress(): void;
}) {
  if (appearance === "default")
    return (
      <ListItem
        title={title}
        subtitle={subtitle}
        icon={icon}
        onPress={onPress}
      />
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        requestStyles.row,
        selected && requestStyles.selectedRow,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View
        style={[requestStyles.icon, selected && requestStyles.selectedIcon]}
      >
        <Icon name={icon} size={18} color={selected ? "#FFFFFF" : "#6B7280"} />
      </View>
      <View style={requestStyles.info}>
        <Title style={requestStyles.rowTitle}>{title}</Title>
        <Body
          style={[
            requestStyles.rowText,
            selected && requestStyles.selectedText,
          ]}
        >
          {subtitle}
        </Body>
      </View>
      <Icon
        name={selected ? "checkmark-circle" : "chevron-forward"}
        size={18}
        color={selected ? "#2563EB" : "#9CA3AF"}
      />
    </Pressable>
  );
}

export function FulfillmentHint({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return active ? (
    <View style={requestStyles.hint}>
      <Icon name="car-outline" size={20} color="#2563EB" />
      <View style={requestStyles.info}>{children}</View>
    </View>
  ) : (
    <>{children}</>
  );
}

export const requestStyles = StyleSheet.create({
  card: {
    padding: 0,
    gap: 16,
    backgroundColor: "#FFFFFF",
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0F7FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 14,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    minHeight: 64,
    backgroundColor: "#FFFFFF",
  },
  selectedRow: { backgroundColor: "#EFF6FF", borderColor: "#93C5FD" },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIcon: { backgroundColor: "#2563EB" },
  info: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: "#111827",
  },
  rowText: { fontSize: 12, lineHeight: 17, color: "#6B7280" },
  selectedText: { color: "#1D4ED8" },
  choice: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  selectedChoice: { borderColor: "#93C5FD", backgroundColor: "#EFF6FF" },
  choiceText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
  date: { borderRadius: 24, backgroundColor: "#FFFFFF" },
  noteCard: {
    padding: 0,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowOpacity: 0,
    elevation: 0,
  },
  next: { backgroundColor: "#3B82F6", borderRadius: 12, padding: 16 },
});
