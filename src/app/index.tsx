import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

export default function Index() {
  const { user } = useAuthStore();

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.status !== 'approved') return <Redirect href="/(auth)/pending" />;
  if (user.role === 'admin') return <Redirect href="/(admin)/" />;
  if (user.role === 'supervisor') return <Redirect href="/(admin)/" />;
  if (user.role === 'driver') return <Redirect href="/(driver)/" />;
  return <Redirect href="/(client)/(tabs)/" />;
}
