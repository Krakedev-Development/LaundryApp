import { ActivityIndicator, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp } from "./src/store/AppProvider";
import { currentCustomer } from "./src/domain/repository";
import { Button, colors, ui } from "./src/components/ui";
import type { Routes } from "./src/navigation/routes";
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
  ClientHomeScreen,
  ClientOrderDetailScreen,
  ClientOrdersScreen,
} from "./src/screens/ClientOrderScreens";
import { NewOrderScreen } from "./src/screens/NewOrderScreen";
import {
  AddressesScreen,
  BenefitsScreen,
  BillingScreen,
  ClientProfileScreen,
  DriverProfileScreen,
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
  DriverHistoryScreen,
  DriverPickupConfirmScreen,
  DriverRouteScreen,
  DriverServiceDetailScreen,
  DriverServicesScreen,
} from "./src/screens/DriverScreens";

const Stack = createNativeStackNavigator<Routes>();
function SecurityScreen() {
  return <PasswordScreen />;
}
function ForcedPasswordScreen() {
  return <PasswordScreen forced />;
}
function Navigation() {
  const { state, ready, error, reset, retry } = useApp();
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
            <ActivityIndicator size="large" color={colors.primary} />
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
  const initial: keyof Routes =
    flow === "auth"
      ? "Login"
      : flow === "client"
        ? "ClientHome"
        : flow === "driver"
          ? "DriverRoute"
          : flow === "password"
            ? "DriverChangePassword"
            : c.kycStatus === "PENDING"
              ? "KycPending"
              : c.kycStatus === "REJECTED"
                ? "KycRejected"
                : "KycUpload";
  return (
    <NavigationContainer key={`${session?.id ?? "anonymous"}-${flow}`}>
      <Stack.Navigator
        initialRouteName={initial}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
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
            <Stack.Screen name="ClientHome" component={ClientHomeScreen} />
            <Stack.Screen name="ClientOrders" component={ClientOrdersScreen} />
            <Stack.Screen
              name="ClientNewOrderWizard"
              component={NewOrderScreen}
            />
            <Stack.Screen name="ClientBenefits" component={BenefitsScreen} />
            <Stack.Screen
              name="ClientProfile"
              component={ClientProfileScreen}
            />
            <Stack.Screen
              name="ClientOrderDetail"
              component={ClientOrderDetailScreen}
            />
            <Stack.Screen name="ClientTracking" component={TrackingScreen} />
            <Stack.Screen name="ClientWallet" component={WalletScreen} />
            <Stack.Screen name="ClientAddresses" component={AddressesScreen} />
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
            <Stack.Screen name="DriverRoute" component={DriverRouteScreen} />
            <Stack.Screen
              name="DriverServices"
              component={DriverServicesScreen}
            />
            <Stack.Screen
              name="DriverHistory"
              component={DriverHistoryScreen}
            />
            <Stack.Screen
              name="DriverProfile"
              component={DriverProfileScreen}
            />
            <Stack.Screen
              name="DriverServiceDetail"
              component={DriverServiceDetailScreen}
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
    </NavigationContainer>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppProvider>
        <Navigation />
      </AppProvider>
    </SafeAreaProvider>
  );
}
