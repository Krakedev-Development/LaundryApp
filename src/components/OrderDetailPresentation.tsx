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
      <View style={detailStyles.metaIconWrap}>
        <Icon name={icon} size={15} color={theme.colors.primary} />
      </View>
      <View style={detailStyles.metaContent}>{children}</View>
    </View>
  );
}

export const detailStyles = StyleSheet.create({
  hero: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6DFEA",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  heroTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  orderId: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
    color: theme.colors.primary,
    letterSpacing: 0.2,
  },
  mode: { fontSize: 13.5, lineHeight: 19, color: "#334155", fontWeight: "600" },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
  },
  metaIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  metaContent: { flex: 1, minWidth: 0 },
  caption: { fontSize: 12, lineHeight: 18, color: "#64748B" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  accordionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 0,
    gap: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  warning: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 14,
    padding: 16,
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
  body: {
    fontSize: 13.5,
    lineHeight: 19,
    color: "#1E293B",
    fontVariant: ["tabular-nums"],
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 10,
    gap: 4,
  },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  driverIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInfo: { flex: 1, minWidth: 0, gap: 3 },
  driverName: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#0F172A",
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  action: { flex: 1, minWidth: 120, borderRadius: 12, padding: 14 },
  actionText: { fontSize: 14.5, lineHeight: 20, fontWeight: "700" },
});
