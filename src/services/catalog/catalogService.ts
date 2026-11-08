import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fallbackExtras,
  fallbackFacilities,
  fallbackGarments,
  fallbackPlans,
  fallbackPromos,
  fallbackRewards,
  fallbackServices,
  syncCatalogState,
  type CatalogGarment,
  type CatalogService,
  type CatalogSnapshot,
} from "../../domain/catalog";
import type {
  Facility,
  LoyaltyReward,
  MembershipPlan,
  OrderExtra,
  Promo,
} from "../../domain/models";
import { apiClient } from "../api/apiClient";
import { getStoredAuthSession } from "../auth/authService";

export const CATALOG_CACHE_KEY = "laundry.catalog.cache.v1";

interface BackendGarment {
  id: string;
  name: string;
  category?: string;
  basePrice: string | number;
  estimatedHours?: number;
  icon?: string;
  iconKey?: string;
  active?: boolean;
}

interface BackendService {
  id: string;
  name: string;
  description?: string;
  extraPrice: string | number;
  active?: boolean;
}

interface BackendExtra {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  active?: boolean;
}

interface BackendMembership {
  id: string;
  name: string;
  priceMonthly: string | number;
  weeklyPickups?: number | null;
  garmentDiscountPercent: string | number;
  benefits?: string[];
  active?: boolean;
}

interface BackendOpeningHoursObject {
  code?: string;
  days?: number[];
  open?: string;
  close?: string;
  allowsCustomerPickup?: boolean;
}

interface BackendFacility {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  phone?: string | null;
  openingHours?: string | BackendOpeningHoursObject | null;
  acceptsDropoff?: boolean;
  allowsPickup?: boolean;
  latitude: string | number;
  longitude: string | number;
  active?: boolean;
}

interface BackendPromo {
  id?: string;
  code: string;
  discountType?: "PERCENTAGE" | "FIXED" | string;
  discountValue?: string | number;
  discountPercent?: string | number;
  fixedDiscount?: string | number;
  minOrderAmount?: string | number;
  description?: string;
  validUntil?: string | null;
  active?: boolean;
}

interface BackendReward {
  id: string;
  title?: string;
  name?: string;
  pointsCost: string | number;
  description?: string;
  category?: string;
  active?: boolean;
}

const memoryCache = new Map<string, string>();

