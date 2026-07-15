import { Request, Response } from 'express'
import QRCode from 'qrcode'
import { Table } from '../models/Table'

const tableMenuUrl = (tableId: string, tableNumber: number, reservationId?: string) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const params = new URLSearchParams({ tableId, tableNumber: String(tableNumber) })
  if (reservationId) params.set('reservationId', reservationId)
  return `${baseUrl}/login?${params.toString()}`
}

export const checkInTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const table = await Table.findById(req.params.id)
    if (!table) {
      res.status(404).json({ error: 'Table not found' })
      return
    }
    if (table.status !== 'Available' && table.status !== 'Reserved') {
      res.status(409).json({ error: `Table ${table.tableNumber} is not available for check-in.` })
      return
    }
    table.status = 'Occupied'
    await table.save()
    res.status(200).json(table)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

export const createTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const table = await Table.create({ tableNumber: Number(req.body.tableNumber), capacity: Number(req.body.capacity), zone: req.body.zone || 'Dining Room' })
    res.status(201).json({ table, qrCode: { _id: `table-${table._id}`, tableId: table._id, tableNumber: table.tableNumber, qrToken: table._id.toString(), url: tableMenuUrl(table._id.toString(), table.tableNumber), createdAt: table.createdAt } })
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

    res.status(200).json(tables)
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

    const baseUrl =
      process.env.FRONTEND_URL || 'http://localhost:5173'

   
    const frontendMenuUrl = tableMenuUrl(tableId, table.tableNumber)

    const qrCodeImage =
      await QRCode.toDataURL(frontendMenuUrl)

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
