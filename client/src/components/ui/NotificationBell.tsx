import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CircleHelp,
  ClipboardList,
  Info,
} from 'lucide-react'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { useNotifications } from '../../hooks/useNotifications'

import type {
  NotificationType,
} from '../../types'

const ICONS: Record<
  NotificationType,
  typeof Bell
> = {
  Order: ClipboardList,
  Reservation: CalendarClock,
  Assistance: CircleHelp,
  General: Info,
  Urgent: AlertTriangle,
}

function timeAgo(iso: string): string {
  const timestamp =
    new Date(iso).getTime()

  if (Number.isNaN(timestamp)) {
    return 'Just now'
  }

  const difference =
    Date.now() - timestamp

  const minutes = Math.max(
    1,
    Math.floor(difference / 60000),
  )

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours =
    Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours}h ago`
  }

  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationBell() {
  const {
    items,
    unreadCount,
    markRead,
    markAllRead,
  } = useNotifications()

  const [open, setOpen] =
    useState(false)

  const ref =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        ref.current &&
        !ref.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])

  return (
    <div
      className="relative"
      ref={ref}
    >
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
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
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4">
            <p className="font-display italic text-lg">
              Notifications
            </p>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  markAllRead()
                }
                className="text-[10px] text-ember uppercase tracking-widest2"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="text-sm text-bone-faint px-5 py-6 text-center">
                You&rsquo;re all caught up.
              </p>
            )}

            {items.map((notification) => {
              const Icon =
                ICONS[notification.type] ??
                Bell

              return (
                <button
                  type="button"
                  key={notification._id}
                  onClick={() =>
                    markRead(
                      notification._id,
                    )
                  }
                  className={`w-full text-left px-5 py-4 border-b border-white/5 flex gap-3 hover:bg-noir-850 transition-colors ${
                    notification.isRead
                      ? 'opacity-50'
                      : ''
                  }`}
                >
                  <Icon
                    size={16}
                    className="shrink-0 mt-0.5 text-ember"
                  />

                  <div>
                    <p className="text-sm text-bone leading-snug">
                      {notification.message}
                    </p>

                    <p className="text-[10px] uppercase tracking-widest2 text-bone-faint mt-1.5">
                      {notification.type}
                      {' · '}
                      {timeAgo(
                        notification.createdAt,
                      )}
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