import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { clientTabs, driverTabs, type Tab } from "../navigation/primaryTabs";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
import { colors, Icon } from "./ui";

export function NavigationBar({
  tabs,
  activeRoute,
  onSelect,
}: {
  tabs: Tab[];
  activeRoute: string;
  onSelect(route: Tab["route"]): void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      {tabs.map((tab) => {
        const selected = activeRoute === tab.route;
        return (
          <Pressable
            key={tab.route}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            aria-selected={selected}
            onPress={() => onSelect(tab.route)}
            style={{
              flex: 1,
              alignItems: "center",
              gap: 3,
              paddingVertical: 10,
              minHeight: 54,
            }}
          >
            <Icon
              name={tab.icon}
              color={selected ? colors.primary : colors.muted}
            />
            <Text
              style={{
                fontSize: 11,
                color: selected ? colors.primary : colors.muted,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MainTabBar({
  state,
  navigation,
  role,
}: BottomTabBarProps & { role: "CLIENT" | "DRIVER" }) {
  const appNavigation = useLaundryNavigation();
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ backgroundColor: colors.surface }}
    >
      <NavigationBar
        tabs={role === "CLIENT" ? clientTabs : driverTabs}
        activeRoute={state.routes[state.index].name}
        onSelect={(name) => {
          if (name === "ClientNewOrderWizard") {
            appNavigation.navigate(name);
            return;
          }
          const target = state.routes.find((route) => route.name === name);
          if (!target) return;
          const event = navigation.emit({
            type: "tabPress",
            target: target.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) navigation.navigate(name);
        }}
      />
    </SafeAreaView>
  );
}
