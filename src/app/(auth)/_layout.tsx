import { Stack } from "expo-router";
import { Colors } from "../../theme/colors";
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.primary,
        headerTitle: "Clean & Fresh",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="pending" options={{ headerShown: false }} />
      <Stack.Screen name="kyc" options={{ headerShown: false }} />
    </Stack>
  );
}
