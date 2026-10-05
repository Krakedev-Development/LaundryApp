import { Redirect } from "expo-router";
import { useApp } from "../store/AppStore";
export default function Index() {
  const { session, data } = useApp();
  if (!session) return <Redirect href="/(auth)/login" />;
  if (session.role === "CHOFER")
    return (
      <Redirect
        href={
          data.drivers.find((d) => d.id === session.userId)?.mustChangePassword
            ? "/(driver)/change-password"
            : "/(driver)/(tabs)/route"
        }
      />
    );
  const c = data.customers.find((c) => c.id === session.userId);
  return (
    <Redirect
      href={
        c?.kycStatus === "APPROVED"
          ? "/(client)/(tabs)/home"
          : c?.kycStatus === "NOT_SUBMITTED"
            ? "/(auth)/kyc"
            : "/(auth)/pending"
      }
    />
  );
}
