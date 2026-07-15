import { createContext, useContext } from 'react'
import type { CartItem, MenuItem, OrderPaymentStatus, OrderRecord, PaymentMethod } from '../types'

export interface SubmitOptions {
  paymentMethod: PaymentMethod
  paymentStatus: OrderPaymentStatus
  needsAssistance?: boolean
}

export interface CartContextValue {
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
  clearActiveOrder: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
