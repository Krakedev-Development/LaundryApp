import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Order,
  Customer,
  Driver,
  OrderItem,
  OrderExtra,
  OrderPricing,
  PickupInfo,
  DeliveryInfo,
  TimelineEvent,
  OrderStatus,
  OperationalStatus,
  KycStatus,
  WalletTransaction,
  LoyaltyReward,
  MembershipPlan,
  PromoCode,
  ChatMessage,
  CatalogGarment,
  CatalogService,
} from '../types';

interface LaundryContextType {
  customer: Customer;
  driver: Driver;
  orders: Order[];
  activeOrder: Order | undefined;
  chatMessages: Record<string, ChatMessage[]>;
  walletTransactions: WalletTransaction[];
  membershipPlans: MembershipPlan[];
  catalogGarments: CatalogGarment[];
  catalogServices: CatalogService[];
  catalogExtras: OrderExtra[];
  availablePromos: PromoCode[];
  loyaltyRewards: LoyaltyReward[];
  // Actions
  createOrder: (
    items: OrderItem[],
    extras: OrderExtra[],
    pickup: PickupInfo,
    delivery: DeliveryInfo,
    pricing: OrderPricing,
    promoCode: string | null,
    paymentMethod: string
  ) => Order;
  sendChatMessage: (orderId: string, senderRole: 'CLIENTE' | 'CHOFER', text: string) => void;
  addWalletCredit: (amount: number) => void;
  redeemReward: (reward: LoyaltyReward) => boolean;
  setDriverOperationalStatus: (status: OperationalStatus) => void;
  driverStartPickupNavigation: (orderId: string) => void;
  driverConfirmPickup: (orderId: string, count: number, notes: string) => void;
  driverConfirmDelivery: (orderId: string, recipient: string, relation: string, notes: string) => void;
  submitKyc: (docType: string, docId: string) => void;
}

const initialCustomer: Customer = {
  id: 'cust-1',
  name: 'María Elena Torres',
  email: 'maria.torres@gmail.com',
  phone: '+51 987 654 321',
  kycStatus: 'APPROVED',
  addresses: [
    {
      id: 'addr-1',
      title: 'Casa',
      fullAddress: 'Calle Los Sauces 421, Dpto 502, Miraflores',
      reference: 'Timbre 502, frente al parque',
      isPrimary: true,
    },
    {
      id: 'addr-2',
      title: 'Trabajo',
      fullAddress: 'Av. Javier Prado Este 2450, Piso 8, San Isidro',
      reference: 'Recepción corporativa',
      isPrimary: false,
    },
  ],
  walletBalance: 28.5,
  loyaltyPoints: 1540,
  membershipTier: 'Estándar',
  billingName: 'María Elena Torres',
  billingTaxId: '10458921345',
  billingEmail: 'maria.torres@gmail.com',
  billingPhone: '+51 987 654 321',
  billingAddress: 'Calle Los Sauces 421, Dpto 502',
};

const initialDriver: Driver = {
  id: 'drv-1',
  name: 'Carlos Mendoza',
  email: 'carlos.mendoza@laundryfresh.com',
  phone: '+51 912 345 678',
  operationalStatus: 'AVAILABLE',
  vehicleModel: 'Renault Kangoo Maxi',
  vehicleColor: 'Blanco',
  vehiclePlate: 'ABC-789',
  facilityName: 'Sede Central Norte - Planta 1',
  zoneName: 'Zona Centro - Miraflores',
  mustChangePassword: false,
  currentLat: -12.094,
  currentLng: -77.032,
  completedDeliveriesCount: 34,
};

