// Formato del QR de custodia que lee la app del chofer: LDH1:<id de la solicitud>:<tipo>:<token>.
// Debe coincidir con LaundryDriver/src/features/driver/model/custody.ts.
export const handoffQrValue = (orderId: string, type: string, qrToken: string) =>
  `LDH1:${orderId}:${type}:${qrToken}`;
