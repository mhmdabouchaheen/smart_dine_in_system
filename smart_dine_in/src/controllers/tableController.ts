import { Request, Response } from 'express'
import QRCode from 'qrcode'
import { Table } from '../models/Table'

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
    const tableId = req.params.id

    const table = await Table.findById(tableId)

    if (!table) {
      res.status(404).json({
        error: 'Table not found',
      })
      return
    }

    const baseUrl =
      process.env.FRONTEND_URL || 'http://localhost:5174'

    const frontendMenuUrl =
      `${baseUrl}/menu?tableId=${tableId}`

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