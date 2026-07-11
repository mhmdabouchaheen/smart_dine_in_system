import express from 'express';
import { generateQRCode } from '../controllers/tableController';
// ... import your other controllers here

const router = express.Router();

// ... your existing routes (e.g., router.post('/', createTable); )

// Add this new route specifically for the QR code
router.get('/:id/qrcode', generateQRCode);

export default router;