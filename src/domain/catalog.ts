import type {
  Facility,
  LoyaltyReward,
  MembershipPlan,
  OrderExtra,
  Promo,
  TimeSlot,
} from "./models";

export interface CatalogGarment {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  estimatedHours: number;
  iconKey: string;
}

export interface CatalogService {
  id: string;
  name: string;
  description: string;
  extraPrice: number;
}

export const fallbackFacilities: Facility[] = [
  {
    id: "fac-1",
    name: "Sede Central Guayaquil - Av. 9 de Octubre",
    address: "Av. 9 de Octubre y Malecón Simón Bolívar, Guayaquil",
    openingHours: "Lun - Sáb: 08:00 - 20:00",
    phone: "+593 4 250 0000",
    acceptsDropoff: false,
    allowsPickup: true,
    latitude: -2.1894,
    longitude: -79.8891,
  },
  {
    id: "fac-2",
    name: "Sucursal Samborondón",
    address: "Av. Samborondón Km 2.5, La Puntilla, Guayaquil",
    openingHours: "Lun - Sáb: 08:30 - 19:30",
    phone: "+593 4 283 0002",
    acceptsDropoff: false,
    allowsPickup: true,
    latitude: -2.1445,
    longitude: -79.8652,
  },
  {
    id: "fac-3",
    name: "Sucursal Kennedy Norte - Centro Comercial",
    address: "Av. Francisco de Orellana y Miguel H. Alcívar, Guayaquil",
    openingHours: "Lun - Vie: 08:00 - 19:00",
    phone: "+593 4 268 0003",
    acceptsDropoff: false,
    allowsPickup: true,
    latitude: -2.1642,
    longitude: -79.8981,
  },
];

export const fallbackGarments: CatalogGarment[] = [
  {
    id: "g-1",
    name: "Camisas / Blusas",
    category: "Prendas superiores",
    basePrice: 2.5,
    estimatedHours: 24,
    iconKey: "shirt-outline",
  },
  {
    id: "g-2",
    name: "Pantalones / Jeans",
    category: "Prendas inferiores",
    basePrice: 3,
    estimatedHours: 24,
    iconKey: "shirt-outline",
  },
  {
    id: "g-3",
    name: "Vestidos",
    category: "Prendas delicadas",
    basePrice: 5.5,
    estimatedHours: 48,
    iconKey: "shirt-outline",
  },
  {
    id: "g-4",
    name: "Ropa interior (pack x3)",
    category: "Ropa íntima",
    basePrice: 2,
    estimatedHours: 24,
    iconKey: "shirt-outline",
  },
  {
    id: "g-5",
    name: "Calcetines (pack x3)",
    category: "Ropa íntima",
    basePrice: 1.8,
    estimatedHours: 24,
    iconKey: "shirt-outline",
  },
  {
    id: "g-6",
    name: "Juego de Sábanas",
    category: "Hogar",
    basePrice: 4.5,
    estimatedHours: 24,
    iconKey: "bed-outline",
  },
  {
    id: "g-7",
    name: "Edredón / Plumón",
    category: "Hogar",
    basePrice: 8,
    estimatedHours: 48,
    iconKey: "bed-outline",
  },
  {
    id: "g-8",
    name: "Toallas (juego x2)",
    category: "Hogar",
    basePrice: 3.2,
    estimatedHours: 24,
    iconKey: "layers-outline",
  },
  {
    id: "g-9",
    name: "Chaquetas / Abrigos",
    category: "Prendas exteriores",
    basePrice: 6,
    estimatedHours: 48,
    iconKey: "shirt-outline",
  },
  {
    id: "g-10",
    name: "Traje sastre (2 piezas)",
    category: "Formal",
    basePrice: 9,
    estimatedHours: 48,
    iconKey: "shirt-outline",
  },
];

