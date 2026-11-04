import { NavigationContainer } from "@react-navigation/native";
import { useApp } from "../store/AppProvider";
import { colors } from "../components/ui";
import { useReducedMotion } from "../design-system/MotionProvider";
import { OverlayProvider } from "../components/overlay/OverlayProvider";
import { Stack } from "./RootStack";
import { BootstrapState } from "../components/BootstrapState";
import { clientScreens } from "./ClientScreens";
import { authScreens, kycScreens } from "./AuthScreens";
import { currentCustomer } from "../domain/repository";
export function AppNavigation() {
  const { state, ready, error, reset, retry } = useApp();
  const reduced = useReducedMotion();
  if (!ready)
    return <BootstrapState error={error} reset={reset} retry={retry} />;
  const session = state.session;
  const customer = currentCustomer(state);
  const flow = !session
    ? "auth"
    : customer.kycStatus === "APPROVED"
      ? "client"
      : "kyc";
  const initial =
    flow === "auth"
      ? "Login"
      : flow === "client"
        ? "ClientTabs"
        : customer.kycStatus === "PENDING"
          ? "KycPending"
          : customer.kycStatus === "REJECTED"
            ? "KycRejected"
            : "KycUpload";
  return (
    <NavigationContainer
      key={session?.id + "-" + flow + "-" + customer.kycStatus}
    >
      <OverlayProvider>
        <Stack.Navigator
          initialRouteName={initial}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: reduced ? "none" : "fade",
          }}
        >
          {flow === "auth"
            ? authScreens()
            : flow === "kyc"
              ? kycScreens()
              : clientScreens()}
        </Stack.Navigator>
      </OverlayProvider>
    </NavigationContainer>
  );
}
