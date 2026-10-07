import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import demo from "../domain/demo.json";
import { prepareMobileDemo } from "../data/prepareMobileDemo";
import type { Actor } from "../services/domain/fulfillment";
import { migrateOrder } from "../services/domain/fulfillment";
import {
  BusinessService,
  ensureBusinessState,
  recordBusinessCustody,
  type BusinessState,
} from "../services/domain/BusinessService";
import { HandoffService } from "../services/domain/HandoffService";
import { prepareBusinessDemoData } from "../services/domain/BusinessDemoData";
import type {
  Customer,
  Driver,
  Facility,
  Order,
  CatalogItem,
  Promotion,
  Reward,
} from "../domain/models";
import {
  MOCK_CLIENT,
  MOCK_DRIVER,
  MOCK_ORDERS,
  MOCK_PAYMENT_METHODS,
} from "../data/mockData";
import { isMobileUser, useAuthStore } from "./useAuthStore";
import { MOCK_USERS } from "../data/mockUsers";
import { WASH_PRICES } from "./useOrderStore";
import { SERVICE_AREAS } from "../services/geo/demo";

export interface AppBusinessState extends BusinessState {
  facilities: Facility[];
  catalog: CatalogItem[];
  promotions: Promotion[];
  rewards: Reward[];
  redemptions: {
    id: string;
    customerId: string;
    rewardId: string;
    pointsSpent: number;
    at: string;
    status?: "PENDING" | "APPROVED" | "DELIVERED" | "REJECTED";
    reviewedBy?: string;
    reviewedAt?: string;
    reason?: string;
  }[];
  paymentMethods: Record<string, import("../data/mockData").PaymentMethod[]>;
  accounts: {
    email: string;
    password: string;
    user: import("../types").User;
  }[];
}
const KEY = "laundry_app_business_v3";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
let writing = Promise.resolve();
let durableState: AppBusinessState | null = null;
let initializing: Promise<void> | undefined;
export const useBusinessStore = create<{
  state: AppBusinessState | null;
  error: string | null;
  initialize: () => Promise<void>;
}>((set) => ({
  state: null,
  error: null,
  initialize: () =>
    (initializing ??= (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        const state = saved
          ? (clone(ensureBusinessState(JSON.parse(saved))) as AppBusinessState)
          : initialState();
        state.paymentMethods ??= {
          [MOCK_CLIENT.id]: clone(MOCK_PAYMENT_METHODS),
        };
        if (!Array.isArray(state.orders) || !Array.isArray(state.customers))
          throw Error("Los datos locales no tienen un formato válido.");
        prepareBusinessDemoData(
          state,
          state.facilities,
          handoffService,
          state.catalog as any,
        );
        prepareMobileDemo(state);
        await AsyncStorage.setItem(KEY, JSON.stringify(state));
        durableState = state;
        set({ state, error: null });
      } catch (e) {
        set({
          error:
            e instanceof Error
              ? e.message
              : "No se pudo cargar la información local.",
        });
      }
    })()),
}));
function read() {
  const state = useBusinessStore.getState().state;
  if (!state) throw Error("Espera a que se carguen los datos locales.");
  return state;
}
function transaction<T>(work: (s: AppBusinessState) => T): T {
  const original = read();
  const next = clone(original);
  const result = work(next);
  useBusinessStore.setState({ state: next, error: null });
  writing = writing
    .then(async () => {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      durableState = next;
    })
    .catch((e) => {
      useBusinessStore.setState({
        state: durableState ?? original,
        error:
          "No se pudo guardar el cambio. Reintenta cuando haya almacenamiento disponible.",
      });
      throw e;
    });
  return result;
}
export async function flushBusiness() {
  try {
    await writing;
  } catch (e) {
    writing = Promise.resolve();
    throw Error(useBusinessStore.getState().error ?? "No se pudo guardar.");
  }
}
export function currentActor(): Actor & { role: "CLIENT" | "DRIVER" } {
  const u = useAuthStore.getState().user;
  if (!u) throw Error("Inicia sesión para continuar.");
  if (!isMobileUser(u))
    throw Error("Los perfiles administrativos pertenecen a LaundryWeb.");
  return {
    id: u.role === "client" ? (u.customerId ?? "c1") : (u.driverId ?? "d1"),
    name: u.name,
    role: u.role === "client" ? "CLIENT" : "DRIVER",
    facilityId: u.facilityId,
  };
}
const random = () =>
  Array.from(Crypto.getRandomBytes(20), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export const handoffService = new HandoffService({
  read,
  transaction,
  random,
  actor: (id) => {
    const actor = currentActor();
    if (id !== actor.id)
      throw Error("Solo puede verificar el operador autenticado.");
    return actor;
  },
  paid: (o) => (o as Order).pricing.paymentStatus === "PAID",
  intakeAllowed: (o) => (o as Order).pricing.pricingModel === "PER_WEIGHT",
  declaredCount: (o) => (o as Order).items.reduce((n, i) => n + i.quantity, 0),
  blocked: (o) =>
    read().incidents.some((i) => i.orderId === o.id && i.status !== "RESOLVED"),
  confirmed: (raw, rawOrder, h, actor) => {
    const s = raw as AppBusinessState,
      o = rawOrder as Order;
    recordBusinessCustody(s, o, h);
    o.timeline.push({
      id: Crypto.randomUUID(),
      label: "Transferencia confirmada: " + h.type,
      status: o.status,
      timestamp: h.usedAt!,
      userName: actor.name,
      userRole: actor.role,
    });
    if (
      o.intakeHold &&
      !o.intakeHold.resolvedAt &&
      !s.incidents.some((i) => i.id === "INC-" + h.id)
    )
      s.incidents.push({
        id: "INC-" + h.id,
        orderId: o.id,
        customerId: o.customerId,
        customerName: o.customerName,
        type: "OTRO",
        severity: "ALTA",
        status: "OPEN",
        description: o.intakeHold.description,
        evidences: [],
        assignedTo: "Operaciones",
        reportedBy: actor.name,
        reportedRole: actor.role,
        createdAt: h.usedAt!,
        internalNotes: [],
      });
    if (["DRIVER_TO_FACILITY", "DRIVER_TO_CUSTOMER"].includes(h.type)) {
      const leg = h.type === "DRIVER_TO_FACILITY" ? "inbound" : "outbound";
      const d = s.drivers.find((d) => d.id === o.fulfillment![leg].driverId);
      if (d) {
        d.activeOrders = Math.max(0, d.activeOrders - 1);
        d.status = d.activeOrders ? "ON_SERVICE" : "AVAILABLE";
      }
    }
    if (
      o.status === "COMPLETED" &&
      !s.pointsLedger.some((p) => p.orderId === o.id && p.type === "PURCHASE")
    ) {
      const points = Math.floor(o.pricing.total * 10);
      s.pointsLedger.push({
        id: "PTS-" + h.id,
        orderId: o.id,
        customerId: o.customerId,
        type: "PURCHASE",
        points,
        reason: "Servicio completado",
        date: h.usedAt!,
      });
      const c = s.customers.find((c) => c.id === o.customerId);
      if (c) {
        c.points += points;
        c.completedOrders++;
      }
    }
  },
  resolved: (raw, o, _actor, reason) => {
    const incident = (raw as AppBusinessState).incidents.find(
      (i) => i.id === "INC-" + o.intakeHold!.handoffId,
    );
    if (incident) {
      incident.status = "RESOLVED";
      incident.resolutionNotes = reason;
      incident.resolvedAt = o.intakeHold!.resolvedAt;
    }
  },
});
// Demo rectangles are explicit illustrative coverage. No check relies on address text alone.
export function covers(
  address: import("../domain/models").Address,
  facilityId: string,
) {
  const { lat, lng } = address.coordinates;
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  )
    return false;
  if (facilityId === "FAC-LEGACY")
    return lat >= -0.26 && lat <= -0.2 && lng >= -78.55 && lng <= -78.49;
  const bounds: Record<string, [number, number]> = {
    "FAC-01": [-2.15, -2.132],
    "FAC-02": [-2.132, -2.114],
    "FAC-03": [-2.114, -2.085],
  };
  const range = bounds[facilityId];
  return (
    !!range &&
    lat >= range[0] &&
    lat <= range[1] &&
    lng >= -79.884 &&
    lng <= -79.852
  );
}
export const businessService = new BusinessService({
  read,
  transaction,
  actor: currentActor,
  facilities: () => read().facilities,
  catalog: () => read().catalog as any,
  promotions: () => read().promotions,
  zoneFor: (address, facility) =>
    facility === "FAC-LEGACY"
      ? read().drivers.find((d) => d.facilityId === facility)?.zoneId
      : SERVICE_AREAS.find((a) => a.facilityId === facility)?.id,
  covers,
  handoffs: handoffService,
  randomId: Crypto.randomUUID,
});
function initialState(): AppBusinessState {
  const s = clone({
    ...demo.workflow,
    facilities: demo.facilities,
    catalog: demo.catalog,
    promotions: demo.promotions,
    rewards: demo.rewards,
    redemptions: [],
    accounts: [],
    paymentMethods: { [MOCK_CLIENT.id]: MOCK_PAYMENT_METHODS },
  }) as unknown as AppBusinessState;
  const address = {
    street: MOCK_CLIENT.address,
    number: "",
    city: "Quito",
    neighborhood: "Centro",
    coordinates: {
      lat: MOCK_CLIENT.coordinates.latitude,
      lng: MOCK_CLIENT.coordinates.longitude,
    },
  };
  const customer: Customer = {
    ...clone(s.customers[0]),
    id: MOCK_CLIENT.id,
    fullName: MOCK_CLIENT.name,
    email: "cliente@test.com",
    phone: MOCK_CLIENT.phone,
    addresses: [address],
    points: MOCK_CLIENT.points,
    walletBalance: MOCK_CLIENT.balance,
  };
  s.customers.push(customer);
  const facility: Facility = {
    ...clone(s.facilities[0]),
    id: "FAC-LEGACY",
    name: "Sede Centro Quito",
    address: "Av. Amazonas, Quito",
    city: "Quito",
    coordinates: { lat: -0.2295, lng: -78.5243 },
    acceptsCustomerDropoff: true,
    allowsCustomerPickup: true,
  };
  s.facilities.push(facility);
  const driver: Driver = {
    ...clone(s.drivers[0]),
    id: MOCK_DRIVER.id,
    name: MOCK_DRIVER.name,
    email: "chofer@test.com",
    phone: MOCK_DRIVER.phone,
    vehiclePlate: MOCK_DRIVER.plate,
    facilityId: facility.id,
    facilityName: facility.name,
    status: "AVAILABLE",
    activeOrders: 0,
    location: {
      lat: MOCK_DRIVER.coordinates.latitude,
      lng: MOCK_DRIVER.coordinates.longitude,
      address: facility.address,
      lastUpdated: new Date().toISOString(),
    },
  };
  s.drivers.push(driver);
  for (const [id, price] of Object.entries(WASH_PRICES))
    s.catalog.push({
      id: "APP-" + id,
      name: id,
      category: "PRENDAS",
      type: id,
      description: "Servicio por prenda del catálogo existente",
      price,
      pricingModel: "FIXED",
      customerSelectable: id !== "reproceso",
      compatibleWithWeight: ["lp", "ls"].includes(id),
      estimatedHours: 24,
      minHours: 24,
      maxHours: 48,
      status: "ACTIVE",
    } as any);
  for (const [name, price] of Object.entries({
    "Doblado especial": 2,
    Perfumado: 1.5,
    "Empaque premium": 3,
    "Tratamiento manchas": 2.5,
    "Suavizante premium": 1,
  }))
    s.catalog.push({
      id: "APP-EXTRA-" + name,
      name,
      category: "EXTRAS",
      type: "EXTRA",
      description: name,
      price,
      estimatedHours: 0,
      minHours: 0,
      maxHours: 0,
      status: "ACTIVE",
    });
  s.promotions.push({
    id: "APP-BIENVENIDA",
    name: "Bienvenida",
    code: "BIENVENIDA",
    description: "Promoción de demostración del flujo anterior",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 0,
    usageLimit: 999,
    usageCount: 0,
    applicableServices: ["Todos los servicios"],
    startDate: "2020-01-01",
    endDate: "2099-12-31",
    status: "ACTIVE",
  });
  for (const legacy of MOCK_ORDERS) {
    if (s.orders.some((o) => o.id === legacy.id)) continue;
    const o: Order = {
      ...clone(s.orders[0]),
      id: legacy.id,
      trackingNumber: legacy.id,
      customerId: legacy.client.id,
      customerName: legacy.client.name,
      customerEmail: customer.email,
      customerPhone: legacy.client.phone,
      facilityId: facility.id,
      facilityName: facility.name,
      customerAddress: { ...address, street: legacy.address },
      deliveryAddress: { ...address, street: legacy.address },
      status:
        legacy.status === "delivered"
          ? "CLOSED"
          : legacy.status === "in_process"
            ? "IN_PROCESS"
            : legacy.status === "delivering"
              ? "OUT_FOR_DELIVERY"
              : legacy.status === "picked_up"
                ? "HEADING_TO_FACILITY"
                : "PICKUP_ASSIGNED",
      items: [
        {
          id: "LEGACY",
          name: legacy.serviceType,
          quantity: legacy.garmentCount,
          unitPrice: legacy.price / legacy.garmentCount,
          category: "PRENDAS",
        },
      ],
      itemCount: legacy.garmentCount,
      serviceType: legacy.serviceType,
      pricing: {
        subtotal: legacy.price,
        discount: 0,
        extrasTotal: 0,
        deliveryFee: 0,
        total: legacy.price,
        currency: "USD",
        paymentMethod: "TARJETA",
        paymentStatus: "PAID",
        amountKnown: true,
        amountPaid: legacy.price,
        amountDue: 0,
        pricingModel: "FIXED",
        pricingStatus: "FINAL",
      },
      pickup: {
        date: legacy.pickupTime,
        timeSlot: legacy.pickupTime,
        driverId: MOCK_DRIVER.id,
      },
      delivery: {
        targetDate: legacy.deliveryTime,
        timeSlot: legacy.deliveryTime,
        recipientName: legacy.client.name,
        recipientPhone: legacy.client.phone,
        driverId: MOCK_DRIVER.id,
      },
      timeline: [],
      fulfillment: undefined,
      workflowVersion: undefined,
      businessVersion: undefined,
      inspectionCompleted: true,
      intakeHold: undefined,
      quarantineReason: undefined,
      incidentsCount: 0,
    };
    migrateOrder(o);
    for (const [name, leg] of Object.entries(o.fulfillment!) as any) {
      if (name !== "mode" && leg.driverId)
        leg.driverAssignmentId = `${o.id}-${name}`;
    }
    s.orders.push(o);
    handoffService.initialize(s, o, false, true);
  }
  s.drivers.forEach((d) => {
    d.location.simulated = true;
    d.location.lastUpdated = new Date().toISOString();
  });
  s.businessPolicy.minimumOrderAmount = 5;
  return s;
}
export function redeemReward(id: string) {
  transaction((s) => {
    const actor = currentActor();
    if (actor.role !== "CLIENT") throw Error("Solo clientes pueden canjear.");
    const customer = s.customers.find((c) => c.id === actor.id)!,
      reward = s.rewards.find((r) => r.id === id);
    if (
      !reward ||
      reward.status !== "ACTIVE" ||
      customer.points - reservedRewardPoints(s, actor.id) < reward.pointsCost ||
      customer.completedOrders < reward.minPurchases ||
      s.orders
        .filter((o) => o.customerId === customer.id && o.status === "COMPLETED")
        .reduce((n, o) => n + o.pricing.total, 0) < reward.minSpend
    )
      throw Error("Aún no cumples los requisitos del canje.");
    const redemptionId = Crypto.randomUUID();
    s.redemptions.push({
      id: redemptionId,
      customerId: customer.id,
      rewardId: id,
      status: "PENDING",
      pointsSpent: reward.pointsCost,
      at: new Date().toISOString(),
    });
  });
}
export function reservedRewardPoints(s: AppBusinessState, customerId: string) {
  return s.redemptions
    .filter((r) => r.customerId === customerId && r.status === "PENDING")
    .reduce((total, r) => total + r.pointsSpent, 0);
}
export function rechargeWallet(amount: number) {
  transaction((s) => {
    const actor = currentActor();
    if (actor.role !== "CLIENT" || !Number.isFinite(amount) || amount <= 0)
      throw Error("Importe inválido.");
    s.customers.find((c) => c.id === actor.id)!.walletBalance += amount;
    s.businessAudits.push({
      id: Crypto.randomUUID(),
      actorId: actor.id,
      actorRole: actor.role,
      action: "Recarga simulada de billetera",
      reason: String(amount),
      at: new Date().toISOString(),
    });
  });
}
export function publishDriverLocation(
  driverId: string,
  position: { lat: number; lng: number },
) {
  transaction((s) => {
    const a = currentActor();
    if (
      a.role !== "DRIVER" ||
      a.id !== driverId ||
      !Number.isFinite(position.lat) ||
      !Number.isFinite(position.lng) ||
      Math.abs(position.lat) > 90 ||
      Math.abs(position.lng) > 180
    )
      throw Error("No puedes publicar esta ubicación.");
    const d = s.drivers.find((d) => d.id === driverId);
    if (!d) throw Error("Chofer no encontrado.");
    d.location = {
      ...d.location,
      ...position,
      lastUpdated: new Date().toISOString(),
      simulated: true,
    };
  });
}
export function registerLocalClient(input: {
  name: string;
  email: string;
  password: string;
  documentUri: string;
  selfieUri: string;
}) {
  return transaction((s) => {
    const normalized = input.email.trim().toLowerCase();
    if (
      !input.name.trim() ||
      !/^\S+@\S+\.\S+$/.test(normalized) ||
      input.password.length < 6 ||
      !input.documentUri ||
      !input.selfieUri ||
      s.accounts.some((a) => a.email === normalized) ||
      s.customers.some((c) => c.email.toLowerCase() === normalized)
    )
      throw Error("Revisa los datos o utiliza un correo diferente.");
    const id = "CLIENT-" + Crypto.randomUUID();
    const user: import("../types").User = {
      id,
      name: input.name.trim(),
      email: normalized,
      role: "client",
      status: "pending",
      customerId: id,
      cedula_photo: input.documentUri,
      selfie_photo: input.selfieUri,
    };
    s.accounts.push({ email: normalized, password: input.password, user });
    s.customers.push({
      ...clone(s.customers[0]),
      id,
      fullName: user.name,
      email: normalized,
      phone: "",
      documentNumber: "Pendiente de revisión",
      kycStatus: "PENDING",
      kycDocumentUrl: input.documentUri,
      kycSelfieUrl: input.selfieUri,
      kycReviewedAt: undefined,
      kycReviewedBy: undefined,
      addresses: [],
      walletBalance: 0,
      points: 0,
      totalOrders: 0,
      completedOrders: 0,
      notes: undefined,
      createdAt: new Date().toISOString(),
    });
    return user;
  });
}

export function saveCustomerAddresses(addresses: Customer["addresses"]) {
  transaction((s) => {
    const a = currentActor();
    if (
      a.role !== "CLIENT" ||
      addresses.some(
        (address) =>
          !address.street.trim() ||
          !Number.isFinite(address.coordinates.lat) ||
          !Number.isFinite(address.coordinates.lng) ||
          Math.abs(address.coordinates.lat) > 90 ||
          Math.abs(address.coordinates.lng) > 180,
      )
    )
      throw Error("Revisa las direcciones y sus coordenadas.");
    s.customers.find((c) => c.id === a.id)!.addresses = clone(addresses);
  });
}
export function savePaymentMethods(
  cards: import("../data/mockData").PaymentMethod[],
) {
  transaction((s) => {
    const a = currentActor();
    if (a.role !== "CLIENT" || cards.some((c) => !/^\d{4}$/.test(c.last4)))
      throw Error("Método de pago inválido.");
    s.paymentMethods ??= {};
    s.paymentMethods[a.id] = clone(cards);
  });
}
