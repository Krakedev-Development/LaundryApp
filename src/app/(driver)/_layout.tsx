import { Redirect, Stack, usePathname } from "expo-router";
import { useApp } from "../../store/AppStore";
import { Colors } from "../../theme/colors";
export default function DriverLayout() {
  const { session, data } = useApp();
  const pathname = usePathname();
  if (!session || session.role !== "CHOFER") return <Redirect href="/" />;
  if (
    data.drivers.find((d) => d.id === session.userId)?.mustChangePassword &&
    pathname !== "/change-password"
  )
    return <Redirect href="/(driver)/change-password" />;
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.primary,
        headerTitle: "Clean & Fresh",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="change-password"
        options={{ headerBackVisible: false }}
      />
    </Stack>
  );
}
