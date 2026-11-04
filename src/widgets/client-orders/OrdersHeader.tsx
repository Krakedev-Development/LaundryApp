import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Title, type IconName } from "../../components/ui";
import { ordersStyles } from "../../components/OrdersPresentation";
import { contentTheme as theme } from "../../design-system/classic";

export function OrdersHeader({
  history,
  onHistoryChange,
}: {
  history: boolean;
  onHistoryChange(value: boolean): void;
}) {
  const options: { history: boolean; label: string; icon: IconName }[] = [
    {
      history: false,
      label: "Activos",
      icon: history ? "receipt-outline" : "receipt",
    },
    {
      history: true,
      label: "Historial",
      icon: history ? "time" : "time-outline",
    },
  ];
  return (
    <View style={styles.header}>
      <Title style={[ordersStyles.screenTitle, styles.title]}>
        Mis solicitudes
      </Title>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Estado de solicitudes"
        style={styles.options}
      >
        {options.map((option) => {
          const selected = history === option.history;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected }}
              aria-checked={selected}
              onPress={() => onHistoryChange(option.history)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                pressed && { opacity: theme.opacity.pressed },
              ]}
            >
              <Icon
                name={option.icon}
                size={22}
                color={selected ? theme.colors.primary : theme.colors.muted}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { flex: 1, minWidth: 0 },
  options: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
    borderRadius: 14,
    backgroundColor: theme.colors.soft,
  },
  option: {
    width: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  selected: { backgroundColor: theme.colors.surface },
});
