import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export type WashType =
  | 'alfombra'
  | 'blanqueo'
  | 'costura'
  | 'desmanche'
  | 'edredones'
  | 'lp'
  | 'ls'
  | 'reproceso'
  | 'solo_plancha'
  | 'tinturado'
  | 'zapatos';

export interface GarmentItem {
  type: string; // camisas, pantalones, etc.
  quantity: number;
  washType: WashType;
  notes?: string;
}

export interface OrderDraft {
  customerId?: string;
  requestId: string;
  inboundMethod: 'DRIVER' | 'CUSTOMER';
  outboundMethod: 'DRIVER' | 'CUSTOMER';
  facilityId: string;
  inboundSlotId: string;
  outboundSlotId: string;
  pricingModel: 'FIXED' | 'PER_WEIGHT';
  catalogServiceId: string;
  deliveryCoords: { latitude: number; longitude: number } | null;
  // Paso 1 — Prendas
  garments: GarmentItem[];
  // Paso 2 — Servicios adicionales
  extras: string[]; // doblado, perfumado, empaque especial
  // Paso 3 — Horario recogida
  pickupDate: string | null;
  pickupSlot: string | null;
  pickupAddress: string;
  pickupCoords: { latitude: number; longitude: number } | null;
  // Paso 4 — Horario entrega
  deliveryDate: string | null;
  deliverySlot: string | null;
  deliveryAddress: string;
  deliverySameAsPickup: boolean;
  // Paso 5 — Promo
  promoCode: string | null;
  promoDiscount: number;
}

interface OrderStore extends OrderDraft {
  setBusinessDraft: (value: Partial<OrderDraft>) => void;
  setGarments: (garments: GarmentItem[]) => void;
  setExtras: (extras: string[]) => void;
  setPickup: (
    date: string,
    slot: string,
    address: string,
    coords: { latitude: number; longitude: number },
  ) => void;
  setDelivery: (
    date: string,
    slot: string,
    address: string,
    sameAsPickup: boolean,
  ) => void;
  setPromo: (code: string, discount: number) => void;
  reset: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
}

const WASH_PRICES: Record<WashType, number> = {
  alfombra: 5.6,
  blanqueo: 2.5,
  costura: 3.6,
  desmanche: 2.0,
  edredones: 4.6,
  lp: 1.6,
  ls: 1.4,
  reproceso: 1.0,
  solo_plancha: 1.3,
  tinturado: 4.1,
  zapatos: 6.5,
};

const INITIAL: OrderDraft = {
  requestId: Crypto.randomUUID(),
  inboundMethod: 'DRIVER',
  outboundMethod: 'DRIVER',
  facilityId: '',
  inboundSlotId: '',
  outboundSlotId: '',
  pricingModel: 'FIXED',
  catalogServiceId: 'SVC-WEIGHT',
  deliveryCoords: null,
  garments: [],
  extras: [],
  pickupDate: null,
  pickupSlot: null,
  pickupAddress: '',
  pickupCoords: null,
  deliveryDate: null,
  deliverySlot: null,
  deliveryAddress: '',
  deliverySameAsPickup: true,
  promoCode: null,
  promoDiscount: 0,
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      setBusinessDraft: (value) => set(value),

      setGarments: (garments) => set({ garments }),
      setExtras: (extras) => set({ extras }),
      setPickup: (pickupDate, pickupSlot, pickupAddress, pickupCoords) =>
        set({ pickupDate, pickupSlot, pickupAddress, pickupCoords }),
      setDelivery: (
        deliveryDate,
        deliverySlot,
        deliveryAddress,
        deliverySameAsPickup,
      ) =>
        set({
          deliveryDate,
          deliverySlot,
          deliveryAddress,
          deliverySameAsPickup,
        }),
      setPromo: (promoCode, promoDiscount) => set({ promoCode, promoDiscount }),
      reset: () => set({ ...INITIAL, requestId: Crypto.randomUUID() }),

      getTotalItems: () =>
        get().garments.reduce((sum, g) => sum + g.quantity, 0),

      getSubtotal: () => {
        const { garments, extras } = get();
        let total = garments.reduce((sum, g) => {
          const price = WASH_PRICES[g.washType] ?? 1.6;
          return sum + g.quantity * price;
        }, 0);
        if (extras.includes('Doblado especial')) total += 2;
        if (extras.includes('Perfumado')) total += 1.5;
        if (extras.includes('Empaque premium')) total += 3;
        return Math.max(total, 5); // mínimo $5
      },
    }),
    {
      name: 'laundry_order_draft_v3',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export { WASH_PRICES };
