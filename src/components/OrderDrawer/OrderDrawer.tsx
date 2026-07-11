import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { X, Minus, Plus, Trash2, CreditCard, UserRound, Lock, CheckCircle2, Pencil } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { createPayment, requestAssistance, checkStock } from '../../services/api'
import Button from '../ui/Button'
import { TextInput } from '../ui/FormField'
import {
  validateName,
  validateCardNumber,
  validateCardExpiry,
  validateCVV,
  hasErrors,
  type FieldErrors,
} from '../../utils/validation'
import type { OrderRecord } from '../../types'

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

  const showOrderStatus = !!activeOrder && !isEditing && stage === 'items'

  function resetCheckout() {
    setStage('items')
    setCard(emptyCard)
    setCardErrors({})
    setPayError(null)
    setPlacedOrder(null)
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
              `${issue.menuItemName}: needs ${issue.needed} ${issue.unit} of ${issue.ingredientName}, only ${issue.available} in stock.`
          )
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
    if (hasErrors(errors)) return
    validateAndCharge()
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
      // Card validated & charged successfully — show the check for review
      // before the order is actually sent through to the kitchen.
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
              {/* --- Tracked order status view (post-checkout) --- */}
              {showOrderStatus && activeOrder && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] uppercase tracking-widest2 text-ember">
                      {STATUS_LABEL[activeOrder.status]}
                    </span>
                    <span className="text-[11px] text-bone-faint">
                      Updated {new Date(activeOrder.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <ul className="space-y-4 mb-6">
                    {activeOrder.items.map((line) => (
                      <li key={line.menuItemId} className="flex items-center justify-between text-sm">
                        <span className="text-bone-dim">
                          {line.qty} &times; {line.name}
                        </span>
                        <span className="text-bone">${(line.qty * line.price).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mb-6">
                    <span className="text-sm uppercase tracking-widest2 text-bone-dim">Total</span>
                    <span className="font-display text-xl text-ember">${activeOrder.total.toFixed(2)}</span>
                  </div>

                  <p className="text-xs text-bone-faint mb-6">
                    Paid via {activeOrder.paymentMethod === 'card' ? 'card' : 'staff at the table'}. Changed your
                    mind about a dish? You can still edit this order until it&rsquo;s served.
                  </p>

                  {activeOrder.needsAssistance && (
                    <p className="text-xs text-ember mb-6 flex items-center gap-2">
                      <UserRound size={13} /> A team member has been notified and is on the way.
                    </p>
                  )}

                  {activeOrder.note && (
                    <div className="mb-6 px-4 py-3 border border-ember/30 bg-ember/5">
                      <p className="text-[10px] uppercase tracking-widest2 text-ember mb-1">
                        Note from the kitchen
                      </p>
                      <p className="text-sm text-bone-dim">{activeOrder.note}</p>
                    </div>
                  )}

                  {(activeOrder.status === 'pending' || activeOrder.status === 'preparing') && (
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full" onClick={startEditing}>
                        <Pencil size={13} /> Edit Order
                      </Button>
                      <div>
                        <textarea
                          value={assistanceNote}
                          onChange={(e) => setAssistanceNote(e.target.value)}
                          placeholder="Something wrong? Tell us what's up (optional)…"
                          rows={2}
                          className="field resize-none mb-2"
                        />
                        <Button
                          variant="ghost"
                          className="w-full !border !border-white/15"
                          onClick={handleAssistanceRequest}
                          disabled={isRequestingHelp || activeOrder.needsAssistance}
                        >
                          <UserRound size={13} />
                          {activeOrder.needsAssistance
                            ? 'Help requested'
                            : isRequestingHelp
                            ? 'Requesting…'
                            : 'Request Employee'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- Cart / checkout flow --- */}
              {!showOrderStatus && stage === 'items' && (
                <>
                  {isEditing && (
                    <button
                      onClick={cancelEditing}
                      className="text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone mb-5"
                    >
                      &larr; Cancel editing
                    </button>
                  )}
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-20">
                      <p className="font-display italic text-xl text-bone-dim">Your table is empty.</p>
                      <p className="text-sm text-bone-faint max-w-[220px]">
                        Add a dish from the tasting menu to begin your order.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-6">
                      {items.map((item) => (
                        <li key={item._id} className="flex gap-4 pb-6 border-b border-white/5">
                          <div className="flex-1">
                            <p className="font-display text-base">{item.name}</p>
                            <p className="text-ember text-sm mt-1">${item.price}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <button
                                onClick={() => updateQty(item._id, item.qty - 1)}
                                className="w-7 h-7 flex items-center justify-center border border-white/20 hover:border-ember"
                                aria-label={`Decrease ${item.name} quantity`}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-sm w-4 text-center">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item._id, item.qty + 1)}
                                className="w-7 h-7 flex items-center justify-center border border-white/20 hover:border-ember"
                                aria-label={`Increase ${item.name} quantity`}
                              >
                                <Plus size={12} />
                              </button>
                              <button
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

                  {stockIssues.length > 0 && (
                    <div className="mt-6 border border-ember/40 bg-ember/5 p-4">
                      <p className="text-xs uppercase tracking-widest2 text-ember mb-2">
                        Insufficient Ingredients
                      </p>
                      <ul className="space-y-1">
                        {stockIssues.map((msg) => (
                          <li key={msg} className="text-xs text-bone-dim">
                            {msg}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-bone-faint mt-2">
                        Please adjust the quantity or remove this dish to continue.
                      </p>
                    </div>
                  )}
                </>
              )}

              {!showOrderStatus && stage === 'method' && (
                <div>
                  <p className="text-sm text-bone-dim mb-6">How would you like to settle this order?</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setStage('card')}
                      className="w-full flex items-center gap-4 border border-white/15 hover:border-ember p-5 text-left transition-colors"
                    >
                      <CreditCard size={20} className="text-ember shrink-0" />
                      <div>
                        <p className="text-sm text-bone">Pay by Card</p>
                        <p className="text-xs text-bone-faint mt-0.5">Charged now, review your check before it's sent.</p>
                      </div>
                    </button>
                    <button
                      onClick={handleStaffAssisted}
                      disabled={isProcessing}
                      className="w-full flex items-center gap-4 border border-white/15 hover:border-ember p-5 text-left transition-colors disabled:opacity-50"
                    >
                      <UserRound size={20} className="text-ember shrink-0" />
                      <div>
                        <p className="text-sm text-bone">Request Employee</p>
                        <p className="text-xs text-bone-faint mt-0.5">
                          {isProcessing ? 'Sending your order…' : 'Pay at the table — we\u2019ll bring the check.'}
                        </p>
                      </div>
                    </button>
                  </div>
                  <button
                    onClick={() => setStage('items')}
                    className="text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone mt-6"
                  >
                    &larr; Back to order
                  </button>
                </div>
              )}

              {!showOrderStatus && stage === 'card' && (
                <div>
                  <div className="flex items-center justify-between mb-6 px-4 py-3 bg-noir-850 border border-white/10">
                    <span className="text-sm text-bone-dim">Amount due</span>
                    <span className="font-display text-xl text-ember">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="grid gap-5">
                    <TextInput
                      label="Name on Card"
                      value={card.cardName}
                      onChange={(e) => setCard((p) => ({ ...p, cardName: e.target.value }))}
                      error={cardErrors.cardName}
                      placeholder="As it appears on the card"
                    />
                    <TextInput
                      label="Card Number"
                      value={card.cardNumber}
                      onChange={(e) => setCard((p) => ({ ...p, cardNumber: e.target.value }))}
                      error={cardErrors.cardNumber}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                    />
                    <div className="grid grid-cols-2 gap-5">
                      <TextInput
                        label="Expiry"
                        value={card.expiry}
                        onChange={(e) => setCard((p) => ({ ...p, expiry: e.target.value }))}
                        error={cardErrors.expiry}
                        placeholder="MM/YY"
                      />
                      <TextInput
                        label="CVV"
                        value={card.cvv}
                        onChange={(e) => setCard((p) => ({ ...p, cvv: e.target.value }))}
                        error={cardErrors.cvv}
                        placeholder="123"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  {payError && <p className="text-sm text-ember mt-4">{payError}</p>}
                  <div className="flex items-center justify-between mt-7">
                    <button
                      onClick={() => setStage('method')}
                      className="text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone"
                    >
                      &larr; Back
                    </button>
                    <Button onClick={handleCardContinue} disabled={isProcessing}>
                      <Lock size={12} />
                      {isProcessing ? 'Validating…' : 'Validate & Pay'}
                    </Button>
                  </div>
                </div>
              )}

              {!showOrderStatus && stage === 'receipt' && (
                <div>
                  <div className="flex items-center gap-2 text-ember text-sm mb-6">
                    <CheckCircle2 size={16} /> Payment successful — here's your check.
                  </div>
                  <div className="border border-white/10 p-5 mb-6">
                    <ul className="space-y-3">
                      {items.map((item) => (
                        <li key={item._id} className="flex items-center justify-between text-sm">
                          <span className="text-bone-dim">
                            {item.qty} &times; {item.name}
                          </span>
                          <span className="text-bone">${(item.qty * item.price).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                      <span className="text-sm uppercase tracking-widest2 text-bone-dim">Total Charged</span>
                      <span className="font-display text-xl text-ember">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-bone-faint mb-6">
                    Everything look right? Confirm to send this to the kitchen, or request a team member if
                    something on the check needs fixing.
                  </p>
                  <div className="space-y-3">
                    <Button className="w-full" onClick={handleConfirmPayment} disabled={isProcessing}>
                      {isProcessing ? 'Sending…' : 'Confirm & Send to Kitchen'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleRequestEmployeeFromReceipt}
                      disabled={isProcessing}
                    >
                      <UserRound size={13} /> Something's Wrong — Request Employee
                    </Button>
                  </div>
                </div>
              )}

              {!showOrderStatus && stage === 'placed' && placedOrder && (
                <div className="text-center py-10">
                  <CheckCircle2 className="mx-auto text-ember mb-5" size={40} />
                  <p className="font-display italic text-2xl mb-2">
                    {placedOrder.needsAssistance ? "We're on our way." : 'Sent to the kitchen.'}
                  </p>
                  <p className="text-bone-dim text-sm max-w-xs mx-auto">
                    {placedOrder.needsAssistance
                      ? 'A team member will be with you shortly to sort out payment.'
                      : `Your order is in the queue. Total: $${placedOrder.total.toFixed(2)}.`}
                  </p>
                  <Button className="mt-8" onClick={handleClose}>
                    Done
                  </Button>
                </div>
              )}
            </div>

            {!showOrderStatus && stage === 'items' && items.length > 0 && (
              <div className="px-6 py-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm uppercase tracking-widest2 text-bone-dim">Total</span>
                  <span className="font-display text-2xl text-ember">${totalPrice.toFixed(2)}</span>
                </div>
                <Button className="w-full" onClick={goToCheckout} disabled={isCheckingStock}>
                  {isCheckingStock ? 'Checking availability…' : isEditing ? 'Review & Resubmit' : 'Checkout'}
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
