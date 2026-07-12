import { Router } from 'express'
import {
  generateQRCode,
  getTables,
} from '../controllers/tableController'

const router = Router()

router.get('/', getTables)
router.get('/:id/qrcode', generateQRCode)

export default router