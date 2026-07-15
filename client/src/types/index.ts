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
  name: string
  price: number
  description: string
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

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
export type PaymentMethod = 'card' | 'staff_assisted'
export type OrderPaymentStatus = 'unpaid' | 'paid' | 'awaiting_confirmation'

export interface CreateOrderPayload {
  tableId: string
  tableNumber: number
  items: OrderItemPayload[]
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: OrderPaymentStatus
  needsAssistance?: boolean
  reservationId?: string
}

export interface OrderRecord {
  _id: string
  tableId: string
  tableNumber: number
  items: OrderItemPayload[]
  total: number
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

export type UserRole = 'customer' | 'waiter' | 'kitchen' | 'manager' | 'admin'

export interface AuthUser {
  _id: string
  name: string
  email: string
  role: UserRole
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
  salary: number
  hiredAt: string
  isActive: boolean
}



export type NotificationRole =
  | 'Admin'
  | 'Waiter'
  | 'Customer'

export type NotificationType =
  | 'Order'
  | 'Reservation'
  | 'Assistance'
  | 'General'
  | 'Urgent'

export type NotificationAccountModel =
  | 'User'
  | 'Customer'

export interface NotificationSender {
  _id: string
  name?: string
  email?: string
  role?: string
}

export interface NotificationRecord {
  _id: string
  message: string
  type: NotificationType

  senderId:
    | string
    | NotificationSender

  senderModel: NotificationAccountModel
  senderRole: NotificationRole

  recipientRole: NotificationRole
  recipientId?: string
  recipientModel?: NotificationAccountModel

  isRead: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateNotificationPayload {
  message: string
  type: NotificationType
  recipientRole: NotificationRole

  // Leave empty to send to everyone
  // belonging to recipientRole.
  recipientId?: string
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
  tables: number
  coversSeated: number
  available: number
  seated: number
  inThePass: number
  serving: number
}
