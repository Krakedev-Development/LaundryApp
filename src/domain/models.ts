export type Role = "CLIENT" | "DRIVER";
export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
export type OperationalStatus =
  "AVAILABLE" | "ON_SERVICE" | "BREAK" | "OFFLINE";
export type Method = "DRIVER" | "CUSTOMER";
export type Mode = "HOME_HOME" | "HOME_STORE" | "STORE_HOME" | "STORE_STORE";
export type PricingModel = "FIXED" | "PER_WEIGHT";
export type PricingStatus =
  | "ESTIMATED"
  | "PENDING_WEIGHT"
  | "CALCULATED"
  | "ADJUSTMENT_PENDING"
  | "FINAL";
export type OrderStatus = keyof typeof statusLabels;
export const statusLabels = {
  CREATED: "Solicitud creada",
  DRAFT: "Borrador",
  PAYMENT_PENDING: "Pago pendiente",
  CONFIRMED: "Solicitud confirmada",
  AWAITING_INTAKE: "Esperando entrega en sede",
  PICKUP_PENDING: "Recogida pendiente",
  PICKUP_ASSIGNED: "Chofer asignado",
  HEADING_TO_PICKUP: "Chofer en camino",
  ARRIVED_FOR_PICKUP: "Chofer en tu dirección",
  PICKED_UP: "Ropa recogida",
  HEADING_TO_FACILITY: "En camino a planta",
  AT_FACILITY: "En planta",
  WEIGHING: "Pesaje en curso",
  INSPECTION: "Inspección de prendas",
  PRICING_PENDING: "Cálculo de valor final",
  CUSTOMER_APPROVAL_PENDING: "Requiere tu aprobación",
  IN_PROCESS: "En lavado y cuidado",
  QUALITY_CONTROL: "Control de calidad",
  READY_FOR_DELIVERY: "Lista para entrega",
  READY_FOR_PICKUP: "Lista para retirar en sede",
  DELIVERY_SCHEDULED: "Entrega programada",
  DELIVERY_ASSIGNED: "Chofer de entrega asignado",
  OUT_FOR_DELIVERY: "En camino a entrega",
  ARRIVED_FOR_DELIVERY: "Chofer en tu puerta",
  DELIVERED: "Entregado",
  COMPLETED: "Completado",
  CLOSED: "Finalizado",
  INCIDENT: "Incidencia en revisión",
  CANCELLED: "Cancelado",
} as const;
export const modeLabels: Record<Mode, string> = {
  HOME_HOME: "Domicilio a domicilio",
  HOME_STORE: "Domicilio a retiro en sede",
  STORE_HOME: "Entrega en sede a domicilio",
  STORE_STORE: "Entrega y retiro en sede",
};
export const operationalLabels: Record<OperationalStatus, string> = {
  AVAILABLE: "Disponible",
  ON_SERVICE: "En servicio",
  BREAK: "En pausa",
  OFFLINE: "Desconectado",
};
export const pricingLabels: Record<PricingStatus, string> = {
  ESTIMATED: "Estimado",
  PENDING_WEIGHT: "Pendiente de pesaje",
  CALCULATED: "Calculado por planta",
  ADJUSTMENT_PENDING: "Ajuste pendiente",
  FINAL: "Precio final",
};
export type HandoffType =
  | "CUSTOMER_TO_DRIVER"
  | "CUSTOMER_TO_FACILITY"
  | "DRIVER_TO_FACILITY"
  | "FACILITY_TO_DRIVER"
  | "DRIVER_TO_CUSTOMER"
  | "FACILITY_TO_CUSTOMER";
