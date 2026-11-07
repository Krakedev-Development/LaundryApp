import { Pressable, StyleSheet, Text, View } from "react-native";
import { contentTheme as theme } from "../../design-system/classic";
import { tactile } from "../../design-system/interaction";
import { Icon, type IconName } from "../ui";

const tones = {
  blue: { ink: "#1D4ED8", background: "#EFF6FF" },
  green: { ink: "#15803D", background: "#F0FDF4" },
  purple: { ink: "#7C3AED", background: "#F5F3FF" },
  amber: { ink: "#B45309", background: "#FFFBEB" },
  red: { ink: "#DC2626", background: "#FEF2F2" },
  gray: { ink: "#6B7280", background: "#F3F4F6" },
};
export function ProfileRow({
  title,
  label = title,
  subtitle,
  icon,
  tone = "blue",
  last = false,
  onPress,
}: {
  title: string;
  label?: string;
  subtitle?: string;
  icon: IconName;
  tone?: keyof typeof tones;
  last?: boolean;
  onPress(): void;
}) {
  const color = tones[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        tactile("selection");
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: color.background }]}>
        <Icon name={icon} size={18} color={color.ink} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, subtitle && styles.balanceLabel]}>
          {label}
        </Text>
        {subtitle && <Text style={styles.balanceAmount}>{subtitle}</Text>}
      </View>
      <View style={styles.chevronBadge}>
        <Icon name="chevron-forward" size={15} color="#64748B" />
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    minHeight: 64,
  },
  rowPressed: {
    backgroundColor: "#F8FAFC",
    transform: [{ scale: 0.99 }],
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, minWidth: 0, gap: 2 },
  rowLabel: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: "#1E293B",
  },
  balanceLabel: { fontSize: 12, lineHeight: 18, color: theme.colors.muted },
  balanceAmount: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800",
    color: "#143F73",
    fontVariant: ["tabular-nums"],
  },
  chevronBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
});
