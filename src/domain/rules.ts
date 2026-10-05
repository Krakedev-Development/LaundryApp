import { operationalStage } from "./fulfillment";
import { serviceAreaService } from "../services/geo/ServiceAreaService";
import { businessConfig as config } from "../config/business";
import {
  Address,
  AppData,
  Customer,
  Draft,
  Order,
  OrderItem,
  OrderPricing,
  OrderStatus,
  Promotion,
  Schedule,
} from "./models";

export const money = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export const formatMoney = (value: number) => `$${value.toFixed(2)}`;
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export const dateLabel = (date: string) =>
  new Date(`${date.slice(0, 10)}T12:00:00Z`).toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: config.timezone,
  });
export const timeLabel = (date: string) =>
  new Date(date).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: config.timezone,
  });
export const isFinished = (status: OrderStatus) =>
  ["DELIVERED", "CLOSED", "COMPLETED", "CANCELLED"].includes(status);
export const trackingAvailable = (status: OrderStatus) =>
  [
    "HEADING_TO_PICKUP",
    "ARRIVED_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "ARRIVED_FOR_DELIVERY",
  ].includes(status);
export const chatAvailable = (status: OrderStatus) =>
  [
    "PICKUP_ASSIGNED",
    "HEADING_TO_PICKUP",
    "ARRIVED_FOR_PICKUP",
    "PICKED_UP",
    "HEADING_TO_FACILITY",
    "DELIVERY_ASSIGNED",
    "OUT_FOR_DELIVERY",
    "ARRIVED_FOR_DELIVERY",
  ].includes(status);
export const DRIVER_NEXT: Partial<
  Record<OrderStatus, { status: OrderStatus; label: string }>
> = {
  PICKUP_ASSIGNED: { status: "HEADING_TO_PICKUP", label: "Iniciar navegación" },
  HEADING_TO_PICKUP: { status: "ARRIVED_FOR_PICKUP", label: "Marcar llegada" },
  ARRIVED_FOR_PICKUP: { status: "PICKED_UP", label: "Confirmar recogida" },
  PICKED_UP: { status: "HEADING_TO_FACILITY", label: "Ir a planta" },
  HEADING_TO_FACILITY: {
    status: "ARRIVED_AT_FACILITY",
    label: "Marcar llegada a planta",
  },
  DELIVERY_ASSIGNED: {
    status: "OUT_FOR_DELIVERY",
    label: "Iniciar navegación",
  },
  OUT_FOR_DELIVERY: { status: "ARRIVED_FOR_DELIVERY", label: "Marcar llegada" },
  ARRIVED_FOR_DELIVERY: { status: "DELIVERED", label: "Confirmar entrega" },
};
export function validCoordinates(c: Address["coordinates"]) {
  return (
    !!c &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    Math.abs(c.lat) <= 90 &&
    Math.abs(c.lng) <= 180 &&
    !(c.lat === 0 && c.lng === 0)
  );
}
export function validateSchedule(schedule?: Schedule) {
  if (
    !schedule?.address?.fullAddress?.trim() ||
    !validCoordinates(schedule.address.coordinates)
  )
    throw new Error("Selecciona una dirección con ubicación válida.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(schedule.date) ||
    schedule.date < today() ||
    Number.isNaN(new Date(schedule.date).getTime())
  )
    throw new Error("Selecciona una fecha disponible.");
  if (!availableSlots(schedule.date).includes(schedule.timeSlot))
    throw new Error("Selecciona una franja disponible.");
}
export function availableSlots(date: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: config.timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  return config.timeSlots.filter(
    (slot) =>
      date > today() || (date === today() && Number(slot.slice(0, 2)) > hour),
  );
}
export function pickupDates() {
  return Array.from({ length: 7 }, (_, i) => addDays(today(), i)).filter(
    (d) => availableSlots(d).length > 0,
  );
}
export function deliveryDates(
  data: AppData,
  items: OrderItem[],
  pickupDate: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) ||
    Number.isNaN(new Date(pickupDate).getTime())
  )
    return [];
  const hours = Math.max(
    24,
    ...items.map(
      (i) =>
        (data.catalog.find((c) => c.id === i.catalogId)?.estimatedHours ?? 24) +
        (data.services.find((s) => s.id === i.serviceId)?.estimatedHours ?? 0),
    ),
  );
  const first = addDays(pickupDate, Math.ceil(hours / 24));
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}
export function walletBalance(data: AppData, customerId: string) {
  const wallet = data.wallets.find((w) => w.customerId === customerId);
  return money(
    data.walletTransactions
      .filter((t) => t.walletId === wallet?.id)
      .reduce((sum, t) => sum + (t.type === "DEBIT" ? -t.amount : t.amount), 0),
  );
}
export const pointsBalance = (data: AppData, customerId: string) =>
  data.pointsLedger
    .filter((p) => p.customerId === customerId)
    .reduce((sum, p) => sum + p.points, 0);
