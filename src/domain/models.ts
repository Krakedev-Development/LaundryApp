export const ORDER_STATES = [
  "CREATED",
  "PICKUP_PENDING",
  "PICKUP_ASSIGNED",
  "HEADING_TO_PICKUP",
  "ARRIVED_FOR_PICKUP",
  "PICKED_UP",
  "HEADING_TO_FACILITY",
  "AT_FACILITY",
  "IN_PROCESS",
  "QUALITY_CONTROL",
  "READY_FOR_DELIVERY",
  "DELIVERY_SCHEDULED",
  "DELIVERY_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "ARRIVED_FOR_DELIVERY",
  "DELIVERED",
  "CLOSED",
  "INCIDENT",
  "QUARANTINE",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATES)[number];
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: "Solicitud confirmada",
  PICKUP_PENDING: "Esperando chofer",
  PICKUP_ASSIGNED: "Chofer asignado",
  HEADING_TO_PICKUP: "Tu chofer está en camino",
  ARRIVED_FOR_PICKUP: "Tu chofer ha llegado",
  PICKED_UP: "Tu ropa fue recogida",
  HEADING_TO_FACILITY: "Camino a nuestra planta",
  AT_FACILITY: "Tu ropa llegó a nuestra planta",
  IN_PROCESS: "Estamos preparando tu ropa",
  QUALITY_CONTROL: "Revisando cada detalle",
  READY_FOR_DELIVERY: "Lista para volver a casa",
  DELIVERY_SCHEDULED: "Entrega programada",
  DELIVERY_ASSIGNED: "Ya preparamos tu entrega",
  OUT_FOR_DELIVERY: "Tu entrega está en camino",
  ARRIVED_FOR_DELIVERY: "Tu entrega ha llegado",
  DELIVERED: "Pedido entregado",
  CLOSED: "Pedido finalizado",
  INCIDENT: "Estamos atendiendo una incidencia",
  QUARANTINE: "Tu pedido necesita una revisión",
  CANCELLED: "Pedido cancelado",
};
export type Role = "CLIENTE" | "CHOFER";
export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
export type OperationalStatus =
  "AVAILABLE" | "ON_SERVICE" | "BREAK" | "OFFLINE";
export interface Coordinates {
  lat: number;
  lng: number;
}
export interface Address {
  id: string;
  title: string;
  fullAddress: string;
  reference: string;
  isPrimary: boolean;
  coordinates: Coordinates;
  persistence?: "permanent" | "user" | "demo" | "temporary";
}
export interface BillingData {
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
}
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: KycStatus;
  kycRejectionReason?: string;
  addresses: Address[];
  membershipId: string;
  membershipRenewal: string;
  walletId: string;
  rewardAccountId: string;
  billingData: BillingData;
  notificationPreferences: boolean;
  previousPurchases: number;
  previousSpend: number;
}
export interface Driver {
  id: string;
  name: string;
  email: string;
  operationalStatus: OperationalStatus;
  vehicle: string;
  plate: string;
  facilityId: string;
  zoneName: string;
  location: Coordinates;
  locationUpdatedAt?: string;
  trackingEtaSeconds?: number;
  locationSimulated?: boolean;
  zoneId?: string;
  authorizedZoneIds?: string[];
  maxOrders?: number;
  accuracy?: number;
  mustChangePassword: boolean;
  locationAllowed: boolean;
}
export interface Facility {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}
export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedHours: number;
  category: "PRENDAS" | "SERVICIOS" | "EXTRAS";
  active: boolean;
  customerSelectable: boolean;
}
export interface Service {
  id: string;
  name: string;
  price: number;
  estimatedHours: number;
  active: boolean;
  customerSelectable: boolean;
}
export interface OrderItem {
  id: string;
  catalogId: string;
  serviceId: string;
  name: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}
