import type { NotificationRecord } from '../types'
import { readList, writeList } from './localStore'
import { notifications as seedNotifications } from './mockData'

const KEY = 'noir_sel_notifications_db'

function readAll(): NotificationRecord[] {
  return readList<NotificationRecord>(KEY, seedNotifications)
}

function writeAll(items: NotificationRecord[]): void {
  writeList<NotificationRecord>(KEY, items)
}

export function listNotifications(): NotificationRecord[] {
  return readAll()
}

export function addNotification(notification: NotificationRecord): NotificationRecord {
  const all = readAll()
  all.unshift(notification)
  writeAll(all)
  return notification
}

export function markRead(id: string): void {
  const all = readAll()
  const idx = all.findIndex((n) => n._id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], isRead: true }
  writeAll(all)
}
