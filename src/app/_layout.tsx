import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {BusinessBootstrap} from '../components/mvp/BusinessBootstrap';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <BusinessBootstrap><Stack screenOptions={{ headerShown: false }} /></BusinessBootstrap>
    </SafeAreaProvider>
  );
}
