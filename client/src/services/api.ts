import axios from 'axios'
// At the top of src/services/api.ts
import type {
  Category,
  MenuItem,
  TableEntity,
  FloorStats,
  QRCodeRecord,
  Employee,
  
  DashboardStats,
  ReservationPayload,
  ReservationRecord,
  PaymentPayload,
  PaymentRecord,
  OrderRecord,
  CreateOrderPayload,
  AssistanceRequestPayload,
  LoginPayload,
  SignupPayload,
  AuthUser,
  Ingredient,
  StockCheckResult,
  OrderItemPayload,
  UpdateOrderPayload,
  LoyaltySummary,
  LoyaltySettings as LoyaltySettingsType,
  LoyaltyTransaction,
  CalculateRedemptionResponse,
  RedeemResponse,
} from '../types'
import type {
  CreateNotificationPayload,
  NotificationRecord,
} from '../types'
import { getGuestSessionId } from '../utils/session'
// Base URL for the Express server. Set VITE_API_URL in a .env file once the
// backend (server/) is running, e.g. VITE_API_URL=http://localhost:5000/api
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const guestSessionId = getGuestSessionId()
  if (guestSessionId) {
    config.headers['x-guest-session-id'] = guestSessionId
  }
  return config
})




function normalizeCategory(category: any): Category {
  return {
    _id: category._id || `cat-${Date.now()}`,
    index: category.index || '0',
    name: category.name || 'Untitled Category',
    latin: category.latin || category.name || 'Untitled',
    quote: category.quote || '',
    servedNote: category.servedNote || '',
  }
}

function normalizeMenuItem(item: any): MenuItem {
  return {
    _id: item._id || `item-${Date.now()}`,
    categoryId: item.categoryId || '',
    name: item.name || 'Untitled Dish',
    price: Number(item.price || 0),
    description: item.description || '',
    image: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    isBestSeller: Boolean(
  item.isBestSeller ?? item.bestSeller ?? false
),

isSeasonal: Boolean(
  item.isSeasonal ?? item.seasonal ?? false
),
    soldCount: item.soldCount || 0,
    recipe: Array.isArray(item.recipe)
      ? item.recipe.map((line: any) => ({
          ingredientId: line.ingredientId || line._id || '',
          quantityRequired: Number(line.quantityRequired || 0),
        }))
      : [],
    prepTimeMinutes: Number(item.preparationTime || item.prepTimeMinutes || 10),
  }
}
function normalizeOrderStatus(status: unknown): OrderRecord['status'] {
  const normalized = String(status ?? 'pending').toLowerCase()

  const allowedStatuses: OrderRecord['status'][] = [
    'pending',
    'preparing',
    'ready',
    'served',
    'completed',
    'cancelled',
  ]

  return allowedStatuses.includes(normalized as OrderRecord['status'])
    ? (normalized as OrderRecord['status'])
    : 'pending'
}
function normalizeOrderRecord(order: any): OrderRecord {
  const rawItems = Array.isArray(order.items) ? order.items : []
  return {
    _id: order._id || `order-${Date.now()}`,
    tableId: order.tableId?._id || order.tableId || 'table-01',
    tableNumber: Number(order.tableId?.tableNumber || order.tableNumber || 1),
    customerId: order.customerId?._id || order.customerId,
    customerIds: Array.isArray(order.customerIds) ? order.customerIds.map((id: any) => id?._id || id) : [],
    userId: order.userId?._id || order.userId,
    userIds: Array.isArray(order.userIds) ? order.userIds.map((id: any) => id?._id || id) : [],
    items: rawItems.map((line: any) => ({
      menuItemId: line.menuItemId || line._id || '',
      name: line.name || 'Dish',
      qty: Number(line.quantity || line.qty || 1),
      price: Number(line.unitPrice || line.price || 0),
    })),
    total: Number(order.totalAmount || order.total || 0),
    loyaltyDiscount: order.loyaltyDiscount !== undefined ? Number(order.loyaltyDiscount) : undefined,
    amountDue: order.amountDue !== undefined ? Number(order.amountDue) : undefined,
    status: normalizeOrderStatus(order.status),
    paymentMethod: order.paymentMethod === 'staff_assisted' ? 'staff_assisted' : 'card',
    paymentStatus: String(order.paymentStatus || 'Pending').toLowerCase() === 'paid' ? 'paid' : 'unpaid',
    needsAssistance: Boolean(order.needsAssistance),
    note: order.note || '',
    noteAt: order.noteAt || order.updatedAt || new Date().toISOString(),
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
  }
}
function normalizeReservationStatus(
  status: unknown,
): ReservationRecord['status'] {
  const normalized = String(status ?? 'pending')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')

  const allowedStatuses: ReservationRecord['status'][] = [
    'pending',
    'confirmed',
    'seated',
    'cancelled',
    'no_show',
  ]

  return allowedStatuses.includes(
    normalized as ReservationRecord['status'],
  )
    ? (normalized as ReservationRecord['status'])
    : 'pending'
}
function normalizeReservationRecord(reservation: any): ReservationRecord {
  const customer = reservation.customerDetails || {}
  
  let formattedDate = ''
  let formattedTime = ''
  if (reservation.dateTime) {
    const d = new Date(reservation.dateTime)
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      formattedDate = `${y}-${m}-${day}`
      
      const hr = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      formattedTime = `${hr}:${min}`
    }
  }

  return {
    _id: reservation._id || `res-${Date.now()}`,
    tableId: reservation.tableId?._id || reservation.tableId || '',
    name: customer.fullName || customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    date: formattedDate,
    time: formattedTime,
    partySize: Number(reservation.partySize || 1),
    notes: reservation.notes || '',
    status: normalizeReservationStatus(reservation.status),
    depositAmount: Number(reservation.depositAmount || 0),
    paymentId: reservation.paymentId || '',
    createdAt: reservation.createdAt || new Date().toISOString(),
  }
}