export const fallbackServices: CatalogService[] = [
  {
    id: "s-1",
    name: "Lavado ecológico",
    description: "Lavado suave con agua ozonizada y detergente bio",
    extraPrice: 0,
  },
  {
    id: "s-2",
    name: "Lavado + Secado",
    description: "Lavado completo y secado a temperatura controlada",
    extraPrice: 0.5,
  },
  {
    id: "s-3",
    name: "Lavado + Planchado",
    description: "Servicio integral con vapor anti-arrugas",
    extraPrice: 1.5,
  },
  {
    id: "s-4",
    name: "Solo Planchado",
    description: "Prensado profesional y colgado en funda",
    extraPrice: 1,
  },
  {
    id: "s-5",
    name: "Tratamiento especial",
    description: "Desmanchado focalizado y protección de fibras",
    extraPrice: 2.5,
  },
];

export const fallbackExtras: OrderExtra[] = [
  {
    id: "ext-1",
    name: "Doblado especial tipo hotel",
    description: "Prendas compactas y listas para closet",
    price: 1.5,
  },
  {
    id: "ext-2",
    name: "Perfumado Clean & Fresh",
    description: "Esencia botánica fresca hipoalergénica",
    price: 1,
  },
  {
    id: "ext-3",
    name: "Empaque premium biodegradable",
    description: "Bolsas de algodón y fundas reutilizables",
    price: 2,
  },
  {
    id: "ext-4",
    name: "Hipoalergénico piel sensible",
    description: "Cero fragancias sintéticas, neutralización total",
    price: 1.5,
  },
];

export const fallbackPromos: Promo[] = [
  {
    code: "FRESH10",
    discountPercent: 10,
    fixedDiscount: 0,
    minOrderAmount: 15,
    description: "10% de descuento en tu servicio",
    validUntil: "2026-10-31",
  },
  {
    code: "BIENVENIDO",
    discountPercent: 0,
    fixedDiscount: 5,
    minOrderAmount: 20,
    description: "$5.00 de descuento en pedidos mayores a $20",
    validUntil: "2026-11-15",
  },
  {
    code: "LAVADOFACIL",
    discountPercent: 15,
    fixedDiscount: 0,
    minOrderAmount: 25,
    description: "15% para clientes frecuentes",
    validUntil: "2026-11-30",
  },
];

export const fallbackRewards: LoyaltyReward[] = [
  {
    id: "rew-1",
    title: "Lavado gratis de edredón",
    pointsCost: 600,
    description: "Canjeable en cualquier solicitud que incluya edredón",
    category: "Hogar",
  },
  {
    id: "rew-2",
    title: "Cupón de $10.00 de saldo",
    pointsCost: 500,
    description: "Se acredita a tu Billetera Laundry después de aprobación",
    category: "Saldo",
  },
  {
    id: "rew-3",
    title: "Perfumado Clean & Fresh gratis",
    pointsCost: 150,
    description: "Extra de aromatizado botánico sin costo",
    category: "Extras",
  },
  {
    id: "rew-4",
    title: "Empaque premium gratis",
    pointsCost: 250,
    description: "Protección ecológica para tu siguiente entrega",
    category: "Extras",
  },
];

export const fallbackPlans: MembershipPlan[] = [
  {
    id: "plan-basic",
    name: "Básico",
    priceMonthly: 9.99,
    weeklyPickups: 1,
    garmentDiscountPercent: 5,
    benefits: [
      "1 recogida semanal sin costo de envío",
      "5% de descuento en catálogo",
      "Soporte estándar",
    ],
  },
  {
    id: "plan-standard",
    name: "Estándar",
    priceMonthly: 19.99,
    weeklyPickups: 2,
    garmentDiscountPercent: 12,
    benefits: [
      "2 recogidas semanales prioritarias",
      "12% de descuento en todas las prendas",
      "Perfumado fresco de cortesía",
      "Soporte preferente",
    ],
  },
  {
    id: "plan-premium",
    name: "Premium",
    priceMonthly: 34.99,
    weeklyPickups: 4,
    garmentDiscountPercent: 20,
    benefits: [
      "Recogidas ilimitadas bajo demanda",
      "20% de descuento en catálogo y extras",
      "Tratamiento desmanchador incluido",
      "Atención VIP 24/7",
      "Doblado de lujo sin costo",
    ],
  },
];

