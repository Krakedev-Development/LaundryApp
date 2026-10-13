import { Pressable, StyleSheet, Text, View } from "react-native";
import { Body, Icon, Title } from "./ui";
import { contentTheme as theme } from "../design-system/classic";
import { tactile } from "../design-system/interaction";
import { money } from "../domain/models";

/** Visual treatment from 4fa1bd3; amounts and credit rules remain in WalletScreen. */
export function RechargeBalance({ balance }: { balance: number }) {
  return (
    <View style={rechargeStyles.balance}>
      <Body style={rechargeStyles.balanceLabel}>Saldo actual</Body>
      <Title style={rechargeStyles.balanceAmount}>{money(balance)}</Title>
    </View>
  );
}

export function RechargeAmountChoice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={() => {
        tactile("selection");
        onPress();
      }}
      style={({ pressed }) => [
        rechargeStyles.amount,
        selected && rechargeStyles.selectedAmount,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text
        style={[
          rechargeStyles.amountText,
          selected && rechargeStyles.selectedAmountText,
        ]}
      >
        {label}
      </Text>
      {selected && (
        <View style={rechargeStyles.check}>
          <Icon
            name="checkmark-circle"
            color={theme.colors.primary}
            size={16}
          />
        </View>
      )}
    </Pressable>
  );
}

export function RechargeSummary({ amount }: { amount: string }) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  return (
    <View style={rechargeStyles.summary}>
      <View style={rechargeStyles.summaryRow}>
        <Body muted style={rechargeStyles.summaryLabel}>
          Monto a recargar
        </Body>
        <Text style={rechargeStyles.summaryValue}>{money(value)}</Text>
      </View>
      <View style={[rechargeStyles.summaryRow, rechargeStyles.totalRow]}>
        <Body style={rechargeStyles.totalLabel}>Total a acreditar</Body>
        <Text style={rechargeStyles.totalValue}>{money(value)}</Text>
      </View>
    </View>
  );
}

export const rechargeStyles = StyleSheet.create({
  balance: {
    backgroundColor: theme.colors.soft,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  balanceLabel: { fontSize: 13, lineHeight: 20, color: theme.colors.primary },
  balanceAmount: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    color: theme.colors.dark,
  },
  sectionLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 4,
  },
  amounts: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amount: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 100,
    minHeight: 64,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedAmount: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.soft,
  },
  amountText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: "#374151",
  },
  selectedAmountText: { color: theme.colors.primary },
  check: { position: "absolute", top: 6, right: 6 },
  inputContainer: { position: "relative" },
  input: { borderRadius: 10, paddingLeft: 30, fontSize: 18, fontWeight: "600" },
  currency: {
    position: "absolute",
    top: 38,
    left: 14,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#374151",
  },
  summary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 14, lineHeight: 21 },
  summaryValue: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: "#111827",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 4,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  confirm: { borderRadius: 12, padding: 16 },
});
