import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { X, Minus, Plus, Trash2 } from 'lucide-react'

import { useCart } from '../../context/CartContext'
import { createOrder } from '../../services/api'
import Button from '../ui/Button'

function getTableIdFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('tableId')
}

export default function OrderDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQty,
    removeItem,
    totalPrice,
    clearCart,
  } = useCart()

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  async function handleSubmitOrder() {
    if (items.length === 0 || status === 'submitting') {
      return
    }

    const tableId = getTableIdFromUrl()

    if (!tableId) {
      setError(
        'No table was selected. Open the menu by scanning a table QR code.',
      )
      return
    }

    const orderPayload = {
      tableId,
      items: items.map((item) => ({
        menuItemId: item._id,
        quantity: item.qty,
        specialInstructions: '',
      })),
    }

    try {
      setStatus('submitting')
      setError(null)

      await createOrder(orderPayload)

      setStatus('success')

      setTimeout(() => {
        clearCart()
        setStatus('idle')
        closeDrawer()
      }, 1800)
    } catch (err) {
      console.error('Order submission failed:', err)

      setError(
        err.response?.data?.error ||
          err.message ||
          'The order could not be submitted.',
      )

      setStatus('idle')
    }
  }

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-noir-950 border-l border-white/10 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
              <h3 className="font-display italic text-2xl">
                Your Order
              </h3>

              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close order drawer"
              >
                <X
                  size={20}
                  className="text-bone-dim hover:text-bone"
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <p className="font-display italic text-xl text-bone-dim">
                    Your table is empty.
                  </p>

                  <p className="text-sm text-bone-faint max-w-[220px]">
                    Add a dish from the menu to begin your order.
                  </p>
                </div>
              ) : (
                <ul className="space-y-6">
                  {items.map((item) => (
                    <li
                      key={item._id}
                      className="flex gap-4 pb-6 border-b border-white/5"
                    >
                      <div className="flex-1">
                        <p className="font-display text-base">
                          {item.name}
                        </p>

                        <p className="text-ember text-sm mt-1">
                          ${Number(item.price ?? 0).toFixed(2)}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(item._id, item.qty - 1)
                            }
                            className="w-7 h-7 flex items-center justify-center border border-white/20 hover:border-ember"
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus size={12} />
                          </button>

                          <span className="text-sm w-4 text-center">
                            {item.qty}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQty(item._id, item.qty + 1)
                            }
                            className="w-7 h-7 flex items-center justify-center border border-white/20 hover:border-ember"
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeItem(item._id)}
                            className="ml-auto text-bone-faint hover:text-ember"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-6 py-6 border-t border-white/10">
                {error && (
                  <p className="mb-4 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm uppercase tracking-widest2 text-bone-dim">
                    Total
                  </span>

                  <span className="font-display text-2xl text-ember">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <Button
                  className="w-full"
                  disabled={status !== 'idle'}
                  onClick={handleSubmitOrder}
                >
                  {status === 'idle' && 'Send to Kitchen'}
                  {status === 'submitting' && 'Sending...'}
                  {status === 'success' && 'Order Sent ✓'}
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}