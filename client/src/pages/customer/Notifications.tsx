import { useNotifications } from '../../hooks/useNotifications'
import NotificationForm from '../../components/NotificationForm/NotificationForm'

export default function CustomerNotifications() {
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
          <p className="eyebrow mb-4">Stay Connected</p>
          
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className="flex items-center gap-2 text-xs uppercase tracking-widest2 text-bone-dim hover:text-ember"
          >
            Mark all read
          </button>
        )}
      </div>

      <NotificationForm
        onSend={sendNotification}
        allowedRecipientRoles={['Admin', 'Waiter']}
      />

      {error && (
        <p className="text-sm text-red-400 my-6">{error}</p>
      )}

      {isLoading ? (
        <p className="text-bone-dim text-sm mt-8">Loading notifications…</p>
      ) : items.length === 0 ? (
        <p className="text-bone-dim text-sm mt-8">You’re all caught up.</p>
      ) : (
        <div className="border border-white/10 divide-y divide-white/10 mt-8">
          {items.map((notification) => (
            <div
              key={notification._id}
              className={`flex items-start gap-4 px-6 py-5 ${
                notification.isRead ? 'opacity-50' : ''
              }`}
            >
              <div className="flex-1">
                <p className="text-sm text-bone leading-relaxed">{notification.message}</p>
                <p className="text-[11px] uppercase tracking-widest2 text-bone-faint mt-2">
                  {notification.type}
                  {' · To '}
                  {notification.recipientRole}
                  {' · '}
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead(notification._id)}
                    className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest2 text-bone-dim hover:text-ember"
                  >
                    Mark read
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeNotification(notification._id)}
                  className="text-bone-faint hover:text-red-400"
                  aria-label="Delete notification"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
