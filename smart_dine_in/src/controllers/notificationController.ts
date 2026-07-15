import { Request, Response } from 'express'
import { Types } from 'mongoose'

import {
  Notification,
  type INotification,
  type NotificationAccountModel,
  type NotificationRole,
  type NotificationType,
} from '../models/Notification'

import { User } from '../models/User'
import { Customer } from '../models/Customer'
import type { AuthRequest } from '../middlewares/authMiddleware'

const ALLOWED_ROLES: NotificationRole[] = [
  'Admin',
  'Waiter',
  'Customer',
]

const ALLOWED_TYPES: NotificationType[] = [
  'Order',
  'Reservation',
  'Assistance',
  'General',
  'Urgent',
]

function modelForRole(
  role: NotificationRole,
): NotificationAccountModel {
  return role === 'Customer'
    ? 'Customer'
    : 'User'
}

async function accountExists(
  id: string,
  model: NotificationAccountModel,
): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) {
    return false
  }

  if (model === 'Customer') {
    return Boolean(
      await Customer.exists({
        _id: id,
      }),
    )
  }

  return Boolean(
    await User.exists({
      _id: id,
    }),
  )
}

function userHasReadNotification(
  notification: INotification,
  userId: string,
): boolean {
  return notification.readBy.some(
    (receipt) =>
      String(receipt.userId) === userId,
  )
}

function canReceiveNotification(
  notification: INotification,
  userId: string,
  role: NotificationRole,
): boolean {
  if (notification.recipientRole !== role) {
    return false
  }

  if (!notification.recipientId) {
    return true
  }

  return (
    String(notification.recipientId) ===
    userId
  )
}

function formatNotification(
  notification: INotification,
  userId: string,
) {
  return {
    ...notification.toObject(),
    isRead: userHasReadNotification(
      notification,
      userId,
    ),
  }
}

// Public endpoint for guest submissions (no auth required).
export const createPublicNotification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { message, type = 'General', recipientRole, recipientId } = req.body

    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Notification message is required' })
      return
    }

    if (!ALLOWED_TYPES.includes(type as NotificationType)) {
      res.status(400).json({ error: 'Invalid notification type' })
      return
    }

    if (!ALLOWED_ROLES.includes(recipientRole as NotificationRole)) {
      res.status(400).json({ error: 'Invalid recipient role' })
      return
    }

    const notification = await Notification.create({
      message: message.trim(),
      type: type as NotificationType,
      // Use a generated ObjectId for guest sender (no real account).
      senderId: new Types.ObjectId(),
      senderModel: 'Customer',
      senderRole: 'Customer',
      recipientRole: recipientRole as NotificationRole,
      recipientId: recipientId ? new Types.ObjectId(recipientId) : undefined,
      recipientModel: recipientId ? 'Customer' : undefined,
      readBy: [],
    })

    const populated = await notification.populate('senderId', 'name email role')

    res.status(201).json({
      ...populated.toObject(),
      isRead: false,
    })
  } catch (error) {
    console.error('Failed to create public notification:', error)
    res.status(500).json({ error: 'Failed to create public notification' })
  }
}

export const getMyNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user
    const guestSessionId = req.headers['x-guest-session-id']

    if (!user && !guestSessionId) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    let userId: string
    let role: NotificationRole = 'Customer'

    if (user) {
      userId = user.id
      role = user.role as NotificationRole
    } else {
      const guestCustomer = await Customer.findOne({ guestSessionId })
      if (!guestCustomer) {
        res.status(200).json([])
        return
      }
      userId = guestCustomer._id.toString()
    }

    if (!Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        error: 'Invalid authenticated user ID',
      })
      return
    }

    const notifications =
      await Notification.find({
        recipientRole: role,
        $or: [
          {
            recipientId: {
              $exists: false,
            },
          },
          {
            recipientId: null,
          },
          {
            recipientId:
              new Types.ObjectId(userId),
          },
        ],
      })
        .populate(
          'senderId',
          'name email role',
        )
        .sort({
          createdAt: -1,
        })

    res.status(200).json(
      notifications.map((notification) =>
        formatNotification(
          notification,
          userId,
        ),
      ),
    )
  } catch (error) {
    console.error(
      'Failed to fetch notifications:',
      error,
    )

    res.status(500).json({
      error: 'Failed to fetch notifications',
    })
  }
}

export const createNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    const {
      message,
      type = 'General',
      recipientRole,
      recipientId,
    } = req.body

    if (
      typeof message !== 'string' ||
      !message.trim()
    ) {
      res.status(400).json({
        error: 'Notification message is required',
      })
      return
    }

    if (
      !ALLOWED_TYPES.includes(
        type as NotificationType,
      )
    ) {
      res.status(400).json({
        error: 'Invalid notification type',
      })
      return
    }

    if (
      !ALLOWED_ROLES.includes(
        recipientRole as NotificationRole,
      )
    ) {
      res.status(400).json({
        error: 'Invalid recipient role',
      })
      return
    }

    if (
      !Types.ObjectId.isValid(
        req.user.id,
      )
    ) {
      res.status(400).json({
        error: 'Invalid sender ID',
      })
      return
    }

    const senderRole = req.user.role

    const senderModel =
      modelForRole(senderRole)

    const recipientModel =
      modelForRole(
        recipientRole as NotificationRole,
      )

    if (recipientId) {
      if (
        typeof recipientId !== 'string'
      ) {
        res.status(400).json({
          error:
            'Recipient ID must be a string',
        })
        return
      }

      const exists = await accountExists(
        recipientId,
        recipientModel,
      )

      if (!exists) {
        res.status(404).json({
          error:
            'Recipient account not found',
        })
        return
      }
    }

    const notification =
      await Notification.create({
        message: message.trim(),
        type:
          type as NotificationType,
        senderId:
          new Types.ObjectId(
            req.user.id,
          ),
        senderModel,
        senderRole,
        recipientRole:
          recipientRole as NotificationRole,
        recipientId: recipientId
          ? new Types.ObjectId(
              recipientId,
            )
          : undefined,
        recipientModel:
          recipientId
            ? recipientModel
            : undefined,
        readBy: [],
      })

    const populated =
      await notification.populate(
        'senderId',
        'name email role',
      )

    res.status(201).json({
      ...populated.toObject(),
      isRead: false,
    })
  } catch (error) {
    console.error(
      'Failed to create notification:',
      error,
    )

    res.status(500).json({
      error: (error as Error).message,
    })
  }
}

