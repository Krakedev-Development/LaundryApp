import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { contentTheme as theme } from "../design-system/classic";
import { Card, Icon, Title, type IconName } from "./ui";

// Visual reference: 4fa1bd3. Catalog, eligibility and transactions stay in the screen.
export function promoTone(index: number) {
  return index === 0
    ? { background: theme.colors.primary, ink: theme.colors.onPrimary }
    : {
        background: index % 2 ? theme.colors.aqua : theme.colors.lime,
        ink: theme.colors.dark,
      };
}

const planTones: Record<string, { ink: string; soft: string }> = {
  "plan-basic": { ink: "#6B7280", soft: "#F3F4F6" },
  "plan-standard": { ink: theme.colors.primary, soft: theme.colors.soft },
  "plan-premium": { ink: "#7C3AED", soft: "#EDE9FE" },
};
export const membershipTone = (id: string) => planTones[id] ?? planTones["plan-basic"];

export function PromoSurface({ index, children }: { index: number; children: ReactNode }) {
  return (
    <Card style={[benefitStyles.promoCard, index === 0 && benefitStyles.featured]}>
      {children}
    </Card>
  );
}

export function BenefitIcon({ name }: { name: IconName }) {
  return (
    <View style={benefitStyles.rewardIcon}>
      <Icon name={name} size={20} color={theme.colors.onPrimary} />
    </View>
  );
}

export function PointsSummary({ points, children }: { points: number; children: ReactNode }) {
  return (
    <Card style={benefitStyles.pointsCard}>
      <View style={benefitStyles.pointsRow}>
        <View style={benefitStyles.pointsIconBadge}>
          <Icon name="star" size={24} color="#B45309" />
        </View>
        <Title style={benefitStyles.pointsHeading}>
          <Text style={benefitStyles.pointsNumber}>{points}</Text>
          {"\n"}
          <Text style={benefitStyles.pointsLabel}>puntos disponibles</Text>
        </Title>
      </View>
      {children}
    </Card>
  );
}

export const benefitStyles = StyleSheet.create({
  sectionTitle: { fontSize: 18, lineHeight: 25, fontWeight: "800" },
  promoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  promoCard: {
    flexGrow: 1,
    flexBasis: 260,
    minWidth: 0,
    padding: 0,
    gap: 0,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  featured: { flexBasis: "100%", borderColor: "#CBD5E1" },
  promoHero: { padding: 20, gap: 10 },
  promoHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  promoTitle: { flex: 1, fontSize: 22, lineHeight: 29, fontWeight: "800" },
  promoDescription: { fontSize: 14, lineHeight: 20 },
  promoBody: { padding: 16, gap: 14, backgroundColor: theme.colors.surface },
  conditions: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  conditionText: { flex: 1, fontSize: 12, lineHeight: 18 },
  promoButton: { borderRadius: 12 },
  pointsCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 18,
    gap: 12,
    shadowColor: "#B45309",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pointsRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  pointsIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    alignItems: "center",
    justifyContent: "center",
  },
  pointsHeading: { flex: 1, color: "#92400E" },
  pointsNumber: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  pointsLabel: { fontSize: 12, lineHeight: 18, fontWeight: "600" },
  pointsExplanation: { color: "#92400E", fontSize: 12, lineHeight: 18 },
  rewardCard: {
    padding: 16,
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  rewardHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardInfo: { flex: 1, minWidth: 0, gap: 4 },
  rewardTitle: { fontSize: 15, lineHeight: 21, fontWeight: "700" },
  rewardCost: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    color: theme.colors.primary,
    fontVariant: ["tabular-nums"],
  },
  rewardDescription: { fontSize: 13, lineHeight: 19, color: "#374151" },
  rewardButton: { borderRadius: 12, minHeight: 48 },
  redemption: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  planCard: {
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderRadius: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  currentPlan: {
    backgroundColor: "#F8FAFC",
    shadowColor: "#143F73",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  planBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  planBadgeText: { fontSize: 11, lineHeight: 17, fontWeight: "800" },
  planHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  planName: { fontSize: 22, lineHeight: 29, fontWeight: "800" },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  planPrice: {
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "800",
    color: "#111827",
    fontVariant: ["tabular-nums"],
  },
  planPeriod: { fontSize: 14, lineHeight: 20 },
  features: { gap: 10 },
  feature: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  featureText: { flex: 1, fontSize: 13, lineHeight: 19, color: "#374151" },
  planButton: { borderRadius: 12, borderWidth: 0, paddingVertical: 14 },
});