const initialOrders: Order[] = [
  {
    id: 'SOL-4587',
    customerId: 'cust-1',
    customerName: 'María Elena Torres',
    customerPhone: '+51 987 654 321',
    status: 'HEADING_TO_PICKUP',
    items: [
      { id: 'it-1', garmentType: 'Camisas / Blusas', quantity: 4, serviceType: 'Lavado + Planchado', unitPrice: 4.0 },
      { id: 'it-2', garmentType: 'Pantalones / Jeans', quantity: 2, serviceType: 'Lavado ecológico', unitPrice: 3.0 },
      { id: 'it-3', garmentType: 'Juego de Sábanas', quantity: 1, serviceType: 'Lavado + Secado', unitPrice: 5.0 },
    ],
    extras: [{ id: 'ext-2', name: 'Perfumado Clean & Fresh', description: 'Esencia botánica fresca', price: 1.0, selected: true }],
    pricing: {
      itemsSubtotal: 27.0,
      extrasTotal: 1.0,
      discount: 2.8,
      membershipBenefitDiscount: 3.24,
      deliveryFee: 0.0,
      total: 21.96,
    },
    promotionCode: 'FRESH10',
    pickup: {
      addressId: 'addr-1',
      addressTitle: 'Casa',
      addressFull: 'Calle Los Sauces 421, Dpto 502, Miraflores',
      date: 'Hoy, Mié 30 Sep',
      timeSlot: '16:00 - 18:00',
      notes: 'Dejar en conserjería si no contesto el timbre',
    },
    delivery: {
      addressId: 'addr-1',
      addressTitle: 'Casa',
      addressFull: 'Calle Los Sauces 421, Dpto 502, Miraflores',
      date: 'Vie 02 Oct',
      timeSlot: '16:00 - 18:00',
    },
    assignedDriverId: 'drv-1',
    assignedDriverName: 'Carlos Mendoza',
    assignedDriverPhone: '+51 912 345 678',
    assignedDriverVehicle: 'Renault Kangoo Maxi (Blanco)',
    assignedDriverPlate: 'ABC-789',
    paymentMethod: 'Billetera Laundry',
    paymentStatus: 'PAGADO',
    createdAt: 'Hoy 14:15',
    timeline: [
      { status: 'CREATED', title: 'Solicitud creada', description: 'Solicitud confirmada en el sistema', timestamp: '14:15', completed: true },
      { status: 'PICKUP_ASSIGNED', title: 'Chofer asignado', description: 'Carlos Mendoza asignado', timestamp: '14:30', completed: true },
      { status: 'HEADING_TO_PICKUP', title: 'Chofer en camino', description: 'En ruta a tu dirección', timestamp: '15:35', completed: true },
      { status: 'PICKED_UP', title: 'Ropa recogida', description: 'Prendas recibidas por el chofer', timestamp: 'Pendiente', completed: false },
      { status: 'AT_FACILITY', title: 'En planta', description: 'Ingreso a planta para tratamiento', timestamp: 'Pendiente', completed: false },
      { status: 'IN_PROCESS', title: 'En lavado', description: 'Lavado y secado profesional', timestamp: 'Pendiente', completed: false },
      { status: 'READY_FOR_DELIVERY', title: 'Lista para entrega', description: 'Empaque y control de calidad', timestamp: 'Pendiente', completed: false },
      { status: 'DELIVERED', title: 'Entregada', description: 'Entrega final', timestamp: 'Pendiente', completed: false },
    ],
  },
];

const catalogGarments: CatalogGarment[] = [
  { id: 'g-1', name: 'Camisas / Blusas', category: 'Prendas superiores', basePrice: 2.5, estimatedHours: 24, iconKey: 'shirt' },
  { id: 'g-2', name: 'Pantalones / Jeans', category: 'Prendas inferiores', basePrice: 3.0, estimatedHours: 24, iconKey: 'pants' },
  { id: 'g-3', name: 'Vestidos', category: 'Prendas delicadas', basePrice: 5.5, estimatedHours: 48, iconKey: 'dress' },
  { id: 'g-4', name: 'Ropa interior (pack x3)', category: 'Ropa íntima', basePrice: 2.0, estimatedHours: 24, iconKey: 'underwear' },
  { id: 'g-6', name: 'Juego de Sábanas', category: 'Hogar', basePrice: 4.5, estimatedHours: 24, iconKey: 'bedding' },
  { id: 'g-7', name: 'Edredón / Plumón', category: 'Hogar', basePrice: 8.0, estimatedHours: 48, iconKey: 'comforter' },
];

const catalogServices: CatalogService[] = [
  { id: 's-1', name: 'Lavado ecológico', description: 'Lavado suave con agua ozonizada', extraPrice: 0.0 },
  { id: 's-2', name: 'Lavado + Secado', description: 'Lavado completo y secado controlado', extraPrice: 0.5 },
  { id: 's-3', name: 'Lavado + Planchado', description: 'Servicio integral anti-arrugas', extraPrice: 1.5 },
  { id: 's-4', name: 'Solo Planchado', description: 'Prensado profesional y colgado', extraPrice: 1.0 },
];

