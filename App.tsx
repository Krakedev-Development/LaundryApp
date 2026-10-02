import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LaundryProvider } from './src/store/LaundryStore';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <LaundryProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </LaundryProvider>
    </SafeAreaProvider>
  );
}
