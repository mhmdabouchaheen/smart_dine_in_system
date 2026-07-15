import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  CircleHelp,
  ClipboardList,
  Info,
  Trash2,
} from 'lucide-react'

import { useNotifications } from '../../hooks/useNotifications'
import NotificationForm from '../../components/NotificationForm/NotificationForm'

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

function formatDate(
  iso: string,
): string {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return date.toLocaleString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

export default function Notifications() {
  const {
    items,
    isLoading,
    error,
    unreadCount,
    markRead,
    markAllRead,
    removeNotification,
    sendNotification,
  } = useNotifications()

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-4">
            Stay Informed
          </p>

          <h1 className="font-display text-4xl leading-[1.05]">
            Notifications{' '}

            {unreadCount > 0 && (
              <span className="text-ember italic">
                ({unreadCount} new)
              </span>
            )}
          </h1>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() =>
              markAllRead()
            }
            className="flex items-center gap-2 text-xs uppercase tracking-widest2 text-bone-dim hover:text-ember"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      <NotificationForm
        onSend={sendNotification}
      />

      {error && (
        <p className="text-sm text-red-400 my-6">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-bone-dim text-sm mt-8">
          Loading notifications…
        </p>
      ) : items.length === 0 ? (
        <p className="text-bone-dim text-sm mt-8">
          You&rsquo;re all caught up.
        </p>
      ) : (
        <div className="border border-white/10 divide-y divide-white/10 mt-8">
          {items.map((notification) => {
            const Icon =
              ICONS[notification.type] ??
              Bell

            return (
              <div
                key={notification._id}
                className={`flex items-start gap-4 px-6 py-5 ${
                  notification.isRead
                    ? 'opacity-50'
                    : ''
                }`}
              >
                <Icon
                  size={18}
                  className="text-ember shrink-0 mt-0.5"
                />

                <div className="flex-1">
                  <p className="text-sm text-bone leading-relaxed">
                    {notification.message}
                  </p>

                  <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mt-2">
                    {notification.type}
                    {' · To '}
                    {notification.recipientRole}
                    {' · '}
                    {formatDate(
                      notification.createdAt,
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() =>
                        markRead(
                          notification._id,
                        )
                      }
                      className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest2 text-bone-dim hover:text-ember"
                    >
                      <CheckCheck size={13} />
                      Mark read
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      removeNotification(
                        notification._id,
                      )
                    }
                    className="text-bone-faint hover:text-red-400"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}