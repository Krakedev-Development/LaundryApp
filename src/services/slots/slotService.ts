import type { TimeSlot } from "../../domain/models";
import { apiRequest } from "../api/apiClient";
import { getStoredAuthSession } from "../auth/authService";

export interface BackendSlot {
  id: string;
  facilityId: string;
  context: "DRIVER_PICKUP" | "DRIVER_DELIVERY" | "FACILITY_PICKUP";
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  available: number;
  capacity?: number;
  reservedCount?: number;
  active?: boolean;
}

export interface ListSlotsParams {
  facilityId?: string;
  context?: "DRIVER_PICKUP" | "DRIVER_DELIVERY" | "FACILITY_PICKUP" | string;
  from?: string;
  to?: string;
  onlyAvailable?: boolean;
}

export function formatSlotRange(slot: { startTime: string; endTime: string }): string {
  return `${slot.startTime} - ${slot.endTime}`;
}

// El cliente solo recibe los cupos libres (`available`), no la capacidad interna: se
// representan como capacidad = libres y reservados = 0, de modo que una franja completa
// (available 0) queda sin cupo y la interfaz la muestra como "Completo".
export function mapBackendSlotToTimeSlot(slot: BackendSlot): TimeSlot {
  const available = Math.max(Math.trunc(Number(slot.available) || 0), 0);
  const capacity = slot.capacity ?? available;
  const reservedCount = slot.reservedCount ?? capacity - available;
  return {
    id: slot.id,
    context: slot.context as TimeSlot["context"],
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    capacity,
    reservedCount,
    active: slot.active !== false,
  };
}

// Fecha y hora de término de una franja a partir de su texto "HH:mm - HH:mm".
export function slotEnd(date: string, rangeText: string) {
  const time = rangeText.split("-")[1]?.trim();
  return date && time ? { date, time } : undefined;
}

// Los ids del servidor son UUID; los de la agenda guardada en el teléfono no se pueden reservar.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isServerId = (id?: string): id is string => !!id && UUID.test(id);

export const freeSeats =(slot: Pick<TimeSlot, "capacity" | "reservedCount">) =>
  Math.max(slot.capacity - slot.reservedCount, 0);

export const seatsLabel = (n: number) =>
  n === 1 ? "1 cupo disponible" : `${n} cupos disponibles`;

export const slotService = {
  async fetchSlots(
    params?: ListSlotsParams,
    explicitToken?: string | null,
  ): Promise<BackendSlot[]> {
    const searchParams = new URLSearchParams();
    if (params?.facilityId) searchParams.set("facilityId", params.facilityId);
    if (params?.context) searchParams.set("context", params.context);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.onlyAvailable !== undefined) {
      searchParams.set("onlyAvailable", String(params.onlyAvailable));
    }

    const qs = searchParams.toString();
    const endpoint = `/slots${qs ? `?${qs}` : ""}`;

    const token =
      explicitToken !== undefined
        ? explicitToken
        : (await getStoredAuthSession()).accessToken;

    return await apiRequest<BackendSlot[]>(endpoint, {
      method: "GET",
      accessToken: token ?? undefined,
    });
  },

  async fetchPickupSlots(
    facilityId?: string,
    from?: string,
    to?: string,
    explicitToken?: string | null,
  ): Promise<BackendSlot[]> {
    return this.fetchSlots(
      {
        facilityId,
        context: "DRIVER_PICKUP",
        from,
        to,
        onlyAvailable: true,
      },
      explicitToken,
    );
  },
};
