import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_COLORS } from '../../theme/brand';

export default function AdminLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_COLORS.background }} edges={['top']}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BRAND_COLORS.background } }} />
    </SafeAreaView>
  );
}
