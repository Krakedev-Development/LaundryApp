import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, type IconName } from "./ui";

/** Current scheduled-result view, using the confirmation palette from 4fa1bd3. */
export function ScheduledCheck() {
  return (
    <View style={scheduledStyles.checkOuter}>
      <View style={scheduledStyles.check}>
        <Icon name="checkmark" size={42} color="#059669" />
      </View>
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
      <View style={scheduledStyles.infoIconWrap}>
        <Icon name={icon} size={17} color="#143F73" />
      </View>
      <View style={scheduledStyles.infoContent}>{children}</View>
    </View>
  );
}

export const scheduledStyles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  checkOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  check: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
  },
  title: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  id: { alignSelf: "center" },
  info: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: { flex: 1, minWidth: 0 },
  divider: { height: 1, backgroundColor: "#E2E8F0" },
  text: {
    fontSize: 13.5,
    lineHeight: 19,
    color: "#1E293B",
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  action: { backgroundColor: "#143F73", borderRadius: 12, padding: 15 },
  secondary: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  secondaryText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#475569",
  },
});
