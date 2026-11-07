import { Pressable, StyleSheet, Text, View } from "react-native";
import { contentTheme as theme } from "../design-system/classic";
import { tactile } from "../design-system/interaction";
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
      onPress={() => {
        tactile("selection");
        onPress();
      }}
      style={({ pressed }) => [
        homeStyles.metric,
        {
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View
        style={[
          homeStyles.metricIconBadge,
          { backgroundColor: color + "18" },
        ]}
      >
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={homeStyles.metricAmount}>{amount}</Text>
      <Text style={homeStyles.metricCaption}>{caption}</Text>
      <View style={homeStyles.metricLink}>
        <Text style={homeStyles.metricLinkText}>{title}</Text>
        <Icon name="chevron-forward" size={12} color={theme.colors.primary} />
      </View>
    </Pressable>
  );
}

export const homeStyles = StyleSheet.create({
  hero: {
    backgroundColor: "#143F73",
    borderRadius: 18,
    padding: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: "#1E5291",
    shadowColor: "#0F315A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "800",
    color: theme.colors.onPrimary,
    letterSpacing: -0.3,
  },
  heroBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "rgba(255,255,255,0.92)",
  },
  heroAction: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
  },
  charges: {
    backgroundColor: theme.colors.warningSoft,
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 14,
    shadowOpacity: 0,
    elevation: 0,
  },
  metrics: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 0,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    minHeight: 92,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    gap: 4,
  },
  metricIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
    marginVertical: 4,
  },
  metricAmount: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  metricCaption: {
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.muted,
    textAlign: "center",
  },
  metricLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  metricLinkText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  allOrders: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 1,
    borderColor: "#D6DFEA",
    borderRadius: 12,
    minHeight: 48,
  },
});
