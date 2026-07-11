import { useState, useRef, useEffect } from 'react'
import { Bell, Package, CalendarClock, Boxes, Settings } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import type { NotificationType } from '../../types'

const ICONS: Record<NotificationType, typeof Bell> = {
  order: Package,
  reservation: CalendarClock,
  inventory: Boxes,
  system: Settings,
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.max(1, Math.floor(diffMs / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell() {
  const { items, unreadCount, markRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center border border-white/15 hover:border-ember transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-ember text-noir-950 text-[10px] font-semibold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-noir-900 border border-white/10 shadow-2xl z-50">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <p className="font-display italic text-lg">Notifications</p>
            {unreadCount > 0 && <span className="text-[10px] text-ember uppercase tracking-widest2">{unreadCount} new</span>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="text-sm text-bone-faint px-5 py-6 text-center">You&rsquo;re all caught up.</p>
            )}
            {items.map((n) => {
              const Icon = ICONS[n.type]
              return (
                <button
                  key={n._id}
                  onClick={() => markRead(n._id)}
                  className={`w-full text-left px-5 py-4 border-b border-white/5 flex gap-3 hover:bg-noir-850 transition-colors ${
                    n.isRead ? 'opacity-50' : ''
                  }`}
                >
                  <Icon size={16} className="shrink-0 mt-0.5 text-ember" />
                  <div>
                    <p className="text-sm text-bone leading-snug">{n.message}</p>
                    <p className="text-[10px] uppercase tracking-widest2 text-bone-faint mt-1.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
