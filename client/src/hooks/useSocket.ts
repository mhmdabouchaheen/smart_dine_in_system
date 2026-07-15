import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

interface UseSocketOptions {
  role?: string
  tableId?: string
  onOrderCreated?: (order: any) => void
  onOrderUpdated?: (order: any) => void
  onOrderPaid?: (order: any) => void
  onNotification?: (notification: any) => void
  onTableStatusChanged?: (data: { tableId: string; status: string }) => void
}

export function useSocket({
  role,
  tableId,
  onOrderCreated,
  onOrderUpdated,
  onOrderPaid,
  onNotification,
  onTableStatusChanged,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      // Join relevant rooms
      socket.emit('join', { role, tableId })
    })

    // Register event listeners
    if (onOrderCreated) socket.on('order:created', onOrderCreated)
    if (onOrderUpdated) socket.on('order:status_updated', onOrderUpdated)
    if (onOrderPaid) socket.on('order:paid', onOrderPaid)
    if (onNotification) socket.on('notification:new', onNotification)
    if (onTableStatusChanged) socket.on('table:status_changed', onTableStatusChanged)

    return () => {
      socket.emit('leave', { role, tableId })
      socket.disconnect()
    }
  }, [role, tableId, onOrderCreated, onOrderUpdated, onOrderPaid, onNotification, onTableStatusChanged])

  return socketRef.current
}
