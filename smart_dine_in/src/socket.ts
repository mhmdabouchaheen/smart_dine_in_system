import { Server as HttpServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'

let io: SocketServer | null = null

/**
 * Initialize Socket.io on the existing HTTP server.
 * Call once from index.ts.
 */
export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ],
      credentials: true,
    },
  })

  io.on('connection', (socket: Socket) => {
    console.log(`[socket] client connected: ${socket.id}`)

    /**
     * Clients join rooms by role or tableId so we can target events precisely.
     *
     * Frontend usage:
     *   socket.emit('join', { role: 'Kitchen' })
     *   socket.emit('join', { tableId: 'abc123' })
     */
    socket.on('join', (data: { role?: string; tableId?: string }) => {
      if (data.role) {
        socket.join(`role:${data.role}`)
        console.log(`[socket] ${socket.id} joined room role:${data.role}`)
      }
      if (data.tableId) {
        socket.join(`table:${data.tableId}`)
        console.log(`[socket] ${socket.id} joined room table:${data.tableId}`)
      }
    })

    socket.on('leave', (data: { role?: string; tableId?: string }) => {
      if (data.role) socket.leave(`role:${data.role}`)
      if (data.tableId) socket.leave(`table:${data.tableId}`)
    })

    socket.on('disconnect', () => {
      console.log(`[socket] client disconnected: ${socket.id}`)
    })
  })

  return io
}

/** Returns the singleton io instance (throws if not initialized). */
export function getIo(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket() first.')
  return io
}

// ---------------------------------------------------------------------------
// Typed event emitters — call these from controllers after DB mutations
// ---------------------------------------------------------------------------

/** Emit to everyone in the Kitchen role room */
export function emitToKitchen(event: string, payload: unknown) {
  getIo().to('role:Kitchen').emit(event, payload)
}

/** Emit to everyone in the Waiter role room */
export function emitToWaiters(event: string, payload: unknown) {
  getIo().to('role:Waiter').emit(event, payload)
}

/** Emit to everyone in Admin + Manager role rooms */
export function emitToManagement(event: string, payload: unknown) {
  const io = getIo()
  io.to('role:Admin').to('role:Manager').emit(event, payload)
}

/** Emit to all clients subscribed to a specific table */
export function emitToTable(tableId: string, event: string, payload: unknown) {
  getIo().to(`table:${tableId}`).emit(event, payload)
}

/** Emit a notification to a specific role */
export function emitNotification(recipientRole: string, payload: unknown) {
  getIo().to(`role:${recipientRole}`).emit('notification:new', payload)
}