const catalogExtras: OrderExtra[] = [
  { id: 'ext-1', name: 'Doblado especial tipo hotel', description: 'Prendas listas para closet', price: 1.5 },
  { id: 'ext-2', name: 'Perfumado Clean & Fresh', description: 'Esencia botánica fresca', price: 1.0 },
  { id: 'ext-3', name: 'Empaque premium biodegradable', description: 'Bolsas de algodón y fundas reutilizables', price: 2.0 },
];

const availablePromos: PromoCode[] = [
  { code: 'FRESH10', discountPercent: 10.0, description: '10% de descuento en tu servicio', validUntil: '31 Oct 2026' },
  { code: 'BIENVENIDO', fixedDiscount: 5.0, minOrderAmount: 20.0, description: '$5.00 off en pedidos > $20', validUntil: '15 Nov 2026' },
];

const loyaltyRewards: LoyaltyReward[] = [
  { id: 'rew-1', title: 'Lavado gratis de edredón', pointsCost: 600, description: 'Válido para cualquier pedido', category: 'Hogar' },
  { id: 'rew-2', title: 'Cupón de $10.00 de saldo', pointsCost: 500, description: 'Se acredita a tu Billetera Laundry', category: 'Saldo' },
];

const membershipPlans: MembershipPlan[] = [
  { id: 'plan-basic', name: 'Básico', priceMonthly: 9.99, weeklyPickups: 1, garmentDiscountPercent: 5, benefits: ['1 recogida semanal', '5% de descuento'] },
  { id: 'plan-standard', name: 'Estándar', priceMonthly: 19.99, weeklyPickups: 2, garmentDiscountPercent: 12, benefits: ['2 recogidas semanales', '12% de descuento', 'Perfumado cortesía'], isCurrent: true },
  { id: 'plan-premium', name: 'Premium', priceMonthly: 34.99, weeklyPickups: 4, garmentDiscountPercent: 20, benefits: ['Recogidas ilimitadas', '20% off', 'Atención VIP 24/7'] },
];

const LaundryContext = createContext<LaundryContextType | undefined>(undefined);

