import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  message: string;
  type: 'FoodIssue' | 'GeneralNote' | 'Urgent';
  senderId: mongoose.Types.ObjectId; // The Manager who sent it
  targetRole: 'Waiter' | 'Kitchen' | 'All'; // Who should see this on their dashboard?
  isRead: boolean;
}

const NotificationSchema: Schema = new Schema({
  message: { 
    type: String, 
    required: true 
  },
  type: {
    type: String,
    enum: ['FoodIssue', 'GeneralNote', 'Urgent'],
    default: 'GeneralNote'
  },
  senderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', // Links to the Manager's account
    required: true 
  },
  targetRole: {
    type: String,
    enum: ['Waiter', 'Kitchen', 'All'],
    required: true
  },
  isRead: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);