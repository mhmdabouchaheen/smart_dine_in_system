import { Router } from 'express'

import {
  createNotification,
  createPublicNotification,
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController'
import { authMiddleware } from '../middlewares/authMiddleware'

const router = Router()

// Public endpoint for unauthenticated (guest) submissions.
// Placed before auth middleware so guests may post without a JWT cookie.
router.post('/public', createPublicNotification)

router.use(authMiddleware)

router
  .route('/')
  .get(getMyNotifications)
  .post(createNotification)

router.put(
  '/read-all',
  markAllNotificationsRead,
)

router.put(
  '/:id/read',
  markNotificationRead,
)

router.delete(
  '/:id',
  deleteNotification,
)

export default router