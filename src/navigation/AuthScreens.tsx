import { SplashScreen } from "../screens/auth/SplashScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/registration/RegisterScreen";
import { KycUploadScreen } from "../screens/verification/KycUploadScreen";
import { KycPendingScreen } from "../screens/verification/KycPendingScreen";
import { KycRejectedScreen } from "../screens/verification/KycRejectedScreen";
import { Stack } from "./RootStack";
export function authScreens() {
  return (
    <>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterStep1" component={RegisterScreen} />
    </>
  );
}
export function kycScreens() {
  return (
    <>
      <Stack.Screen name="KycUpload" component={KycUploadScreen} />
      <Stack.Screen name="KycPending" component={KycPendingScreen} />
      <Stack.Screen name="KycRejected" component={KycRejectedScreen} />
    </>
  );
}
