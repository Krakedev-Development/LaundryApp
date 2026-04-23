import { Stack } from 'expo-router';

export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="order" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="map" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="chat" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
