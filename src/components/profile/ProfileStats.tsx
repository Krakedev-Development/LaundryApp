import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { contentTheme as theme } from "../../design-system/classic";
import { Card } from "../ui";

export function ProfileStats({
  items,
}: {
  items: readonly { label: string; text: string | number }[];
}) {
  return (
    <Card style={styles.card}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && <View style={styles.divider} />}
          <View style={styles.stat}>
            <Text style={styles.value}>{item.text}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        </Fragment>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 8,
  },
  divider: {
    width: 1,
    height: 42,
    backgroundColor: theme.colors.border,
  },
  value: {
    maxWidth: "100%",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: theme.colors.primary,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  label: {
    maxWidth: "100%",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    color: theme.colors.muted,
    textAlign: "center",
  },
});
