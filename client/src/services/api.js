import axios from 'axios'

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('noir_sel_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ---------------------------------------------------------------------
// Menu categories
// ---------------------------------------------------------------------

export async function fetchCategories() {
  const { data } = await apiClient.get('/menu/categories')
  return data
}

// ---------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------

export async function fetchMenuByCategory(categoryId) {
  if (!categoryId) {
    throw new Error('Category ID is required')
  }

  const { data } = await apiClient.get(
    `/menu/items/category/${categoryId}`,
  )

  return data
}

// ---------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------

export async function createOrder(orderPayload) {
  const { data } = await apiClient.post('/orders', orderPayload)
  return data
}

export async function fetchActiveOrders() {
  const { data } = await apiClient.get('/orders/active')
  return data
}

export async function updateOrderStatus(orderId, status) {
  if (!orderId) {
    throw new Error('Order ID is required')
  }

  if (!status) {
    throw new Error('Order status is required')
  }

  const { data } = await apiClient.patch(
    `/orders/${orderId}/status`,
    { status },
  )

  return data
}

export async function updateOrder(orderId, updates) {
  const status =
    typeof updates === 'string'
      ? updates
      : updates?.status

  return updateOrderStatus(orderId, status)
}

// ---------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------

export function getTableQrCodeUrl(tableId) {
  if (!tableId) {
    throw new Error('Table ID is required')
  }

  return `${BASE_URL}/tables/${tableId}/qrcode`
}

// ---------------------------------------------------------------------
// Not implemented by the backend yet
// ---------------------------------------------------------------------

export async function createReservation(reservationPayload) {
  const { data } = await apiClient.post(
    '/reservations',
    reservationPayload,
  );

  return data;
}

export async function createPayment() {
  throw new Error('Payment API is not implemented in the backend')
}

export async function login() {
  throw new Error('Authentication API is not implemented in the backend')
}

export function logout() {
  localStorage.removeItem('noir_sel_token')
}