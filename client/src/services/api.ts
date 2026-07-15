import axios from 'axios'
// At the top of src/services/api.ts
import type {
  Category,
  MenuItem,
  TableEntity,
  FloorStats,
  QRCodeRecord,
  Employee,
  NotificationRecord,
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
import { tables, floorStats, qrCodes, employees, dashboardStats, reservations } from './mockData'
import * as ordersStore from './ordersStore'
import * as notificationsStore from './notificationsStore'
import * as menuStore from './menuStore'
import * as inventoryStore from './inventoryStore'

// Base URL for the Express server. Set VITE_API_URL in a .env file once the
// backend (server/) is running, e.g. VITE_API_URL=http://localhost:5000/api
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})


function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

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
    course: item.course || 1,
    no: item.no || '01',
    name: item.name || 'Untitled Dish',
    tagline: item.tagline || item.description || 'Freshly prepared',
    price: Number(item.price || 0),
    description: item.description || '',
    composition: Array.isArray(item.composition) ? item.composition : [],
    pairing: item.pairing || '',
    image: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    isBestSeller: Boolean(item.isBestSeller),
    isSeasonal: Boolean(item.isSeasonal),
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
  return {
    _id: reservation._id || `res-${Date.now()}`,
    tableId: reservation.tableId?._id || reservation.tableId || '',
    name: customer.fullName || customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    date: reservation.dateTime ? new Date(reservation.dateTime).toISOString().slice(0, 10) : '',
    time: reservation.dateTime ? new Date(reservation.dateTime).toISOString().slice(11, 16) : '',
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
  try {
    const { data } = await apiClient.get<any[]>('/menu/categories')
    return data.map(normalizeCategory)
  } catch {
    return delay(menuStore.listCategories())
  }
}

export async function createCategory(payload: Omit<Category, '_id'>): Promise<Category> {
  try {
    const { data } = await apiClient.post<any>('/menu/categories', { name: payload.name })
    return normalizeCategory(data)
  } catch {
    const category: Category = { _id: `cat-${Date.now()}`, ...payload }
    menuStore.saveCategory(category)
    return delay(category)
  }
}

export async function updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
  try {
    const { data } = await apiClient.put<Category>(`/categories/${id}`, payload)
    return data
  } catch {
    const existing = menuStore.listCategories().find((c) => c._id === id)
    const updated = { ...(existing as Category), ...payload, _id: id }
    menuStore.saveCategory(updated)
    return delay(updated)
  }
}

export async function deleteCategory(id: string): Promise<{ _id: string }> {
  try {
    const { data } = await apiClient.delete(`/categories/${id}`)
    return data
  } catch {
    menuStore.deleteCategory(id)
    return delay({ _id: id })
  }
}

export async function fetchMenu(): Promise<MenuItem[]> {
  try {
    const { data: categoriesData } = await apiClient.get<any[]>('/menu/categories')
    const categories = categoriesData || []
    const allItems: MenuItem[] = []

    for (const category of categories) {
      const { data } = await apiClient.get<any[]>(`/menu/items/category/${category._id}`)
      allItems.push(...(data || []).map(normalizeMenuItem))
    }

    return allItems
  } catch {
    return delay(menuStore.listMenuItems())
  }
}

export async function createMenuItem(payload: Omit<MenuItem, '_id'>): Promise<MenuItem> {
  try {
    const body = {
      categoryId: payload.categoryId,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      imageUrl: payload.image,
      isAvailable: true,
      preparationTime: payload.prepTimeMinutes || 10,
      recipe: (payload.recipe || []).map((line) => ({
        ingredientId: line.ingredientId,
        quantityRequired: line.quantityRequired,
      })),
    }
    const { data } = await apiClient.post<any>('/menu/items', body)
    return normalizeMenuItem(data)
  } catch {
    const item: MenuItem = { _id: `item-${Date.now()}`, ...payload }
    menuStore.saveMenuItem(item)
    return delay(item)
  }
}

