import type { TableStatus } from '../../types'

const STATUS_META: Record<TableStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: '#2ED573' },
  seated: { label: 'Seated', color: '#F0B429' },
  in_the_pass: { label: 'In the Pass', color: '#E55A2B' },
  serving: { label: 'Serving', color: '#E55A2B' },
  resetting: { label: 'Resetting', color: '#4EA1F1' },
  reserved: { label: 'Reserved', color: '#B08BF4' },
}

export function statusMeta(status: TableStatus) {
  return STATUS_META[status]
}

export default function StatusDot({ status }: { status: TableStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest2" style={{ color: meta.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}