export interface OrderPricing {
  itemsSubtotal: number;
  extrasTotal: number;
  discount: number;
  membershipBenefitDiscount: number;
  rewardDiscount?: number;
  deliveryFee: number;
  total: number;
}
export interface Schedule {
  address: Address;
  date: string;
  timeSlot: string;
  driverAssignmentId?: string;
  completedAt?: string;
  notes: string;
}
export interface Delivery extends Schedule {
  recipient?: { name: string; relationship: string };
  evidence?: string;
  driverId?: string;
}
export interface TimelineEvent {
  id: string;
  status: OrderStatus;
  timestamp: string;
  actorId: string;
  notes?: string;
  syncStatus: "SYNCED" | "PENDING";
}
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  priority: "URGENT" | "NORMAL";
  items: OrderItem[];
  extras: CatalogItem[];
  pricing: OrderPricing;
  promotionId?: string;
  promotionCode?: string;
  membershipBenefits: string[];
  rewardRedemptionId?: string;
  pickup: Schedule;
  delivery: Delivery;
  facilityId: string;
  assignments: string[];
  timeline: TimelineEvent[];
  incidents: { id: string; description: string; date: string }[];
  payment: Payment;
  createdAt: string;
  updatedAt: string;
}
export interface DriverAssignment {
  id: string;
  orderId: string;
  driverId: string;
  type: "PICKUP" | "DELIVERY";
  status: "ASSIGNED" | "ACTIVE" | "COMPLETED";
  assignedAt: string;
  startedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  expectedCount?: number;
  actualCount?: number;
  evidence?: string;
}
export interface DriverRoute {
  driverId: string;
  date: string;
  assignments: DriverAssignment[];
  estimatedDistance: number;
  estimatedDuration: number;
  currentStopIndex: number;
}
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: "PAID" | "PENDING" | "REFUNDED";
  method: string;
  transactionReference: string;
  createdAt: string;
}
export interface PaymentCard {
  id: string;
  customerId: string;
  brand: string;
  last4: string;
  expiry: string;
  primary: boolean;
}
export interface Wallet {
  id: string;
  customerId: string;
}
export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: "CREDIT" | "DEBIT" | "REFUND" | "ADJUSTMENT";
  reference: string;
  description: string;
  date: string;
}
export interface PointsEntry {
  id: string;
  customerId: string;
  points: number;
  type: "EARN" | "REDEEM" | "ADJUSTMENT" | "EXPIRATION";
  reference: string;
  date: string;
}
export interface Promotion {
  id: string;
  name: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  usageLimit: number;
  usageCount: number;
  perCustomerLimit: number;
  firstOrderOnly: boolean;
  applicableServices: string[];
  startDate: string;
  endDate: string;
  status: string;
}
export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  minPurchases: number;
  minSpend: number;
  validityDays: number;
  active: boolean;
  walletCredit?: number;
}
export interface RewardRedemption {
  id: string;
  customerId: string;
  rewardId: string;
  rewardName: string;
  points: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  date: string;
  benefitApplied: boolean;
  approvedAt?: string;
  reason?: string;
}
export interface MembershipPlan {
  id: string;
  name: string;
  priceMonthly: number;
  weeklyPickups: number;
  garmentLimit?: number;
  discountPercent: number;
  benefits: string[];
}
export interface ChatMessage {
  id: string;
  orderId: string;
  customerId: string;
  driverId: string;
  senderId: string;
  senderRole: Role;
  text: string;
  date: string;
  syncStatus: "SYNCED" | "PENDING";
}
export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  entityId?: string;
  createdAt: string;
}
export interface Session {
  userId: string;
  role: Role;
}
export interface PendingOperation {
  id: string;
  orderId: string;
  eventId: string;
  date: string;
}
export interface Draft {
  items: OrderItem[];
  extraIds: string[];
  pickup?: Schedule;
  delivery?: Schedule;
  promoCode: string;
  rewardRedemptionId?: string;
  paymentMethod: string;
}
export interface AppData {
  version: 1;
  customers: Customer[];
  drivers: Driver[];
  facilities: Facility[];
  catalog: CatalogItem[];
  services: Service[];
  promotions: Promotion[];
  rewards: Reward[];
  plans: MembershipPlan[];
  orders: Order[];
  assignments: DriverAssignment[];
  wallets: Wallet[];
  walletTransactions: WalletTransaction[];
  pointsLedger: PointsEntry[];
  redemptions: RewardRedemption[];
  cards: PaymentCard[];
  messages: ChatMessage[];
  notifications: AppNotification[];
  pendingOperations: PendingOperation[];
  draft: Draft;
  sequence: number;
}
