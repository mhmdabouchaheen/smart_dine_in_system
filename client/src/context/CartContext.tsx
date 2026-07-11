import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, MenuItem, OrderRecord, PaymentMethod, OrderPaymentStatus } from '../types'
import * as api from '../services/api'

interface SubmitOptions {
  paymentMethod: PaymentMethod
  paymentStatus: OrderPaymentStatus
  needsAssistance?: boolean
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: MenuItem) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  totalCount: number
  totalPrice: number
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  activeOrder: OrderRecord | null
  isEditing: boolean
  startEditing: () => void
  cancelEditing: () => void
  submitOrder: (options: SubmitOptions) => Promise<OrderRecord>
  requestAssistanceForActiveOrder: (reason: string) => Promise<void>
  refreshActiveOrder: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)
const CART_STORAGE_KEY = 'noir_sel_cart'
const ACTIVE_ORDER_ID_KEY = 'noir_sel_active_order_id'

function toCartItem(menuItem: MenuItem): CartItem {
  return { _id: menuItem._id, name: menuItem.name, price: menuItem.price, qty: 1, image: menuItem.image }
}

export function CartProvider({ children }: { children: ReactNode }) {
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

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // Reload the guest's in-flight order on mount (e.g. after a page refresh)
  useEffect(() => {
    const savedId = localStorage.getItem(ACTIVE_ORDER_ID_KEY)
    if (!savedId) return
    api.fetchOrder(savedId).then((order) => {
      if (!order) {
        localStorage.removeItem(ACTIVE_ORDER_ID_KEY)
        return
      }
      if (order.status === 'completed' || order.status === 'cancelled') {
        localStorage.removeItem(ACTIVE_ORDER_ID_KEY)
        return
      }
      setActiveOrder(order)
    })
  }, [])

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
      activeOrder.items.map((i) => ({ _id: i.menuItemId, name: i.name, price: i.price, qty: i.qty }))
    )
    setIsEditing(true)
  }

  function cancelEditing() {
    setItems([])
    setIsEditing(false)
  }

  async function submitOrder(options: SubmitOptions): Promise<OrderRecord> {
    const total = items.reduce((sum, i) => sum + i.qty * i.price, 0)
    const orderItems = items.map((i) => ({ menuItemId: i._id, name: i.name, qty: i.qty, price: i.price }))

    let order: OrderRecord
    if (isEditing && activeOrder) {
      order = await api.updateOrder(activeOrder._id, {
        items: orderItems,
        total,
        paymentMethod: options.paymentMethod,
        paymentStatus: options.paymentStatus,
        needsAssistance: options.needsAssistance ?? false,
        status: 'pending',
      })
    } else {
      order = await api.createOrder({
        tableId: 'table-01',
        tableNumber: 1,
        items: orderItems,
        total,
        paymentMethod: options.paymentMethod,
        paymentStatus: options.paymentStatus,
        needsAssistance: options.needsAssistance,
      })
    }

    setActiveOrder(order)
    localStorage.setItem(ACTIVE_ORDER_ID_KEY, order._id)
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
    const savedId = localStorage.getItem(ACTIVE_ORDER_ID_KEY)
    if (!savedId) return
    const order = await api.fetchOrder(savedId)
    if (!order || order.status === 'completed' || order.status === 'cancelled') {
      localStorage.removeItem(ACTIVE_ORDER_ID_KEY)
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

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
