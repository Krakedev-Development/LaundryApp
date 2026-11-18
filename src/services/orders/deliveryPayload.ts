import { modeFor, type Leg, type Mode } from "../../domain/models";
import { isServerId } from "../slots/slotService";
import type { OutboundDto } from "./orderService";

// Arma el modo y el tramo de entrega que viajan al crear la solicitud. La franja de entrega se
// reserva en el servidor junto con la de recogida, así que debe ser una franja del servidor.
export function deliveryPayload(
  inbound: Pick<Leg, "method">,
  outbound: Pick<Leg, "method" | "timeSlotId" | "addressId">,
  pickupAddressId: string,
): { mode: Mode; outbound: OutboundDto } {
  const mode = modeFor(inbound.method, outbound.method);
  if (!isServerId(outbound.timeSlotId))
    throw Error(
      "Los horarios de entrega no están actualizados. Vuelve a elegir la franja de entrega.",
    );
  // Solo se envía la dirección de entrega si es distinta de la de recogida (el servidor usa
  // la de recogida por defecto). El retiro en sede no admite dirección.
  const addressId =
    mode === "HOME_HOME" && outbound.addressId && outbound.addressId !== pickupAddressId
      ? outbound.addressId
      : undefined;
  if (addressId && !isServerId(addressId))
    throw Error(
      "Tu dirección de entrega no está registrada. Vuelve a elegirla en Administrar direcciones.",
    );
  return {
    mode,
    outbound: addressId
      ? { slotId: outbound.timeSlotId, addressId }
      : { slotId: outbound.timeSlotId },
  };
}
