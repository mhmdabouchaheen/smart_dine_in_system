import { Router } from 'express'

import {
  createNotification,
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController'
import { authMiddleware } from '../middlewares/authMiddleware'

const router = Router()

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