import { Router } from 'express'
import {
  generateQRCode,
  getTables,
  createTable,
  getQRCodes,
  checkInTable,
  getFloorStats,
} from '../controllers/tableController'

const router = Router()

router.get('/', getTables)
router.post('/', createTable)
router.get('/stats', getFloorStats)
router.get('/qr-codes', getQRCodes)
router.patch('/:id/check-in', checkInTable)
router.get('/:id/qrcode', generateQRCode)

export default router
