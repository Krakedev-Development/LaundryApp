import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, Icon, type IconName } from "./ui";

export function GarmentSurface({
  icon,
  children,
  controls,
}: {
  icon: IconName;
  children: ReactNode;
  controls: ReactNode;
}) {
  return (
    <Card style={garmentStyles.garment}>
      <View style={garmentStyles.garmentTop}>
        <View style={garmentStyles.icon}>
          <Icon name={icon} size={22} color="#2563EB" />
        </View>
        <View style={garmentStyles.info}>{children}</View>
      </View>
      <View style={garmentStyles.controls}>{controls}</View>
    </Card>
  );
}

const tones: Record<string, { color: string; icon: IconName }> = {
  "ext-1": { color: "#3B82F6", icon: "layers-outline" },
  "ext-2": { color: "#EC4899", icon: "flower-outline" },
  "ext-3": { color: "#7C3AED", icon: "bag-outline" },
  "ext-4": { color: "#10B981", icon: "shield-checkmark-outline" },
};
export const extraTone = (id: string) =>
  tones[id] ?? { color: "#3B82F6", icon: "sparkles-outline" as IconName };

/** Visual content for the existing Check control; selection stays in NewOrderScreen. */
export function ExtraContent({
  id,
  name,
  description,
  price,
  checked,
}: {
  id: string;
  name: string;
  description: string;
  price: string;
  checked: boolean;
}) {
  const tone = extraTone(id);
  return (
    <>
      <View
        style={[garmentStyles.icon, { backgroundColor: tone.color + "20" }]}
      >
        <Icon name={tone.icon} size={20} color={tone.color} />
      </View>
      <View style={garmentStyles.info}>
        <Text style={garmentStyles.extraName}>{name}</Text>
        <Text style={garmentStyles.description}>{description}</Text>
      </View>
      <View style={garmentStyles.extraRight}>
        <Text style={[garmentStyles.extraPrice, { color: tone.color }]}>
          {price}
        </Text>
        <View
          style={[
            garmentStyles.checkbox,
            checked && { backgroundColor: tone.color, borderColor: tone.color },
          ]}
        >
          {checked && <Icon name="checkmark" size={14} color="#FFFFFF" />}
        </View>
      </View>
    </>
  );
}

export const garmentStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowOpacity: 0,
    elevation: 0,
  },
  catalog: {
    backgroundColor: "#FFFFFF",
    padding: 0,
    gap: 8,
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#374151",
  },
  garment: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowOpacity: 0,
    elevation: 0,
  },
  garmentTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 14, lineHeight: 20, fontWeight: "700", color: "#111827" },
  description: { fontSize: 12, lineHeight: 18, color: "#6B7280" },
  service: {
    fontSize: 11,
    lineHeight: 17,
    color: "#2563EB",
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  quantityButton: {
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
  },
  quantity: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#111827",
    minWidth: 32,
    textAlign: "center",
  },
  choice: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    padding: 12,
  },
  selectedChoice: { borderColor: "#93C5FD", backgroundColor: "#EFF6FF" },
  choiceText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
  input: {
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FAFAFA",
    fontSize: 15,
  },
  label: { fontSize: 13, lineHeight: 19, fontWeight: "600", color: "#374151" },
  extra: {
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  selectedExtra: { backgroundColor: "#F9FAFB" },
  extraName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#111827",
  },
  extraRight: { alignItems: "flex-end", gap: 6 },
  extraPrice: { fontSize: 13, lineHeight: 19, fontWeight: "700" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  next: { backgroundColor: "#3B82F6", borderRadius: 12, padding: 16 },
});
