import { Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp } from "./src/store/AppProvider";
import { currentCustomer } from "./src/domain/repository";
import { Button, colors, ui } from "./src/components/ui";
import type { RootRoutes } from "./src/navigation/routes";
import { ClientMainTabs, DriverMainTabs } from "./src/navigation/MainTabs";
import {
  MotionProvider,
  useReducedMotion,
} from "./src/design-system/MotionProvider";
import { OverlayProvider } from "./src/components/overlay/OverlayProvider";
import { Skeleton } from "./src/components/presentation";
import {
  KycPendingScreen,
  KycRejectedScreen,
  KycSelfieScreen,
  KycUploadScreen,
  LoginScreen,
  PasswordScreen,
  RegisterScreen,
  SplashScreen,
} from "./src/screens/AuthScreens";
import {
  ClientOrderDetailScreen,
  ClientScheduleScreen,
} from "./src/screens/ClientOrderScreens";
import { NewOrderScreen } from "./src/screens/NewOrderScreen";
import {
  AddressesScreen,
  BillingScreen,
  NotificationsScreen,
  SupportScreen,
  WalletScreen,
} from "./src/screens/AccountScreens";
import {
  ChatScreen,
  DriverMapScreen,
  TrackingScreen,
} from "./src/screens/TrackingAndChatScreens";
import {
  DriverDeliveryConfirmScreen,
  DriverPickupConfirmScreen,
  DriverServiceDetailScreen,
} from "./src/screens/DriverScreens";

const Stack = createNativeStackNavigator<RootRoutes>();
function SecurityScreen() {
  return <PasswordScreen />;
}
function ForcedPasswordScreen() {
  return <PasswordScreen forced />;
}
function Navigation() {
  const { state, ready, error, reset, retry } = useApp();
  const reduced = useReducedMotion();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 16,
        }}
      >
        {error ? (
          <>
            <Text style={ui.error}>{error}</Text>
            <Button label="Reintentar carga" onPress={retry} />
            <Button
              label="Restablecer datos locales demo"
              secondary
              onPress={reset}
            />
          </>
        ) : (
          <>
            <View style={{ width: "80%", maxWidth: 400 }}>
              <Skeleton lines={4} />
            </View>
            <Text style={ui.muted}>Cargando Laundry…</Text>
          </>
        )}
      </View>
    );
  const session = state.session;
  const c = currentCustomer(state);
  const flow = !session
    ? "auth"
    : session.role === "CLIENT"
      ? c.kycStatus === "APPROVED"
        ? "client"
        : `kyc-${c.kycStatus}`
      : state.driver.mustChangePassword
        ? "password"
        : "driver";
  const initial: keyof RootRoutes =
    flow === "auth"
      ? "Login"
      : flow === "client"
        ? "ClientTabs"
        : flow === "driver"
          ? "DriverTabs"
          : flow === "password"
            ? "DriverChangePassword"
            : c.kycStatus === "PENDING"
              ? "KycPending"
              : c.kycStatus === "REJECTED"
                ? "KycRejected"
                : "KycUpload";
  return (
    <NavigationContainer key={`${session?.id ?? "anonymous"}-${flow}`}>
      <OverlayProvider>
        <Stack.Navigator
          initialRouteName={initial}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: reduced ? "none" : "fade",
          }}
        >
          {flow === "auth" ? (
            <>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="RegisterStep1" component={RegisterScreen} />
            </>
          ) : flow.startsWith("kyc-") ? (
            <>
              <Stack.Screen name="KycUpload" component={KycUploadScreen} />
              <Stack.Screen name="KycSelfie" component={KycSelfieScreen} />
              <Stack.Screen name="KycPending" component={KycPendingScreen} />
              <Stack.Screen name="KycRejected" component={KycRejectedScreen} />
            </>
          ) : flow === "password" ? (
            <Stack.Screen
              name="DriverChangePassword"
              component={ForcedPasswordScreen}
            />
          ) : flow === "client" ? (
            <>
              <Stack.Screen name="ClientTabs" component={ClientMainTabs} />
              <Stack.Screen
                name="ClientNewOrderWizard"
                component={NewOrderScreen}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen
                name="ClientOrderDetail"
                component={ClientOrderDetailScreen}
                getId={({ params }) => params.orderId}
              />
              <Stack.Screen
                name="ClientSchedule"
                component={ClientScheduleScreen}
                getId={({ params }) => params.orderId}
              />
              <Stack.Screen name="ClientTracking" component={TrackingScreen} />
              <Stack.Screen name="ClientWallet" component={WalletScreen} />
              <Stack.Screen
                name="ClientAddresses"
                component={AddressesScreen}
              />
              <Stack.Screen name="ClientBilling" component={BillingScreen} />
              <Stack.Screen
                name="ClientNotifications"
                component={NotificationsScreen}
              />
              <Stack.Screen name="ClientSupport" component={SupportScreen} />
              <Stack.Screen name="ClientSecurity" component={SecurityScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="DriverTabs" component={DriverMainTabs} />
              <Stack.Screen
                name="DriverServiceDetail"
                component={DriverServiceDetailScreen}
                getId={({ params }) => params.orderId}
              />
              <Stack.Screen name="DriverMap" component={DriverMapScreen} />
              <Stack.Screen
                name="DriverPickupConfirm"
                component={DriverPickupConfirmScreen}
              />
              <Stack.Screen
                name="DriverDeliveryConfirm"
                component={DriverDeliveryConfirmScreen}
              />
              <Stack.Screen name="Chat" component={ChatScreen} />
            </>
          )}
        </Stack.Navigator>
      </OverlayProvider>
    </NavigationContainer>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <MotionProvider>
        <AppProvider>
          <Navigation />
        </AppProvider>
      </MotionProvider>
    </SafeAreaProvider>
  );
}
