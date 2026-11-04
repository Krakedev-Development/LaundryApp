import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Title } from "./ui";
import { contentTheme as theme } from "../design-system/classic";

/** Billing form surfaces from 4fa1bd3; current fields and save remain in the screen. */
export function BillingIntro({ children }: { children: ReactNode }) {
  return (
    <View style={billingStyles.intro}>
      <View style={billingStyles.introIcon}>
        <Icon
          name="document-text-outline"
          size={22}
          color={theme.colors.primary}
        />
      </View>
      <View style={billingStyles.introContent}>
        <Title style={billingStyles.introTitle}>Datos fiscales</Title>
        {children}
      </View>
    </View>
  );
}

export const billingStyles = StyleSheet.create({
  intro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  introIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  introContent: { flex: 1, minWidth: 0, gap: 4 },
  introTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#1E40AF",
  },
  introText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    color: "#1E40AF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: { fontSize: 12, lineHeight: 18, fontWeight: "700", color: "#64748B" },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FAFAFA",
  },
  saveAction: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
  },
  saveText: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
});
