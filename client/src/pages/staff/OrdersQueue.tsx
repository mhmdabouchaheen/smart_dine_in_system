import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, UserRound, Clock, MessageSquareText } from 'lucide-react'
import { fetchOrders, updateOrderStatus } from '../../services/api'
import OrderDetailsModal from '../../components/OrderDetailsModal/OrderDetailsModal'
import type { OrderRecord, OrderStatus } from '../../types'

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  pending: { label: 'Start Preparing', next: 'preparing' },
  preparing: { label: 'Mark Ready', next: 'ready' },
  ready: { label: 'Serve', next: 'served' },
  served: { label: 'Complete', next: 'completed' },
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
}

function urgencyBorder(mins: number): string {
  if (mins >= 20) return 'border-red-500/50'
  if (mins >= 10) return 'border-amber-400/50'
  return 'border-emerald-500/30'
}

export default function OrdersQueue() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [isLoading, setLoading] = useState(true)
  const [, forceTick] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchOrders()
    setOrders(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Re-render every 30s purely to refresh the "waiting Xm" labels/colors
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const queue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'completed' && o.status !== 'cancelled')
      // Oldest last-update first — this is what sends an edited order back
      // to the end of the line, since editing refreshes updatedAt.
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
  }, [orders])

  async function advance(order: OrderRecord) {
    const action = NEXT_ACTION[order.status]
    if (!action) return
    const updated = await updateOrderStatus(order._id, action.next)
    setOrders((prev) => prev.map((o) => (o._id === order._id ? updated : o)))
    setSelectedOrder((prev) => (prev && prev._id === order._id ? updated : prev))
  }

  function handleNoteSent(updated: OrderRecord) {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))
    setSelectedOrder(updated)
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-4">Kitchen Queue</p>
          <h1 className="font-display text-4xl leading-[1.05] mb-3">
            Orders <em className="text-ember italic">dashboard.</em>
          </h1>
          <p className="text-bone-dim text-sm max-w-lg">
            Sorted by how long it&rsquo;s been since each order last changed — an edited order goes
            back to the end of the line, same as a brand-new one. Click a table to see full details.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 border border-white/20 px-4 py-2.5 text-xs uppercase tracking-widest2 text-bone hover:border-ember transition-colors"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="text-bone-dim text-sm">Loading orders…</p>
      ) : queue.length === 0 ? (
        <p className="text-bone-dim text-sm">No active orders right now.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {queue.map((order) => {
            const mins = minutesSince(order.updatedAt)
            const action = NEXT_ACTION[order.status]
            return (
              <button
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className={`border ${urgencyBorder(mins)} p-6 flex flex-col text-left hover:bg-noir-850/40 transition-colors`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] uppercase tracking-widest2 text-bone-faint">
                    Table {String(order.tableNumber).padStart(2, '0')}
                  </p>
                  <span className="text-[10px] uppercase tracking-widest2 text-ember">
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>

                {order.needsAssistance && (
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest2 text-ember mb-3">
                    <UserRound size={12} /> Needs Assistance
                  </p>
                )}

                {order.note && (
                  <p className="flex items-center gap-1.5 text-[11px] text-bone-dim mb-3 italic">
                    <MessageSquareText size={12} className="shrink-0 text-ember" /> Note sent to table
                  </p>
                )}

                <ul className="space-y-1.5 mb-4 flex-1">
                  {order.items.map((line) => (
                    <li key={line.menuItemId} className="flex items-center justify-between text-sm">
                      <span className="text-bone-dim">
                        {line.qty} &times; {line.name}
                      </span>
                      <span className="text-bone-faint">${(line.qty * line.price).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between text-sm mb-4 pt-3 border-t border-white/10">
                  <span className="text-bone-dim">Total</span>
                  <span className="font-display text-lg text-ember">${order.total.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between mb-4 text-[11px] text-bone-faint">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> {mins <= 0 ? 'just now' : `${mins} min ago`}
                  </span>
                  <span>{order.paymentMethod === 'card' ? 'Paid by card' : 'Pay at table'}</span>
                </div>

                {action && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      advance(order)
                    }}
                    className="w-full text-center bg-ember text-noir-950 px-4 py-2.5 text-xs font-medium uppercase tracking-widest2 hover:bg-ember-light transition-colors"
                  >
                    {action.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onAdvance={advance}
        onNoteSent={handleNoteSent}
      />
    </div>
  )
}
