import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-order/step1-garments" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="new-order/step2-extras" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="new-order/step3-pickup" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="new-order/step4-delivery" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="new-order/step5-confirm" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="addresses" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="order-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="payments/index" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="payments/recharge" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="payments/add-card" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="payments/subscriptions" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="tracking" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="chat" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
