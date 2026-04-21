import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Layout raíz — redirige según el rol del usuario autenticado.
 * Si no hay sesión, manda al flujo de auth.
 */
export default function RootLayout() {
  const { user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user) {
      // Redirige al dashboard según el rol
      if (user.status === 'pending') {
        router.replace('/(auth)/pending');
        return;
      }
      switch (user.role) {
        case 'admin':
          router.replace('/(admin)/');
          break;
        case 'driver':
          router.replace('/(driver)/');
          break;
        default:
          router.replace('/(client)/');
      }
    }
  }, [user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(client)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(driver)" />
    </Stack>
  );
}
