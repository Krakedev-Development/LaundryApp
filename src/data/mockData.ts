export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  points: number;
  balance: number; // saldo prepago
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  coordinates: { latitude: number; longitude: number };
}

export type OrderStatus = 'pending' | 'picked_up' | 'in_process' | 'delivering' | 'delivered';

export interface GarmentIssue {
  garment: string;
  issue: string; // mancha, rotura, etc.
}

export interface Order {
  id: string;
  client: Client;
  driver: Driver;
  status: OrderStatus;
  serviceType: 'wash' | 'wash_fold' | 'dry_clean' | 'iron';
  garmentCount: number;
  price: number;
  pickupTime: string;
  deliveryTime: string;
  address: string;
  issues?: GarmentIssue[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number; // porcentaje
  type: 'download' | 'prepaid' | 'package' | 'membership';
  badge?: string;
  color: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  pricePerGarment?: number;
  fixedPrice?: number;
  minGarments?: number;
  popular?: boolean;
}

// ── Mock Data ──────────────────────────────────────────

export const MOCK_CLIENT: Client = {
  id: 'c1',
  name: 'Juan Pérez',
  phone: '0991234567',
  address: 'Av. Amazonas N23-45, Quito',
  coordinates: { latitude: -0.2310, longitude: -78.5200 },
  points: 340,
  balance: 25.00,
};

export const MOCK_DRIVER: Driver = {
  id: 'd1',
  name: 'Carlos Chofer',
  phone: '0997654321',
  vehicle: 'Toyota Hiace',
  plate: 'PBX-1234',
  coordinates: { latitude: -0.2295, longitude: -78.5243 },
};

export const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: 'p1',
    title: '15 prendas por $12',
    description: 'Lavado y doblado. Oferta limitada esta semana.',
    discount: 20,
    type: 'package',
    badge: 'Popular',
    color: '#143F73',
  },
  {
    id: 'p2',
    title: '10% de descuento',
    description: 'Por descargar la app. Válido en tu primer pedido.',
    discount: 10,
    type: 'download',
    badge: 'Bienvenida',
    color: '#A5CD39',
  },
  {
    id: 'p3',
    title: 'Abono prepago $30',
    description: 'Carga $30 y recibe $35 en saldo. Ahorra $5.',
    discount: 0,
    type: 'prepaid',
    color: '#61BFC7',
  },
];

export const MOCK_SERVICES: ServicePackage[] = [
  {
    id: 'wash_fold',
    name: 'Lavado y Doblado',
    description: 'Lavado, secado y doblado por prenda',
    pricePerGarment: 1.1,
    minGarments: 10,
    popular: true,
  },
  {
    id: 'dry_clean',
    name: 'Lavado en Seco',
    description: 'Prendas delicadas y trajes',
    pricePerGarment: 2.9,
    minGarments: 1,
  },
  {
    id: 'iron',
    name: 'Solo Planchado',
    description: 'Planchado profesional por prenda',
    fixedPrice: 1.3,
  },
  {
    id: 'shirts',
    name: 'Paquete Camisas',
    description: '5 camisas planchadas',
    fixedPrice: 5.0,
    popular: false,
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    client: MOCK_CLIENT,
    driver: MOCK_DRIVER,
    status: 'delivering',
    serviceType: 'wash_fold',
    garmentCount: 15,
    price: 16.5,
    pickupTime: '2026-04-22T09:00:00',
    deliveryTime: '',
    address: 'Av. Amazonas N23-45, Quito',
  },
  {
    id: 'ORD-002',
    client: MOCK_CLIENT,
    driver: MOCK_DRIVER,
    status: 'delivered',
    serviceType: 'dry_clean',
    garmentCount: 3,
    price: 8.7,
    pickupTime: '2026-04-20T10:00:00',
    deliveryTime: '2026-04-21T17:00:00',
    address: 'Av. Amazonas N23-45, Quito',
    issues: [{ garment: 'Camisa azul', issue: 'Mancha leve detectada en cuello' }],
  },
  {
    id: 'ORD-003',
    client: MOCK_CLIENT,
    driver: MOCK_DRIVER,
    status: 'delivered',
    serviceType: 'wash_fold',
    garmentCount: 12,
    price: 13.2,
    pickupTime: '2026-04-18T08:00:00',
    deliveryTime: '2026-04-19T17:00:00',
    address: 'Av. Amazonas N23-45, Quito',
  },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  { id: '1', senderId: 'd1', text: 'Hola, estoy en camino a recoger su ropa.', timestamp: '2026-04-22T08:55:00' },
  { id: '2', senderId: 'c1', text: 'Perfecto, estaré en casa.', timestamp: '2026-04-22T08:56:00' },
  { id: '3', senderId: 'd1', text: 'Llego en aproximadamente 10 minutos.', timestamp: '2026-04-22T08:57:00' },
];

export const TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
];

export interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  holder: string;
  expiry: string;
  isDefault: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly';
  pickupsPerWeek: number;
  garmentsPerPickup: number;
  features: string[];
  color: string;
  popular?: boolean;
}

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm1', type: 'visa', last4: '4242', holder: 'Juan Pérez', expiry: '12/27', isDefault: true },
  { id: 'pm2', type: 'mastercard', last4: '5555', holder: 'Juan Pérez', expiry: '08/26', isDefault: false },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 19.99,
    period: 'monthly',
    pickupsPerWeek: 1,
    garmentsPerPickup: 10,
    features: ['1 recogida por semana', 'Hasta 10 prendas', 'Lavado y doblado', 'Entrega a domicilio'],
    color: '#6B7280',
  },
  {
    id: 'standard',
    name: 'Estándar',
    price: 34.99,
    period: 'monthly',
    pickupsPerWeek: 2,
    garmentsPerPickup: 15,
    features: ['2 recogidas por semana', 'Hasta 15 prendas c/u', 'Lavado y doblado', 'Entrega a domicilio', '5% descuento extra'],
    color: '#143F73',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 54.99,
    period: 'monthly',
    pickupsPerWeek: 3,
    garmentsPerPickup: 20,
    features: ['3 recogidas por semana', 'Hasta 20 prendas c/u', 'Lavado, doblado y planchado', 'Entrega prioritaria', '10% descuento extra', 'Soporte prioritario'],
    color: '#7C3AED',
  },
];

export const RECHARGE_AMOUNTS = [10, 20, 30, 50, 100];
