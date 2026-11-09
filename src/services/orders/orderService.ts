import type {
  Address,
  DeliveryInfo,
  FulfillmentPlan,
  Leg,
  Order,
  OrderItem,
  OrderPricing,
  OrderStatus,
  PickupInfo,
  PricingStatus,
  TimelineEvent,
} from "../../domain/models";
import { apiClient } from "../api/apiClient";
import { getStoredAuthSession } from "../auth/authService";

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
  items?: OrderItemDto[];
  estimatedWeightLb?: number;
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
}

export interface BackendOrderExtra {
  id: string;
  extraId: string;
  price: string | number;
}

export interface BackendOrderEvent {
  id: string;
  status: string;
  title: string;
  note?: string | null;
  createdAt: string;
}

export interface BackendOrderDetails extends BackendOrderSummary {
  customerId?: string;
  notes?: string | null;
  pricingModel?: "FIXED" | "PER_WEIGHT";
  estimatedWeightLb?: number | null;
  pricePerPound?: string | number | null;
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
      ? raw.items.map((it) => ({
          id: it.garmentId,
          garmentType: "Prenda de lavandería",
          quantity: it.quantity,
          serviceType: "Servicio estándar",
          unitPrice: typeof it.unitPrice === "string" ? parseFloat(it.unitPrice) : it.unitPrice,
          notes: it.notes ?? "",
          iconName: "shirt-outline",
        }))
      : [];

  const timeline: TimelineEvent[] =
    "events" in raw && raw.events
      ? raw.events.map((ev) => ({
          status: (ev.status as OrderStatus) ?? "PAYMENT_PENDING",
          title: ev.title,
          description: ev.note ?? "",
          timestamp: ev.createdAt,
          completed: true,
        }))
      : [
          {
            status: (raw.status as OrderStatus) ?? "PAYMENT_PENDING",
            title: `Estado: ${raw.status}`,
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
    extras: [],
    pricing,
    pickup,
    delivery,
    facilityName: "Sede Central Guayaquil",
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
    pricePerLb: 1.75,
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
};
