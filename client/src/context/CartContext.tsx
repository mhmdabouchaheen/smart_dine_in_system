import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { BackendOrderItemPayload, CartItem, MenuItem, OrderItemPayload, OrderRecord } from '../types'
import * as api from '../services/api'
import { getCurrentTableId } from '../utils/session'
import { useAuth } from './authContextValue'
import { CartContext, type CartContextValue, type SubmitOptions } from './cartContextValue'
const CART_STORAGE_KEY = 'noir_sel_cart'
const ACTIVE_ORDER_ID_PREFIX = 'noir_sel_active_order_id'
const ACTIVE_STATUSES: OrderRecord['status'][] = ['pending', 'preparing', 'ready', 'served']

function toCartItem(menuItem: MenuItem): CartItem {
  return { _id: menuItem._id, name: menuItem.name, price: menuItem.price, qty: 1, image: menuItem.image }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? (JSON.parse(saved) as CartItem[]) : []
    } catch {
      return []
    }
  })
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const activeOrderStorageKey = useMemo(() => {
    const tableId = getCurrentTableId() || 'table-unknown'
    const ownerId = user?._id || 'guest'
    return `${ACTIVE_ORDER_ID_PREFIX}:${tableId}:${ownerId}`
  }, [user?._id])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    refreshActiveOrder()
  }, [activeOrderStorageKey])

  function addItem(menuItem: MenuItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i._id === menuItem._id)
      if (existing) {
        return prev.map((i) => (i._id === menuItem._id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, toCartItem(menuItem)]
    })
  }

  function removeItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i._id !== itemId))
  }

  function updateQty(itemId: string, qty: number) {
    if (qty <= 0) return removeItem(itemId)
    setItems((prev) => prev.map((i) => (i._id === itemId ? { ...i, qty } : i)))
  }

  function clearCart() {
    setItems([])
  }

  function startEditing() {
    if (!activeOrder) return
    setItems(
      activeOrder.items.map((i) => ({
        _id: i.menuItemId,
        name: i.name,
        price: i.price,
        qty: i.qty,
      })),
    )
    setIsEditing(true)
  }

  function cancelEditing() {
    setItems([])
    setIsEditing(false)
  }

  async function submitOrder(options: SubmitOptions): Promise<OrderRecord> {
    const total = items.reduce((sum, i) => sum + i.qty * i.price, 0)
    const orderItems: OrderItemPayload[] = items.map((i) => ({
      menuItemId: i._id,
      name: i.name,
      qty: i.qty,
      price: i.price,
    }))
    const backendOrderItems: BackendOrderItemPayload[] = orderItems.map((i) => ({
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.qty,
      unitPrice: i.price,
      specialInstructions: '',
    }))
    const tableId = getCurrentTableId() || activeOrder?.tableId || 1
    const tableNumber = Number(tableId) || activeOrder?.tableNumber || 1
    const customerId = user?.role === 'Customer' ? user._id : undefined
    const userId = user && user.role !== 'Customer' ? user._id : undefined

    let order: OrderRecord
    if (isEditing && activeOrder) {
      order = await api.updateOrder(activeOrder._id, {
        items: backendOrderItems,
        totalAmount: total,
        paymentStatus: options.paymentStatus === 'paid' ? 'Paid' : 'Pending',
        needsAssistance: options.needsAssistance ?? false,
        status: 'Pending',
      })
    } else {
      const params = new URLSearchParams(window.location.search)
      const tableId = params.get('tableId') || 'table-01'
      const tableNumber = Number(params.get('tableNumber') || 1)
      order = await api.createOrder({
        tableId,
        tableNumber,

        reservationId: params.get('reservationId') || undefined,

        items: orderItems,
        totalAmount: total,
        paymentMethod: options.paymentMethod,
        paymentStatus: options.paymentStatus,
        needsAssistance: options.needsAssistance,
        customerId,
        userId,
      })
    }

    setActiveOrder(order)
    localStorage.setItem(activeOrderStorageKey, order._id)
    setItems([])
    setIsEditing(false)
    return order
  }

  async function requestAssistanceForActiveOrder(reason: string) {
    if (!activeOrder) return
    await api.requestAssistance({ tableNumber: activeOrder.tableNumber, orderId: activeOrder._id, reason })
    setActiveOrder((prev) => (prev ? { ...prev, needsAssistance: true } : prev))
  }

  async function refreshActiveOrder() {
    const tableId = getCurrentTableId()
    const isUserGuest = !user || user._id.startsWith('guest-')

    if (tableId) {
      const tableOrders = await api.fetchTableOrders(tableId)
      const tableOrder = tableOrders.find((order) => {
        if (!ACTIVE_STATUSES.includes(order.status)) return false
        const isOrderGuest = !order.customerId
        return isUserGuest ? isOrderGuest : !isOrderGuest
      })

      if (tableOrder) {
        setActiveOrder(tableOrder)
        localStorage.setItem(activeOrderStorageKey, tableOrder._id)
        return
      }
    }

    const savedId = localStorage.getItem(activeOrderStorageKey)
    if (!savedId) {
      setActiveOrder(null)
      return
    }

    const order = await api.fetchOrder(savedId)
    if (!order || !ACTIVE_STATUSES.includes(order.status)) {
      localStorage.removeItem(activeOrderStorageKey)
      setActiveOrder(null)
      return
    }

    const isOrderGuest = !order.customerId
    if (isUserGuest !== isOrderGuest) {
      localStorage.removeItem(activeOrderStorageKey)
      setActiveOrder(null)
      return
    }

    setActiveOrder(order)
  }

  const totalCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])
  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.price, 0), [items])

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    totalCount,
    totalPrice,
    isDrawerOpen,
    openDrawer: () => {
      setDrawerOpen(true)
      refreshActiveOrder()
    },
    closeDrawer: () => setDrawerOpen(false),
    toggleDrawer: () => setDrawerOpen((v) => !v),
    activeOrder,
    isEditing,
    startEditing,
    cancelEditing,
    submitOrder,
    requestAssistanceForActiveOrder,
    refreshActiveOrder,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