export const facilities: Facility[] = [...fallbackFacilities];
export const garments: CatalogGarment[] = [...fallbackGarments];
export const services: CatalogService[] = [...fallbackServices];
export const extras: OrderExtra[] = [...fallbackExtras];
export const promos: Promo[] = [...fallbackPromos];
export const rewards: LoyaltyReward[] = [...fallbackRewards];
export const plans: MembershipPlan[] = [...fallbackPlans];

export interface CatalogSnapshot {
  facilities?: Facility[];
  garments?: CatalogGarment[];
  services?: CatalogService[];
  extras?: OrderExtra[];
  promos?: Promo[];
  rewards?: LoyaltyReward[];
  plans?: MembershipPlan[];
}

export function syncCatalogState(snapshot: CatalogSnapshot): void {
  if (snapshot.facilities?.length) {
    facilities.splice(0, facilities.length, ...snapshot.facilities);
  }
  if (snapshot.garments?.length) {
    garments.splice(0, garments.length, ...snapshot.garments);
  }
  if (snapshot.services?.length) {
    services.splice(0, services.length, ...snapshot.services);
  }
  if (snapshot.extras?.length) {
    extras.splice(0, extras.length, ...snapshot.extras);
  }
  if (snapshot.promos?.length) {
    promos.splice(0, promos.length, ...snapshot.promos);
  }
  if (snapshot.rewards?.length) {
    rewards.splice(0, rewards.length, ...snapshot.rewards);
  }
  if (snapshot.plans?.length) {
    plans.splice(0, plans.length, ...snapshot.plans);
  }
}

export function resetCatalogToFallback(): void {
  syncCatalogState({
    facilities: fallbackFacilities,
    garments: fallbackGarments,
    services: fallbackServices,
    extras: fallbackExtras,
    promos: fallbackPromos,
    rewards: fallbackRewards,
    plans: fallbackPlans,
  });
}

export const initialSlots: TimeSlot[] = [
  {
    id: "slot-1",
    context: "DRIVER_PICKUP",
    date: "HOY",
    startTime: "09:00",
    endTime: "11:00",
    capacity: 4,
    reservedCount: 4,
    active: true,
  },
  {
    id: "slot-2",
    context: "DRIVER_PICKUP",
    date: "HOY",
    startTime: "11:00",
    endTime: "13:00",
    capacity: 4,
    reservedCount: 3,
    active: true,
  },
  {
    id: "slot-3",
    context: "DRIVER_PICKUP",
    date: "HOY",
    startTime: "16:00",
    endTime: "18:00",
    capacity: 4,
    reservedCount: 1,
    active: true,
  },
  {
    id: "slot-4",
    context: "DRIVER_PICKUP",
    date: "HOY",
    startTime: "18:00",
    endTime: "20:00",
    capacity: 4,
    reservedCount: 0,
    active: true,
  },
  {
    id: "slot-7",
    context: "DRIVER_DELIVERY",
    date: "Mañana",
    startTime: "10:00",
    endTime: "12:00",
    capacity: 4,
    reservedCount: 1,
    active: true,
  },
  {
    id: "slot-8",
    context: "DRIVER_DELIVERY",
    date: "Mañana",
    startTime: "16:00",
    endTime: "18:00",
    capacity: 4,
    reservedCount: 2,
    active: true,
  },
  {
    id: "slot-9",
    context: "FACILITY_PICKUP",
    date: "Mañana",
    startTime: "09:00",
    endTime: "12:00",
    capacity: 8,
    reservedCount: 2,
    active: true,
  },
  {
    id: "slot-10",
    context: "FACILITY_PICKUP",
    date: "Mañana",
    startTime: "16:00",
    endTime: "19:00",
    capacity: 8,
    reservedCount: 1,
    active: true,
  },
];
