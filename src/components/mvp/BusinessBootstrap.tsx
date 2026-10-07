import { useEffect, useState, type PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import { useBusinessStore } from '../../store/useBusinessStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Loading, ui } from './ui';
export function BusinessBootstrap({ children }: PropsWithChildren) {
  const { state, error, initialize } = useBusinessStore();
  const [sessionReady, setSessionReady] = useState(
    useAuthStore.persist.hasHydrated(),
  );
  useEffect(() => {
    setSessionReady(useAuthStore.persist.hasHydrated());
    void initialize();
    return useAuthStore.persist.onFinishHydration(() => setSessionReady(true));
  }, [initialize]);
  if (error && !state)
    return (
      <View style={[ui.page, ui.content]}>
        <Text style={ui.title}>No se pudo cargar el MVP</Text>
        <Text style={ui.error}>{error}</Text>
        <Text style={ui.text}>
          Tus datos locales se conservan. Cierra y vuelve a abrir la app para
          reintentar.
        </Text>
      </View>
    );
  if (!state || !sessionReady) return <Loading />;
  return children;
}
