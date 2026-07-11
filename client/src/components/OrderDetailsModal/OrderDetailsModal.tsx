import { useState } from 'react'
import { MessageSquarePlus, UserRound, Send } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { addOrderNote } from '../../services/api'
import type { OrderRecord, OrderStatus } from '../../types'

const STAGES: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'served', label: 'Served' },
  { status: 'completed', label: 'Completed' },
]

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  pending: { label: 'Start Preparing', next: 'preparing' },
  preparing: { label: 'Serve', next: 'served' },
  served: { label: 'Complete', next: 'completed' },
}

interface OrderDetailsModalProps {
  order: OrderRecord | null
  onClose: () => void
  onAdvance: (order: OrderRecord) => void
  onNoteSent: (order: OrderRecord) => void
}

export default function OrderDetailsModal({ order, onClose, onAdvance, onNoteSent }: OrderDetailsModalProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const [isSending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!order) return null

  const stageIndex = STAGES.findIndex((s) => s.status === order.status)
  const action = NEXT_ACTION[order.status]

  async function handleSendNote() {
    if (!note.trim() || !order) return
    setSending(true)
    try {
      const updated = await addOrderNote(order._id, note.trim())
      onNoteSent(updated)
      setSent(true)
      setNote('')
      setTimeout(() => setSent(false), 2500)
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      isOpen={!!order}
      onClose={() => {
        onClose()
        setNoteOpen(false)
        setSent(false)
      }}
      title={`Table ${String(order.tableNumber).padStart(2, '0')}`}
      subtitle={`Placed ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Updated ${new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
      maxWidth="max-w-lg"
    >
      {order.needsAssistance && (
        <p className="flex items-center gap-2 text-xs uppercase tracking-widest2 text-ember mb-5">
          <UserRound size={13} /> Needs Assistance
        </p>
      )}

      <ul className="space-y-2 mb-5">
        {order.items.map((line) => (
          <li key={line.menuItemId} className="flex items-center justify-between text-sm">
            <span className="text-bone-dim">
              {line.qty} &times; {line.name}
            </span>
            <span className="text-bone">${(line.qty * line.price).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/10">
        <span className="text-sm uppercase tracking-widest2 text-bone-dim">Total</span>
        <span className="font-display text-xl text-ember">${order.total.toFixed(2)}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-bone-faint mb-6">
        <span>{order.paymentMethod === 'card' ? 'Paid by card' : 'Pay at table'}</span>
        <span className="uppercase tracking-widest2">{order.paymentStatus}</span>
      </div>

      {/* Serve progress bar */}
      <p className="eyebrow mb-3">Serve Progress</p>
      <div className="flex items-center mb-2">
        {STAGES.map((stage, idx) => (
          <div key={stage.status} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                idx <= stageIndex ? 'bg-ember' : 'bg-white/15'
              }`}
            />
            {idx < STAGES.length - 1 && (
              <div className={`h-px flex-1 ${idx < stageIndex ? 'bg-ember' : 'bg-white/15'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest2 text-bone-faint mb-6">
        {STAGES.map((stage) => (
          <span key={stage.status} className={stage.status === order.status ? 'text-ember' : ''}>
            {stage.label}
          </span>
        ))}
      </div>

      {action && (
        <Button
          className="w-full mb-4"
          onClick={() => onAdvance(order)}
        >
          {action.label}
        </Button>
      )}

      {/* Add Notes */}
      {!noteOpen ? (
        <button
          onClick={() => setNoteOpen(true)}
          className="w-full flex items-center justify-center gap-2 border border-white/15 hover:border-ember px-4 py-3 text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone transition-colors"
        >
          <MessageSquarePlus size={14} /> Add Notes
        </button>
      ) : (
        <div className="border border-white/10 p-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Running about 10 minutes behind on the entrée — thanks for your patience."
            rows={3}
            className="field resize-none mb-3"
          />
          <div className="flex items-center justify-between">
            <button
              onClick={() => setNoteOpen(false)}
              className="text-xs uppercase tracking-widest2 text-bone-dim hover:text-bone"
            >
              Cancel
            </button>
            <Button onClick={handleSendNote} disabled={isSending || !note.trim()}>
              <Send size={12} /> {isSending ? 'Sending…' : 'Send to Table'}
            </Button>
          </div>
        </div>
      )}

      {sent && <p className="text-xs text-ember mt-3">Note sent — the guest will see it on their order status.</p>}

      {order.note && !noteOpen && (
        <p className="text-xs text-bone-faint mt-4 italic">
          Last note: &ldquo;{order.note}&rdquo;
          {order.noteAt && ` — ${new Date(order.noteAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      )}
    </Modal>
  )
}
