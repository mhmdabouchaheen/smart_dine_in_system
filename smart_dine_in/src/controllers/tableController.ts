import { Request, Response } from 'express'
import QRCode from 'qrcode'
import { Table } from '../models/Table'
import { Order } from '../models/Order'
import { TableSession } from '../models/TableSession'
import { Types } from 'mongoose'

const tableMenuUrl = (tableId: string, tableNumber: number) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const params = new URLSearchParams({ tableId, tableNumber: String(tableNumber) })
  // QR scan goes DIRECTLY to menu — no login required
  return `${baseUrl}/menu?${params.toString()}`
}

export const checkInTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const table = await Table.findById(req.params.id)
    if (!table) {
      res.status(404).json({ error: 'Table not found' })
      return
    }
    if (table.status !== 'Available' && table.status !== 'Reserved' && table.status !== 'Occupied') {
      res.status(409).json({ error: `Table ${table.tableNumber} is currently ${table.status.toLowerCase()} and cannot accept new check-ins.` })
      return
    }

    table.status = 'Occupied'
    await table.save()

    // Only close previous sessions if the table was NOT already occupied, 
    // OR if we are explicitly starting a brand new party. 
    // For now, to allow multiple users to join the same table, we WON'T close active sessions
    // if the table is already occupied.
    if (table.status !== 'Occupied') {
      await TableSession.updateMany(
        { tableId: table._id, active: true },
        { active: false, endedAt: new Date() },
      )
    }

    // Determine session owner from request body
    const { customerId, guestSessionId } = req.body
    const session = await TableSession.create({
      tableId: table._id,
      customerId: customerId && Types.ObjectId.isValid(customerId)
        ? new Types.ObjectId(customerId)
        : undefined,
      guestSessionId: guestSessionId || undefined,
      active: true,
      startedAt: new Date(),
    })

    res.status(200).json({ table, session })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const createTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const table = await Table.create({
      tableNumber: Number(req.body.tableNumber),
      capacity: Number(req.body.capacity),
      zone: req.body.zone || 'Dining Room',
    })
    res.status(201).json({
      table,
      qrCode: {
        _id: `table-${table._id}`,
        tableId: table._id,
        tableNumber: table.tableNumber,
        qrToken: table._id.toString(),
        url: tableMenuUrl(table._id.toString(), table.tableNumber),
        createdAt: table.createdAt,
      },
    })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

export const getQRCodes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 })
    const codes = tables.map((table) => ({
      _id: `table-${table._id}`,
      tableId: table._id,
      tableNumber: table.tableNumber,
      qrToken: table._id.toString(),
      url: tableMenuUrl(table._id.toString(), table.tableNumber),
      createdAt: table.createdAt,
    }))
    res.status(200).json(codes)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const getTables = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 })
    const activeOrders = await Order.find({
      status: { $in: ['Pending', 'Preparing', 'Ready', 'Served'] },
    })
      .populate('items.menuItemId', 'preparationTime')
      .sort({ createdAt: -1 })
      .lean() as any[]

    const latestOrderByTable = new Map<string, any>()
    for (const order of activeOrders) {
      const key = String(order.tableId)
      if (!latestOrderByTable.has(key)) latestOrderByTable.set(key, order)
    }

    const now = Date.now()
    const result = tables.map((table) => {
      const order = latestOrderByTable.get(table._id.toString())
      if (!order) return table.toObject()

      const estimatedPrepMinutes = Math.max(
        1,
        ...order.items.map((item: any) => Number(item.menuItemId?.preparationTime || 10)),
      )
      const prepStartValue = order.preparationStartedAt || (order.status !== 'Pending' ? order.updatedAt : undefined)
      const prepStartedAt = prepStartValue ? new Date(prepStartValue).getTime() : now
      const readyAt = order.readyAt || (['Ready', 'Served'].includes(order.status) ? order.updatedAt : undefined)
      const prepEndedAt = readyAt ? new Date(readyAt).getTime() : now
      const prepElapsedMinutes = Math.max(0, Math.floor((prepEndedAt - prepStartedAt) / 60000))
      const statusPrepComplete = ['Ready', 'Served'].includes(order.status)
      const estimateReached = prepElapsedMinutes >= estimatedPrepMinutes
      const prepComplete = statusPrepComplete || estimateReached
      const prepRemainingMinutes = Math.max(0, estimatedPrepMinutes - prepElapsedMinutes)
      const prepProgress = prepComplete
        ? 100
        : Math.min(99, Math.round((prepElapsedMinutes / estimatedPrepMinutes) * 100))

      let serveProgress = 0
      let serveEta = 'Waiting for preparation'
      if (readyAt) {
        const serveEnd = order.servedAt ? new Date(order.servedAt).getTime() : now
        const serveMinutes = Math.max(0, Math.floor((serveEnd - new Date(readyAt).getTime()) / 60000))
        serveProgress = order.servedAt ? 100 : Math.min(95, serveMinutes * 20)
        serveEta = order.servedAt ? `Served after ${serveMinutes} min` : `Ready for ${serveMinutes} min`
      }

      const derivedStatus = order.status === 'Ready'
        ? 'in_the_pass'
        : order.status === 'Served'
          ? 'serving'
          : 'seated'

      return {
        ...table.toObject(),
        status: derivedStatus,
        currentOrder: {
          party: order.items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0),
          course: 1,
          courseName: order.status,
          seatedAt: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          prepProgress,
          prepEta: order.status === 'Pending'
            ? 'Waiting to start'
            : statusPrepComplete
            ? `Prepared in ${prepElapsedMinutes} min`
            : estimateReached
              ? 'Estimate reached · awaiting confirmation'
            : `${prepRemainingMinutes} min left of ${estimatedPrepMinutes}`,
          serveProgress,
          serveEta,
          note: order.note || undefined,
        },
      }
    })

    res.status(200).json(result)
  } catch (error) {
    console.error('❌ Error fetching tables:', error)

    res.status(500).json({
      error: 'Failed to fetch tables',
    })
  }
}

export const generateQRCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tableId = String(req.params.id)

    const table = await Table.findById(tableId)

    if (!table) {
      res.status(404).json({
        error: 'Table not found',
      })
      return
    }

    const frontendMenuUrl = tableMenuUrl(tableId, table.tableNumber)
    const qrCodeImage = await QRCode.toDataURL(frontendMenuUrl)

    res.status(200).json({
      message: 'QR Code generated successfully',
      tableId: table._id,
      url: frontendMenuUrl,
      qrCode: qrCodeImage,
    })
  } catch (error) {
    console.error('❌ Error generating QR Code:', error)

    res.status(500).json({
      error: 'Failed to generate QR code',
    })
  }
}

export const getFloorStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tables = await Table.find()
    const totalTables = tables.length
    const activeTables = tables.filter(t => t.status === 'Occupied' || t.status === 'Reserved').length
    const occupancyRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0
    
    // For now, return a static or simple calculation for avg turnover
    const avgTurnoverTime = 45 

    res.status(200).json({
      occupancyRate,
      avgTurnoverTime,
      activeTables,
      totalTables
    })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}
