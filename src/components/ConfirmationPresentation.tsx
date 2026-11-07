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
      <View style={confirmationStyles.agendaIconWrap}>
        <Icon name={icon} size={15} color="#143F73" />
      </View>
      <View style={confirmationStyles.agendaContent}>{children}</View>
    </View>
  );
}

export const confirmationStyles = StyleSheet.create({
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
    shadowRadius: 8,
    elevation: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  agendaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  agendaIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  agendaContent: { flex: 1, minWidth: 0, gap: 3 },
  address: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "700",
    color: "#0F172A",
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontVariant: ["tabular-nums"],
  },
  notice: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  promoRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  promoField: { flex: 1, minWidth: 0 },
  label: { fontSize: 12, lineHeight: 18, fontWeight: "700", color: "#334155" },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  apply: {
    backgroundColor: "#143F73",
    borderRadius: 10,
    width: 124,
    paddingHorizontal: 10,
  },
  applyText: { fontSize: 13.5, lineHeight: 19, fontWeight: "700" },
  promoApplied: { flexDirection: "row", alignItems: "center", gap: 6 },
  promoText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "700",
    color: "#059669",
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  priceLabel: { fontSize: 14, lineHeight: 20, color: "#64748B", flexShrink: 1 },
  priceValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#0F172A",
    fontVariant: ["tabular-nums"],
  },
  discount: { color: "#059669" },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: "#E2E8F0",
    marginTop: 6,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  totalAmount: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "800",
    color: "#143F73",
    fontVariant: ["tabular-nums"],
  },
  paymentChoice: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  paymentSelected: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  paymentText: { fontSize: 13.5, lineHeight: 19, fontWeight: "600" },
  confirm: { backgroundColor: "#143F73", borderRadius: 12, padding: 16 },
});
