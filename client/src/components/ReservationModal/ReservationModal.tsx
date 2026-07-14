import { useState } from 'react'
import { CreditCard, Lock, CheckCircle2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { TextInput, TextArea, Select } from '../ui/FormField'
import type { TableEntity, ReservationRecord } from '../../types'
import { createPayment, createReservation, fetchReservationAvailability } from '../../services/api'
import {
  validateName,
  validateEmail,
  validatePhone,
  validateDateNotPast,
  validateTime,
  validatePartySize,
  validateCardNumber,
  validateCardExpiry,
  validateCVV,
  hasErrors,
  type FieldErrors,
} from '../../utils/validation'

const DEPOSIT_PER_GUEST = 25

interface DetailsForm {
  name: string
  email: string
  phone: string
  date: string
  time: string
  partySize: number
  notes: string
}

const initialDetails: DetailsForm = {
  name: '',
  email: '',
  phone: '',
  date: '',
  time: '',
  partySize: 2,
  notes: '',
}

interface CardForm {
  cardName: string
  cardNumber: string
  expiry: string
  cvv: string
}

const initialCard: CardForm = { cardName: '', cardNumber: '', expiry: '', cvv: '' }

type Step = 'details' | 'payment' | 'success'

interface ReservationModalProps {
  table: TableEntity | null
  onClose: () => void
  onConfirmed: (reservation: ReservationRecord) => void
}

export default function ReservationModal({ table, onClose, onConfirmed }: ReservationModalProps) {
  const [step, setStep] = useState<Step>('details')
  const [details, setDetails] = useState<DetailsForm>(initialDetails)
  const [detailErrors, setDetailErrors] = useState<FieldErrors<keyof DetailsForm>>({})
  const [card, setCard] = useState<CardForm>(initialCard)
  const [cardErrors, setCardErrors] = useState<FieldErrors<keyof CardForm>>({})
  const [isProcessing, setProcessing] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [isLoadingTimes, setLoadingTimes] = useState(false)

  if (!table) return null

  const deposit = Math.min(details.partySize || 1, table.capacity) * DEPOSIT_PER_GUEST

  function updateDetails<K extends keyof DetailsForm>(key: K, value: DetailsForm[K]) {
    setDetails((prev) => ({ ...prev, [key]: value }))
  }

  function handleClose() {
    setStep('details')
    setDetails(initialDetails)
    setDetailErrors({})
    setCard(initialCard)
    setCardErrors({})
    setPayError(null)
    setAvailableTimes([])
    onClose()
  }

  async function loadAvailableTimes(date: string) {
    updateDetails('date', date)
    updateDetails('time', '')
    if (!date) return setAvailableTimes([])
    setLoadingTimes(true)
    try {
      const slots = await fetchReservationAvailability(table!._id, date)
      setAvailableTimes(slots.filter((slot) => slot.available).map((slot) => slot.time))
    } catch {
      setAvailableTimes([])
    } finally {
      setLoadingTimes(false)
    }
  }

  function handleDetailsSubmit() {
    const errors: FieldErrors<keyof DetailsForm> = {
      name: validateName(details.name),
      email: validateEmail(details.email),
      phone: validatePhone(details.phone),
      date: validateDateNotPast(details.date),
      time: validateTime(details.time),
      partySize: validatePartySize(details.partySize, table!.capacity),
    }
    setDetailErrors(errors)
    if (hasErrors(errors)) return
    setStep('payment')
  }

  async function handlePaymentSubmit() {
    const errors: FieldErrors<keyof CardForm> = {
      cardName: validateName(card.cardName, 'Name on card'),
      cardNumber: validateCardNumber(card.cardNumber),
      expiry: validateCardExpiry(card.expiry),
      cvv: validateCVV(card.cvv),
    }
    setCardErrors(errors)
    if (hasErrors(errors)) return

    setProcessing(true)
    setPayError(null)
    try {
      const payment = await createPayment({
        amount: deposit,
        method: 'card',
        cardName: card.cardName,
        cardNumberLast4: card.cardNumber.replace(/\s/g, '').slice(-4),
      })

      if (payment.status !== 'succeeded') {
        setPayError('Payment declined. Please check your card details and try again.')
        return
      }

      const reservation = await createReservation({
        tableId: table!._id,
        name: details.name,
        email: details.email,
        phone: details.phone,
        date: details.date,
        time: details.time,
        partySize: details.partySize,
        notes: details.notes || undefined,
        depositAmount: deposit,
        paymentId: payment._id,
      })

      setStep('success')
      onConfirmed(reservation)
    } catch {
      setPayError('Something went wrong processing your payment. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const title =
    step === 'success' ? 'Reservation Confirmed' : `Reserve Table ${table.tableNumber}`
  const subtitle =
    step === 'details'
      ? `${table.zone} · Seats up to ${table.capacity}`
      : step === 'payment'
      ? 'A deposit secures your table for tonight.'
      : undefined

  return (
    <Modal isOpen={!!table} onClose={handleClose} title={title} subtitle={subtitle} maxWidth="max-w-xl">
      {step === 'details' && (
        <div className="grid md:grid-cols-2 gap-5">
          <TextInput
            label="Full Name"
            value={details.name}
            onChange={(e) => updateDetails('name', e.target.value)}
            error={detailErrors.name}
            placeholder="Your name"
          />
          <TextInput
            label="Email"
            type="email"
            value={details.email}
            onChange={(e) => updateDetails('email', e.target.value)}
            error={detailErrors.email}
            placeholder="you@example.com"
          />
          <TextInput
            label="Phone"
            type="tel"
            value={details.phone}
            onChange={(e) => updateDetails('phone', e.target.value)}
            error={detailErrors.phone}
            placeholder="+1 (___) ___-____"
          />
          <Select
            label="Party Size"
            value={details.partySize}
            onChange={(e) => updateDetails('partySize', Number(e.target.value))}
            error={detailErrors.partySize}
          >
            {Array.from({ length: table.capacity }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'Guest' : 'Guests'}
              </option>
            ))}
          </Select>
          <TextInput
            label="Date"
            type="date"
            value={details.date}
            onChange={(e) => loadAvailableTimes(e.target.value)}
            error={detailErrors.date}
          />
          <Select label="Available Time" value={details.time} onChange={(e) => updateDetails('time', e.target.value)} error={detailErrors.time} disabled={!details.date || isLoadingTimes}>
            <option value="">{isLoadingTimes ? 'Loading times…' : details.date ? 'Choose a time' : 'Choose a date first'}</option>
            {availableTimes.map((time) => <option key={time} value={time}>{time}</option>)}
          </Select>
          <TextArea
            label="Notes"
            full
            rows={3}
            value={details.notes}
            onChange={(e) => updateDetails('notes', e.target.value)}
            placeholder="Allergies, occasions, seating preferences…"
          />

          <div className="md:col-span-2 flex items-center justify-between pt-2">
            <p className="text-xs text-bone-faint">
              A ${DEPOSIT_PER_GUEST}/guest deposit is required to hold this table.
            </p>
            <Button onClick={handleDetailsSubmit}>Continue to Payment</Button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div>
          <div className="flex items-center justify-between mb-6 px-4 py-3 bg-noir-850 border border-white/10">
            <span className="text-sm text-bone-dim">Deposit due today</span>
            <span className="font-display text-xl text-ember">${deposit.toFixed(2)}</span>
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

          <div className="flex items-center justify-between mt-7 pt-6 border-t border-white/10">
            <button
              onClick={() => setStep('details')}
              className="text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone"
            >
              &larr; Back
            </button>
            <Button onClick={handlePaymentSubmit} disabled={isProcessing}>
              <Lock size={12} />
              {isProcessing ? 'Processing…' : `Pay $${deposit.toFixed(2)} & Reserve`}
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-bone-faint mt-4">
            <CreditCard size={12} /> This is a demo payment flow — no real card is charged.
          </p>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-6">
          <CheckCircle2 className="mx-auto text-ember mb-5" size={40} />
          <p className="font-display italic text-2xl mb-2">
            Table {table.tableNumber} is yours, {details.name.split(' ')[0]}.
          </p>
          <p className="text-bone-dim text-sm max-w-sm mx-auto">
            We&rsquo;ve sent a confirmation to {details.email}. See you {details.date} at {details.time}.
          </p>
          <Button className="mt-8" onClick={handleClose}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  )
}
