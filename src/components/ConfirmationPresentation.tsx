import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "./ui";

/** Confirmation surfaces from 4fa1bd3; agenda, prices and submission stay current. */
export function ConfirmationGroup({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <View style={confirmationStyles.agendaRow}>
      <Icon name={icon} size={14} color="#9CA3AF" />
      <View style={confirmationStyles.agendaContent}>{children}</View>
    </View>
  );
}

export const confirmationStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  title: { fontSize: 13, lineHeight: 19, fontWeight: "700", color: "#374151" },
  agendaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  agendaContent: { flex: 1, minWidth: 0, gap: 4 },
  address: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: "#111827",
  },
  caption: { fontSize: 12, lineHeight: 18, color: "#6B7280" },
  notice: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
  },
  promoRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  promoField: { flex: 1, minWidth: 0 },
  label: { fontSize: 12, lineHeight: 18, fontWeight: "700", color: "#374151" },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  apply: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    width: 116,
    paddingHorizontal: 10,
  },
  applyText: { fontSize: 14, lineHeight: 20, fontWeight: "700" },
  promoApplied: { flexDirection: "row", alignItems: "center", gap: 6 },
  promoText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#10B981",
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  priceLabel: { fontSize: 14, lineHeight: 20, color: "#6B7280", flexShrink: 1 },
  priceValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#111827",
  },
  discount: { color: "#10B981" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 4,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111827",
  },
  totalAmount: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "700",
    color: "#3B82F6",
  },
  paymentChoice: {
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 11,
    backgroundColor: "#FFFFFF",
  },
  paymentSelected: { borderColor: "#93C5FD", backgroundColor: "#EFF6FF" },
  paymentText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
  confirm: { backgroundColor: "#3B82F6", borderRadius: 12, padding: 16 },
});
