import type { Handoff, HandoffType } from "./models";

export type CustomerHandoffType = Extract<
  HandoffType,
  "CUSTOMER_TO_DRIVER" | "DRIVER_TO_CUSTOMER" | "FACILITY_TO_CUSTOMER"
>;

export function isCustomerHandoff(handoff: Pick<Handoff, "type">): boolean {
  return [
    "CUSTOMER_TO_DRIVER",
    "DRIVER_TO_CUSTOMER",
    "FACILITY_TO_CUSTOMER",
  ].includes(handoff.type);
}
