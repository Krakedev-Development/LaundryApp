import web from "./laundryWebSeed.json";
import {
  Address,
  AppData,
  CatalogItem,
  Customer,
  DriverAssignment,
  Order,
  OrderStatus,
  Promotion,
} from "../domain/models";
import { addDays, today } from "../domain/rules";

export const emptyDraft = () => ({
  items: [],
  extraIds: [],
  promoCode: "",
  paymentMethod: "WALLET",
});
export function makeSeed(): AppData {
  const now = new Date().toISOString();
  const address = (
    a: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      reference?: string;
      coordinates: Address["coordinates"];
    },
    id: string,
    index = 0,
  ): Address => ({
    id,
    title: index === 0 ? "Casa" : "Trabajo",
    fullAddress: [a.street, a.number, a.complement, a.neighborhood, a.city]
      .filter(Boolean)
      .join(", "),
    reference: a.reference ?? "",
    coordinates: a.coordinates,
    isPrimary: index === 0,
    persistence: "demo",
  });
  const customers: Customer[] = web.INITIAL_CUSTOMERS.map((c) => ({
    id: c.id,
    name: c.fullName,
    email: c.email,
    phone: c.phone,
    kycStatus: c.kycStatus as Customer["kycStatus"],
    kycRejectionReason: c.kycRejectionReason,
    addresses: c.addresses.map((a, i) => address(a, `${c.id}-addr-${i}`, i)),
    membershipId: c.membership === "PREMIUM_FRESH" ? "premium" : "standard",
    membershipRenewal: addDays(today(), 30),
    walletId: `wallet-${c.id}`,
    rewardAccountId: `points-${c.id}`,
    billingData: {
      name: c.fullName,
      taxId: "",
      email: c.email,
      phone: c.phone,
      address: c.addresses[0]?.street ?? "",
    },
    notificationPreferences: true,
    previousPurchases: Math.max(
      0,
      c.completedOrders -
        web.INITIAL_ORDERS.filter(
          (o) =>
            o.customerId === c.id && ["DELIVERED", "CLOSED"].includes(o.status),
        ).length,
    ),
    previousSpend: c.completedOrders * 25,
  }));
  customers.push({
    id: "CUST-DEMO",
    name: "Sofía Fresh",
    email: "nuevo@laundryfresh.com",
    phone: "+593 999 888 777",
    kycStatus: "APPROVED",
    addresses: [address(web.INITIAL_CUSTOMERS[0].addresses[0], "demo-home")],
    membershipId: "basic",
    membershipRenewal: addDays(today(), 30),
    walletId: "wallet-CUST-DEMO",
    rewardAccountId: "points-CUST-DEMO",
    billingData: {
      name: "Sofía Fresh",
      email: "nuevo@laundryfresh.com",
      phone: "",
      taxId: "",
      address: "",
    },
    notificationPreferences: true,
    previousPurchases: 0,
    previousSpend: 0,
  });
  const drivers: AppData["drivers"] = web.INITIAL_DRIVERS.map((d) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    vehicle:
      d.vehicleType === "VAN"
        ? "Furgoneta Laundry"
        : d.vehicleType === "MOTO"
          ? "Motocicleta Laundry"
          : "Camioneta Laundry",
    plate: d.vehiclePlate,
    facilityId: d.facilityId,
    zoneName: d.zoneName,
    location: { lat: d.location.lat, lng: d.location.lng },
    locationUpdatedAt: now,
    locationSimulated: true,
    zoneId: d.zoneId,
    authorizedZoneIds: d.authorizedZoneIds,
    maxOrders: d.maxOrders,
    operationalStatus:
      d.status === "AVAILABLE"
        ? "AVAILABLE"
        : d.status === "OFFLINE"
          ? "OFFLINE"
          : d.status === "BREAK"
            ? "BREAK"
            : "ON_SERVICE",
    mustChangePassword: d.id === "DRV-101",
    locationAllowed: false,
  }));
  const assignments: DriverAssignment[] = [];
  const orders: Order[] = web.INITIAL_ORDERS.map((o) => {
    const pickupId = `${o.id}-pickup`;
    const deliveryId = `${o.id}-delivery`;
    const lateStage = [
      "READY_FOR_DELIVERY",
      "DELIVERY_SCHEDULED",
      "DELIVERY_ASSIGNED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CLOSED",
    ].includes(o.status);
    if (o.pickup.driverId)
      assignments.push({
        id: pickupId,
        orderId: o.id,
        driverId: o.pickup.driverId,
        type: "PICKUP",
        status:
          o.pickup.completedAt ||
          lateStage ||
          ["AT_FACILITY", "IN_PROCESS", "QUALITY_CONTROL"].includes(o.status)
            ? "COMPLETED"
            : o.status === "PICKUP_ASSIGNED"
              ? "ASSIGNED"
              : "ACTIVE",
        assignedAt: now,
        completedAt: o.pickup.completedAt ? now : undefined,
      });
    if (o.delivery.driverId)
      assignments.push({
        id: deliveryId,
        orderId: o.id,
        driverId: o.delivery.driverId,
        type: "DELIVERY",
        status: ["DELIVERED", "CLOSED"].includes(o.status)
          ? "COMPLETED"
          : o.status === "DELIVERY_ASSIGNED"
            ? "ASSIGNED"
            : "ACTIVE",
        assignedAt: now,
        completedAt: ["DELIVERED", "CLOSED"].includes(o.status)
          ? now
          : undefined,
      });
    return {
      id: o.id,
      customerId: o.customerId,
      customerName:
        customers.find((c) => c.id === o.customerId)?.name ?? o.customerName,
      status: o.status as OrderStatus,
      priority: o.priority === "URGENT" ? "URGENT" : "NORMAL",
      items: o.items.map((i) => ({
        id: i.id,
        catalogId:
          web.INITIAL_CATALOG.find((c) => c.name === i.name)?.id ?? "CAT-01",
        serviceId: "care",
        name: i.name,
        serviceName: o.serviceType,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        notes: ("notes" in i ? i.notes : "") ?? "",
      })),
      extras: o.extras.map((e) => ({
        ...e,
        category: "EXTRAS",
        description: "",
        estimatedHours: 0,
        active: true,
        customerSelectable: true,
      })),
      pricing: {
        itemsSubtotal: o.pricing.subtotal,
        extrasTotal: o.pricing.extrasTotal,
        discount: o.pricing.discount,
        membershipBenefitDiscount: 0,
        deliveryFee: o.pricing.deliveryFee,
        total: o.pricing.total,
      },
      promotionCode: o.pricing.promoCodeApplied,
      promotionId: web.INITIAL_PROMOTIONS.find(
        (p) => p.code === o.pricing.promoCodeApplied,
      )?.id,
      membershipBenefits: [],
      pickup: {
        address: address(o.customerAddress, `${o.customerId}-addr-0`),
        date: today(),
        timeSlot: o.pickup.timeSlot,
        notes: o.pickup.notes ?? "",
        driverAssignmentId: o.pickup.driverId ? pickupId : undefined,
        completedAt: o.pickup.completedAt ? now : undefined,
      },
      delivery: {
        address: address(o.deliveryAddress, `${o.customerId}-delivery`),
        date: addDays(today(), 2),
        timeSlot: o.delivery.timeSlot,
        notes: o.delivery.notes ?? "",
        driverAssignmentId: o.delivery.driverId ? deliveryId : undefined,
        recipient: ["DELIVERED", "CLOSED"].includes(o.status)
          ? { name: o.delivery.recipientName, relationship: "Cliente" }
          : undefined,
        completedAt: ["DELIVERED", "CLOSED"].includes(o.status)
          ? now
          : undefined,
      },
      facilityId: o.facilityId,
      assignments: [],
      timeline: o.timeline.map((t, i) => ({
        id: `${o.id}-seed-${i}`,
        status: t.status as OrderStatus,
        timestamp: now,
        actorId: "laundryweb",
        notes: "notes" in t ? t.notes : undefined,
        syncStatus: "SYNCED",
      })),
      incidents: [],
      payment: {
        id: `payment-${o.id}`,
        orderId: o.id,
        amount: o.pricing.total,
        status: o.pricing.paymentStatus as "PAID",
        method: o.pricing.paymentMethod,
        transactionReference: `web-${o.id}`,
        createdAt: now,
      },
      createdAt: o.createdAt.replace(" ", "T") + "-05:00",
      updatedAt: now,
    };
  });
  orders.forEach((o) => {
    o.assignments = assignments
      .filter((a) => a.orderId === o.id)
      .map((a) => a.id);
  });
  const catalog: CatalogItem[] = web.INITIAL_CATALOG.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    category: c.category as CatalogItem["category"],
    price: c.price,
    estimatedHours: c.estimatedHours,
    active: c.status === "ACTIVE",
    customerSelectable: c.id !== "CAT-13",
  }));
  const promotions: Promotion[] = web.INITIAL_PROMOTIONS.map((p) => ({
    ...p,
    discountType: p.discountType as Promotion["discountType"],
    perCustomerLimit: p.id === "PROM-01" ? 1 : 3,
    firstOrderOnly: p.id === "PROM-01",
  }));
  return {
    version: 1,
    handoffs: [], handoffAudits: [],
    customers,
    drivers,
    orders,
    assignments,
    catalog,
    promotions,
    services: [
      {
        id: "care",
        name: "Cuidado incluido",
        price: 0,
        estimatedHours: 0,
        active: true,
        customerSelectable: true,
      },
      {
        id: "press",
        name: "Acabado con planchado",
        price: 1.5,
        estimatedHours: 0,
        active: true,
        customerSelectable: true,
      },
      {
        id: "internal",
        name: "Reproceso",
        price: 0,
        estimatedHours: 24,
        active: true,
        customerSelectable: false,
      },
    ],
    facilities: web.INITIAL_FACILITIES.map((f) => ({
      id: f.id,
      name: f.name,
      address: f.address,
      coordinates: f.coordinates,
    })),
    plans: [
      {
        id: "basic",
        name: "Básico",
        priceMonthly: 9.99,
        weeklyPickups: 1,
        discountPercent: 5,
        benefits: ["1 recogida semanal", "5% de descuento en prendas"],
      },
      {
        id: "standard",
        name: "Estándar",
        priceMonthly: 19.99,
        weeklyPickups: 2,
        discountPercent: 12,
        benefits: ["2 recogidas semanales", "12% de descuento en prendas"],
      },
      {
        id: "premium",
        name: "Premium",
        priceMonthly: 34.99,
        weeklyPickups: 4,
        discountPercent: 20,
        benefits: [
          "4 recogidas semanales",
          "20% de descuento en prendas",
          "Atención prioritaria",
        ],
      },
    ],
    wallets: customers.map((c) => ({ id: c.walletId, customerId: c.id })),
    walletTransactions: customers.flatMap((c) => [
      {
        id: `opening-${c.id}`,
        walletId: c.walletId,
        amount:
          (web.INITIAL_CUSTOMERS.find((w) => w.id === c.id)?.walletBalance ??
            30) + 20,
        type: "ADJUSTMENT" as const,
        reference: "Saldo inicial LaundryWeb",
        description: "Saldo inicial de demostración",
        date: now,
      },
      {
        id: `debit-${c.id}`,
        walletId: c.walletId,
        amount: 20,
        type: "DEBIT" as const,
        reference: "Historial LaundryWeb",
        description: "Servicio anterior",
        date: now,
      },
    ]),
    pointsLedger: [
      ...web.INITIAL_POINTS_LEDGER.map((p) => ({
        id: p.id,
        customerId: p.customerId,
        points: p.points,
        type: (p.type === "PURCHASE"
          ? "EARN"
          : p.type === "REDEMPTION"
            ? "REDEEM"
            : "ADJUSTMENT") as AppData["pointsLedger"][number]["type"],
        reference:
          web.INITIAL_REDEMPTIONS.find(
            (r) =>
              r.customerId === p.customerId &&
              r.pointsSpent === -p.points &&
              r.date === p.date,
          )?.id ?? p.reason,
        date: p.date.replace(" ", "T") + "-05:00",
      })),
      ...customers.map((c) => ({
        id: `opening-points-${c.id}`,
        customerId: c.id,
        points:
          (web.INITIAL_CUSTOMERS.find((w) => w.id === c.id)?.points ?? 0) -
          web.INITIAL_POINTS_LEDGER.filter((p) => p.customerId === c.id).reduce(
            (sum, p) => sum + p.points,
            0,
          ),
        type: "ADJUSTMENT" as const,
        reference: "Conciliación de saldo inicial LaundryWeb",
        date: now,
      })),
    ],
    rewards: web.INITIAL_REWARDS.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      pointsCost: r.pointsCost,
      minPurchases: r.minPurchases,
      minSpend: r.minSpend,
      validityDays: r.validityDays,
      active: r.status === "ACTIVE",
      walletCredit: r.id === "REW-03" ? 20 : undefined,
    })),
    redemptions: web.INITIAL_REDEMPTIONS.map((r) => ({
      id: r.id,
      customerId: r.customerId,
      rewardId: r.rewardId,
      rewardName: r.rewardName,
      points: r.pointsSpent,
      status: (r.status === "DELIVERED"
        ? "APPROVED"
        : r.status) as AppData["redemptions"][number]["status"],
      date: r.date.replace(" ", "T") + "-05:00",
      benefitApplied:
        r.status === "DELIVERED" ||
        (r.rewardId === "REW-03" && r.status === "APPROVED"),
    })),
    cards: customers.map((c) => ({
      id: `card-${c.id}`,
      customerId: c.id,
      brand: "Visa",
      last4: "4242",
      expiry: "12/28",
      primary: true,
    })),
    messages: [],
    notifications: customers.map((c) => ({
      id: `welcome-${c.id}`,
      userId: c.id,
      type: "PROMOTION_AVAILABLE",
      title: "Bienvenido a Clean & Fresh",
      body: "Tu lavandería, más fácil. Explora tus beneficios.",
      read: false,
      createdAt: now,
    })),
    pendingOperations: [],
    draft: emptyDraft(),
    sequence: 6000,
  };
}
