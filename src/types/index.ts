export type OrderStatus =
  | 'CREATED'
  | 'PICKUP_PENDING'
  | 'PICKUP_ASSIGNED'
  | 'HEADING_TO_PICKUP'
  | 'ARRIVED_FOR_PICKUP'
  | 'PICKED_UP'
  | 'HEADING_TO_FACILITY'
  | 'AT_FACILITY'
  | 'IN_PROCESS'
  | 'QUALITY_CONTROL'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERY_SCHEDULED'
  | 'DELIVERY_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CLOSED'
  | 'INCIDENT'
  | 'CANCELLED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'Solicitud creada',
  PICKUP_PENDING: 'Recogida pendiente',
  PICKUP_ASSIGNED: 'Chofer asignado',
  HEADING_TO_PICKUP: 'Chofer en camino',
  ARRIVED_FOR_PICKUP: 'Chofer en tu dirección',
  PICKED_UP: 'Ropa recogida',
  HEADING_TO_FACILITY: 'En camino a planta',
  AT_FACILITY: 'En planta',
  IN_PROCESS: 'En lavado y cuidado',
  QUALITY_CONTROL: 'Control de calidad',
  READY_FOR_DELIVERY: 'Lista para entrega',
  DELIVERY_SCHEDULED: 'Entrega programada',
  DELIVERY_ASSIGNED: 'Chofer de entrega asignado',
  OUT_FOR_DELIVERY: 'En camino a entrega',
  ARRIVED_FOR_DELIVERY: 'Chofer en tu puerta',
  DELIVERED: 'Entregado',
  CLOSED: 'Finalizado',
  INCIDENT: 'Incidencia',
  CANCELLED: 'Cancelado',
};

export interface OrderItem {
  id: string;
  garmentType: string;
  quantity: number;
  serviceType: string;
  unitPrice: number;
  notes?: string;
  iconName?: string;
}

export interface OrderExtra {
  id: string;
  name: string;
  description: string;
  price: number;
  selected?: boolean;
}

export interface OrderPricing {
  itemsSubtotal: number;
  extrasTotal: number;
  discount: number;
  membershipBenefitDiscount: number;
  deliveryFee: number;
  total: number;
}

export interface PickupInfo {
  addressId: string;
  addressTitle: string;
  addressFull: string;
  date: string;
  timeSlot: string;
  notes?: string;
  pickedUpAt?: string | null;
  garmentCountConfirmed?: number | null;
  evidencePhotoUri?: string | null;
}

export interface DeliveryInfo {
  addressId: string;
  addressTitle: string;
  addressFull: string;
  date: string;
  timeSlot: string;
  recipientName?: string | null;
  recipientRelationship?: string | null;
  deliveredAt?: string | null;
  deliveryNotes?: string | null;
  evidencePhotoUri?: string | null;
}

export interface TimelineEvent {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  priority?: boolean;
  items: OrderItem[];
  extras: OrderExtra[];
  pricing: OrderPricing;
  promotionCode?: string | null;
  pickup: PickupInfo;
  delivery: DeliveryInfo;
  facilityName?: string;
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
  assignedDriverPhone?: string | null;
  assignedDriverVehicle?: string | null;
  assignedDriverPlate?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  timeline: TimelineEvent[];
  createdAt: string;
}

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type OperationalStatus = 'AVAILABLE' | 'ON_SERVICE' | 'BREAK' | 'OFFLINE';

export interface Address {
  id: string;
  title: string;
  fullAddress: string;
  reference?: string;
  isPrimary: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: KycStatus;
  kycRejectionReason?: string | null;
  kycDocumentId?: string | null;
  kycDocumentType: string;
  addresses: Address[];
  walletBalance: number;
  loyaltyPoints: number;
  membershipTier: string;
  billingName: string;
  billingTaxId: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  operationalStatus: OperationalStatus;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  facilityName: string;
  zoneName: string;
  mustChangePassword: boolean;
  currentLat: number;
  currentLng: number;
  completedDeliveriesCount: number;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CLIENTE' | 'CHOFER';
  text: string;
  timestamp: string;
  isMine: boolean;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'ADJUSTMENT';
  reference: string;
  description: string;
  date: string;
}

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

export interface PromoCode {
  code: string;
  discountPercent?: number;
  fixedDiscount?: number;
  minOrderAmount?: number;
  description: string;
  validUntil: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  pointsCost: number;
  description: string;
  category: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  priceMonthly: number;
  weeklyPickups: number;
  garmentDiscountPercent: number;
  benefits: string[];
  isCurrent?: boolean;
}
