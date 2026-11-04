import {
  isCustomerHandoff,
  type CustomerHandoffType,
} from "./customerHandoffs";
import { demoOrderTracking } from "./fixtures/orderTracking";
import { authenticateSession } from "@laundry/mobile-auth";
import {
  addCard,
  addBankAccount,
  setDefaultPaymentMethod,
  removePaymentMethod,
  type CardInput,
  type BankAccountInput,
} from "./paymentMethods";
import {
  extras,
  facilities,
  garments,
  initialSlots,
  plans,
  promos,
  rewards,
  services,
} from "./catalog";
import { createSeedState, seedHandoff } from "./seed";
import {
  modeFor,
  pickupStatuses,
  round,
  statusLabels,
  terminalStatuses,
  type Address,
  type AppState,
  type Customer,
  type Leg,
  type Method,
  type Order,
  type OrderItem,
  type OrderPricing,
  type OrderStatus,
  type PricingModel,
  type Role,
  type TimeSlot,
} from "./models";
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function scheduleDate(date: string, now = new Date()): string {
  if (/^hoy$/i.test(date)) return today(now);
  if (/^mañana$/i.test(date)) return today(new Date(now.getTime() + 86400000));
  return date;
}
export function initializeState(now = new Date()): AppState {
  const s = createSeedState();
  s.timeSlots.forEach((slot) => {
    slot.date = scheduleDate(slot.date, now);
  });
  s.orders.forEach((o) => {
    o.pickup.date = scheduleDate(o.pickup.date, now);
    o.delivery.date = scheduleDate(o.delivery.date, now);
    o.fulfillmentPlan.inbound.scheduledDate = o.pickup.date;
    o.fulfillmentPlan.outbound.scheduledDate = o.delivery.date;
  });
  refreshSchedule(s, now);
  return s;
}
export function refreshSchedule(s: AppState, now = new Date()): void {
  for (let day = 0; day <= 7; day++) {
    const date = today(new Date(now.getTime() + day * 86400000));
    for (const template of initialSlots) {
      if (
        day === 0 &&
        ["DRIVER_DELIVERY", "FACILITY_PICKUP"].includes(template.context)
      )
        continue;
      if (
        s.timeSlots.some(
          (slot) =>
            slot.date === date &&
            slot.context === template.context &&
            slot.startTime === template.startTime &&
            slot.endTime === template.endTime,
        )
      )
        continue;
      s.timeSlots.push({
        ...template,
        id: `${template.id}:${date}`,
        date,
        reservedCount: 0,
      });
    }
  }
}
export function currentCustomer(s: AppState): Customer {
  return s.customers.find((c) => c.id === s.session?.id) ?? s.customers[0];
}
export function visibleOrders(s: AppState): Order[] {
  if (!s.session || s.session.role !== "CLIENT") return [];
  return s.orders.filter((o) => o.customerId === s.session!.id);
}
export function slotContext(
  leg: "INBOUND" | "OUTBOUND",
  method: Method,
): TimeSlot["context"] {
  if (leg === "INBOUND" && method !== "DRIVER")
    throw Error("La recogida debe ser a domicilio.");
  return leg === "INBOUND"
    ? "DRIVER_PICKUP"
    : method === "DRIVER"
      ? "DRIVER_DELIVERY"
      : "FACILITY_PICKUP";
}
export function slotRange(slot: TimeSlot): string {
  return `${slot.startTime} - ${slot.endTime}`;
}
export function isLateCancellation(o: Order, now = new Date()): boolean {
  const leg = o.fulfillmentPlan.inbound;
  const time = new Date(
    `${scheduleDate(leg.scheduledDate, now)}T${leg.timeSlotText.slice(0, 5)}:00-05:00`,
  ).getTime();
  return (
    (pickupStatuses.includes(o.status) && o.status !== "PICKUP_ASSIGNED") ||
    (Number.isFinite(time) && time - now.getTime() < 3600000)
  );
}
export function calculatePricing(
  items: OrderItem[],
  extraIds: string[],
  model: PricingModel,
  tier: string,
  promoCode?: string,
  now = new Date(),
): OrderPricing {
  const itemsSubtotal =
    model === "FIXED"
      ? round(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0))
      : 0;
  const extrasTotal = round(
    extras
      .filter((e) => extraIds.includes(e.id))
      .reduce((sum, e) => sum + e.price, 0),
  );
  const promo = promos.find((p) => p.code === promoCode?.trim().toUpperCase());
  if (promoCode?.trim() && !promo)
    throw Error("El código promocional no existe.");
  if (
    promo &&
    model === "FIXED" &&
    (itemsSubtotal < promo.minOrderAmount || today(now) > promo.validUntil)
  )
    throw Error(
      `La promoción requiere ${promo.minOrderAmount.toFixed(2)} en prendas y debe estar vigente.`,
    );
  const discount =
    model === "FIXED" && promo
      ? round(
          promo.discountPercent
            ? (itemsSubtotal * promo.discountPercent) / 100
            : promo.fixedDiscount,
        )
      : 0;
  const plan = plans.find((p) => p.name === tier);
  const membershipBenefitDiscount =
    model === "FIXED"
      ? round((itemsSubtotal * (plan?.garmentDiscountPercent ?? 0)) / 100)
      : 0;
  return {
    itemsSubtotal,
    extrasTotal,
    discount,
    membershipBenefitDiscount,
    deliveryFee: 0,
    total: round(
      Math.max(
        0,
        itemsSubtotal + extrasTotal - discount - membershipBenefitDiscount,
      ),
    ),
  };
}
export interface CreateOrderInput {
  items: OrderItem[];
  extraIds: string[];
  inbound: Leg;
  outbound: Leg;
  pricingModel: PricingModel;
  estimatedWeightLb?: number;
  promoCode?: string;
  paymentMethod: string;
  notes: string;
}
export class LaundryRepository {
  constructor(
    public state: AppState,
    public now = new Date(),
  ) {}
  private id(prefix: string): string {
    return `${prefix}-${this.now.getTime()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  private stamp(): string {
    return this.now.toISOString();
  }
  private client(): Customer {
    if (this.state.session?.role !== "CLIENT")
      throw Error("Esta acción requiere una sesión de cliente.");
    return this.state.customers.find((c) => c.id === this.state.session!.id)!;
  }
  private order(id: string, role?: Role): Order {
    const o = visibleOrders(this.state).find((o) => o.id === id);
    if (!o || (role && this.state.session?.role !== role))
      throw Error("No tienes acceso a esta solicitud.");
    return o;
  }
  private active(o: Order): void {
    if (terminalStatuses.includes(o.status))
      throw Error("La solicitud ya está cerrada.");
  }
  private notify(o: Order, title: string, body: string): void {
    this.state.notifications.unshift({
      id: this.id("notif"),
      customerId: o.customerId,
      title,
      body,
      category: "PEDIDO",
      timeAgo: "Ahora",
      isRead: false,
      relatedOrderId: o.id,
    });
  }
  private event(
    o: Order,
    status: OrderStatus,
    description = "",
    title: string = statusLabels[status],
  ): void {
    o.status = status;
    const index = o.timeline.findIndex(
      (e) => e.status === status && !e.completed,
    );
    if (index >= 0)
      o.timeline.slice(0, index + 1).forEach((e) => {
        if (!e.completed) {
          e.completed = true;
          e.timestamp = this.stamp();
        }
      });
    o.timeline.push({
      status,
      title,
      description,
      timestamp: this.stamp(),
      completed: true,
    });
    this.notify(o, title, description || statusLabels[status]);
  }
  private debit(
    customer: Customer,
    amount: number,
    reference: string,
    description: string,
    method = "Billetera",
  ): void {
    if (!Number.isFinite(amount) || amount < 0) throw Error("Monto inválido.");
    if (/billetera/i.test(method)) {
      if (customer.walletBalance < amount)
        throw Error(
          "Saldo insuficiente. Recarga tu billetera o elige tarjeta demo.",
        );
      customer.walletBalance = round(customer.walletBalance - amount);
      this.state.walletTransactions.unshift({
        id: this.id("tx"),
        customerId: customer.id,
        amount,
        type: "DEBIT",
        reference,
        description,
        date: this.stamp(),
      });
    }
  }
  login(email: string, passwordHash: string): void {
    this.state.session = authenticateSession(
      this.state.accounts,
      email,
      passwordHash,
      "CLIENT",
    );
  }
  demoLogin(): void {
    this.state.session = { id: "cust-1", role: "CLIENT" };
  }
  logout(): void {
    this.state.session = null;
  }
  addPaymentCard(input: CardInput): string {
    return addCard(
      this.state,
      this.client().id,
      input,
      this.id("pm"),
      this.now,
    );
  }
  addPaymentBankAccount(input: BankAccountInput): string {
    return addBankAccount(this.state, this.client().id, input, this.id("pm"));
  }
  setDefaultPaymentMethod(id: string): void {
    setDefaultPaymentMethod(this.state, this.client().id, id);
  }
  removePaymentMethod(id: string): void {
    removePaymentMethod(this.state, this.client().id, id);
  }
  register(
    name: string,
    email: string,
    phone: string,
    passwordHash: string,
  ): void {
    email = email.trim().toLowerCase();
    if (
      !name.trim() ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      phone.replace(/\D/g, "").length < 8
    )
      throw Error("Revisa nombre, correo y teléfono.");
    if (this.state.accounts.some((a) => a.email === email))
      throw Error("El correo ya tiene una cuenta.");
    const id = this.id("cust");
    this.state.customers.push({
      id,
      name: name.trim(),
      email,
      phone: phone.trim(),
      kycStatus: "NOT_SUBMITTED",
      kycDocumentType: "Cédula de Identidad",
      addresses: [],
      walletBalance: 0,
      loyaltyPoints: 0,
      membershipTier: "Básico",
      billingName: name.trim(),
      billingTaxId: "",
      billingEmail: email,
      billingPhone: phone,
      billingAddress: "",
    });
    this.state.accounts.push({ id, email, role: "CLIENT", passwordHash });
    this.state.session = { id, role: "CLIENT" };
  }
  changePassword(currentHash: string, newHash: string): void {
    const a = this.state.accounts.find((a) => a.id === this.state.session?.id);
    if (!a || a.passwordHash !== currentHash)
      throw Error("La contraseña actual es incorrecta.");
    a.passwordHash = newHash;
  }
  saveKycDocument(documentType: string, documentId: string, uri: string): void {
    const c = this.client();
    if (!documentId.trim() || !uri)
      throw Error("Adjunta el documento e ingresa su número.");
    c.kycDocumentType = documentType;
    c.kycDocumentId = documentId.trim();
    c.documentUri = uri;
  }
  submitKyc(selfieUri: string): void {
    const c = this.client();
    if (!c.documentUri || !c.kycDocumentId || !selfieUri)
      throw Error("Completa el documento y la selfie.");
    c.selfieUri = selfieUri;
    c.kycStatus = "PENDING";
    delete c.kycRejectionReason;
  }
  simulateKyc(
    approved: boolean,
    reason = "La imagen del documento no es legible.",
  ): void {
    const c = this.client();
    if (c.kycStatus !== "PENDING")
      throw Error("La verificación no está pendiente.");
    c.kycStatus = approved ? "APPROVED" : "REJECTED";
    c.kycRejectionReason = approved ? undefined : reason;
  }
  canCreateNewOrder(): boolean {
    const c = this.client();
    return (
      c.kycStatus === "APPROVED" &&
      !this.state.customerCharges.some(
        (ch) => ch.customerId === c.id && ch.status === "PENDING",
      )
    );
  }
  private reserve(
    leg: Leg,
    context: TimeSlot["context"],
    release = false,
  ): void {
    const slot = this.state.timeSlots.find((s) => s.id === leg.timeSlotId);
    if (release) {
      if (slot) slot.reservedCount = Math.max(0, slot.reservedCount - 1);
      return;
    }
    const end = slot
      ? new Date(`${slot.date}T${slot.endTime}:00-05:00`).getTime()
      : 0;
    if (
      !slot ||
      slot.context !== context ||
      !slot.active ||
      slot.reservedCount >= slot.capacity ||
      slot.date !== leg.scheduledDate ||
      slotRange(slot) !== leg.timeSlotText ||
      end <= this.now.getTime()
    )
      throw Error("La franja no está disponible. Selecciona otro horario.");
    slot.reservedCount++;
  }
  private validateLeg(leg: Leg): void {
    if (
      !leg.addressFull.trim() ||
      !Number.isFinite(leg.latitude) ||
      !Number.isFinite(leg.longitude) ||
      Math.abs(leg.latitude) > 90 ||
      Math.abs(leg.longitude) > 180
    )
      throw Error("Selecciona una dirección válida.");
    if (
      leg.method === "CUSTOMER" &&
      !facilities.some((f) => f.id === leg.facilityId)
    )
      throw Error("Selecciona una sede válida.");
  }
  createOrder(input: CreateOrderInput): Order {
    modeFor(input.inbound.method, input.outbound.method);
    const c = this.client();
    if (!this.canCreateNewOrder())
      throw Error(
        "Completa tu verificación y regulariza los cargos antes de solicitar.",
      );
    if (input.pricingModel === "FIXED" && !input.items.length)
      throw Error("Agrega al menos una prenda.");
    input.items.forEach((i) => {
      const g = garments.find((g) => g.id === i.id),
        svc = services.find((s) => s.name === i.serviceType);
      if (
        !g ||
        !svc ||
        !Number.isSafeInteger(i.quantity) ||
        i.quantity <= 0 ||
        i.unitPrice !== round(g.basePrice + svc.extraPrice)
      )
        throw Error("Revisa las prendas y sus precios.");
    });
    if (
      input.pricingModel === "PER_WEIGHT" &&
      (!input.estimatedWeightLb ||
        !Number.isFinite(input.estimatedWeightLb) ||
        input.estimatedWeightLb <= 0)
    )
      throw Error("Ingresa un peso orientativo válido.");
    this.validateLeg(input.inbound);
    this.validateLeg(input.outbound);
    const inboundTime = new Date(
      `${input.inbound.scheduledDate}T${input.inbound.timeSlotText.slice(0, 5)}:00-05:00`,
    ).getTime();
    const outboundTime = new Date(
      `${input.outbound.scheduledDate}T${input.outbound.timeSlotText.slice(0, 5)}:00-05:00`,
    ).getTime();
    if (!Number.isFinite(inboundTime) || outboundTime <= inboundTime)
      throw Error("La salida debe ser posterior a la entrada.");
    const pricing = calculatePricing(
      input.items,
      input.extraIds,
      input.pricingModel,
      c.membershipTier,
      input.promoCode,
      this.now,
    );
    this.reserve(input.inbound, slotContext("INBOUND", input.inbound.method));
    this.reserve(
      input.outbound,
      slotContext("OUTBOUND", input.outbound.method),
    );
    const id = `SOL-${Math.max(4587, ...this.state.orders.map((o) => (/^SOL-\d+$/.test(o.id) ? Number(o.id.slice(4)) : 0))) + 1}`;
    if (input.pricingModel === "FIXED")
      this.debit(c, pricing.total, id, `Pago de ${id}`, input.paymentMethod);
    const inbound = clone(input.inbound),
      outbound = clone(input.outbound);
    const order: Order = {
      id,
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone,
      status: "PICKUP_ASSIGNED",
      priority: false,
      items: input.pricingModel === "FIXED" ? clone(input.items) : [],
      extras: clone(extras.filter((e) => input.extraIds.includes(e.id))),
      pricing,
      promotionCode: input.promoCode,
      pickup: {
        addressId: inbound.addressId ?? inbound.facilityId!,
        addressTitle: inbound.facilityName ?? "Domicilio",
        addressFull: inbound.addressFull,
        date: inbound.scheduledDate,
        timeSlot: inbound.timeSlotText,
        notes: input.notes,
      },
      delivery: {
        addressId: outbound.addressId ?? outbound.facilityId!,
        addressTitle: outbound.facilityName ?? "Domicilio",
        addressFull: outbound.addressFull,
        date: outbound.scheduledDate,
        timeSlot: outbound.timeSlotText,
      },
      facilityName:
        inbound.facilityName ?? outbound.facilityName ?? facilities[0].name,
      ...clone(demoOrderTracking),
      paymentMethod: input.paymentMethod,
      paymentStatus:
        input.pricingModel === "FIXED" ? "PAGADO" : "PENDIENTE_PESO",
      timeline: [],
      createdAt: this.stamp(),
      fulfillmentPlan: {
        mode: modeFor(inbound.method, outbound.method),
        inbound,
        outbound,
      },
      pricingModel: input.pricingModel,
      pricingStatus:
        input.pricingModel === "FIXED" ? "FINAL" : "PENDING_WEIGHT",
      estimatedWeightLb: input.estimatedWeightLb,
      pricePerLb: 2.2,
      handoffs: [],
      adjustments: [],
      canChangeOutboundMethod: true,
    };
    this.addHandoff(order, "CUSTOMER_TO_DRIVER");
    const statuses: OrderStatus[] = [
      "CONFIRMED",
      order.status,
      "AT_FACILITY",
      "IN_PROCESS",
      outbound.method === "DRIVER" ? "READY_FOR_DELIVERY" : "READY_FOR_PICKUP",
      "COMPLETED",
    ];
    order.timeline = statuses.map((s, i) => ({
      status: s,
      title: statusLabels[s],
      description: "",
      timestamp: i < 2 ? this.stamp() : "Pendiente",
      completed: i < 2,
    }));
    if (input.pricingModel === "FIXED")
      c.loyaltyPoints += Math.floor(pricing.total * 10);
    this.state.orders.unshift(order);
    this.notify(
      order,
      `Solicitud ${id} agendada`,
      "Tu modalidad, agenda y códigos están listos.",
    );
    return order;
  }
  private addHandoff(
    o: Order,
    type: CustomerHandoffType,
    pending = false,
  ): void {
    if (!isCustomerHandoff({ type }))
      throw Error("El ingreso del cliente en sede ya no está disponible.");
    if (
      o.handoffs.some(
        (h) => h.type === type && ["ACTIVE", "PENDING"].includes(h.status),
      )
    )
      return;
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const h = seedHandoff(o.id, type, code, pending ? "PENDING" : "ACTIVE");
    h.id = this.id("h");
    h.qrToken = this.id(`QR-${o.id}`);
    h.createdAt = this.stamp();
    o.handoffs.push(h);
  }
  regenerateHandoffCode(orderId: string, handoffId: string): void {
    const o = this.order(orderId, "CLIENT");
    const h = o.handoffs.find((h) => h.id === handoffId);
    if (!h || !isCustomerHandoff(h) || h.status !== "ACTIVE")
      throw Error("El código ya no está activo.");
    const oldCode = h.fallbackCode;
    do {
      h.fallbackCode = String(100000 + Math.floor(Math.random() * 900000));
    } while (h.fallbackCode === oldCode);
    h.qrToken = this.id(`QR-${o.id}`);
  }
  approveAdjustment(
    orderId: string,
    adjustmentId: string,
    accept = true,
  ): void {
    const o = this.order(orderId, "CLIENT");
    this.active(o);
    const a = o.adjustments.find((a) => a.id === adjustmentId);
    if (!a || a.status !== "PENDING_CUSTOMER")
      throw Error("El ajuste ya fue resuelto.");
    a.status = accept ? "APPROVED" : "REJECTED";
    a.resolvedAt = this.stamp();
    if (accept) o.pricing.total = round(o.pricing.total + a.amountDifference);
    this.event(
      o,
      "IN_PROCESS",
      accept
        ? "El ajuste fue aprobado y la ropa continúa en lavado."
        : "El ajuste fue rechazado. Continúa el tratamiento original.",
      accept ? "Ajuste aprobado" : "Ajuste rechazado",
    );
  }
  confirmWeightAndPay(orderId: string, method = "Billetera"): void {
    const o = this.order(orderId, "CLIENT");
    const c = this.client();
    if (
      o.pricingModel !== "PER_WEIGHT" ||
      o.pricingStatus !== "CALCULATED" ||
      o.paymentStatus === "PAGADO"
    )
      throw Error("No hay un pesaje pendiente de pago.");
    this.debit(
      c,
      o.pricing.total,
      o.id,
      `Pago final por peso de ${o.id}`,
      method,
    );
    o.paymentMethod = method;
    o.paymentStatus = "PAGADO";
    o.pricingStatus = "FINAL";
    c.loyaltyPoints += Math.floor(o.pricing.total * 10);
    this.event(
      o,
      "IN_PROCESS",
      "Peso y valor final confirmados. Pago demo registrado.",
    );
  }
  private editable(o: Order, legName: "INBOUND" | "OUTBOUND"): void {
    this.active(o);
    const leg =
      legName === "INBOUND"
        ? o.fulfillmentPlan.inbound
        : o.fulfillmentPlan.outbound;
    if (
      ["COMPLETED", "IN_PROGRESS"].includes(leg.status) ||
      (legName === "INBOUND" &&
        ![
          "AWAITING_INTAKE",
          "PICKUP_ASSIGNED",
          "PICKUP_PENDING",
          "CONFIRMED",
        ].includes(o.status)) ||
      (legName === "OUTBOUND" &&
        (!o.canChangeOutboundMethod ||
          ["OUT_FOR_DELIVERY", "ARRIVED_FOR_DELIVERY"].includes(o.status)))
    )
      throw Error("Este tramo ya inició y no permite cambios.");
  }
  changeLeg(orderId: string, legName: "INBOUND" | "OUTBOUND", next: Leg): void {
    slotContext(legName, next.method);
    const o = this.order(orderId, "CLIENT");
    this.editable(o, legName);
    this.validateLeg(next);
    const old =
      legName === "INBOUND"
        ? o.fulfillmentPlan.inbound
        : o.fulfillmentPlan.outbound;
    const scheduled = new Date(
      `${scheduleDate(old.scheduledDate, this.now)}T${old.timeSlotText.slice(0, 5)}:00-05:00`,
    ).getTime();
    if (
      !o.pickupNeedsScheduling &&
      old.scheduledDate &&
      old.timeSlotText &&
      Number.isFinite(scheduled) &&
      scheduled - this.now.getTime() < 3600000
    )
      throw Error("La reprogramación requiere 60 minutos de anticipación.");
    const nextTime = new Date(
      `${next.scheduledDate}T${next.timeSlotText.slice(0, 5)}:00-05:00`,
    ).getTime();
    const other =
      legName === "INBOUND"
        ? o.fulfillmentPlan.outbound
        : o.fulfillmentPlan.inbound;
    const otherTime = new Date(
      `${scheduleDate(other.scheduledDate, this.now)}T${other.timeSlotText.slice(0, 5)}:00-05:00`,
    ).getTime();
    if (
      !Number.isFinite(nextTime) ||
      (other.scheduledDate &&
        other.timeSlotText &&
        Number.isFinite(otherTime) &&
        (legName === "INBOUND" ? nextTime >= otherTime : nextTime <= otherTime))
    )
      throw Error("La salida debe ser posterior a la entrada.");
    if (old.timeSlotId)
      this.reserve(old, slotContext(legName, old.method), true);
    this.reserve(next, slotContext(legName, next.method));
    if (legName === "INBOUND") {
      o.fulfillmentPlan.inbound = clone(next);
      Object.assign(o.pickup, {
        addressId: next.addressId ?? next.facilityId,
        addressFull: next.addressFull,
        addressTitle: next.facilityName ?? "Domicilio",
        date: next.scheduledDate,
        timeSlot: next.timeSlotText,
      });
      o.handoffs
        .filter(
          (h) =>
            ["CUSTOMER_TO_DRIVER", "CUSTOMER_TO_FACILITY"].includes(h.type) &&
            h.status !== "USED",
        )
        .forEach((h) => {
          h.status = "REVOKED";
        });
      this.addHandoff(o, "CUSTOMER_TO_DRIVER");
      o.status = "PICKUP_ASSIGNED";
      o.pickupNeedsScheduling = false;
    } else {
      o.fulfillmentPlan.outbound = clone(next);
      Object.assign(o.delivery, {
        addressId: next.addressId ?? next.facilityId,
        addressFull: next.addressFull,
        addressTitle: next.facilityName ?? "Domicilio",
        date: next.scheduledDate,
        timeSlot: next.timeSlotText,
      });
      o.handoffs
        .filter(
          (h) =>
            ["DRIVER_TO_CUSTOMER", "FACILITY_TO_CUSTOMER"].includes(h.type) &&
            h.status !== "USED",
        )
        .forEach((h) => {
          h.status = "REVOKED";
        });
      if (
        [
          "READY_FOR_PICKUP",
          "READY_FOR_DELIVERY",
          "DELIVERY_ASSIGNED",
          "DELIVERY_SCHEDULED",
        ].includes(o.status)
      ) {
        o.status =
          next.method === "CUSTOMER" ? "READY_FOR_PICKUP" : "DELIVERY_ASSIGNED";
        this.addHandoff(
          o,
          next.method === "CUSTOMER"
            ? "FACILITY_TO_CUSTOMER"
            : "DRIVER_TO_CUSTOMER",
          next.method === "DRIVER",
        );
      }
    }
    o.fulfillmentPlan.mode = modeFor(
      o.fulfillmentPlan.inbound.method,
      o.fulfillmentPlan.outbound.method,
    );
    this.state.rescheduleRequests.unshift({
      id: this.id("reschedule"),
      orderId,
      leg: legName,
      newDate: next.scheduledDate,
      newTimeSlot: next.timeSlotText,
      createdAt: this.stamp(),
    });
    this.event(
      o,
      o.status,
      `${next.scheduledDate} · ${next.timeSlotText} · ${next.addressFull}`,
      "Horario y modalidad actualizados",
    );
  }
  cancelOrder(orderId: string): void {
    const o = this.order(orderId, "CLIENT");
    this.active(o);
    const late = isLateCancellation(o, this.now);
    if (
      !["COMPLETED", "IN_PROGRESS"].includes(o.fulfillmentPlan.inbound.status)
    )
      this.reserve(
        o.fulfillmentPlan.inbound,
        slotContext("INBOUND", o.fulfillmentPlan.inbound.method),
        true,
      );
    this.reserve(
      o.fulfillmentPlan.outbound,
      slotContext("OUTBOUND", o.fulfillmentPlan.outbound.method),
      true,
    );
    o.handoffs
      .filter((h) => h.status !== "USED")
      .forEach((h) => {
        h.status = "REVOKED";
      });
    if (late)
      this.state.customerCharges.unshift({
        id: this.id("chg"),
        customerId: o.customerId,
        orderId,
        type: "LATE_CANCELLATION",
        amount: 5,
        status: "PENDING",
        reason:
          "Cancelación a menos de 60 minutos de la franja o con recogida iniciada.",
        createdAt: this.stamp(),
      });
    this.event(
      o,
      "CANCELLED",
      late
        ? "Cancelación tardía: cargo de $5.00. Regularízalo en la billetera."
        : "Cancelación sin cargo. Los pagos y reembolsos requieren revisión de operaciones.",
    );
  }
  payCustomerCharge(chargeId: string, method = "Billetera"): void {
    const c = this.client();
    const ch = this.state.customerCharges.find(
      (ch) => ch.id === chargeId && ch.customerId === c.id,
    );
    if (!ch || ch.status !== "PENDING")
      throw Error("El cargo ya fue regularizado.");
    this.debit(c, ch.amount, "CARGO", ch.reason, method);
    ch.status = "PAID";
    ch.paidAt = this.stamp();
  }
  sendChatMessage(orderId: string, text: string): void {
    const o = this.order(orderId);
    if (!text.trim()) throw Error("Escribe un mensaje.");
    const session = this.state.session!;
    const sender = this.client();
    (this.state.chatMessages[o.id] ??= []).push({
      id: this.id("msg"),
      orderId,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: session.role,
      text: text.trim(),
      timestamp: this.stamp(),
    });
  }
  addWalletCredit(amount: number): void {
    const c = this.client();
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000)
      throw Error("La recarga debe estar entre $0.01 y $1,000.");
    c.walletBalance = round(c.walletBalance + amount);
    this.state.walletTransactions.unshift({
      id: this.id("tx"),
      customerId: c.id,
      amount: round(amount),
      type: "CREDIT",
      reference: "Recarga Online",
      description: "Recarga demo a tu Billetera Laundry",
      date: this.stamp(),
    });
  }
  redeemReward(rewardId: string): void {
    const c = this.client();
    const r = rewards.find((r) => r.id === rewardId);
    if (!r || c.loyaltyPoints < r.pointsCost)
      throw Error("No tienes puntos suficientes.");
    c.loyaltyPoints -= r.pointsCost;
    this.state.loyaltyRedemptions.unshift({
      id: this.id("red"),
      customerId: c.id,
      rewardTitle: r.title,
      pointsCost: r.pointsCost,
      date: this.stamp(),
      status: "Pendiente de aprobación",
    });
  }
  changeMembershipPlan(name: string): void {
    const c = this.client();
    if (!plans.some((p) => p.name === name)) throw Error("Plan inválido.");
    c.membershipTier = name;
  }
  saveAddress(address: Address): void {
    const c = this.client();
    this.validateLeg({
      ...address,
      method: "DRIVER",
      addressFull: address.fullAddress,
      scheduledDate: "",
      timeSlotText: "",
      status: "",
    });
    if (!address.title.trim())
      throw Error("Ingresa un nombre para la dirección.");
    if (!c.addresses.length) address.isPrimary = true;
    if (address.isPrimary)
      c.addresses.forEach((a) => {
        a.isPrimary = false;
      });
    const index = c.addresses.findIndex((a) => a.id === address.id);
    if (index >= 0) c.addresses[index] = clone(address);
    else c.addresses.push(clone(address));
  }
  setDefaultAddress(addressId: string): void {
    const c = this.client();
    if (!c.addresses.some((a) => a.id === addressId))
      throw Error("Dirección inexistente.");
    c.addresses.forEach((a) => {
      a.isPrimary = a.id === addressId;
    });
  }
  removeAddress(addressId: string): void {
    const c = this.client();
    c.addresses = c.addresses.filter((a) => a.id !== addressId);
    if (c.addresses.length && !c.addresses.some((a) => a.isPrimary))
      c.addresses[0].isPrimary = true;
  }
  updateBillingData(
    data: Pick<
      Customer,
      | "billingName"
      | "billingTaxId"
      | "billingEmail"
      | "billingPhone"
      | "billingAddress"
    >,
  ): void {
    const c = this.client();
    if (
      Object.values(data).some((v) => !v.trim()) ||
      !/^\S+@\S+\.\S+$/.test(data.billingEmail)
    )
      throw Error("Completa los datos de facturación.");
    Object.assign(c, data);
  }
  markNotificationRead(id: string): void {
    const c = this.client();
    const n = this.state.notifications.find(
      (n) => n.id === id && n.customerId === c.id,
    );
    if (n) n.isRead = true;
  }
}
export function transact<T>(
  state: AppState,
  action: (repo: LaundryRepository) => T,
  now = new Date(),
): { state: AppState; result: T } {
  const next = clone(state);
  refreshSchedule(next, now);
  const repo = new LaundryRepository(next, now);
  const result = action(repo);
  return { state: repo.state, result };
}
