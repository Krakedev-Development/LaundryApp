import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppProvider, useApp } from "../store/AppStore";
import {
  LoadingSkeleton,
  OfflineBanner,
  ToastProvider,
} from "../components/ui";
import { Colors } from "../theme/colors";

function AppNavigation() {
  const { ready } = useApp();
  if (!ready) return <LoadingSkeleton />;
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
      edges={["top", "bottom"]}
    >
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaView>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <AppNavigation />
        </ToastProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
