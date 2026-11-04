import type { Order } from "../models";

export const demoOrderTracking: Readonly<
  Pick<
    Order,
    | "assignedDriverId"
    | "assignedDriverName"
    | "assignedDriverPhone"
    | "assignedDriverVehicle"
    | "assignedDriverPlate"
    | "trackingPosition"
  >
> = {
  assignedDriverId: "drv-1",
  assignedDriverName: "Carlos Mendoza",
  assignedDriverPhone: "+51 912 345 678",
  assignedDriverVehicle: "Renault Kangoo Maxi (Blanco)",
  assignedDriverPlate: "ABC-789",
  trackingPosition: { latitude: -12.094, longitude: -77.032 },
};
