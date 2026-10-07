import { Stack,Redirect } from 'expo-router';
import {useAuthStore} from '../../store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND_COLORS } from '../../theme/brand';

export default function AdminLayout() {
  const user=useAuthStore(s=>s.user);
  if(!user||!["admin","supervisor"].includes(user.role)||user.status!=='approved')return <Redirect href="/"/>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_COLORS.background }} edges={['top']}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BRAND_COLORS.background } }} />
    </SafeAreaView>
  );
}
