import { LocalHandoffRepository } from "./LocalHandoffRepository";
import {
  operationalStage,
  advanceOperational,
  migrateOrder,
} from "./fulfillment";
import { HandoffService, HandoffState } from "./HandoffService";
import { eligibilityReasons } from "../services/geo/DispatchService";
import { serviceAreaService } from "../services/geo/ServiceAreaService";
import {
  AppData,
  Address,
  Customer,
  DriverAssignment,
  Draft,
  Order,
  OrderStatus,
  Session,
} from "./models";
import {
  activeAssignment,
  DRIVER_NEXT,
  isFinished,
  money,
  normalizeFulfillmentDraft,
  pointsBalance,
  quote,
  reservedPoints,
  routeDistance,
  today,
  validateOrder,
  walletBalance,
} from "./rules";
import { businessConfig } from "../config/business";

/** All mock repositories share this transaction boundary. No screen mutates operational data. */
export class DomainEngine {
  constructor(
    public data: AppData,
    private changed: (data: AppData) => void = () => {},
    private randomToken: () => string = () =>
      Array.from(globalThis.crypto.getRandomValues(new Uint8Array(20)), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join(""),
  ) {
    this.initializeWorkflow();
  }
  readonly handoffService = new HandoffService({
    ...new LocalHandoffRepository(
      () => this.data,
      (work) => this.update((d) => work(d)),
    ),
    random: () => this.randomToken(),
    actor: (id) => {
      const customer = this.data.customers.find((c) => c.id === id);
      if (customer) return { id, name: customer.name, role: "CLIENT" };
      const driver = this.data.drivers.find((d) => d.id === id);
      if (driver) return { id, name: driver.name, role: "DRIVER" };
      const match = /^DEMO-(ADMIN|SUPERVISOR)-(FAC-\d+)$/.exec(id);
      if (match && this.data.facilities.some((f) => f.id === match[2]))
        return {
          id,
          name: "Operador demo de sede",
          role: match[1] as "ADMIN" | "SUPERVISOR",
          facilityId: match[2],
        };
      throw new Error("Operador no autorizado.");
    },
    paid: (o) => (o as Order).payment.status === "PAID",
    declaredCount: (o) =>
      (o as Order).items.reduce((n, i) => n + i.quantity, 0),
    confirmed: (state, raw, h, actor) => {
      const d = state as AppData;
      const o = raw as Order;
      const assignment = d.assignments.find(
        (a) => a.id === h.driverAssignmentId,
      );
      if (assignment && h.receipt?.count !== undefined) {
        assignment.actualCount = h.receipt.count;
        assignment.expectedCount = h.receipt.declaredCount;
      }
      if (h.type === "CUSTOMER_TO_DRIVER") {
        o.pickup.completedAt = h.usedAt;
        o.pickup.notes = h.receipt?.notes ?? o.pickup.notes;
      }
      if (["DRIVER_TO_CUSTOMER", "FACILITY_TO_CUSTOMER"].includes(h.type)) {
        o.delivery.completedAt = h.usedAt;
        o.delivery.recipient = {
          name: h.receipt!.recipient!,
          relationship: h.receipt!.relationship!,
        };
      }
      if (o.intakeHold && !o.intakeHold.resolvedAt)
        o.incidents.push({
          id: "INC-" + h.id,
          description: o.intakeHold.description,
          date: h.usedAt!,
        });
      if (
        assignment &&
        ["DRIVER_TO_FACILITY", "DRIVER_TO_CUSTOMER"].includes(h.type)
      ) {
        assignment.status = "COMPLETED";
        assignment.completedAt = h.usedAt;
        const driver = d.drivers.find((v) => v.id === assignment.driverId)!;
        driver.operationalStatus = "AVAILABLE";
      }
      o.timeline.push({
        id: this.id(d, "event"),
        status: o.status,
        actorId: actor.id,
        timestamp: h.usedAt!,
        notes:
          h.receipt?.notes ??
          "Transferencia confirmada mediante código. Validación local de demo.",
        syncStatus: "SYNCED",
      });
      if (o.status === "COMPLETED") this.earnPoints(d, o);
      this.notify(
        d,
        o.customerId,
        "HANDOFF_CONFIRMED",
        "Transferencia confirmada",
        o.id,
        o.id,
      );
    },
  });
  initializeWorkflow() {
    this.data.facilities.forEach((f) => {
      f.active ??= true;
      f.acceptsCustomerDropoff ??= true;
      f.allowsCustomerPickup ??= true;
      f.openingHours ??= "Lunes a sábado, 08:00–18:00";
      f.serviceAreaIds ??= serviceAreaService.areas
        .filter((a) => a.facilityId === f.id)
        .map((a) => a.id);
    });
    this.data.handoffs ??= [];
    this.data.handoffAudits ??= [];
    for (const [id, mode] of [
      ["SOL-STORE-001", "STORE_STORE"],
      ["SOL-HOME-001", "HOME_HOME"],
    ] as const) {
      if (this.data.orders.some((o) => o.id === id)) continue;
      const template =
        this.data.orders.find((o) => o.facilityId === "FAC-02") ??
        this.data.orders[0];
      if (!template) continue;
      const o: Order = JSON.parse(JSON.stringify(template));
      o.id = id;
      o.status = "PICKUP_PENDING";
      o.workflowVersion = undefined;
      o.fulfillment = undefined;
      o.intakeHold = undefined;
      o.timeline = [];
      o.pickup.completedAt = undefined;
      o.delivery.completedAt = undefined;
      o.delivery.recipient = undefined;
      o.customerId = "CUST-001";
      o.customerName = this.data.customers.find(
        (c) => c.id === "CUST-001",
      )!.name;
      o.createdAt = new Date().toISOString();
      o.updatedAt = o.createdAt;
      o.assignments = [];
      o.incidents = [];
      o.payment = {
        ...o.payment,
        id: "PAY-" + id,
        orderId: id,
        transactionReference: "DEMO-" + id,
        status: "PAID",
      };
      o.pickup.driverAssignmentId = undefined;
      o.delivery.driverAssignmentId = undefined;
      if (mode === "STORE_STORE") {
        const f = this.data.facilities.find((f) => f.id === o.facilityId)!;
        const a = {
          id: f.id,
          title: f.name,
          fullAddress: f.address,
          reference: "Ingreso y retiro en sede",
          isPrimary: false,
          coordinates: f.coordinates,
          persistence: "demo" as const,
        };
        o.pickup.address = a;
        o.delivery.address = a;
        o.delivery.timeSlot = "Retiro al estar listo";
      }
      migrateOrder(o, mode);
      if (mode === "STORE_STORE") {
        o.pricing.deliveryFee = 0;
        o.pricing.total = Number(
          (
            o.pricing.itemsSubtotal +
            o.pricing.extrasTotal -
            o.pricing.discount -
            o.pricing.membershipBenefitDiscount -
            (o.pricing.rewardDiscount ?? 0)
          ).toFixed(2),
        );
      }
      this.data.orders.unshift(o);
    }
    this.data.orders.forEach((o) => {
      const legacy = o.workflowVersion !== 2;
      migrateOrder(o);
      for (const type of ["PICKUP", "DELIVERY"] as const) {
        const leg =
          type === "PICKUP" ? o.fulfillment!.inbound : o.fulfillment!.outbound;
        const assignment = this.data.assignments.find(
          (a) => a.id === leg.driverAssignmentId,
        );
        if (assignment) leg.driverId = assignment.driverId;
      }
      this.handoffService.initialize(
        this.data,
        o,
        ["SOL-STORE-001", "SOL-HOME-001"].includes(o.id),
        legacy,
      );
    });
  }
  update(work: (next: AppData) => void) {
    const next: AppData = JSON.parse(JSON.stringify(this.data));
    work(next);
    this.data = next;
    this.changed(next);
  }
  customer(session: Session) {
    if (session.role !== "CLIENTE")
      throw new Error("Esta acción corresponde al cliente.");
    const c = this.data.customers.find((v) => v.id === session.userId);
    if (!c) throw new Error("Cuenta no encontrada.");
    return c;
  }
  saveAddress(session: Session, address: Address) {
    const customer = this.customer(session);
    if (!address.title.trim() || address.fullAddress.trim().length < 8)
      throw new Error("Completa el nombre y la dirección.");
    if (address.persistence === "temporary")
      throw new Error("Esta dirección todavía no se puede guardar.");
    serviceAreaService.requireCoverage(address.coordinates);
    this.update((data) => {
      const next = data.customers.find((c) => c.id === customer.id)!;
      if (address.isPrimary)
        next.addresses.forEach((a) => {
          a.isPrimary = false;
        });
      next.addresses = [
        ...next.addresses.filter((a) => a.id !== address.id),
        address,
      ];
    });
  }
  driver(session: Session) {
    if (session.role !== "CHOFER")
      throw new Error("Esta acción corresponde al chofer.");
    const d = this.data.drivers.find((v) => v.id === session.userId);
    if (!d || d.mustChangePassword)
      throw new Error("Actualiza tu contraseña para continuar.");
    return d;
  }
  order(session: Session, id: string) {
    const o = this.data.orders.find((v) => v.id === id);
    if (
      !o ||
      (session.role === "CLIENTE"
        ? o.customerId !== session.userId
        : !this.data.assignments.some(
            (a) => a.orderId === id && a.driverId === session.userId,
          ))
    )
      throw new Error("No tienes acceso a este pedido.");
    return o;
  }
  ordersFor(session: Session) {
    return session.role === "CLIENTE"
      ? this.data.orders.filter((o) => o.customerId === session.userId)
      : this.data.orders.filter((o) =>
          this.data.assignments.some(
            (a) => a.orderId === o.id && a.driverId === session.userId,
          ),
        );
  }
  assignmentsFor(session: Session) {
    this.driver(session);
    return this.data.assignments.filter((a) => a.driverId === session.userId);
  }
  id(d: AppData, prefix: string) {
    d.sequence += 1;
    return `${prefix}-${d.sequence}`;
  }
  notify(
    d: AppData,
    userId: string,
    type: string,
    title: string,
    body: string,
    entityId?: string,
  ) {
    d.notifications.unshift({
      id: this.id(d, "notification"),
      userId,
      type,
      title,
      body,
      entityId,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  event(
    d: AppData,
    o: Order,
    status: OrderStatus,
    actorId: string,
    online: boolean,
    notes?: string,
  ) {
    const timestamp = new Date().toISOString();
    const eventId = this.id(d, "event");
    advanceOperational(o, status);
    this.handoffService.refresh(d, o);
    o.updatedAt = timestamp;
    o.timeline.push({
      id: eventId,
      status,
      actorId,
      timestamp,
      notes,
      syncStatus: online ? "SYNCED" : "PENDING",
    });
    if (!online)
      d.pendingOperations.push({
        id: this.id(d, "pending"),
        orderId: o.id,
        eventId,
        date: timestamp,
      });
    if (online)
      this.notify(
        d,
        o.customerId,
        status,
        "Tu pedido se actualizó",
        o.id,
        o.id,
      );
  }
  createOrder(
    session: Session,
    draft: Draft,
    requestId: string,
    online: boolean,
  ) {
    const customer = this.customer(session);
    const existing = this.data.orders.find(
      (o) =>
        o.payment.transactionReference === requestId &&
        o.customerId === customer.id,
    );
    if (existing) return existing;
    if (!online)
      throw new Error("Conéctate para confirmar tu solicitud y el pago.");
    if (
      this.data.cards.some(
        (c) => c.id === draft.paymentMethod && c.last4 === "0002",
      )
    )
      throw new Error(
        "No pudimos procesar el pago con esta tarjeta de prueba. Cambia el método y reintenta.",
      );
    draft = normalizeFulfillmentDraft(this.data, draft);
    const pricing = validateOrder(this.data, customer, draft);
    let created!: Order;
    this.update((d) => {
      const now = new Date().toISOString();
      const id = this.id(d, "SOL");
      const plan = d.plans.find((p) => p.id === customer.membershipId);
      created = {
        id,
        customerId: customer.id,
        customerName: customer.name,
        status: "PICKUP_PENDING",
        priority: "NORMAL",
        items: draft.items.map((i) => {
          const g = d.catalog.find((c) => c.id === i.catalogId)!;
          const s = d.services.find((c) => c.id === i.serviceId)!;
          return {
            ...i,
            name: g.name,
            serviceName: s.name,
            unitPrice: money(g.price + s.price),
          };
        }),
        extras: d.catalog.filter((c) => draft.extraIds.includes(c.id)),
        pricing,
        promotionId: d.promotions.find((p) => p.code === draft.promoCode)?.id,
        promotionCode: draft.promoCode || undefined,
        membershipBenefits: [...(plan?.benefits ?? [])],
        pickup: draft.pickup!,
        delivery: draft.delivery!,
        rewardRedemptionId: draft.rewardRedemptionId,
        facilityId:
          draft.fulfillmentMode === "STORE_STORE"
            ? draft.facilityId!
            : serviceAreaService.requireCoverage(
                draft.pickup!.address.coordinates,
              ).facilityId,
        assignments: [],
        incidents: [],
        timeline: [],
        payment: {
          id: this.id(d, "payment"),
          orderId: id,
          amount: pricing.total,
          method:
            draft.paymentMethod === "WALLET"
              ? "Billetera"
              : `Tarjeta ${d.cards.find((c) => c.id === draft.paymentMethod)!.last4}`,
          status: "PAID",
          transactionReference: requestId,
          createdAt: now,
        },
        createdAt: now,
        updatedAt: now,
      };
      if (draft.paymentMethod === "WALLET")
        d.walletTransactions.unshift({
          id: this.id(d, "wallet-tx"),
          walletId: customer.walletId,
          amount: pricing.total,
          type: "DEBIT",
          reference: id,
          description: "Pago de lavandería",
          date: now,
        });
      if (created.promotionId)
        d.promotions.find((p) => p.id === created.promotionId)!.usageCount += 1;
      if (created.rewardRedemptionId) {
        const redemption = d.redemptions.find(
          (r) => r.id === created.rewardRedemptionId,
        )!;
        redemption.benefitApplied = true;
        const reward = d.rewards.find((r) => r.id === redemption.rewardId)!;
        created.membershipBenefits.push(`Recompensa: ${reward.name}`);
        if (reward.id === "REW-04")
          created.extras.push({
            id: reward.id,
            name: reward.name,
            category: "EXTRAS",
            description: "Kit incluido por canje aprobado",
            price: 0,
            estimatedHours: 0,
            active: true,
            customerSelectable: true,
          });
      }
      migrateOrder(created, draft.fulfillmentMode ?? "HOME_HOME");
      this.handoffService.initialize(d, created);
      this.event(d, created, "CREATED", customer.id, true);
      this.event(d, created, "PICKUP_PENDING", "mock-dispatch", true);
      d.orders.unshift(created);
      this.notify(
        d,
        customer.id,
        "ORDER_CONFIRMED",
        "¡Solicitud confirmada!",
        `Tu pedido ${id} está programado.`,
        id,
      );
      d.draft = {
        items: [],
        extraIds: [],
        promoCode: "",
        paymentMethod: "WALLET",
      };
    });
    return created;
  }
  /** Simulated dispatch is owned by the mock service, never by the client or driver. */
  dispatch() {
    this.update((d) => {
      for (const o of d.orders.filter(
        (o) =>
          o.fulfillment?.mode !== "STORE_STORE" &&
          ["PICKUP_PENDING", "DELIVERY_SCHEDULED"].includes(
            operationalStage(o),
          ),
      )) {
        const destination = (
          operationalStage(o) === "DELIVERY_SCHEDULED" ? o.delivery : o.pickup
        ).address.coordinates;
        const area = serviceAreaService.findArea(destination);
        const driver =
          area &&
          d.drivers.find(
            (v) =>
              !v.mustChangePassword &&
              !eligibilityReasons(
                {
                  id: v.id,
                  status: v.operationalStatus,
                  coordinates: v.location,
                  updatedAt: v.locationUpdatedAt ?? "",
                  facilityId: v.facilityId,
                  zoneId: v.zoneId ?? area.id,
                  authorizedZoneIds: v.authorizedZoneIds,
                  activeOrders: d.assignments.filter(
                    (a) => a.driverId === v.id && a.status !== "COMPLETED",
                  ).length,
                  maxOrders: v.maxOrders ?? 5,
                },
                {
                  id: o.id,
                  coordinates: destination,
                  facilityId: o.facilityId,
                  zoneId: area.id,
                },
              ).length,
          );
        if (!driver) continue;
        const delivery = operationalStage(o) === "DELIVERY_SCHEDULED";
        const id =
          o.id === "SOL-HOME-001"
            ? `${o.id}-${delivery ? "delivery" : "pickup"}`
            : this.id(d, "assignment");
        const a: DriverAssignment = {
          id,
          orderId: o.id,
          driverId: driver.id,
          type: delivery ? "DELIVERY" : "PICKUP",
          status: "ASSIGNED",
          assignedAt: new Date().toISOString(),
        };
        d.assignments.push(a);
        o.assignments.push(id);
        (delivery ? o.delivery : o.pickup).driverAssignmentId = id;
        const leg = delivery ? o.fulfillment!.outbound : o.fulfillment!.inbound;
        leg.driverAssignmentId = id;
        leg.driverId = driver.id;
        this.event(
          d,
          o,
          delivery ? "DELIVERY_ASSIGNED" : "PICKUP_ASSIGNED",
          "mock-dispatch",
          true,
        );
        this.notify(
          d,
          driver.id,
          "DRIVER_ASSIGNED",
          delivery ? "Nueva entrega" : "Nueva recogida",
          `${o.id} · ${o.customerName}`,
          o.id,
        );
      }
    });
  }
  transition(
    session: Session,
    orderId: string,
    target: OrderStatus,
    online: boolean,
    details: {
      count?: number;
      confirmed?: boolean;
      notes?: string;
      recipient?: string;
      relationship?: string;
      evidence?: string;
    } = {},
  ) {
    const driver = this.driver(session);
    const current = this.order(session, orderId);
    if (["PICKED_UP", "AT_FACILITY", "DELIVERED"].includes(target))
      throw new Error("Verifica y confirma el código de transferencia.");
    if (
      target === "OUT_FOR_DELIVERY" &&
      current.fulfillment?.outbound.milestone !== "RELEASED"
    )
      throw new Error(
        "La sede debe confirmar la salida mediante código antes de iniciar navegación.",
      );
    const a = activeAssignment(this.data, current);
    if (
      !a ||
      a.driverId !== driver.id ||
      DRIVER_NEXT[operationalStage(current)]?.status !== target
    )
      throw new Error(
        "Esta acción no corresponde al estado actual de tu servicio.",
      );
    if (
      ["HEADING_TO_PICKUP", "OUT_FOR_DELIVERY", "HEADING_TO_FACILITY"].includes(
        target,
      ) &&
      !driver.locationAllowed
    )
      throw new Error("Habilita tu ubicación para iniciar navegación.");
    if (["BREAK", "OFFLINE"].includes(driver.operationalStatus))
      throw new Error("Cambia tu estado a Disponible para comenzar.");
    if (
      ["HEADING_TO_PICKUP", "OUT_FOR_DELIVERY"].includes(target) &&
      this.data.assignments.some(
        (v) =>
          v.driverId === driver.id && v.status === "ACTIVE" && v.id !== a.id,
      )
    )
      throw new Error("Completa tu servicio activo antes de iniciar otro.");
    if (
      target === "PICKED_UP" &&
      (!details.confirmed ||
        !Number.isInteger(details.count) ||
        details.count! < 1)
    )
      throw new Error("Confirma la verificación y la cantidad recibida.");
    if (
      target === "DELIVERED" &&
      (!details.confirmed ||
        !details.recipient?.trim() ||
        details.recipient.trim().length < 3 ||
        !/\p{L}/u.test(details.recipient) ||
        !["Cliente", "Familiar", "Recepción", "Otro"].includes(
          details.relationship ?? "",
        ))
    )
      throw new Error("Indica un destinatario válido y confirma la entrega.");
    this.update((d) => {
      const o = d.orders.find((v) => v.id === orderId)!;
      const assignment = d.assignments.find((v) => v.id === a.id)!;
      const drv = d.drivers.find((v) => v.id === driver.id)!;
      const now = new Date().toISOString();
      assignment.status = "ACTIVE";
      assignment.startedAt ??= now;
      drv.operationalStatus = "ON_SERVICE";
      if (["ARRIVED_FOR_PICKUP", "ARRIVED_FOR_DELIVERY"].includes(target))
        assignment.arrivedAt = now;
      if (target === "PICKED_UP") {
        o.pickup.completedAt = now;
        o.pickup.notes = details.notes || o.pickup.notes;
        assignment.actualCount = details.count;
        assignment.expectedCount = o.items.reduce((n, i) => n + i.quantity, 0);
        assignment.evidence = details.evidence;
        if (assignment.actualCount !== assignment.expectedCount)
          o.incidents.push({
            id: this.id(d, "incident"),
            description: `Recogida: esperadas ${assignment.expectedCount}, recibidas ${assignment.actualCount}. ${details.notes ?? ""}`,
            date: now,
          });
      }
      if (target === "DELIVERED") {
        o.delivery.recipient = {
          name: details.recipient!.trim(),
          relationship: details.relationship!,
        };
        o.delivery.completedAt = now;
        o.delivery.driverId = driver.id;
        o.delivery.evidence = details.evidence;
        o.delivery.notes = details.notes ?? "";
      }
      if (target === "AT_FACILITY" || target === "DELIVERED") {
        assignment.status = "COMPLETED";
        assignment.completedAt = now;
        drv.operationalStatus = "AVAILABLE";
      }
      this.event(d, o, target, driver.id, online, details.notes);
      if (target === "DELIVERED" && online) this.earnPoints(d, o);
    });
  }
  earnPoints(d: AppData, o: Order) {
    if (d.pointsLedger.some((p) => p.reference === o.id && p.type === "EARN"))
      return;
    d.pointsLedger.push({
      id: this.id(d, "points"),
      customerId: o.customerId,
      points: Math.floor(o.pricing.total * businessConfig.pointsPerDollar),
      type: "EARN",
      reference: o.id,
      date: new Date().toISOString(),
    });
    this.notify(
      d,
      o.customerId,
      "REWARD_EARNED",
      "Sumaste puntos Fresh",
      `Por tu pedido ${o.id}.`,
      o.id,
    );
  }
  sync(online: boolean) {
    if (!online) return;
    this.update((d) => {
      for (const op of d.pendingOperations) {
        const o = d.orders.find((v) => v.id === op.orderId);
        const event = o?.timeline.find((t) => t.id === op.eventId);
        if (!o || !event) continue;
        event.syncStatus = "SYNCED";
        this.notify(
          d,
          o.customerId,
          event.status,
          "Tu pedido se actualizó",
          o.id,
          o.id,
        );
        if (event.status === "DELIVERED") this.earnPoints(d, o);
      }
      d.pendingOperations = [];
      d.messages.forEach((m) => {
        m.syncStatus = "SYNCED";
      });
    });
  }
  /** Plant automation in demo mode advances one internal step per tick. */
  plantTick() {
    this.update((d) => {
      for (const o of d.orders) {
        if (o.status === "READY" || (o.intakeHold && !o.intakeHold.resolvedAt))
          continue;
        const step = (
          {
            AT_FACILITY: "IN_PROCESS",
            IN_PROCESS: "QUALITY_CONTROL",
            QUALITY_CONTROL: "READY_FOR_DELIVERY",
            READY_FOR_DELIVERY: "DELIVERY_SCHEDULED",
            DELIVERED: "CLOSED",
          } as Partial<Record<OrderStatus, OrderStatus>>
        )[operationalStage(o)];
        if (step && !d.pendingOperations.some((p) => p.orderId === o.id))
          this.event(
            d,
            o,
            step,
            "mock-laundryweb",
            true,
            "Operación de planta simulada",
          );
      }
    });
  }
  walletCredit(session: Session, amount: number, online: boolean) {
    const c = this.customer(session);
    if (!online) throw new Error("Conéctate para recargar.");
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000)
      throw new Error("Ingresa un monto entre $0.01 y $1000.");
    this.update((d) => {
      d.walletTransactions.unshift({
        id: this.id(d, "tx"),
        walletId: c.walletId,
        amount: money(amount),
        type: "CREDIT",
        reference: "Recarga simulada",
        description: "Recarga con tarjeta",
        date: new Date().toISOString(),
      });
    });
  }
  requestReward(session: Session, rewardId: string, online: boolean) {
    const c = this.customer(session);
    if (!online) throw new Error("Conéctate para solicitar el canje.");
    const r = this.data.rewards.find((v) => v.id === rewardId && v.active);
    if (!r) throw new Error("Recompensa no disponible.");
    const delivered = this.data.orders.filter(
      (o) =>
        o.customerId === c.id &&
        ["DELIVERED", "CLOSED"].includes(operationalStage(o)),
    );
    if (
      c.previousPurchases + delivered.length < r.minPurchases ||
      c.previousSpend + delivered.reduce((sum, o) => sum + o.pricing.total, 0) <
        r.minSpend
    )
      throw new Error(
        `Requiere ${r.minPurchases} compras y $${r.minSpend} acumulados.`,
      );
    if (
      pointsBalance(this.data, c.id) - reservedPoints(this.data, c.id) <
      r.pointsCost
    )
      throw new Error("No tienes suficientes puntos disponibles.");
    this.update((d) => {
      d.redemptions.unshift({
        id: this.id(d, "redemption"),
        customerId: c.id,
        rewardId,
        rewardName: r.name,
        points: r.pointsCost,
        status: "PENDING",
        date: new Date().toISOString(),
        benefitApplied: false,
      });
    });
  }
  reviewReward(id: string, approved: boolean) {
    this.update((d) => {
      const r = d.redemptions.find((v) => v.id === id);
      if (!r || r.status !== "PENDING") return;
      r.status = approved ? "APPROVED" : "REJECTED";
      const reward = d.rewards.find((v) => v.id === r.rewardId)!;
      if (approved) {
        r.approvedAt = new Date().toISOString();
        if (
          !d.pointsLedger.some(
            (p) => p.type === "REDEEM" && p.reference === r.id,
          )
        )
          d.pointsLedger.push({
            id: this.id(d, "points"),
            customerId: r.customerId,
            points: -r.points,
            type: "REDEEM",
            reference: r.id,
            date: new Date().toISOString(),
          });
        if (reward.walletCredit) {
          d.walletTransactions.push({
            id: this.id(d, "tx"),
            walletId: d.customers.find((c) => c.id === r.customerId)!.walletId,
            amount: reward.walletCredit,
            type: "CREDIT",
            reference: r.id,
            description: reward.name,
            date: new Date().toISOString(),
          });
          r.benefitApplied = true;
        } else r.benefitApplied = false;
      } else {
        r.reason = "Revisión administrativa simulada: beneficio no disponible.";
        if (
          d.pointsLedger.some(
            (p) => p.type === "REDEEM" && p.reference === r.id,
          ) &&
          !d.pointsLedger.some((p) => p.reference === `refund-${r.id}`)
        )
          d.pointsLedger.push({
            id: this.id(d, "points"),
            customerId: r.customerId,
            points: r.points,
            type: "ADJUSTMENT",
            reference: `refund-${r.id}`,
            date: new Date().toISOString(),
          });
      }
      this.notify(
        d,
        r.customerId,
        approved ? "REWARD_APPROVED" : "REWARD_REJECTED",
        approved ? "Tu canje fue aprobado" : "Tu canje fue rechazado",
        r.rewardName,
      );
    });
  }
  sendMessage(
    session: Session,
    orderId: string,
    text: string,
    online: boolean,
  ) {
    const o = this.order(session, orderId);
    const assignment = activeAssignment(this.data, o);
    if (
      !assignment ||
      (session.role === "CHOFER" && assignment.driverId !== session.userId)
    )
      throw new Error(
        "El chat se habilita para el cliente y el chofer de la etapa actual.",
      );
    if (!text.trim()) return;
    if (text.length > 2000) throw new Error("El mensaje es demasiado largo.");
    this.update((d) => {
      d.messages.push({
        id: this.id(d, "message"),
        orderId,
        customerId: o.customerId,
        driverId: assignment.driverId,
        senderId: session.userId,
        senderRole: session.role,
        text: text.trim(),
        date: new Date().toISOString(),
        syncStatus: online ? "SYNCED" : "PENDING",
      });
    });
  }
  driverStatus(
    session: Session,
    status: AppData["drivers"][number]["operationalStatus"],
  ) {
    this.driver(session);
    const hasActive = this.data.assignments.some(
      (a) => a.driverId === session.userId && a.status === "ACTIVE",
    );
    if (hasActive && status !== "ON_SERVICE")
      throw new Error(
        "Completa el servicio activo antes de cambiar tu estado.",
      );
    if (!hasActive && status === "ON_SERVICE")
      throw new Error("En servicio se activa cuando inicias una tarea.");
    this.update((d) => {
      d.drivers.find((v) => v.id === session.userId)!.operationalStatus =
        status;
    });
  }
  routeFor(session: Session) {
    const drv = this.driver(session);
    const assignments = this.assignmentsFor(session)
      .filter((a) => a.status !== "COMPLETED")
      .sort(
        (a, b) =>
          Number(b.status === "ACTIVE") - Number(a.status === "ACTIVE") ||
          Number(
            this.data.orders.find((o) => o.id === b.orderId)?.priority ===
              "URGENT",
          ) -
            Number(
              this.data.orders.find((o) => o.id === a.orderId)?.priority ===
                "URGENT",
            ),
      );
    let position = drv.location;
    let distance = 0;
    for (const a of assignments) {
      const o = this.data.orders.find((v) => v.id === a.orderId)!;
      const target = [
        "PICKED_UP",
        "HEADING_TO_FACILITY",
        "ARRIVED_AT_FACILITY",
      ].includes(operationalStage(o))
        ? this.data.facilities.find((f) => f.id === o.facilityId)!.coordinates
        : (a.type === "PICKUP" ? o.pickup : o.delivery).address.coordinates;
      distance += routeDistance(position, target);
      position = target;
    }
    return {
      driverId: drv.id,
      date: today(),
      assignments,
      estimatedDistance: money(distance),
      estimatedDuration: Math.ceil(distance * 4 + assignments.length * 8),
      currentStopIndex: 0,
    };
  }
}
