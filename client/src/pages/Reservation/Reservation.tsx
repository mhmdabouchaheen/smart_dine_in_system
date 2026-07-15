import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { fetchTables } from '../../services/api'
import StatCard from '../../components/ui/StatCard'
import StatusDot from '../../components/ui/StatusDot'
import { statusMeta } from '../../components/ui/statusMeta'
import Button from '../../components/ui/Button'
import ReservationModal from '../../components/ReservationModal/ReservationModal'
import type { TableEntity, ReservationRecord } from '../../types'

const BORDER_BY_STATUS: Record<string, string> = {
  available: 'border-emerald-500/30',
  reserved: 'border-violet-400/30',
  seated: 'border-yellow-500/30',
  in_the_pass: 'border-ember/30',
  serving: 'border-ember/30',
  resetting: 'border-sky-400/30',
}

export default function Reservation() {
  const [tables, setTables] = useState<TableEntity[]>([])
  const [isLoading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null)
  const [confirmedReservation, setConfirmedReservation] = useState<ReservationRecord | null>(null)

  useEffect(() => {
    let active = true
    fetchTables().then((data) => {
      if (active) {
        setTables(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const available = tables.filter((t) => t.status === 'available').length
    const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0)
    const booked = tables.length - available
    return { total: tables.length, available, totalSeats, booked }
  }, [tables])

  function handleConfirmed(reservation: ReservationRecord) {
    setConfirmedReservation(reservation)
    // Note: selectedTable is intentionally left as-is so the modal can show
    // its own "success" step. It closes when the user dismisses it (Done).
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-32 pb-24">
      <p className="eyebrow mb-4">Book A Table</p>
      <h1 className="font-display text-4xl md:text-5xl leading-[1.05] mb-4">
        Tonight, <em className="text-ember italic">at your table.</em>
      </h1>
      <p className="text-bone-dim text-sm max-w-lg mb-12">
        Pick an open table below and reserve it directly — a small deposit holds your seat, applied
        toward your bill on arrival.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 border border-white/10 mb-14">
        <StatCard label="Tables" value={stats.total} />
        <StatCard label="Available Now" value={stats.available} />
        <StatCard label="Reserved / Seated" value={stats.booked} />
        <StatCard label="Total Seats" value={stats.totalSeats} />
      </div>

      {confirmedReservation && (
        <div className="flex items-center gap-3 mb-10 px-5 py-4 border border-ember/30 bg-ember/5 text-sm">
          <CheckCircle2 size={18} className="text-ember shrink-0" />
          <p>
            You&rsquo;re confirmed for {confirmedReservation.date} at {confirmedReservation.time} — party of{' '}
            {confirmedReservation.partySize}. A confirmation was sent to {confirmedReservation.email}.
          </p>
        </div>
      )}

      {isLoading ? (
        <p className="text-bone-dim text-sm">Loading the floor…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tables.map((table) => {
            const isAvailable = table.status === 'available'
            return (
              <div
                key={table._id}
                className={`border ${BORDER_BY_STATUS[table.status] || 'border-white/10'} bg-noir-900/40 p-6 flex flex-col`}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] uppercase tracking-widest2 text-bone-faint">Table</p>
                  <StatusDot status={table.status} />
                </div>
                <p className="font-display text-4xl mb-1">
                  {String(table.tableNumber).padStart(2, '0')}
                </p>
                <p className="text-bone-dim text-sm mb-6">
                  {table.zone} &middot; Seats {table.capacity}
                </p>

                <div className="mt-auto">
                  {isAvailable ? (
                    <Button className="w-full" onClick={() => setSelectedTable(table)}>
                      Reserve This Table
                    </Button>
                  ) : (
                    <p className="text-xs text-bone-faint" style={{ color: statusMeta(table.status).color }}>
                      Not available right now
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ReservationModal
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
        onConfirmed={handleConfirmed}
      />
    </div>
  )
}
