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

export function mapBackendSlotToTimeSlot(slot: BackendSlot): TimeSlot {
  const capacity = slot.capacity ?? slot.available ?? 10;
  const reservedCount = slot.reservedCount ?? 0;
  return {
    id: slot.id,
    context: slot.context as TimeSlot["context"],
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    capacity,
    reservedCount,
    active: slot.active !== false && slot.available > 0,
  };
}

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