export async function updateMenuItem(id: string, payload: Partial<MenuItem>): Promise<MenuItem> {
  try {
    const body = {
      categoryId: payload.categoryId,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      imageUrl: payload.image,
      isAvailable: true,
      preparationTime: payload.prepTimeMinutes || 10,
      recipe: (payload.recipe || []).map((line) => ({
        ingredientId: line.ingredientId,
        quantityRequired: line.quantityRequired,
      })),
    }
    const { data } = await apiClient.put<any>(`/menu/items/${id}`, body)
    return normalizeMenuItem(data)
  } catch {
    const existing = menuStore.getMenuItem(id)
    const updated = { ...(existing as MenuItem), ...payload, _id: id }
    menuStore.saveMenuItem(updated)
    return delay(updated)
  }
}

export async function deleteMenuItem(id: string): Promise<{ _id: string }> {
  try {
    const { data } = await apiClient.put<any>(`/menu/items/${id}`, { isAvailable: false })
    return { _id: data?._id || id }
  } catch {
    menuStore.deleteMenuItem(id)
    return delay({ _id: id })
  }
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
  try {
    const { data } = await apiClient.post<StockCheckResult>('/inventory/check', { items })
    return data
  } catch {
    const menuItems = menuStore.listMenuItems()
    const ingredientList = inventoryStore.listIngredients()
    const ingredientById = new Map(ingredientList.map((i) => [i._id, i]))
    const requiredByIngredient = new Map<string, number>()
    const issues: StockCheckResult['issues'] = []

    for (const line of items) {
      const menuItem = menuItems.find((m) => m._id === line.menuItemId)
      if (!menuItem?.recipe) continue
      for (const req of menuItem.recipe) {
        const key = req.ingredientId
        requiredByIngredient.set(key, (requiredByIngredient.get(key) || 0) + req.quantityRequired * line.qty)
      }
    }

    for (const line of items) {
      const menuItem = menuItems.find((m) => m._id === line.menuItemId)
      if (!menuItem?.recipe) continue
      for (const req of menuItem.recipe) {
        const ingredient = ingredientById.get(req.ingredientId)
        if (!ingredient) continue
        const totalNeeded = requiredByIngredient.get(req.ingredientId) || 0
        if (totalNeeded > ingredient.quantityInStock) {
          issues.push({
            menuItemId: menuItem._id,
            menuItemName: menuItem.name,
            ingredientName: ingredient.name,
            needed: totalNeeded,
            available: ingredient.quantityInStock,
            unit: ingredient.unit,
          })
        }
      }
    }

    // De-duplicate: one issue per (menuItem, ingredient) pair
    const deduped = Array.from(new Map(issues.map((i) => [`${i.menuItemId}:${i.ingredientName}`, i])).values())
    return delay({ ok: deduped.length === 0, issues: deduped })
  }
}
function normalizeTableStatus(status: unknown): TableEntity['status'] {
  const value = String(status ?? '').trim().toLowerCase()

  switch (value) {
    case 'available':
      return 'available'

    case 'occupied':
      return 'seated'

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
  try {
    const { data } = await apiClient.get<any[]>('/tables')

    return data.map((table) => ({
      _id: table._id,
      tableNumber: Number(table.tableNumber),
      capacity: Number(table.capacity),
      zone: table.zone || 'Dining Room',
      status: normalizeTableStatus(table.status),
    }))
  } catch {
    return delay(tables)
  }
}

export async function fetchFloorStats(): Promise<FloorStats> {
  try {
    const { data } = await apiClient.get<FloorStats>('/tables/stats')
    return data
  } catch {
    return delay(floorStats)
  }
}

export async function createTable(payload: {
  tableNumber: number
  zone: string
  capacity: number
}): Promise<{ table: TableEntity; qrCode: QRCodeRecord }> {
  try {
    const { data } = await apiClient.post('/tables', payload)
    return data
  } catch {
    const table: TableEntity = {
      _id: `table-local-${Date.now()}`,
      tableNumber: payload.tableNumber,
      zone: payload.zone,
      capacity: payload.capacity,
      status: 'available',
    }
    const qrCode: QRCodeRecord = {
      _id: `qr-local-${Date.now()}`,
      tableId: table._id,
      tableNumber: table.tableNumber,
      qrToken: `TOK-${table.tableNumber}-${Math.random().toString(36).slice(2, 8)}`,
      url: `https://noirandsel.example/order?table=${table.tableNumber}`,
      createdAt: new Date().toISOString(),
    }
    return delay({ table, qrCode })
  }
}

export async function fetchQRCodes(): Promise<QRCodeRecord[]> {
  try {
    const { data } = await apiClient.get<QRCodeRecord[]>('/tables/qr-codes')
    return data
  } catch {
    return delay(qrCodes)
  }
}

// --- Orders ---------------------------------------------------------------
export async function fetchOrders(): Promise<OrderRecord[]> {
  try {
    const { data } = await apiClient.get<any[]>('/orders/active')
    return data.map(normalizeOrderRecord)
  } catch {
    return delay(ordersStore.listOrders())
  }
}

export async function fetchOrder(id: string): Promise<OrderRecord | undefined> {
  try {
    const orders = await fetchOrders()
    return orders.find((order) => order._id === id)
  } catch {
    return delay(ordersStore.getOrder(id))
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
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus === 'paid' ? 'Paid' : 'Pending',
      needsAssistance: payload.needsAssistance,
      customerId: payload.customerId,
      userId: payload.userId,
    })
    return normalizeOrderRecord(data)
  } catch {
    const now = new Date().toISOString()
    const order: OrderRecord = {
      _id: `order-${Date.now()}`,
      tableId: String(payload.tableId),
      tableNumber: payload.tableNumber,
      items: payload.items,
      total: payload.totalAmount ?? payload.total ?? 0,
      status: 'pending',
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus,
      needsAssistance: !!payload.needsAssistance,
      customerId: payload.customerId,
      userId: payload.userId,
      createdAt: now,
      updatedAt: now,
    }
    ordersStore.saveOrder(order)

    const recipesByMenuItemId = Object.fromEntries(
      menuStore.listMenuItems().map((m) => [m._id, m.recipe || []])
    )
    inventoryStore.decrementForOrder(
      payload.items.map((i) => ({ menuItemId: i.menuItemId, qty: i.qty })),
      recipesByMenuItemId
    )

    return delay(order)
  }
}

