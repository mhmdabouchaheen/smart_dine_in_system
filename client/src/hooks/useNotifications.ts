import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  createNotification,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api'

import type {
  CreateNotificationPayload,
  NotificationRecord,
} from '../types'

export function useNotifications() {
  const [items, setItems] =
    useState<NotificationRecord[]>([])

  const [isLoading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data =
        await fetchNotifications()

      setItems(data)
    } catch (err) {
      console.error(
        'Failed to load notifications:',
        err,
      )

      setError(
        'Could not load notifications.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function sendNotification(
    payload: CreateNotificationPayload,
  ) {
    try {
      setError(null)

      const created =
        await createNotification(payload)

      setItems((previous) => [
        created,
        ...previous,
      ])

      return created
    } catch (err) {
      console.error(
        'Failed to send notification:',
        err,
      )

      setError(
        'Could not send notification.',
      )

      throw err
    }
  }

  async function markRead(id: string) {
    const previousItems = items

    setItems((previous) =>
      previous.map((notification) =>
        notification._id === id
          ? {
              ...notification,
              isRead: true,
            }
          : notification,
      ),
    )

    try {
      await markNotificationRead(id)
    } catch (err) {
      setItems(previousItems)
      throw err
    }
  }

  async function markAllRead() {
    const previousItems = items

    setItems((previous) =>
      previous.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    )

    try {
      await markAllNotificationsRead()
    } catch (err) {
      setItems(previousItems)
      throw err
    }
  }

  async function removeNotification(
    id: string,
  ) {
    const previousItems = items

    setItems((previous) =>
      previous.filter(
        (notification) =>
          notification._id !== id,
      ),
    )

    try {
      await deleteNotification(id)
    } catch (err) {
      setItems(previousItems)
      throw err
    }
  }

  const unreadCount =
    items.filter(
      (notification) =>
        !notification.isRead,
    ).length

  return {
    items,
    isLoading,
    error,
    unreadCount,
    markRead,
    markAllRead,
    sendNotification,
    removeNotification,
    reload: load,
  }
}