// --- Menu ---------------------------------------------------------------
export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<any[]>('/menu/categories')
  return data.map(normalizeCategory)
}

export async function createCategory(payload: Omit<Category, '_id'>): Promise<Category> {
  const { data } = await apiClient.post<any>('/menu/categories', { name: payload.name })
  return normalizeCategory(data)
}

export async function updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/categories/${id}`, payload)
  return data
}

export async function deleteCategory(id: string): Promise<{ _id: string }> {
  const { data } = await apiClient.delete(`/categories/${id}`)
  return data
}

export async function fetchMenu(): Promise<MenuItem[]> {
  const { data: categoriesData } = await apiClient.get<any[]>('/menu/categories')
  const categories = categoriesData || []
  const allItems: MenuItem[] = []

  for (const category of categories) {
    const { data } = await apiClient.get<any[]>(`/menu/items/category/${category._id}`)
    allItems.push(...(data || []).map(normalizeMenuItem))
  }

  return allItems
}

export async function createMenuItem(payload: Omit<MenuItem, '_id'>): Promise<MenuItem> {
  const body = {
    categoryId: payload.categoryId,
    name: payload.name,
    description: payload.description,
    price: payload.price,
    imageUrl: payload.image,
    isAvailable: true,
    isBestSeller: payload.isBestSeller,
    isSeasonal: payload.isSeasonal,
    preparationTime: payload.prepTimeMinutes || 10,
    recipe: (payload.recipe || []).map((line) => ({
      ingredientId: line.ingredientId,
      quantityRequired: line.quantityRequired,
    })),
  }
  const { data } = await apiClient.post<any>('/menu/items', body)
  return normalizeMenuItem(data)
}

export async function updateMenuItem(id: string, payload: Partial<MenuItem>): Promise<MenuItem> {
  const body = {
    categoryId: payload.categoryId,
    name: payload.name,
    description: payload.description,
    price: payload.price,
    imageUrl: payload.image,
    isAvailable: true,
    isBestSeller: payload.isBestSeller,
    isSeasonal: payload.isSeasonal,
    preparationTime: payload.prepTimeMinutes || 10,
    recipe: (payload.recipe || []).map((line) => ({
      ingredientId: line.ingredientId,
      quantityRequired: line.quantityRequired,
    })),
  }
  const { data } = await apiClient.put<any>(`/menu/items/${id}`, body)
  return normalizeMenuItem(data)
}

export async function deleteMenuItem(id: string): Promise<{ _id: string }> {
  const { data } = await apiClient.put<any>(`/menu/items/${id}`, { isAvailable: false })
  return { _id: data?._id || id }
}


// --- Inventory --------------------------------------------------------------
function normalizeIngredient(item: any): Ingredient {
  return {
    _id: item._id,
    name: item.name || '',
    quantityInStock: Number(item.quantityInStock ?? 0),
    unit: item.unit,
    reorderThreshold: Number(
      item.reorderThreshold ?? item.lowStockThreshold ?? 10,
    ),
  }
}

export async function fetchIngredients(): Promise<Ingredient[]> {
  const { data } = await apiClient.get<any[]>('/inventory')
  return data.map(normalizeIngredient)
}

export async function createIngredient(
  payload: Omit<Ingredient, '_id'>,
): Promise<Ingredient> {
  const { data } = await apiClient.post<any>('/inventory', {
    name: payload.name,
    quantityInStock: payload.quantityInStock,
    unit: payload.unit,
    reorderThreshold: payload.reorderThreshold,
  })

  return normalizeIngredient(data)
}

export async function updateIngredient(
  id: string,
  payload: Partial<Ingredient>,
): Promise<Ingredient> {
  const body: Partial<Ingredient> = {
    ...payload,
  }

  const { data } = await apiClient.put<any>(
    `/inventory/${id}`,
    body,
  )

  return normalizeIngredient(data)
}

export async function deleteIngredient(
  id: string,
): Promise<{ _id: string }> {
  const { data } = await apiClient.delete<{ _id: string }>(
    `/inventory/${id}`,
  )

  return data
}
// Checks whether enough stock exists for a prospective order. Always tries
// a real endpoint first - in production this MUST be re-verified and
// applied atomically server-side (read-check-decrement in one transaction)
// to avoid a race between two guests ordering the last portions at once.
export async function checkStock(items: OrderItemPayload[]): Promise<StockCheckResult> {
  const { data } = await apiClient.post<StockCheckResult>('/inventory/check', { items })
  return data
}
function normalizeTableStatus(status: unknown): TableEntity['status'] {
  const value = String(status ?? '').trim().toLowerCase()

  switch (value) {
    case 'available':
      return 'available'

    case 'occupied':
      return 'seated'

    case 'seated':
      return 'seated'

    case 'in_the_pass':
      return 'in_the_pass'

    case 'serving':
      return 'serving'

    case 'reserved':
      return 'reserved'

    case 'resetting':
      return 'resetting'

    default:
      return 'resetting'
  }
}
// --- Tables / Floor -------------------------------------------------------
export async function fetchTables(): Promise<TableEntity[]> {
  const { data } = await apiClient.get<any[]>('/tables')
  return data.map((table) => ({
    _id: table._id,
    tableNumber: Number(table.tableNumber),
    capacity: Number(table.capacity),
    zone: table.zone || 'Dining Room',
    status: normalizeTableStatus(table.status),
    currentOrder: table.currentOrder,
  }))
}

export async function fetchFloorStats(): Promise<FloorStats> {
  const { data } = await apiClient.get<FloorStats>('/tables/stats')
  return data
}

export async function createTable(payload: {
  tableNumber: number
  zone: string
  capacity: number
}): Promise<{ table: TableEntity; qrCode: QRCodeRecord }> {
  const { data } = await apiClient.post('/tables', payload)
  return data
}

export async function fetchQRCodes(): Promise<QRCodeRecord[]> {
  const { data } = await apiClient.get<QRCodeRecord[]>('/tables/qr-codes')
  return data
}

export async function checkInTable(tableId: string): Promise<TableEntity> {
  const guestSessionId = getGuestSessionId()
  const { data } = await apiClient.patch<any>(`/tables/${tableId}/check-in`, { guestSessionId })
  return { ...data, zone: data.zone || 'Dining Room', status: normalizeTableStatus(data.status) }
}

// --- Orders ---------------------------------------------------------------
export async function fetchOrders(): Promise<OrderRecord[]> {
  const { data } = await apiClient.get<any[]>('/orders/active')
  return data.map(normalizeOrderRecord)
}

export async function fetchOrder(id: string): Promise<OrderRecord | undefined> {
  try {
    const orders = await fetchOrders()
    return orders.find((order) => order._id === id)
  } catch {
    return undefined
  }
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderRecord> {
  try {
    const { data } = await apiClient.post<any>('/orders', {
      tableId: String(payload.tableId),
      items: payload.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.qty,
        name: item.name,
        unitPrice: item.price,
        specialInstructions: '',
      })),
      customerId: payload.customerId,
      reservationId: payload.reservationId,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus === 'paid' ? 'Paid' : 'Pending',
      needsAssistance: payload.needsAssistance,
      userId: payload.userId,
      guestSessionId: payload.guestSessionId || getGuestSessionId(),
    })
    return normalizeOrderRecord(data)
  } catch (error) {
    throw error
  }
}

function normalizeUpdateForLocalStore(updates: UpdateOrderPayload): Partial<OrderRecord> {
  const normalized: Partial<OrderRecord> = {}

  if (updates.items) {
    normalized.items = updates.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      qty: item.quantity,
      price: item.unitPrice,
    }))
  }
  if (updates.totalAmount !== undefined) normalized.total = updates.totalAmount
  if (updates.status !== undefined) normalized.status = normalizeOrderStatus(updates.status)
  if (updates.paymentStatus !== undefined) {
    normalized.paymentStatus = updates.paymentStatus.toLowerCase() === 'paid' ? 'paid' : 'unpaid'
  }
  if (updates.needsAssistance !== undefined) normalized.needsAssistance = updates.needsAssistance
  if (updates.note !== undefined) normalized.note = updates.note
  if (updates.noteAt !== undefined) normalized.noteAt = updates.noteAt

  return normalized
}

export async function updateOrder(id: string, updates: UpdateOrderPayload): Promise<OrderRecord> {
  const { data } = await apiClient.put<any>(`/orders/${id}`, updates)
  return normalizeOrderRecord(data)
}

export async function updateOrderStatus(id: string, status: OrderRecord['status']): Promise<OrderRecord> {
  const { data } = await apiClient.patch<any>(`/orders/${id}/status`, {
    status: status.charAt(0).toUpperCase() + status.slice(1),
  })
  return normalizeOrderRecord(data)
}

export async function addOrderNote(id: string, note: string): Promise<OrderRecord> {
  const { data } = await apiClient.put<any>(`/orders/${id}/note`, { note })
  return normalizeOrderRecord(data)
}

export async function requestAssistance(payload: AssistanceRequestPayload): Promise<{ ok: true }> {
  await apiClient.post('/orders/assistance', {
    orderId: payload.orderId,
    tableNumber: Number(payload.tableNumber),
    reason: payload.reason,
  })
  return { ok: true }
}

// --- Notifications ---------------------------------------------------------
// --- Notifications -------------------------------------------

export async function fetchNotifications(): Promise<NotificationRecord[]> {
  const guestSessionId = getGuestSessionId()
  const { data } = await apiClient.get<any[]>('/notifications', {
    headers: { 'x-guest-session-id': guestSessionId }
  })
  return data
}

export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<NotificationRecord> {
  try {
    const { data } = await apiClient.post<any>('/notifications', payload)
    return data
  } catch {
    // Guests may not be authenticated — fall back to the public endpoint
    const { data } = await apiClient.post<any>('/notifications/public', payload)
    return data
  }
}

export async function markNotificationRead(
  id: string,
): Promise<NotificationRecord> {
  const guestSessionId = getGuestSessionId()
  const { data } = await apiClient.put<any>(`/notifications/${id}/read`, {}, {
    headers: { 'x-guest-session-id': guestSessionId }
  })
  return data
}

export async function markAllNotificationsRead(): Promise<{ modifiedCount: number }> {
  const guestSessionId = getGuestSessionId()
  const { data } = await apiClient.put<{ modifiedCount: number }>('/notifications/read-all', {}, {
    headers: { 'x-guest-session-id': guestSessionId }
  })
  return data
}

export async function deleteNotification(
  id: string,
): Promise<{ _id: string }> {
  const guestSessionId = getGuestSessionId()
  const { data } = await apiClient.delete<{ _id: string }>(`/notifications/${id}`, {
    headers: { 'x-guest-session-id': guestSessionId }
  })
  return data
}


// --- Reservations -----------------------------------------------------
export async function fetchReservationAvailability(
  tableId: string,
  date: string,
): Promise<{ time: string; available: boolean }[]> {
  const { data } = await apiClient.get<{ time: string; available: boolean }[]>('/reservations/availability', { params: { tableId, date } })
  return data
}
export async function fetchReservations(): Promise<ReservationRecord[]> {
  const { data } = await apiClient.get<any[]>('/reservations')
  return data.map(normalizeReservationRecord)
}

export async function createReservation(
  payload: ReservationPayload & { depositAmount: number; paymentId: string }
): Promise<ReservationRecord> {
  const { data } = await apiClient.post<any>('/reservations', {
    tableId: payload.tableId,
    customerDetails: {
      fullName: payload.name,
      email: payload.email,
      phone: payload.phone,
    },
    dateTime: new Date(`${payload.date}T${payload.time}`).toISOString(),
    partySize: payload.partySize,
    notes: payload.notes || '',
    depositAmount: payload.depositAmount,
    paymentId: payload.paymentId,
  })
  return normalizeReservationRecord(data)
}

// --- Payments -----------------------------------------------------------
export async function createPayment(payload: PaymentPayload): Promise<PaymentRecord> {
  const { data } = await apiClient.post<PaymentRecord>('/payments', payload)
  return data
}

// --- Auth (guest + registered customers, staff) --------------------------
export async function login(credentials: LoginPayload): Promise<{ user: AuthUser }> {
  const { data } = await apiClient.post<{ user: AuthUser }>('/auth/login', credentials)
  return data
}

export async function getCurrentUser(): Promise<{ user: AuthUser }> {
  const { data } = await apiClient.get('/auth/me')
  return data
}

export async function signup(payload: SignupPayload): Promise<{ user: AuthUser }> {
  const { data } = await apiClient.post<{ user: AuthUser }>('/customers/signup', payload)
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

// --- Staff / Employees ----------------------------------------------------
export async function fetchEmployees(): Promise<Employee[]> {
  try {
    const { data } = await apiClient.get<Employee[]>('/users')
    return data
  } catch (error) {
    console.error("FETCH EMPLOYEES ERROR:", error)
    throw error
  }
}

interface CreateEmployeeResponse {
  message: string
  employee: Employee
}

export async function createEmployee(
  payload: Omit<Employee, '_id' | 'hiredAt'>
): Promise<Employee> {
  const { data } = await apiClient.post<CreateEmployeeResponse>('/users/employees', payload)
  return data.employee
}

export async function updateEmployee(id: string, payload: Partial<Employee>): Promise<Employee> {
  const { data } = await apiClient.put<Employee>(`/users/${id}`, payload)
  return data
}

export async function deleteEmployee(id: string): Promise<{ _id: string }> {
  const { data } = await apiClient.delete(`/users/${id}`)
  return data
}

// --- Admin dashboard --------------------------------------------------------
export async function fetchDashboardStats(params?: {
  day?: number
  month?: number
  year?: number
}): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/management/dashboard', { params })
  return data
}

// Add this to your existing api.ts file
export async function fetchTableOrders(tableId: string | number): Promise<OrderRecord[]> {
  const guestSessionId = getGuestSessionId()
  const { data } = await apiClient.get<any[]>(`/orders/table/${tableId}`, {
    headers: { 'x-guest-session-id': guestSessionId }
  })
  return data.map(normalizeOrderRecord)
}


// === Loyalty Rewards System (Phase 4 addition) ==============================

export async function fetchMyLoyaltySummary(): Promise<LoyaltySummary> {
  const { data } = await apiClient.get<LoyaltySummary>('/loyalty/me')
  return data
}

export async function fetchMyTransactions(page = 1, limit = 10): Promise<{
  transactions: LoyaltyTransaction[]
  page: number
  limit: number
  totalPages: number
  total: number
}> {
  const { data } = await apiClient.get<any>(`/loyalty/me/transactions?page=${page}&limit=${limit}`)
  return data
}

export async function calculateRedemption(orderId: string): Promise<CalculateRedemptionResponse> {
  const { data } = await apiClient.post<CalculateRedemptionResponse>('/loyalty/calculate-redemption', { orderId })
  return data
}

export async function redeemLoyaltyPoints(orderId: string, pointsToRedeem: number): Promise<RedeemResponse> {
  const { data } = await apiClient.post<RedeemResponse>('/loyalty/redeem', { orderId, pointsToRedeem })
  return data
}

export async function fetchLoyaltySettings(): Promise<LoyaltySettingsType> {
  const { data } = await apiClient.get<LoyaltySettingsType>('/loyalty/settings')
  return data
}

export async function updateLoyaltySettings(settings: Partial<LoyaltySettingsType>): Promise<LoyaltySettingsType> {
  const { data } = await apiClient.put<LoyaltySettingsType>('/loyalty/settings', settings)
  return data
}

export async function fetchCustomersLoyalty(page = 1, limit = 20): Promise<{
  customers: any[]
  page: number
  limit: number
  totalPages: number
  total: number
}> {
  const { data } = await apiClient.get<any>(`/loyalty/customers?page=${page}&limit=${limit}`)
  return data
}

export async function fetchCustomerLoyaltyProfile(id: string): Promise<{
  customer: any
  transactions: LoyaltyTransaction[]
}> {
  const { data } = await apiClient.get<any>(`/loyalty/customers/${id}`)
  return data
}

export async function adjustCustomerPoints(customerId: string, points: number, reason: string): Promise<any> {
  const { data } = await apiClient.post<any>('/loyalty/adjust', { customerId, points, reason })
  return data
}

export async function fetchTableLoyaltyHistory(tableId: string | number): Promise<{
  tableId: string
  transactions: LoyaltyTransaction[]
}> {
  const { data } = await apiClient.get<any>(`/loyalty/history/table/${tableId}`)
  return data
}

export async function fetchCustomerDetailedHistory(customerId: string): Promise<{
  customer: any
  transactions: LoyaltyTransaction[]
  orders: OrderRecord[]
}> {
  const { data } = await apiClient.get<any>(`/loyalty/history/customer/${customerId}`)
  return data
}

export async function fetchCustomerProfile(): Promise<{
  customer: any
}> {
  const { data } = await apiClient.get<any>('/customers/me')
  return data
}

export async function updateCustomerProfile(updates: { name?: string; phone?: string }): Promise<{
  message: string
  customer: any
}> {
  const { data } = await apiClient.put<any>('/customers/me', updates)
  return data
}

