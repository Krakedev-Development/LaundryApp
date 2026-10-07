import type { IconName } from "../components/ui";
import type { PrimaryRoute, Routes } from "./routes";

export type Tab = {
  route: PrimaryRoute | "ClientNewOrderWizard";
  label: string;
  icon: IconName;
};
export const clientTabs: Tab[] = [
  { route: "ClientHome", label: "Inicio", icon: "home-outline" },
  { route: "ClientOrders", label: "Pedidos", icon: "receipt-outline" },
  {
    route: "ClientNewOrderWizard",
    label: "Solicitar",
    icon: "add-circle-outline",
  },
  { route: "ClientBenefits", label: "Beneficios", icon: "gift-outline" },
  { route: "ClientProfile", label: "Cuenta", icon: "settings-outline" },
];
export const driverTabs: Tab[] = [
  { route: "DriverRoute", label: "Mi ruta", icon: "navigate-outline" },
  { route: "DriverServices", label: "Servicios", icon: "list-outline" },
  { route: "DriverHistory", label: "Historial", icon: "time-outline" },
  { route: "DriverProfile", label: "Cuenta", icon: "settings-outline" },
];
export function primaryTabTarget(name: keyof Routes) {
  if (
    name !== "ClientNewOrderWizard" &&
    clientTabs.some((tab) => tab.route === name)
  ) {
    return { name: "ClientTabs", screen: name } as const;
  }
  if (driverTabs.some((tab) => tab.route === name)) {
    return { name: "DriverTabs", screen: name } as const;
  }
  return undefined;
}
