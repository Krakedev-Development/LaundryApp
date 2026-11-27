import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { useEffect } from "react";
import { useApp } from "../store/AppProvider";
import { colors } from "../components/ui";
import { useReducedMotion } from "../design-system/MotionProvider";
import { OverlayProvider } from "../components/overlay/OverlayProvider";
import { Stack } from "./RootStack";
import { BootstrapState } from "../components/BootstrapState";
import { clientScreens } from "./ClientScreens";
import { authScreens, kycScreens } from "./AuthScreens";
import { findCustomer } from "../domain/repository";
import { subscribeNotificationResponses } from "../services/notifications/pushRegistration";
import type { RootRoutes } from "./routes";

export const navigationRef = createNavigationContainerRef<RootRoutes>();

export function AppNavigation() {
  const { state, ready, error, reset, retry } = useApp();
  const reduced = useReducedMotion();
  const session = state.session;
  const customer = findCustomer(state);
  const kycStatus = customer?.kycStatus ?? "NOT_SUBMITTED";
  const flow = !session
    ? "auth"
    : kycStatus === "APPROVED"
      ? "client"
      : "kyc";

  useEffect(() => {
    if (!ready || flow !== "client") return;
    return subscribeNotificationResponses((data) => {
      if (!navigationRef.isReady()) return;
      if (data.type === "CHAT" && data.orderId) {
        navigationRef.navigate("Chat", { orderId: data.orderId });
        return;
      }
      if (data.orderId) {
        navigationRef.navigate("ClientOrderDetail", { orderId: data.orderId });
        return;
      }
      navigationRef.navigate("ClientNotifications");
    });
  }, [ready, flow]);

  if (!ready)
    return <BootstrapState error={error} reset={reset} retry={retry} />;

  const initial =
    flow === "auth"
      ? "Login"
      : flow === "client"
        ? "ClientTabs"
        : kycStatus === "PENDING"
          ? "KycPending"
          : kycStatus === "REJECTED"
            ? "KycRejected"
            : "KycUpload";
  return (
    <NavigationContainer
      ref={navigationRef}
      key={session?.id + "-" + flow + "-" + kycStatus}
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
