import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Body, Card, Icon, Title } from "./ui";
import { contentTheme as theme } from "../design-system/classic";

/** Contact and FAQ surfaces from 4fa1bd3, with the current support channel. */
export function SupportContactCard({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  return (
    <Card style={supportStyles.contactCard}>
      <View style={supportStyles.contactRow}>
        <View style={supportStyles.mailIcon}>
          <Icon name="mail-outline" size={18} color="#2563EB" />
        </View>
        <View style={supportStyles.contactInfo}>
          <Title style={supportStyles.contactTitle}>Correo electrónico</Title>
          <Body style={supportStyles.contactEmail}>{email}</Body>
        </View>
      </View>
      {children}
    </Card>
  );
}

export const supportStyles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 12,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  mailIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: { flex: 1, minWidth: 0, gap: 2 },
  contactTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: "#374151",
  },
  contactEmail: { fontSize: 13, lineHeight: 19, color: theme.colors.muted },
  contactDescription: { fontSize: 13, lineHeight: 19 },
  contactAction: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
    justifyContent: "flex-start",
  },
  contactActionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  faqCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 0,
    gap: 0,
    overflow: "hidden",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  faqDivider: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  answer: { fontSize: 14, lineHeight: 21, color: theme.colors.muted },
});
