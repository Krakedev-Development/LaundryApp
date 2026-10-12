import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { contentTheme as theme } from "../design-system/classic";
import { Body, Card, Icon, Title, type IconName } from "./ui";

// Presentation from 4fa1bd3, with data and actions supplied by the current screens.
const tones = {
  blue: { ink: "#3B82F6", background: "#EFF6FF" },
  green: { ink: "#15803D", background: "#F0FDF4" },
  purple: { ink: "#7C3AED", background: "#F5F3FF" },
  amber: { ink: "#B45309", background: "#FFFBEB" },
  red: { ink: "#DC2626", background: "#FEF2F2" },
  gray: { ink: "#6B7280", background: "#F3F4F6" },
};

export function ProfileHero({
  title,
  email,
  children,
}: {
  title: string;
  email: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.hero}>
      <View style={styles.logoCircle}>
        <Image
          source={require("../../assets/logo-laundry-lav.png")}
          resizeMode="contain"
          accessible={false}
          style={styles.logo}
        />
      </View>
      <Title style={styles.heroTitle}>{title}</Title>
      <Body muted style={styles.heroEmail}>{email}</Body>
      {children}
    </Card>
  );
}

export function ProfileStats({
  items,
}: {
  items: readonly { label: string; text: string | number }[];
}) {
  return (
    <Card style={styles.stats}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[styles.stat, index > 0 && styles.statDivider]}
        >
          <Text style={styles.statNumber}>{item.text}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </Card>
  );
}

export function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Title style={styles.sectionTitle}>{title}</Title>
      <Card style={styles.sectionCard}>{children}</Card>
    </View>
  );
}

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
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowDivider,
        { opacity: pressed ? 0.7 : 1 },
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
      <Icon name="chevron-forward" size={16} color="#9CA3AF" />
    </Pressable>
  );
}

export function ProfileDetail({
  label,
  children,
  icon,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  icon: IconName;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={[styles.detailIcon, { backgroundColor: theme.colors.soft }]}>
        <Icon name={icon} size={16} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Body style={styles.detailValue}>{children}</Body>
    </View>
  );
}

export function ProfileLogout({ onPress }: { onPress(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      onPress={onPress}
      style={({ pressed }) => [styles.logout, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Icon name="log-out-outline" size={18} color="#B91C1C" />
      <Text style={styles.logoutText}>Cerrar sesión</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  logo: { width: 72, height: 72 },
  heroTitle: { fontSize: 20, lineHeight: 27, textAlign: "center" },
  heroEmail: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: "100%",
  },
  stats: { flexDirection: "row", gap: 0, paddingVertical: 16 },
  stat: { flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 8 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: "#E5E7EB" },
  statNumber: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },
  statLabel: { fontSize: 12, lineHeight: 18, color: theme.colors.muted },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    padding: 0,
    gap: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    minHeight: 64,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, minWidth: 0, gap: 2 },
  rowLabel: { fontSize: 15, lineHeight: 21, fontWeight: "500", color: "#374151" },
  balanceLabel: { fontSize: 12, lineHeight: 18, color: theme.colors.muted },
  balanceAmount: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: theme.colors.muted,
  },
  detailValue: {
    flex: 1.3,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "right",
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    minHeight: 52,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#B91C1C",
  },
});
