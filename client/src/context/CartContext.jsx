import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'noir_sel_cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isDrawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(menuItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i._id === menuItem._id)
      if (existing) {
        return prev.map((i) =>
          i._id === menuItem._id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { ...menuItem, qty: 1 }]
    })
  }

  function removeItem(itemId) {
    setItems((prev) => prev.filter((i) => i._id !== itemId))
  }

  function updateQty(itemId, qty) {
    if (qty <= 0) return removeItem(itemId)
    setItems((prev) => prev.map((i) => (i._id === itemId ? { ...i, qty } : i)))
  }

  function clearCart() {
    setItems([])
  }

  const totalCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.qty * i.price, 0),
    [items]
  )

  const value = {
    items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    totalCount,
    totalPrice,
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    toggleDrawer: () => setDrawerOpen((v) => !v),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
