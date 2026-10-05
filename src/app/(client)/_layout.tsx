import { Redirect, Stack } from "expo-router";
import { useApp } from "../../store/AppStore";
import { Colors } from "../../theme/colors";
export default function ClientLayout() {
  const { session, data } = useApp();
  if (
    !session ||
    session.role !== "CLIENTE" ||
    data.customers.find((c) => c.id === session.userId)?.kycStatus !==
      "APPROVED"
  )
    return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.primary,
        headerTitle: "Clean & Fresh",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="new-order" options={{ headerShown: false }} />
    </Stack>
  );
}
