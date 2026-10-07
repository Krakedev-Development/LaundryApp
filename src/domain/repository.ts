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
import { createSeedState, DEMO_PASSWORD_HASH, seedHandoff } from "./seed";
import {
  modeFor,
  pickupStatuses,
  round,
  statusLabels,
  terminalStatuses,
  type Address,
  type AppState,
  type Customer,
  type HandoffType,
  type Leg,
  type Method,
  type OperationalStatus,
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
/** Keep existing reservations and add a rolling week when the demo is reopened. */
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
  if (!s.session) return [];
  return s.orders.filter((o) =>
    s.session!.role === "CLIENT"
      ? o.customerId === s.session!.id
      : o.assignedDriverId === s.session!.id,
  );
}
export function slotContext(
  leg: "INBOUND" | "OUTBOUND",
  method: Method,
): TimeSlot["context"] {
  return leg === "INBOUND"
    ? method === "DRIVER"
      ? "DRIVER_PICKUP"
      : "FACILITY_DROPOFF"
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

/** Operations run on a cloned state. A failed operation never partially commits. */
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
    if (
      this.state.session?.role === "DRIVER" &&
      this.state.driver.mustChangePassword
    )
      throw Error("Cambia tu contraseña temporal antes de iniciar servicios.");
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
    const account = this.state.accounts.find(
      (a) =>
        a.email.toLowerCase() === email.trim().toLowerCase() &&
        a.passwordHash === passwordHash,
    );
    if (!account) throw Error("Correo o contraseña incorrectos.");
    this.state.session = { id: account.id, role: account.role };
  }
  demoLogin(role: Role): void {
    this.state.session = { id: role === "CLIENT" ? "cust-1" : "drv-1", role };
  }
  logout(): void {
    this.state.session = null;
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
  changePassword(currentHash: string, newHash: string, forced = false): void {
    const a = this.state.accounts.find((a) => a.id === this.state.session?.id);
    if (!a || (!forced && a.passwordHash !== currentHash))
      throw Error("La contraseña actual es incorrecta.");
    if (
      forced &&
      (a.role !== "DRIVER" || !this.state.driver.mustChangePassword)
    )
      throw Error("No hay cambio obligatorio pendiente.");
    a.passwordHash = newHash;
    if (a.role === "DRIVER") this.state.driver.mustChangePassword = false;
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
    const driver = this.state.driver;
    const order: Order = {
      id,
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone,
      status:
        inbound.method === "CUSTOMER" ? "AWAITING_INTAKE" : "PICKUP_ASSIGNED",
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
      assignedDriverId:
        inbound.method === "DRIVER" || outbound.method === "DRIVER"
          ? driver.id
          : undefined,
      assignedDriverName: driver.name,
      assignedDriverPhone: driver.phone,
      assignedDriverVehicle: `${driver.vehicleModel} (${driver.vehicleColor})`,
      assignedDriverPlate: driver.vehiclePlate,
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
    this.addHandoff(
      order,
      inbound.method === "DRIVER"
        ? "CUSTOMER_TO_DRIVER"
        : "CUSTOMER_TO_FACILITY",
    );
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
  private addHandoff(o: Order, type: HandoffType, pending = false): void {
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
  private consume(o: Order, type: HandoffType, code?: string): void {
    let h = o.handoffs.find((h) => h.type === type && h.status === "ACTIVE");
    if (!h) {
      this.addHandoff(o, type);
      h = o.handoffs.find((h) => h.type === type && h.status === "ACTIVE")!;
    }
    if (code && code !== h.fallbackCode && code !== h.qrToken)
      throw Error("El código no corresponde a esta transferencia.");
    h.status = "USED";
    h.usedAt = this.stamp();
  }
  regenerateHandoffCode(orderId: string, handoffId: string): void {
    const o = this.order(orderId, "CLIENT");
    const h = o.handoffs.find((h) => h.id === handoffId);
    if (!h || h.status !== "ACTIVE")
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
    if (scheduled - this.now.getTime() < 3600000)
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
      (legName === "INBOUND" ? nextTime >= otherTime : nextTime <= otherTime)
    )
      throw Error("La salida debe ser posterior a la entrada.");
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
      this.addHandoff(
        o,
        next.method === "DRIVER"
          ? "CUSTOMER_TO_DRIVER"
          : "CUSTOMER_TO_FACILITY",
      );
      o.status =
        next.method === "DRIVER" ? "PICKUP_ASSIGNED" : "AWAITING_INTAKE";
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
    if (o.fulfillmentPlan.mode !== "STORE_STORE")
      o.assignedDriverId = this.state.driver.id;
    else delete o.assignedDriverId;
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
  driverAction(
    orderId: string,
    action:
      | "START_PICKUP"
      | "ARRIVE_PICKUP"
      | "GO_FACILITY"
      | "ARRIVE_FACILITY"
      | "START_DELIVERY"
      | "ARRIVE_DELIVERY",
  ): void {
    const o = this.order(orderId, "DRIVER");
    const transitions: Record<typeof action, [OrderStatus, OrderStatus]> = {
      START_PICKUP: ["PICKUP_ASSIGNED", "HEADING_TO_PICKUP"],
      ARRIVE_PICKUP: ["HEADING_TO_PICKUP", "ARRIVED_FOR_PICKUP"],
      GO_FACILITY: ["PICKED_UP", "HEADING_TO_FACILITY"],
      ARRIVE_FACILITY: ["HEADING_TO_FACILITY", "AT_FACILITY"],
      START_DELIVERY: ["DELIVERY_ASSIGNED", "OUT_FOR_DELIVERY"],
      ARRIVE_DELIVERY: ["OUT_FOR_DELIVERY", "ARRIVED_FOR_DELIVERY"],
    };
    const [from, to] = transitions[action];
    if (o.status !== from)
      throw Error("La acción no corresponde al estado actual.");
    if (["BREAK", "OFFLINE"].includes(this.state.driver.operationalStatus))
      throw Error("Ponte disponible antes de continuar el servicio.");
    if (action === "START_PICKUP")
      o.fulfillmentPlan.inbound.status = "IN_PROGRESS";
    if (action === "START_DELIVERY") {
      if (o.paymentStatus !== "PAGADO")
        throw Error("El pedido requiere pago antes del despacho.");
      o.fulfillmentPlan.outbound.status = "IN_PROGRESS";
      o.canChangeOutboundMethod = false;
      o.handoffs
        .filter(
          (h) => h.type === "DRIVER_TO_CUSTOMER" && h.status === "PENDING",
        )
        .forEach((h) => {
          h.status = "ACTIVE";
        });
      this.addHandoff(o, "DRIVER_TO_CUSTOMER");
      this.addHandoff(o, "FACILITY_TO_DRIVER");
      this.consume(o, "FACILITY_TO_DRIVER");
    }
    if (action === "ARRIVE_FACILITY") {
      this.consume(o, "DRIVER_TO_FACILITY");
      o.fulfillmentPlan.inbound.status = "COMPLETED";
      o.fulfillmentPlan.inbound.completedAt = this.stamp();
      this.state.driver.operationalStatus = "AVAILABLE";
    } else this.state.driver.operationalStatus = "ON_SERVICE";
    this.event(o, to);
  }
  driverConfirmPickup(
    orderId: string,
    count: number,
    notes: string,
    photoUri?: string,
    code?: string,
  ): void {
    const o = this.order(orderId, "DRIVER");
    if (o.status !== "ARRIVED_FOR_PICKUP")
      throw Error("Marca la llegada antes de confirmar.");
    if (!Number.isSafeInteger(count) || count <= 0)
      throw Error("Ingresa un conteo de prendas válido.");
    this.consume(o, "CUSTOMER_TO_DRIVER", code);
    this.addHandoff(o, "DRIVER_TO_FACILITY");
    Object.assign(o.pickup, {
      garmentCountConfirmed: count,
      notes: notes.trim() || o.pickup.notes,
      pickedUpAt: this.stamp(),
      evidencePhotoUri: photoUri,
    });
    this.event(o, "PICKED_UP", `${count} prendas recibidas y verificadas.`);
  }
  driverConfirmDelivery(
    orderId: string,
    name: string,
    relationship: string,
    notes: string,
    photoUri?: string,
    code?: string,
  ): void {
    const o = this.order(orderId, "DRIVER");
    if (o.status !== "ARRIVED_FOR_DELIVERY" || !name.trim())
      throw Error("Confirma llegada y nombre de quien recibe.");
    this.consume(o, "DRIVER_TO_CUSTOMER", code);
    Object.assign(o.delivery, {
      recipientName: name.trim(),
      recipientRelationship: relationship,
      deliveryNotes: notes.trim(),
      deliveredAt: this.stamp(),
      evidencePhotoUri: photoUri,
    });
    o.fulfillmentPlan.outbound.status = "COMPLETED";
    o.fulfillmentPlan.outbound.completedAt = this.stamp();
    this.state.driver.operationalStatus = "AVAILABLE";
    this.state.driver.completedDeliveriesCount++;
    this.event(o, "DELIVERED", `Entregado a ${name.trim()} (${relationship}).`);
  }
  /** Native prototype's local plant simulator; no administrative mobile account. */
  advancePlantOperation(orderId: string, measuredLb?: number): void {
    const o = this.order(orderId);
    this.active(o);
    switch (o.status) {
      case "AWAITING_INTAKE":
        this.consume(o, "CUSTOMER_TO_FACILITY");
        o.fulfillmentPlan.inbound.status = "COMPLETED";
        o.fulfillmentPlan.inbound.completedAt = this.stamp();
        this.event(o, "AT_FACILITY");
        break;
      case "AT_FACILITY":
        this.event(
          o,
          o.pricingModel === "PER_WEIGHT" ? "WEIGHING" : "IN_PROCESS",
        );
        break;
      case "WEIGHING": {
        if (o.pricingStatus === "CALCULATED")
          throw Error("Confirma el peso y paga desde el cliente.");
        if (!measuredLb || !Number.isFinite(measuredLb) || measuredLb <= 0)
          throw Error("Ingresa el peso certificado en libras.");
        o.weightLb = measuredLb;
        o.weightKg = round(measuredLb * 0.45359237);
        o.pricing.itemsSubtotal = round(measuredLb * o.pricePerLb);
        const c = this.state.customers.find((c) => c.id === o.customerId)!;
        o.pricing.membershipBenefitDiscount = round(
          (o.pricing.itemsSubtotal *
            (plans.find((p) => p.name === c.membershipTier)
              ?.garmentDiscountPercent ?? 0)) /
            100,
        );
        const p = promos.find(
          (p) =>
            p.code === o.promotionCode &&
            p.validUntil >= today(this.now) &&
            o.pricing.itemsSubtotal >= p.minOrderAmount,
        );
        o.pricing.discount = p
          ? round(
              p.discountPercent
                ? (o.pricing.itemsSubtotal * p.discountPercent) / 100
                : p.fixedDiscount,
            )
          : 0;
        o.pricing.total = round(
          Math.max(
            0,
            o.pricing.itemsSubtotal +
              o.pricing.extrasTotal -
              o.pricing.discount -
              o.pricing.membershipBenefitDiscount,
          ),
        );
        o.pricingStatus = "CALCULATED";
        o.paymentStatus = "PENDIENTE";
        this.notify(
          o,
          "Peso certificado",
          "Revisa el peso final y confirma el pago.",
        );
        break;
      }
      case "IN_PROCESS":
        this.event(o, "QUALITY_CONTROL");
        break;
      case "QUALITY_CONTROL": {
        const customer = o.fulfillmentPlan.outbound.method === "CUSTOMER";
        this.event(o, customer ? "READY_FOR_PICKUP" : "READY_FOR_DELIVERY");
        this.addHandoff(
          o,
          customer ? "FACILITY_TO_CUSTOMER" : "DRIVER_TO_CUSTOMER",
          !customer,
        );
        break;
      }
      case "READY_FOR_DELIVERY":
        o.assignedDriverId = this.state.driver.id;
        this.event(o, "DELIVERY_ASSIGNED");
        break;
      case "READY_FOR_PICKUP":
        this.consume(o, "FACILITY_TO_CUSTOMER");
        o.fulfillmentPlan.outbound.status = "COMPLETED";
        o.fulfillmentPlan.outbound.completedAt = this.stamp();
        this.event(o, "COMPLETED");
        break;
      default:
        throw Error(
          "No hay una operación de planta disponible en este estado.",
        );
    }
  }
  sendChatMessage(orderId: string, text: string): void {
    const o = this.order(orderId);
    if (!text.trim()) throw Error("Escribe un mensaje.");
    const session = this.state.session!;
    const sender =
      session.role === "CLIENT" ? this.client() : this.state.driver;
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
  setDriverOperationalStatus(status: OperationalStatus): void {
    if (this.state.session?.role !== "DRIVER")
      throw Error("Se requiere sesión de chofer.");
    this.state.driver.operationalStatus = status;
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
  simulateTemporaryPassword(): void {
    this.state.driver.mustChangePassword = true;
    this.state.accounts.find((a) => a.role === "DRIVER")!.passwordHash =
      DEMO_PASSWORD_HASH;
    this.demoLogin("DRIVER");
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
