import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../theme/colors";
import { IconName } from "../../../components/ui";
export default function ClientTabs() {
  const router = useRouter();
  const icons: Record<string, IconName> = {
    home: "home-outline",
    orders: "receipt-outline",
    request: "add-circle",
    benefits: "gift-outline",
    profile: "person-outline",
  };
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: Colors.surface,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={icons[route.name]}
            size={route.name === "request" ? 34 : size}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Inicio" }} />
      <Tabs.Screen name="orders" options={{ title: "Pedidos" }} />
      <Tabs.Screen
        name="request"
        options={{ title: "Solicitar" }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/(client)/new-order/garments");
          },
        }}
      />
      <Tabs.Screen name="benefits" options={{ title: "Beneficios" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
