import type { TableStatus } from '../../types'
import { STATUS_META } from './statusMeta'

export default function StatusDot({ status }: { status: TableStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest2" style={{ color: meta.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}
