import { StyleSheet, Text, View } from "react-native";
import { Body, Button, Card, Icon, IconButton, Title } from "./ui";
import { contentTheme as theme } from "../design-system/classic";
import type { PaymentMethod } from "../domain/models";

export const paymentMethodLabel = (method: PaymentMethod) =>
  `${method.kind === "CARD" ? method.brand : method.bank} · ${method.last4}`;

export function PaymentMethodCard({
  method,
  onMakeDefault,
  onDelete,
}: {
  method: PaymentMethod;
  onMakeDefault(): void;
  onDelete(): void;
}) {
  const tone =
    method.kind === "TRANSFER"
      ? theme.colors.primary
      : { Visa: "#1A1F71", Mastercard: "#EB001B", Amex: "#007BC1" }[
          method.brand
        ];
  return (
    <Card
      style={[
        paymentStyles.methodCard,
        method.isDefault && paymentStyles.defaultCard,
      ]}
    >
      <View style={paymentStyles.methodRow}>
        <View style={[paymentStyles.methodIcon, { backgroundColor: tone }]}>
          <Icon
            name={method.kind === "CARD" ? "card-outline" : "business-outline"}
            size={20}
            color="#FFFFFF"
          />
        </View>
        <View style={paymentStyles.methodInfo}>
          <View style={paymentStyles.brandRow}>
            <Title style={paymentStyles.methodTitle}>
              {method.kind === "CARD"
                ? method.brand.toUpperCase()
                : method.bank}
            </Title>
            {method.isDefault && (
              <Text style={paymentStyles.defaultBadge}>Principal</Text>
            )}
          </View>
          <Body style={paymentStyles.number}>•••• {method.last4}</Body>
          <Body muted>{method.holder}</Body>
          <Body muted>
            {method.kind === "CARD"
              ? `Vence ${method.expiry}`
              : `Transferencia · Cuenta ${method.accountType.toLowerCase()}`}
          </Body>
        </View>
        <IconButton
          label={`Eliminar ${paymentMethodLabel(method)}`}
          icon="trash-outline"
          onPress={onDelete}
        />
      </View>
      {!method.isDefault && (
        <Button
          label={`Usar ${paymentMethodLabel(method)} como principal`}
          variant="ghost"
          textStyle={paymentStyles.linkText}
          onPress={onMakeDefault}
        />
      )}
    </Card>
  );
}

export function PaymentCardPreview({
  holder,
  last4,
  expiry,
}: {
  holder: string;
  last4: string;
  expiry: string;
}) {
  return (
    <View style={paymentStyles.preview}>
      <View style={paymentStyles.previewTop}>
        <Icon name="wifi-outline" size={24} color="#FFFFFF" />
        <Icon name="card-outline" size={28} color="#FFFFFF" />
      </View>
      <Text style={paymentStyles.previewNumber}>
        •••• •••• •••• {last4 || "••••"}
      </Text>
      <View style={paymentStyles.previewBottom}>
        <View style={paymentStyles.previewHolder}>
          <Text style={paymentStyles.previewLabel}>Titular</Text>
          <Text style={paymentStyles.previewValue}>
            {holder.trim() || "NOMBRE APELLIDO"}
          </Text>
        </View>
        <View>
          <Text style={paymentStyles.previewLabel}>Vence</Text>
          <Text style={paymentStyles.previewValue}>{expiry || "MM/AA"}</Text>
        </View>
      </View>
    </View>
  );
}

export const paymentStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#374151",
  },
  methodCard: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    gap: 4,
    shadowOpacity: 0,
    elevation: 0,
  },
  defaultCard: { borderColor: theme.colors.primary },
  methodRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  methodInfo: { flex: 1, gap: 2 },
  brandRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  methodTitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#374151",
    flexShrink: 1,
  },
  defaultBadge: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: theme.colors.primary,
    backgroundColor: theme.colors.soft,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  number: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: "#111827" },
  addButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderStyle: "dashed",
    backgroundColor: "transparent",
  },
  linkText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  preview: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  previewTop: { flexDirection: "row", justifyContent: "space-between" },
  previewNumber: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  previewBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  previewHolder: { flex: 1, gap: 2 },
  previewLabel: { fontSize: 10, lineHeight: 16, color: "#E8EEF5" },
  previewValue: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  form: { gap: 16 },
  splitFields: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  halfField: { flex: 1, minWidth: 110 },
  input: { borderRadius: 10 },
  saveButton: { borderRadius: 12 },
});
