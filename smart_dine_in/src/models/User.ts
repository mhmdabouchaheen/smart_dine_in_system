import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string; // We will encrypt passwords before saving them
  role: 'Admin' | 'Manager' | 'Waiter' | 'Kitchen';
  isActive: boolean; // Easy way to disable accounts if an employee leaves
}

const UserSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Waiter', 'Kitchen'],
    default: 'Waiter'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

export const User = mongoose.model<IUser>('User', UserSchema);