export async function updateOrder(id: string, updates: UpdateOrderPayload): Promise<OrderRecord> {
  try {
    const { data } = await apiClient.put<any>(`/orders/${id}`, updates)
    return normalizeOrderRecord(data)
  } catch {
    // Updating (not just re-creating) resets updatedAt to "now" - this is
    // what bumps an edited order back to the end of the kitchen queue.
    const updated = ordersStore.updateOrder(id, normalizeUpdateForLocalStore(updates))
    if (!updated) throw new Error(`Order ${id} not found.`)
    return delay(updated)
  }
}

export async function updateOrderStatus(id: string, status: OrderRecord['status']): Promise<OrderRecord> {
  try {
    const { data } = await apiClient.patch<any>(`/orders/${id}/status`, {
      status: status.charAt(0).toUpperCase() + status.slice(1),
      paymentStatus: 'Pending',
    })
    return normalizeOrderRecord(data)
  } catch {
    const updated = ordersStore.updateOrder(id, { status })
    if (!updated) throw new Error(`Order ${id} not found.`)
    return delay(updated)
  }
}

export async function addOrderNote(id: string, note: string): Promise<OrderRecord> {
  try {
    const { data } = await apiClient.put<any>(`/orders/${id}/note`, { note })
    return normalizeOrderRecord(data)
  } catch {
    const updated = ordersStore.updateOrder(id, { note, noteAt: new Date().toISOString() })
    if (!updated) throw new Error(`Order ${id} not found.`)
    return delay(updated)
  }
}

