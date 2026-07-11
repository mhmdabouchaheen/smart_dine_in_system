import { Package, CalendarClock, Boxes, Settings, CheckCheck } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import type { NotificationType } from '../../types'

const ICONS: Record<NotificationType, typeof Package> = {
  order: Package,
  reservation: CalendarClock,
  inventory: Boxes,
  system: Settings,
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Notifications() {
  const { items, isLoading, unreadCount, markRead } = useNotifications()

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-4">Stay Informed</p>
          <h1 className="font-display text-4xl leading-[1.05]">
            Notifications{' '}
            {unreadCount > 0 && <span className="text-ember italic">({unreadCount} new)</span>}
          </h1>
        </div>
      </div>

      {isLoading ? (
        <p className="text-bone-dim text-sm">Loading notifications…</p>
      ) : items.length === 0 ? (
        <p className="text-bone-dim text-sm">You&rsquo;re all caught up.</p>
      ) : (
        <div className="border border-white/10 divide-y divide-white/10">
          {items.map((n) => {
            const Icon = ICONS[n.type]
            return (
              <div key={n._id} className={`flex items-start gap-4 px-6 py-5 ${n.isRead ? 'opacity-50' : ''}`}>
                <Icon size={18} className="text-ember shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-bone leading-relaxed">{n.message}</p>
                  <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mt-2">
                    {n.type} &middot; {formatDate(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n._id)}
                    className="shrink-0 flex items-center gap-1.5 text-[11px] uppercase tracking-widest2 text-bone-dim hover:text-ember"
                  >
                    <CheckCheck size={13} /> Mark read
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
