import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "./ui";
import { contentTheme as theme } from "../design-system/classic";

/** Detail surfaces from 4fa1bd3, with the current order sections and actions. */
export function DetailMeta({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <View style={detailStyles.meta}>
      <Icon name={icon} size={14} color={theme.colors.primary} />
      <View style={detailStyles.metaContent}>{children}</View>
    </View>
  );
}

export const detailStyles = StyleSheet.create({
  hero: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowOpacity: 0,
    elevation: 0,
  },
  heroTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  orderId: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  mode: { fontSize: 13, lineHeight: 19, color: "#374151" },
  meta: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: theme.colors.soft,
    borderRadius: 10,
    padding: 10,
  },
  metaContent: { flex: 1, minWidth: 0 },
  caption: { fontSize: 12, lineHeight: 18, color: "#6B7280" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  accordionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 0,
    gap: 0,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#374151",
  },
  warning: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowOpacity: 0,
    elevation: 0,
  },
  warningHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  warningTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#D97706",
    flexShrink: 1,
  },
  warningText: { fontSize: 13, lineHeight: 19, color: "#92400E" },
  body: { fontSize: 13, lineHeight: 19, color: "#374151" },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 10,
    gap: 4,
  },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  driverIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInfo: { flex: 1, minWidth: 0, gap: 3 },
  driverName: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#111827",
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  action: { flex: 1, minWidth: 120, borderRadius: 12, padding: 14 },
  actionText: { fontSize: 15, lineHeight: 21, fontWeight: "700" },
});
