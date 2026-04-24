import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_COLORS } from '../../theme/brand';

export default function DriverLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_COLORS.background }} edges={['top']}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BRAND_COLORS.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="order" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="map" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </SafeAreaView>
  );
}