export const reservedPoints = (data: AppData, customerId: string) =>
  data.redemptions
    .filter(
      (r) =>
        r.customerId === customerId &&
        r.status === "PENDING" &&
        !data.pointsLedger.some(
          (p) => p.type === "REDEEM" && p.reference === r.id,
        ),
    )
    .reduce((sum, r) => sum + r.points, 0);
export function membershipRemaining(
  data: AppData,
  customer: Customer,
  referenceDate = today(),
) {
  const plan = data.plans.find((p) => p.id === customer.membershipId);
  if (!plan) return 0;
  const day = new Date(`${referenceDate}T12:00:00Z`).getUTCDay();
  const start = addDays(referenceDate, -((day + 6) % 7));
  const end = addDays(start, 7);
  return Math.max(
    0,
    plan.weeklyPickups -
      data.orders.filter(
        (o) =>
          o.customerId === customer.id &&
          o.fulfillment?.mode !== "STORE_STORE" &&
          operationalStage(o) !== "CANCELLED" &&
          o.pickup.date >= start &&
          o.pickup.date < end,
      ).length,
  );
}
export function promotionFor(
  data: AppData,
  customer: Customer,
  items: OrderItem[],
  subtotal: number,
  code: string,
): Promotion | undefined {
  if (!code.trim()) return;
  const promo = data.promotions.find(
    (p) => p.code === code.trim().toUpperCase(),
  );
  if (!promo) throw new Error("El código promocional no existe.");
  if (promo.status !== "ACTIVE")
    throw new Error("Esta promoción no está activa.");
  if (today() < promo.startDate || today() > promo.endDate)
    throw new Error("La promoción está fuera de vigencia.");
  if (subtotal < promo.minOrderAmount)
    throw new Error(
      `Esta promoción requiere ${formatMoney(promo.minOrderAmount)} como mínimo.`,
    );
  const uses = data.orders.filter(
    (o) =>
      o.customerId === customer.id &&
      o.promotionId === promo.id &&
      operationalStage(o) !== "CANCELLED",
  ).length;
  if (promo.usageCount >= promo.usageLimit || uses >= promo.perCustomerLimit)
    throw new Error("Esta promoción alcanzó su límite de usos.");
  if (
    promo.firstOrderOnly &&
    (customer.previousPurchases > 0 ||
      data.orders.some((o) => o.customerId === customer.id))
  )
    throw new Error("Esta promoción es para tu primer pedido.");
  if (
    !promo.applicableServices.includes("Todos los servicios") &&
    !items.some((i) =>
      promo.applicableServices.some(
        (s) => i.name.includes(s) || i.serviceName.includes(s),
      ),
    )
  )
    throw new Error(
      "La promoción no aplica a las prendas o servicios seleccionados.",
    );
  return promo;
}
export function quote(
  data: AppData,
  customer: Customer,
  draft: Draft,
): OrderPricing {
  const itemsSubtotal = money(
    draft.items.reduce((s, i) => {
      const garment = data.catalog.find(
        (c) =>
          c.id === i.catalogId &&
          c.active &&
          c.customerSelectable &&
          c.category !== "EXTRAS",
      );
      const service = data.services.find(
        (v) => v.id === i.serviceId && v.active && v.customerSelectable,
      );
      if (
        !garment ||
        !service ||
        !Number.isInteger(i.quantity) ||
        i.quantity < 1 ||
        i.quantity > config.maxQuantity
      )
        throw new Error("Revisa las prendas y los servicios seleccionados.");
      return s + (garment.price + service.price) * i.quantity;
    }, 0),
  );
  const extras = [...new Set(draft.extraIds)].map((id) => {
    const extra = data.catalog.find(
      (c) =>
        c.id === id &&
        c.active &&
        c.customerSelectable &&
        c.category === "EXTRAS",
    );
    if (!extra) throw new Error("Uno de los extras ya no está disponible.");
    return extra;
  });
  const extrasTotal = money(extras.reduce((s, e) => s + e.price, 0));
  const subtotal = itemsSubtotal + extrasTotal;
  const authoritativeItems = draft.items.map((i) => ({
    ...i,
    name: data.catalog.find((c) => c.id === i.catalogId)!.name,
    serviceName: data.services.find((s) => s.id === i.serviceId)!.name,
  }));
  const promo = promotionFor(
    data,
    customer,
    authoritativeItems,
    subtotal,
    draft.promoCode,
  );
  const plan = data.plans.find((p) => p.id === customer.membershipId);
  const membershipBenefitDiscount = money(
    (itemsSubtotal * (plan?.discountPercent ?? 0)) / 100,
  );
  const eligibleSubtotal =
    !promo || promo.applicableServices.includes("Todos los servicios")
      ? subtotal
      : authoritativeItems
          .filter((i) =>
            promo.applicableServices.some(
              (s) => i.name.includes(s) || i.serviceName.includes(s),
            ),
          )
          .reduce((sum, i) => {
            const g = data.catalog.find((c) => c.id === i.catalogId)!;
            const s = data.services.find((s) => s.id === i.serviceId)!;
            return sum + (g.price + s.price) * i.quantity;
          }, 0);
  const discount = money(
    Math.min(
      subtotal - membershipBenefitDiscount,
      promo
        ? promo.discountType === "PERCENTAGE"
          ? (eligibleSubtotal * promo.discountValue) / 100
          : Math.min(eligibleSubtotal, promo.discountValue)
        : 0,
    ),
  );
  let rewardDiscount = 0;
  if (draft.rewardRedemptionId) {
    const redemption = data.redemptions.find(
      (r) =>
        r.id === draft.rewardRedemptionId &&
        r.customerId === customer.id &&
        r.status === "APPROVED" &&
        !r.benefitApplied,
    );
    const reward = data.rewards.find((r) => r.id === redemption?.rewardId);
    if (
      !redemption ||
      !reward ||
      addDays(
        (redemption.approvedAt ?? redemption.date).slice(0, 10),
        reward.validityDays,
      ) < today()
    )
      throw new Error("El beneficio de recompensa ya no está disponible.");
    const item = draft.items.find(
      (i) =>
        i.catalogId ===
        (reward.id === "REW-01"
          ? "CAT-14"
          : reward.id === "REW-02"
            ? "CAT-11"
            : ""),
    );
    if (!item && reward.id !== "REW-04")
      throw new Error(
        "Agrega la prenda o bolsa correspondiente a tu recompensa.",
      );
    if (item) {
      const g = data.catalog.find((c) => c.id === item.catalogId)!;
      rewardDiscount = money(
        Math.min(
          subtotal - membershipBenefitDiscount - discount,
          g.price * (1 - (plan?.discountPercent ?? 0) / 100),
        ),
      );
    }
  }
  const deliveryFee =
    draft.fulfillmentMode === "STORE_STORE"
      ? config.storePricing.transportFee
      : membershipRemaining(data, customer, draft.pickup?.date || today()) > 0
        ? 0
        : config.deliveryFee;
  return {
    itemsSubtotal,
    extrasTotal,
    discount,
    membershipBenefitDiscount,
    rewardDiscount,
    deliveryFee,
    total: money(
      Math.max(
        0,
        subtotal -
          discount -
          membershipBenefitDiscount -
          rewardDiscount +
          deliveryFee,
      ),
    ),
  };
}
export function normalizeFulfillmentDraft(data: AppData, draft: Draft): Draft {
  if (draft.fulfillmentMode !== "STORE_STORE") return draft;
  const f = data.facilities.find((f) => f.id === draft.facilityId);
  if (
    !f ||
    f.active === false ||
    f.acceptsCustomerDropoff === false ||
    f.allowsCustomerPickup === false
  )
    throw new Error("Selecciona una sede que permita ingreso y retiro.");
  const appointment = draft.customerDropoff ?? draft.pickup;
  const address: Address = {
    id: f.id,
    title: f.name,
    fullAddress: f.address,
    reference: "Ingreso y retiro en sede",
    isPrimary: false,
    coordinates: f.coordinates,
    persistence: "demo",
  };
  const date = appointment?.date ?? "";
  return {
    ...draft,
    pickup: {
      address,
      date,
      timeSlot: appointment?.timeSlot ?? "",
      notes: appointment?.notes ?? "",
    },
    delivery: {
      address,
      date: deliveryDates(data, draft.items, date)[0] ?? date,
      timeSlot: "Retiro al estar listo",
      notes: "",
    },
  };
}
export function validateOrder(data: AppData, customer: Customer, draft: Draft) {
  draft = normalizeFulfillmentDraft(data, draft);
  if (customer.kycStatus !== "APPROVED")
    throw new Error(
      "Necesitamos aprobar tu identidad antes de crear solicitudes.",
    );
  if (!draft.items.length) throw new Error("Agrega al menos una prenda.");
  validateSchedule(draft.pickup);
  if (draft.fulfillmentMode === "STORE_STORE") {
    const f = data.facilities.find((f) => f.id === draft.facilityId);
    if (
      !f ||
      f.active === false ||
      f.acceptsCustomerDropoff === false ||
      f.allowsCustomerPickup === false
    )
      throw new Error("Selecciona una sede que permita ingreso y retiro.");
  } else {
    validateSchedule(draft.delivery);
    serviceAreaService.requireCoverage(draft.pickup!.address.coordinates);
    serviceAreaService.requireCoverage(draft.delivery!.address.coordinates);
    if (
      [draft.pickup!.address, draft.delivery!.address].some(
        (a) => a.persistence === "temporary",
      )
    )
      throw new Error("Confirma una dirección que pueda guardarse.");
    if (
      !deliveryDates(data, draft.items, draft.pickup!.date).includes(
        draft.delivery!.date,
      )
    )
      throw new Error(
        "La fecha de entrega no permite completar el cuidado de tus prendas.",
      );
  }
  const pricing = quote(data, customer, draft);
  if (pricing.total < config.minimumOrder)
    throw new Error(`El pedido mínimo es ${formatMoney(config.minimumOrder)}.`);
  if (
    draft.paymentMethod === "WALLET" &&
    walletBalance(data, customer.id) < pricing.total
  )
    throw new Error(
      "Saldo insuficiente. Recarga tu billetera o elige otra tarjeta.",
    );
  if (
    draft.paymentMethod !== "WALLET" &&
    !data.cards.some(
      (c) => c.id === draft.paymentMethod && c.customerId === customer.id,
    )
  )
    throw new Error("Selecciona un método de pago válido.");
  return pricing;
}
export function routeDistance(
  from: Address["coordinates"],
  to: Address["coordinates"],
) {
  const rad = (x: number) => (x * Math.PI) / 180;
  const a =
    Math.sin(rad(to.lat - from.lat) / 2) ** 2 +
    Math.cos(rad(from.lat)) *
      Math.cos(rad(to.lat)) *
      Math.sin(rad(to.lng - from.lng) / 2) ** 2;
  return (
    Math.round(
      6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.25 * 10,
    ) / 10
  );
}
export const activeAssignment = (data: AppData, order: Order) =>
  data.assignments.find(
    (a) => a.orderId === order.id && a.status !== "COMPLETED",
  );
