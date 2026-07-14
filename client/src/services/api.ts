import axios from 'axios'
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
} from '../types'
import { tables, floorStats, qrCodes, employees, dashboardStats, reservations } from './mockData'
import * as ordersStore from './ordersStore'
import type {
  CreateNotificationPayload,
  NotificationRecord,
} from '../types'
import * as menuStore from './menuStore'
import * as inventoryStore from './inventoryStore'
import * as notificationsStore from './notificationsStore'
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
    items: rawItems.map((line: any) => ({
      menuItemId: line.menuItemId || line._id || '',
      name: line.name || 'Dish',
      qty: Number(line.quantity || line.qty || 1),
      price: Number(line.unitPrice || line.price || 0),
    })),
    total: Number(order.totalAmount || order.total || 0),
    status: normalizeOrderStatus(order.status),
    paymentMethod: 'card',
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
// a real endpoint first — in production this MUST be re-verified and
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

export async function checkInTable(tableId: string): Promise<TableEntity> {
  const { data } = await apiClient.patch<any>(`/tables/${tableId}/check-in`)
  return { ...data, zone: data.zone || 'Dining Room', status: normalizeTableStatus(data.status) }
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
      tableId: payload.tableId,
      items: payload.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.qty,
        specialInstructions: '',
      })),
      customerId: payload.tableId,
      reservationId: payload.reservationId,
    })
    return normalizeOrderRecord(data)
  } catch {
    const now = new Date().toISOString()
    const order: OrderRecord = {
      _id: `order-${Date.now()}`,
      tableId: payload.tableId,
      tableNumber: payload.tableNumber,
      items: payload.items,
      total: payload.total,
      status: 'pending',
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus,
      needsAssistance: !!payload.needsAssistance,
      createdAt: now,
      updatedAt: now,
    }
    ordersStore.saveOrder(order)

    // Mirrors the atomic "confirm & deduct" step a real backend would run
    // inside the same transaction as order creation.
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

export async function updateOrder(id: string, updates: Partial<OrderRecord>): Promise<OrderRecord> {
  try {
    const { data } = await apiClient.put<OrderRecord>(`/orders/${id}`, updates)
    return data
  } catch {
    // Updating (not just re-creating) resets updatedAt to "now" — this is
    // what bumps an edited order back to the end of the kitchen queue.
    const updated = ordersStore.updateOrder(id, updates)
    return delay(updated as OrderRecord)
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
    return delay(updated as OrderRecord)
  }
}

export async function addOrderNote(id: string, note: string): Promise<OrderRecord> {
  try {
    const { data } = await apiClient.put<OrderRecord>(`/orders/${id}/note`, { note })
    return data
  } catch {
    const updated = ordersStore.updateOrder(id, { note, noteAt: new Date().toISOString() })
    return delay(updated as OrderRecord)
  }
}

export async function requestAssistance(
  payload: AssistanceRequestPayload,
): Promise<{ ok: true }> {
  await apiClient.post('/orders/assistance', payload)

  return { ok: true }
}

// --- Notifications ---------------------------------------------------------
// --- Notifications -------------------------------------------

export async function fetchNotifications(): Promise<NotificationRecord[]> {
  try {
    const { data } = await apiClient.get<any[]>('/notifications')
    return data
  } catch {
    return delay(notificationsStore.listNotifications())
  }
}

export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<NotificationRecord> {
  try {
    const { data } = await apiClient.post<any>('/notifications', payload)
    return data
  } catch {
    // If the request failed due to not being authenticated, try the public endpoint
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = arguments[0]
      // If Axios-like error with a 401, try the public route
      // (Guests can submit notifications via /notifications/public)
      // Note: we defensively attempt this even if the original error isn't 401.
      const { data } = await apiClient.post<any>('/notifications/public', payload)
      return data
    } catch {
      const created = notificationsStore.addNotification({
        _id: `notif-${Date.now()}`,
        message: payload.message,
        type: payload.type,
        senderId: 'local-user',
        senderModel: 'User',
        senderRole: 'Admin',
        recipientRole: payload.recipientRole,
        recipientId: payload.recipientId,
        isRead: false,
        createdAt: new Date().toISOString(),
      })

      return delay(created)
    }
  }
}

export async function markNotificationRead(
  id: string,
): Promise<NotificationRecord> {
  try {
    const { data } = await apiClient.put<any>(`/notifications/${id}/read`, {})
    return data
  } catch {
    notificationsStore.markRead(id)
    return delay(notificationsStore.listNotifications().find((item) => item._id === id) as NotificationRecord)
  }
}

export async function markAllNotificationsRead(): Promise<{ modifiedCount: number }> {
  try {
    const { data } = await apiClient.put<{ modifiedCount: number }>('/notifications/read-all', {})
    return data
  } catch {
    const items = notificationsStore.listNotifications().map((item) => ({ ...item, isRead: true }))
    const storageKey = 'noir_sel_notifications_db'
    localStorage.setItem(storageKey, JSON.stringify(items))
    return { modifiedCount: items.length }
  }
}

export async function deleteNotification(
  id: string,
): Promise<{ _id: string }> {
  try {
    const { data } = await apiClient.delete<{ _id: string }>(`/notifications/${id}`)
    return data
  } catch {
    const all = notificationsStore.listNotifications().filter((item) => item._id !== id)
    const storageKey = 'noir_sel_notifications_db'
    localStorage.setItem(storageKey, JSON.stringify(all))
    return { _id: id }
  }
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
      depositAmount: payload.depositAmount,
      paymentId: payload.paymentId,
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
