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

// El producto no trae catálogo propio: sedes, prendas, servicios, extras, promociones,
// recompensas y planes vienen del servidor. Sin conexión solo queda lo último descargado.
export const fallbackFacilities: Facility[] = [];
export const fallbackGarments: CatalogGarment[] = [];
export const fallbackServices: CatalogService[] = [];
export const fallbackExtras: OrderExtra[] = [];
export const fallbackPromos: Promo[] = [];
export const fallbackRewards: LoyaltyReward[] = [];
export const fallbackPlans: MembershipPlan[] = [];

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

// Una lista presente reemplaza a la anterior aunque venga vacía; una ausente no cambia.
export function syncCatalogState(snapshot: CatalogSnapshot): void {
  if (snapshot.facilities) {
    facilities.splice(0, facilities.length, ...snapshot.facilities);
  }
  if (snapshot.garments) {
    garments.splice(0, garments.length, ...snapshot.garments);
  }
  if (snapshot.services) {
    services.splice(0, services.length, ...snapshot.services);
  }
  if (snapshot.extras) {
    extras.splice(0, extras.length, ...snapshot.extras);
  }
  if (snapshot.promos) {
    promos.splice(0, promos.length, ...snapshot.promos);
  }
  if (snapshot.rewards) {
    rewards.splice(0, rewards.length, ...snapshot.rewards);
  }
  if (snapshot.plans) {
    plans.splice(0, plans.length, ...snapshot.plans);
  }
}

// Vacía el catálogo en memoria (por ejemplo al cerrar sesión o restablecer).
export function resetCatalogToFallback(): void {
  facilities.splice(0, facilities.length);
  garments.splice(0, garments.length);
  services.splice(0, services.length);
  extras.splice(0, extras.length);
  promos.splice(0, promos.length);
  rewards.splice(0, rewards.length);
  plans.splice(0, plans.length);
}

// Los cupos horarios los define y entrega el servidor.
export const initialSlots: TimeSlot[] = [];
