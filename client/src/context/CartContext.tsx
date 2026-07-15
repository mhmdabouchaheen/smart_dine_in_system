import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import type { BackendOrderItemPayload, CartItem, MenuItem, OrderItemPayload, OrderRecord } from '../types'
import * as api from '../services/api'
import { getCurrentTableId, getGuestSessionId, clearCurrentTableId } from '../utils/session'
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
  const location = useLocation()
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const cartStorageKey = useMemo(() => `noir_sel_cart_${user?._id || 'guest'}`, [user?._id])
  const activeOrderStorageKey = useMemo(() => {
    // Re-compute when user changes OR when the URL's table param changes (e.g. after reservation redirect)
    const tableId = getCurrentTableId() || 'table-unknown'
    const ownerId = user?._id || 'guest'
    return `${ACTIVE_ORDER_ID_PREFIX}:${tableId}:${ownerId}`
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, location.search])

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(cartStorageKey)
      return saved ? (JSON.parse(saved) as CartItem[]) : []
    } catch {
      return []
    }
  })

  // Switch cart when user logs in or out
  useEffect(() => {
    try {
      const saved = localStorage.getItem(cartStorageKey)
      setItems(saved ? (JSON.parse(saved) as CartItem[]) : [])
    } catch {
      setItems([])
    }
  }, [cartStorageKey])

  // Save cart whenever items or user changes
  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(items))
  }, [items, cartStorageKey])

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
    const tableId = getCurrentTableId() || activeOrder?.tableId
    const urlTableNumber = Number(new URLSearchParams(window.location.search).get('tableNumber'))
    const tableNumber = urlTableNumber || activeOrder?.tableNumber || 1
    const customerId = user?.role === 'Customer' ? user._id : undefined
    const userId = user && user.role !== 'Customer' ? user._id : undefined

    let order: OrderRecord
    
    if (items.length === 0 && activeOrder && options.paymentStatus === 'paid') {
      order = await api.updateOrder(activeOrder._id, {
        paymentStatus: 'Paid',
        needsAssistance: options.needsAssistance,
      })
      setActiveOrder(order)
      return order
    }

    if (isEditing && activeOrder) {
      order = await api.updateOrder(activeOrder._id, {
        items: backendOrderItems,
        totalAmount: total,
        paymentStatus: options.paymentStatus === 'paid' ? 'Paid' : 'Pending',
        needsAssistance: options.needsAssistance ?? false,
        status: 'Pending',
        customerId,
      })
    } else {
      const params = new URLSearchParams(window.location.search)
      
      order = await api.createOrder({
        tableId: tableId || '',
        tableNumber,

        reservationId: params.get('reservationId') || undefined,

        items: orderItems,
        totalAmount: total,
        paymentMethod: options.paymentMethod,
        paymentStatus: options.paymentStatus,
        needsAssistance: options.needsAssistance,
        customerId,
        userId,
        guestSessionId: !customerId ? getGuestSessionId() : undefined,
      })
    }

    setActiveOrder(order)
    localStorage.setItem(activeOrderStorageKey, order._id)
    setItems([])
    setIsEditing(false)
    return order
  }

  function clearActiveOrder() {
    localStorage.removeItem(activeOrderStorageKey)
    setActiveOrder(null)
  }

  async function requestAssistanceForActiveOrder(reason: string) {
    if (!activeOrder) return
    await api.requestAssistance({ tableNumber: activeOrder.tableNumber, orderId: activeOrder._id, reason })
    setActiveOrder((prev) => (prev ? { ...prev, needsAssistance: true } : prev))
  }

  async function refreshActiveOrder() {
    const tableId = getCurrentTableId()
    const savedId = localStorage.getItem(activeOrderStorageKey)

    // --- Priority 1: restore from saved order ID (most reliable) ---
    if (savedId) {
      const order = await api.fetchOrder(savedId)
      if (order && ACTIVE_STATUSES.includes(order.status) && order.paymentStatus !== 'paid') {
        setActiveOrder(order)
        return
      }
      // Saved order is done/paid — clean up
      localStorage.removeItem(activeOrderStorageKey)
      setActiveOrder(null)
      return
    }

    // --- Priority 2: table-based lookup (no saved ID yet, e.g. first open) ---
    if (!tableId) {
      setActiveOrder(null)
      return
    }

    const tableOrders = await api.fetchTableOrders(tableId)
    const loggedInCustomerId = user?.role === 'Customer' && !user._id.startsWith('guest-') ? user._id : null

    const tableOrder = tableOrders.find((order) => {
      if (!ACTIVE_STATUSES.includes(order.status)) return false
      if (order.paymentStatus === 'paid') return false
      // For logged-in customers: match by their customerId
      if (loggedInCustomerId) return order.customerId === loggedInCustomerId
      // For guests: match by guestSessionId
      return order.guestSessionId === getGuestSessionId()
    })

    if (tableOrder) {
      setActiveOrder(tableOrder)
      localStorage.setItem(activeOrderStorageKey, tableOrder._id)
    } else {
      setActiveOrder(null)
    }
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
    clearActiveOrder,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
