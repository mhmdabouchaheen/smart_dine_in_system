// Shared domain types. Field names mirror the planned Mongoose schemas
// (see mermaid ERD) so the mock layer and the future API responses
// share one shape and components never need to change.

export type TableStatus = 'available' | 'seated' | 'in_the_pass' | 'serving' | 'resetting' | 'reserved'

export interface TableEntity {
  _id: string
  tableNumber: number
  zone: string // e.g. Hearth, Cellar, Forge
  capacity: number
  status: TableStatus
  qrCodeId?: string
  // Live-service fields (populated when a table is occupied)
  currentOrder?: {
    party: number
    course: number
    courseName: string
    seatedAt: string
    prepProgress: number // 0-100
    prepEta?: string
    serveProgress: number // 0-100
    serveEta?: string
    note?: string
  }
}

export interface QRCodeRecord {
  _id: string
  tableId: string
  tableNumber: number
  qrToken: string
  url: string
  createdAt: string
}

export interface Category {
  _id: string
  index: string
  name: string
  latin: string
  quote: string
  servedNote: string
}

export interface RecipeLine {
  ingredientId: string
  quantityRequired: number
}

export interface MenuItem {
  _id: string
  categoryId: string
  course: number
  no: string
  name: string
  tagline: string
  price: number
  description: string
  composition: string[]
  pairing: string
  image: string
  isBestSeller?: boolean
  isSeasonal?: boolean
  soldCount?: number
  recipe?: RecipeLine[]
  prepTimeMinutes?: number
}

export interface Ingredient {
  _id: string
  name: string
  quantityInStock: number
  unit: 'kg' | 'g' | 'L' | 'ml' | 'pieces'
  reorderThreshold: number
}

export interface StockIssue {
  menuItemId: string
  menuItemName: string
  ingredientName: string
  needed: number
  available: number
  unit: string
}

export interface StockCheckResult {
  ok: boolean
  issues: StockIssue[]
}

export interface CartItem {
  _id: string
  name: string
  price: number
  qty: number
  image?: string
}

export interface OrderItemPayload {
  menuItemId: string
  name: string
  qty: number
  price: number
}

export interface BackendOrderItemPayload {
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
  specialInstructions: string
}

export interface UpdateOrderPayload {
  items?: BackendOrderItemPayload[]
  totalAmount?: number
  status?: string
  paymentStatus?: string
  needsAssistance?: boolean
  note?: string
  noteAt?: string
  customerId?: string
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
export type PaymentMethod = 'card' | 'staff_assisted'
export type OrderPaymentStatus = 'unpaid' | 'paid' | 'awaiting_confirmation'

export interface CreateOrderPayload {
  tableId: string
  tableNumber: number
  items: OrderItemPayload[]
  total?: number
  totalAmount?: number
  paymentMethod: PaymentMethod
  paymentStatus: OrderPaymentStatus
  needsAssistance?: boolean
  customerId?: string
  userId?: string
}

export interface OrderRecord {
  _id: string
  tableId: string
  tableNumber: number
  customerId?: string
  customerIds?: string[]
  userId?: string
  userIds?: string[]
  items: OrderItemPayload[]
  total: number
  loyaltyDiscount?: number
  amountDue?: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: OrderPaymentStatus
  needsAssistance: boolean
  note?: string
  noteAt?: string
  createdAt: string
  updatedAt: string
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'cancelled'
  | 'no_show'

export interface ReservationPayload {
  tableId: string
  name: string
  email: string
  phone: string
  date: string
  time: string
  partySize: number
  notes?: string
}

export interface ReservationRecord extends ReservationPayload {
  _id: string
  status: ReservationStatus
  depositAmount: number
  paymentId?: string
  createdAt: string
}

export interface PaymentPayload {
  amount: number
  method: 'card'
  cardName: string
  cardNumberLast4: string
  reservationId?: string
  orderId?: string
}

export interface PaymentRecord extends PaymentPayload {
  _id: string
  status: 'succeeded' | 'failed'
  paidAt: string
}

export type UserRole = 'customer' | 'staff' | 'admin'

export interface AuthUser {
  _id: string
  name: string
  email: string
  role: UserRole
  position?: string // staff/admin job title
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  name: string
  email: string
  phone: string
  password: string
}

export interface Employee {
  _id: string
  name: string
  email: string
  phone: string
  role: UserRole
  position: string
  salary: number
  hiredAt: string
  status: 'active' | 'suspended'
}

export type NotificationType = 'order' | 'reservation' | 'inventory' | 'system'

export interface NotificationRecord {
  _id: string
  userId: string
  type: NotificationType
  message: string
  referenceId?: string
  isRead: boolean
  createdAt: string
}

export interface AssistanceRequestPayload {
  tableNumber: number
  orderId?: string
  reason: string
}

export interface TopCustomer {
  customerId: string
  name: string
  email: string
  totalSpent: number
  visits: number
}

export interface BestSellingDish {
  menuItemId: string
  name: string
  unitsSold: number
  revenue: number
}

export interface DashboardStats {
  revenueToday: number
  revenueThisMonth: number
  ordersToday: number
  avgOrderValue: number
  topCustomers: TopCustomer[]
  bestSellers: BestSellingDish[]
  revenueByDay: { day: string; revenue: number }[]
}

export interface FloorStats {
  tables: number;
  coversSeated: number;
  available: number;
  seated: number;
  inThePass: number;
  serving: number;
}

export * from './loyalty';

