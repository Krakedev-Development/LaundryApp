import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "./ui";

/** Current scheduled-result view, using the confirmation palette from 4fa1bd3. */
export function ScheduledCheck() {
  return (
    <View style={scheduledStyles.check}>
      <Icon name="checkmark" size={42} color="#10B981" />
    </View>
  );
}

export function ScheduledInfo({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <View style={scheduledStyles.infoRow}>
      <Icon name={icon} size={18} color="#6B7280" />
      <View style={scheduledStyles.infoContent}>{children}</View>
    </View>
  );
}

export const scheduledStyles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 24,
    gap: 16,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  check: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  id: { alignSelf: "center" },
  info: { backgroundColor: "#F9FAFB", borderRadius: 12, paddingHorizontal: 12 },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
  },
  infoContent: { flex: 1, minWidth: 0 },
  divider: { height: 1, backgroundColor: "#E5E7EB" },
  text: { fontSize: 13, lineHeight: 19, color: "#374151" },
  action: { backgroundColor: "#3B82F6", borderRadius: 12, padding: 14 },
  secondary: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  secondaryText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: "#64748B",
  },
});
