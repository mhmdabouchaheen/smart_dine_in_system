import mongoose, { Document, Schema } from 'mongoose'

export type NotificationRole =
  | 'Admin'
  | 'Waiter'
  | 'Customer'
  | 'Kitchen'
  | 'Manager'

export type NotificationType =
  | 'Order'
  | 'Reservation'
  | 'Assistance'
  | 'General'
  | 'Urgent'

export type NotificationAccountModel =
  | 'User'
  | 'Customer'

interface IReadReceipt {
  userId: mongoose.Types.ObjectId
  userModel: NotificationAccountModel
  readAt: Date
}

export interface INotification extends Document {
  message: string
  type: NotificationType

  senderId: mongoose.Types.ObjectId
  senderModel: NotificationAccountModel
  senderRole: NotificationRole

  recipientRole: NotificationRole
  recipientId?: mongoose.Types.ObjectId
  recipientModel?: NotificationAccountModel

  readBy: IReadReceipt[]

  createdAt: Date
  updatedAt: Date
}

const ReadReceiptSchema = new Schema<IReadReceipt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    userModel: {
      type: String,
      enum: ['User', 'Customer'],
      required: true,
    },

    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
)

const NotificationSchema =
  new Schema<INotification>(
    {
      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
      },

      type: {
        type: String,
        enum: [
          'Order',
          'Reservation',
          'Assistance',
          'General',
          'Urgent',
        ],
        default: 'General',
      },

      senderId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel',
      },

      senderModel: {
        type: String,
        enum: ['User', 'Customer'],
        required: true,
      },

      senderRole: {
        type: String,
        enum: ['Admin', 'Waiter', 'Customer', 'Kitchen', 'Manager'],
        required: true,
      },

      recipientRole: {
        type: String,
        enum: ['Admin', 'Waiter', 'Customer', 'Kitchen', 'Manager'],
        required: true,
      },

      // When absent, the notification is sent to
      // everyone belonging to recipientRole.
      recipientId: {
        type: Schema.Types.ObjectId,
        refPath: 'recipientModel',
      },

      recipientModel: {
        type: String,
        enum: ['User', 'Customer'],
      },

      readBy: {
        type: [ReadReceiptSchema],
        default: [],
      },
    },
    {
      timestamps: true,
    },
  )

NotificationSchema.index({
  recipientRole: 1,
  recipientId: 1,
  createdAt: -1,
})

NotificationSchema.index({
  senderId: 1,
  createdAt: -1,
})

export const Notification =
  mongoose.model<INotification>(
    'Notification',
    NotificationSchema,
  )