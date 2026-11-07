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
          <Icon name={icon} size={22} color="#143F73" />
        </View>
        <View style={garmentStyles.info}>{children}</View>
      </View>
      <View style={garmentStyles.controls}>{controls}</View>
    </Card>
  );
}

const tones: Record<string, { color: string; icon: IconName }> = {
  "ext-1": { color: "#2563EB", icon: "layers-outline" },
  "ext-2": { color: "#0284C7", icon: "flower-outline" },
  "ext-3": { color: "#7C3AED", icon: "bag-outline" },
  "ext-4": { color: "#059669", icon: "shield-checkmark-outline" },
};
export const extraTone = (id: string) =>
  tones[id] ?? { color: "#2563EB", icon: "sparkles-outline" as IconName };

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
        style={[
          garmentStyles.icon,
          {
            backgroundColor: checked ? tone.color : tone.color + "18",
          },
        ]}
      >
        <Icon
          name={tone.icon}
          size={20}
          color={checked ? "#FFFFFF" : tone.color}
        />
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
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  catalog: {
    backgroundColor: "#FFFFFF",
    padding: 0,
    gap: 10,
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#1E293B",
  },
  garment: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowOpacity: 0,
    elevation: 0,
  },
  garmentTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 15, lineHeight: 21, fontWeight: "700", color: "#0F172A" },
  description: { fontSize: 12.5, lineHeight: 18, color: "#64748B" },
  service: {
    fontSize: 11.5,
    lineHeight: 17,
    color: "#143F73",
    fontWeight: "700",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
    paddingTop: 8,
  },
  quantityButton: {
    borderWidth: 1.5,
    borderColor: "#2563EB",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  quantity: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    color: "#0F172A",
    minWidth: 36,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  choice: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    padding: 13,
  },
  selectedChoice: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  choiceText: { fontSize: 13.5, lineHeight: 19, fontWeight: "700" },
  input: {
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FAFAFA",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  label: { fontSize: 13, lineHeight: 19, fontWeight: "700", color: "#334155" },
  extra: {
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  selectedExtra: {
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
  },
  extraName: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  extraRight: { alignItems: "flex-end", gap: 6 },
  extraPrice: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  next: { backgroundColor: "#143F73", borderRadius: 12, padding: 16 },
});
