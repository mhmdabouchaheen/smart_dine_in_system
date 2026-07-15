import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string; // We will encrypt passwords before saving them
  role: 'admin' | 'manager' | 'waiter' | 'kitchen';
  isActive: boolean; // Easy way to disable accounts if an employee leaves
  phone: string;
  salary: number; // Added salary field for employees
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
    enum: ['admin', 'manager', 'waiter', 'kitchen'],
    default: 'waiter' // Default role for new employees
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  phone: {
  type: String,
  required: true
},
 salary: {
    type: Number,
    default: 0
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

export const User = mongoose.model<IUser>('User', UserSchema);