export const handoffLabels: Record<HandoffType, string> = {
  CUSTOMER_TO_DRIVER: "Código de entrega al chofer",
  CUSTOMER_TO_FACILITY: "QR de entrega en sede",
  DRIVER_TO_FACILITY: "Ingreso a planta",
  FACILITY_TO_DRIVER: "Despacho desde planta",
  DRIVER_TO_CUSTOMER: "Código de entrega final",
  FACILITY_TO_CUSTOMER: "QR de retiro en sede",
};
export interface Address {
  id: string;
  title: string;
  fullAddress: string;
  reference: string;
  isPrimary: boolean;
  latitude: number;
  longitude: number;
}
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: KycStatus;
  kycRejectionReason?: string;
  kycDocumentId?: string;
  kycDocumentType: string;
  documentUri?: string;
  selfieUri?: string;
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
export interface Facility {
  id: string;
  name: string;
  address: string;
  openingHours: string;
  phone: string;
  acceptsDropoff: boolean;
  allowsPickup: boolean;
  latitude: number;
  longitude: number;
}
export interface TimeSlot {
  id: string;
  context:
    | "DRIVER_PICKUP"
    | "DRIVER_DELIVERY"
    | "FACILITY_DROPOFF"
    | "FACILITY_PICKUP";
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  reservedCount: number;
  active: boolean;
}
export interface Leg {
  method: Method;
  facilityId?: string;
  facilityName?: string;
  addressId?: string;
  addressFull: string;
  scheduledDate: string;
  timeSlotId?: string;
  timeSlotText: string;
  status: string;
  completedAt?: string;
  latitude: number;
  longitude: number;
}
export interface FulfillmentPlan {
  mode: Mode;
  inbound: Leg;
  outbound: Leg;
}
export interface OrderItem {
  id: string;
  garmentType: string;
  quantity: number;
  serviceType: string;
  unitPrice: number;
  notes: string;
  iconName: string;
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
  notes: string;
  pickedUpAt?: string;
  garmentCountConfirmed?: number;
  evidencePhotoUri?: string;
}
export interface DeliveryInfo {
  addressId: string;
  addressTitle: string;
  addressFull: string;
  date: string;
  timeSlot: string;
  recipientName?: string;
  recipientRelationship?: string;
  deliveredAt?: string;
  deliveryNotes?: string;
  evidencePhotoUri?: string;
}
export interface TimelineEvent {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}
export interface Handoff {
  id: string;
  orderId: string;
  type: HandoffType;
  status: "PENDING" | "ACTIVE" | "USED" | "EXPIRED" | "REVOKED";
  qrToken: string;
  fallbackCode: string;
  title: string;
  description: string;
  createdAt: string;
  usedAt?: string;
}
export interface Adjustment {
  id: string;
  orderId: string;
  type:
    | "SERVICE_RECLASSIFICATION"
    | "EXTRA_ITEM"
    | "WEIGHT_ADJUSTMENT"
    | "PRICE_ADJUSTMENT";
  description: string;
  amountDifference: number;
  requiresCustomerApproval: boolean;
  status: "PENDING_CUSTOMER" | "APPROVED" | "REJECTED";
  createdAt: string;
  resolvedAt?: string;
}
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  priority: boolean;
  items: OrderItem[];
  extras: OrderExtra[];
  pricing: OrderPricing;
  promotionCode?: string;
  pickup: PickupInfo;
  delivery: DeliveryInfo;
  facilityName: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedDriverVehicle?: string;
  assignedDriverPlate?: string;
  paymentMethod: string;
  paymentStatus: "PAGADO" | "PENDIENTE" | "PENDIENTE_PESO" | "REEMBOLSADO";
  timeline: TimelineEvent[];
  createdAt: string;
  fulfillmentPlan: FulfillmentPlan;
  pricingModel: PricingModel;
  pricingStatus: PricingStatus;
  weightLb?: number;
  weightKg?: number;
  estimatedWeightLb?: number;
  pricePerLb: number;
  handoffs: Handoff[];
  adjustments: Adjustment[];
  canChangeOutboundMethod: boolean;
}
export interface CustomerCharge {
  id: string;
  customerId: string;
  orderId?: string;
  type: "LATE_CANCELLATION" | "NO_SHOW" | "FAILED_PICKUP" | "OTHER";
  amount: number;
  status: "PENDING" | "PAID" | "WAIVED";
  reason: string;
  createdAt: string;
  paidAt?: string;
}
export interface WalletTransaction {
  id: string;
  customerId: string;
  amount: number;
  type: "CREDIT" | "DEBIT" | "REFUND" | "ADJUSTMENT";
  reference: string;
  description: string;
  date: string;
}
export interface LoyaltyReward {
  id: string;
  title: string;
  pointsCost: number;
  description: string;
  category: string;
}
export interface LoyaltyRedemption {
  id: string;
  customerId: string;
  rewardTitle: string;
  pointsCost: number;
  date: string;
  status: string;
}
export interface Promo {
  code: string;
  discountPercent: number;
  fixedDiscount: number;
  minOrderAmount: number;
  description: string;
  validUntil: string;
}
export interface MembershipPlan {
  id: string;
  name: string;
  priceMonthly: number;
  weeklyPickups: number;
  garmentDiscountPercent: number;
  benefits: string[];
}
export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  timestamp: string;
}
export interface NotificationItem {
  id: string;
  customerId: string;
  title: string;
  body: string;
  category: string;
  timeAgo: string;
  isRead: boolean;
  relatedOrderId?: string;
}
export interface Account {
  id: string;
  email: string;
  role: Role;
  passwordHash: string;
}
export interface Session {
  id: string;
  role: Role;
}
export interface AppState {
  version: 1;
  customers: Customer[];
  driver: Driver;
  session: Session | null;
  accounts: Account[];
  orders: Order[];
  customerCharges: CustomerCharge[];
  walletTransactions: WalletTransaction[];
  loyaltyRedemptions: LoyaltyRedemption[];
  notifications: NotificationItem[];
  chatMessages: Record<string, ChatMessage[]>;
  timeSlots: TimeSlot[];
  rescheduleRequests: {
    id: string;
    orderId: string;
    leg: "INBOUND" | "OUTBOUND";
    newDate: string;
    newTimeSlot: string;
    createdAt: string;
  }[];
}
export const terminalStatuses: OrderStatus[] = [
  "DELIVERED",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
];
export const pickupStatuses: OrderStatus[] = [
  "PICKUP_ASSIGNED",
  "HEADING_TO_PICKUP",
  "ARRIVED_FOR_PICKUP",
  "PICKED_UP",
  "HEADING_TO_FACILITY",
];
export const deliveryStatuses: OrderStatus[] = [
  "DELIVERY_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "ARRIVED_FOR_DELIVERY",
];
export function modeFor(inbound: Method, outbound: Method): Mode {
  return `${inbound === "DRIVER" ? "HOME" : "STORE"}_${outbound === "DRIVER" ? "HOME" : "STORE"}` as Mode;
}
export const money = (n: number) => `$${n.toFixed(2)}`;
export const round = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export const garmentCount = (o: Order) =>
  o.items.reduce((sum, i) => sum + i.quantity, 0);
export const canTrack = (o: Order) =>
  ["HEADING_TO_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status);
