import type { NativeStackScreenProps } from "@react-navigation/native-stack";
export type Routes = {
  Splash: undefined;
  Login: undefined;
  RegisterStep1: undefined;
  KycUpload: undefined;
  KycSelfie: undefined;
  KycPending: undefined;
  KycRejected: undefined;
  ClientHome: undefined;
  ClientOrders: undefined;
  ClientNewOrderWizard: { promoCode?: string } | undefined;
  ClientBenefits: undefined;
  ClientProfile: undefined;
  ClientOrderDetail: { orderId: string };
  ClientTracking: { orderId: string };
  Chat: { orderId: string };
  ClientWallet: undefined;
  ClientAddresses: undefined;
  ClientBilling: undefined;
  ClientNotifications: undefined;
  ClientSupport: undefined;
  ClientSecurity: undefined;
  DriverRoute: undefined;
  DriverServices: undefined;
  DriverHistory: undefined;
  DriverProfile: undefined;
  DriverServiceDetail: { orderId: string };
  DriverMap: { orderId: string };
  DriverPickupConfirm: { orderId: string };
  DriverDeliveryConfirm: { orderId: string };
  DriverChangePassword: undefined;
};
export type ScreenProps<T extends keyof Routes> = NativeStackScreenProps<
  Routes,
  T
>;
export const titles: Record<keyof Routes, string> = {
  Splash: "Laundry Clean & Fresh",
  Login: "Iniciar sesión",
  RegisterStep1: "Crear cuenta",
  KycUpload: "Documento de identidad",
  KycSelfie: "Verificación con selfie",
  KycPending: "Verificación pendiente",
  KycRejected: "Verificación rechazada",
  ClientHome: "Tu lavandería, más fácil",
  ClientOrders: "Mis solicitudes",
  ClientNewOrderWizard: "Nueva solicitud",
  ClientBenefits: "Beneficios",
  ClientProfile: "Mi cuenta",
  ClientOrderDetail: "Detalle de solicitud",
  ClientTracking: "Seguimiento",
  Chat: "Chat del pedido",
  ClientWallet: "Billetera Laundry",
  ClientAddresses: "Direcciones guardadas",
  ClientBilling: "Datos de facturación",
  ClientNotifications: "Notificaciones",
  ClientSupport: "Ayuda y soporte",
  ClientSecurity: "Seguridad y contraseña",
  DriverRoute: "Mi ruta",
  DriverServices: "Mis servicios",
  DriverHistory: "Historial",
  DriverProfile: "Mi cuenta",
  DriverServiceDetail: "Detalle de servicio",
  DriverMap: "Mapa y navegación",
  DriverPickupConfirm: "Confirmar recogida",
  DriverDeliveryConfirm: "Confirmar entrega",
  DriverChangePassword: "Cambiar contraseña",
};
