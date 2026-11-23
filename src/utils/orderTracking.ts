export const INBOUND_LIVE_STATUSES = [
  "PICKUP_ASSIGNED",
  "HEADING_TO_PICKUP",
  "ARRIVED_FOR_PICKUP",
] as const;

export const OUTBOUND_LIVE_STATUSES = [
  "DELIVERY_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "ARRIVED_FOR_DELIVERY",
] as const;

export const CUSTOMER_LIVE_TRACKING_STATUSES = [
  ...INBOUND_LIVE_STATUSES,
  ...OUTBOUND_LIVE_STATUSES,
] as const;

export function liveTrackingLegForStatus(
  status: string | null | undefined,
): "INBOUND" | "OUTBOUND" | null {
  if (!status) return null;
  if ((INBOUND_LIVE_STATUSES as readonly string[]).includes(status)) {
    return "INBOUND";
  }
  if ((OUTBOUND_LIVE_STATUSES as readonly string[]).includes(status)) {
    return "OUTBOUND";
  }
  return null;
}

export function isCustomerLiveTrackingStatus(
  status: string | null | undefined,
): boolean {
  return liveTrackingLegForStatus(status) !== null;
}

export interface LiveDriverFix {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  locationAt?: string | null;
}

type RawDriverLocationPayload = {
  orderId?: string;
  driverId?: string;
  activeLeg?: "INBOUND" | "OUTBOUND" | null;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  locationAt?: string;
  location?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    heading?: number;
    speed?: number;
    locationAt?: string;
  };
};

export function parseDriverLocationFromSocketPayload(
  raw: RawDriverLocationPayload | null | undefined,
): LiveDriverFix | null {
  if (!raw) return null;
  const src = raw.location ?? raw;
  const lat = src.lat ?? src.latitude;
  const lng = src.lng ?? src.longitude;
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }
  return {
    latitude: lat,
    longitude: lng,
    heading:
      typeof src.heading === "number" && Number.isFinite(src.heading)
        ? src.heading
        : null,
    speed:
      typeof src.speed === "number" && Number.isFinite(src.speed)
        ? src.speed
        : null,
    locationAt: src.locationAt ?? raw.locationAt ?? new Date().toISOString(),
  };
}

export function parseObservedAt(
  iso: string | null | undefined,
  fallbackMs: number,
): number {
  if (!iso) return fallbackMs;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : fallbackMs;
}

export function isFresherObservation(
  observedAt: number,
  lastObservedAt: number,
): boolean {
  return observedAt >= lastObservedAt;
}

export function trackingBannerForStatus(status: string): {
  title: string;
  subtitle: string;
  etaLabel: string;
} {
  switch (status) {
    case "PICKUP_ASSIGNED":
      return {
        title: "Chofer asignado para recogida",
        subtitle: "Preparándose para dirigirse a tu domicilio.",
        etaLabel: "Llegada estimada para recogida",
      };
    case "HEADING_TO_PICKUP":
      return {
        title: "Chofer en camino a recoger tus prendas",
        subtitle: "Sigue su avance en tiempo real hacia tu domicilio.",
        etaLabel: "Llegada estimada para recogida",
      };
    case "ARRIVED_FOR_PICKUP":
      return {
        title: "El chofer llegó a tu domicilio",
        subtitle: "Muestra tu código PIN o QR para entregar tus prendas.",
        etaLabel: "En tu domicilio",
      };
    case "DELIVERY_ASSIGNED":
      return {
        title: "Chofer asignado para entrega",
        subtitle: "Retirando tus prendas limpias de planta.",
        etaLabel: "Entrega estimada en tu domicilio",
      };
    case "OUT_FOR_DELIVERY":
      return {
        title: "Tus prendas limpias están en camino",
        subtitle: "Sigue el recorrido en tiempo real hacia tu domicilio.",
        etaLabel: "Entrega estimada en tu domicilio",
      };
    case "ARRIVED_FOR_DELIVERY":
      return {
        title: "El chofer llegó con tus prendas",
        subtitle: "Muestra tu código PIN o QR para confirmar la entrega.",
        etaLabel: "En tu domicilio",
      };
    case "PICKED_UP":
    case "HEADING_TO_FACILITY":
      return {
        title: "Prendas recogidas en traslado a planta",
        subtitle:
          "El seguimiento en mapa volverá a activarse cuando tus prendas salgan listas hacia tu domicilio.",
        etaLabel: "En traslado a planta",
      };
    case "AT_FACILITY":
    case "WEIGHING":
    case "INSPECTION":
    case "PRICING_PENDING":
    case "CUSTOMER_APPROVAL_PENDING":
    case "IN_PROCESS":
    case "QUALITY_CONTROL":
    case "READY_FOR_DELIVERY":
      return {
        title: "Tus prendas están en planta",
        subtitle:
          "Te avisaremos y activaremos el mapa en vivo cuando el chofer salga de regreso a tu domicilio.",
        etaLabel: "En proceso en planta",
      };
    case "DELIVERED":
    case "COMPLETED":
      return {
        title: "Pedido entregado",
        subtitle: "Tus prendas fueron entregadas correctamente.",
        etaLabel: "Finalizado",
      };
    default:
      return {
        title: "Seguimiento del pedido",
        subtitle:
          "El mapa en vivo se activará en cuanto el chofer esté asignado y en camino a tu domicilio.",
        etaLabel: "Pendiente de asignación",
      };
  }
}

export function handoffTypeForTrackingStatus(
  status: string,
): "CUSTOMER_TO_DRIVER" | "DRIVER_TO_CUSTOMER" | null {
  if (status === "HEADING_TO_PICKUP" || status === "ARRIVED_FOR_PICKUP") {
    return "CUSTOMER_TO_DRIVER";
  }
  if (status === "OUT_FOR_DELIVERY" || status === "ARRIVED_FOR_DELIVERY") {
    return "DRIVER_TO_CUSTOMER";
  }
  return null;
}
