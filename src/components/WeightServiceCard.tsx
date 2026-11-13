import { Pressable, StyleSheet, Text, View } from "react-native";
import { Body, Card, Icon, Title } from "./ui";
import { tactile } from "../design-system/interaction";
import { round } from "../domain/models";
import type { WeightRestriction, WeightTier } from "../domain/catalog";

// El precio por libra admite hasta 4 decimales: no se redondea para no mostrar otro valor.
export const perPound = (n: number) =>
  `$${n.toFixed(4).replace(/(\.\d\d\d*?)0+$/, "$1")}`;

// Servicio por peso: restricciones vigentes y bolsas que el cliente puede elegir.
// Todo viene del servidor; cada bolsa tiene su propio precio por libra.
export function WeightServiceCard({
  tiers,
  restrictions,
  selectedId,
  onSelect,
}: {
  tiers: WeightTier[];
  restrictions: WeightRestriction[];
  selectedId?: string;
  onSelect(id: string): void;
}) {
  const selected = tiers.find((t) => t.id === selectedId);
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon name="basket-outline" size={22} color="#1D4ED8" />
        <Title style={styles.title}>
          {selected
            ? `Servicio de Ropa por Peso: ${perPound(selected.pricePerPound)} / lb`
            : "Servicio de Ropa por Peso"}
        </Title>
      </View>
      <Body style={styles.body}>
        El valor final se calculará cuando recibamos y pesemos tu ropa en
        planta con báscula calibrada.
      </Body>

      {restrictions.length > 0 && (
        <View
          style={styles.warning}
          accessibilityRole="summary"
          testID="weight_restrictions"
        >
          <View style={styles.warningHeader}>
            <Icon name="warning-outline" size={18} color="#B45309" />
            <Text style={styles.warningTitle}>
              Restricciones del servicio por peso:
            </Text>
          </View>
          {restrictions.map((r) => (
            <Text key={r.id} style={styles.warningItem}>
              {"•"} {r.text}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.question}>Bolsas estimadas que entregarás:</Text>
      {tiers.length === 0 ? (
        <Body muted>
          Todavía no hay bolsas disponibles. Elige la opción por prenda o
          inténtalo más tarde.
        </Body>
      ) : (
        <View style={styles.tiers} accessibilityRole="radiogroup">
          {tiers.map((t) => {
            const active = t.id === selectedId;
            return (
              <Pressable
                key={t.id}
                testID={`weight_tier_${t.id}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                aria-checked={active}
                accessibilityLabel={`${t.name}, aproximadamente ${t.estimatedWeightLb} libras, ${perPound(t.pricePerPound)} por libra`}
                onPress={() => {
                  tactile("selection");
                  onSelect(t.id);
                }}
                style={({ pressed }) => [
                  styles.tier,
                  active && styles.tierActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.tierName, active && styles.tierNameActive]}>
                  {t.name} (~{t.estimatedWeightLb} lb)
                </Text>
                <Text style={[styles.tierPrice, active && styles.tierNameActive]}>
                  {perPound(t.pricePerPound)} / lb
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {selected && (
        <View testID="weight_estimate">
          <Body muted>
            {`Estimado orientativo: ${selected.estimatedWeightLb} lb × ${perPound(selected.pricePerPound)} = $${round(selected.estimatedWeightLb * selected.pricePerPound).toFixed(2)}. No se cobra ahora.`}
          </Body>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: "700", color: "#1E3A8A" },
  body: { fontSize: 13.5, lineHeight: 20, color: "#1D4ED8" },
  warning: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  warningHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  warningTitle: { fontSize: 13, lineHeight: 18, fontWeight: "700", color: "#92400E" },
  warningItem: { fontSize: 12.5, lineHeight: 18, color: "#7C2D12" },
  question: { fontSize: 14, lineHeight: 20, fontWeight: "700", color: "#1E293B" },
  tiers: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tier: {
    flexGrow: 1,
    flexBasis: "30%",
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tierActive: { borderColor: "#143F73", backgroundColor: "#143F73" },
  tierName: { fontSize: 13, lineHeight: 18, fontWeight: "700", color: "#1E293B", textAlign: "center" },
  tierPrice: { fontSize: 12, lineHeight: 16, color: "#475569", textAlign: "center" },
  tierNameActive: { color: "#FFFFFF" },
});
