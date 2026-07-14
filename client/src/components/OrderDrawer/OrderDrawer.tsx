import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CheckCircle2, CreditCard, Lock, Minus, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'

import { useCart } from '../../context/cartContextValue'
import { checkStock, createPayment, fetchTableOrders, requestAssistance } from '../../services/api'
import type { OrderRecord } from '../../types'
import { getCurrentTableId } from '../../utils/session'
import {
  hasErrors,
  validateCVV,
  validateCardExpiry,
  validateCardNumber,
  validateName,
  type FieldErrors,
} from '../../utils/validation'
import Button from '../ui/Button'
import { TextInput } from '../ui/FormField'

type Stage = 'items' | 'method' | 'card' | 'receipt' | 'placed'

interface CardForm {
  cardName: string
  cardNumber: string
  expiry: string
  cvv: string
}

const emptyCard: CardForm = { cardName: '', cardNumber: '', expiry: '', cvv: '' }

const STATUS_LABEL: Record<OrderRecord['status'], string> = {
  pending: 'In the queue',
  preparing: 'Being prepared',
  ready: 'Ready at the pass',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`
}

export default function OrderDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQty,
    removeItem,
    totalPrice,
    activeOrder,
    isEditing,
    startEditing,
    cancelEditing,
    submitOrder,
    requestAssistanceForActiveOrder,
  } = useCart()

  const [stage, setStage] = useState<Stage>('items')
  const [card, setCard] = useState<CardForm>(emptyCard)
  const [cardErrors, setCardErrors] = useState<FieldErrors<keyof CardForm>>({})
  const [isProcessing, setProcessing] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null)
  const [assistanceNote, setAssistanceNote] = useState('')
  const [isRequestingHelp, setRequestingHelp] = useState(false)
  const [stockIssues, setStockIssues] = useState<string[]>([])
  const [isCheckingStock, setCheckingStock] = useState(false)
  const [myOrders, setMyOrders] = useState<OrderRecord[]>([])
  const [isFetchingOrders, setIsFetchingOrders] = useState(false)
  const tableId = getCurrentTableId()

  useEffect(() => {
    if (!isDrawerOpen || !tableId) return

    setIsFetchingOrders(true)
    fetchTableOrders(tableId)
      .then(setMyOrders)
      .catch((err) => console.error('Failed to fetch table orders:', err))
      .finally(() => setIsFetchingOrders(false))
  }, [isDrawerOpen, tableId])

  const showOrderStatus = !!activeOrder && !isEditing && stage === 'items'

  function updateCardField<K extends keyof CardForm>(key: K, value: CardForm[K]) {
    setCard((prev) => ({ ...prev, [key]: value }))
    setCardErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function resetCheckout() {
    setStage('items')
    setCard(emptyCard)
    setCardErrors({})
    setPayError(null)
    setPlacedOrder(null)
    setStockIssues([])
  }

  function handleClose() {
    closeDrawer()
    if (stage === 'placed') resetCheckout()
  }

  async function goToCheckout() {
    if (items.length === 0) return
    setCheckingStock(true)
    setStockIssues([])

    try {
      const result = await checkStock(items.map((i) => ({ menuItemId: i._id, name: i.name, qty: i.qty, price: i.price })))
      if (!result.ok) {
        setStockIssues(
          result.issues.map(
            (issue) =>
              `${issue.menuItemName}: needs ${issue.needed} ${issue.unit} of ${issue.ingredientName}, only ${issue.available} in stock.`,
          ),
        )
        return
      }
      setStage('method')
    } finally {
      setCheckingStock(false)
    }
  }

  async function handleStaffAssisted() {
    setProcessing(true)
    try {
      const order = await submitOrder({
        paymentMethod: 'staff_assisted',
        paymentStatus: 'paid',
        needsAssistance: true,
      })
      await requestAssistance({
        tableNumber: order.tableNumber,
        orderId: order._id,
        reason: 'Guest wants to pay at the table (check requested).',
      })
      setPlacedOrder(order)
      setStage('placed')
    } finally {
      setProcessing(false)
    }
  }

  function handleCardContinue() {
    const errors: FieldErrors<keyof CardForm> = {
      cardName: validateName(card.cardName, 'Name on card'),
      cardNumber: validateCardNumber(card.cardNumber),
      expiry: validateCardExpiry(card.expiry),
      cvv: validateCVV(card.cvv),
    }

    setCardErrors(errors)
    if (!hasErrors(errors)) validateAndCharge()
  }

  async function validateAndCharge() {
    setProcessing(true)
    setPayError(null)

    try {
      const payment = await createPayment({
        amount: totalPrice,
        method: 'card',
        cardName: card.cardName,
        cardNumberLast4: card.cardNumber.replace(/\s/g, '').slice(-4),
      })
      if (payment.status !== 'succeeded') {
        setPayError('Payment declined. Please check your card details and try again.')
        return
      }
      setStage('receipt')
    } catch {
      setPayError('Something went wrong processing your payment. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleConfirmPayment() {
    setProcessing(true)
    try {
      const order = await submitOrder({ paymentMethod: 'card', paymentStatus: 'paid', needsAssistance: false })
      setPlacedOrder(order)
      setStage('placed')
    } finally {
      setProcessing(false)
    }
  }

  async function handleRequestEmployeeFromReceipt() {
    setProcessing(true)
    try {
      const order = await submitOrder({ paymentMethod: 'card', paymentStatus: 'paid', needsAssistance: true })
      await requestAssistance({
        tableNumber: order.tableNumber,
        orderId: order._id,
        reason: 'Guest flagged an issue with their check.',
      })
      setPlacedOrder(order)
      setStage('placed')
    } finally {
      setProcessing(false)
    }
  }

  async function handleAssistanceRequest() {
    setRequestingHelp(true)
    try {
      await requestAssistanceForActiveOrder(assistanceNote || 'Guest flagged an issue with their order.')
      setAssistanceNote('')
    } finally {
      setRequestingHelp(false)
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-noir-950 border-l border-white/10 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
              <h3 className="font-display italic text-2xl">
                {showOrderStatus ? 'Your Order' : isEditing ? 'Edit Order' : 'Your Order'}
              </h3>
              <button onClick={handleClose} aria-label="Close order drawer">
                <X size={20} className="text-bone-dim hover:text-bone" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {showOrderStatus ? (
                <div className="space-y-6">
                  <div className="border border-white/10 bg-white/5 p-5">
                    <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Current status</p>
                    <p className="font-display text-3xl text-ember">{STATUS_LABEL[activeOrder.status]}</p>
                    <p className="text-sm text-bone-dim mt-2">Order #{activeOrder._id.slice(-6)}</p>
                  </div>

                  <div className="space-y-3">
                    {activeOrder.items.map((item) => (
                      <div key={`${item.menuItemId}-${item.name}`} className="flex justify-between gap-4 text-sm">
                        <span className="text-bone-dim">
                          {item.qty} x {item.name}
                        </span>
                        <span className="text-bone">{formatMoney(item.qty * item.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="divider" />
                  <div className="flex justify-between">
                    <span className="text-sm uppercase tracking-widest2 text-bone-dim">Total</span>
                    <span className="font-display text-2xl text-bone">{formatMoney(activeOrder.total)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={startEditing}>
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button variant="ghost" onClick={handleClose}>
                      Close
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <label className="block text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Need help?</label>
                    <textarea
                      className="field resize-none h-24"
                      value={assistanceNote}
                      onChange={(event) => setAssistanceNote(event.target.value)}
                      placeholder="Tell the team what you need"
                    />
                    <Button className="w-full mt-3" variant="outline" onClick={handleAssistanceRequest} disabled={isRequestingHelp}>
                      <UserRound size={14} /> {isRequestingHelp ? 'Sending...' : 'Request employee'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {stage === 'items' && myOrders.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-[11px] uppercase tracking-widest2 text-bone-dim mb-4">
                        {isFetchingOrders ? 'Loading table orders' : `Table ${tableId || 'orders'}`}
                      </h4>
                      <div className="space-y-3">
                        {myOrders.map((order) => (
                          <div key={order._id} className="p-4 border border-white/10 bg-white/5 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-bone">Order #{order._id.slice(-4)}</p>
                              <p className="text-xs text-bone-faint mt-1">{STATUS_LABEL[order.status] || order.status}</p>
                            </div>
                            <span className="text-sm font-display text-ember">{formatMoney(order.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stage === 'items' && (
                    <div className="space-y-5">
                      {items.length === 0 ? (
                        <p className="text-sm text-bone-dim">Your cart is empty.</p>
                      ) : (
                        items.map((item) => (
                          <div key={item._id} className="flex gap-4 border-b border-white/10 pb-5">
                            {item.image && (
                              <img src={item.image} alt="" className="h-20 w-20 object-cover bg-noir-850" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between gap-3">
                                <p className="text-sm text-bone leading-snug">{item.name}</p>
                                <button onClick={() => removeItem(item._id)} aria-label={`Remove ${item.name}`} className="text-bone-faint hover:text-red-400">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                              <p className="text-xs text-bone-faint mt-1">{formatMoney(item.price)}</p>
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center border border-white/15">
                                  <button className="p-2 text-bone-dim hover:text-bone" onClick={() => updateQty(item._id, item.qty - 1)} aria-label={`Decrease ${item.name}`}>
                                    <Minus size={14} />
                                  </button>
                                  <span className="w-9 text-center text-sm">{item.qty}</span>
                                  <button className="p-2 text-bone-dim hover:text-bone" onClick={() => updateQty(item._id, item.qty + 1)} aria-label={`Increase ${item.name}`}>
                                    <Plus size={14} />
                                  </button>
                                </div>
                                <span className="text-sm text-bone">{formatMoney(item.qty * item.price)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {stockIssues.length > 0 && (
                        <div className="border border-red-500/30 bg-red-500/10 p-4 space-y-2">
                          {stockIssues.map((issue) => (
                            <p key={issue} className="text-xs text-red-200 leading-relaxed">{issue}</p>
                          ))}
                        </div>
                      )}

                      {isEditing && (
                        <Button variant="ghost" className="w-full" onClick={cancelEditing}>
                          Cancel edit
                        </Button>
                      )}
                    </div>
                  )}

                  {stage === 'method' && (
                    <div className="space-y-4">
                      <button
                        className="w-full border border-white/15 hover:border-ember p-5 text-left transition-colors"
                        onClick={() => setStage('card')}
                      >
                        <span className="flex items-center gap-3 text-bone">
                          <CreditCard size={18} /> Pay by card
                        </span>
                        <span className="block text-xs text-bone-faint mt-2">Complete payment now and send the order to the kitchen.</span>
                      </button>
                      <button
                        className="w-full border border-white/15 hover:border-ember p-5 text-left transition-colors"
                        onClick={handleStaffAssisted}
                        disabled={isProcessing}
                      >
                        <span className="flex items-center gap-3 text-bone">
                          <UserRound size={18} /> Pay at table
                        </span>
                        <span className="block text-xs text-bone-faint mt-2">Ask an employee to bring the check.</span>
                      </button>
                    </div>
                  )}

                  {stage === 'card' && (
                    <div className="space-y-4">
                      <TextInput label="Name on card" value={card.cardName} onChange={(e) => updateCardField('cardName', e.target.value)} error={cardErrors.cardName} />
                      <TextInput label="Card number" inputMode="numeric" value={card.cardNumber} onChange={(e) => updateCardField('cardNumber', e.target.value)} error={cardErrors.cardNumber} />
                      <div className="grid grid-cols-2 gap-3">
                        <TextInput label="Expiry" placeholder="MM/YY" value={card.expiry} onChange={(e) => updateCardField('expiry', e.target.value)} error={cardErrors.expiry} />
                        <TextInput label="CVV" inputMode="numeric" value={card.cvv} onChange={(e) => updateCardField('cvv', e.target.value)} error={cardErrors.cvv} />
                      </div>
                      {payError && <p className="text-sm text-red-300">{payError}</p>}
                      <p className="flex items-center gap-2 text-[11px] text-bone-faint">
                        <Lock size={13} /> Payment is simulated for this demo.
                      </p>
                    </div>
                  )}

                  {stage === 'receipt' && (
                    <div className="space-y-5">
                      <div className="border border-white/10 bg-white/5 p-5">
                        <p className="text-[11px] uppercase tracking-widest2 text-bone-faint">Payment approved</p>
                        <p className="font-display text-3xl text-ember mt-2">{formatMoney(totalPrice)}</p>
                      </div>
                      <p className="text-sm text-bone-dim leading-relaxed">Confirm to send this order to the kitchen, or call an employee if something on the check looks wrong.</p>
                    </div>
                  )}

                  {stage === 'placed' && (
                    <div className="min-h-[55vh] flex flex-col items-center justify-center text-center">
                      <CheckCircle2 size={46} className="text-ember mb-5" />
                      <p className="font-display italic text-3xl text-bone">Order placed</p>
                      <p className="text-sm text-bone-dim mt-3">
                        {placedOrder ? `Order #${placedOrder._id.slice(-6)} is now with the team.` : 'Your order is now with the team.'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {!showOrderStatus && stage !== 'placed' && (
              <div className="border-t border-white/10 p-6 bg-noir-950">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-sm uppercase tracking-widest2 text-bone-dim">Total</span>
                  <span className="font-display text-2xl text-bone">{formatMoney(totalPrice)}</span>
                </div>

                {stage === 'items' && (
                  <Button className="w-full" onClick={goToCheckout} disabled={items.length === 0 || isCheckingStock}>
                    {isCheckingStock ? 'Checking stock...' : isEditing ? 'Update order' : 'Checkout'}
                  </Button>
                )}
                {stage === 'method' && (
                  <Button className="w-full" variant="ghost" onClick={() => setStage('items')} disabled={isProcessing}>
                    Back to cart
                  </Button>
                )}
                {stage === 'card' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="ghost" onClick={() => setStage('method')} disabled={isProcessing}>
                      Back
                    </Button>
                    <Button onClick={handleCardContinue} disabled={isProcessing}>
                      {isProcessing ? 'Processing...' : 'Pay'}
                    </Button>
                  </div>
                )}
                {stage === 'receipt' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={handleRequestEmployeeFromReceipt} disabled={isProcessing}>
                      Need help
                    </Button>
                    <Button onClick={handleConfirmPayment} disabled={isProcessing}>
                      Confirm
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