export const markNotificationRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user
    const guestSessionId = req.headers['x-guest-session-id']

    if (!user && !guestSessionId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    let userId: string
    let role: NotificationRole = 'Customer'

    if (user) {
      userId = user.id
      role = user.role as NotificationRole
    } else {
      const guestCustomer = await Customer.findOne({ guestSessionId })
      if (!guestCustomer) {
        res.status(404).json({ error: 'Guest not found' })
        return
      }
      userId = guestCustomer._id.toString()
    }

    const id = req.params.id as string

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        error: 'Invalid notification ID',
      })
      return
    }

    const notification =
      await Notification.findById(id)

    if (!notification) {
      res.status(404).json({
        error: 'Notification not found',
      })
      return
    }

    if (
      !canReceiveNotification(
        notification,
        userId,
        role,
      )
    ) {
      res.status(403).json({
        error:
          'You cannot access this notification',
      })
      return
    }

    const alreadyRead =
      userHasReadNotification(
        notification,
        userId,
      )

    if (!alreadyRead) {
      notification.readBy.push({
        userId:
          new Types.ObjectId(
            userId,
          ),
        userModel:
          modelForRole(
            role,
          ),
        readAt: new Date(),
      })

      await notification.save()
    }

    res.status(200).json({
      ...notification.toObject(),
      isRead: true,
    })
  } catch (error) {
    console.error(
      'Failed to mark notification as read:',
      error,
    )

    res.status(500).json({
      error:
        'Failed to mark notification as read',
    })
  }
}

export const markAllNotificationsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user
    const guestSessionId = req.headers['x-guest-session-id']

    if (!user && !guestSessionId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    let userId: string
    let role: NotificationRole = 'Customer'

    if (user) {
      userId = user.id
      role = user.role as NotificationRole
    } else {
      const guestCustomer = await Customer.findOne({ guestSessionId })
      if (!guestCustomer) {
        res.status(200).json({ message: 'No notifications', modifiedCount: 0 })
        return
      }
      userId = guestCustomer._id.toString()
    }

    if (
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      res.status(400).json({
        error:
          'Invalid authenticated user ID',
      })
      return
    }

    const notifications =
      await Notification.find({
        recipientRole:
          role,
        $or: [
          {
            recipientId: {
              $exists: false,
            },
          },
          {
            recipientId: null,
          },
          {
            recipientId:
              new Types.ObjectId(
                userId,
              ),
          },
        ],
      })

    let modifiedCount = 0

    for (const notification of notifications) {
      const alreadyRead =
        userHasReadNotification(
          notification,
          userId,
        )

      if (alreadyRead) {
        continue
      }

      notification.readBy.push({
        userId:
          new Types.ObjectId(
            userId,
          ),
        userModel:
          modelForRole(
            role,
          ),
        readAt: new Date(),
      })

      await notification.save()

      modifiedCount += 1
    }

    res.status(200).json({
      message:
        'All notifications marked as read',
      modifiedCount,
    })
  } catch (error) {
    console.error(
      'Failed to mark all notifications as read:',
      error,
    )

    res.status(500).json({
      error:
        'Failed to mark all notifications as read',
    })
  }
}

export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user
    const guestSessionId = req.headers['x-guest-session-id']

    if (!user && !guestSessionId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    let userId: string
    let role: NotificationRole = 'Customer'

    if (user) {
      userId = user.id
      role = user.role as NotificationRole
    } else {
      const guestCustomer = await Customer.findOne({ guestSessionId })
      if (!guestCustomer) {
        res.status(404).json({ error: 'Guest not found' })
        return
      }
      userId = guestCustomer._id.toString()
    }

    const id = req.params.id as string

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({
        error:
          'Invalid notification ID',
      })
      return
    }

    const notification =
      await Notification.findById(id)

    if (!notification) {
      res.status(404).json({
        error:
          'Notification not found',
      })
      return
    }

    const isSender =
      String(notification.senderId) ===
      userId

    const isAdmin =
      role === 'Admin'

    if (!isSender && !isAdmin) {
      res.status(403).json({
        error:
          'Only the sender or an admin can delete this notification',
      })
      return
    }

    await notification.deleteOne()

    res.status(200).json({
      _id: notification._id,
      message:
        'Notification deleted successfully',
    })
  } catch (error) {
    console.error(
      'Failed to delete notification:',
      error,
    )

    res.status(500).json({
      error:
        'Failed to delete notification',
    })
  }
}