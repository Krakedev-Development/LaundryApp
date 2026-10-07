import { Stack,Redirect } from 'expo-router';
import {useAuthStore} from '../../store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_COLORS } from '../../theme/brand';

export default function DriverLayout() {
  const user=useAuthStore(s=>s.user);
  if(!user||!["driver"].includes(user.role)||user.status!=='approved')return <Redirect href="/"/>;
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
