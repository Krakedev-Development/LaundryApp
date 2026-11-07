import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { tactile } from "../design-system/interaction";
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
      onPress={() => {
        tactile("selection");
        onPress();
      }}
      style={({ pressed }) => [
        requestStyles.row,
        selected && requestStyles.selectedRow,
        {
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View
        style={[requestStyles.icon, selected && requestStyles.selectedIcon]}
      >
        <Icon name={icon} size={18} color={selected ? "#FFFFFF" : "#64748B"} />
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
        color={selected ? "#2563EB" : "#94A3B8"}
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
      <Icon name="car-outline" size={20} color="#143F73" />
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
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    fontWeight: "700",
    color: "#143F73",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 13,
    minHeight: 64,
    backgroundColor: "#FFFFFF",
  },
  selectedRow: { backgroundColor: "#EFF6FF", borderColor: "#60A5FA" },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIcon: { backgroundColor: "#2563EB" },
  info: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "700",
    color: "#0F172A",
  },
  rowText: { fontSize: 12, lineHeight: 17, color: "#64748B" },
  selectedText: { color: "#1D4ED8", fontWeight: "600" },
  choice: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 48,
  },
  selectedChoice: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  choiceText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  date: { borderRadius: 24, backgroundColor: "#FFFFFF" },
  noteCard: {
    padding: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    shadowOpacity: 0,
    elevation: 0,
  },
  next: { backgroundColor: "#143F73", borderRadius: 12, padding: 16 },
});
