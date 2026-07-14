import type { OrderRecord } from '../types'
import { readList, writeList } from './localStore'

const KEY = 'noir_sel_orders_db'

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60000).toISOString()
}

const SEED_ORDERS: OrderRecord[] = [
  {
    _id: 'order-seed-01',
    tableId: 'table-04',
    tableNumber: 4,
    items: [
      { menuItemId: 'item-01', name: 'Smoked Beetroot & Ash', qty: 2, price: 24 },
      { menuItemId: 'item-04', name: 'Charred Octopus, Ember Oil', qty: 1, price: 32 },
    ],
    total: 80,
    status: 'pending',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    needsAssistance: false,
    createdAt: minutesAgo(4),
    updatedAt: minutesAgo(4),
  },
  {
    _id: 'order-seed-02',
    tableId: 'table-07',
    tableNumber: 7,
    items: [
      { menuItemId: 'item-07', name: 'Dry-Aged Rib, Live Coal', qty: 2, price: 48 },
      { menuItemId: 'item-09', name: 'Charcoal Sourdough, Cultured Butter', qty: 2, price: 14 },
    ],
    total: 124,
    status: 'preparing',
    paymentMethod: 'staff_assisted',
    paymentStatus: 'paid',
    needsAssistance: false,
    createdAt: minutesAgo(17),
    updatedAt: minutesAgo(11),
  },
  {
    _id: 'order-seed-03',
    tableId: 'table-01',
    tableNumber: 1,
    items: [{ menuItemId: 'item-05', name: 'Scallop, Burnt Citrus', qty: 2, price: 29 }],
    total: 58,
    status: 'preparing',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    needsAssistance: true,
    createdAt: minutesAgo(26),
    updatedAt: minutesAgo(24),
  },
  {
    _id: 'order-seed-04',
    tableId: 'table-06',
    tableNumber: 6,
    items: [{ menuItemId: 'item-08', name: 'Ash-Roasted Squab', qty: 2, price: 34 }],
    total: 68,
    status: 'served',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    needsAssistance: false,
    createdAt: minutesAgo(38),
    updatedAt: minutesAgo(6),
  },
]

function readAll(): OrderRecord[] {
  return readList<OrderRecord>(KEY, SEED_ORDERS)
}

function writeAll(orders: OrderRecord[]): void {
  writeList<OrderRecord>(KEY, orders)
}

export function listOrders(tableId?: string): OrderRecord[] {
  const allOrders = readAll()

  if (!tableId) return allOrders

  const tableNumber = Number(tableId)

  return allOrders.filter((order) => {
    if (order.tableId === tableId) return true
    if (!Number.isNaN(tableNumber) && order.tableNumber === tableNumber) return true
    return order.tableId === `table-${String(tableNumber).padStart(2, '0')}`
  })
}

export function getActiveTableOrder(tableId: string | number): OrderRecord | undefined {
  const activeStatuses: OrderRecord['status'][] = ['pending', 'preparing', 'ready', 'served']
  return listOrders(String(tableId))
    .filter((order) => activeStatuses.includes(order.status))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
}

export function getOrder(id: string): OrderRecord | undefined {
  return readAll().find((o) => o._id === id)
}

export function saveOrder(order: OrderRecord): OrderRecord {
  const all = readAll()
  const idx = all.findIndex((o) => o._id === order._id)
  if (idx >= 0) all[idx] = order
  else all.unshift(order)
  writeAll(all)
  return order
}

export function updateOrder(id: string, updates: Partial<OrderRecord>): OrderRecord | undefined {
  const all = readAll()
  const idx = all.findIndex((o) => o._id === id)
  if (idx === -1) return undefined
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() }
  writeAll(all)
  return all[idx]
}