async function readCache(): Promise<CatalogSnapshot | null> {
  try {
    const raw =
      (await AsyncStorage.getItem(CATALOG_CACHE_KEY)) ??
      memoryCache.get(CATALOG_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CatalogSnapshot;
  } catch {
    const fallbackRaw = memoryCache.get(CATALOG_CACHE_KEY);
    if (!fallbackRaw) return null;
    try {
      return JSON.parse(fallbackRaw) as CatalogSnapshot;
    } catch {
      return null;
    }
  }
}

async function writeCache(partial: CatalogSnapshot): Promise<void> {
  const existing = (await readCache()) ?? {};
  const merged: CatalogSnapshot = { ...existing, ...partial };
  const serialized = JSON.stringify(merged);
  memoryCache.set(CATALOG_CACHE_KEY, serialized);
  try {
    await AsyncStorage.setItem(CATALOG_CACHE_KEY, serialized);
  } catch {
    // Fallback to in-memory cache in Node/headless environments
  }
}

function resolveGarmentIcon(icon?: string, name = ""): string {
  const key = (icon ?? "").toLowerCase();
  const label = name.toLowerCase();
  if (key.includes("-outline")) return key;
  if (
    key === "bedding" ||
    label.includes("edredón") ||
    label.includes("sábana") ||
    label.includes("plumón")
  ) {
    return "bed-outline";
  }
  if (key === "towel" || label.includes("toalla")) {
    return "layers-outline";
  }
  if (key === "suit" || label.includes("terno") || label.includes("traje")) {
    return "briefcase-outline";
  }
  if (key === "dress" || label.includes("vestido")) {
    return "sparkles-outline";
  }
  return "shirt-outline";
}

function resolveGarmentCategory(
  category: string | undefined,
  icon: string | undefined,
  name: string,
): string {
  if (category?.trim()) return category.trim();
  if (
    icon &&
    !/^(shirt|pants|suit|dress|bedding|towel)$/i.test(icon.trim()) &&
    !icon.includes("outline")
  ) {
    return icon.trim();
  }
  const label = name.toLowerCase();
  if (
    label.includes("edredón") ||
    label.includes("sábana") ||
    label.includes("plumón")
  )
    return "Hogar";
  if (label.includes("terno") || label.includes("traje")) return "Formal";
  if (label.includes("vestido")) return "Prendas delicadas";
  if (label.includes("chaqueta") || label.includes("abrigo") || label.includes("cuero"))
    return "Prendas exteriores";
  if (label.includes("pantalón") || label.includes("jean"))
    return "Prendas inferiores";
  return "Prendas superiores";
}

function resolveServiceDescription(
  description: string | undefined,
  name: string,
): string {
  if (description?.trim()) return description.trim();
  const label = name.toLowerCase();
  if (label.includes("seco") || label.includes("dry"))
    return "Cuidado especializado en seco para fibras delicadas y trajes.";
  if (label.includes("planchado"))
    return "Lavado profundo y planchado profesional a vapor.";
  return "Lavado suave a temperatura controlada y doblado compacto.";
}

function mapGarment(raw: BackendGarment): CatalogGarment {
  const name = raw.name.trim();
  const isHeavy = /edredón|plumón|traje|terno|vestido|chaqueta|cuero/i.test(name);
  return {
    id: raw.id,
    name,
    category: resolveGarmentCategory(raw.category, raw.icon, name),
    basePrice: Number(raw.basePrice) || 0,
    estimatedHours: raw.estimatedHours ?? (isHeavy ? 48 : 24),
    iconKey: raw.iconKey ?? resolveGarmentIcon(raw.icon, name),
  };
}

function mapService(raw: BackendService): CatalogService {
  const name = raw.name.trim();
  return {
    id: raw.id,
    name,
    description: resolveServiceDescription(raw.description, name),
    extraPrice: Number(raw.extraPrice) || 0,
  };
}

function mapExtra(raw: BackendExtra): OrderExtra {
  return {
    id: raw.id,
    name: raw.name.trim(),
    description:
      raw.description?.trim() || "Acabado especial para el cuidado de tu ropa.",
    price: Number(raw.price) || 0,
  };
}

function mapMembership(raw: BackendMembership): MembershipPlan {
  return {
    id: raw.id,
    name: raw.name.trim(),
    priceMonthly: Number(raw.priceMonthly) || 0,
    weeklyPickups:
      typeof raw.weeklyPickups === "number" ? raw.weeklyPickups : 4,
    garmentDiscountPercent: Number(raw.garmentDiscountPercent) || 0,
    benefits: Array.isArray(raw.benefits) ? raw.benefits : [],
  };
}

function formatOpeningHours(
  openingHours: BackendFacility["openingHours"],
): { text: string; allowsCustomerPickup?: boolean } {
  if (!openingHours) {
    return { text: "Lun - Sáb: 08:00 - 20:00" };
  }
  if (typeof openingHours === "string") {
    return {
      text: openingHours.trim() || "Lun - Sáb: 08:00 - 20:00",
    };
  }
  const open = openingHours.open ?? "08:00";
  const close = openingHours.close ?? "20:00";
  const days = Array.isArray(openingHours.days) ? openingHours.days : [];
  const dayLabel =
    days.length >= 6
      ? "Lun - Sáb"
      : days.length === 5
        ? "Lun - Vie"
        : "Lun - Sáb";
  return {
    text: `${dayLabel}: ${open} - ${close}`,
    allowsCustomerPickup: openingHours.allowsCustomerPickup,
  };
}

function mapFacility(raw: BackendFacility): Facility {
  const address =
    raw.city && !raw.address.toLowerCase().includes(raw.city.toLowerCase())
      ? `${raw.address.trim()}, ${raw.city.trim()}`
      : raw.address.trim();
  const hoursInfo = formatOpeningHours(raw.openingHours);
  return {
    id: raw.id,
    name: raw.name.trim(),
    address,
    openingHours: hoursInfo.text,
    phone: raw.phone?.trim() || "+593 4 250 0000",
    acceptsDropoff: raw.acceptsDropoff ?? false,
    allowsPickup:
      raw.allowsPickup ?? hoursInfo.allowsCustomerPickup ?? true,
    latitude: Number(raw.latitude) || -2.1894,
    longitude: Number(raw.longitude) || -79.8891,
  };
}

function mapPromo(raw: BackendPromo): Promo {
  const discountValue = Number(raw.discountValue) || 0;
  const isPercentage =
    raw.discountType === "PERCENTAGE" || Number(raw.discountPercent) > 0;
  const discountPercent = isPercentage
    ? Number(raw.discountPercent ?? discountValue) || 0
    : 0;
  const fixedDiscount = !isPercentage
    ? Number(raw.fixedDiscount ?? discountValue) || 0
    : 0;
  return {
    code: raw.code.trim().toUpperCase(),
    discountPercent,
    fixedDiscount,
    minOrderAmount: Number(raw.minOrderAmount) || 0,
    description: raw.description?.trim() || "Promoción especial Laundry",
    validUntil: raw.validUntil ? raw.validUntil.slice(0, 10) : "2026-12-31",
  };
}

async function resolveAccessToken(
  explicitToken?: string | null,
): Promise<string | null> {
  if (explicitToken !== undefined) return explicitToken;
  const session = await getStoredAuthSession();
  return session.accessToken;
}

export async function fetchGarments(
  accessToken?: string | null,
): Promise<CatalogGarment[]> {
  try {
    const token = await resolveAccessToken(accessToken);
    const data = await apiClient.get<BackendGarment[] | BackendGarment>(
      "/catalog/garments",
      token ? { accessToken: token } : undefined,
    );
    const list = Array.isArray(data) ? data : data ? [data] : [];
    const active = list.filter((item) => item && item.active !== false);
    const mapped = active.map(mapGarment);
    if (mapped.length) {
      syncCatalogState({ garments: mapped });
      await writeCache({ garments: mapped });
      return mapped;
    }
  } catch {
    const cached = await readCache();
    if (cached?.garments?.length) {
      syncCatalogState({ garments: cached.garments });
      return cached.garments;
    }
  }
  return fallbackGarments;
}

export async function fetchServices(
  accessToken?: string | null,
): Promise<CatalogService[]> {
  try {
    const token = await resolveAccessToken(accessToken);
    const data = await apiClient.get<BackendService[] | BackendService>(
      "/catalog/services",
      token ? { accessToken: token } : undefined,
    );
    const list = Array.isArray(data) ? data : data ? [data] : [];
    const active = list.filter((item) => item && item.active !== false);
    const mapped = active.map(mapService);
    if (mapped.length) {
      syncCatalogState({ services: mapped });
      await writeCache({ services: mapped });
      return mapped;
    }
  } catch {
    const cached = await readCache();
    if (cached?.services?.length) {
      syncCatalogState({ services: cached.services });
      return cached.services;
    }
  }
  return fallbackServices;
}

export async function fetchExtras(
  accessToken?: string | null,
): Promise<OrderExtra[]> {
  try {
    const token = await resolveAccessToken(accessToken);
    const data = await apiClient.get<BackendExtra[] | BackendExtra>(
      "/catalog/extras",
      token ? { accessToken: token } : undefined,
    );
    const list = Array.isArray(data) ? data : data ? [data] : [];
    const active = list.filter((item) => item && item.active !== false);
    const mapped = active.map(mapExtra);
    if (mapped.length) {
      syncCatalogState({ extras: mapped });
      await writeCache({ extras: mapped });
      return mapped;
    }
  } catch {
    const cached = await readCache();
    if (cached?.extras?.length) {
      syncCatalogState({ extras: cached.extras });
      return cached.extras;
    }
  }
  return fallbackExtras;
}

export async function fetchMemberships(
  accessToken?: string | null,
): Promise<MembershipPlan[]> {
  try {
    const token = await resolveAccessToken(accessToken);
    const data = await apiClient.get<BackendMembership[] | BackendMembership>(
      "/catalog/memberships",
      token ? { accessToken: token } : undefined,
    );
    const list = Array.isArray(data) ? data : data ? [data] : [];
    const active = list.filter((item) => item && item.active !== false);
    const mapped = active.map(mapMembership);
    if (mapped.length) {
      syncCatalogState({ plans: mapped });
      await writeCache({ plans: mapped });
      return mapped;
    }
  } catch {
    const cached = await readCache();
    if (cached?.plans?.length) {
      syncCatalogState({ plans: cached.plans });
      return cached.plans;
    }
  }
  return fallbackPlans;
}

export async function fetchFacilities(
  accessToken?: string | null,
): Promise<Facility[]> {
  try {
    const token = await resolveAccessToken(accessToken);
    const data = await apiClient.get<BackendFacility[] | BackendFacility>(
      "/facilities",
      token ? { accessToken: token } : undefined,
    );
    const list = Array.isArray(data) ? data : data ? [data] : [];
    const active = list.filter((item) => item && item.active !== false);
    const mapped = active.map(mapFacility);
    if (mapped.length) {
      syncCatalogState({ facilities: mapped });
      await writeCache({ facilities: mapped });
      return mapped;
    }
  } catch {
    const cached = await readCache();
    if (cached?.facilities?.length) {
      syncCatalogState({ facilities: cached.facilities });
      return cached.facilities;
    }
  }
  return fallbackFacilities;
}

export async function fetchPromotions(
  accessToken?: string | null,
): Promise<Promo[]> {
  try {
    const token = await resolveAccessToken(accessToken);
    const data = await apiClient.get<BackendPromo[] | BackendPromo>(
      "/catalog/promotions",
      token ? { accessToken: token } : undefined,
    );
    const list = Array.isArray(data) ? data : data ? [data] : [];
    const mapped: Promo[] = list
      .filter((item) => item && item.code && item.active !== false)
      .map(mapPromo);
    if (mapped.length) {
      syncCatalogState({ promos: mapped });
      await writeCache({ promos: mapped });
      return mapped;
    }
  } catch {
    const cached = await readCache();
    if (cached?.promos?.length) {
      syncCatalogState({ promos: cached.promos });
      return cached.promos;
    }
  }
  return fallbackPromos;
}

export async function fetchRewards(
  accessToken?: string | null,
): Promise<LoyaltyReward[]> {
  try {
    const token = await resolveAccessToken(accessToken);
    const data = await apiClient.get<BackendReward[] | BackendReward>(
      "/catalog/rewards",
      token ? { accessToken: token } : undefined,
    );
    const list = Array.isArray(data) ? data : data ? [data] : [];
    const mapped: LoyaltyReward[] = list
      .filter(
        (item) => item && (item.title || item.name) && item.active !== false,
      )
      .map((item) => ({
        id: item.id,
        title: (item.title ?? item.name ?? "Recompensa").trim(),
        pointsCost: Number(item.pointsCost) || 0,
        description:
          item.description?.trim() || "Canjeable con tus puntos disponibles.",
        category: item.category?.trim() || "Beneficios",
      }));
    if (mapped.length) {
      syncCatalogState({ rewards: mapped });
      await writeCache({ rewards: mapped });
      return mapped;
    }
  } catch {
    const cached = await readCache();
    if (cached?.rewards?.length) {
      syncCatalogState({ rewards: cached.rewards });
      return cached.rewards;
    }
  }
  return fallbackRewards;
}

export async function syncFullCatalog(
  accessToken?: string | null,
): Promise<{
  garments: CatalogGarment[];
  services: CatalogService[];
  extras: OrderExtra[];
  memberships: MembershipPlan[];
  facilities: Facility[];
  promos: Promo[];
  rewards: LoyaltyReward[];
}> {
  const token = await resolveAccessToken(accessToken);
  const [
    garmentsList,
    servicesList,
    extrasList,
    membershipsList,
    facilitiesList,
    promosList,
    rewardsList,
  ] = await Promise.all([
    fetchGarments(token),
    fetchServices(token),
    fetchExtras(token),
    fetchMemberships(token),
    fetchFacilities(token),
    fetchPromotions(token),
    fetchRewards(token),
  ]);
  return {
    garments: garmentsList,
    services: servicesList,
    extras: extrasList,
    memberships: membershipsList,
    facilities: facilitiesList,
    promos: promosList,
    rewards: rewardsList,
  };
}

export const catalogService = {
  fetchGarments,
  fetchServices,
  fetchExtras,
  fetchMemberships,
  fetchFacilities,
  fetchPromotions,
  fetchRewards,
  syncFullCatalog,
};
