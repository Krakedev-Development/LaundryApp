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
        <Icon name="star" size={28} color="#B45309" />
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
  sectionTitle: { fontSize: 18, lineHeight: 25, fontWeight: "700" },
  promoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  promoCard: {
    flexGrow: 1,
    flexBasis: 260,
    minWidth: 0,
    padding: 0,
    gap: 0,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  featured: { flexBasis: "100%" },
  promoHero: { padding: 20, gap: 10 },
  promoHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  promoTitle: { flex: 1, fontSize: 22, lineHeight: 29, fontWeight: "700" },
  promoDescription: { fontSize: 14, lineHeight: 20 },
  promoBody: { padding: 16, gap: 14, backgroundColor: theme.colors.surface },
  conditions: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  conditionText: { flex: 1, fontSize: 12, lineHeight: 18 },
  promoButton: { borderRadius: 10 },
  pointsCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowOpacity: 0,
    elevation: 0,
  },
  pointsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  pointsHeading: { flex: 1, color: "#92400E" },
  pointsNumber: { fontSize: 28, lineHeight: 35, fontWeight: "700" },
  pointsLabel: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
  pointsExplanation: { color: "#92400E", fontSize: 12, lineHeight: 18 },
  rewardCard: {
    padding: 14,
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  rewardHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardInfo: { flex: 1, minWidth: 0, gap: 4 },
  rewardTitle: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  rewardCost: { fontSize: 12, lineHeight: 18, color: theme.colors.muted },
  rewardDescription: { fontSize: 13, lineHeight: 19, color: "#374151" },
  rewardButton: { borderRadius: 10, minHeight: 48 },
  redemption: {
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  planCard: {
    padding: 18,
    gap: 14,
    borderWidth: 2,
    borderRadius: 16,
    shadowOpacity: 0,
    elevation: 0,
  },
  currentPlan: { shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  planBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgeText: { fontSize: 11, lineHeight: 17, fontWeight: "700" },
  planHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  planName: { fontSize: 22, lineHeight: 29, fontWeight: "700" },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  planPrice: { fontSize: 28, lineHeight: 35, fontWeight: "700", color: "#111827" },
  planPeriod: { fontSize: 14, lineHeight: 20 },
  features: { gap: 8 },
  feature: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  featureText: { flex: 1, fontSize: 13, lineHeight: 19, color: "#374151" },
  planButton: { borderRadius: 10, borderWidth: 0, paddingVertical: 14 },
});
