import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Icon } from "./ui";

/** Saved-address surfaces from 4fa1bd3, adapted to the current options sheet. */
export function AddressSurface({
  title,
  isPrimary,
  children,
  action,
}: {
  title: string;
  isPrimary: boolean;
  children: ReactNode;
  action: ReactNode;
}) {
  return (
    <Card style={[addressStyles.card, isPrimary && addressStyles.primaryCard]}>
      <View
        style={[addressStyles.icon, isPrimary && addressStyles.primaryIcon]}
      >
        <Icon
          name={
            title.trim().toLocaleLowerCase() === "casa"
              ? "home-outline"
              : "business-outline"
          }
          size={20}
          color={isPrimary ? "#FFFFFF" : "#3B82F6"}
        />
      </View>
      <View style={addressStyles.info}>{children}</View>
      {action}
    </Card>
  );
}

export const addressStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryCard: { borderColor: "#3B82F6" },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryIcon: { backgroundColor: "#3B82F6" },
  info: { flex: 1, minWidth: 0, gap: 3 },
  heading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
  },
  primaryBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    lineHeight: 16,
    color: "#3B82F6",
    fontWeight: "700",
    overflow: "hidden",
  },
  address: { fontSize: 12, lineHeight: 17, color: "#6B7280" },
  reference: { fontSize: 12, lineHeight: 17, color: "#6B7280" },
  add: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 14,
  },
  addText: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 21,
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    gap: 16,
    elevation: 0,
    shadowOpacity: 0,
  },
  formTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: "#111827",
  },
  label: { fontSize: 13, lineHeight: 19, fontWeight: "600", color: "#374151" },
  input: { borderRadius: 10, fontSize: 15, color: "#111827" },
  save: { backgroundColor: "#3B82F6", borderRadius: 12, padding: 14 },
  saveText: { fontSize: 15, lineHeight: 21, fontWeight: "700" },
});
