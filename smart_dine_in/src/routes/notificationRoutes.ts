import { Router } from 'express'
import { validate } from '../middlewares/validate'
import { CreateNotificationSchema } from '../schemas'

import {
  createNotification,
  createPublicNotification,
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController'
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware'

const router = Router()

// Public endpoint for unauthenticated (guest) submissions.
// Placed before auth middleware so guests may post without a JWT cookie.
router.post('/public', validate(CreateNotificationSchema), createPublicNotification)

router
  .route('/')
  .get(optionalAuthMiddleware, getMyNotifications)
  .post(authMiddleware, validate(CreateNotificationSchema), createNotification)

router.use(authMiddleware)

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