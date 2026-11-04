import { Pressable, StyleSheet, Text, View } from "react-native";
import { contentTheme as theme } from "../design-system/classic";
import { Icon, type IconName } from "./ui";

/** Home presentation from 4fa1bd3; values and actions belong to the screen. */
export function HomeMetric({
  title,
  amount,
  caption,
  icon,
  color = theme.colors.primary,
  onPress,
}: {
  title: string;
  amount: string;
  caption: string;
  icon: IconName;
  color?: string;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        homeStyles.metric,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Icon name={icon} size={20} color={color} />
      <Text style={homeStyles.metricAmount}>{amount}</Text>
      <Text style={homeStyles.metricCaption}>{caption}</Text>
      <View style={homeStyles.metricLink}>
        <Text style={homeStyles.metricLinkText}>{title}</Text>
        <Icon name="chevron-forward" size={12} />
      </View>
    </Pressable>
  );
}

export const homeStyles = StyleSheet.create({
  hero: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowOpacity: 0,
    elevation: 0,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: theme.colors.onPrimary,
  },
  heroBody: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.9)",
  },
  heroAction: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
  },
  charges: {
    backgroundColor: theme.colors.warningSoft,
    borderWidth: 1,
    borderColor: "#FDE68A",
    shadowOpacity: 0,
    elevation: 0,
  },
  metrics: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 0,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    gap: 4,
  },
  metricDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
  },
  metricAmount: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  metricCaption: {
    fontSize: 11,
    lineHeight: 17,
    color: theme.colors.muted,
    textAlign: "center",
  },
  metricLink: { flexDirection: "row", alignItems: "center", gap: 3 },
  metricLinkText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  sectionTitle: { fontSize: 17, lineHeight: 24, fontWeight: "700" },
  allOrders: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 0,
    minHeight: 48,
  },
});
