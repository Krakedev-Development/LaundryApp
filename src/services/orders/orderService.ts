import type {
  Address,
  DeliveryInfo,
  FulfillmentPlan,
  Leg,
  Order,
  OrderExtra,
  OrderItem,
  OrderPricing,
  OrderStatus,
  PickupInfo,
  PricingStatus,
  TimelineEvent,
} from "../../domain/models";
import {
  extras as catalogExtras,
  facilities as catalogFacilities,
  garments as catalogGarments,
  services as catalogServices,
} from "../../domain/catalog";
import { statusLabels } from "../../domain/models";
import { apiClient } from "../api/apiClient";
import { getStoredAuthSession } from "../auth/authService";
import { withSession } from "../auth/withSession";

export interface CustomerAddress {
  id: string;
  customerId: string;
  title: string;
  fullAddress: string;
  reference?: string | null;
  latitude: number | string;
  longitude: number | string;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressDto {
  title: string;
  fullAddress: string;
  reference?: string;
  latitude: number;
  longitude: number;
  isPrimary?: boolean;
}

export interface OrderItemDto {
  garmentId: string;
  serviceId: string;
  quantity: number;
  notes?: string;
}

export interface OutboundDto {
  addressId?: string;
  slotId?: string;
}

export interface CreateOrderDto {
  facilityId: string;
  mode: "HOME_HOME" | "HOME_STORE";
  pickupAddressId: string;
  pickupSlotId: string;
  // Exactamente uno: prendas o la bolsa del servicio por peso (el servidor pone libras y precio).
  items?: OrderItemDto[];
  weightTierId?: string;
  extraIds?: string[];
  promotionCode?: string;
  notes?: string;
  paymentMethodKind?: "WALLET" | "CARD" | "TRANSFER";
  outbound?: OutboundDto;
}

export interface ListOrdersQuery {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface BackendOrderSummary {
  id: string;
  number: number;
  status: string;
  mode: "HOME_HOME" | "HOME_STORE";
  facilityId: string;
  paymentStatus: string;
  pricingStatus: string;
  total: string | number;
  version: number;
  createdAt: string;
}

export interface BackendOrderListResponse {
  page: number;
  pageSize: number;
  total: number;
  data: BackendOrderSummary[];
}

export interface BackendOrderLeg {
  id: string;
  kind: "INBOUND" | "OUTBOUND";
  method: "DRIVER" | "CUSTOMER";
  addressText: string;
  latitude: number | string;
  longitude: number | string;
  slot?: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null;
  driver?: {
    userId: string;
    name?: string;
    phone?: string;
  } | null;
}

export interface BackendOrderItem {
  id: string;
  garmentId: string;
  serviceId: string;
  quantity: number;
  unitPrice: string | number;
  notes?: string | null;
  garment?: { id: string; name: string; icon?: string | null } | null;
  service?: { id: string; name: string } | null;
}

export interface BackendOrderExtra {
  id: string;
  extraId: string;
  price: string | number;
  extra?: { id: string; name: string } | null;
}

export interface PriceAdjustment {
  id: string;
  type: "WEIGHT_ADJUSTMENT" | "SERVICE_RECLASSIFICATION" | "EXTRA_ITEM" | "PRICE_ADJUSTMENT";
  customerMessage: string;
  amountDifference: string | number;
  requiresCustomerApproval: boolean;
  status: "PENDING_CUSTOMER" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface IssuedHandoff {
  handoffId: string;
  type: string;
  code: string;
  qrToken: string;
  expiresAt: string;
}

export interface BackendOrderEvent {
  id: string;
  status: string;
  title: string;
  // El servidor guarda la nota del cambio en `description`.
  description?: string | null;
  note?: string | null;
  createdAt: string;
}

// Título que ve el cliente. Los títulos automáticos del servidor ("Estado: X") se traducen al
// nombre del estado; los ya redactados (p. ej. "Recogida fallida") se muestran tal cual.
export function eventTitle(status: string, serverTitle: string): string {
  if (serverTitle && !/^Estado:/i.test(serverTitle)) return serverTitle;
  return (statusLabels as Record<string, string>)[status] ?? serverTitle;
}

export interface AssignedDriverDto {
  driverId: string;
  name: string;
  phone: string | null;
  plate: string | null;
  vehicle: string | null;
  status: "AVAILABLE" | "ON_SERVICE";
  latitude: number | null;
  longitude: number | null;
  heading?: number | null;
  speed?: number | null;
  locationAt: string | null;
}

export interface OrderTrackingDto {
  orderId: string;
  orderNumber: number;
  status: string;
  mode: string;
  activeLeg: "INBOUND" | "OUTBOUND" | null;
  isLiveTrackingActive?: boolean;
  customerAddress: {
    text: string;
    latitude: number;
    longitude: number;
  };
  facility: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  assignedDriver: AssignedDriverDto | null;
}

export interface OrderRouteApiResponse {
  success: boolean;
  data?: {
    orderId: string;
    activeLeg: "INBOUND" | "OUTBOUND";
    distanceMeters: number;
    durationSeconds: number;
    etaMinutes: number;
    provider?: "mapbox" | "osrm" | "fallback";
    isFallback?: boolean;
    geometry?: {
      type: string;
      coordinates: Array<[number, number]>;
    };
  };
}

export interface OrderEtaApiResponse {
  success: boolean;
  data?: {
    orderId: string;
    status: string;
    activeLeg: "INBOUND" | "OUTBOUND" | null;
    isLiveTrackingActive: boolean;
    etaMinutes: number | null;
    distanceMeters: number | null;
    durationSeconds: number | null;
    driverLocation: {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
      locationAt: string | null;
    } | null;
  };
}

export interface BackendOrderDetails extends BackendOrderSummary {
  customerId?: string;
  // Solo en el detalle: lo pagado y lo que falta pagar.
  amountPaid?: string | number;
  amountDue?: string | number;
  paymentMethodKind?: "WALLET" | "CARD" | "TRANSFER" | null;
  notes?: string | null;
  pricingModel?: "FIXED" | "PER_WEIGHT";
  estimatedWeightLb?: string | number | null;
  pricePerPound?: string | number | null;
  weightTier?: { id: string; name: string } | null;
  facility?: { id: string; name: string } | null;
  itemsSubtotal?: string | number;
  extrasTotal?: string | number;
  discount?: string | number;
  membershipDiscount?: string | number;
  logisticsFee?: string | number;
  tax?: string | number;
  items?: BackendOrderItem[];
  extras?: BackendOrderExtra[];
  legs?: BackendOrderLeg[];
  events?: BackendOrderEvent[];
}

export const GUAYAQUIL_DEFAULT_COORDINATES = {
  latitude: -2.1894,
  longitude: -79.8891,
  title: "Mi Domicilio",
  fullAddress: "Av. 9 de Octubre y Malecón Simón Bolívar, Guayaquil",
  reference: "Guayaquil Centro",
} as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value?: string | null): value is string {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

export function formatOrderCode(order: {
  id?: string;
  number?: number | string;
}): string {
  if (order.number !== undefined && order.number !== null) {
    return `ORD-${String(order.number).padStart(4, "0")}`;
  }
  if (order.id) {
    if (order.id.startsWith("ORD-")) return order.id;
    return `ORD-${order.id.slice(0, 4).toUpperCase()}`;
  }
  return "ORD-0001";
}

async function resolveToken(explicitToken?: string | null): Promise<string> {
  if (explicitToken !== undefined && explicitToken !== null) {
    return explicitToken;
  }
  const session = await getStoredAuthSession();
  if (!session.accessToken) {
    throw new Error("No hay una sesión activa con token de acceso.");
  }
  return session.accessToken;
}

export function mapAddressToDomain(addr: CustomerAddress): Address {
  return {
    id: addr.id,
    title: addr.title,
    fullAddress: addr.fullAddress,
    reference: addr.reference ?? "",
    isPrimary: addr.isPrimary,
    latitude: Number(addr.latitude),
    longitude: Number(addr.longitude),
  };
}

export function mapBackendOrderToDomain(
  raw: BackendOrderSummary | BackendOrderDetails,
  customerInfo?: { id?: string; name?: string; phone?: string },
): Order {
  const code = formatOrderCode(raw);
  const totalNum = typeof raw.total === "string" ? parseFloat(raw.total) : (raw.total ?? 0);
  const itemsSubtotalNum =
    "itemsSubtotal" in raw && raw.itemsSubtotal
      ? parseFloat(String(raw.itemsSubtotal))
      : totalNum;
  const deliveryFeeNum =
    "logisticsFee" in raw && raw.logisticsFee
      ? parseFloat(String(raw.logisticsFee))
      : 0;

  const inboundLeg = "legs" in raw && raw.legs ? raw.legs.find((l) => l.kind === "INBOUND") : undefined;
  const outboundLeg = "legs" in raw && raw.legs ? raw.legs.find((l) => l.kind === "OUTBOUND") : undefined;

  const inboundDomainLeg: Leg = {
    method: (inboundLeg?.method as Leg["method"]) ?? "DRIVER",
    addressFull: inboundLeg?.addressText ?? "Guayaquil, Ecuador",
    scheduledDate: inboundLeg?.slot?.date ? inboundLeg.slot.date.slice(0, 10) : "",
    timeSlotId: inboundLeg?.slot?.id,
    timeSlotText: inboundLeg?.slot
      ? `${inboundLeg.slot.startTime} - ${inboundLeg.slot.endTime}`
      : "",
    status: "SCHEDULED",
    latitude: inboundLeg ? Number(inboundLeg.latitude) : GUAYAQUIL_DEFAULT_COORDINATES.latitude,
    longitude: inboundLeg ? Number(inboundLeg.longitude) : GUAYAQUIL_DEFAULT_COORDINATES.longitude,
  };

  const outboundDomainLeg: Leg = {
    method: (outboundLeg?.method as Leg["method"]) ?? (raw.mode === "HOME_STORE" ? "CUSTOMER" : "DRIVER"),
    addressFull: outboundLeg?.addressText ?? "Guayaquil, Ecuador",
    scheduledDate: outboundLeg?.slot?.date ? outboundLeg.slot.date.slice(0, 10) : "",
    timeSlotId: outboundLeg?.slot?.id,
    timeSlotText: outboundLeg?.slot
      ? `${outboundLeg.slot.startTime} - ${outboundLeg.slot.endTime}`
      : "",
    status: "SCHEDULED",
    latitude: outboundLeg ? Number(outboundLeg.latitude) : GUAYAQUIL_DEFAULT_COORDINATES.latitude,
    longitude: outboundLeg ? Number(outboundLeg.longitude) : GUAYAQUIL_DEFAULT_COORDINATES.longitude,
  };

  const pricing: OrderPricing = {
    itemsSubtotal: itemsSubtotalNum,
    extrasTotal: "extrasTotal" in raw && raw.extrasTotal ? parseFloat(String(raw.extrasTotal)) : 0,
    discount: "discount" in raw && raw.discount ? parseFloat(String(raw.discount)) : 0,
    membershipBenefitDiscount:
      "membershipDiscount" in raw && raw.membershipDiscount
        ? parseFloat(String(raw.membershipDiscount))
        : 0,
    deliveryFee: deliveryFeeNum,
    total: totalNum,
  };

  const pickup: PickupInfo = {
    addressId: inboundDomainLeg.addressId ?? "addr-pickup",
    addressTitle: "Recogida a domicilio",
    addressFull: inboundDomainLeg.addressFull,
    date: inboundDomainLeg.scheduledDate,
    timeSlot: inboundDomainLeg.timeSlotText,
    notes: "",
    pickedUpAt: ["PICKED_UP", "AT_FACILITY", "IN_PROCESS", "DELIVERED", "COMPLETED"].includes(raw.status)
      ? raw.createdAt
      : undefined,
  };

  const delivery: DeliveryInfo = {
    addressId: outboundDomainLeg.addressId ?? "addr-delivery",
    addressTitle: raw.mode === "HOME_STORE" ? "Retiro en sede" : "Entrega a domicilio",
    addressFull: outboundDomainLeg.addressFull,
    date: outboundDomainLeg.scheduledDate,
    timeSlot: outboundDomainLeg.timeSlotText,
    deliveredAt: ["DELIVERED", "COMPLETED"].includes(raw.status) ? raw.createdAt : undefined,
  };

  const fulfillmentPlan: FulfillmentPlan = {
    mode: raw.mode ?? "HOME_HOME",
    inbound: inboundDomainLeg,
    outbound: outboundDomainLeg,
  };

  const domainItems: OrderItem[] =
    "items" in raw && raw.items
      ? raw.items.map((it) => {
          const catGarment = catalogGarments.find((g) => g.id === it.garmentId);
          const catService = catalogServices.find((s) => s.id === it.serviceId);
          return {
            id: it.garmentId,
            garmentType:
              it.garment?.name || catGarment?.name || "Prenda de lavandería",
            quantity: it.quantity,
            serviceType:
              it.service?.name || catService?.name || "Servicio estándar",
            unitPrice:
              typeof it.unitPrice === "string"
                ? parseFloat(it.unitPrice)
                : it.unitPrice,
            notes: it.notes ?? "",
            iconName: catGarment?.iconKey || "shirt-outline",
          };
        })
      : [];

  const domainExtras: OrderExtra[] =
    "extras" in raw && raw.extras
      ? raw.extras.map((ex) => {
          const catExtra = catalogExtras.find((e) => e.id === ex.extraId);
          return {
            id: ex.extraId,
            name: ex.extra?.name || catExtra?.name || "Extra",
            description: catExtra?.description ?? "",
            price:
              typeof ex.price === "string" ? parseFloat(ex.price) : ex.price,
          };
        })
      : [];

  const timeline: TimelineEvent[] =
    "events" in raw && raw.events
      ? raw.events.map((ev) => ({
          status: (ev.status as OrderStatus) ?? "PAYMENT_PENDING",
          title: eventTitle(ev.status, ev.title),
          description: ev.description ?? ev.note ?? "",
          timestamp: ev.createdAt,
          completed: true,
        }))
      : [
          // Solo la lista llega sin eventos: se muestra el estado actual hasta cargar el detalle.
          {
            status: (raw.status as OrderStatus) ?? "PAYMENT_PENDING",
            title: eventTitle(raw.status, `Estado: ${raw.status}`),
            description: "",
            timestamp: raw.createdAt,
            completed: true,
          },
        ];

  return {
    id: code,
    customerId: customerInfo?.id || ("customerId" in raw && raw.customerId) || "cust-1",
    customerName: customerInfo?.name || "Cliente Laundry",
    customerPhone: customerInfo?.phone || "0998765432",
    status: (raw.status as OrderStatus) ?? "PAYMENT_PENDING",
    priority: false,
    items: domainItems,
    extras: domainExtras,
    pricing,
    pickup,
    delivery,
    facilityName:
      ("facility" in raw && raw.facility?.name) ||
      catalogFacilities.find((f) => f.id === raw.facilityId)?.name ||
      "Sede asignada",
    trackingPosition: {
      latitude: GUAYAQUIL_DEFAULT_COORDINATES.latitude,
      longitude: GUAYAQUIL_DEFAULT_COORDINATES.longitude,
    },
    paymentMethod: "Billetera",
    paymentStatus: raw.paymentStatus === "PAID" ? "PAGADO" : "PENDIENTE",
    timeline,
    createdAt: raw.createdAt,
    fulfillmentPlan,
    pricingModel: ("pricingModel" in raw && raw.pricingModel) || "FIXED",
    pricingStatus: (raw.pricingStatus as PricingStatus) || "CALCULATED",
    // Precio por libra que el servidor congeló al crear la solicitud (el de la bolsa elegida).
    pricePerLb: Number("pricePerPound" in raw ? raw.pricePerPound : 0) || 0,
    estimatedWeightLb:
      "estimatedWeightLb" in raw && raw.estimatedWeightLb != null
        ? Number(raw.estimatedWeightLb)
        : undefined,
    weightTierName: ("weightTier" in raw && raw.weightTier?.name) || undefined,
    handoffs: [],
    adjustments: [],
    canChangeOutboundMethod: false,
  };
}

export const orderService = {
  async getAddresses(explicitToken?: string | null): Promise<CustomerAddress[]> {
    const token = await resolveToken(explicitToken);
    return await apiClient.get<CustomerAddress[]>("/customers/me/addresses", {
      accessToken: token,
    });
  },

  async createAddress(
    dto: CreateAddressDto,
    explicitToken?: string | null,
  ): Promise<CustomerAddress> {
    const token = await resolveToken(explicitToken);
    return await apiClient.post<CustomerAddress>("/customers/me/addresses", dto, {
      accessToken: token,
    });
  },

  async ensureGuayaquilAddress(explicitToken?: string | null): Promise<CustomerAddress> {
    try {
      const addresses = await this.getAddresses(explicitToken);
      if (addresses.length > 0) {
        const primary = addresses.find((a) => a.isPrimary) ?? addresses[0];
        return primary;
      }
    } catch {
      // If getAddresses fails or returns empty, proceed to create default address
    }

    return await this.createAddress(
      {
        title: GUAYAQUIL_DEFAULT_COORDINATES.title,
        fullAddress: GUAYAQUIL_DEFAULT_COORDINATES.fullAddress,
        reference: GUAYAQUIL_DEFAULT_COORDINATES.reference,
        latitude: GUAYAQUIL_DEFAULT_COORDINATES.latitude,
        longitude: GUAYAQUIL_DEFAULT_COORDINATES.longitude,
        isPrimary: true,
      },
      explicitToken,
    );
  },

  async createOrder(
    dto: CreateOrderDto,
    options?: { idempotencyKey?: string; token?: string | null },
  ): Promise<BackendOrderDetails> {
    const token = await resolveToken(options?.token);
    const key =
      options?.idempotencyKey ??
      `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    return await apiClient.post<BackendOrderDetails>("/orders", dto, {
      accessToken: token,
      headers: {
        "Idempotency-Key": key,
      },
    });
  },

  async listOrders(
    query?: ListOrdersQuery,
    explicitToken?: string | null,
  ): Promise<BackendOrderSummary[]> {
    const token = await resolveToken(explicitToken);
    const searchParams = new URLSearchParams();
    if (query?.status) searchParams.set("status", query.status);
    if (query?.page) searchParams.set("page", String(query.page));
    if (query?.pageSize) searchParams.set("pageSize", String(query.pageSize));

    const qs = searchParams.toString();
    const endpoint = `/orders${qs ? `?${qs}` : ""}`;

    const response = await apiClient.get<BackendOrderListResponse | BackendOrderSummary[]>(
      endpoint,
      {
        accessToken: token,
      },
    );

    if (Array.isArray(response)) {
      return response;
    }
    return response.data ?? [];
  },

  async getOrder(
    id: string,
    explicitToken?: string | null,
  ): Promise<BackendOrderDetails> {
    const token = await resolveToken(explicitToken);
    return await apiClient.get<BackendOrderDetails>(`/orders/${id}`, {
      accessToken: token,
    });
  },

  // Paga con la billetera lo pendiente de la solicitud: el pago inicial (la confirma) o la
  // diferencia de un precio final mayor. Si no alcanza el saldo, el servidor lo rechaza.
  async payOrder(
    orderId: string,
    expectedVersion: number,
    explicitToken?: string | null,
  ): Promise<BackendOrderDetails> {
    const token = await resolveToken(explicitToken);
    return await apiClient.post<BackendOrderDetails>(
      `/orders/${orderId}/pay`,
      { expectedVersion },
      { accessToken: token },
    );
  },

  // Cancela la solicitud en el servidor: libera cupos, cierra los tramos del chofer, reembolsa a
  // la billetera lo pagado y, pasado el corte, genera el cargo por cancelación tardía.
  async cancelOrder(
    orderId: string,
    reason: string,
    expectedVersion: number,
    explicitToken?: string | null,
  ): Promise<BackendOrderDetails> {
    const token = await resolveToken(explicitToken);
    return await apiClient.post<BackendOrderDetails>(
      `/orders/${orderId}/cancel`,
      { reason, expectedVersion },
      { accessToken: token },
    );
  },

  // Cambia la franja (y opcionalmente la dirección) de la recogida o la entrega. Si el tramo
  // tenía chofer y cambia el horario, el servidor lo libera para que la sede reasigne.
  async rescheduleOrder(
    orderId: string,
    input: {
      leg: "INBOUND" | "OUTBOUND";
      slotId: string;
      addressId?: string;
      expectedVersion: number;
    },
    explicitToken?: string | null,
  ): Promise<BackendOrderDetails> {
    const token = await resolveToken(explicitToken);
    return await apiClient.put<BackendOrderDetails>(
      `/orders/${orderId}/reschedule`,
      input,
      { accessToken: token },
    );
  },

  // Ajustes de precio que la sede registró (peso real, prenda extra...). El cliente aprueba o
  // rechaza los que suben el precio; lo rechazado no se cobra.
  async listAdjustments(orderId: string, explicitToken?: string | null): Promise<PriceAdjustment[]> {
    const token = await resolveToken(explicitToken);
    return (
      (await apiClient.get<PriceAdjustment[]>(`/orders/${orderId}/adjustments`, {
        accessToken: token,
      })) ?? []
    );
  },

  async decideAdjustment(
    orderId: string,
    adjustmentId: string,
    approve: boolean,
    expectedVersion: number,
    explicitToken?: string | null,
  ): Promise<{ pending: number; requiresStaffReview: boolean }> {
    const token = await resolveToken(explicitToken);
    return await apiClient.post(
      `/orders/${orderId}/adjustments/${adjustmentId}/decision`,
      { approve, expectedVersion },
      { accessToken: token },
    );
  },

  // Custodia: genera el código y el QR que el cliente muestra al chofer. El servidor solo los
  // entrega esta vez (no los guarda en claro) y generar otro invalida el anterior.
  async issueHandoff(
    orderId: string,
    type: "CUSTOMER_TO_DRIVER" | "DRIVER_TO_CUSTOMER" | "FACILITY_TO_CUSTOMER",
    explicitToken?: string | null,
  ): Promise<IssuedHandoff> {
    const token = await resolveToken(explicitToken);
    return await apiClient.post<IssuedHandoff>(
      `/orders/${orderId}/handoffs/issue`,
      { type },
      { accessToken: token },
    );
  },

  async getOrderTracking(
    id: string,
    explicitToken?: string | null,
  ): Promise<OrderTrackingDto> {
    if (explicitToken !== undefined && explicitToken !== null) {
      return await apiClient.get<OrderTrackingDto>(`/orders/${id}/tracking`, {
        accessToken: explicitToken,
      });
    }
    return await withSession(async (token) => {
      if (!token) {
        throw new Error("No hay una sesión activa con token de acceso.");
      }
      return await apiClient.get<OrderTrackingDto>(`/orders/${id}/tracking`, {
        accessToken: token,
      });
    });
  },

  async getOrderRoute(
    id: string,
    params?: {
      driverLat?: number;
      driverLng?: number;
      driverHeading?: number;
    },
    explicitToken?: string | null,
  ): Promise<OrderRouteApiResponse> {
    const search = new URLSearchParams();
    if (params?.driverLat !== undefined && Number.isFinite(params.driverLat)) {
      search.set("driverLat", String(params.driverLat));
    }
    if (params?.driverLng !== undefined && Number.isFinite(params.driverLng)) {
      search.set("driverLng", String(params.driverLng));
    }
    if (
      params?.driverHeading !== undefined &&
      Number.isFinite(params.driverHeading)
    ) {
      search.set("driverHeading", String(Math.round(params.driverHeading)));
    }
    const qs = search.toString();
    const path = `/orders/${id}/route${qs ? `?${qs}` : ""}`;
    if (explicitToken !== undefined && explicitToken !== null) {
      return await apiClient.get<OrderRouteApiResponse>(path, {
        accessToken: explicitToken,
      });
    }
    return await withSession(async (token) => {
      if (!token) {
        throw new Error("No hay una sesión activa con token de acceso.");
      }
      return await apiClient.get<OrderRouteApiResponse>(path, {
        accessToken: token,
      });
    });
  },

  async getOrderEta(
    id: string,
    explicitToken?: string | null,
  ): Promise<OrderEtaApiResponse> {
    if (explicitToken !== undefined && explicitToken !== null) {
      return await apiClient.get<OrderEtaApiResponse>(`/orders/${id}/eta`, {
        accessToken: explicitToken,
      });
    }
    return await withSession(async (token) => {
      if (!token) {
        throw new Error("No hay una sesión activa con token de acceso.");
      }
      return await apiClient.get<OrderEtaApiResponse>(`/orders/${id}/eta`, {
        accessToken: token,
      });
    });
  },
};

