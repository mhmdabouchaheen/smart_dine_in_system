import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { fetchTables, fetchFloorStats } from '../../services/api'
import StatusDot from '../../components/ui/StatusDot'
import ProgressBar from '../../components/ui/ProgressBar'
import type { TableEntity, FloorStats } from '../../types'

const BORDER_BY_STATUS: Record<string, string> = {
  available: 'border-emerald-500/30',
  reserved: 'border-violet-400/30',
  seated: 'border-yellow-500/40',
  in_the_pass: 'border-ember/40',
  serving: 'border-ember/40',
  resetting: 'border-sky-400/40',
}

export default function FloorStatus() {
  const [tables, setTables] = useState<TableEntity[]>([])
  const [stats, setStats] = useState<FloorStats | null>(null)
  const [isLoading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [tableData, statData] = await Promise.all([fetchTables(), fetchFloorStats()])
    setTables(tableData)
    setStats(statData)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 30000)
    return () => window.clearInterval(interval)
  }, [load])

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-4">Live Floor Status</p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] mb-3">
            Tonight, <em className="text-ember italic">in real time.</em>
          </h1>
          <p className="text-bone-dim text-sm max-w-lg">
            Every table, every course, every minute. A live pulse of the dining room — updated
            automatically as plates leave the pass.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 border border-white/20 px-4 py-2.5 text-xs uppercase tracking-widest2 text-bone hover:border-ember transition-colors"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-white/10 mb-10">
          <div className="px-6 py-5 border-r border-b sm:border-b-0 border-white/10">
            <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Tables</p>
            <p className="font-display text-3xl">{stats.tables}</p>
          </div>
          <div className="px-6 py-5 border-r border-b sm:border-b-0 border-white/10">
            <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Covers Seated</p>
            <p className="font-display text-3xl">{stats.coversSeated}</p>
          </div>
          <div className="px-6 py-5 lg:border-r border-white/10">
            <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Available</p>
            <p className="font-display text-3xl">{stats.available}</p>
          </div>
          <div className="px-6 py-5 border-r border-t lg:border-t-0 border-white/10">
            <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Seated</p>
            <p className="font-display text-3xl">{stats.seated}</p>
          </div>
          <div className="px-6 py-5 border-r border-t lg:border-t-0 border-white/10">
            <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">In The Pass</p>
            <p className="font-display text-3xl">{stats.inThePass}</p>
          </div>
          <div className="px-6 py-5 border-t lg:border-t-0 border-white/10">
            <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mb-2">Serving</p>
            <p className="font-display text-3xl">{stats.serving}</p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tables.map((table) => (
          <div
            key={table._id}
            className={`border ${BORDER_BY_STATUS[table.status] || 'border-white/10'} p-6 flex flex-col`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest2 text-bone-faint">Table</p>
              <StatusDot status={table.status} />
            </div>
            <p className="font-display text-4xl mb-1">{String(table.tableNumber).padStart(2, '0')}</p>
            <p className="text-bone-dim text-sm mb-5">
              {table.zone} &middot; Seats {table.capacity}
            </p>

            {table.currentOrder ? (
              <>
                <div className="grid grid-cols-3 gap-3 text-sm mb-5 pb-5 border-b border-white/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest2 text-bone-faint mb-1">Party</p>
                    <p className="font-display text-lg">{table.currentOrder.party}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest2 text-bone-faint mb-1">Order Status</p>
                    <p className="font-display text-lg">{table.currentOrder.courseName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest2 text-bone-faint mb-1">Seated</p>
                    <p className="font-display text-lg">{table.currentOrder.seatedAt}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ProgressBar label="Prep" progress={table.currentOrder.prepProgress} eta={table.currentOrder.prepEta} />
                  <ProgressBar label="Serve" progress={table.currentOrder.serveProgress} eta={table.currentOrder.serveEta} />
                </div>

                {table.currentOrder.note && (
                  <p className="flex items-start gap-2 text-xs text-bone-dim italic mt-5 pl-3 border-l border-ember/50">
                    {table.currentOrder.note}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-bone-faint italic mt-auto">
                {table.status === 'resetting' ? 'Reset in ~6 min' : 'Ready for the next guests'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