export const LaundryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [driver, setDriver] = useState<Driver>(initialDriver);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    { id: 'tx-1', amount: 20.0, type: 'CREDIT', reference: 'Recarga Tarjeta', description: 'Recarga mediante Visa •••• 4242', date: 'Hoy 08:30' },
    { id: 'tx-2', amount: 14.6, type: 'DEBIT', reference: 'SOL-4587', description: 'Pago de servicio de lavandería', date: 'Ayer 15:20' },
  ]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({
    'SOL-4587': [
      { id: 'm1', orderId: 'SOL-4587', senderId: 'drv-1', senderName: 'Carlos Mendoza', senderRole: 'CHOFER', text: '¡Hola María! Ya voy en camino a tu domicilio.', timestamp: '15:40', isMine: false },
      { id: 'm2', orderId: 'SOL-4587', senderId: 'cust-1', senderName: 'María Torres', senderRole: 'CLIENTE', text: '¡Hola Carlos! Perfecto, las prendas están listas en conserjería.', timestamp: '15:42', isMine: true },
    ],
  });

  const activeOrder = orders.find((o) => o.status !== 'DELIVERED' && o.status !== 'CLOSED' && o.status !== 'CANCELLED');

  const createOrder = (
    items: OrderItem[],
    extras: OrderExtra[],
    pickup: PickupInfo,
    delivery: DeliveryInfo,
    pricing: OrderPricing,
    promoCode: string | null,
    paymentMethod: string
  ): Order => {
    const nextNum = 4588 + orders.length;
    const orderId = `SOL-${nextNum}`;
    const newOrder: Order = {
      id: orderId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      status: 'PICKUP_ASSIGNED',
      items,
      extras,
      pricing,
      promotionCode: promoCode,
      pickup,
      delivery,
      assignedDriverId: driver.id,
      assignedDriverName: driver.name,
      assignedDriverPhone: driver.phone,
      assignedDriverVehicle: `${driver.vehicleModel} (${driver.vehicleColor})`,
      assignedDriverPlate: driver.vehiclePlate,
      paymentMethod,
      paymentStatus: 'PAGADO',
      createdAt: 'Hoy 16:00',
      timeline: [
        { status: 'CREATED', title: 'Solicitud creada', description: 'Solicitud recibida', timestamp: '16:00', completed: true },
        { status: 'PICKUP_ASSIGNED', title: 'Chofer asignado', description: `${driver.name} asignado`, timestamp: '16:00', completed: true },
        { status: 'HEADING_TO_PICKUP', title: 'Chofer en camino', description: 'En ruta de recogida', timestamp: 'Pendiente', completed: false },
        { status: 'PICKED_UP', title: 'Ropa recogida', description: 'Prendas recogidas', timestamp: 'Pendiente', completed: false },
        { status: 'AT_FACILITY', title: 'En planta', description: 'En planta central', timestamp: 'Pendiente', completed: false },
        { status: 'IN_PROCESS', title: 'En lavado', description: 'Cuidado y planchado', timestamp: 'Pendiente', completed: false },
        { status: 'READY_FOR_DELIVERY', title: 'Lista para entrega', description: 'Empaque listo', timestamp: 'Pendiente', completed: false },
        { status: 'DELIVERED', title: 'Entregada', description: 'Entregado al cliente', timestamp: 'Pendiente', completed: false },
      ],
    };

    if (paymentMethod.includes('Billetera')) {
      setCustomer((prev) => ({
        ...prev,
        walletBalance: Math.max(0, prev.walletBalance - pricing.total),
        loyaltyPoints: prev.loyaltyPoints + Math.floor(pricing.total * 10),
      }));
    }

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const sendChatMessage = (orderId: string, senderRole: 'CLIENTE' | 'CHOFER', text: string) => {
    const isMine = senderRole === 'CLIENTE';
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      orderId,
      senderId: senderRole === 'CLIENTE' ? customer.id : driver.id,
      senderName: senderRole === 'CLIENTE' ? customer.name : driver.name,
      senderRole,
      text,
      timestamp: 'Ahora',
      isMine,
    };
    setChatMessages((prev) => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), msg],
    }));
  };

  const addWalletCredit = (amount: number) => {
    setCustomer((prev) => ({ ...prev, walletBalance: prev.walletBalance + amount }));
    setWalletTransactions((prev) => [
      { id: `tx-${Date.now()}`, amount, type: 'CREDIT', reference: 'Recarga Online', description: 'Recarga Billetera', date: 'Hoy' },
      ...prev,
    ]);
  };

  const redeemReward = (reward: LoyaltyReward): boolean => {
    if (customer.loyaltyPoints < reward.pointsCost) return false;
    setCustomer((prev) => ({ ...prev, loyaltyPoints: prev.loyaltyPoints - reward.pointsCost }));
    return true;
  };

  const setDriverOperationalStatus = (status: OperationalStatus) => {
    setDriver((prev) => ({ ...prev, operationalStatus: status }));
  };

  const driverStartPickupNavigation = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'HEADING_TO_PICKUP' } : o))
    );
    setDriver((prev) => ({ ...prev, operationalStatus: 'ON_SERVICE' }));
  };

  const driverConfirmPickup = (orderId: string, count: number, notes: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'PICKED_UP',
              pickup: { ...o.pickup, garmentCountConfirmed: count, notes: notes || o.pickup.notes },
            }
          : o
      )
    );
  };

  const driverConfirmDelivery = (orderId: string, recipient: string, relation: string, notes: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'DELIVERED',
              delivery: { ...o.delivery, recipientName: recipient, recipientRelationship: relation, deliveryNotes: notes },
            }
          : o
      )
    );
    setDriver((prev) => ({
      ...prev,
      operationalStatus: 'AVAILABLE',
      completedDeliveriesCount: prev.completedDeliveriesCount + 1,
    }));
  };

  const submitKyc = (docType: string, docId: string) => {
    setCustomer((prev) => ({
      ...prev,
      kycStatus: 'PENDING',
      kycDocumentType: docType,
      kycDocumentId: docId,
    }));
  };

  return (
    <LaundryContext.Provider
      value={{
        customer,
        driver,
        orders,
        activeOrder,
        chatMessages,
        walletTransactions,
        membershipPlans,
        catalogGarments,
        catalogServices,
        catalogExtras,
        availablePromos,
        loyaltyRewards,
        createOrder,
        sendChatMessage,
        addWalletCredit,
        redeemReward,
        setDriverOperationalStatus,
        driverStartPickupNavigation,
        driverConfirmPickup,
        driverConfirmDelivery,
        submitKyc,
      }}
    >
      {children}
    </LaundryContext.Provider>
  );
};

export const useLaundry = () => {
  const context = useContext(LaundryContext);
  if (!context) {
    throw new Error('useLaundry must be used within a LaundryProvider');
  }
  return context;
};
