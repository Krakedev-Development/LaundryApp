import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../theme/colors";
import { IconName } from "../../../components/ui";
export default function DriverTabs() {
  const icons: Record<string, IconName> = {
    route: "navigate-outline",
    services: "list-outline",
    history: "time-outline",
    profile: "person-outline",
  };
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { height: 64, paddingTop: 8, paddingBottom: 8 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="route" options={{ title: "Ruta" }} />
      <Tabs.Screen name="services" options={{ title: "Servicios" }} />
      <Tabs.Screen name="history" options={{ title: "Historial" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
