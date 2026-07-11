import { useEffect, useState, useCallback } from 'react'
import { fetchNotifications, markNotificationRead } from '../services/api'
import type { NotificationRecord } from '../types'

export function useNotifications() {
  const [items, setItems] = useState<NotificationRecord[]>([])
  const [isLoading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)))
    await markNotificationRead(id)
  }

  const unreadCount = items.filter((n) => !n.isRead).length

  return { items, isLoading, unreadCount, markRead, reload: load }
}