export async function requestAssistance(payload: AssistanceRequestPayload): Promise<{ ok: true }> {
  try {
    await apiClient.post('/orders/assistance', {
      orderId: payload.orderId,
      tableNumber: Number(payload.tableNumber),
      reason: payload.reason,
    })
    return { ok: true }
  } catch (error) {
    console.error('requestAssistance failed', error)
    if (payload.orderId) ordersStore.updateOrder(payload.orderId, { needsAssistance: true })
    notificationsStore.addNotification({
      _id: `notif-${Date.now()}`,
      userId: 'emp-02',
      type: 'order',
      message: `Table ${payload.tableNumber} needs a team member - ${payload.reason}`,
      referenceId: payload.orderId,
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    return delay({ ok: true as const })
  }
}

// --- Notifications ---------------------------------------------------------
export async function fetchNotifications(): Promise<NotificationRecord[]> {
  try {
    const { data } = await apiClient.get<NotificationRecord[]>('/notifications')
    return data
  } catch {
    return delay(notificationsStore.listNotifications())
  }
}

export async function markNotificationRead(id: string): Promise<{ _id: string }> {
  try {
    const { data } = await apiClient.put(`/notifications/${id}/read`, {})
    return data
  } catch {
    notificationsStore.markRead(id)
    return delay({ _id: id })
  }
}

// --- Reservations -----------------------------------------------------
export async function fetchReservations(): Promise<ReservationRecord[]> {
  try {
    const { data } = await apiClient.get<any[]>('/reservations')
    return data.map(normalizeReservationRecord)
  } catch {
    return delay(reservations)
  }
}

export async function createReservation(
  payload: ReservationPayload & { depositAmount: number; paymentId: string }
): Promise<ReservationRecord> {
  try {
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
    })
    return normalizeReservationRecord(data)
  } catch {
    return delay({
      _id: `res-local-${Date.now()}`,
      ...payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
  }
}

// --- Payments -----------------------------------------------------------
export async function createPayment(payload: PaymentPayload): Promise<PaymentRecord> {
  try {
    const { data } = await apiClient.post<PaymentRecord>('/payments', payload)
    return data
  } catch {
    // Simulate a payment gateway round trip
    await delay(null, 900)
    return {
      _id: `pay-local-${Date.now()}`,
      ...payload,
      status: 'succeeded',
      paidAt: new Date().toISOString(),
    }
  }
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
    const { data } = await apiClient.get<Employee[]>('/staff')
    return data
  } catch {
    return delay(employees)
  }
}

export async function createEmployee(payload: Omit<Employee, '_id' | 'hiredAt'>): Promise<Employee> {
  try {
    const { data } = await apiClient.post<Employee>('/staff', payload)
    return data
  } catch {
    return delay({ _id: `emp-local-${Date.now()}`, hiredAt: new Date().toISOString(), ...payload })
  }
}

export async function updateEmployee(id: string, payload: Partial<Employee>): Promise<Employee> {
  try {
    const { data } = await apiClient.put<Employee>(`/staff/${id}`, payload)
    return data
  } catch {
    return delay({ _id: id, ...payload } as Employee)
  }
}

export async function deleteEmployee(id: string): Promise<{ _id: string }> {
  try {
    const { data } = await apiClient.delete(`/staff/${id}`)
    return data
  } catch {
    return delay({ _id: id })
  }
}

// --- Admin dashboard --------------------------------------------------------
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const { data } = await apiClient.get<DashboardStats>('/admin/dashboard')
    return data
  } catch {
    return delay(dashboardStats)
  }
}

// Add this to your existing api.ts file

export async function fetchTableOrders(tableId: string | number): Promise<OrderRecord[]> {
  try {
    const { data } = await apiClient.get<any[]>(`/orders/table/${tableId}`)
    return data.map(normalizeOrderRecord)
  } catch {
    return delay(ordersStore.listOrders(String(tableId)))
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

