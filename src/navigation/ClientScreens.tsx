import { SupportScreen } from "../screens/support/SupportScreen";
import { AddressesScreen } from "../screens/addresses/AddressesScreen";
import { NotificationsScreen } from "../screens/notifications/NotificationsScreen";
import { WalletScreen } from "../screens/payments/WalletScreen";
import { ClientMainTabs } from "../navigation/MainTabs";
import { PaymentMethodsScreen } from "../screens/payments/PaymentMethodsScreen";
import { AddPaymentMethodScreen } from "../screens/payments/AddPaymentMethodScreen";
import { PasswordScreen } from "../screens/auth/PasswordScreen";
import {
  ClientOrderDetailScreen,
  ClientScheduleScreen,
} from "../screens/ClientOrderScreens";
import { NewOrderScreen } from "../screens/NewOrderScreen";
import { BillingScreen } from "../screens/billing/BillingScreen";
import { ChatScreen, TrackingScreen } from "../screens/TrackingAndChatScreens";
import { Stack } from "./RootStack";
function SecurityScreen() {
  return <PasswordScreen />;
}
export function clientScreens() {
  return (
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
        name="ClientPaymentMethods"
        component={PaymentMethodsScreen}
      />
      <Stack.Screen
        name="ClientAddPaymentMethod"
        component={AddPaymentMethodScreen}
      />
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
  );
}
