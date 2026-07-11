import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { Table } from '../models/Table';
// ... (your existing table controllers like createTable, getTables, etc.) ...

export const generateQRCode = async (req: Request, res: Response): Promise<any> => {
  try {
    const tableId = req.params.id;

    // 1. Verify the table actually exists in the database
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    // 2. Construct the URL (we use an env variable for flexibility, defaulting to localhost:3000 for React)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const frontendMenuUrl = `${baseUrl}/menu?tableId=${tableId}`;

    // 3. Generate the QR code as a Base64 image string
    const qrCodeImage = await QRCode.toDataURL(frontendMenuUrl);

    // 4. Send the image string back to the client
    return res.status(200).json({
      message: "QR Code generated successfully",
      tableId: table._id,
      url: frontendMenuUrl,
      qrCode: qrCodeImage 
    });

  } catch (error) {
    console.error("❌ Error generating QR Code:", error);
    return res.status(500).json({ error: "Failed to generate QR code" });
  }
};