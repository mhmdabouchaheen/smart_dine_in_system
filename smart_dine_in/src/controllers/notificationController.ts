import { Response } from 'express'
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

export const getMyNotifications = async (
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

    const userId = req.user.id
    const role = req.user.role

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
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
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
        req.user.id,
        req.user.role,
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
        req.user.id,
      )

    if (!alreadyRead) {
      notification.readBy.push({
        userId:
          new Types.ObjectId(
            req.user.id,
          ),
        userModel:
          modelForRole(
            req.user.role,
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
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
    }

    if (
      !Types.ObjectId.isValid(
        req.user.id,
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
          req.user.role,
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
                req.user.id,
              ),
          },
        ],
      })

    let modifiedCount = 0

    for (const notification of notifications) {
      const alreadyRead =
        userHasReadNotification(
          notification,
          req.user.id,
        )

      if (alreadyRead) {
        continue
      }

      notification.readBy.push({
        userId:
          new Types.ObjectId(
            req.user.id,
          ),
        userModel:
          modelForRole(
            req.user.role,
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
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
      })
      return
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
      req.user.id

    const isAdmin =
      req.user.role === 'Admin'

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