import { Stack } from "expo-router";
import { Colors } from "../../../theme/colors";
export default function OrderLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: "Nueva solicitud",
        headerTintColor: Colors.primary,
        headerShadowVisible: false,
      }}
    />
  );
}
