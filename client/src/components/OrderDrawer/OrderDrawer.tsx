import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Coins, CreditCard, Lock, Minus, Pencil, Plus, Sparkles, Trash2, UserRound, X } from 'lucide-react'

import { useCart } from '../../context/cartContextValue'
import { useAuth } from '../../context/authContextValue'
import { calculateRedemption, checkStock, createPayment, redeemLoyaltyPoints, requestAssistance } from '../../services/api'
import type { CalculateRedemptionResponse, OrderRecord } from '../../types'
import { getCurrentTableId, getIsQrSession } from '../../utils/session'
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

type Stage = 'items' | 'method' | 'loyalty' | 'card' | 'receipt' | 'placed'

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
    clearActiveOrder,
  } = useCart()

  const { user } = useAuth()
  const isLoggedInCustomer = !!(user && user.role.toLowerCase() === 'customer' && !user._id.startsWith('guest-'))

  const [stage, setStage] = useState<Stage>('items')
  const [card, setCard] = useState<CardForm>(emptyCard)
  const [cardErrors, setCardErrors] = useState<FieldErrors<keyof CardForm>>({})
  const [isProcessing, setProcessing] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null)
  const [assistanceNote, setAssistanceNote] = useState('')
  const [isRequestingHelp, setRequestingHelp] = useState(false)
  const [stockIssues, setStockIssues] = useState<string[]>([])
  
  const navigate = useNavigate()
  // isQrSession: true  = customer scanned a physical QR at the table → can pay at table
  // isQrSession: false = customer came via advance reservation     → card only
  const isQrSession = getIsQrSession()
  const isPreOrdering = new URLSearchParams(window.location.search).has('reservationId')
  const [isCheckingStock, setCheckingStock] = useState(false)
  // Loyalty state
  const [loyaltyCalc, setLoyaltyCalc] = useState<CalculateRedemptionResponse | null>(null)
  const [loyaltyLoading, setLoyaltyLoading] = useState(false)
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null)
  const [pointsToRedeem, setPointsToRedeem] = useState('')
  const [redemptionResult, setRedemptionResult] = useState<{ pointsRedeemed: number; discountApplied: number } | null>(null)
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null)
  const [remainingAfterPoints, setRemainingAfterPoints] = useState<number | null>(null)
  const tableId = getCurrentTableId()

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
    setLoyaltyCalc(null)
    setLoyaltyError(null)
    setPointsToRedeem('')
    setRedemptionResult(null)
    setEarnedPoints(null)
    setRemainingAfterPoints(null)
  }

  function handleClose() {
    closeDrawer()
    resetCheckout()
  }

  async function handlePlaceOrder() {
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
      setProcessing(true)
      const order = await submitOrder({ paymentMethod: 'card', paymentStatus: 'unpaid', needsAssistance: false })
      setPlacedOrder(order)
      setStage('placed')
    } finally {
      setCheckingStock(false)
      setProcessing(false)
    }
  }

  function handlePayBill() {
    if (isLoggedInCustomer && activeOrder) {
      setLoyaltyLoading(true)
      setLoyaltyError(null)
      calculateRedemption(activeOrder._id).then(calc => {
        setLoyaltyCalc(calc)
        setStage('loyalty')
      }).catch(() => {
        setStage('method')
      }).finally(() => {
        setLoyaltyLoading(false)
      })
    } else {
      setStage('method')
    }
  }



  async function handleApplyRedemption() {
    if (!activeOrder) return
    const pts = parseInt(pointsToRedeem)
    if (isNaN(pts) || pts <= 0) {
      setLoyaltyError('Please enter a valid number of points to redeem.')
      return
    }
    if (!loyaltyCalc || pts > loyaltyCalc.maxRedeemable) {
      setLoyaltyError(`You can redeem at most ${loyaltyCalc?.maxRedeemable ?? 0} points.`)
      return
    }
    if (pts < loyaltyCalc.minimumRedemptionPoints) {
      setLoyaltyError(`Minimum redemption is ${loyaltyCalc.minimumRedemptionPoints} points.`)
      return
    }
    setLoyaltyLoading(true)
    setLoyaltyError(null)
    try {
      const result = await redeemLoyaltyPoints(activeOrder._id, pts)
      setRedemptionResult({ pointsRedeemed: result.pointsRedeemed, discountApplied: result.discountApplied })

      const remaining = result.updatedOrderTotal ?? 0

      if (remaining <= 0) {
        // Points fully cover the bill — mark as paid, no card/table needed
        setProcessing(true)
        try {
          const order = await submitOrder({ paymentMethod: 'card', paymentStatus: 'paid', needsAssistance: false })
          setPlacedOrder(order)
          setStage('items') // returns to tracking view which now shows receipt
        } finally {
          setProcessing(false)
        }
      } else {
        // Partial discount — user must pay the remainder
        setRemainingAfterPoints(remaining)
        setStage('method')
      }
    } catch (err: any) {
      setLoyaltyError(err.response?.data?.error || 'Redemption failed. Please try again.')
    } finally {
      setLoyaltyLoading(false)
    }
  }

  async function handleStaffAssisted() {
    setProcessing(true)
    try {
      await submitOrder({
        paymentMethod: 'staff_assisted',
        paymentStatus: 'paid',
        needsAssistance: true,
      })
      setStage('items')
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

    // Use the remaining amount after loyalty discount, or the full order total
    const chargeAmount = remainingAfterPoints ?? activeOrder?.total ?? totalPrice

    try {
      const payment = await createPayment({
        amount: chargeAmount,
        method: 'card',
        cardName: card.cardName,
        cardNumberLast4: card.cardNumber.replace(/\s/g, '').slice(-4),
      })
      if (payment.status !== 'succeeded') {
        setPayError('Payment declined. Please check your card details and try again.')
        return
      }
      // Card payment succeeded — mark order as paid
      await submitOrder({ paymentMethod: 'card', paymentStatus: 'paid', needsAssistance: false })
      setStage('items')
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
      // Optimistically estimate earned points: backend handles the actual calculation
      // We just show an estimate on the confirmation screen for delight
      if (isLoggedInCustomer && loyaltyCalc) {
        const spent = totalPrice - (redemptionResult?.discountApplied ?? 0)
        setEarnedPoints(Math.floor(spent * loyaltyCalc.customerBalance / loyaltyCalc.customerBalance))
        // Simpler: points = spent * pointsPerDollar. We don't have that here, just show a generic message.
        setEarnedPoints(Math.floor(spent)) // rough — backend computes the real amount
      }
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
                  {activeOrder.paymentStatus === 'paid' ? (
                    <div className="space-y-6 text-center pt-8">
                      <CheckCircle2 size={46} className="text-ember mx-auto mb-5" />
                      <p className="font-display italic text-3xl text-bone">Payment successful</p>
                      <p className="text-sm text-bone-dim mt-3">
                        Thank you for dining with us. Order #{activeOrder._id.slice(-6)} is settled.
                      </p>
                      
                      <div className="mt-8 border border-white/10 bg-white/5 p-5 text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] uppercase tracking-widest2 text-bone-faint">Order Total</span>
                          <span className="font-display text-lg text-bone">{formatMoney(activeOrder.total)}</span>
                        </div>
                        {!!activeOrder.loyaltyDiscount && (
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[11px] uppercase tracking-widest2 text-ember/80">Loyalty Discount</span>
                            <span className="font-display text-lg text-ember">-{formatMoney(activeOrder.loyaltyDiscount)}</span>
                          </div>
                        )}
                        <div className="border-t border-white/10 pt-3 flex justify-between items-end">
                          <span className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-1">Total Paid</span>
                          <span className="font-display text-3xl text-ember">
                            {formatMoney(activeOrder.amountDue !== undefined ? activeOrder.amountDue : activeOrder.total)}
                          </span>
                        </div>
                      </div>

                      <Button className="w-full mt-6" onClick={() => { clearActiveOrder(); handleClose(); }}>
                        Start New Order
                      </Button>
                    </div>
                  ) : (
                    <>
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
                        <Button onClick={handlePayBill}>
                          Pay Bill
                        </Button>
                      </div>

                      <div className="pt-4 border-t border-white/10 mt-6">
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
                    </>
                  )}
                </div>
              ) : (
                <>


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
                      {redemptionResult && remainingAfterPoints !== null && (
                        <div className="border border-ember/20 bg-ember/5 p-4 space-y-1">
                          <p className="text-[11px] uppercase tracking-widest2 text-bone-faint">Remaining after points</p>
                          <p className="font-display text-2xl text-ember">{formatMoney(remainingAfterPoints)}</p>
                          <p className="text-xs text-bone-dim">{redemptionResult.pointsRedeemed} pts saved you {formatMoney(redemptionResult.discountApplied)}</p>
                        </div>
                      )}
                      <button
                        className="w-full border border-white/15 hover:border-ember p-5 text-left transition-colors"
                        onClick={() => setStage('card')}
                      >
                        <span className="flex items-center gap-3 text-bone">
                          <CreditCard size={18} /> Pay by card
                        </span>
                        <span className="block text-xs text-bone-faint mt-2">Complete payment now.</span>
                      </button>
                      {/* Pay at table only available when customer is physically at the table (QR scan) */}
                      {isQrSession && !isPreOrdering && (
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
                      )}
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

                  {stage === 'loyalty' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Coins size={22} className="text-ember" />
                        <h4 className="font-display italic text-xl">Redeem Loyalty Points</h4>
                      </div>

                      {/* Order summary */}
                      {activeOrder && (
                        <div className="border border-white/10 bg-white/5 p-4">
                          <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-3">Order Summary</p>
                          <div className="space-y-2">
                            {activeOrder.items.map((item) => (
                              <div key={`${item.menuItemId}-${item.name}`} className="flex justify-between text-sm">
                                <span className="text-bone-dim">
                                  <span className="text-bone font-semibold">{item.qty}×</span> {item.name}
                                </span>
                                <span className="text-bone">{formatMoney(item.qty * item.price)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-white/10 mt-3 pt-3 flex justify-between">
                            <span className="text-sm font-semibold text-bone-dim uppercase tracking-widest2">Total</span>
                            <span className="font-display text-lg text-ember">{formatMoney(activeOrder.total)}</span>
                          </div>
                        </div>
                      )}

                      {loyaltyCalc && (
                        <div className="border border-white/10 bg-white/5 p-5 space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-bone-faint">Your balance</span>
                            <span className="font-semibold text-bone">{loyaltyCalc.customerBalance.toLocaleString()} pts</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-bone-faint">Max redeemable</span>
                            <span className="font-semibold text-ember">{loyaltyCalc.maxRedeemable.toLocaleString()} pts (${loyaltyCalc.discountValue.toFixed(2)} off)</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-white/10 pt-3">
                            <span className="text-bone-faint">Min required</span>
                            <span className="text-bone-dim">{loyaltyCalc.minimumRedemptionPoints.toLocaleString()} pts</span>
                          </div>
                        </div>
                      )}

                      {loyaltyCalc && loyaltyCalc.maxRedeemable >= loyaltyCalc.minimumRedemptionPoints ? (
                        <div className="space-y-3">
                          <label className="text-[11px] uppercase tracking-widest2 text-bone-faint block">Points to redeem</label>
                          <input
                            type="number"
                            min={loyaltyCalc.minimumRedemptionPoints}
                            max={loyaltyCalc.maxRedeemable}
                            step={loyaltyCalc.minimumRedemptionPoints}
                            value={pointsToRedeem}
                            onChange={(e) => setPointsToRedeem(e.target.value)}
                            placeholder={`${loyaltyCalc.minimumRedemptionPoints}–${loyaltyCalc.maxRedeemable}`}
                            className="field"
                          />
                          {pointsToRedeem && !isNaN(parseInt(pointsToRedeem)) && (
                            <p className="text-xs text-ember">
                              → Saves ${(parseInt(pointsToRedeem) * loyaltyCalc.dollarValuePerPoint).toFixed(2)} off your order
                            </p>
                          )}
                          {loyaltyError && <p className="text-xs text-red-400">{loyaltyError}</p>}
                          <Button
                            className="w-full"
                            onClick={handleApplyRedemption}
                            disabled={loyaltyLoading || !pointsToRedeem}
                          >
                            {loyaltyLoading ? 'Applying...' : 'Apply Points'}
                          </Button>
                        </div>
                      ) : (
                        <div className="border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-bone-dim">
                            {loyaltyCalc
                              ? `You need at least ${loyaltyCalc.minimumRedemptionPoints} redeemable points. Your current balance allows up to ${loyaltyCalc.maxRedeemable} points on this order.`
                              : 'Loading your loyalty balance...'}
                          </p>
                        </div>
                      )}

                      <Button variant="ghost" className="w-full" onClick={() => setStage('method')}>
                        Skip — use no points
                      </Button>
                    </div>
                  )}

                  {stage === 'placed' && (
                    <div className="min-h-[55vh] flex flex-col items-center justify-center text-center">
                      <CheckCircle2 size={46} className="text-ember mb-5" />
                      <p className="font-display italic text-3xl text-bone">Order placed</p>
                      <p className="text-sm text-bone-dim mt-3">
                        {placedOrder ? `Order #${placedOrder._id.slice(-6)} is now with the team.` : 'Your order is now with the team.'}
                      </p>
                      {redemptionResult && (
                        <div className="mt-6 border border-ember/20 bg-ember/5 px-5 py-3 text-sm">
                          <p className="text-ember font-semibold">🎉 {redemptionResult.pointsRedeemed.toLocaleString()} points redeemed</p>
                          <p className="text-bone-dim mt-1">${redemptionResult.discountApplied.toFixed(2)} discount applied</p>
                        </div>
                      )}
                      {isLoggedInCustomer && !redemptionResult && (
                        <p className="mt-4 text-xs text-bone-faint flex items-center gap-1.5">
                          <Sparkles size={12} className="text-ember" />
                          Points for this visit are being added to your Rewards account.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {!showOrderStatus && stage !== 'placed' && (
              <div className="border-t border-white/10 p-6 bg-noir-950">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-sm uppercase tracking-widest2 text-bone-dim">
                    {remainingAfterPoints !== null ? 'Remaining due' : 'Total'}
                  </span>
                  <span className="font-display text-2xl text-bone">
                    {formatMoney(remainingAfterPoints ?? activeOrder?.total ?? totalPrice)}
                  </span>
                </div>

                {stage === 'items' && (
                  !tableId ? (
                    <Button className="w-full" onClick={() => { closeDrawer(); navigate('/reservation'); }}>
                      Reserve a table first
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={handlePlaceOrder} disabled={items.length === 0 || isCheckingStock || isProcessing}>
                      {isCheckingStock ? 'Checking...' : isProcessing ? 'Placing Order...' : isEditing ? 'Update order' : 'Send to Kitchen'}
                    </Button>
                  )
                )}
                {stage === 'loyalty' && null /* Buttons are inline in loyalty stage */}
                {stage === 'method' && (
                  <Button
                    className="w-full"
                    variant="ghost"
                    onClick={() => isLoggedInCustomer && activeOrder ? setStage('loyalty') : setStage('items')}
                    disabled={isProcessing}
                  >
                    Back
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
