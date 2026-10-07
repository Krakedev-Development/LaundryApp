import type { Order } from "../../domain/models";
import type { Coordinates } from "../../services/geo/geo.types";
export function mapDestination(
  order: Order | undefined,
  leg: "inbound" | "outbound",
  facility: Coordinates,
): Coordinates {
  if (!order) return facility;
  const tramo = order.fulfillment?.[leg];
  if (
    tramo?.method === "CUSTOMER" ||
    (leg === "inbound" &&
      ["COLLECTED", "TO_FACILITY", "ARRIVED_AT_FACILITY"].includes(
        tramo?.milestone ?? "",
      ))
  )
    return facility;
  return (leg === "inbound" ? order.customerAddress : order.deliveryAddress)
    .coordinates;
}
